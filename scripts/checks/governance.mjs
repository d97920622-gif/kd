// path: scripts/checks/governance.mjs
/**
 * check:governance -- the files that govern the repository, not the code in it.
 *
 * Sub-step 1.31 delivers seven artefacts that no page and no module depends on:
 * the CI workflow, the review ownership file, the pull request template, the
 * contributing guide, the security policy, the changelog and the licence. They
 * are exactly the kind of file that rots, because nothing fails when they stop
 * being true: a workflow that no longer runs the gate still runs, a template
 * that lost a field still renders, and a licence that contradicts
 * `package.json` is read by nobody.
 *
 * So this check treats them as code and cross-reads them:
 *
 *   1. **The gate is one gate.** The workflow must run `npm run verify`, must
 *      not name a single check script of its own, and must run the build and
 *      the server through the package scripts. A workflow that lists tools
 *      directly is a second definition of "the build", and it drifts from
 *      `package.json` on the first quiet commit.
 *   2. **The workflow is a security boundary.** It triggers on pull requests,
 *      which means its `run:` scripts are reachable by a contributor. So: no
 *      secret is interpolated anywhere in the file, no expression is written
 *      inside a `run:` body (a value goes through `env:` instead), no
 *      `pull_request_target`, no write permission, and no `continue-on-error`
 *      or `|| true` that would let a failing gate report success.
 *   3. **The numbers are read, not repeated.** The Node major in the workflow
 *      is compared with the `engines` field, every environment key the
 *      workflow sets is compared with the schema in `lib/env/validate-env.ts`,
 *      and the repository owner in `CODEOWNERS` is compared with the account
 *      in `package.json`. Each of those pairs can only disagree in one
 *      direction: the file was updated and the other copy was not.
 *   4. **The changelog is the history.** Every entry must end in a commit, and
 *      every commit recorded in a completed row of the handoff tables must
 *      appear as an entry. A changelog that stops at the previous sub-step
 *      fails here rather than at the next release.
 *   5. **The policy files are honest.** `SECURITY.md` may not print an address
 *      the repository cannot verify (any address at all is refused) and may not
 *      promise a response window, which is a commitment the deployment makes
 *      and this file cannot know. The licence may not be an open-source licence
 *      the plan does not grant, and the manifest may not disagree with it.
 *   6. **The records keep their promises.** Every decision record carries its
 *      metadata, its five sections and the name of a check script that would
 *      fail if the record stopped being true; a record that says it was
 *      superseded agrees with the record that replaced it; and the index, the
 *      README and the runner agree with each other about what exists. The
 *      README is the front door, so a script the manifest defines and the
 *      README does not document, or a Node major that the engine and the README
 *      disagree about, is a finding rather than a surprise.
 *
 * What this check cannot prove is that the workflow runs, that the review
 * requirement is switched on or that the private advisory channel is open.
 * Those are facts about GitHub, and `docs/EVIDENCE/step-01/governance-probe.py`
 * reads them from the platform and records them as gate evidence.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { listTrackedFiles, reportResult, REPO_ROOT } from './_lib.mjs';

const CHECK = 'governance';
const CI_WORKFLOW = '.github/workflows/ci.yml';
const CODEOWNERS = '.github/CODEOWNERS';
const PULL_REQUEST_TEMPLATE = '.github/pull_request_template.md';
const CONTRIBUTING = 'CONTRIBUTING.md';
const SECURITY = 'SECURITY.md';
const CHANGELOG = 'CHANGELOG.md';
const LICENSE = 'LICENSE';
const CHANGELOG_SCRIPT = 'scripts/changelog.mjs';
const PACKAGE_MANIFEST = 'package.json';
const ENV_MODULE = 'lib/env/validate-env.ts';
const BRAND_STRINGS = 'lib/i18n/strings/en/brand.ts';
const PROGRESS = 'docs/handoffs/CHAT_01_PROGRESS.md';
const VERIFY_RUNNER = 'scripts/verify.mjs';
const GATES_DOC = 'docs/PLAN/04_DEFINITION_OF_DONE_AND_GATES.md';
const GIT_WORKFLOW_DOC = 'docs/PLAN/07_BRANCH_AND_GIT_WORKFLOW.md';
const README = 'README.md';
const ADR_DIRECTORY = 'docs/ADR';
const ADR_INDEX = 'docs/ADR/README.md';
const ADR_NUMBERS = ['0001', '0002', '0003', '0004', '0005', '0006', '0007'];
const ADR_STATUSES = ['Proposed', 'Accepted', 'Superseded', 'Deprecated'];
const ADR_METADATA = ['Status', 'Date', 'Step', 'Supersedes', 'Superseded by'];
const ADR_SECTIONS = [
  'Context',
  'Decision',
  'Consequences',
  'Alternatives considered',
  'Verification',
];

/** The CI jobs that must exist, with what each one is for. */
const REQUIRED_JOBS = [
  { name: 'verify', reason: 'the aggregate verification floor' },
  { name: 'database', reason: 'the migrations applied, reverted and applied again' },
  { name: 'build', reason: 'the production build and the probes against it' },
  { name: 'ci', reason: 'the single status check branch protection names' },
];

/** The nine fields the plan requires in every pull request body. */
const PULL_REQUEST_FIELDS = [
  'step number',
  'sub-steps included',
  'files added',
  'files extended with reason',
  'migrations with up and down paths',
  'environment variables added',
  'verification output summary',
  'gates table',
  'handoff',
];

/** Surfaces whose review is worth a rule of its own. */
const REVIEW_REQUIRED_PATHS = [
  '/.github/',
  '/middleware.ts',
  '/lib/security/',
  '/lib/env/',
  '/config/security-headers.ts',
  '/docs/PLAN/',
];

/** Sections the changelog generator may emit. */
const CHANGELOG_SECTIONS = ['Added', 'Changed', 'Fixed', 'Security', 'Documentation', 'Other'];

const BANNED_LICENCE_NAMES = ['MIT License', 'Apache License', 'GNU General Public License', 'BSD'];

const findings = [];

function finding(file, message) {
  findings.push({ file, line: 1, column: 1, message });
}

function read(file) {
  try {
    return readFileSync(join(REPO_ROOT, file), 'utf8');
  } catch {
    return null;
  }
}

function requireFile(file, message) {
  const text = read(file);
  if (text === null) {
    finding(file, message);
  }
  return text;
}

function requireText(file, text, needle, message) {
  if (text !== null && !text.includes(needle)) {
    finding(file, message);
  }
}

function refuseText(file, text, needle, message) {
  if (text !== null && text.includes(needle)) {
    finding(file, message);
  }
}

/**
 * Drop YAML comments.
 *
 * Every rule about the workflow is a rule about what it does, and a comment
 * that mentions a command is not a command. Line structure is preserved so a
 * run body can still be read as a block. A `#` only starts a comment at the
 * beginning of a line or after whitespace, and never inside a quoted scalar;
 * that is the whole of the YAML rule this repository's workflow needs.
 */
function stripYamlComments(text) {
  return text
    .split('\n')
    .map((line) => {
      let inSingle = false;
      let inDouble = false;
      for (let index = 0; index < line.length; index += 1) {
        const character = line[index];
        if (character === "'" && !inDouble) {
          inSingle = !inSingle;
        } else if (character === '"' && !inSingle) {
          inDouble = !inDouble;
        } else if (character === '#' && !inSingle && !inDouble) {
          const previous = index === 0 ? ' ' : line[index - 1];
          if (/\s/.test(previous)) {
            return line.slice(0, index);
          }
        }
      }
      return line;
    })
    .join('\n');
}

/**
 * Every `run:` body: the inline form and the block form under `run: |`.
 *
 * `run: |` is not a command that happens to be called a pipe, it is the
 * indicator that the body is the indented block below it. A scan that treats it
 * as an inline command checks one character and never reads the script, which
 * is how the first version of this rule passed a `run:` block with an event
 * field inside it. `|`, `>`, and their strip and keep variants are all the
 * block form.
 */
const BLOCK_INDICATOR = /^[|>][-+]?\d*$/;

function runBodies(lines) {
  const bodies = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = /^(\s*)run:\s*(.*)$/.exec(lines[index]);
    if (match === null) {
      continue;
    }
    const [, indent, inline] = match;
    if (inline.trim().length > 0 && !BLOCK_INDICATOR.test(inline.trim())) {
      bodies.push({ line: index + 1, text: inline });
      continue;
    }
    const bodyIndent = indent.length;
    const collected = [];
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const candidate = lines[cursor];
      const trimmed = candidate.trim();
      if (trimmed.length === 0) {
        collected.push('');
        continue;
      }
      const candidateIndent = candidate.length - candidate.trimStart().length;
      if (candidateIndent <= bodyIndent) {
        break;
      }
      collected.push(trimmed);
    }
    bodies.push({ line: index + 1, text: collected.join('\n') });
  }
  return bodies;
}

/** The body of one top level job, from its key to the next key at that level. */
function jobBody(lines, name) {
  const start = lines.findIndex((line) => line === `  ${name}:`);
  if (start === -1) {
    return null;
  }
  const body = [];
  for (let cursor = start + 1; cursor < lines.length; cursor += 1) {
    if (/^ {2}\S/.test(lines[cursor]) && !/^ {2}-/.test(lines[cursor])) {
      break;
    }
    body.push(lines[cursor]);
  }
  return body;
}

// ---------------------------------------------------------------------------
// 1. The manifest and the package scripts every rule below is compared with
// ---------------------------------------------------------------------------

const manifestText = requireFile(PACKAGE_MANIFEST, 'package.json is missing');
let manifest = null;
if (manifestText !== null) {
  try {
    manifest = JSON.parse(manifestText);
  } catch {
    finding(PACKAGE_MANIFEST, 'package.json does not parse, so no rule can be cross-read');
  }
}
const packageScripts = manifest === null ? {} : (manifest.scripts ?? {});
const enginesMajor = (() => {
  const range = manifest === null ? '' : (manifest.engines?.node ?? '');
  const match = /(\d+)\.\d+\.\d+/.exec(range);
  return match === null ? null : Number(match[1]);
})();

// ---------------------------------------------------------------------------
// 2. The CI workflow
// ---------------------------------------------------------------------------

const workflowRaw = requireFile(CI_WORKFLOW, 'the CI workflow is missing');
const workflow = workflowRaw === null ? null : stripYamlComments(workflowRaw);
const workflowLines = workflow === null ? [] : workflow.split('\n');

if (workflow !== null) {
  const workflowName = /^name:\s*(\S+)/m.exec(workflow)?.[1] ?? '';
  if (workflowName !== 'ci') {
    finding(CI_WORKFLOW, `the workflow must be named ci, not "${workflowName}"`);
  }

  for (const trigger of ['push:', 'pull_request:', 'workflow_dispatch:']) {
    requireText(
      CI_WORKFLOW,
      workflow,
      trigger,
      `the workflow must declare ${trigger.slice(0, -1)}, or the gate runs on nothing`,
    );
  }
  for (const branch of ['integration', 'main', "'arena/**'"]) {
    requireText(
      CI_WORKFLOW,
      workflow,
      branch,
      `the workflow does not name the ${branch} branch filter`,
    );
  }

  requireText(
    CI_WORKFLOW,
    workflow,
    'contents: read',
    'the workflow must declare read-only permissions',
  );
  refuseText(
    CI_WORKFLOW,
    workflow,
    ': write',
    'a gate needs no write permission; a token that can write is a token a compromised step can use',
  );
  refuseText(
    CI_WORKFLOW,
    workflow,
    'pull_request_target',
    'pull_request_target runs with the base repository token on a fork pull request and is refused',
  );
  refuseText(
    CI_WORKFLOW,
    workflow,
    '${{ secrets.',
    'this workflow needs no secret; credentials belong to the deploy workflow of step 16.3',
  );
  refuseText(
    CI_WORKFLOW,
    workflow,
    'continue-on-error',
    'a gate that continues on error reports success for a run that failed',
  );
  refuseText(CI_WORKFLOW, workflow, '|| true', 'a shell line that cannot fail is not a check');
  requireText(
    CI_WORKFLOW,
    workflow,
    'cancel-in-progress: true',
    'the workflow must cancel the older run of a branch that was pushed twice',
  );
  requireText(
    CI_WORKFLOW,
    workflow,
    'concurrency:',
    'the workflow must declare a concurrency group',
  );

  for (const body of runBodies(workflowLines)) {
    if (body.text.includes('${{')) {
      finding(
        CI_WORKFLOW,
        `the run body at line ${String(body.line)} contains an expression; an event field is contributor-controlled text and belongs in env:, never in a script`,
      );
    }
  }

  for (const job of REQUIRED_JOBS) {
    const body = jobBody(workflowLines, job.name);
    if (body === null) {
      finding(CI_WORKFLOW, `the ${job.name} job is missing (${job.reason})`);
      continue;
    }
    if (body.every((line) => line.trim().length === 0)) {
      finding(CI_WORKFLOW, `the ${job.name} job is empty`);
    }
  }

  const aggregate = jobBody(workflowLines, 'ci');
  if (aggregate !== null) {
    const requires = aggregate.join('\n');
    for (const job of ['verify', 'build']) {
      if (!requires.includes(`- ${job}`)) {
        finding(
          CI_WORKFLOW,
          `the aggregate ci job must depend on ${job}, or a failing job cannot hold the required check red`,
        );
      }
    }
    if (!requires.includes('needs:')) {
      finding(CI_WORKFLOW, 'the aggregate ci job must declare needs:');
    }
  }

  const timeoutCount = workflowLines.filter((line) => /^\s+timeout-minutes:/.test(line)).length;
  if (timeoutCount < REQUIRED_JOBS.length) {
    finding(
      CI_WORKFLOW,
      `every job needs a timeout (found ${String(timeoutCount)} for ${String(REQUIRED_JOBS.length)} jobs); a job that can hang holds the runner until the platform's own limit`,
    );
  }

  const nodeVersions = [...workflow.matchAll(/node-version:\s*'?"?(\d+)/g)].map((match) =>
    Number(match[1]),
  );
  if (nodeVersions.length === 0) {
    finding(CI_WORKFLOW, 'the workflow does not pin a Node.js version');
  }
  for (const major of nodeVersions) {
    if (enginesMajor !== null && major !== enginesMajor) {
      finding(
        CI_WORKFLOW,
        `the workflow runs Node.js ${String(major)} while package.json requires ${String(enginesMajor)}; the two must agree`,
      );
    }
  }

  for (const script of ['verify', 'build', 'start']) {
    requireText(
      CI_WORKFLOW,
      workflow,
      `npm run ${script}`,
      `the workflow must run npm run ${script}; the package script is the definition of that step`,
    );
  }
  requireText(CI_WORKFLOW, workflow, 'npm ci', 'the workflow must install with npm ci');
  refuseText(
    CI_WORKFLOW,
    workflow,
    'npm install',
    'the workflow must never run npm install: it resolves the ranges in package.json and ignores the lockfile that made the run reproducible',
  );
  refuseText(
    CI_WORKFLOW,
    workflow,
    'npx next',
    'the workflow must reach Next.js through npm run build and npm run start, never around them',
  );
  refuseText(
    CI_WORKFLOW,
    workflow,
    'scripts/checks/',
    'the workflow runs the aggregate floor; naming individual checks here is how CI drifts from npm run verify',
  );

  for (const artifact of [
    '.next/BUILD_ID',
    '.next/server/app/robots.txt.body',
    '.next/server/app/sitemap.xml.body',
  ]) {
    requireText(
      CI_WORKFLOW,
      workflow,
      artifact,
      `the build job must assert that ${artifact} is in the output`,
    );
  }
  requireText(
    CI_WORKFLOW,
    workflow,
    'dynamicIO',
    'the build job must fail when the build warns about a deprecated configuration',
  );
  for (const probe of ['platform-probe.py', 'http-hardening-probe.py']) {
    requireText(CI_WORKFLOW, workflow, probe, `the build job must run ${probe} against the build`);
  }
  requireText(
    CI_WORKFLOW,
    workflow,
    '--environment production',
    'the probes must be run against the production policy, not the development one',
  );
  if (/npm run start/.test(workflow) && !/for attempt in \$\(seq 1 \d+\)/.test(workflow)) {
    finding(
      CI_WORKFLOW,
      'the job starts a server without a bounded readiness loop; a fixed sleep is a race on a slow runner',
    );
  }
  if (!/curl -sf/.test(workflow)) {
    finding(CI_WORKFLOW, 'the readiness loop must poll the server with curl, not assume it is up');
  }

  const declaredKeys = new Set(
    [
      ...(
        /export const ENV_SOURCE_KEYS[^=]*=\s*\[([\s\S]*?)\]/.exec(read(ENV_MODULE) ?? '')?.[1] ??
        ''
      ).matchAll(/'([A-Z0-9_]+)'/g),
    ].map((match) => match[1]),
  );
  const workflowKeys = new Set(
    [...workflow.matchAll(/^\s+([A-Z][A-Z0-9_]*):/gm)]
      .map((match) => match[1])
      .filter((key) =>
        /^(NODE_ENV|LOG_LEVEL|NEXT_PUBLIC_[A-Z0-9_]+|SUPABASE_[A-Z0-9_]+)$/.test(key),
      ),
  );
  if (declaredKeys.size === 0) {
    finding(ENV_MODULE, 'the environment module declares no source key to compare with');
  }
  for (const key of workflowKeys) {
    if (!declaredKeys.has(key)) {
      finding(
        CI_WORKFLOW,
        `the workflow sets ${key}, which lib/env/validate-env.ts does not declare; an undeclared variable is one the schema never validates`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 3. Review ownership
// ---------------------------------------------------------------------------

const codeowners = requireFile(CODEOWNERS, 'the review ownership file is missing');
if (codeowners !== null) {
  const lines = codeowners.split('\n');
  if (lines[0].trim() !== `# path: ${CODEOWNERS}`) {
    finding(CODEOWNERS, `the first line must be "# path: ${CODEOWNERS}"`);
  }
  const rules = lines.filter((line) => line.trim().length > 0 && !line.trim().startsWith('#'));
  if (rules.length === 0) {
    finding(CODEOWNERS, 'the file has no rule, so no review is required of anything');
  }
  const handles = new Set();
  for (const rule of rules) {
    const owners = [...rule.matchAll(/@([A-Za-z0-9-]+)/g)].map((match) => match[1]);
    if (owners.length === 0) {
      finding(CODEOWNERS, `the rule "${rule.trim()}" names no owner, so it requires nothing`);
    }
    for (const owner of owners) {
      handles.add(owner);
    }
  }
  const repositoryOwner = (() => {
    const url = manifest === null ? '' : (manifest.repository?.url ?? '');
    const match = /github\.com[/:]([^/]+)\//.exec(url);
    return match === null ? null : match[1];
  })();
  if (repositoryOwner === null) {
    finding(
      PACKAGE_MANIFEST,
      'package.json does not name the repository, so the owner cannot be checked',
    );
  } else {
    if (handles.size !== 1 || !handles.has(repositoryOwner)) {
      finding(
        CODEOWNERS,
        `the file must name exactly the repository owner ${repositoryOwner} and no other handle (found ${[...handles].join(', ') || 'none'})`,
      );
    }
  }
  if (rules.length > 0 && !/^\*\s+@/.test(rules[0].trim())) {
    finding(
      CODEOWNERS,
      'the first rule must be the default rule for every path; the last matching pattern wins, so a narrow rule in first place is a rule the default overrides',
    );
  }
  for (const path of REVIEW_REQUIRED_PATHS) {
    if (!rules.some((rule) => rule.trim().startsWith(path))) {
      finding(CODEOWNERS, `the sensitive surface ${path} has no review rule`);
    }
  }
}

// ---------------------------------------------------------------------------
// 4. The pull request template
// ---------------------------------------------------------------------------

const template = requireFile(PULL_REQUEST_TEMPLATE, 'the pull request template is missing');
if (template !== null) {
  if (!template.startsWith(`// path: ${PULL_REQUEST_TEMPLATE}`)) {
    finding(PULL_REQUEST_TEMPLATE, `the first line must be "// path: ${PULL_REQUEST_TEMPLATE}"`);
  }
  const lowercased = template.toLowerCase();
  for (const field of PULL_REQUEST_FIELDS) {
    if (!lowercased.includes(field)) {
      finding(
        PULL_REQUEST_TEMPLATE,
        `the template does not ask for "${field}", which docs/PLAN/07 requires of every pull request body`,
      );
    }
  }
  for (const doc of [GATES_DOC, GIT_WORKFLOW_DOC]) {
    requireText(
      PULL_REQUEST_TEMPLATE,
      template,
      doc,
      `the template must point at ${doc}, where the field list and the gates come from`,
    );
  }
  const boxes = template.split('\n').filter((line) => /^\s*- \[/.test(line));
  if (boxes.length < 5) {
    finding(
      PULL_REQUEST_TEMPLATE,
      `the template has ${String(boxes.length)} checkbox(es); a template without a checklist is a form nobody has to fill`,
    );
  }
  const ticked = boxes.filter((line) => /^\s*- \[[xX]\]/.test(line));
  if (ticked.length > 0) {
    finding(
      PULL_REQUEST_TEMPLATE,
      `the template ships ${String(ticked.length)} pre-ticked box(es); a claim nobody made is not a review`,
    );
  }
}

// ---------------------------------------------------------------------------
// 5. The contributing guide
// ---------------------------------------------------------------------------

const contributing = requireFile(CONTRIBUTING, 'the contributing guide is missing');
if (contributing !== null) {
  if (!contributing.startsWith(`// path: ${CONTRIBUTING}`)) {
    finding(CONTRIBUTING, `the first line must be "// path: ${CONTRIBUTING}"`);
  }
  const required = [
    [
      `requires ${String(enginesMajor)} or newer`,
      'the guide must state the Node.js version the engines field requires; the two must agree',
    ],
    ['Node.js', 'the guide must name the runtime a contributor needs'],
    ['npm ci', 'the guide must install the way CI installs'],
    ['npm run verify', 'the guide must name the gate'],
    ['(step-NN/S.S)', 'the guide must state the commit format of docs/PLAN/07 section 3'],
    ['integration', 'the guide must name the mainline branch'],
    ['arena/', 'the guide must name the session branch prefix'],
    ['English', 'the guide must state the language rule'],
    ['ASCII', 'the guide must state the ASCII rule'],
    ['USD', 'the guide must state the currency rule'],
    ['decimal.js', 'the guide must state how money is computed'],
    ['Rule 4', 'the guide must state the no-test-files rule'],
    ['Zod', 'the guide must state the validation rule'],
    ['path:', 'the guide must state the path comment rule'],
    ['SECURITY.md', 'the guide must point a security report at the policy'],
    ['LICENSE', 'the guide must point at the licence'],
    [GATES_DOC, 'the guide must point at the definition of done'],
    [GIT_WORKFLOW_DOC, 'the guide must point at the branch and commit workflow'],
  ];
  for (const [needle, message] of required) {
    requireText(CONTRIBUTING, contributing, needle, message);
  }
  for (const match of contributing.matchAll(/npm run ([a-z][a-z0-9:-]*)/g)) {
    const script = match[1];
    if (!(script in packageScripts)) {
      finding(
        CONTRIBUTING,
        `the guide tells a developer to run npm run ${script}, which package.json does not define`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 6. The security policy
// ---------------------------------------------------------------------------

const security = requireFile(SECURITY, 'the security policy is missing');
if (security !== null) {
  if (!security.startsWith(`// path: ${SECURITY}`)) {
    finding(SECURITY, `the first line must be "// path: ${SECURITY}"`);
  }
  requireText(
    SECURITY,
    security,
    'Report a vulnerability',
    'the policy must name the private reporting channel GitHub provides',
  );
  requireText(
    SECURITY,
    security,
    'Do not open a public issue',
    'the policy must refuse public disclosure before a fix',
  );
  requireText(SECURITY, security, 'Safe harbour', 'the policy must state its safe harbour');
  requireText(
    SECURITY,
    security,
    'ADR-0006',
    'the policy must point at the hardening baseline ADR',
  );
  requireText(
    SECURITY,
    security,
    'Never include',
    'the policy must say what never belongs in a report',
  );
  const repositoryUrl = manifest === null ? '' : (manifest.repository?.url ?? '');
  const slug = /github\.com[/:]([^/]+\/[^/]+?)(?:\.git)?$/.exec(repositoryUrl);
  if (slug === null) {
    finding(
      PACKAGE_MANIFEST,
      'package.json does not name the repository, so the channel cannot be checked',
    );
  } else {
    requireText(
      SECURITY,
      security,
      `https://github.com/${slug[1]}/security/advisories/new`,
      'the private advisory form must be the one on the repository package.json names',
    );
  }
  const version = manifest === null ? '' : (manifest.version ?? '');
  const line = /^(\d+)\.(\d+)\./.exec(version);
  if (line !== null) {
    requireText(
      SECURITY,
      security,
      `${line[1]}.${line[2]}.`,
      `the supported version line must be the one package.json declares (${version})`,
    );
  }
  const address = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.exec(security);
  if (address !== null) {
    finding(
      SECURITY,
      'the policy prints an address the repository cannot verify; a private advisory form needs no address and an invented one is never read',
    );
  }
  const window = /\b\d+\s*(?:hours?|days?|weeks?)\b/i.exec(security);
  if (window !== null) {
    finding(
      SECURITY,
      'the policy promises a response window; a response time is a commitment the deployment makes and keeps, and the repository prints the process instead',
    );
  }
}

// ---------------------------------------------------------------------------
// 7. The licence, and the manifest that must agree with it
// ---------------------------------------------------------------------------

const licence = requireFile(LICENSE, 'the licence is missing');
if (licence !== null) {
  const brand = /name:\s*'([^']+)'/.exec(read(BRAND_STRINGS) ?? '')?.[1] ?? null;
  requireText(LICENSE, licence, 'All rights reserved', 'the licence must reserve every right');
  requireText(
    LICENSE,
    licence,
    'proprietary',
    'the licence must be the proprietary licence the plan declares',
  );
  if (brand === null) {
    finding(
      BRAND_STRINGS,
      'the brand strings do not declare a name, so the licence cannot be compared with it',
    );
  } else {
    if (!licence.includes(brand)) {
      finding(
        LICENSE,
        `the licence does not name the owner as the brand strings declare it (${brand})`,
      );
    }
    if (!new RegExp(`Copyright \\(c\\) \\d{4} ${brand}\\.`).test(licence)) {
      finding(
        LICENSE,
        `the licence must carry a "Copyright (c) <year> ${brand}." line, the same sentence the site footer prints`,
      );
    }
  }
  for (const banned of BANNED_LICENCE_NAMES) {
    if (new RegExp(`\\b${banned}\\b`, 'i').test(licence)) {
      finding(
        LICENSE,
        `the licence names ${banned}; the plan declares a proprietary licence and this repository grants no open-source terms`,
      );
    }
  }
  if (manifest !== null) {
    if (manifest.license !== 'UNLICENSED') {
      finding(
        PACKAGE_MANIFEST,
        `package.json declares the licence as ${String(manifest.license)} while LICENSE is proprietary; npm's marker for that is UNLICENSED`,
      );
    }
    if (manifest.private !== true) {
      finding(
        PACKAGE_MANIFEST,
        'package.json must stay private: a proprietary platform that npm may publish is one setting away from being published',
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 8. The changelog, the generator and the commits they must cover
// ---------------------------------------------------------------------------

const changelog = requireFile(CHANGELOG, 'the changelog is missing');
if (changelog !== null) {
  const lines = changelog.split('\n');
  if (lines[0].trim() !== `// path: ${CHANGELOG}`) {
    finding(CHANGELOG, `the first line must be "// path: ${CHANGELOG}"`);
  }
  requireText(CHANGELOG, changelog, '# Changelog', 'the changelog must carry a title');
  requireText(
    CHANGELOG,
    changelog,
    '## Unreleased',
    'the changelog must have an Unreleased section',
  );
  requireText(
    CHANGELOG,
    changelog,
    'npm run changelog',
    'the changelog must say which command generates it, so nobody edits it by hand',
  );
  const headings = lines
    .filter((line) => line.startsWith('### '))
    .map((line) => line.slice(4).trim());
  for (const heading of headings) {
    if (!CHANGELOG_SECTIONS.includes(heading)) {
      finding(CHANGELOG, `the section "${heading}" is not one the generator emits`);
    }
  }
  for (const section of ['Added', 'Documentation']) {
    if (!headings.includes(section)) {
      finding(
        CHANGELOG,
        `no ${section} section was generated, and this history has commits of that type`,
      );
    }
  }
  const entries = lines.filter((line) => line.startsWith('- '));
  if (entries.length === 0) {
    finding(CHANGELOG, 'the changelog has no entry; a generated file with no entries is a header');
  }
  for (const entry of entries) {
    if (!/\(([^()]*, )?[0-9a-f]{7}\)$/.test(entry)) {
      finding(
        CHANGELOG,
        `the entry "${entry.slice(0, 48)}" does not end in the commit that caused it; this file is generated from the history and an entry without a commit is prose`,
      );
    }
  }
  const script = requireFile(CHANGELOG_SCRIPT, 'the changelog generator is missing');
  if (script !== null) {
    for (const needle of ["execFileSync('git'", "'log'"]) {
      requireText(
        CHANGELOG_SCRIPT,
        script,
        needle,
        'the generator must read the commit history, which is the only source a changelog can trust',
      );
    }
  }
  if (!('changelog' in packageScripts)) {
    finding(PACKAGE_MANIFEST, 'package.json does not define the changelog script');
  }

  const progress = requireFile(
    PROGRESS,
    'the handoff file is missing, so coverage cannot be checked',
  );
  if (progress !== null) {
    const recorded = new Set();
    for (const line of progress.split('\n')) {
      const cells = line
        .split('|')
        .slice(1, -1)
        .map((cell) => cell.trim());
      if (!cells.includes('done')) {
        continue;
      }
      for (const cell of cells) {
        if (/^[0-9a-f]{7}$/.test(cell)) {
          recorded.add(cell);
        }
      }
    }
    if (recorded.size === 0) {
      finding(PROGRESS, 'no completed sub-step records a commit, so nothing can be cross-read');
    }
    for (const sha of recorded) {
      if (!changelog.includes(`, ${sha})`)) {
        finding(
          CHANGELOG,
          `the commit ${sha} of a completed sub-step has no changelog entry; run npm run changelog at the handoff`,
        );
      }
    }
    const verifyRunner = read(VERIFY_RUNNER) ?? '';
    if (!verifyRunner.includes('scripts/checks/governance.mjs')) {
      finding(
        VERIFY_RUNNER,
        'check:governance is not registered in the verify runner, so the governance files are checked by nobody',
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 9. The decision records, and the README that opens the repository
// ---------------------------------------------------------------------------

function fieldValue(source, label) {
  const match = new RegExp(`^- ${label}: (.+)$`, 'm').exec(source);
  return match === null ? null : match[1].trim();
}

function referencedNumbers(value) {
  return [...value.matchAll(/ADR-(\d{4})/g)].map((match) => match[1]);
}

const adrFiles = (() => {
  try {
    return readdirSync(join(REPO_ROOT, ADR_DIRECTORY))
      .filter((entry) => /^ADR-\d{4}-.+\.md$/.test(entry))
      .sort();
  } catch {
    return [];
  }
})();

const records = new Map();
for (const number of ADR_NUMBERS) {
  const matches = adrFiles.filter((entry) => entry.startsWith(`ADR-${number}-`));
  if (matches.length !== 1) {
    finding(
      ADR_DIRECTORY,
      `expected exactly one ADR-${number} record, found ${String(matches.length)}; the set the plan asks for is 0001 to 0007`,
    );
    continue;
  }
  const file = `${ADR_DIRECTORY}/${matches[0]}`;
  const text = requireFile(file, `ADR-${number} is listed in the directory but cannot be read`);
  if (text === null) {
    continue;
  }
  records.set(number, { file, text });
  if (!text.startsWith(`// path: ${file}`)) {
    finding(file, `the first line must be "// path: ${file}"`);
  }
  const heading = text.split('\n').find((line) => line.startsWith(`# ADR-${number} -- `));
  if (heading === undefined || heading.trimEnd().length === `# ADR-${number} -- `.length) {
    finding(file, `the heading must be "# ADR-${number} -- <title>"`);
  }
  for (const label of ADR_METADATA) {
    if (fieldValue(text, label) === null) {
      finding(file, `the metadata block must carry "- ${label}: ..."`);
    }
  }
  const status = fieldValue(text, 'Status');
  if (status !== null && !ADR_STATUSES.includes(status)) {
    finding(file, `the status must be one of ${ADR_STATUSES.join(', ')}`);
  }
  if (!/^- Date: \d{4}-\d{2}-\d{2}$/m.test(text)) {
    finding(file, 'the date must be written as YYYY-MM-DD');
  }
  let previous = -1;
  for (const section of ADR_SECTIONS) {
    const at = text.indexOf(`\n## ${section}\n`);
    if (at === -1) {
      finding(file, `the record must carry the section "## ${section}"`);
      continue;
    }
    if (at < previous) {
      finding(file, `the section "## ${section}" is out of order`);
    }
    previous = at;
  }
  const named = [...text.matchAll(/check:[a-z0-9-]+/g)].map((match) => match[0]);
  if (!named.some((candidate) => candidate in packageScripts)) {
    finding(
      file,
      'the record names no check script of this repository, so nothing would fail if the decision stopped being true',
    );
  }
}

for (const [number, record] of records) {
  const supersedes = fieldValue(record.text, 'Supersedes');
  const supersededBy = fieldValue(record.text, 'Superseded by');
  if (supersedes === null || supersededBy === null) {
    continue;
  }
  const forward = referencedNumbers(supersedes);
  const backward = referencedNumbers(supersededBy);
  if (supersedes !== 'none' && forward.length === 0) {
    finding(record.file, 'the supersedes field must name a record by its number, or say none');
  }
  if (supersededBy !== 'none' && backward.length === 0) {
    finding(record.file, 'the superseded-by field must name a record by its number, or say none');
  }
  for (const target of forward) {
    const other = records.get(target);
    if (other === undefined) {
      finding(record.file, `the record supersedes ADR-${target}, which is not in the set`);
      continue;
    }
    if (!(fieldValue(other.text, 'Superseded by') ?? '').includes(`ADR-${number}`)) {
      finding(record.file, `ADR-${target} does not record that ADR-${number} superseded it`);
    }
  }
  for (const target of backward) {
    const other = records.get(target);
    if (other === undefined) {
      finding(record.file, `the record is superseded by ADR-${target}, which is not in the set`);
      continue;
    }
    if (!(fieldValue(other.text, 'Supersedes') ?? '').includes(`ADR-${number}`)) {
      finding(record.file, `ADR-${target} does not record that it superseded ADR-${number}`);
    }
  }
  if (backward.length > 0 && fieldValue(record.text, 'Status') !== 'Superseded') {
    finding(record.file, 'a record that was replaced must say superseded in its status');
  }
  if (backward.length === 0 && fieldValue(record.text, 'Status') === 'Superseded') {
    finding(record.file, 'a record with a superseded status must name the record that replaced it');
  }
}

const index = requireFile(ADR_INDEX, 'the decision record index is missing');
if (index !== null) {
  if (!index.startsWith(`// path: ${ADR_INDEX}`)) {
    finding(ADR_INDEX, `the first line must be "// path: ${ADR_INDEX}"`);
  }
  for (const number of ADR_NUMBERS) {
    if (!index.includes(`ADR-${number}`)) {
      finding(ADR_INDEX, `the index does not list ADR-${number}`);
    }
  }
  for (const record of records.values()) {
    if (!index.includes(record.file.slice(ADR_DIRECTORY.length + 1))) {
      finding(ADR_INDEX, `the index does not name the record ${record.file}`);
    }
  }
}

const entriesBlock = /const ENTRIES = \[([\s\S]*?)\n\];/.exec(read(VERIFY_RUNNER) ?? '')?.[1] ?? '';
const runnerEntries = [...entriesBlock.matchAll(/name: '([^']+)'/g)].map((match) => match[1]);

const readme = requireFile(README, 'the README is missing');
if (readme !== null) {
  if (!readme.startsWith(`// path: ${README}`)) {
    finding(README, `the first line must be "// path: ${README}"`);
  }
  if (enginesMajor !== null) {
    if (!readme.includes(`Node.js ${String(enginesMajor)}`)) {
      finding(
        README,
        `the README must state the Node.js major the engines field requires (${String(enginesMajor)})`,
      );
    }
    const stated = new Set([...readme.matchAll(/Node(?:\.js)? (\d+)/g)].map((match) => match[1]));
    for (const major of stated) {
      if (major !== String(enginesMajor)) {
        finding(
          README,
          `the README says Node ${major} while package.json requires ${String(enginesMajor)}; the engines field is the authority and two versions in one document are one too many`,
        );
      }
    }
  }
  requireText(README, readme, 'npm ci', 'the README must install from the lockfile with npm ci');
  const fromScratch = readme.split('\n').findIndex((line) => line.trim() === 'npm install');
  if (fromScratch !== -1) {
    finding(
      README,
      'the README tells a reader to run npm install from scratch; the reproducible command is npm ci and the line that says otherwise is read by everyone',
    );
  }
  for (const script of Object.keys(packageScripts)) {
    if (script === 'prepare') {
      continue;
    }
    if (!readme.includes(`npm run ${script}`) && !readme.includes(`npm ${script}`)) {
      finding(
        README,
        `the README does not document the "${script}" script, so the gate section drifts from the manifest`,
      );
    }
  }
  for (const entry of runnerEntries) {
    if (!(entry in packageScripts)) {
      finding(
        VERIFY_RUNNER,
        `the runner runs ${entry} but package.json has no script for it, so no reader can run that entry by name`,
      );
    }
  }
  if (runnerEntries.length === 0) {
    finding(
      VERIFY_RUNNER,
      'the runner declares no entries, so the count in the README cannot be read',
    );
  } else {
    if (!readme.includes(`${String(runnerEntries.length)} entries`)) {
      finding(
        README,
        `the README must state how many entries the floor runs (${String(runnerEntries.length)})`,
      );
    }
    for (const entry of runnerEntries) {
      if (!readme.includes(`npm run ${entry}`)) {
        finding(README, `the README does not document the ${entry} entry of the floor`);
      }
    }
  }
  for (const pointer of [ADR_INDEX, CONTRIBUTING, SECURITY, CHANGELOG]) {
    if (!readme.includes(pointer)) {
      finding(README, `the README does not point at ${pointer}`);
    }
  }
}

// ---------------------------------------------------------------------------
// 10. The files are tracked, and nothing else was smuggled in
// ---------------------------------------------------------------------------

const tracked = new Set(listTrackedFiles());
for (const file of [
  CI_WORKFLOW,
  CODEOWNERS,
  PULL_REQUEST_TEMPLATE,
  CONTRIBUTING,
  SECURITY,
  CHANGELOG,
  LICENSE,
  CHANGELOG_SCRIPT,
  README,
  ADR_INDEX,
  ...[...records.values()].map((record) => record.file),
]) {
  if (!tracked.has(file)) {
    finding(
      file,
      'the file exists on disk but is not tracked, so CI and a fresh clone cannot see it',
    );
  }
}

reportResult(
  CHECK,
  findings,
  `the ten governance artefacts verified (${String(REQUIRED_JOBS.length)} CI jobs, Node.js ${String(enginesMajor)} pinned by both the workflow and engines, ${String(REVIEW_REQUIRED_PATHS.length)} surfaces under named review, ${String(PULL_REQUEST_FIELDS.length)} pull request fields, ${String(ADR_NUMBERS.length)} architecture decision records, the proprietary licence and the manifest agreeing, the changelog carrying every recorded sub-step commit)`,
);
process.exitCode = findings.length === 0 ? 0 : 1;
