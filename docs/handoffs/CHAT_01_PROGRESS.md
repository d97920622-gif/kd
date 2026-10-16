// path: docs/handoffs/CHAT_01_PROGRESS.md

# CHAT 01 PROGRESS -- Step 1: Foundation, Governance, Design System, Layout Architecture

Status: in progress
Current segment: 1D (states, hardening, public site, governance) -- all nine sub-steps complete, segment gate next
Last completed sub-step: 1.32 (governance B: the seven decision records and their index, the README
refresh, the step 1 handoff, and the check rules that keep them honest).
Previous sub-step: 1.31 (governance A: the CI workflow and the three jobs it runs, review ownership, the pull request template, the contributing guide, the security policy, the licence and the generated changelog).
Next sub-step: none in step 1 (1.32 is the last one); the segment 1D gate runs next, on the owner's word.
Segment 1A: complete
Segment 1B: complete (gate evidence in docs/EVIDENCE/step-01/gate-1B.md)
Segment 1C: complete (1.18 to 1.23 done; gate PASSED 2026-10-16, evidence in docs/EVIDENCE/step-01/gate-1C.md)
Segment 1D: sub-steps complete (1.24 to 1.32 done; segment gate next)
Date started: 2026-10-15
Branch: arena/b7780282-kd

Segment model: this step runs as four segments (1A to 1D), one segment per
chat, per docs/PLAN/10_SEGMENT_GUIDE.md. A chat executes exactly one segment
and stops at the segment gate.

## SEGMENT 1A -- Toolchain and quality gates (chat 1 of 4)

| Sub-step | Description                                                                                                                    | Status | Commit  |
| -------- | ------------------------------------------------------------------------------------------------------------------------------ | ------ | ------- |
| 1.1      | Repository toolchain baseline: package.json, tsconfig.json, next.config.js, .prettierrc, .gitignore, husky hooks, lint-staged  | done   | 57947a7 |
| 1.2      | ESLint configuration: no-explicit-any error, no-console error, non-ASCII restricted syntax, import order, React and Next rules | done   | 8317d34 |
| 1.3      | Tailwind and token pipeline: tailwind.config.ts, PostCSS, components.json, CSS layer structure                                 | done   | b154ba3 |
| 1.4      | Environment schema validation: lib/env/validate-env.ts, boot-time fail fast, typed access, .env.example                        | done   | a88f8b7 |
| 1.5      | Check scripts A: english-only, no-todo, no-coming-soon, no-tests, path-comment                                                 | done   | e25ddac |
| 1.6      | Check scripts B: no-console, forbidden-brands, migration-pairs, dead-links, secrets, any-types, money-math                     | done   | 98951cf |
| 1.7      | Verify runner: npm run verify, report format, pre-commit and commit-msg wiring, CI-ready exit codes                            | done   | 98ac273 |

Progress file created in 82a6ff5.

Segment 1A gate: every check script runs on the current tree without false
positives; all scripts documented in README.md. Status: PASSING.

Gate evidence (recorded in full in CHAT_01_COMPLETED.md section 7):

- npm run verify: RESULT PASS (16 of 16 checks passed), exit code 0.
- All twelve npm run check:* scripts exit 0 with a PASS summary line.
- All four mandated .sh wrappers run and exit 0.
- README.md documents all 23 npm scripts.
- Every check was proved to fail on a deliberate violation before the
  violation was removed (negative probes for all twelve checks).
- Pre-commit hook rejected a staged violation with exit code 1 (no commit
  created); commit-msg hook rejected an over-long subject line.

## SEGMENT 1B -- Core libraries and design system (chat 2 of 4)

| Sub-step | Description                                                                                                                                      | Status | Commit             |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ------------------ |
| 1.8      | Structured logger: JSON lines, levels, correlation id, redaction hook, zero console usage                                                        | done   | to fill at handoff |
| 1.9      | Error library: typed error classes, error codes, response envelope builder, no detail leakage                                                    | done   | to fill at handoff |
| 1.10     | USD money utilities: decimal.js wrappers, parse, format, arithmetic, rounding policy, money-math guard                                           | done   | to fill at handoff |
| 1.11     | Utility set: date (UTC), formatting, slug, hash (SHA-256, HMAC), id helpers                                                                      | done   | to fill at handoff |
| 1.12     | i18n string catalogue: lib/i18n/strings/en.ts structure, key naming, copy rules                                                                  | done   | to fill at handoff |
| 1.13     | Design tokens A: spacing 4/8/12/16/24/32/48/64, radius scale, shadow scale, z-index scale                                                        | done   | 2f25ca8            |
| 1.14     | Design tokens B: typography scale, color palette with contrast pairs, dark mode, high contrast, reduced motion, motion tokens, token JSON export | done   | 6eb05dd            |
| 1.15     | shadcn/ui primitives A: button, input, textarea, label, checkbox, radio group, select, switch                                                    | done   | cdba8d2            |
| 1.16     | shadcn/ui primitives B: dialog, sheet, popover, dropdown, tabs, tooltip, toast, table, skeleton, badge                                           | done   | b5bb363            |
| 1.17     | Form primitives: React Hook Form with Zod resolver, four states, aria-live errors, submit states                                                 | done   | a976d75            |

Segment 1B gate: component gallery renders every primitive in light, dark,
high contrast and reduced motion; no hardcoded color or spacing outside
tokens. Status: PASSED on 2026-10-16 (evidence in
docs/EVIDENCE/step-01/gate-1B.md, commit 2cd305d).

## SEGMENT 1C -- Brand, layout, navigation (chat 3 of 4)

| Sub-step | Description                                                                                                                  | Status | Commit  |
| -------- | ---------------------------------------------------------------------------------------------------------------------------- | ------ | ------- |
| 1.18     | Brand assets: logo variants, favicon pack 16/32/180/192/512, apple touch icon, PWA icons, OG image, brand voice guide        | done   | b8511e6 |
| 1.19     | Layout shells: public and auth layouts with skip links, focus order, print base                                              | done   | e95c963 |
| 1.20     | Layout shells: dashboard, admin and client portal layouts with role-aware framing                                            | done   | 2e3c0aa |
| 1.21     | Layout components: sidebar, topbar, mobile drawer, bottom navigation, breadcrumbs, footer, offline banner, sticky action bar | done   | 5411c93 |
| 1.22     | Navigation source: config/nav-map.ts with reserved growth blocks, role filter hook, breadcrumb generator, dead-link wiring   | done   | 37c481b |
| 1.23     | Command palette and keyboard shortcuts page with focus management and ARIA labels                                            | done   | d048e01 |

Segment 1C gate: navigation renders correctly for every role; the dead-link check
passes on the current route set. Status: PASSED (2026-10-16). Evidence in
docs/EVIDENCE/step-01/gate-1C.md: 6 roles framed by the shell the role model
calls for, 12 reader rows rendering what the map offers each one, 9 navigation
surfaces measured in the response with 0 findings, 37 planned labels absent from
every navigation landmark, an empty navigation rendering no landmark at all, and
3 routes / 3 verified links / 0 dynamic links in the dead-link audit.

Segment 1C gate: navigation renders correctly for every role; dead-link check
passes on the current route set. Status: pending.

## SEGMENT 1D -- States, hardening, public site, governance (chat 4 of 4)

| Sub-step | Description                                                                                                                                    | Status | Commit  |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------- |
| 1.24     | Page-state system: skeleton library, error boundary with retry, empty state with CTA, success state, 320px utilities, accessibility primitives | done   | 4c9f2a2 |
| 1.25     | Motion and media: Framer Motion providers, page transitions, stagger, confetti, illustration baseline, reduced-motion handling                 | done   | dcd6b0f |
| 1.26     | Web hardening primitives: Trusted Types, COOP, COEP, CORP, Permissions-Policy, Clear-Site-Data, SRI baseline, header matrix, ADR-0006          | done   | fb97830 |
| 1.27     | Usability primitives: use-saved-views, use-undo, use-autosave, optimistic update helpers, explainability message and strings                   | done   | 535c54e |
| 1.28     | Public site pages A: homepage, features, pricing, about with real English copy and metadata                                                    | done   | 8c75f2b |
| 1.29     | Public site pages B: contact, industries, calculators, free invoice generator shell, terms, privacy, blog shell, 404, 500, offline             | done   | 260a23b |
| 1.30     | Platform plumbing: middleware.ts, instrumentation.ts, CSP nonce baseline, sitemap and robots baseline, metadata baseline, print stylesheet     | done   | 0afc679 |
| 1.31     | Governance A: CI workflow, CODEOWNERS, pull request template, CONTRIBUTING, SECURITY, CHANGELOG, LICENSE                                       | done   | 9654866 |
| 1.32     | Governance B: ADR-0001 to ADR-0007, README update, docs/handoffs/CHAT_01_COMPLETED.md                                                          | done   | 4dfa2b0 |

Segment 1D gate: production build passes; Lighthouse at least 90 on the
homepage; dead-link audit clean; npm run verify fully green. Status: pending.

## Sub-step 1.32 evidence -- the decision records, the README and the last sub-step of step 1

1.32 is "Governance B: ADR-0001 to ADR-0007, README update,
`docs/handoffs/CHAT_01_COMPLETED.md`", and it closes the sub-step list of
segment 1D. Three things were delivered, and one defect was found on the way.

**The decision records exist and they are checkable.** `docs/ADR/` held one file
before this sub-step (ADR-0006, written by 1.26). Six records were added beside
it and an index lists all seven. Each record carries the metadata block, the five
sections in order and the name of a check script that would fail if the record
stopped being true, which is the difference between a decision that is written
down and a decision that is still enforced:

| Record | What it decides                                                                                                                                                                         | Checks it names                                              |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 0001   | Next.js 15, React 19, TypeScript 5.9 strict, Tailwind 3.4 with the config-file pipeline, ESLint 8 in eslintrc mode, Node 22 with npm ci, one aggregate gate                             | check:any-types, check:english-only                          |
| 0002   | English only, with `FEATURE_LIST.md` as the one named exemption, enforced by two independent scanners and printed in every verify run                                                   | check:english-only, check:i18n-strings                       |
| 0003   | Copy lives in the catalogue and every visual value lives in the token module; the four themes and the claim floor depend on both                                                        | check:design-tokens, check:color-contrast, check:public-site |
| 0004   | One environment schema, fail-fast boot with value-free messages, the build-phase exception named, the two server-only keys refused outside `lib/env`                                    | check:platform-plumbing, check:secrets                       |
| 0005   | A route group is an audience, the shells take role data as props, the nav map is the single destination source, and the document is dynamic for the nonce with three file routes static | check:layout-shells, check:nav-map, check:platform-plumbing  |
| 0007   | The build model: one sub-step per commit, the floor as the only definition of done, gates crossed on the owner's word, a handoff for every chat                                         | check:governance                                             |

**The README is refreshed against the repository, not against memory.** Four
statements were wrong or missing and every one of them is now part of the gate:
the Node line said 20 or newer while `engines` requires 22 and CI pins major 22;
the setup told a reader to run `npm install` while the lockfile and CI use
`npm ci`; the gate paragraph said "all twelve rule checks" while the floor runs
30 entries; and ten scripts were undocumented, including the checks added since
1.24. The documentation list now names the ADR index, CONTRIBUTING, SECURITY,
CHANGELOG and `.github/`, and the branch policy names the review ownership file
and the pull request template.

**Two rule groups were added to `check:governance`, one per new artefact, and
the second one found a real defect.**

| Rule group       | What it reads                                               | What it refuses                                                                                                                                                                                                                                                                                                                                                              |
| ---------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Decision records | The `docs/ADR/` listing, every record, `docs/ADR/README.md` | A missing record of the set, two records for one number, a record without its path comment, heading, metadata or one of the five sections, sections out of order, a record that names no live check, a supersession only one side records, a status that disagrees with the supersession fields, and an index that stops naming a record                                     |
| README           | `README.md`, `package.json`, `scripts/verify.mjs`           | A Node major other than the one `engines` declares, an `npm install` line instead of `npm ci`, a script in the manifest with no row in the README, an entry of the floor with no row in the README, a floor count that does not match the runner, a missing pointer to the ADR index, CONTRIBUTING, SECURITY or CHANGELOG, and a runner entry with no script in the manifest |

The last rule is the one that paid: `check:layout-shells` and
`check:color-contrast` were registered in the verification runner and documented
in the README, but neither had a script in `package.json`, so neither could be
run by name. Both aliases were added in this sub-step (`package.json` goes from
38 to 40 scripts). It is the same class of drift the governance check exists to
catch: nothing failed while the two entries ran, because the floor calls them by
path and only `npm run <name>` needs the manifest.

**The step 1 handoff is rewritten as the closing record.**
`docs/handoffs/CHAT_01_COMPLETED.md` now covers all four segments: the sub-steps
with their commits and evidence commits, the files created and extended, the
database and environment changes, the verification evidence, the decisions with
their ADR, the known risks and the starting point for step 2. Its tables keep the
SEGMENT shape, so the changelog coverage rule in `check:governance` reads it as
well as the SEGMENT tables in this file and fails when a recorded commit has no
changelog entry.

### Verification for this sub-step

| Check                                                       | Result                                                                                                                                                                                            |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run verify`                                            | PASS, 30 of 30 entries (`/tmp/verify-132a.txt`), including the extended `check:governance`                                                                                                        |
| Controls for the new rules                                  | 22 controls, 1 renamed record, 1 duplicated record and 5 immunities, 0 failures (`/tmp/controls-132-final.txt`)                                                                                   |
| Controls for the earlier rules, re-run on the changed check | The 1.31 harness: 49 controls and 6 immunities, 0 failures. The 1.30 harness: 49 controls and 5 immunities, 0 failures                                                                            |
| Prettier                                                    | `docs/ADR/*.md`, `README.md`, `CHAT_01_COMPLETED.md` and `governance.mjs` formatted; `format:check` PASS                                                                                          |
| Commit                                                      | `4dfa2b0` (10 files: six records, the index, the README, `package.json` and the check)                                                                                                            |
| Changelog                                                   | Regenerated in the docs commit that carries this section, so `4dfa2b0` has an entry and the coverage rule passes                                                                                  |
| Continuous integration                                      | The push of this sub-step runs the same three jobs (`verify`, `build`, `ci`); the workflow is unchanged since 1.31, and the run for this commit is watched before the segment 1D gate is recorded |

## Sub-step 1.31 evidence -- the gate, the reviewers, the policies and the generated changelog

1.31 is "Governance A: CI workflow, CODEOWNERS, pull request template,
CONTRIBUTING, SECURITY, CHANGELOG, LICENSE". Two commits: code and this progress
file, plus a regenerated `CHANGELOG.md` in the second one, because the changelog
is generated from the history and the first commit is part of that history. The
acceptance anchors are docs/PLAN/08 line 89 (the sub-step line), FEATURE_LIST
item 3511 for the CI pipeline with 3515 for the hooks it joins (both in place
since sub-step 1.7), 3502 for the dead-link scan that now runs on the runner
through `check:dead-links`, 3516 to 3519 for the four documents, 3528 to 3530 for
the rules the documents state (a path comment per file, one commit per sub-step,
conventional commits), MASTER_PROMPT line 6 for the proprietary licence, lines
260 to 266 for the `.github` layout (workflows, CODEOWNERS, pull request
template), line 646 for `LICENSE`, and docs/PLAN/07 sections 2 to 4 for the branch
model, the required checks and the pull request field list. FEATURE_LIST 3512 to
3514 (preview deploy, production deploy, rollback script) are deployment work and
belong to step 16 with the rest of CI/CD; they are named as deferred below rather
than half-built here.

### What landed, artefact by artefact

| Artefact                                    | What it decides                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.github/workflows/ci.yml`                  | Three jobs on every push to a session branch and every pull request into `integration` or `main`: `verify` runs `npm run verify`, the same floor the pre-commit hook runs; `build` compiles the production bundle, asserts that the output still carries `BUILD_ID`, `robots.txt`, `sitemap.xml` and the social image, fails when the build warns about a deprecated configuration, then serves that build and reads it with the two probes; `ci` depends on both and exists so branch protection has one status check to name. |
| `.github/CODEOWNERS`                        | Review ownership, with the default rule first because the last matching pattern wins: the repository owner as the only handle in the file, and named rules for the gate itself, the request layer and the header matrix, the security primitives, the environment schema, the specification corpus and the handoffs.                                                                                                                                                                                                            |
| `.github/pull_request_template.md`          | The nine fields docs/PLAN/07 requires of every pull request body, each with the reason it is asked for, the gates table pointer to docs/PLAN/04, and an eleven line checklist with nothing pre-ticked.                                                                                                                                                                                                                                                                                                                          |
| `CONTRIBUTING.md`                           | The reading order, the prerequisites (Node.js 22, the version `engines` and the workflow both pin), the setup (`npm ci`, `.env` from the template), the command table, the commit convention, the branch model, what every file must satisfy, how a new check is added, and the definition of done. It names the check scripts as the definition of the rules it summarises, rather than restating their word lists.                                                                                                            |
| `SECURITY.md`                               | The supported version line, the private reporting channel, what a report must contain, what must never be in one, the process that follows, the in-scope and out-of-scope lists, the safe harbour statement, and the hardening baseline already in the tree. It prints no address and no response window, for the reason the contact page gives.                                                                                                                                                                                |
| `CHANGELOG.md` (generated)                  | Every commit of this branch as an entry, grouped by the commit type that introduced it, newest first, each ending in the scope and the short commit. Regenerated by `npm run changelog` at every handoff.                                                                                                                                                                                                                                                                                                                       |
| `scripts/changelog.mjs`                     | The generator: reads `git log`, maps `feat` to Added, `refactor`/`perf`/`chore`/`style`/`build` to Changed, `fix` to Fixed, `security` to Security, `docs` to Documentation and anything else to Other. A subject that does not parse is grouped under Other rather than dropped.                                                                                                                                                                                                                                               |
| `LICENSE`                                   | The proprietary licence the plan declares: all rights reserved, no licence granted, permitted use limited to the owner's own deployments, third-party components under their own licences, no warranty, termination on breach. The copyright sentence is the one the site footer prints.                                                                                                                                                                                                                                        |
| `scripts/checks/governance.mjs`             | The new 30th check: the workflow's name, triggers, permissions, timeouts, concurrency, Node major, package-script usage, artefact assertions, probe invocations and readiness loop, with no secret, no expression in a run body, no `pull_request_target`, no write permission, no `continue-on-error` and no `                                                                                                                                                                                                                 |     | true`; CODEOWNERS shape, single owner and sensitive paths; the nine template fields and no pre-ticked box; the guide's rules and its command table against `package.json`; the policy's channel, prohibitions and absent address; the licence against the manifest; and the changelog's entries against every commit a completed handoff row records. |
| `docs/EVIDENCE/step-01/governance-probe.py` | The runtime half: the registered workflow list, the newest run on the branch, GitHub's own parse of CODEOWNERS, the private advisory setting, and the inventory of what landed.                                                                                                                                                                                                                                                                                                                                                 |

### Decisions this sub-step turns on

1. **CI runs the same gate as a developer, through the package scripts.** The
   workflow calls `npm run verify`, `npm run build` and `npm run start`, and the
   check refuses a workflow that names a single check script of its own or calls
   `npx next` directly. A CI job that lists tools is a second definition of the
   build, and the two copies drift on the first quiet commit; the manifest is the
   only definition, and the runner reads it.
2. **The workflow is a security boundary, because a pull request can reach it.**
   No secret is interpolated anywhere in the file, no `${{ }}` expression is
   written inside a `run:` body (a value the script needs goes through `env:`,
   because an event field is contributor-controlled text), `pull_request_target`
   is refused, permissions are `contents: read`, and `continue-on-error` and
   `|| true` are refused because a gate that cannot fail is not a gate. The
   probes run against credentials that are not valid anywhere rather than
   against stored ones.
3. **`NODE_ENV` is set on the serving step, not on the job.** A job-wide
   `NODE_ENV=production` makes `npm ci` install production dependencies only,
   and the build then fails on a missing compiler. The server still boots in the
   production environment, because the validation, the policy and the headers it
   exercises are the ones a deployment gets.
4. **The check cross-reads instead of repeating.** The Node major in the
   workflow is compared with `engines`, every environment key the workflow sets
   is compared with the schema in `lib/env/validate-env.ts`, the owner in
   CODEOWNERS is compared with the account in `package.json`, the licence is
   compared with the manifest, and every commit a completed handoff row records
   must appear as a changelog entry. Each pair can only disagree in one
   direction: one copy was updated and the other was not.
5. **The changelog is the history, not a summary of it.** Every entry ends in
   the commit that caused it, entries are grouped by the type the commit
   convention already requires, and the coverage rule fails the gate when a
   sub-step closes without a regeneration. The generator runs at the handoff,
   which is why this sub-step's second commit carries the regenerated file.
6. **The governance documents may not print facts they cannot evidence.** The
   security policy sends a reporter to GitHub's private advisory form on this
   repository, which the probe confirms is open, and prints the process rather
   than a response window; the supported line is the version `package.json`
   declares; the licence restates the copyright sentence the site prints. An
   address, a telephone number or a response time is a commitment the owner
   makes, not a sentence a repository is free to choose.
7. **The controls found two real defects in the check, before the commit.** The
   `run:` scanner read `run: |` as an inline command, so the block it introduces
   was never scanned and a control that put an event field inside a script body
   passed; the workflow-name rule was satisfied by the job that happens to share
   the name, so renaming the workflow changed nothing. Both are fixed, the name
   rule now reads the top-level key, and the install rule refuses `npm install`
   outright instead of looking for a single `npm ci`.
8. **`engines` now requires Node 22.** The workflow pins major 22, the sandbox
   runs 22.22.3 and `@types/node` is 22, while the manifest still allowed 20. The
   check keeps the two numbers equal, so the next move of either one is a
   finding rather than a discovery on a runner. The README still says Node 20:
   it is corrected in sub-step 1.32, which owns the README.

### Evidence

- **The verification floor**: `npm run verify` exit 0, `RESULT: PASS (30 of 30
checks passed)`. The 30th entry is `check:governance`
  (`/tmp/verify-131-final.txt`). Every other check stayed green, including
  `check:english-only` (326 text files, one documented exemption),
  `check:no-tests`, `check:path-comment` (311 source files) and
  `check:secrets` (326 text files).
- **The controls**: 49 mutations and 6 immunities, 0 failures
  (`/tmp/controls-131-final.txt`). Each control mutates one governance file,
  requires its specific finding, then restores the file and proves the restore
  by SHA-256. The immunities are the false-positive floor: a comment may name
  `npx next build`, `scripts/checks/` and `${{ secrets.TOKEN }}`; a comment may
  name a second handle; the guide may name a check without the runner; the
  changelog may carry prose; and the policy may discuss a response window
  without printing one.
- **The build job, simulated locally before the push**: a fresh copy of the tree
  built with the workflow's own environment (exit 0, `/tmp/ci-build-sim.log`),
  the four build artefacts present, zero `dynamicIO` warnings, then
  `npm run start -- -p 3020` served and probed:
  `platform-probe.py --environment production` 0 findings and
  `http-hardening-probe.py 3020 production` 0 findings. The development half of
  the header probe was run against the live preview server on 3000: 0 findings.
- **The run itself**: GitHub Actions run
  [38951829955](https://github.com/d97920622-gif/kd/actions/runs/38951829955) on
  commit `9654866`, workflow `ci`, event `push`, conclusion `success`. `verify`
  green, `build` green in 41 s with every step (install, build, artefact
  assertions, serve and probe), `ci` green on its `needs` check. Two platform
  annotations are recorded rather than acted on: `actions/checkout@v4` and
  `actions/setup-node@v4` are being forced onto the Node 24 runtime by GitHub,
  and the `ubuntu-latest` image migrates in October 2026. Both belong to the
  sub-step that revises the workflow (16.3); nothing in this run depended on
  either.
- **The governance probe**: `python3 docs/EVIDENCE/step-01/governance-probe.py`
  0 findings (`/tmp/governance-probe-131.txt`). It reads the platform rather
  than the files: the `ci` workflow is registered and active; the newest run on
  this branch succeeded and belongs to HEAD `9654866`; GitHub's own parser
  reports no CODEOWNERS errors; private vulnerability reporting, the channel
  `SECURITY.md` sends a reporter to, is on; and branch protection on
  `integration` is not configured yet, which is a repository setting the owner
  switches on (the check to require is `ci`). The inventory it prints is the
  sizes in the table above: 48 lines of CODEOWNERS, 152 lines of workflow, 888
  lines of check, and a 54 entry changelog.
- **One correction in a tracked evidence file**: the header of
  `http-hardening-probe.py` claimed it verifies that the development server is
  reachable through the preview host. It does not read that host, and it has not
  since it became environment-aware; the item is replaced with the permissions
  policy assertions the probe actually makes. The CI build job now runs this
  probe on every push, so a description that overstates it would be the only
  unverified sentence in the gate.

### Deliberately not built here

- **The security workflow and the deploy workflow** (`security.yml` with SAST,
  DAST, SCA and secret scanning, `deploy.yml` with migrations and rollback) and
  FEATURE_LIST 3512 to 3514 (preview deploy, production deploy, the one-click
  rollback script). Step 16.3 owns them, because they need a deployment target,
  a database and a provider credential this step does not have.
- **Branch protection and the required check list**: a repository setting, not a
  file. The check to require is `ci`, and the probe reports the setting as
  unconfigured until the owner enables it after the merge into `integration`.
- **An action major-version bump**: the workflow pins `actions/checkout@v4` and
  `actions/setup-node@v4`, which GitHub is already running on the Node 24 runtime
  by force. Bumping them is a change to the workflow that needs its own evidence
  on a runner, and 16.3 is the sub-step that owns the workflow's surface.
- **Lighthouse at 90 and the dead-link audit as a recorded gate**: the dead-link
  scan runs in the floor on every push now (`check:dead-links`, 15 routes and 58
  links), and the Lighthouse run needs a browser this environment does not have;
  both are recorded at the 1D gate in sub-step 1.32.
- **README, `docs/ADR/ADR-0001` to `0005` and `0007`, and
  `docs/handoffs/CHAT_01_COMPLETED.md`**: sub-step 1.32.

## Sub-step 1.30 evidence -- the platform plumbing, the nonce CSP, the crawler files and the paper

1.30 is "Platform plumbing: `middleware.ts`, `instrumentation.ts`, CSP nonce
baseline, sitemap and robots baseline, metadata baseline, print stylesheet".
Two commits: code and this progress file. The acceptance anchors are docs/PLAN/08
line 90 (the sub-step line; line 92 is the segment gate), FEATURE_LIST item 265
for the sitemap and 2525 with 2527 for its sources and its index, 266 for
robots.txt with 2528 and 2529 for the admin-editable half and the generated
defaults, the print group 340 and 371-375 with 864, 865 and 883 (the print
stylesheets, the margin, the pages that stay printable, the hidden chrome, A4
and US Letter, and the print-preview mode), 3199 for the server-only environment
variables, and 3231 with 3892-3894 for a policy that names a per-request nonce in
`script-src` and `style-src` and allows no `unsafe-inline`. Of those, 340 and 374
(the print preview) need a document surface to preview and are named as deferred
below rather than half-built here.

### What the product gained, module by module

| Module                                                                                                    | What it decides                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/security/content-security-policy.ts`                                                                 | The document policy as a pure function of a nonce and an environment: `script-src` and `style-src` carry `'self'` and the nonce, production carries neither `'unsafe-inline'` nor `'unsafe-eval'`, the framing refusal and the HTTPS upgrade are deployment-only, and the five named development relaxations are exported as a list. `newCspNonce()` is 128 bits from the platform's random source, base64url, no padding. |
| `middleware.ts`                                                                                           | The one request-time decision: a nonce per request, the policy on the request headers (where Next.js reads it to stamp its own inline scripts) and on the response (what the browser enforces), and a matcher that leaves the static prefixes alone so a stylesheet does not cost a function invocation.                                                                                                                   |
| `instrumentation.ts`                                                                                      | The entry point that may import nothing: both hooks test `NEXT_RUNTIME` and reach the Node half through a dynamic import inside that branch, which is what keeps `node:crypto` out of the other runtime's build.                                                                                                                                                                                                           |
| `instrumentation-node.ts`                                                                                 | The start-up refusal (`getEnv()` inside `registerService`, one structured line on the way up, `process.exit(1)` when the configuration is invalid) and the failed-request record: method, path, route, correlation id, and an error code beside the error name.                                                                                                                                                            |
| `lib/seo/site.ts`                                                                                         | Where the origin comes from: `siteUrl()` normalizes the validated `NEXT_PUBLIC_APP_URL`, and `absoluteUrl()` and `canonicalPath()` are the only two ways a path becomes an address. Three surfaces need an absolute URL and no longer build one themselves.                                                                                                                                                                |
| `lib/seo/sitemap.ts`                                                                                      | The section table: every public section of the navigation map decided exactly once - listed with a frequency, a priority and a sentence of reason, or excluded with a reason - and `sitemapEntries()` resolving the live entries from the map rather than from a hand-written list. A section with no decision throws.                                                                                                     |
| `lib/seo/robots.ts`                                                                                       | The refusal table with a reason per path (`/api/`, `/_next/`, the gallery), the preview rule that refuses everything, and the sitemap line that is written only when there is a sitemap to point at.                                                                                                                                                                                                                       |
| `lib/seo/metadata.ts`                                                                                     | `publicPageMetadata()`: a page owns three facts (title key, description key, path) and cannot lose a field it never writes. Canonical, `og:url`, the image entry and the Twitter card are composed here or nowhere.                                                                                                                                                                                                        |
| `lib/seo/social-image.ts`                                                                                 | The social image's path, dimensions and alt text, defined once for both blocks that name it, so thirteen pages cannot disagree and no page writes an image tag of its own.                                                                                                                                                                                                                                                 |
| `app/sitemap.ts`, `app/robots.ts`, `app/opengraph-image.tsx`                                              | The three file routes at the application root, each declared `force-static` against the layout's per-request default because none of them is a document that runs scripts.                                                                                                                                                                                                                                                 |
| `app/layout.tsx` (edited)                                                                                 | The metadata baseline (metadataBase, title template, application name, open graph, Twitter card, robots, format detection, the two browser theme colours), the viewport export, the paper marker, and `dynamic = 'force-dynamic'` with the reason written above it.                                                                                                                                                        |
| `components/layout/print-marker.tsx`                                                                      | The paper line every shell mounts once: the brand and the address, hidden on screen and shown on paper through a class rather than an inline style.                                                                                                                                                                                                                                                                        |
| `styles/print.css` (edited)                                                                               | The two named sheets beside the paper-agnostic base: `@page a4` and `@page letter` with the token margin and `size`, and the two classes that bind a surface to a sheet.                                                                                                                                                                                                                                                   |
| `lib/i18n/strings/en/shells.ts` (edited)                                                                  | The one new sentence: the marker's line, with the brand and the site as values rather than as words baked into markup.                                                                                                                                                                                                                                                                                                     |
| `scripts/checks/platform-plumbing.mjs`                                                                    | The new 29th check: the module run rather than read for both policies, the entry point that may import nothing, the start-up rules, the middleware's three decisions, the sitemap and robots tables per entry window, the metadata baseline, the paper contract, and the server-only environment rule that keeps two key names inside `lib/env`, `instrumentation.ts`, `middleware.ts`, `next.config.js` and the scripts.  |
| `scripts/checks/public-site.mjs`, `scripts/checks/layout-shells.mjs` (edited)                             | The metadata composition rule (a page that hand-writes an open graph block is refused) and the paper rules (the marker mounted once by the document, the two named sheets, no marker in a shell).                                                                                                                                                                                                                          |
| `docs/EVIDENCE/step-01/platform-probe.py` (new), `docs/EVIDENCE/step-01/http-hardening-probe.py` (edited) | The two probes: the first reads a running server for the nonce, the crawler files, the metadata, the paper contract, the 404 and the start-up record; the second now judges the composed policy per environment instead of comparing it with a constant it cannot equal.                                                                                                                                                   |

### Decisions this sub-step turns on

1. **The nonce is generated inside the handler, and the policy is set twice on
   purpose.** A nonce built at module scope is a constant with a random-looking
   value, which is the shape of a policy that looks strict and protects nothing;
   the call runs once per request and the check asserts the call site is inside
   the handler. The same string is set on the request headers, which is where
   the framework reads it to stamp the scripts it writes into the document, and
   on the response, which is what a browser enforces - so the framework's own
   inline scripts are covered by the policy rather than exempted from it.
2. **Documents are rendered per request, and that is a security decision rather
   than a caching one.** The first production run of this sub-step served 39
   script elements and not one of them carried a nonce: a prerendered document is
   bytes written at build time, so there is no response for a nonce to belong to,
   and under `'strict-dynamic'` every unnonced script is refused - a site that
   paints and never hydrates. The root layout therefore declares
   `force-dynamic`, and the three routes that carry no scripts declare
   `force-static` against it. After the fix the same probe counts 44 nonce-carrying
   scripts.
3. **Production has no `unsafe-inline` and no `unsafe-eval`, and development
   widens exactly four tokens and withholds one directive.** Every difference
   between the two policies is one of the five named lines in an exported list,
   and each line names the directive it widens, so a relaxation cannot arrive
   unnoticed. The framing refusal stays
   deployment-only because a development build is reviewed inside a hosting
   preview window - the 1.26 rule, kept, and now named in that list rather than
   inferred from an absence.
4. **A crawl file that lists everything advertises the page a reader sees when
   the site is down.** The offline page is excluded with that reason written
   down, every public section is decided exactly once, and the entries come from
   the navigation map, so a page added to the map is listed without anyone
   remembering this file.
5. **A preview is not the site.** Outside production robots.txt disallows
   everything and writes no sitemap line, because a preview that refuses the
   crawler and then hands it the full list of paths has refused nothing.
6. **The metadata baseline is composed once, because a page-level block replaces
   the layout's rather than adding to it.** This was measured, not assumed: the
   first production run served an `og:title` with no `og:image` at all, because
   each page had written its own open graph block and silently dropped the
   image. `publicPageMetadata()` now owns everything except the three facts a
   page really has, and the public-site check refuses a page that hand-writes the
   block again.
7. **A refusal that throws is not a refusal.** Next.js logs a failed
   instrumentation hook and keeps serving, so an invalid configuration produced a
   server answering 500 per page instead of one that refuses to start. The catch
   now ends the process, which is measured: `next start` with no environment exits
   1 and nothing listens on the port. The record carries `error_code` beside
   `error_name` because a minified build renames classes - the refusal log read
   `"error_name":"aI"` until the code was added beside it.
8. **A rule window that reaches into the next entry is not a rule.** The static
   controls caught this one: the sitemap rationale rule passed on a section whose
   rationale had been emptied, because the fixed 400-character window around an
   entry included the _next_ entry's value. Both windows now stop at the next
   `block:` in their own table, and the control fires (`C16`).

### Evidence

- `npm run verify`: **RESULT: PASS (29 of 29 checks passed)**, exit 0, with
  `check:platform-plumbing` as the new entry. The suite is run over the tree the
  two commits contain.
- `npx next build`: exit 0, Next.js 15.5.28. Every document is rendered per
  request (`/`, `/about`, `/blog`, `/calculators`, `/contact`, `/features`,
  `/industries`, `/invoice-generator`, `/offline`, `/pricing`, `/privacy`,
  `/shortcuts`, `/terms`, `/shells`, `/gallery`, `/_not-found`) and the four
  non-document routes are prerendered (`/robots.txt`, `/sitemap.xml`,
  `/opengraph-image`, `/icon.png`, `/apple-icon.png`). The `experimental.dynamicIO`
  rename warning that the 1.29 section recorded as owned by this sub-step is
  gone: the flag is `cacheComponents` now, its meaning unchanged.
- The platform probe against the built server (`platform-probe.py --base
http://127.0.0.1:3020 --environment production --server-log /tmp/prod-130.log`):
  **PASS, 0 findings** (`/tmp/probe-130-prod.txt`). It reads 44 script elements
  carrying the nonce in the document, two nonces across two responses, a
  production policy with no inline or eval and `frame-ancestors 'none'`, a static
  asset with no policy, the print base and both named sheets in the compiled
  stylesheet, one paper marker marked for paper, the open graph title,
  description, url and image, the Twitter card, the theme colour, the viewport and
  the application name, the social image answering 200 with `image/png`, robots
  allowing all with three refusals and naming the sitemap, twelve sitemap
  locations with every one of them answering 200, the gallery answering 404
  outside development, a 404 that still carries the policy, and one structured
  start-up line with no secret in it.
- The same probe against the development server
  (`--base http://127.0.0.1:3000 --environment development`): **PASS, 0 findings**
  (`/tmp/probe-130-dev.txt`), with 51 nonce-carrying scripts, the development
  policy allowing `'unsafe-eval'`, robots refusing everything and naming no
  sitemap, and the stylesheet and print assertions skipped with their reason: the
  development bundler injects styles through JavaScript, so the print base only
  exists as a stylesheet in a build.
- `http-hardening-probe.py` on both servers: **PASS, 0 findings** on the
  development matrix and on the built one (`/tmp/http-130-prod.txt`). This
  sub-step forced the probe to grow one honest distinction: the composed policy
  carries a fresh nonce in every response, so it is judged by what each
  environment must contain - the nonce reaching both directives, production with
  the framing refusal and the HTTPS upgrade and no `unsafe-*`, development with
  the relaxations and neither of the two deployment-only directives - rather than
  by equality with a constant.
- The refusal, measured: `next start -p 3021` with no environment in scope exits
  1, prints `startup refused: the environment is invalid` through the structured
  logger, and leaves the port silent.
- The other probes re-run against the rendered site: `public-pages-probe.py`,
  `shell-probe.py`, `gallery-dom-probe.py`, `usability-probe.mjs` and
  `free-tools-probe.mjs` all **PASS**. Every one of the thirteen public routes
  answers 200 through a running server, and the three file routes answer with
  their own content types (`text/plain`, `application/xml`, `image/png`).
- Static controls for this sub-step: **49 of 49 mutations fired and all 5
  immunities stayed green** (`/tmp/controls130.py`, output in
  `/tmp/controls130-final.txt`). Four of the 49 were rules that could not fail on
  their own defect and were tightened here: the development framing rule and the
  relaxation-naming rule (decision 3), the two records that must carry a stable
  error code (decision 7), and the metadata composition rule (decision 6). One
  control found a defect in the check rather than in the code (decision 8).
- Not built, and named rather than implied: the Lighthouse run on the homepage
  (a segment gate item, not a sub-step one), the print-preview mode (340, 374),
  which needs a document surface to preview and arrives with the documents, the
  admin-editable halves of the crawl files (2526, 2528) and the sitemap index
  with the blog's own entries (2525, 2527), which arrive with the content tables
  they read, the service worker and its caching (3378), and a typed `/api/health`
  route, which belongs to the API step.
- Also deliberate: no `x-robots-tag` header and no `noindex` on the non-public
  routes. The gallery answers 404 outside development, robots.txt refuses it, and
  the header matrix already covers the rest; a fourth mechanism stating the same
  thing in a fourth place is a mechanism nobody will remember to keep true.

## Sub-step 1.29 evidence -- the public site, pages B, the states and the tools

1.29 is "Public site pages B: contact, industries, calculators, the free invoice
generator shell, terms, privacy, blog shell, 404, 500, offline". Two commits:
code (the seven namespaces, the seven new pages, the 404 and 500 pages, the
public header, the free calculator, the check extension and the money module
fix) and this progress file. The acceptance anchors are docs/PLAN/08 line 87
(the sub-step line; line 86 is 1.28 and no other file in docs/PLAN names either
one - doc 05 has no public site requirement at all), FEATURE_LIST items 129-140
for the error group (129 the error state, 132 the correlation id, 133 the
one-click report, 134 the branded 404 with a search bar, 135 the 500 page with a
report option), item 109 with 3581 for the offline page and 3378 for the service
worker caching that arrives later, item 3500 for the Bengali scan, group G2
217-221 (218 names the industries the page must cover), G3 222-228 (225 the
contact page and its ticket fallback), G4 229-240 (229 terms and 230 privacy;
231-240 stay planned), G6 248-253 (248 the blog list), and G7 254-258 (254 the
free invoice generator as a lead magnet that asks for no login, 255 the markup,
discount and tax calculators). Item 256 (the ROI calculator), 258 (the demo and
sales page), 2619 and 2620 (the pricing surface's own calculator) and 2625
(guest checkout) are named by the plan for later surfaces and are recorded as
planned rather than half-built here: the calculators page carries the three
tools item 255 names and nothing else.

### What the product gained, module by module

| Module                                        | What it decides                                                                                                                                                                                                                                                                                                                                    |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/i18n/strings/en/industries.ts`           | Six industries as situation, work and rule, plus the note that says the page describes the build rather than a customer list. 218 names the six; the six slugs are the ones the check counts.                                                                                                                                                      |
| `lib/i18n/strings/en/contact.ts`              | The ways to reach a deployment and the note that says the address, the phone number and the response window are configuration this build does not have (225).                                                                                                                                                                                      |
| `lib/i18n/strings/en/generator.ts`            | The generator shell: what it will ask for, what it will produce, and the four rules it will follow, with the note that says the tool is not here yet (254).                                                                                                                                                                                        |
| `lib/i18n/strings/en/blog.ts`                 | The blog shell's heading, its description and the sentence that says no post is published yet (248).                                                                                                                                                                                                                                               |
| `lib/i18n/strings/en/offline.ts`              | What still works without a connection, what happens to work in progress, and the note that says this page is text rather than a cached copy of the product (109, 3581).                                                                                                                                                                            |
| `lib/i18n/strings/en/legal.ts`                | Terms and privacy as outlines, each ending at the other and at the contact page, each naming the binding text the business that runs the deployment supplies (229, 230).                                                                                                                                                                           |
| `lib/i18n/strings/en/calculators.ts`          | The three tools' labels, hints, four rules and the problem sentences a refused input resolves to.                                                                                                                                                                                                                                                  |
| `lib/calculators/free-tools.ts`               | The arithmetic, and only the arithmetic: markup, discount and tax, each returning formatted US dollars through `lib/utils/currency.ts` or a field and a problem code. It holds no arithmetic of its own - every operation is a money function.                                                                                                     |
| `components/public/free-calculator.tsx`       | The one client boundary on the public site: two fields, a submit, and a polite status region. It calculates nothing while the reader types, it withdraws the previous answer when an input is refused, and it renders the figures the pure module returns.                                                                                         |
| `components/public/point-list.tsx`            | The heading-free list the four page shapes share, so a page owns its own headings and `page-sections.tsx` could be deleted rather than grown.                                                                                                                                                                                                      |
| `components/layout/site-header.tsx`           | The banner landmark and the named navigation inside it: the brand links home through the map's own entry, every link carries its own 44 pixel target, the list wraps rather than scrolls, and print hides the navigation.                                                                                                                          |
| `components/navigation/public-header.tsx`     | The bridge: the map's primary destinations for the public audience, minus the home entry, which becomes the brand.                                                                                                                                                                                                                                 |
| `components/navigation/site-search.tsx`       | The 404's search: it searches the pages the map publishes and says so when nothing matches (134).                                                                                                                                                                                                                                                  |
| `app/not-found.tsx`, `app/error.tsx`          | The two state surfaces: the 404 renders the state family's copy plus the search inside the public shell, the 500 renders `ErrorState` with the digest as the reference, a retry and the one-click report (132, 133, 135).                                                                                                                          |
| `scripts/checks/public-site.mjs`              | The static half grows to 12 pages and 11 namespaces: per-page needles, the company fact shapes confined to the one namespace allowed to describe them, the offline claim vocabulary, the 404 and route error rules, the frame order in the public shell, and the rule that every key of a namespace registered in the catalogue is read by a page. |
| `docs/EVIDENCE/step-01/free-tools-probe.mjs`  | The arithmetic, executed rather than read: ten input pairs per tool against the expected figures, eight refusals with the field and the problem code, and the identity each tool states between its two lines.                                                                                                                                     |
| `docs/EVIDENCE/step-01/public-pages-probe.py` | The rendered half: thirteen pages, the frame on each of them, the five header destinations, `aria-current` on the page a reader is on, the six industry cards, the three calculator forms, the generator's zero form controls, the blog's empty marker, the four scoping notes and the 404's status, marker, heading, search and branding.         |

### Decisions this sub-step turns on

1. **A lead magnet that asks for nothing is a shell, and it says so.** The
   invoice generator page renders no input, no form, no textarea and no select,
   and it carries the sentence that says the tool is not here yet (254 asks for
   the lead magnet and 2625 for guest checkout, and both belong to the steps that
   can store a document). The check refuses the form controls and the rendered
   probe counts them.
2. **The arithmetic lives in one module, under the money rule.** The component
   holds two strings and no numbers; `lib/calculators/free-tools.ts` holds the
   tools and no arithmetic of its own; every operation goes through
   `lib/utils/currency.ts`, which is still the only file allowed to do money
   arithmetic. The three tools are 255's markup, discount and tax, and the two
   lines of each card agree with the figure the reader typed.
3. **Writing the arithmetic table first found a real money defect.**
   `applyRate` multiplied through `multiplyMoney`, which rounds its factors to
   the four decimal storage scale: `percentToRate('8.875')` was `0.0888`, and a
   tax of 8.875 percent on 1234.56 rendered `$109.63` where the answer is
   `$109.57` - six cents, invisible in review and visible to a customer. A rate
   is a factor rather than an amount, so it is now read at the division scale
   and rounded once, where the result is produced. This is the class of defect
   the frozen table of inputs exists to catch, and it is the reason the probe
   was written before the page was trusted.
4. **The state pages reuse the state family rather than writing a second
   sentence.** The 404's title and description are `states.label_error_not_found_*`
   from 1.24, and it renders inside the public shell, so the answer to a typo, an
   old link and a stale bookmark is the brand, the navigation and a search over
   the pages the map publishes. The 500 renders `ErrorState`, which already
   holds the retry, the attempt count and the report control.
5. **The offline page promises nothing this build cannot do.** It states what
   still works (a page already open, a form's contents kept in this browser, a
   failed operation that is the reader's to retry) and then says in one sentence
   that it is text rather than a cached copy. The claim vocabulary refuses
   `works offline` and `available offline` in every rendered page, and inside the
   offline namespace the words cached and stored may appear only in a note that
   also says `not` - caching arrives with the service worker (3378).
6. **Company facts live in one namespace, inside the notes that scope them.**
   An address, a phone number or a response window is configuration supplied by
   the business that runs the deployment, and this build has none: the check
   refuses the seven company fact shapes everywhere except the
   `contact.label_note_*`, `legal.*_label_note_*` and `offline.label_note_*`
   keys, which are the keys whose whole job is to say what the deployment
   supplies. A fact anywhere else is a fact a reader would take for this build's.
7. **The header is chrome with a name and a target, not a second list.** The
   header renders the banner landmark and a `nav` with its own accessible name
   from the catalogue; the five destinations are the map's primary entries for
   the public audience, so the bar cannot drift from the map, and the footer
   below it still renders every live public page. A header with its own list of
   four links is the second opinion that goes stale.
8. **Two rules could not fail on their own defect, and the controls found
   them.** The route error rule looked for `error.digest` in the file, which the
   comment explaining `error.digest` satisfied, so it now reads the stripped
   code and asks whether the digest is the first choice; the landmark rule looked
   for any `aria-label` in the surface file, which the brand link's label
   satisfied, so it now reads the name off the landmark element itself. Both were
   tightened in this sub-step because a check that cannot fail on its own defect
   is worse than no check: it is quoted as evidence.

### Evidence

- `npm run verify`: **PASS (28 of 28 checks passed)**, exit code 0, on the
  frozen tree (`/tmp/verify-129-final.txt`, and again inside the pre-commit hook
  of `260a23b`).
- The counts that moved with this sub-step, quoted from that run:
  `check:i18n-strings` 104 JSX files and 26 catalogue namespaces with 1021 keys;
  `check:dead-links` 15 routes with 45 verified links and no skipped dynamic
  link; `check:public-site` 12 pages, 11 namespaces, 354 keys checked for a
  reader, 12 distinct titles between 20 and 70 characters, 26 claim words and 7
  company fact shapes refused in copy; `check:no-tests` 310 tracked files
  inspected with no test file found; `check:web-hardening` 197 application files
  with no hand-written script or link.
- `node scripts/checks/public-site.mjs` on its own: PASS.
- Rendered evidence, dev server: `python3
docs/EVIDENCE/step-01/public-pages-probe.py 3000` -> **0 findings**
  (`/tmp/probe-129-dev.txt`). Thirteen pages answer 200 with their catalogue
  title and description, one h1 each, no skipped heading level, the header and
  the footer once each and no claim vocabulary anywhere. The frame reads
  `aria-label="Site navigation"` with the destinations `['/', '/features',
'/pricing', '/industries', '/calculators', '/contact']` and the footer
  thirteen anchors with its catalogue heading; `aria-current="page"` lands on
  exactly the page being read, checked on all five header destinations.
  Industries renders 6 of 6 cards with its build note; calculators renders 3
  tools, 6 fields with decimal keyboards, 3 submits and 4 rules, and ships **no
  figure before the reader submits anything**; the generator renders zero input,
  form, textarea and select elements; the blog shell renders its empty marker and
  its sentence and no post; the four scoping notes are present; the offline
  banner is absent from the server response, which is the expected state for a
  surface that reads the browser's connection; and
  `/no-page-is-served-here` answers 404 with the marker, one h1, the search and
  the branded header.
- Rendered evidence, production server: `npx next build` passed and
  prerendered 21 pages, with every public route static - the new pages at
  2.49 kB each and 115 kB first load, `/calculators` at 3.45 kB and 170 kB
  first load because it is the one route with a client boundary, `/offline` at
  4.62 kB and 141 kB. `npx next start -p 3020` then answered the same probe with
  **0 findings** (`/tmp/probe-129-prod.txt`): 24 script requests and 855857
  bytes as served, no image without a declared size, a 55998 byte homepage
  document, and the same 404.
- The arithmetic, executed: `node --experimental-strip-types
docs/EVIDENCE/step-01/free-tools-probe.mjs` -> **PASS, 0 findings**. Markup
  100 at 12.5 percent gives `$112.50` and `$12.50`; 0.045 at 0 percent gives
  `$0.05` and `$0.01` (a sub-cent input, marked in the table because the cent
  identity does not apply to it); 0.03 at 33.333 percent gives `$0.04` and
  `$0.01`; 10 at 1000 percent gives `$110.00` and `$100.00`; discount 125.50 at
  10 percent gives `$12.55` and `$112.95`; tax 99.99 at 7.5 percent gives
  `$7.50` and `$107.49`; tax 1234.56 at 8.875 percent gives `$109.57` and
  `$1,344.13`. Eight refusals report the field and the reason: an empty amount is
  `required`, `1e5` and a fifteen digit amount are `format`, `-5` is `range`, 101
  and 1000.0001 percent are `range`, and an empty or malformed percentage is
  `required` or `format`. The last section states each tool's own identity
  between its two lines, which is what caught the rate rounding.
- Static controls for this sub-step: 30 of 30 mutations fired and all 3
  immunities stayed green (`/tmp/controls129.py`, output in
  `/tmp/controls-129-final.txt`), and the 1.28 control set still fires 29 of 29
  with both immunities green (`/tmp/controls128.py`,
  `/tmp/controls-128-final.txt`) - the regression floor for the rules this
  sub-step touched. Two of the 30 found rules that could not fail on their own
  defect and were tightened here (decision 8); one found that a control I had
  written was wrong rather than the rule (the immunity added an unrendered key,
  which the "every key is read" rule correctly refused).
- The earlier probes were re-run against the changed site, because 1.29 changed
  what the public shell renders: `shell-probe.py` **PASS** after four expectation
  updates it forced on itself (`/tmp/shell-probe-129-run4.txt`) - the specimen
  renders the public shell above the component specimens, so the footer it
  measures is the last one on the page rather than the first; the skip link is
  the first focusable element in the document rather than the only one, because
  the public header now sits between it and the content; the public audience
  plans nothing now that every public destination is live; and the public palette
  offers all thirteen published pages with `/shortcuts` drawn as the page being
  read. `usability-probe.mjs` PASS, `gallery-dom-probe.py` PASS and
  `http-hardening-probe.py` PASS, all unchanged by this sub-step.
- Verify history for this sub-step: run 1 FAIL (2 of 28: lint and
  `check:no-console`, both on the new evidence probe, which printed through
  `console`) -> the probe now writes to stdout -> every later run PASS. One
  check-side defect was found by the static controls rather than by the suite and
  is recorded above.
- Known warning, deferred on purpose: `next dev` and `next start` both report
  that `experimental.dynamicIO` has been renamed to `cacheComponents`. The flag
  is owned by sub-step 1.30 (platform plumbing) and is left alone.
- Not built, and named rather than implied: the ROI calculator (256), the demo
  and sales page (258), the pricing surface's own calculator (2619, 2620), guest
  checkout (2625), the service worker and its caching (3378), the legal pages
  beyond terms and privacy (231-240), the reporting endpoint behind the 500
  page's report control (133 sends the reference and the address to the clipboard
  and says so), and the Lighthouse run on the homepage, which is a segment gate
  item rather than a sub-step one.

## Sub-step 1.28 evidence -- the public site, pages A

1.28 is "Public site pages A: homepage, features, pricing and about, with real
English copy and metadata". Two commits: code (the four namespaces, the four
pages, the footer, the shell wiring and the twenty-eighth check) and this
progress file. The acceptance anchors are docs/PLAN/08 line 86 (the sub-step
line; line 87 is 1.29 and no other plan file names either), FEATURE_LIST items
205-228 - the homepage sections 205-216, the product page 217-221 and the
company page 222-228, with the legal group 229-235 left to 1.29 - FEATURE_LIST
item 193-199 for the heading order, the mandatory image alternative and the
aria-live rule, and the four plan slugs with a monthly and an annual figure at
item 698. docs/PLAN/05 has no public site requirement at all (a grep for the
four page names returns nothing), so FEATURE_LIST group G is the feature source
for this sub-step and the plan supplies only the position in the sequence.

### What the product gained, module by module

| Module                                        | What it decides                                                                                                                                                                                                                                                                                                               |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/i18n/strings/en/home.ts`                 | 49 keys: the hero, six capabilities, the three steps of the first month, four trust points, a three plan pricing preview, the closing call to action and the honest-build note. Every sentence is a claim the build can already evidence, and the file comment says why that is the rule here rather than a style preference. |
| `lib/i18n/strings/en/features.ts`             | The product page: one group per module with its points, the same six capabilities read from the product side, and the metadata pair.                                                                                                                                                                                          |
| `lib/i18n/strings/en/pricing.ts`              | The only owner of every price in the product. Four plans, monthly and annual figures as digit strings, what each plan includes, four notes (USD, the annual sentence, change notice, data ownership) and the enterprise sentence for a price that is agreed rather than published.                                            |
| `lib/i18n/strings/en/about.ts`                | What the company is, how it works, who it is for and what it refuses to say. No founding year, no headcount, no address, no customer and no certification: those are facts the owner supplies, and the contact page of 1.29 carries them.                                                                                     |
| `lib/i18n/strings/en.ts` (edited)             | The four namespaces registered at the three insertion points. 19 namespaces and 841 keys now, which is what `check:i18n-strings` reports.                                                                                                                                                                                     |
| `lib/i18n/strings/en/nav.ts` (edited)         | The two labels the new public entries need: the section label and the home entry.                                                                                                                                                                                                                                             |
| `config/nav-map.ts` (edited)                  | The `public-site` block: `home` goes live at `/` and is not a primary entry, `features`, `pricing` and `about` move from planned to live with their icons. Every public destination in the product is now published by the map, so the dead link check and the shell can both read it.                                        |
| `app/(public)/page.tsx`                       | The homepage: six sections, an h1 and h2 headings, server rendered copy, metadata from the catalogue, and the pricing preview reading the same keys the pricing page renders.                                                                                                                                                 |
| `app/(public)/features/page.tsx`              | The features page: a group per module, each point a real behaviour of the product.                                                                                                                                                                                                                                            |
| `app/(public)/pricing/page.tsx`               | The four plan cards. `TierBase` plus a discriminated union - a published tier carries its two price keys, an agreed tier carries none - so the enterprise card renders the catalogue sentence instead of a figure and the type system refuses a plan with a missing price.                                                    |
| `app/(public)/about/page.tsx`                 | The about page: what the platform is, how it is built, who it is for and the honesty rule stated in the copy.                                                                                                                                                                                                                 |
| `components/layout/site-footer.tsx` (edited)  | The brand link home is now a prop: `homeHref` and `homeLabelKey`, defaulting to the shell label. A footer that hard-coded `/` would be a second owner of a destination the map already owns.                                                                                                                                  |
| `components/navigation/public-footer.tsx`     | The client bridge. It renders the shared footer from `useNavigation('public', null)` and owns no list of its own, which is what keeps `components/layout/` free of the navigation map import.                                                                                                                                 |
| `components/layout/public-shell.tsx` (edited) | Renders the footer after `<MainContent />`, so every public page gets the chrome once. The doc comment records why the footer arrives here in 1.28 and why the header waits for 1.29.                                                                                                                                         |
| `scripts/checks/public-site.mjs`              | The twenty-eighth check, in five groups.                                                                                                                                                                                                                                                                                      |
| `docs/EVIDENCE/step-01/public-pages-probe.py` | The rendered half: nine kinds of assertion against a running server, with no browser and no test framework.                                                                                                                                                                                                                   |

### The seven decisions that needed a written reason

1. **The G1 trust widgets are not rendered, and the reason is recorded rather
   than hidden.** FEATURE_LIST items 205-216 name the sections a homepage
   usually fills with a testimonial, a customer logo wall, a customer count and
   an uptime figure. This build has none of them: no customer has agreed to be
   named, no measurement has been run and no audit exists, so each of those
   sections would be a claim with the same typography as a true one. The
   homepage renders the sections it can fill - capabilities, the three steps of
   the first month, four trust points that describe behaviour, the pricing
   preview and the closing call to action - and the copy states the rule in one
   sentence: these pages describe the platform as it is built. The section is
   not faked and it is not silently dropped either. `check:public-site` refuses
   24 claim patterns across the four namespaces, so the step that eventually has
   a real customer to name has to add its vocabulary to this build first. This
   is the Zero Tolerance rule taking the place of a planned section, and it is
   recorded here because a future reader will otherwise see a missing section.
2. **A price is data with one owner, and no page does arithmetic on it.**
   `lib/i18n/strings/en/pricing.ts` holds every figure as a digit string, so the
   billing module of a later step can read the plan table without this file
   becoming a numeric source of truth. The pricing page renders the figure
   behind a `data-plan-figure` marker that also carries the plan slug, which is
   what lets the rendered probe read a price out of the markup instead of
   trusting a substring. The enterprise plan publishes no figure at all: it has
   no price keys, its card renders a catalogue sentence, and the check fails a
   published tier that is missing either its monthly or its annual figure rather
   than inventing a default. No other public page may write a currency amount,
   and the check reads every one of them to prove it.
3. **The footer is chrome, so it arrives through the shell rather than through
   the route group layout.** `components/layout/` may not import
   `config/nav-map.ts` - that rule is older than this sub-step - so the footer
   reaches the shell as a client bridge that asks the map for the public
   audience and hands the footer its two props. The shell renders it after
   `<MainContent />`, which means one footer per document and no page has to
   remember it. The check fails a shell that writes an `href` of its own.
4. **The public header waits for 1.29.** The header is the surface that also
   carries the contact destination and the language switch of the next
   sub-step, so building it now would mean building half of it twice. The shell
   is shaped for it: `PublicShell` already owns the skip link and the single
   main landmark, and the header arrives between them without moving either.
5. **Metadata is copy like any other copy.** Each page exports a typed
   `metadata` object whose title and description are `t()` calls of that page's
   own namespace, and the open graph pair repeats the same two keys rather than
   a second phrasing. The check reads the metadata block rather than the file:
   the page's own field has to be a catalogue call of its own namespace, the
   preview has to agree with it, titles are 20 to 70 characters, descriptions
   50 to 160, and no two pages may share a title. A literal title is invisible
   to `check:i18n-strings`, which is exactly the defect this rule exists for.
6. **The heading outline is a structure, and 1.28 is where it starts to be
   load bearing.** One h1 per page, at least one h2, and no level skipped on the
   way down (FEATURE_LIST items 193-199). The check reads it from the source and
   the rendered probe reads it from the response, so a section that is
   reordered by a later sub-step fails in one of the two places.
7. **The rendered half is measured without a browser.** The project ships no
   test framework (Rule 4), so the evidence for what a reader actually receives
   is `docs/EVIDENCE/step-01/public-pages-probe.py`: it fetches each page,
   reads the title, the description, the page marker, the heading levels, the
   footer, the plan figures and the claim vocabulary out of the response, counts
   the homepage sections and the plan cards, and measures what the page costs to
   open. It runs against a dev server and against `next start`, and it found a
   real class of defect that the source checks cannot see: React writes a
   comment marker between two adjacent text nodes, so `$12` arrives as
   `$<!-- -->12`, and a probe that matched a price against the raw response
   would report a missing figure that renders correctly. The probe now reads
   through those markers where a node boundary matters and reads the raw
   response where a claim would matter.

### Evidence

- `npm run verify`: **PASS (28 of 28 checks passed)**, on the frozen tree, exit
  code 0. Five tooling entries (typecheck, lint, format:check, env:validate,
  tokens:export) and 23 checks.
- The counts that moved with this sub-step, quoted from that run:
  `check:i18n-strings` 89 JSX files and 19 catalogue namespaces with 841 keys;
  `check:dead-links` 7 routes with 19 verified links and no skipped dynamic
  link; `check:public-site` 4 pages, 4 namespaces, 183 keys checked for a
  reader, 24 claim words and 7 company fact shapes refused in copy;
  `check:usability` 209 source files scanned for a second owner of a storage
  key; `check:no-tests` 285 tracked files inspected with no test file found.
- `node scripts/checks/public-site.mjs` on its own: PASS.
- Rendered evidence, dev server: `python3
docs/EVIDENCE/step-01/public-pages-probe.py 3000` -> **0 findings**. Four
  pages, four status 200 responses, one h1 each with the full outline reported,
  the footer once per document with the brand link pointing home and no link
  missing, no claim vocabulary anywhere in a response, the homepage sections 1
  each with 6 capability cards, 3 steps, 4 trust points and 3 preview tiers, and
  the hero copy present in the server response with no JavaScript executed.
- Rendered evidence, production server: `next build` passed and prerendered 13
  pages, including the four new routes at 2.49 kB each and 116 kB first load.
  `npx next start -p 3020` then answered the same probe with **0 findings**:
  the same four pages, 4 plan cards reading `$0`, `$12`, `$29` and "Agreed per
  engagement", 19 script requests and 802436 bytes as served, no image without
  a declared size and a 49853 byte homepage document.
- The production build also settles the one structural risk of this sub-step:
  `app/(public)/page.tsx` resolves to `/` and there is no parallel `app/page.tsx`,
  so no route is claimed twice.
- Static controls for the twenty-eighth check: 29 of 29 mutations fired and
  both immunities stayed green (`/tmp/controls128.py`, output in
  `/tmp/controls-128-run3.txt`). Four of them found rules that could never have
  fired and were fixed in this sub-step rather than in the next one: the
  `'use client'` directive and the `href="` literal in the shell were read from
  the stripped copy, where the string stripper had already blanked them; the
  metadata rule was satisfied by the open graph title while the page's own title
  had become a literal; and the figure marker rule was satisfied by the other
  card branch. A check that cannot fail on its own defect is worse than no
  check, because it is quoted as evidence.
- Verify history for this sub-step: run 1 FAIL (3 of 27: format, the empty
  enterprise price keys, the money word read out of an attribute name), run 2
  PASS (27 of 27), run 3 FAIL (1 of 28: format on the new check only), final run
  PASS (28 of 28).
- Known warning, deferred on purpose: `next dev` reports that
  `experimental.dynamicIO` has been renamed to `cacheComponents` in Next 15.5.
  `next.config.js` is owned by sub-step 1.30 (platform plumbing), so the flag is
  left as it is until that sub-step, and it is recorded here so it is not
  mistaken for a new failure later.
- Unproven and still owed by the segment gate: the Lighthouse run on the
  homepage, the dead link audit over the full public site (it grows as 1.29
  lands the remaining routes) and the trusted-types boundary.

## Sub-step 1.27 evidence -- the usability primitives

1.27 is "Usability primitives: `use-saved-views`, `use-undo`, `use-autosave`,
optimistic update helpers, explainability message component and string
catalogue". Two commits: code `535c54e` (23 files, +5001/-5) and this progress
file. The acceptance anchors are docs/PLAN/08 line 85 (the sub-step line),
docs/PLAN/09_REVISION_2_ADDITIONS.md lines 24 and 60-61 (doc 09 owns the
component and the three hooks, names the steps that apply them, and names the
steps that supply their context), docs/PLAN/00 line 120, docs/PLAN/03 line 94,
docs/PLAN/05 A14.2 and A14.3 and A11.2, and FEATURE_LIST items 156, 995, 1494 and
1848-1855.

### What the product gained, module by module

| Module                                         | What it decides                                                                                                                                                                                                                                                                              |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/usability/saved-views.ts`                 | The view envelope: the versioned namespace, the identifier rule for an owner and a list, name sanitizing, the allowlist projection of scalars, a parser that drops exactly the entries that fail validation, and the caps of 20 views, 12 keys, 40 character names and 120 character values. |
| `lib/usability/undo-window.ts`                 | The window: 5000 ms as a floor, a ceiling of 15000, the expiry and remaining math, the oldest-first overflow, and the decision that one timer serves the soonest expiry rather than one timer per action.                                                                                    |
| `lib/usability/draft.ts`                       | The draft envelope: the `kd.draft.v1` namespace, a 1200 ms quiet period, a 32768 byte cap measured in bytes, 17 denied key names scanned through the whole payload, and the adopt and write decisions that keep a draft from overwriting newer work.                                         |
| `lib/usability/optimistic.ts`                  | The queue: ordered mutations over a baseline, the projection a caller renders, `settle` folding a confirmed change into the baseline, and `rollback` rebuilding from the baseline so a later edit is not lost with a failed one.                                                             |
| `lib/usability/explainability.ts`              | The nine reasons and the four sentences each carries, the fallback for an outcome this build cannot classify, the 64 character reference clamp, the expected-by window from 2000 to 2100 and the `YYYY-MM-DD HH:mm UTC` label.                                                               |
| `lib/hooks/use-saved-views.ts`                 | Per owner and per list under one storage key, cleared on the `kd:logout` signal, with every outcome reported as a sentence a reader can act on rather than a boolean.                                                                                                                        |
| `lib/hooks/use-undo.ts`                        | The deferred commit: `schedule`, `undoNow`, `flush`, the pending list, one commit per action, and `useUndoToast` for the five second message with its Undo button.                                                                                                                           |
| `lib/hooks/use-autosave.ts`                    | Seven states (idle, pending, saving, saved, failed, blocked, recovered), the local draft written before the request, the caller's schema as the gate, and a bounded retry.                                                                                                                   |
| `lib/hooks/use-optimistic-record.ts`           | The record: one request in flight, the request payload is the projection the reader already sees, and a failure re-applies every later edit.                                                                                                                                                 |
| `lib/hooks/use-toast.tsx` (edited)             | One optional action per toast, rendered inside Radix's `ToastAction`. That is what lets the undo window be a message with a button rather than a message about a button.                                                                                                                     |
| `components/shared/explainability-message.tsx` | Four sentences, one reference, an expected-by instant in a `<time>` element and one optional support link that has to pass the same URL rule as every other link in the product.                                                                                                             |
| `lib/i18n/strings/en/usability.ts`             | Two namespaces of copy: the states of all four primitives, the saved view outcomes, and the sentences the hooks render.                                                                                                                                                                      |
| `lib/i18n/strings/en/explainability.ts`        | The nine reasons, their four sentences each, the labels for the reference, the expected-by instant with its `{time}` placeholder and the support link.                                                                                                                                       |
| `app/(dev)/gallery/showcase-usability.tsx`     | Five specimens running the real hooks against this browser's storage, each with a marker the rendered inventory counts in every theme.                                                                                                                                                       |
| `scripts/checks/usability.mjs`                 | The twenty-seventh check, in eight groups.                                                                                                                                                                                                                                                   |
| `docs/EVIDENCE/step-01/usability-probe.mjs`    | 95 decisions executed against the five pure modules by plain Node with no loader, because each module takes its ids, timestamps and storage keys as arguments.                                                                                                                               |

### The six decisions that needed a written reason

1. **A saved view is untrusted input and a copy of the reader's workspace at the
   same time.** It is stored under one versioned key per owner and per list
   (`kd.saved-views.v1.<owner>.<list>`), the parser drops exactly the entries that
   fail validation instead of discarding the whole payload, and the hook
   subscribes to the `kd:logout` signal so a sign-out removes the copy. Identity
   arrives in step 3, so the owner id is a prop for now; without it in the key,
   two people sharing a device would read each other's views, which is the
   multi-tenant rule arriving early in the cheapest possible place.
   Saving a view whose name already exists updates that view rather than adding a
   second one, and the cap of 20 refuses with a sentence instead of dropping the
   oldest view: a product that quietly deletes what a reader saved is a product
   that will be believed about nothing else.
2. **A destructive action is deferred, not compensated.** The window holds the
   commit for five seconds; when the window closes, the request is sent, not
   before. The alternative - send immediately and write a compensating record on
   undo - needs a restore path for every kind of deletion, and leaves two writes
   where one would do, with nothing transactional between them. The cost is
   stated where a reviewer can hold it: nothing is sent during the window, and
   `pagehide` and unmount both flush, so the only way to lose an action in the
   middle is a hard crash - which loses it in the safe direction, with the record
   still there.
3. **The toast carries its own button, and it cannot outlive the window.** The
   message is pushed with `duration: UNDO_WINDOW_MS` and its action runs
   `undoNow`, so the offer expires exactly when the undo does. A toast that lived
   six seconds beside a five second window would offer a button that lies, so the
   check reads the duration out of the same constant the window uses.
4. **A local draft never silently overwrites server state.** The draft is written
   before the request, so a crash leaves the reader's work on disk; on mount it is
   offered as a recovery candidate only when it is newer than the record the page
   loaded, and adopting it is a decision the reader makes. The payload is gated by
   the caller's Zod schema and by 17 denied key names, so a password, a security
   code or an account number in a draft is refused rather than persisted.
5. **Rollback rebuilds from the baseline.** A failure does not restore a snapshot:
   it drops the failed mutation and re-applies the ones after it, so an edit made
   while the request was in flight survives. One request is in flight at a time
   and each request carries the projection, which is what makes the order of
   responses irrelevant - and is the reason the queue is data rather than a
   second `useState`.
6. **A reason and its sentences live together, and the list is closed.** Nine
   outcomes (payment declined, held and pending; refund pending; payout delayed;
   invoice overdue; delivery failed and being retried; plus the fallback) each
   carry four sentences: what happened, why, what happens next, and when to
   expect it. An outcome this build cannot classify resolves to the fallback
   instead of rendering a heading with an empty body, which is the shape a reader
   sees at the moment they are most worried about money. The expected time is a
   label rather than a promise, no sentence names a payment brand, and the
   forbidden-brands check reads the same catalogue the component renders.

Sub-step 1.27 has no ADR: the plan names ADR-0006 for 1.26 and puts ADR-0001 to
ADR-0007 in 1.32, so these six decisions are recorded here and in the doc comment
at the top of each module, in the file a reader will already have open.

### `npm run verify` on the frozen tree

Verbatim from the run against the tree this sub-step is committed from (27
checks, one more than 1.26):

```
== KD SOLUTION IT verify ==
branch arena/b7780282-kd at fbc2546
PASS typecheck                completed with no output (  2.3s)
PASS lint                     completed with no output (  5.4s)
PASS format:check             All matched files use Prettier code style! (  5.8s)
PASS env:validate             env:validate PASS (NODE_ENV=development) (  0.4s)
PASS tokens:export            tokens:export PASS (config/design-tokens.json is current: 12 groups, 25486 bytes) (  0.4s)
PASS check:english-only       check:english-only PASS (267 text files scanned, 1 documented exemption) (  0.1s)
PASS check:no-todo            check:no-todo PASS (229 text files scanned) (  0.0s)
PASS check:no-coming-soon     check:no-coming-soon PASS (229 text files scanned) (  0.1s)
PASS check:no-tests           check:no-tests PASS (274 tracked files inspected) (  0.0s)
PASS check:path-comment       check:path-comment PASS (255 source files carry a valid path comment) (  0.0s)
PASS check:i18n-strings       check:i18n-strings PASS (84 JSX files checked for literal copy, 15 catalogue namespaces with 656 keys validated) (  0.7s)
PASS check:design-tokens      check:design-tokens PASS (198 source files scanned, 700 class lists checked, spacing/radius/shadow/z-index/typography/motion scales wired from config/design-tokens.ts with reduced motion and forced colors verified) (  1.1s)
PASS check:color-contrast     check:color-contrast PASS (4 themes, 23 color roles, 76 contrast ratios verified against WCAG 2.1 AA, paper palette 4 tokens and 3 ratios verified) (  0.4s)
PASS check:no-console         check:no-console PASS (200 source files scanned) (  0.1s)
PASS check:forbidden-brands   check:forbidden-brands PASS (229 text files scanned) (  0.1s)
PASS check:migration-pairs    check:migration-pairs PASS (no migrations yet: nothing to pair) (  0.0s)
PASS check:dead-links         check:dead-links PASS (3 routes, 4 verified links, 0 dynamic links skipped) (  0.0s)
PASS check:secrets            check:secrets PASS (267 text files scanned) (  0.1s)
PASS check:any-types          check:any-types PASS (172 TypeScript files scanned) (  0.1s)
PASS check:money-math         check:money-math PASS (200 script files scanned) (  0.1s)
PASS check:brand-assets       check:brand-assets PASS (9 assets current (mark in light and dark, plate icon, favicon pack 16/32/48, apple touch icon 180, PWA icons 192 and 512, maskable 512), palette-only colours, centring and 16 pixel legibility verified, default social image rendered and measured at the network crop size) (  2.0s)
PASS check:layout-shells      check:layout-shells PASS (5 shells and 5 route-group layouts verified (skip link first, one landmark per page, id shared with the landmark), 6 roles framed through one seam with no privileged default, 9 navigation surfaces verified (named landmarks, one owner of the current page, 44 pixel targets, device inset on pinned bars, drawer state owned in the component), print base verified against config/design-tokens.ts) (  0.4s)
PASS check:nav-map            check:nav-map PASS (config/nav-map.ts verified: 6 roles filtered, one audience per surface, no destination outside the map, wiring gated on a non-empty menu, 3 commands on 2 chords) (  0.6s)
PASS check:page-states        check:page-states PASS (8 state and accessibility modules verified (announced, actionable, named), breakpoint ladder 320 to 1920 exact, no desktop-first media query, styles/globals.css carries the wrap guard) (  0.1s)
PASS check:motion             check:motion PASS (9 motion and media modules verified (preference read, durations from the token bridge, celebration bounded and removable), 5 durations zeroed at the preference, gallery pins the reduced pane) (  0.1s)
PASS check:web-hardening      check:web-hardening PASS (11 security headers verified (7 in every environment, 3 on the deployed origin), Permissions-Policy refuses by default with 4 named grants, sanitizer allowlist and Trusted Types policy shaped, Clear-Site-Data gated on TLS, no hand-written script or link in 165 application files) (  0.1s)
PASS check:usability          check:usability PASS (4 usability primitives verified (saved views with a declared key allowlist, the 5000 ms undo floor committed exactly once, a bounded autosave draft with a denied key floor, and an optimistic queue that re-applies what a failure must not take back), explainability reasons and their 4 sentences checked in both directions, 199 source files scanned for a second owner of a storage key) (  0.0s)
RESULT: PASS (27 of 27 checks passed)
```

Counts that moved since 1.26: english-only 252 to 267 files, no-todo and
no-coming-soon 214 to 229, no-tests 259 to 274, path-comment 240 to 255, i18n 82
to 84 JSX files and 13 to 15 namespaces and 526 to 656 keys, design-tokens 183 to
198 files and 621 to 700 class lists, no-console 185 to 200, forbidden-brands 214
to 229, secrets 252 to 267, any-types 159 to 172, money-math 185 to 200,
web-hardening 152 to 165 application files, and the new check scans 199 source
files for a second owner of a storage key. The i18n jump is 130 keys, and 118 of
them are the four sentences of the nine reasons plus their labels.

### The new check, and the controls that prove it bites

`scripts/checks/usability.mjs` is the twenty-seventh check, in eight groups: the
files and their client boundary; the saved view engine (namespace, identifiers,
name sanitizing, the scalar allowlist and its caps, the parser's per-entry
refusal, the cap's refusal, the outcome union); the undo engine (the floor, the
ceiling, the soonest expiry, the oldest-first overflow, the settled set, the
single timer, the pagehide flush, the toast pairing); the autosave engine (the
quiet period, the byte-measured cap, the 17 denied keys, the stale write, the
adopt decision, the schema gate, the retry bound, the seven states and their
copy); the optimistic engine (the ordered fold, the settle, the rebuild, the one
request in flight); the explainability engine (the reason list checked against
the catalogue in both directions, the fallback, the reference clamp, the UTC
label, the support link rule); the two catalogues and the gallery wiring; and the
rule that each storage namespace has exactly one owner in the tree.

Two static controls found rules that were too loose and tightened them, which is
the point of running them: the undo hand-back rule matched one call where the
copy promises that a thrown error and a rejected promise are reported the same
way, and the draft cap rule matched the declaration of the constant rather than
the place the serialized bytes are measured against it. `expectAtLeast` exists
because of the first one.

`/tmp/controls127.py` (the control script, kept outside the repository) runs 71
mutations and 4 immunities: 71 fired the expected finding, 4 immunities (a
comment that names the window, an extra guard inside the commit path, an extra
documented key in a namespace, a defensive branch in the resolver) stayed green,
0 anchors missed, 0 unexpected results. The controls mutate the tightened anchor
verbatim, one file at a time, with the restore in `finally`, and the whole script
is re-run after any rule change.

`/tmp/harness127.py` is the live half: seven mutations that have to be visible in
the rendered page, each against its own freshly started dev server (a server that
has not re-read a component is exactly how a previous inventory reported a
finding that was not there). All seven fired the expected finding: a second toast
surface, a renamed page marker, a locale-formatted instant, a reference code
without the 320 pixel wrap guard, an unknown reason replaced by a known one, an
autosave status line that stops rendering, and an explanation that drifts from
the reason it belongs to.

Two rules in the rendered inventory came out of this sub-step as well. A page
level marker is now required to be mounted exactly once, not merely present,
because a second toast surface is a second live region reading messages aloud and
the first run of this inventory found exactly that shape as a theme-specific
count difference. And the wrap guard is asserted on the `<code>` element that
carries the reference rather than on the page, because the class appears
elsewhere and a page wide count cannot see it go missing where it matters.

### Rendered evidence

- `node docs/EVIDENCE/step-01/usability-probe.mjs` - 95 decisions and 0 failures
  against the five modules: 28 on saved views, 16 on the undo window, 23 on
  drafts, 13 on the optimistic queue and 15 on explainability (nine reasons, 36
  sentences, resolved through the typed key builder). It imports the `.ts` files
  directly under Node 22.22.3, so the decisions are executed rather than read.
  Its own run caught three wrong assertions in the first draft - a hostile
  payload that loses three entries and not two, a projected filter comparison,
  and an explanation sentence that was being looked up under the namespaced key -
  which is recorded here because the probe is the artefact that is supposed to
  catch that class of mistake.
- `python3 docs/EVIDENCE/step-01/gallery-dom-probe.py` - 61 markers counted in
  each of the five theme scopes and both page level markers present exactly once,
  0 findings, RESULT PASS. The usability section reads the held payment reference
  and its UTC instant, the failed delivery sentence, the fallback words for a
  reason the build does not know, and the wrap guard on the reference element, in
  every theme.
- `python3 docs/EVIDENCE/step-01/http-hardening-probe.py 3000` - 0 findings
  against the development server, so the two sub-steps in this segment do not
  disagree about the response.
- The probe's UTC decisions were passing in a container whose clock is already
  UTC, which is the one place where they prove nothing: the probe now pins a
  non-UTC zone before it formats its first timestamp, and a control that prints
  local parts fails three of its decisions rather than none.

### Open at the end of this sub-step

- Saved views take the owner id as a prop. The session that supplies it arrives
  in step 3; the single storage key and the sign-out subscription are already
  shaped for it, and no saved view is written without an owner.
- The undo window flushes on `pagehide` and unmount. A hard crash loses the
  action in the safe direction, with nothing sent; a cross-tab replay would need
  the server side of step 2.
- Autosave takes its request callback as a prop, because the first editable
  record endpoint belongs to step 5. The draft store is local only; duplicate tab
  detection and server-side recovery arrive with those endpoints.
- The explainability component is rendered from the gallery. The screens that
  supply its context - a held payment, a delayed payout, an overdue invoice, a
  failed delivery - belong to steps 5, 10, 11 and 12, which doc 09 names.
- Five seconds is a constant rather than a preference. The floor and ceiling pair
  (5000 to 15000) already exists for the settings surface that would change it.

## Sub-step 1.26 evidence -- the web hardening baseline

1.26 is "Web hardening primitives: Trusted Types policy, COOP, COEP, CORP,
Permissions-Policy, Clear-Site-Data on logout, SRI baseline, header matrix tests,
`docs/ADR/ADR-0006-web-hardening-baseline.md`". Two commits: code `fb97830`
(20 files, +2421/-5) and this progress file. The acceptance anchors are
docs/PLAN/05 A13.8 (Trusted Types, cooperating headers, Permissions-Policy,
Clear-Site-Data on logout, Subresource Integrity) and MASTER_PROMPT layer 2
(clickjacking protection, the nonce content security policy, and the sanitizer
that XSS prevention is built on, named there as `lib/security/sanitizer.ts`).

### What the product gained, module by module

| Module                                        | What it decides                                                                                                                                                                                                 |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `config/security-headers.ts`                  | The matrix: one entry per header with its value, the environment it applies in, why it exists and what goes wrong without it.                                                                                   |
| `next.config.js` (edited)                     | Applies the matrix to `/:path*` for every response, choosing the environment from `NODE_ENV`. It holds no header value.                                                                                         |
| `lib/security/sanitizer.ts`                   | An allowlist sanitizer: 24 kept elements, attributes filtered by name and by the `on` prefix, URL schemes checked after stripping scheme noise, and a refusal rather than a passthrough where no parser exists. |
| `lib/security/trusted-types.ts`               | The named policy `kd-solution-it`: `createHTML` sanitizes, `createScriptURL` accepts only this origin, and `createScript` is deliberately absent so a script sink throws.                                       |
| `lib/security/logout.ts`                      | `Clear-Site-Data` for a sign-out response, withheld on a non-TLS origin, plus the `kd:logout` signal and its unsubscribe.                                                                                       |
| `lib/security/index.ts`                       | The barrel: the primitives the rest of the product may reach for. The matrix is deliberately not in it.                                                                                                         |
| `components/security/security-runtime.tsx`    | Declares the policy once per document, in an effect, from the root layout. Renders nothing.                                                                                                                     |
| `docs/ADR/ADR-0006-web-hardening-baseline.md` | The record: nine decisions, their consequences, six alternatives, and the honest statement that SRI is a rule without a subject in step 1.                                                                      |

### The header matrix, and why it is data

Eleven headers ship, eight in every environment and three on the deployed HTTPS
origin only. Each one is an entry in `config/security-headers.ts` with a
rationale and a failure mode, and `next.config.js` maps that data into Next.js's
`headers()` shape for `/:path*`. A header list spread across a config file, a
middleware and a pull request comment is a list where the next person edits one
copy and nothing fails; here the values have one owner and the check reads both
halves.

```
always                           deployed HTTPS origin only
--------------------------------  -----------------------------------------
X-Content-Type-Options: nosniff    Content-Security-Policy: frame-ancestors 'none'
Referrer-Policy: strict-origin-    X-Frame-Options: DENY
  when-cross-origin                Strict-Transport-Security: max-age=63072000;
X-DNS-Prefetch-Control: off          includeSubDomains; preload
X-Permitted-Cross-Domain-Policies: none
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Resource-Policy: same-origin
Permissions-Policy: 22 features refused, 4 granted to (self)
```

`Permissions-Policy` is the one entry worth reading in full: every directive
refuses, and exactly four features are granted to this origin, each with a
consumer named in the rationale - `fullscreen` for a document view,
`publickey-credentials-create` and `publickey-credentials-get` for the passkey
sign-in of step 3, and `clipboard-write` for the copy control on a failure
report. `clipboard-read` is refused because nothing in the product pastes.

Three decisions that needed a written reason, all recorded in the ADR:

1. **The policy is split across two sub-steps, deliberately.** This sub-step
   sends `frame-ancestors 'none'` from the build configuration; 1.30 appends the
   directive set with the per-request nonce in `middleware.ts`. A browser
   enforces the _intersection_ of every policy it receives, so nothing 1.30 does
   can loosen this refusal, and this half applies even to responses that never
   reach middleware. It also means the baseline is not something a header can
   turn off: a static asset response is the case where request-time code is least
   certain to run.
2. **`require-corp` from the first production request.** The product loads
   nothing cross-origin today, so the header costs nothing, and adopting it now
   means the first feature that wants an embedded third-party resource has to
   make an explicit decision instead of inheriting permission nobody granted.
3. **The development exception is enumerated.** `X-Frame-Options`, the
   `frame-ancestors` policy and HSTS are production-only, because the review
   surface is a development server over plain HTTP inside a preview window.
   The exception is exactly three named headers; the check fails if a fourth
   appears, and `http-hardening-probe.py` measures both matrices rather than
   trusting the file.

### Subresource Integrity: a rule with no subject, stated plainly

SRI protects a document from a _changed_ resource, which only has meaning for a
resource this application does not serve. A first-party asset arrives from the
same origin, in the same deploy, from the same handler as the markup that
references it; if the origin is compromised, the `integrity` attribute arrives
with the markup it is meant to protect, so the protection is decoration. Next.js
also owns its own chunk graph, emitting script tags with build hashes that
hand-written attributes do not survive.

So the decision is: **no third-party resource may be loaded without SRI**, and
step 1 loads none. `check:web-hardening` enforces the rule structurally - a
hand-written `<script>` or `<link>` element, or a `next/script` import, fails the
check with the message that such a resource needs a SHA-384 integrity attribute
and an ADR. The rule has no exceptions because it has no subjects; the first
processor SDK in step 8 arrives with a real hash, a documented fallback and its
own ADR entry. Claiming SRI coverage for a first-party chunk graph would have
been the more comfortable sentence and the less honest one.

### The sanitizer is an allowlist, and the gallery proves the page is not a sink

MASTER_PROMPT layer 2 enumerates what rich text must lose: `<script>`,
`<iframe>`, `<object>`, `<embed>`, `<applet>`, `on*` handlers, `javascript:`,
`data:` and `vbscript:`, CSS `expression()`, `url()` and `@import` injection,
and the script that hides inside SVG and MathML. That enumeration describes what
must not survive; there is no way to know an enumeration is complete, so the code
is the other shape - a list of what survives, and a default of removal:

- `SAFE_ELEMENTS` keeps 24 elements; `a` may keep only `href` and `title`.
- Any element outside the list is removed **with its subtree** and replaced by a
  visible `[removed]` marker, because a refusal that renders as nothing is
  indistinguishable from a bug.
- Attributes are kept only when the element's entry names them, the name does not
  begin with `on`, and the name has no namespace separator (`xlink:href` is how
  an SVG script is reached).
- A URL is kept only when it is relative or its scheme is `http`, `https`,
  `mailto` or `tel`, tested after stripping the control characters a browser
  ignores inside a scheme - which is the difference between refusing
  `java\tscript:` and missing it.
- `style` attributes and `<style>` elements are refused outright, so nothing has
  to scrub `expression()`, `@import` or `url()` out of a declaration.
- Parsing uses an inert `DOMParser` document, never a live element's
  `innerHTML`; with no parser available the function returns an empty string
  rather than the input.

The gallery renders one hostile string twice - once through the sanitizer, once
as text - and shows the sanitized output **as text**. That is not a rendering
detail: inserting the result as markup would make the gallery a second injection
sink, so `dangerouslySetInnerHTML` is refused by the check in all of `app/`,
`components/`, `lib/` and `config/`, and the probe reads the rendered pane to
confirm the hostile string arrived escaped.

### `npm run verify` on the frozen tree

Verbatim from the run against the committed tree (26 checks):

```
== KD SOLUTION IT verify ==
branch arena/b7780282-kd at fb97830
PASS typecheck                completed with no output (  3.6s)
PASS lint                     completed with no output (  6.1s)
PASS format:check             All matched files use Prettier code style! (  6.1s)
PASS env:validate             env:validate PASS (NODE_ENV=development) (  0.4s)
PASS tokens:export            tokens:export PASS (config/design-tokens.json is current: 12 groups, 25486 bytes) (  0.4s)
PASS check:english-only       check:english-only PASS (252 text files scanned, 1 documented exemption) (  0.1s)
PASS check:no-todo            check:no-todo PASS (214 text files scanned) (  0.1s)
PASS check:no-coming-soon     check:no-coming-soon PASS (214 text files scanned) (  0.1s)
PASS check:no-tests           check:no-tests PASS (259 tracked files inspected) (  0.0s)
PASS check:path-comment       check:path-comment PASS (240 source files carry a valid path comment) (  0.1s)
PASS check:i18n-strings       check:i18n-strings PASS (82 JSX files checked for literal copy, 13 catalogue namespaces with 526 keys validated) (  0.7s)
PASS check:design-tokens      check:design-tokens PASS (183 source files scanned, 621 class lists checked, spacing/radius/shadow/z-index/typography/motion scales wired from config/design-tokens.ts with reduced motion and forced colors verified) (  1.2s)
PASS check:color-contrast     check:color-contrast PASS (4 themes, 23 color roles, 76 contrast ratios verified against WCAG 2.1 AA, paper palette 4 tokens and 3 ratios verified) (  0.5s)
PASS check:no-console         check:no-console PASS (185 source files scanned) (  0.1s)
PASS check:forbidden-brands   check:forbidden-brands PASS (214 text files scanned) (  0.1s)
PASS check:migration-pairs    check:migration-pairs PASS (no migrations yet: nothing to pair) (  0.0s)
PASS check:dead-links         check:dead-links PASS (3 routes, 4 verified links, 0 dynamic links skipped) (  0.1s)
PASS check:secrets            check:secrets PASS (252 text files scanned) (  0.1s)
PASS check:any-types          check:any-types PASS (159 TypeScript files scanned) (  0.1s)
PASS check:money-math         check:money-math PASS (185 script files scanned) (  0.1s)
PASS check:brand-assets       check:brand-assets PASS (9 assets current (mark in light and dark, plate icon, favicon pack 16/32/48, apple touch icon 180, PWA icons 192 and 512, maskable 512), palette-only colours, centring and 16 pixel legibility verified, default social image rendered and measured at the network crop size) (  2.1s)
PASS check:layout-shells      check:layout-shells PASS (5 shells and 5 route-group layouts verified (skip link first, one landmark per page, id shared with the landmark), 6 roles framed through one seam with no privileged default, 9 navigation surfaces verified (named landmarks, one owner of the current page, 44 pixel targets, device inset on pinned bars, drawer state owned in the component), print base verified against config/design-tokens.ts) (  0.5s)
PASS check:nav-map            check:nav-map PASS (config/nav-map.ts verified: 6 roles filtered, one audience per surface, no destination outside the map, wiring gated on a non-empty menu, 3 commands on 2 chords) (  0.6s)
PASS check:page-states        check:page-states PASS (8 state and accessibility modules verified (announced, actionable, named), breakpoint ladder 320 to 1920 exact, no desktop-first media query, styles/globals.css carries the wrap guard) (  0.1s)
PASS check:motion             check:motion PASS (9 motion and media modules verified (preference read, durations from the token bridge, celebration bounded and removable), 5 durations zeroed at the preference, gallery pins the reduced pane) (  0.1s)
PASS check:web-hardening      check:web-hardening PASS (11 security headers verified (7 in every environment, 3 on the deployed origin), Permissions-Policy refuses by default with 4 named grants, sanitizer allowlist and Trusted Types policy shaped, Clear-Site-Data gated on TLS, no hand-written script or link in 152 application files) (  0.1s)
RESULT: PASS (26 of 26 checks passed)
```

Counts that moved since 1.25: english-only 241 to 252 files, no-todo 203 to 214,
no-tests 248 to 259, path-comment 230 to 240, i18n 12 to 13 namespaces and 504 to
526 keys, design-tokens 174 to 183 files and 593 to 621 class lists, any-types
151 to 159, money-math 176 to 185, dead-links 3 to 4 verified links. The counts
in this block are from a run against the committed tree: an earlier run still had
a scratch file from the header-loading experiment on disk, which is why it
reported one more file in seven of the checks.

### The new check, and two rules it made more precise elsewhere

`scripts/checks/web-hardening.mjs` is the twenty-sixth check, in eight groups:
the matrix's required names and values; the permissions list (refuse by default,
four named grants, each with a consumer, and `clipboard-read` refused); the
consumer (applies to `/:path*`, holds no values, reads `NODE_ENV`); the
sanitizer (allowlist size and membership, the link's two attributes, the
forbidden names as documentation, the `on` prefix, the four URL schemes, scheme
noise, the refusal without a parser, the removal marker, the snapshot walk,
attribute removal, the namespace refusal, the link check); the Trusted Types
policy (name, the two declared functions, the absent `createScript`, resolved-origin
comparison, the narrow local declaration); the runtime and its mounting point;
Clear-Site-Data and the signal; the banned shapes; copy, the gallery and the ADR.

Two rules it tightened in `check:motion` while it was there, both found by the
controls rather than by the author: the raw `<img>` rule now blanks comments and
string literals before it scans, because the sanitizer's own gallery specimen
contains an image element **in a string**, on purpose; and this check does the
same for `<script>`, `<link>` and `dangerouslySetInnerHTML`. A check that cannot
tell a specimen string from a sink teaches a reader to write exclusions instead
of reading the finding.

Static negative controls, one file at a time with a restore in `finally`
(`/tmp/controls126.py`): **59 of 59 behaved as intended** - 57 mutations fired a
finding and 2 immunities passed (a fully documented extra header added to the
matrix, and a reworded rationale). Six rules were too loose on the first run and
were fixed rather than excused, and the fixes are the evidence that the controls
were worth writing:

| Miss | What the rule matched                                                                                                        | The fix                                                                                              |
| ---- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| C6   | `rationale:` in the interface _and_ in every entry, so deleting one still left the interface's                               | count inside the array body, between `SECURITY_HEADERS` and `SECURITY_HEADER_SOURCE`                 |
| C12  | a permission moved to `=()` was read as "not granted" rather than "refused by mistake", so the specific grant rule never ran | the grant rule now fires on any non-`(self)` allowlist                                               |
| C18  | the literal `new DOMParser().parseFromString(` reintroduced inside a helper function satisfied the rule                      | the control now removes the call entirely, and the rule names the inert-parse call in `sanitizeHtml` |
| C19  | adding `svg` to the allowlist while the forbidden list still names it passed                                                 | a new rule fails any element present in both lists, because the allowlist is what the code keeps     |
| C39  | the _import_ of `installSecurityPolicy` satisfied a rule that meant "the call"                                               | the rule matches `installSecurityPolicy();`                                                          |
| C46  | the payload rule matched a prefix, so adding a second key to the event detail passed                                         | the rule reads the detail object and requires it to be exactly the one key                           |

Rendered negative controls (`/tmp/harness_live.py`), one file at a time, each
with a freshly started dev server: **7 of 7 fired**. Removing an always-on header
from the matrix, weakening a value, turning a refusal into a grant, moving the
matrix off `/:path*`, removing a gallery hardening marker, rendering the hostile
specimen as markup, and dropping the sanitizer-output marker all failed the
probe that watches for them. Two lessons were learned the hard way and are
recorded here because they cost two runs:

- **A matrix edit needs a server restart.** The running server that proved
  P1-P3 impossible is not a check weakness: `next.config.js` is re-evaluated when
  that file changes, so a mutation to the matrix it requires is invisible until
  the server restarts. The harness now starts its own server per control.
- **`npx next dev` is a wrapper.** Terminating it leaves the Server bound to the
  port, so a later "fresh" server fails to bind and the probe reads the previous
  one - three controls reported MISSED for that reason and one reported FIRED
  while proving nothing. The harness now kills the process _group_ and refuses to
  run when port 3000 is occupied.

After both runs every controlled file was byte-identical to its backup
(`diff -q` clean across the 14 source files), and the checks passed again on the
restored tree.

### Rendered evidence

`docs/EVIDENCE/step-01/http-hardening-probe.py` is new. It reads the headers off
the wire for both environments. Development (0.0.0.0:3000), verbatim:

```
server: http://127.0.0.1:3000
GET /shortcuts -> 200, 38116 bytes

header matrix as received:
  x-content-type-options             ok        nosniff
  referrer-policy                    ok        strict-origin-when-cross-origin
  x-dns-prefetch-control             ok        off
  x-permitted-cross-domain-policies  ok        none
  cross-origin-opener-policy         ok        same-origin
  cross-origin-embedder-policy       ok        require-corp
  cross-origin-resource-policy       ok        same-origin
  content-security-policy            absent (expected in development)
  x-frame-options                    absent (expected in development)
  strict-transport-security          absent (expected in development)

Permissions-Policy:
  refuses camera=()                  yes
  refuses microphone=()              yes
  refuses geolocation=()             yes
  refuses payment=()                 yes
  refuses usb=()                     yes
  refuses clipboard-read=()          yes
  grants  fullscreen=(self)          yes
  grants  clipboard-write=(self)     yes

same matrix on a static asset:
  GET /_next/static/css/app/layout.css?v=1792164410015 -> 200
  always-on headers present: 7 of 7
  CORP on the asset: same-origin

findings: 0
RESULT: PASS
```

Production (`next build` then `next start`, 0.0.0.0:3020), verbatim:

```
server: http://127.0.0.1:3020
GET /shortcuts -> 200, 19915 bytes

header matrix as received:
  x-content-type-options             ok        nosniff
  referrer-policy                    ok        strict-origin-when-cross-origin
  x-dns-prefetch-control             ok        off
  x-permitted-cross-domain-policies  ok        none
  cross-origin-opener-policy         ok        same-origin
  cross-origin-embedder-policy       ok        require-corp
  cross-origin-resource-policy       ok        same-origin
  content-security-policy            ok        frame-ancestors 'none'
  x-frame-options                    ok        DENY
  strict-transport-security          ok        max-age=63072000; includeSubDomains; preload

Permissions-Policy:
  refuses camera=()                  yes
  refuses microphone=()              yes
  refuses geolocation=()             yes
  refuses payment=()                 yes
  refuses usb=()                     yes
  refuses clipboard-read=()          yes
  grants  fullscreen=(self)          yes
  grants  clipboard-write=(self)     yes

same matrix on a static asset:
  GET /_next/static/css/e3ebe6d4278dd681.css -> 200
  always-on headers present: 7 of 7
  CORP on the asset: same-origin

findings: 0
RESULT: PASS
```

`docs/EVIDENCE/step-01/gallery-dom-probe.py` grew from 44 to 49 markers per
scope (five for the hardening specimens) and now reads the sanitizer panes
element by element rather than counting markers. Verbatim on the final tree:

```
page size: 668696 bytes (development, /gallery)
stylesheet size: 58981 bytes
scopes found: 5
...
data-security="sanitizer-input"                  1               1               1               1               1
data-security="sanitizer-output"                 1               1               1               1               1
data-security="header-matrix"                    1               1               1               1               1
data-security="trusted-types"                    1               1               1               1               1
data-security="clear-site-data"                  1               1               1               1               1
```

```
hardening specimens, read element by element:
  theme-light            escaped: yes   hostile markup rendered raw: no   output pane state: pending in the browser
  theme-dark             escaped: yes   hostile markup rendered raw: no   output pane state: pending in the browser
  theme-hc-light         escaped: yes   hostile markup rendered raw: no   output pane state: pending in the browser
  theme-hc-dark          escaped: yes   hostile markup rendered raw: no   output pane state: pending in the browser
  theme-reduced-motion   escaped: yes   hostile markup rendered raw: no   output pane state: pending in the browser
markers checked per scope: 49
page level markers checked: 1
findings: 0
RESULT: PASS
```

The output pane reads "pending in the browser" because the sanitizer needs a
parser and therefore runs in a client effect, not during server rendering: the
response carries the state before the effect, and the removal marker appears once
it has run. That limit is stated rather than papered over, and it is why the
gallery also carries `data-security="header-count"` - the number of headers the
browser read back from its own response - so a reviewer opening the page sees the
count move from 0 to the matrix size.

### Production build and the guard

`npx next build` after `rm -rf .next`: compiled successfully in 16.1 seconds,
**9 static pages**. `/gallery` 91.4 kB (285 kB first load, up from 87 kB and
281 kB: the security specimen section), `/shells` 6.21 kB, `/shortcuts` 674 B,
`/_not-found` 993 B, shared first load 103 kB.

`npx next start -H 0.0.0.0 -p 3020` then answered, with the full eleven-header
matrix on every response including the static stylesheet:

```
/              404  8687
/shells        404  7155
/gallery       404  7158
/shortcuts     200 19915
/dashboard     404  8687
/admin         404  8687
/client-portal 404  8687
```

Zero specimen markers on the refusals, as in 1.25, except the page transition
that `app/template.tsx` mounts above every route - a navigation to a missing page
is still a navigation. The guard was stopped, `.next` removed and the development
server restarted on 0.0.0.0:3000; `/shells` 200 351725 B, `/gallery` 200 668696 B,
`/shortcuts` 200 38115 B, and both probes passed against that server.

### Open at the end of this sub-step

- The nonce content security policy, `require-trusted-types-for` and the
  cross-origin resource decision for any future embed belong to 1.30, where the
  request is handled. The baseline here is deliberately the half that does not
  need a request.
- The sign-out route that sends `Clear-Site-Data` belongs to step 3 with
  authentication; the header builder and the client signal exist now.
- SRI has no subject until a third-party resource arrives, and the check enforces
  the rule for that arrival.
- The sanitizer runs in the browser only. Server-side sanitization for
  user-authored rich text belongs to the editor work in step 5, where the ingest
  point exists; until then rich text is validated by Zod and rendered as text.
- No browser dependency, so the client effect that runs the sanitizer is verified
  through the rendered pane's documented pending state plus the static check that
  the call exists, not by executing it here.

## Sub-step 1.25 evidence -- the motion layer, the reduced-motion contract and the illustration baseline

1.25 is "Motion and media: Framer Motion providers, page transitions, stagger,
confetti, illustration baseline, reduced-motion handling". Two commits: code
`dcd6b0f` (22 files, +2086/-3) and this progress file. The acceptance anchors are
FEATURE_LIST A3 items 26 to 37 (hover and transition micro-interactions, the
motion token system, Framer Motion, page-to-page transitions, button press
feedback, scale and fade, stagger on list items, confetti on payment success,
Lottie support, reduced-motion support, the happy-path animation and a subtle
focus pulse), items 517 and 1734 (the onboarding and payment-success
celebrations), F4 item 202 (reduced motion as an accessibility requirement) and
K1 (the illustration system).

### What the product gained, module by module

| Module                                  | What it decides                                                                                                                               |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/motion/tokens.ts`                  | The only conversion from a token to a number Framer Motion can use: 320ms becomes 0.32 seconds, a cubic-bezier becomes four control points.   |
| `components/motion/motion-provider.tsx` | Reads the preference once, configures Framer Motion once, and hands every component below a transition with the preference already applied.   |
| `components/motion/page-transition.tsx` | The fade and eight-pixel rise a navigation gets, mounted once by `app/template.tsx`.                                                          |
| `components/motion/stagger-list.tsx`    | Rows that arrive in a wave, capped after six rows, with the step derived from a duration token.                                               |
| `components/motion/confetti.tsx`        | The celebration: hidden from assistive technology, never intercepting a pointer, capped at 24 pieces and 6 seconds, and gone when it is over. |
| `components/motion/reveal.tsx`          | The happy-path arrival (A3.36): a panel that settles into place once, when something went right.                                              |
| `components/motion/press-feedback.tsx`  | Press and hover feedback for the controls that are not a `Button`: cards, tiles, rows.                                                        |
| `components/motion/animation-slot.tsx`  | The illustration and animation baseline: a reserved box, three named ratios, a still that is required, and no renderer dependency.            |
| `app/template.tsx`                      | The one place a navigation is animated, as a server component that renders one client boundary.                                               |

Two files were edited to carry behaviour rather than to add a module:
`components/ui/button.tsx` gained the class-level half of A3.30 and A3.37
(`motion-safe:active:scale-95`, `motion-safe:focus-visible:animate-focus-pulse`,
and a transition that covers transform as well as colour), and
`tailwind.config.ts` gained the one-shot `focus-pulse` keyframes and animation.
The reduced-motion half of the stylesheet did not change: 1.14 and 1.24 had
already zeroed every duration token under `@media (prefers-reduced-motion:
reduce)`, and 1.25 is the layer that has to consume it.

### The bridge is the only place a number appears

The design system declares durations and easings once and the stylesheet turns
them into custom properties. Framer Motion cannot animate a custom property: it
wants seconds and control points. Writing those numbers again in a component is
how a product ends up with two motion systems, and the drift is invisible
because both look plausible. So the conversion lives in one module, and
`check:motion` fails any other file in `app/`, `components/` or `lib/` that
reads the token tables:

```
export function motionDuration(key: MotionDurationKey, reduce = false): number {
  const token = MOTION_DURATION_TOKENS[key];
  const value = reduce ? token.reducedValue : token.value;
  return parseMilliseconds(value) / MS_PER_SECOND;
}
```

The key types are `keyof typeof MOTION_DURATION_TOKENS` and
`keyof typeof MOTION_EASING_TOKENS`, so a token added to the design system is
reachable with no edit here and a token removed from it stops compiling at every
call site. `npm run verify` reports the scales as wired with reduced motion
verified, which is the other half of the same contract.

### Reduced motion is decided once and then inherited

`MotionConfig reducedMotion="user"` makes Framer Motion itself drop transform
and layout animation for a reader who asked for less motion, and
`useMotionPreference()` gives the components below the same flag so they can
shorten their own durations to the token's reduced value - which is zero for
every duration in the system. The preference is read in exactly one place:
`check:motion` fails any other animated module that calls `useReducedMotion()`,
because a second subscription is how two parts of one page end up disagreeing
about what the reader asked for.

The provider takes one non-product prop, and it exists so the reduced path can be
_seen_ in this repository rather than asserted: the gallery mounts a second
provider with `force="reduce"`. Framer Motion reads the operating system
preference and not a CSS class, so on a machine whose operating system says
nothing about motion the pinned pane is the only place the reduced path is
visible - and the DOM probe reads that pane rather than trusting the pin.

### The seven decisions that needed a written reason

1. **No exit animation.** The App Router has already swapped the content when the
   template mounts, so an exit animation is a stall on every click, and a slow
   device makes it longer. `check:motion` fails an `exit=` on either the page
   transition or the happy-path arrival.
2. **The celebration removes itself for a reader who asked for less motion.** It
   does not freeze: a still frame of confetti is still a full-screen layer. The
   sentence that says the milestone happened is rendered by the page and stays.
3. **The stagger step is a fraction of a token, not a number.** Forty rows at 60
   milliseconds each takes two and a half seconds to arrive; the cap stops the
   wave at six rows and the step is `motionDuration('fast') * 0.35`, so a change
   to `--duration-fast` moves the stagger with it.
4. **The focus pulse animates `outline-offset`.** The outline is the focus
   indicator: animating its width makes the indicator appear late, and a second
   `box-shadow` ring is a second thing to keep themed. Sliding the ring's
   distance from 8 pixels to the 2 the global rule already sets is a pulse that
   cannot move the layout, cannot thin the ring and cannot leave a theme behind.
   (It also keeps the config clear of the `boxShadow` key entirely, which
   `check:design-tokens` reads as a second shadow scale.)
5. **A still is required, not optional.** `AnimationSlot` takes a `still` prop
   with no question mark, so an animation that has no reduced-motion answer does
   not compile. A prop that can be omitted will be omitted, and the reader who
   needs it is the one who finds out.
6. **The press scale is `motion-safe`.** The class-level variant is the same
   promise the tokens make: a reader with reduced motion gets the press without
   the movement rather than a shortened snap.
7. **The completion callback lives in a ref.** A parent passing an arrow function
   - which is every parent - would otherwise hand the celebration a new callback
     on each render and restart the fall timer, so a page that rendered twice would
     never finish the celebration and never remove its layer.

### The illustration and media baseline, and the Lottie stance

Section K asks for an illustration system and for animation support, and A3.34
names Lottie. What this sub-step delivers is the _contract_ rather than a
renderer: `AnimationSlot` reserves the box before a drawing arrives (one of three
named aspect ratios, a width from the layout tokens), hides itself from
assistive technology by default, and swaps the animation for the still when the
reader asked for less motion. Any renderer - a Lottie player, an SVG with a
timeline, a video - drops into that slot unchanged.

The stance, recorded here so the next step inherits it rather than rediscovering
it: no Lottie runtime is added in step 1, because step 1 ships no animated Lottie
asset to play and an unused player is a renderer and a network dependency for a
drawing nobody has authored yet. The first surface that owns an animation -
onboarding in the middle of step 4, the payment-success page in step 8 - brings
the file and the minimum player through the dependency gate, and it renders
inside `AnimationSlot`, so the box, the accessible name rule, the still and the
reduced-motion behaviour are already decided. Media follows the same posture:
`next.config.js` already declares AVIF and WebP, `check:motion` fails a raw
`<img>` anywhere in `app/`, `components/` or `lib/`, and images arrive through
`next/image` with the layout reservation the slot exists to guarantee.

### `npm run verify` on the frozen tree

Verbatim from the run against the committed tree (25 checks):

```
== KD SOLUTION IT verify ==
branch arena/b7780282-kd at dcd6b0f
PASS typecheck                completed with no output (  2.6s)
PASS lint                     completed with no output (  6.6s)
PASS format:check             All matched files use Prettier code style! (  6.0s)
PASS env:validate             env:validate PASS (NODE_ENV=development) (  0.4s)
PASS tokens:export            tokens:export PASS (config/design-tokens.json is current: 12 groups, 25486 bytes) (  0.4s)
PASS check:english-only       check:english-only PASS (241 text files scanned, 1 documented exemption) (  0.1s)
PASS check:no-todo            check:no-todo PASS (203 text files scanned) (  0.0s)
PASS check:no-coming-soon     check:no-coming-soon PASS (203 text files scanned) (  0.1s)
PASS check:no-tests           check:no-tests PASS (248 tracked files inspected) (  0.0s)
PASS check:path-comment       check:path-comment PASS (230 source files carry a valid path comment) (  0.1s)
PASS check:i18n-strings       check:i18n-strings PASS (80 JSX files checked for literal copy, 12 catalogue namespaces with 504 keys validated) (  0.6s)
PASS check:design-tokens      check:design-tokens PASS (174 source files scanned, 593 class lists checked, spacing/radius/shadow/z-index/typography/motion scales wired from config/design-tokens.ts with reduced motion and forced colors verified) (  1.1s)
PASS check:color-contrast     check:color-contrast PASS (4 themes, 23 color roles, 76 contrast ratios verified against WCAG 2.1 AA, paper palette 4 tokens and 3 ratios verified) (  0.5s)
PASS check:no-console         check:no-console PASS (176 source files scanned) (  0.1s)
PASS check:forbidden-brands   check:forbidden-brands PASS (203 text files scanned) (  0.1s)
PASS check:migration-pairs    check:migration-pairs PASS (no migrations yet: nothing to pair) (  0.0s)
PASS check:dead-links         check:dead-links PASS (3 routes, 3 verified links, 0 dynamic links skipped) (  0.0s)
PASS check:secrets            check:secrets PASS (241 text files scanned) (  0.1s)
PASS check:any-types          check:any-types PASS (151 TypeScript files scanned) (  0.1s)
PASS check:money-math         check:money-math PASS (176 script files scanned) (  0.1s)
PASS check:brand-assets       check:brand-assets PASS (9 assets current (mark in light and dark, plate icon, favicon pack 16/32/48, apple touch icon 180, PWA icons 192 and 512, maskable 512), palette-only colours, centring and 16 pixel legibility verified, default social image rendered and measured at the network crop size) (  2.5s)
PASS check:layout-shells      check:layout-shells PASS (5 shells and 5 route-group layouts verified (skip link first, one landmark per page, id shared with the landmark), 6 roles framed through one seam with no privileged default, 9 navigation surfaces verified (named landmarks, one owner of the current page, 44 pixel targets, device inset on pinned bars, drawer state owned in the component), print base verified against config/design-tokens.ts) (  0.5s)
PASS check:nav-map            check:nav-map PASS (config/nav-map.ts verified: 6 roles filtered, one audience per surface, no destination outside the map, wiring gated on a non-empty menu, 3 commands on 2 chords) (  0.7s)
PASS check:page-states        check:page-states PASS (8 state and accessibility modules verified (announced, actionable, named), breakpoint ladder 320 to 1920 exact, no desktop-first media query, styles/globals.css carries the wrap guard) (  0.1s)
PASS check:motion             check:motion PASS (9 motion and media modules verified (preference read, durations from the token bridge, celebration bounded and removable), 5 durations zeroed at the preference, gallery pins the reduced pane) (  0.1s)
RESULT: PASS (25 of 25 checks passed)
```

Counts that moved since 1.24: english-only 218 to 241 files, no-todo 179 to 203,
no-tests 224 to 248, path-comment 206 to 230, i18n 11 to 12 namespaces and 476 to
504 keys, design-tokens 151 to 174 files and 488 to 593 class lists, any-types
140 to 151, money-math 164 to 176.

### The new check, and the controls that prove it bites

`scripts/checks/motion.mjs` is the twenty-fifth check. It verifies ten groups,
all of them static reads: the dependency is a runtime dependency; the bridge
imports the token module with its extension and is the only reader of the token
tables; no duration is a number written in a component and no layout property is
animated; every animated module reads the preference and shows the decision as
`data-motion-reduced`; the provider configures `MotionConfig` and exposes exactly
the declared durations and easings; the template mounts the transition and the
transition has no exit, no focusability, no announcement and a rise within eight
pixels; the stagger is capped and token-derived; the celebration is hidden,
unclickable, on the toast layer, capped, removable and ref-called; the still is
required and the reduced path renders it; the button carries the motion-safe
press and pulse, the keyframes exist and the stylesheet zeroes every duration at
the preference; no raw `<img>` exists and the format list is declared; the copy
namespace is registered and the gallery renders and pins the layer.

Static negative controls, one file at a time with a restore in `finally`
(`/tmp/controls125.py`): **44 of 44 behaved as intended**, 42 mutations fired a
finding and 2 immunities passed. The first run found 5 misses, and every one was
a rule that matched a comment instead of the code, or a declaration instead of
the call site:

| Miss | What the rule matched                                  | The fix                                                           |
| ---- | ------------------------------------------------------ | ----------------------------------------------------------------- |
| C7   | `reducedMotion=` in the provider's doc comment         | the attribute on its own line: `^\s+reducedMotion=`               |
| C18  | `pointer-events-none` in the celebration's doc comment | the class list: `pointer-events-none fixed inset-0`               |
| C21  | the declaration of the ref, not its two call sites     | two `onDoneRef.current?.()` calls and no direct `onDone?.()`      |
| C35  | the finding text still described the ring colour       | the rule and the message now both describe the two animated stops |
| C40  | the reduced pane's own `<Confetti seconds={1} />`      | the celebration instance, matched with its `onDone` wiring        |

Rendered negative controls (`/tmp/controls125_probe.py`), one file at a time with
a wait for the dev server to recompile: **4 of 4 fired**. The pane stops pinning
reduced motion (the probe names the component that reports full motion), the
staggered list loses its marker (the inventory notices), a component inside the
pane reports full motion, and the page transition loses its page-level marker.
After both runs every controlled file was byte-identical to its backup
(`diff -q` clean across the 18 source files), and the probe passed again on the
restored tree.

### Rendered evidence

`docs/EVIDENCE/step-01/gallery-dom-probe.py` grew from 37 to 44 markers per
scope, seven of them for this sub-step and one at page level, because an
animation only exists while it runs: the inventory proves each animated component
renders in all five scopes, and the pane proves the reduced decision reached
them. Verbatim:

```
page size: 633954 bytes
stylesheet size: 58981 bytes
scopes found: 5
reserved drawing slot, still and                 2               2               2               2               2
staggered list, capped wave                      3               3               3               3               3
press and hover feedback wrapper                 1               1               1               1               1
components reporting the reduced                 3               3               3               3               3
specimen pane pinned to reduced m                1               1               1               1               1
button press feedback, motion saf               33              33              33              33              33
focus pulse, one shot                           33              33              33              33              33

page level motion markers:
  page transition mounted by the root template           1

reduced motion pane (preference pinned, not inherited):
  components reporting reduced motion: 3
  components reporting full motion:    0
  celebrations rendered inside it:     0

buttons in the page: 255
form controls in the page: 100
controls with a semantic role: 45
labels with a for attribute: 30
accessible name issues: 0

markers checked per scope: 44
page level markers checked: 1
findings: 0
RESULT: PASS
```

The 33 press and focus classes are every button on the page inheriting the base
class list, which is the point of putting A3.30 and A3.37 on the primitive: the
feedback is not a component a page remembers to use.

### Production build and the guard

`npx next build` after `rm -rf .next`: compiled successfully in 16.3 seconds,
**9 static pages**. `/gallery` 87 kB (281 kB first load, up from 85.1 kB and
234 kB before the motion layer, which is the cost of the animation library on a
development-only route), `/shells` 6.2 kB, `/shortcuts` 675 B, `/_not-found`
993 B, shared first load 103 kB.

`npx next start -H 0.0.0.0 -p 3020` then answered:

```
/              404  8196   page-transition markers: 1
/shells        404  6741   page-transition markers: 0
/gallery       404  6744   page-transition markers: 0
/shortcuts     200 19493   page-transition markers: 1
/dashboard     404  8196   page-transition markers: 1
/admin         404  8196   page-transition markers: 1
/client-portal 404  8196   page-transition markers: 1
```

The guard was stopped, `.next` removed and the development server restarted on
0.0.0.0:3000; `/shells` 200 351446 B, `/gallery` 200 633952 B, `/shortcuts` 200
37841 B, and the probe passed on that server.

The 404 responses are the intended state of a step that has built the shell and
the system and not yet the public pages: 1.28 and 1.29 build them. The marker on
the not-found page is the template doing its job - a navigation to a missing page
is still a navigation - and the smaller 404 for the two development-only routes
is the route group's own refusal, which renders before the shared not-found.

### Open at the end of this sub-step

- Lighthouse on the homepage: owed to the segment gate, and the homepage does not
  exist until 1.28.
- The typed `/api/health` route: step 1 has no API surface yet.
- The animation library is a client-side cost on the two animated routes; the
  public pages built in 1.28 and 1.29 must keep `PageTransition` the only motion
  they pull in on first paint.
- No browser dependency in this repository, so the motion itself is verified
  through markup, tokens, the stylesheet and the DOM probe rather than by
  rendering frames.

## Sub-step 1.24 evidence -- the page-state system, the 320 pixel layer and the accessibility primitives

FEATURE_LIST section D asks for four states on every page and forbids the blank
one: a skeleton while data is on its way, an error with a retry, an empty state
with an action, a success state (D1.121, D2.129, D3.139, D4.145). MASTER_PROMPT
adds the rules that make them usable: a focus ring on every interactive element,
`aria-labels` on icon buttons, `aria-live` for anything that changes after load,
and a page that works at 320 pixels. All of that is a system, and this sub-step
builds the system rather than the pages that will use it.

**The four states, one family.** `components/shared/status-state.tsx` holds
`StatusState` (empty, permission, offline) and `ErrorState`; the two other
members are `loading-state.tsx` and `success-state.tsx`. They share one shape -
illustration, heading, sentence, optional reference, actions - because a product
that teaches the reader a new layout every time something is missing is a product
whose states are never recognised. Every sentence comes from the `states`
namespace (the eleventh catalogue namespace, 476 keys total), which is what makes
the copy reviewable in one place instead of inside five components.

**Three empty variants, three sentences.** First use ("nothing here yet",
action: create the first one), filtered ("your records are still there; the
filter is hiding them", action: clear the filter), and permission ("your role
does not include this list", action: request access). The distinction is the
point: a reader who created records yesterday and reads "No invoices yet"
concludes their data is gone, and an offer to create a record they may not create
is an offer the server refuses.

**Loading is a promise about shape.** `LoadingState` renders the four layouts the
product loads in - table, list, form, card - with skeletons sized by the same
token classes as the content they stand in for, so nothing moves when the data
lands. Each layout announces itself once, politely, through one visually hidden
sentence ("Loading the table. Rows appear in a moment."), and the skeletons are
`aria-hidden`, so a screen reader hears one sentence instead of a hundred boxes.
The row count is clamped, because a caller with a page size of 500 must not
render 500 skeletons.

**A retry the reader can see, and a backoff that does not stampede.**
`lib/hooks/use-retry.ts` implements the plan's exponential backoff with a
ceiling and equal jitter, counts the wait down in seconds, exposes a manual retry
that ignores the remaining wait (a reader who fixed their connection should not
be held to the product's schedule), and stops at a budget. `ErrorState` consumes
it: the retry control carries a real `disabled` attribute while the wait is
running and shows the countdown in its own label, the attempt count is a
pluralised sentence, and the reference code a support request can quote renders
inside the 320 pixel wrap guard.

**A boundary that stops one broken panel from taking the page.**
`components/shared/error-boundary.tsx` is a class component because React
reports a render error to nothing else. It generates a misread-safe `ERR-...`
reference per caught error, hands the error to `onError` for the structured
logger (never to the browser console), renders the state family's error member
with a scoped or full-page voice, retries **once** on its own and then hands the
decision to the reader, and clears a caught error when `resetKey` changes - which
is how a caller says "the input changed". Its report control copies the reference
and the page address to the clipboard and says where they went: there is no
reporting endpoint in this build, so it performs the one complete action
available rather than pretending to send something.

**Success, and a redirect the reader controls.** `SuccessState` confirms with a
tick, a heading, one sentence and an optional record reference; when a caller
gives it a countdown it announces the seconds politely, pauses while the pointer
or the keyboard is inside the panel, and always offers "Continue now" and "Stay
on this page". A page that navigates three seconds after it appears takes a
decision away from a reader who is slow, distracted or listening to a screen
reader.

**The 320 pixel layer.** Three pieces, each of them a real phone failure: the
breakpoint ladder is asserted to be exactly the mandated 320/375/430/768/1024/
1280/1920 with no invented steps; our own stylesheets (`globals.css`,
`print.css`) must contain no `max-width` media query, because a desktop-first
rule is a rule written for the desktop and patched for the phone; and
`styles/globals.css` declares the `.wrap-anywhere` utility (`overflow-wrap:
anywhere`) which the state family applies to every reference code. Without it a
single unbroken correlation id or address is wider than a 320 pixel column and
drags the whole page sideways.

**Accessibility primitives.** `components/ui/icon-button.tsx` makes the
accessible name a _required_ prop typed as a catalogue key, so an icon button
without a name does not compile; the drawing is `aria-hidden` and the tooltip is
optional reinforcement rather than the name. `components/shared/live-region.tsx`
always renders its element (a region mounted together with its text is announced
inconsistently), sets both the role and the `aria-live` attribute, and is
`aria-atomic`, so an announcement is read whole. The state family announces at
the right politeness: loading and success politely, errors assertively, and a
state that is the whole page can opt out with `live="off"`.

**The audit.** `scripts/checks/page-states.mjs` is the twenty-fourth check. It
verifies, from source: that every state module exists and exports what it
claims; that loading announces itself politely, hides the announcement from
sight, keeps its skeletons hidden and clamps its row count; that the state family
can leave the live region off, pluralises its counts, and renders the reference
inside the wrap guard **as read from the error state's own block**; that
`ErrorState`'s retry carries a real `disabled` attribute (the first version of
this rule matched `aria-disabled` too, which the control caught); that the
success state is a client module whose timer is cleared and whose redirect can be
stopped; that the boundary is a class with `getDerivedStateFromError`,
`componentDidCatch`, a per-error reference, the guard `if
(!this.state.autoRetried)` and no console call; that the retry hook really
doubles (`2 ** Math.max(0, attempt - 1)`), really ceilings, really jitters,
really stops at the budget branch and really clears its timer; that the
illustration is hidden from assistive technology and inherits `currentColor`;
that the icon button's name is required, resolved and applied; that the live
region sets role and attribute together; that no hand-written
`<Button size="icon">` anywhere in `app/` or `components/` lacks an `aria-label`;
that the breakpoint ladder and the wrap guard hold; and that the gallery renders
every member of the family and every state module has a consumer.

**Controls.** Twenty-one negative controls against the check, each patched,
required to fail with the message the rule promises, and reverted: a loading
region without its announcement, an unclamped row count, a retry that ignores the
backoff, an error reference outside the wrap guard, a success redirect with no
stop control, a boundary that retries without a bound, a boundary that logs to
the console, an exposed illustration, a live region without its role, an icon
button with an optional name, an exposed icon, a hand-written icon button with no
name, a backoff that stops doubling, a retry loop with no budget, an uncleared
timer, a deleted wrap guard, an added desktop-first media query, a renamed
breakpoint, a drifted breakpoint value, a showcase that leaves the gallery, and a
missing empty variant. The first run missed four of them - and all four misses
were rules that matched a _word_ rather than the construct (`aria-disabled`
satisfying a `disabled` rule, a file-level reference check satisfied by a
different state's element, `autoRetried` appearing in a state interface,
`maxAttempts` appearing in a signature) - so the rules now match the attribute,
the element and the branch, and all twenty-one fire. Four rendered controls
against the gallery probe: the error state stops rendering, the live region stops
rendering, the icon button loses its marker, and an icon-only button rendered
without a name is reported by the page-wide accessible-name audit. All four fire.

**Rendered evidence.** `docs/EVIDENCE/step-01/gallery-dom-probe.py` gained
eleven markers (37 per scope, up from 26): the four loading layouts, the empty,
permission, error and success states, two of the drawings, the icon button, the
live region and the wrap guard. The gallery renders the whole family in all five
themes - light, dark, both high-contrast scopes and reduced motion - with
identical inventories and 0 accessible-name issues across 235 buttons.

**Gates.** `npm run verify`: `RESULT: PASS (24 of 24 checks passed)`, one check
more than 1.23. `check:i18n-strings`: 11 namespaces, 476 keys. `check:page-states`
PASS. Probe: `findings: 0`, `RESULT: PASS`. Production: `next build` OK with 9
static pages (`/gallery` 85.1 kB), and `next start` answers `/shortcuts` 200 with
no state or specimen marker while `/`, `/shells`, `/gallery`, `/dashboard`,
`/admin` and `/client-portal` answer 404 with none.

**Not verified, and not claimed.** No browser dependency exists, so the retry
countdown, the focus behaviour of the boundary's controls and the computed layout
at 320 pixels are verified in source and in rendered markup, never by pressing a
button or measuring a viewport. The route-level pages that will host these states
(`app/(public)/error.tsx`, `loading.tsx`, the 404 and 500 pages) belong to
sub-step 1.29, which owns the editorial versions; 1.24 builds the system they
compose. Confetti and motion belong to 1.25, which owns the reduced-motion
provider.

## Sub-step 1.23 evidence -- the command palette, one chord spelling and the shortcuts page

FEATURE_LIST E3 asks for six things in one sub-step: a global palette on Cmd+K and
Ctrl+K, fuzzy search over commands, pages and (later) records, shortcuts on the
actions, a reference page reachable with `?`, Vim keys as an option, and focus
management with ARIA labels. Step 1 answers the five that do not need records.

**One chord, written once.** `lib/utils/key-chord.ts` owns what a chord _is_:
`mod+k` is Control on Windows and Linux and Command on macOS, matching is exact
in both directions (Control+Shift+K is not Control+K, and a chord that does not
declare Control is not fired while Control is down), a letter chord compares
shift, and a symbol chord does not - `?` is Shift+/ on most layouts, so a chord
that demanded shift as well would depend on the keyboard. The same module turns a
chord into the keycap labels a reader sees (`Ctrl`, `K`) and into the
`aria-keyshortcuts` value assistive technology reads (`Control+k Meta+k`). The
label is deliberately ASCII: rendering the Command glyph needs the platform,
which means the browser, which means a hydration mismatch to fix a word. The
reference page carries the sentence that names both keys instead.

**One registry.** `config/commands.ts` declares every command the product can
run. An entry command names a map entry rather than a path, so a command cannot
be the second place a route lives and cannot outlive the page it points at; an
action command names one of the closed set in `COMMAND_ACTIONS`; and a chord
appears exactly once in the file. The registry also builds the reference page's
rows (`shortcutRows`), which is what keeps the page and the palette from
disagreeing: an entry row is listed only when the map offers that entry to this
reader, so the page never documents a shortcut to a page the reader cannot open.

**One list, two readers.** `components/navigation/command-rows.ts` builds the
palette's rows from the map and the registry: pages from the reader's own
role-filtered navigation, actions from the registry, ranked inside each group so
a group heading is never floated above the rows it labels. The palette
(`command-palette.tsx`) and the development specimen call the same function, so
the rendered evidence measures the code path a reader's keystrokes go through
rather than a second one written for the evidence.

**Focus, as a contract.** `command-list.tsx` is a real listbox: `role="listbox"`
with `role="option"` children, `aria-selected` on the active row,
`aria-current="page"` on the row the map resolves as the current page, group
headings referenced by `aria-labelledby`, and no focusable option at all -
navigation moves `aria-activedescendant`, which the palette's input owns
together with `role="combobox"`, `aria-expanded`, `aria-controls` and
`aria-autocomplete="list"`. The dialog is the product's own `DialogContent`, so
the focus trap and the return of focus to the trigger are Radix's, and the
palette declares neither `role="dialog"` nor `aria-modal` a second time. The
trigger is a named button carrying `aria-haspopup="dialog"` and the chord it
advertises. `?` opens the reference page only outside a text field, because a
question mark belongs to the sentence first.

**The public page.** `/shortcuts` is the first page the public site serves. It is
generated from the registry and the map - no hand-written table, no second list -
and it mounts the palette for the public audience, which is both the honest host
for a reader with no session and what makes the evidence measurable in a
production response rather than only in development. Its entry flips from planned
to live in `config/nav-map.ts` in the same commit (`public-resources` block, with
`nav.label_section_resources` and `nav.label_public_shortcuts`), so
`check:dead-links` verifies the route on the day it appears. The workspace and
platform frames mount the same component in `TopBar`'s `trailing` slot; the
client portal gets none, because it is a document rather than a workspace.

**The audit.** Seven rules were added to `scripts/checks/nav-map.mjs` (the check
from 1.22, which owns the map and its readers): the registry's public surface and
its canonical chords (no `ctrl`/`cmd`, no two commands on one chord, action ids
inside `COMMAND_ACTIONS`); entry commands that name an entry the map declares and
that is live; the palette taking its pages from the role-filtered navigation and
never from the raw map, rendering the product dialog, declaring the five
combobox attributes, matching chords through `key-chord.ts` and standing down
inside a field; the option list with no `tabIndex`; the matcher gating shift on a
letter key and matching Control or Meta; the reference page reading the registry;
a chord literal written nowhere but the registry; a fourth place moving focus
(three are listed: the palette, the form error summary and the mapped-form-errors
hook); and at least one host mounting `<CommandPalette>`.

**Controls.** Fifteen negative controls, each patched, required to fail with the
message the rule promises, and reverted: eleven against the check (the palette
losing `aria-activedescendant`, a focusable option, a `ctrl+k` chord, two
commands on one chord, a shortcut to a planned page, a chord spelled in the
palette, a listener that ignores text fields, a matcher that demands shift for
`?`, a reference page that stops reading the registry, a fourth `.focus()` call,
and - as immunity - a chord named only in a comment, which must _not_ fire), and
four against the rendered page (rows that stop marking the current page, the
public list built for the wrong audience, a trigger that stops advertising its
chord, and a reference page that loses its table marker). All fifteen behaved as
intended.

**Rendered evidence.** The probe gained a command-surface section and a
shortcuts-page section, and it fetches `/shortcuts` as a stranger would. Measured:
the specimen's list for the development audience is exactly
`specimen-shells, specimen-gallery, palette.open, main.focus`; the list for the
public audience is exactly `shortcuts, palette.open, main.focus`; each list has
one active row and one current row, and the current row is the one the map
resolves (`specimen-shells` at `/shells`, `shortcuts` at `/shortcuts`); no
option is focusable; every group names a heading that exists in the same list;
and neither list can reach the other audience's page, because the row was never
built. On `/shortcuts`: the title and the `h1` are the catalogue's own words, the
table carries one row per registered shortcut in registry order, each row has a
keycap, a named action and a group, the page's own row is a live link to
`/shortcuts`, no raw chord token appears in the text a reader reads, the keycap
label is `Ctrl`, and the trigger advertises `Control+k Meta+k` and hides the
keycaps from assistive technology.

**Production.** `next build` OK, 9 static pages (`/shortcuts` 675 B and 140 kB
first load, `/shells` 6.2 kB, `/gallery` 80.7 kB). With `next start` on port
3020: `/shortcuts` answers 200 with no specimen marker in the response, while
`/`, `/shells`, `/gallery`, `/dashboard`, `/admin` and `/client-portal` answer
404 and carry no specimen marker.

**Not verified, and not claimed.** There is still no browser dependency in this
build, so no keystroke is synthesised: the chord matcher, the active-descendant
walk, the focus trap and the return of focus to the trigger are verified in
source and in the rendered attributes, not by pressing a key. Vim keys
(FEATURE_LIST E3.175) stay optional and unimplemented - the chord module matches
whatever a later step declares, and the option is a row in the registry when a
reader-facing setting exists. Record search (E3.172) waits for the records: the
palette's third source is a reserved block in the registry, not a stub.

**Gates.** `npm run verify`: `RESULT: PASS (23 of 23 checks passed)`.
`check:i18n-strings`: 10 namespaces, 422 keys (the count at the commit; the run quoted above it was taken while the specimen's command section was still being written). `check:dead-links`: 3 routes, 3
verified links, 0 dynamic. `check:nav-map`: 6 roles, 3 commands, 2 chords.

## Sub-step 1.22 evidence -- the navigation map, the role filter and the generated trails

MASTER_PROMPT's navigation integrity clause lists six things. Step 1 had two
routes and five hand-written hrefs when this sub-step started; it now has one
map, and everything the product offers is declared in it.

**The map.** `config/nav-map.ts` holds five audiences (public, workspace,
platform, client, development), eight blocks, and thirty-nine entries: two live
and thirty-seven planned. The two live entries are the two routes this build
actually serves; the planned ones name the workspace modules, the account
modules, the platform console, the client portal and the public site that later
steps build, and they carry no `href` field at all - the type is what keeps a
destination out of the file until the page exists, which is the one mistake a
navigation file makes that review never catches. Functions: `navigationFor`
(sections plus the bottom-bar entries for one audience and one role),
`activeHrefFor` (exact match first, then the longest registered ancestor at a
segment boundary, so `/invoices/1042` belongs to `/invoices` and
`/invoices-archive` belongs to nothing), `breadcrumbsFor` (the trail, current
item as text and ancestors as links, or no trail at all for a path the map does
not know), `liveEntriesFor`, `plannedEntriesFor` and `publishedHrefs`.

**The seam.** `components/navigation/use-navigation.ts` is the only place that
joins the map to `usePathname`, and
`components/navigation/shell-navigation.tsx` renders the rail and the bottom bar
into the shells' existing slots. Both live outside `components/layout/`, because
`check:layout-shells` fails any module in that directory that imports the map or
reads a request header: the surfaces stay presentational and the frame is what
knows who is reading. `app/(dashboard)/layout.tsx` asks the map for the
workspace audience, `app/(admin)/layout.tsx` for the platform one, and each
fills a slot only when the map returns something, so the landmark the shell
paints is never an empty region. The client portal gets no wiring: its modules
are planned, and the map returns nothing for it.

**Surfaces.** `SidebarNav` and `BottomNavigation` gained an `ownsLandmark` mode
(false where the shell's slot declares the landmark, so the reader gets one
navigation region rather than two nested ones) and `SidebarNav` now renders
nothing at all when it has no entries and no header. `Breadcrumbs` marks the
item without a destination as the current page instead of the last item in the
list, which is what lets a trail stop short of the page it is drawn on.

**Copy.** A ninth catalogue namespace, `nav` (45 keys: eight section headings,
twenty-seven module names and ten public-site labels), registered in
`lib/i18n/strings/en.ts` by appending one import, one entry and one re-export
line. Seventeen more `shells.*` keys cover the specimen's map section.

**The audit.** `scripts/checks/nav-map.mjs` (the twenty-third check) verifies,
from source: the module's public surface; every block's audience and heading
key; unique entry ids; catalogue keys that exist; a planned entry with no href
and a live entry with one; an internal href; one destination published once;
role lists made of real roles, empty only for public pages and never on a page
that requires no session; parents that exist; the primary cap of five per
audience; **every route registered** (development routes in the development
block, product routes anywhere in the map); the development audience asked for
only under `app/(dev)/`; no destination written into the navigation chrome
(`components/layout/` and the route-group layouts); no role filtering anywhere
but the map; the hook being a client module that reads the path and filters the
map; the wiring rendering both surfaces with `ownsLandmark={false}`;
`ownsLandmark={false}` appearing nowhere else; and each layout asking for its
own audience and gating on a non-empty menu. `check:dead-links` reads the map's
literals, so the two destinations it publishes are the two it verifies, and the
first entry a later step adds with no page behind it fails the gate.

**Controls.** Twenty-three negative controls, one per new rule, each patched,
required to fail with the message the rule promises, and reverted: planned
entry with an href, unknown label key, duplicate id, unknown role, gated module
with no roles, missing audience block, six primary entries, unknown parent,
duplicate destination, an unregistered route, an unexported function, an href in
a layout, a component filtering by role, the development audience in a product
module, `ownsLandmark={false}` in the specimen, one surface wired and not the
other, a layout whose gate is not the map, a layout asking the wrong audience, a
surface importing the map, an empty rail that no longer drops itself, a
registered trail rendered as a link, a trail drawn for an unknown path, a
planned label inside a navigation landmark, and a reader row filtered by the
wrong role. All fired; all reverted.

**Rendered evidence.** `docs/EVIDENCE/step-01/shell-probe.py` gained a tenth
section, and the specimen gained three sections that render what the map
publishes. Measured in the response: the trail for a registered path is one item,
not a link, claiming `aria-current="page"`; the trail for `/shells/invoice-editor`
is the ancestor as a link with no current claim; the trail for a path the map
does not know renders no trail at all; all twelve audience-and-role rows report
what the map offers them (the owner is offered 15 planned workspace modules,
staff 13, a client 0, and a role outside an audience gets nothing from it); none
of the 37 planned labels appears inside any navigation landmark in the page; and
the specimen's drop box - a rail asked for by an audience the map has nothing
live for - renders no landmark and no anchor. Four probe controls (two entries
claiming the current page, a planned label as an entry name, the offline banner
rendering while online, an entry with no readable name) each failed the probe and
were reverted.

**Production.** `next build` OK, 8 static pages (`/shells` 5.31 kB, `/gallery`
80.4 kB). With `next start` on port 3020: `/`, `/shells`, `/gallery`,
`/dashboard`, `/admin` and `/client-portal` all answer 404, and none of those
responses carries a top bar, a map table or a specimen label.

**Not verified, and not claimed.** There is no browser dependency in this build,
so the drawer's focus trap, computed safe-area padding and keyboard traversal are
not measured: the panel is a Radix portal, verified in source by
`check:layout-shells`, and the device insets are verified as the four variables
and the eight utilities the probe reads out of the compiled stylesheet. Lighthouse and the public-site dead-link inventory stay
deferred to segment 1D.

**Gates.** `npm run verify`: `RESULT: PASS (23 of 23 checks passed)`.
`check:i18n-strings`: 9 namespaces, 391 keys. `check:dead-links`: 2 routes, 2
verified links, 0 dynamic. `check:design-tokens`: 142 files, 439 class lists.

## Sub-step 1.21 evidence -- the navigation surfaces and the device insets

Nine components in `components/layout/`, one entry model, and the safe-area
tokens the pinned bars consume. Rendered on the specimen page as a new
"Navigation surfaces" section: the top bar with the drawer trigger and the
breadcrumb trail, the rail, the bottom bar, the footer, the sticky action bar
and the offline banner's honest absence.

**One entry model.** `nav-items.ts` describes an entry once - id, href,
catalogue key, optional icon, optional description, reserved flag - and resolves
it for rendering; `nav-link.tsx` is the only place an anchor is built, so
`aria-current="page"` has exactly one owner and the icon is `aria-hidden` in one
place instead of five. Active state is derived per render from an `activeHref`
the caller passes, and the match is exact rather than by prefix: `/invoices`
must not make `/invoices-archive` look current. Labels are catalogue keys typed
as the catalogue's own union, so a surface that names a string nobody wrote
fails the type check.

**Four surfaces, one contract.** The rail (`sidebar-nav.tsx`) is 16rem from the
layout width scale, hidden below the medium breakpoint and scrolls internally so
the entries above stay reachable; the drawer (`mobile-drawer.tsx`) is the same
entries in the project's Sheet primitive, which is a Radix Dialog and therefore
brings the focus trap, Escape handling and a required title; the bottom bar
(`bottom-navigation.tsx`) caps at five named items (`BOTTOM_NAVIGATION_MAX_ITEMS`)
and lays its columns out from the entry count rather than a fixed five, so a
workspace with four modules does not leave a dead column; the trail
(`breadcrumbs.tsx`) is a labelled `nav` around an ordered list whose last item is
the current page and is not a link.

**The device edges are tokens, not numbers.** `SAFE_AREA_TOKENS` in
`config/design-tokens.ts` declares `--safe-{top,right,bottom,left}` as the
browser's own `env(safe-area-inset-*, 0px)`, `styles/globals.css` declares them,
and `check:design-tokens` requires the set to stay complete. The bottom bar
consumes the bottom inset, the action bar adds its own padding to it, the sticky
top bar consumes the top inset, and the drawer - which opens from the leading
edge - consumes the leading inset. A component may not read `env()` itself; the
check fails it. The layout width scale also gained `page` (72rem), because the
footer's content column had nowhere to stop growing.

**The action bar is sticky, not fixed.** It is the last child of the form column
and sticks inside it, so it cannot cover the page or the last row of the form.
The offline banner subscribes to the browser's connectivity with
`useSyncExternalStore`, which is what makes the first client paint already
correct instead of flashing "online" for one frame before admitting otherwise;
its server snapshot is deliberately "online", since a server render has no
connection to report on.

**Verification.** `npm run verify`: RESULT PASS (22 of 22). `check:layout-shells`
grew to read the surfaces as a set: every surface must carry its `data-layout`
marker, every navigation landmark must have an accessible name, entries render
through `NavLink` (a surface that grows its own anchor fails), `aria-current`
must be derived and never a literal, every anchor carries its own `min-h-touch`
(a target on a wrapper fails), pinned bars must consume `var(--safe-bottom)` and
may not use fixed positioning, the drawer must be controlled, must open from the
leading edge, must consume `var(--safe-left)`, must close on navigation through
`onNavigate`, and no module in the directory may reach into the DOM
(`querySelector`, `.click()`), read `next/headers` or import `config/nav-map`.
Fourteen negative controls were run and reverted, eleven against the new rules
including one that puts `min-h-touch` in a comment while removing the class -
the check reads code, not prose.

**Rendered evidence.** `docs/EVIDENCE/step-01/shell-probe.py` gained a ninth
section that reads the server's response and the loaded stylesheet: each
navigation has its own name, exactly one entry inside it claims the current page,
each entry has a readable name and the 44 pixel class, the reserved entry appears
nowhere, the pinned bar consumes the bottom inset, the action bar is a named
group that is sticky and print-hidden, the top bar's header owns `sticky top-0`,
`z-sticky` and the top inset, the drawer trigger is named and announces a dialog,
the legal line composes the year, and the page holds no offline banner while the
browser reports a connection. Then the compiled chain: the four inset variables
declared from `env()`, the rail width, the page width, the 44 pixel step, both
inset paddings, the 12 pixel bar label, the bar's column layout and the
medium-breakpoint hiding. Eight negative controls were run against the probe: no
entry current, two entries current, the reserved entry rendered, the bar's inset
removed, a rail link losing its target, the legal line losing its parameter, the
drawer trigger losing its name, and the banner rendering for an online reader.
All eight turn it into a FAIL.

The probe also caught two defects during the sub-step that no source check could
see: the breadcrumb anchors were 44 pixels tall only on their list item (the
class sat on the wrapper), and the footer's legal line passed `count` to a
template whose placeholder is `year`, which the strict runtime turns into a
thrown error rather than a row of braces. Both were fixed, and the first of them
is now a check rule of its own.

**Honest limits.** The drawer panel mounts into a portal when it opens, so it is
not in the server-rendered markup: the probe measures the trigger and the check
verifies the panel's contract in source (side, controlled state, named landmark,
leading inset, close-on-navigate), while the focus trap itself is inherited from
the Radix Dialog primitive. No browser dependency exists in this build, so
computed styles at 320px and keyboard traversal are not measured; what is
measured is the markup the CSS selects on and the compiled CSS behind it.

**Production.** `next build` OK, 8 static pages (`/shells` 5.31 kB). With
`next start` on port 3020: `/`, `/shells`, `/gallery`, `/dashboard`, `/admin`
and `/client-portal` all answer 404 with zero occurrences of the specimen title,
`data-shell`, `main-content`, `super_admin`, the platform band or the navigation
section heading.

## Sub-step 1.20 evidence -- role-aware shells for the three signed-in and tokenized audiences

Delivered the three remaining route-group shells, the framing data they render
from, the slot contract sub-step 1.21 fills, and the one seam through which a
layout will ask who the reader is.

**The frame is data.** `components/layout/role-framing.ts` describes what each
of the six roles of the role model sees around the content: audience, whether a
persistent band is shown, which approval notice applies, whether navigation
exists at all. Copy is referenced by catalogue key typed as the catalogue's own
union, so a frame that names a string nobody wrote fails the type check.
`components/layout/role-frame.tsx` renders the band and the notice; the
platform band uses the warning surface pair and the notice uses the muted pair,
both already verified contrasts. The band is hidden in print: a customer's
invoice must not carry a line reading "platform administration".

**Three shells, three briefs.** `dashboard-shell.tsx` is the tenant workspace:
quiet chrome, no band for the owner, the approval notice for the owner's staff,
because that reader is the one whose work is reviewed. `admin-shell.tsx` is
platform administration: a persistent band on every screen, because the mistake
it prevents - acting on a tenant's records while believing you are in your own
workspace - cannot be undone by a toast. `client-portal-shell.tsx` is the
tokenized client: no navigation of any kind, one column at the document
measure, and a single slot for the tenant's own header, because white-label
tenants put their own branding there (A11, 11.5).

**Navigation is gated by the frame, not by the caller.** `shell-slots.tsx`
renders the four slots 1.21 needs (top bar, sidebar, footer, mobile bottom bar)
and refuses to paint the two navigation slots unless the frame allows
navigation. An unresolved reader therefore gets landmarks and content and no
menu, even if a caller hands one in: the links would lead to routes that refuse
the request, which reads as a broken product rather than as a session that
ended. Nothing about this is authorization - a menu is not a permission - but
failing closed in the frame costs nothing and removes a class of confusing
screens.

**The seam.** `components/layout/session-role.ts` is the single place a layout
asks who the reader is. In development it answers the lowest-privilege role of
the group's audience (staff for the workspace, admin staff for platform
administration), because a preview that ran as the owner or the founder would
show the developer the frame almost nobody sees. Outside development it answers
null. Step 3 replaces the body with the session read and nothing else changes.
The seam never previews the client role, because that audience has no session
to preview.

**The print base moved to the root.** `styles/print.css` is now imported once,
by `app/layout.tsx`, instead of by each group layout. Every group can be
printed for a reason - an invoice from the workspace, a receipt from the client
portal, a pricing page from the public site - and a base every group must
remember to include is a base some group will one day omit. `check:layout-shells`
now requires the root layout to import it and forbids a route-group layout from
importing it a second time.

**Verification.** `npm run verify`: RESULT PASS (22 of 22). `check:layout-shells`
grew to cover five shells and five route-group layouts, and the framing rules
with them: every role of the role model is framed and no role is invented;
every copy key a frame names is checked against the catalogue files; each
audience's group must render the shell the table gives it; the client frame must
declare `hasNavigation: false` and its shell must accept no navigation slot;
every role-aware shell must publish the role and audience on its root element;
and the seam must fail closed, must not preview a privileged role, and must not
preview the client role.

Eight negative controls, each run and reverted: a role deleted from the table; a
frame naming a key no namespace declares; the seam previewing as the super
admin; the seam losing its null branch; the client shell gaining a sidebar; the
admin group rendering the dashboard shell; the frame no longer gating
navigation (the unresolved reader then showed a menu); the client portal
rendering a navigation landmark.

**Rendered evidence.** `docs/EVIDENCE/step-01/shell-probe.py` now measures the
specimen page per shell rather than in aggregate: 9 shells rendered, each with
exactly one skip link carrying the catalogue label, one focusable main landmark
before which the skip link is the only focusable element, and the skip link
before the landmark inside its own block. Then the framing table, one row per
reader, read from the copy the reader actually sees:

| role        | shell         | band | notice             | navigation |
| ----------- | ------------- | ---- | ------------------ | ---------- |
| owner       | dashboard     | no   | no                 | yes        |
| staff       | dashboard     | no   | staff notice       | yes        |
| super_admin | admin         | yes  | no                 | yes        |
| ceo         | admin         | yes  | CEO notice         | yes        |
| admin_staff | admin         | yes  | admin staff notice | yes        |
| client      | client-portal | no   | no                 | no         |
| unresolved  | dashboard     | no   | no                 | no         |

Three more negative controls were run against the probe: the owner given the
staff notice, navigation gating removed, and a navigation landmark inside the
client portal. All three turn it into a FAIL.

**Production.** `next build` OK, 8 static pages. With `next start`: `/shells`
404 at 7,196 bytes with zero occurrences of the page title, `data-shell`,
`main-content` or the framing copy; `/gallery` unchanged at 404 / 6,172 bytes;
`/dashboard`, `/admin` and `/client-portal` answer 404 because they have no
pages yet, and the layouts themselves emit no route. The development group
stays invisible in production.

## Sub-step 1.19 evidence -- layout shells, focus order and the print base

Delivered two route-group shells, the four components they are built from, the
print base, and a development-only specimen page that renders both shells with
a document inside them.

**Structure.** `components/layout/skip-link.tsx` is the first focusable element
of every shell: visually hidden until focused, then drawn over the page corner
at the 44px touch height with the focus ring from the token set. Its label comes
from the catalogue (`common.label_skip_to_content`, added in 1.12 and unused
until now) and its target comes from `MAIN_CONTENT_ID`, the constant exported by
`components/layout/main-content.tsx`, which is the only place a `<main>`
landmark is declared. That element carries `tabIndex={-1}`, without which the
browser moves the fragment target but not the focus, and the skip link leaves
the reader exactly where they started. `public-shell.tsx` wraps a full-height
column that prints as a flow; `auth-shell.tsx` centres one panel of at most
`max-w-dialog` (32rem, from the layout width scale) with the brand mark above
it and no navigation at all, because an auth page has exactly one task.
`app/(public)/layout.tsx` and `app/(auth)/layout.tsx` are thin: they render the
shell and import the print base.

**The print base** is `styles/print.css`, and it is five decisions rather than a
list of tweaks:

1. _Paper is not a theme._ The sheet is white and the toner is black, so the
   semantic roles are remapped onto a fixed paper palette for `:root`, `.dark`
   and every pinned theme scope. A reader in dark mode who prints an invoice
   gets black on white, which is what makes the document usable rather than a
   cartridge accident.
2. _Chrome does not print._ `nav`, `button`, dialogs, menus, tooltips, Radix
   popper wrappers and anything marked `data-print="hide"` are hidden. Blocks
   marked `data-print="only"` exist for paper alone, so a document header or a
   signature line has somewhere honest to live.
3. _A row is not split across sheets._ `thead` repeats, rows, figures, tables
   and headings are kept whole, and headings stay with what they introduce.
4. _Meaning survives without colour._ Anything marked `data-print="outline"`
   keeps an ink border, because a status carried only by a fill prints as blank
   paper.
5. _Links keep their underline, motion stops, shadows disappear._

**The paper palette** is part of the token module, not the stylesheet:
`PRINT_TOKENS` (paper, ink, muted ink, rule), `PRINT_ROLE_MAP` (the 23 semantic
roles and the print token each one takes), `PRINT_CONTRAST_PAIRS` and
`PRINT_PAGE_MARGIN_MM`. The variables are declared in `styles/globals.css`
`:`root`` so the token check verifies them in both directions exactly like a
theme role, and `scripts/checks/color-contrast.mjs` now verifies the paper
palette too: 4 tokens and 3 ratios, with ink on paper held to the 7:1 AAA
threshold because paper has no backlight. The `tokens:export` JSON gained a
`print` group (11 groups, 24,310 bytes).

**Verification.** `npm run verify`: RESULT PASS (22 of 22). The new
`check:layout-shells` is the seventeenth rule check and it holds the shell
contract statically: the skip link and the landmark share one id and neither
may write it as a literal, the link comes before the landmark in every shell,
the landmark must be focusable, no route under a layout group may declare its
own `<main>`, both route layouts import the print base, the `@page` margin must
equal `PRINT_PAGE_MARGIN_MM`, and every role in `PRINT_ROLE_MAP` must be
remapped in the paper block. It reads code with comments stripped for the
structural rules and the raw source for the string rules, because a check that
reads comments can be satisfied by prose.

Six negative controls, each run and reverted: a literal target id fails; removing
`tabIndex={-1}` fails (and only after comments are stripped, which is how that
rule was found to be vacuous); dropping one role from the paper block fails; a
raw hex colour in the print base fails; a page margin that drifts from the token
fails; moving the skip link after the landmark fails. Two more controls were
run against the probe below.

**The rendered evidence** is `docs/EVIDENCE/step-01/shell-probe.py` (run by
hand against `http://127.0.0.1:3000/shells`, never wired into verify). It reads
the response the server sends and reports: 2 skip links pointing at
`#main-content`, 2 main landmarks each carrying the id and `tabindex="-1"`,
exactly 1 focusable element before the first landmark (the skip link itself),
1 `@media print` block in the loaded stylesheet with the chrome rule, the
button rule, the print-only rule, the ink outline rule, the row-break rule and
the 16mm page margin, the four paper palette values equal to the token module,
and the print markers intact in the markup. Result: PASS. Two negative controls
against it: removing the button rule from the print base and dropping
`data-print="outline"` from the specimen both turn it into a FAIL.

**Print behaviour is not print-preview-verified.** No browser is available in
this repository by design, so the probe proves that the rules and the markup
they select on both arrive in the response, not how the sheets come out of a
printer. That limitation is recorded here rather than glossed over; the
document-level print rules (invoice templates, page numbering) belong to the
steps that build those documents.

**Production guard.** `next build` OK, 8 static pages (`/shells` 1.14 kB, 112 kB
first load). With `next start`: `/shells` answers 404 at 7,196 bytes - the same
size as the generic not-found page - with zero occurrences of the page title,
the specimen copy, `main-content` or `data-print`. `/gallery` is unchanged at
404 / 6,172 bytes. The development group stays invisible in production.

**Also in this commit:** the comment in `app/layout.tsx` that promised brand
typefaces in sub-step 1.18 was wrong - no font is delivered in step 1 - and now
records the truth: the families are system stacks pointed at by
`--font-sans` and `--font-mono`, and a self-hosted face has to arrive with
subsetting and a preload (MASTER_PROMPT performance requirements, sub-step
16.9) rather than as a build-time download. No behaviour changed with it.

## Sub-step 1.18 evidence -- brand pack, social image and brand voice

Delivered the whole brand pack as generated artefacts, not uploaded files.
config/brand.ts is the single source of truth: the mark geometry on a 32 unit
grid (capsule strokes, one stem and two arms for the K, one stem and one bowl
for the D, stroke width 3.4), three variants described as colour-role
references rather than values, the asset list, the ICO sizes and the social
image dimensions. Not one colour literal exists in any asset; every one of them
is a `{role, theme}` reference resolved through the token palette, which is what
makes a palette change reach the favicon without anyone re-exporting it.

Nine assets are generated by scripts/generate-brand-assets.ts and committed:

| Asset                              | Size          | Variant            |
| ---------------------------------- | ------------- | ------------------ |
| app/favicon.ico                    | 16, 32, 48    | plate icon         |
| app/icon.png                       | 512           | plate icon         |
| app/apple-icon.png                 | 180           | plate icon         |
| public/brand/logo-light.svg        | 32 grid units | glyph, foreground  |
| public/brand/logo-dark.svg         | 32 grid units | glyph, foreground  |
| public/brand/logo-icon.svg         | 32 grid units | plate and glyph    |
| public/icons/icon-192.png          | 192           | plate icon         |
| public/icons/icon-512.png          | 512           | plate icon         |
| public/icons/icon-maskable-512.png | 512           | plate fills square |

The tenth artefact is the default social image, built rather than uploaded.
MASTER_PROMPT places it at lib/seo/og-image.ts; it composes a 1200 by 630
ImageResponse from the same geometry and the same tokens, embeds the mark as
an SVG data URI and draws the product name and description from the catalogue.
It is measured, not committed, and it has no URL yet on purpose: metadata
belongs to the public routes, and the only page in the build is the
development gallery, which must leave no trace in a production response. The
route that mounts it lands with the public site in segment 1D.

The brand voice guide is docs/BRAND_VOICE.md: who is being written to, the
four voice words in priority order, tone by context, the words this product
uses and the words it avoids, partner naming, money and date voice, sentence
shapes, long form against short form, the wording rules that accessibility
adds, and a review checklist. docs/COPY_RULES.md keeps its own role: it defines
what a valid string is, the voice guide defines how it sounds.

Verification, `npm run verify`: RESULT PASS (21 of 21 checks passed), exit code 0. check:brand-assets is the new entry (the sixteenth rule check) and it holds
four lines: the nine assets exist and are current with a fresh render; no
unmanaged file sits in a generated directory; every colour in every SVG is a
palette colour; and the rendered pixels are measured through
scripts/brand/verify-generated.ts, which imports the same renderer the
generator uses. The pixel layer asserts the ink is centred on both axes, stays
clear of the canvas edge, fills 46 to 62 of 64 pixels, shows three ink runs on
the midline (K with its arm, D stem, D bowl), keeps the plate opaque and its
corners transparent, and that the 16 pixel tab icon still shows both letters.

Three defects were found and fixed by that measurement layer, which is why it
exists:

1. The first rasteriser drew in grid units on a pixel plane. Every icon carried
   the monogram in its top left corner at a sixth of its size. The pixels were
   the only thing wrong; nothing in any file looked incorrect.
2. The mark was centred by its coordinates rather than by its ink. Half the
   stroke width sits outside the geometry, so it sat visibly low and left.
3. At 16 pixels the design padding of 4 units cost a quarter of the square and
   the monogram became a smear. The two smallest ICO sizes now take a tighter
   documented margin (BRAND_SMALL_ICON_MAX_SIZE, BRAND_SMALL_ICON_PADDING).

Negative controls, each run and then reverted: a hand-edited SVG colour fails
on the palette rule and on currency; moving the D stem two units fails on
centring; a stroke width of 10 collapses the midline to one run; removing the
small-icon margin fails on currency; a flat social image fails with three
distinct byte values; shrinking OG_IMAGE_WIDTH fails on the network crop size.
The check is not decoration.

The component gallery gained a brand section (app/(dev)/gallery/showcase-brand.tsx)
so the mark is exercised in all five theme scopes: 25 glyph renders and 5 plate
renders in the rendered page, each with the size ladder 16, 24, 32 and 48, the
named variant, and the four generated files fetched by URL. Both segment 1B
probes still pass after the change: the style probe reports 0 class tokens
without CSS and 0 raw values across 80 files, and the DOM probe reports 26
markers per scope in all five scopes with 0 accessible-name issues.

Production build, `next build`: OK, 7 static pages. The brand pack is now part
of the response head: `/favicon.ico` (16x16) and `/icon.png` (512x512) are
linked, and `/icon.png`, `/apple-icon.png` and `/brand/logo-light.svg` all
serve 200 in development. The development gallery still answers 404 in
production at 6,172 bytes with zero traces of the page (the growth from the
5,473 bytes recorded at the 1B gate is the two icon links the brand pack adds
to every head, not page content).

## Sub-step 1.17 evidence -- form primitives and the component gallery

Delivered the shared form layer and the component gallery the 1B segment gate
asks for.

The shared layer is four components and five library modules:
components/shared/form-wrapper.tsx (the four states, the one-time token, the
submit lock), form-field.tsx (label, hint, error and control wired by id and
aria-describedby, with the error as a live region), form-error-summary.tsx
(every invalid field as a link, focus moved to the summary when a submission is
refused) and submit-button.tsx (disabled and aria-busy while submitting, the
pending label announced). lib/forms/ holds the field rules built from the
validation catalogue, the error mapper, the response reader, the one-time
token client and the field id helper; lib/hooks/use-zod-form.ts is the single
React Hook Form entry point, because validate on blur, revalidate on change,
first error only and focus the first invalid control are platform defaults that
a caller cannot be trusted to repeat.

Two rules are enforced in code rather than promised. Every submission carries a
one-time token (MASTER_PROMPT item 11): the server render mints it, the
submission sends it in the x-csrf-token header, spends it as the request
leaves, and installs the replacement from the response header or body, so a
replayed request carries a spent token. The server half lives in the request
pipeline (lib/middleware/csrf.ts, sub-step 3.4). And no parser text can reach a
user: a message is displayed only when it is a sentence in the validation
catalogue, otherwise the mapper substitutes the catalogue sentence for that
kind of failure. That is what closes the gap the catalogue leaves open, since
the validation strings carry no {min} or {max} placeholders and a Zod default
message is not copy.

The gallery renders the same full component set five times, once per pinned
scope, and it is the last piece of the gate. The scopes are new blocks in
styles/globals.css (.theme-light, .theme-dark, .theme-hc-light,
.theme-hc-dark and .theme-reduced-motion), and both token checks were extended
so a scope cannot drift: color-contrast now verifies all eight blocks against
config/design-tokens.ts token by token (4 themes, 23 roles, 76 ratios, with
negative controls proving that a changed --background in one scope and a
changed duration in the reduced motion scope both fail the check), and
design-tokens verifies the reduced motion scope sets every duration to its
reducedValue and collapses animation and transition for its descendants. The
route exists in development only: app/(dev)/layout.tsx calls notFound()
outside the development environment, so a production deployment answers 404 and
cannot be read as a component inventory.

Evidence, in the order it was produced:

- `npm run verify` PASS 20/20. Counts at this sub-step: i18n-strings 32 JSX
  files / 7 namespaces / 257 keys; design-tokens 96 source files / 197 class
  lists; color-contrast 4 themes / 23 roles / 76 ratios, now over 8 blocks;
  any-types 79 TypeScript files; secrets 154 files.
- Compiled CSS probe (/tmp/probe/gallery-css-probe.mjs): 243 class tokens
  across 36 files (components/ui, components/shared, lib/hooks, app/) with 0
  tokens that produce no CSS, 0 of 6 negative controls compiling (w-72, w-40,
  min-w-40, max-w-64, gap-72, mt-72 are off this project's replaced spacing
  scale and exist in no stylesheet) and 25 declaration expectations passing,
  including .sr-only, the fieldset reset, aria-[invalid=true] borders and the
  destructive error fill. The probe found and fixed its own bug on the way: it
  only collected className expressions, so a plain className="sr-only" was
  invisible to it and the first run reported the visually hidden live region
  missing.
- Rendered gallery probe (/tmp/probe/gallery-dom-probe.py) against
  `next dev`: 26 markers per scope across all five scopes, with identical
  inventories in every scope (checkbox 4, switch 1, radio 2, combobox 2,
  textarea 3, label 20, tablist 1, tab 2, button 35, table 1, caption 1,
  skeleton 5, badge 12, fieldset 1, submit 3, aria-invalid 3, role=alert 4,
  aria-live=polite 6, aria-busy 4, sr-only 1, dialog/sheet/popover/menu/
  tooltip triggers 1 each, toast viewport 1). 0 findings.
- `npx next build`: compiled successfully, 4 of 4 static pages, /gallery
  prerendered. Production guard proven with `next start`: GET /gallery returns
  HTTP 404 and 0 scope markers, so the gallery is absent from a production
  deployment.
- Negative control for the segment gate rule "no hardcoded color or spacing
  outside tokens": `bg-[#ff0000] p-[13px]` injected into
  app/(dev)/gallery/theme-scope.tsx fails check:design-tokens with 3 findings
  (arbitrary Tailwind value, arbitrary Tailwind value, raw color literal);
  restored, check PASS.

Two defects found in already committed layers, both fixed at the source rather
than worked around:

1. `tPlural` could not be called correctly. Its parameter was typed as an
   ordinary catalogue key, but the base of a plural pair is never a key of its
   own, so the first real caller (the error summary) failed to type check.
   lib/i18n/types.ts now derives EnglishPluralKey from the catalogue and
   requires the _other member to exist, so `tPlural('forms.error_summary_title',
n)` compiles and a key without a pair does not.
2. check:money-math read the slash of a self-closing JSX tag as division:
   `<ShowcaseFeedback />` matched "money identifier followed by an operator"
   because the component name contains "fee". The check now excludes the
   self-closing and closing tag forms and still reports `{total / 2}`.

One dependency change: react-hook-form 7.90.0 and @hookform/resolvers 5.9.1.
The repository's pre-commit hook also had to learn one thing: next-env.d.ts is
generated by Next.js and sits in the ESLint ignore list, so lint-staged now
uses `!(*.d).{js,jsx,mjs,ts,tsx}` and no longer hands a declaration file to the
linter.

## Sub-step 1.16 evidence -- shadcn/ui primitives B

Delivered ten primitives (dialog, sheet, popover, dropdown menu, tabs,
tooltip, toast, table, skeleton, badge) plus lib/hooks/use-toast.tsx, which
holds the toast queue in a reducer behind a provider rather than in a module
level array: a module level queue would be shared by every request the same
Node process handles, so one tenant could see another tenant's notification.
The queue is also capped, because an unbounded list is a slow leak in a long
lived tab.

Layering is the point of this sub-step and is verified by compiled CSS:
backdrop z-overlay (50), panel z-modal (60), menu z-dropdown (70), popover
z-popover (80), tooltip z-tooltip (90), toast z-toast (100). A select opened
inside a dialog, and a tooltip opened from a control inside a popover, both
resolve without a special case.

Panel widths became tokens. Width utilities in this project come from the
spacing scale, so w-72, min-w-40 and max-w-64 produced no CSS at all: those
classes exist in default Tailwind only because of the default scale that this
project replaces. LAYOUT_WIDTH_TOKENS now defines menu (10rem minimum),
popover (20rem), tooltip (16rem maximum), dialog (32rem maximum) and sheet
(24rem maximum), wired through theme.extend width, minWidth and maxWidth so
the Tailwind defaults (fractions, auto, full) stay available. The token check
verifies every width has a unit and documents its usage, and the export
includes the group.

Evidence:

- Class compilation probe: 205 class tokens across 19 files, compiled with
  Tailwind against exactly those files. Zero tokens produced no CSS. Twenty
  four declaration expectations verified, including the six layer positions,
  the dialog fraction width with a token ceiling, the sheet fraction width,
  the named panel widths, the slow motion token and the enter curve on overlay
  panels, the 44px table header row, badge pills with the xs text step and the
  skeleton pulse. Negative controls confirm p-7, gap-7, h-13, text-mdup,
  z-9999 and the retired calc-based width generate nothing.
- DOM render probe: 70 assertions in jsdom (installed outside the repository,
  never a dependency of it), mounting the real components through react-dom
  client rendering so portals, focus movement and keyboard handling actually
  run. Verified: the dialog is labelled and described by its title and
  description, it is portalled, focus moves inside on open and returns to the
  trigger on Escape, and the page behind it is hidden from assistive
  technology while open and reachable again after close; sheet variants pin
  the panel to the left edge with a fraction width; the menu opens on
  ArrowDown, exposes role menu with two menuitem children, focuses the first
  item, moves with ArrowDown, marks the destructive item, closes on Escape and
  returns focus; the popover reports aria-haspopup dialog and keeps its
  content interactive; the tooltip appears on keyboard focus and is wired to
  its trigger through aria-describedby; tabs expose tablist, tab and tabpanel
  roles, keep arrow navigation working and hide the inactive panel; the toast
  announces itself as a status inside a live region with a catalogue labelled
  dismiss control; badges are spans with the semantic role pairs; skeletons
  are hidden from assistive technology; table headers scope their column and
  the wrapper scrolls.
- Rule probes: a literal aria-label in toast.tsx fails check:i18n-strings; a
  raw hex color and an arbitrary pixel value in skeleton.tsx fail
  check:design-tokens with three findings. Both reverted.

Two wrong assumptions were caught by the DOM probe instead of being shipped in
this handoff: Radix does not emit aria-modal (it hides the background, which
is the stronger guarantee and is what the probe now asserts), and
popper-positioned content is wrapped in a positioning div, so "portalled"
means outside the application root rather than a direct child of body.

Open item recorded here and resolved in 1.17: the component gallery route did
not exist at 1.16. It needed a root layout, so it was planned for 1.17 together
with the form primitives it must display. Sub-step 1.17 delivered it
(app/(dev)/gallery/, development only, with app/layout.tsx as the root shell);
the segment gate check runs against it now.

npm run verify at b5bb363: RESULT PASS (20 of 20 checks passed).

## Sub-step 1.15 evidence -- shadcn/ui primitives A

Delivered eight primitives in components/ui: button (six variants, four
sizes, asChild), input, textarea, label, checkbox, radio group, select and
switch, plus the ui string namespace for accessible names that have no
visible text. Dependencies added: the six Radix packages, class-variance-
authority and lucide-react.

Review-grade decisions recorded in the files themselves:

- Touch targets. Default and lg controls are 44px and 48px tall and the icon
  button is 44x44. The sm step (36px) exists for pointer-driven dense
  toolbars. A control whose visible shape must stay small gets its 44x44
  pointer target from a pseudo-element whose content is the empty string, so
  the target grows while the box, the check mark and the switch track look
  unchanged.
- Text sizes. Text a user types or reads as content is 16px, because an input
  below 16px makes iOS Safari zoom the viewport on focus. Button labels are
  14px: a button never receives text input and never triggers that zoom.
- Focus. No primitive sets outline-none anywhere. The indicator comes from the
  global :focus-visible rule, which the contrast check already holds at 3:1 in
  all four themes against both the page and the card surface.
- Select layering uses the z-dropdown layer, above a modal, because a select is
  often opened inside a dialog. The content width and maximum height come from
  the variables Radix measures, never from a raw pixel value.
- Radix Select emits the combobox pattern (role combobox, aria-expanded,
  aria-autocomplete) rather than aria-haspopup, and renders a hidden native
  select so the value still submits inside a plain form. Both were verified in
  the rendered markup rather than assumed.

Two defects found by the evidence runs, both fixed in the code:

- aria-invalid:border-destructive produced no CSS at all. Tailwind 3.4 ships
  aria variants for busy, checked, disabled, expanded, hidden, pressed,
  readonly, required and selected, and invalid is not one of them, so the
  invalid styling was silently dead. The primitives now use the arbitrary
  variant aria-[invalid=true]:border-destructive, which compiles to
  [aria-invalid="true"] and matches what React renders.
- The first probe run asserted an aria-haspopup attribute the library does not
  emit, which would have shipped a wrong claim in the handoff; the assertion
  now matches the real contract.

Evidence:

- Class compilation probe: 121 class tokens collected from the eight files with
  the TypeScript API, compiled with Tailwind against exactly those files as
  content. Every token produced CSS, so no class name is a typo or an
  off-scale step. Sixteen declaration expectations verified, including h-11
  equals 44px, size-11 equals 44x44, the checkbox hit area is inset -14px, the
  switch hit area is -10px vertically, the switch thumb travels 20px, the
  textarea floor is 64px, aria-[invalid=true] borders with destructive, the
  empty-content pseudo-element renders, and the select content sits at z-index 70. Negative controls confirm p-7, min-h-20, text-mdup, h-13 and gap-7
  generate no CSS at all.
- Render probe: 70 assertions over server-rendered markup. Button type,
  variants, sizes, asChild and disabled; input type passthrough, autocomplete,
  aria-invalid, disabled and the 16px text; textarea rows and resize policy;
  label for attribute; checkbox role, aria-checked false/true/mixed and
  data-state; radiogroup role with two radio items and checked state; switch
  role with both states; select combobox role, aria-expanded, the hidden native
  select and the catalogue placeholder text. Catalogue scroll_up and scroll_down
  resolve.
- Rule probes: a literal aria-label in select.tsx fails check:i18n-strings with
  two findings; p-[13px] and bg-[#ff0000] in checkbox.tsx fail
  check:design-tokens with three findings. Both reverted.

Note for 1.16: the segment gate asks for a component gallery route that renders
every primitive in light, dark, high contrast and reduced motion. The route is
not created in 1.15 and belongs to 1.16 or 1.17, and the select content cannot
be server-rendered because Radix renders it in a portal, so the gallery is what
will show it.

npm run verify at cdba8d2: RESULT PASS (20 of 20 checks passed).

## Sub-step 1.14 evidence -- design tokens B

Delivered: typography (nine sizes with line height and tracking, four weights,
two font stacks), motion (five durations with a reduced-motion value each and
four easing curves), the palette as 23 semantic roles in four themes (light,
dark, high-contrast light, high-contrast dark), the WCAG contrast contract as
19 enforced pairs, the token JSON export, and two new verify entries.

Palette defects the new check found and forced a fix for, all in the shipped
values rather than in the check:

- light muted-foreground on the muted surface was 4.34:1, below AA. The token
  is now 215.4 16.3% 40% (5.58:1).
- light success surface carried near-white text at 3.00:1 and the warning
  surface at 2.91:1. Success is now 142.1 76.2% 28% with its near-white label
  at 4.72:1, and the warning surface takes a black label at 6.58:1.
- dark destructive as link text on the canvas was 2:1: a dark red cannot be
  both a danger surface under light text and danger text on a near-black
  canvas. The dark theme now uses the tonal pattern, a vivid red 0 72% 60%
  with a black label, which satisfies both directions.
- light and dark input boundaries were 1.23:1 and 1.37:1 against the canvas,
  below the 3:1 requirement for the visible boundary of a control. They are
  now 215.4 16.3% 55% and 217.2 32.6% 45%.
- dark ring against the canvas was 2.98:1, just under the 3:1 focus
  requirement. The dark ring is now the dark primary, 5.44:1.

A silent configuration failure was found and closed while proving the wiring.
Once config/design-tokens.json existed, the extensionless import
'./config/design-tokens' in tailwind.config.ts resolved to that JSON file
inside Tailwind's own config loader: every named import became undefined,
Tailwind fell back to its default scales, and nothing failed - the config
looked correct because it still imported by identifier. The import in
tailwind.config.ts and scripts/export-design-tokens.ts now carries the .ts
extension, tsconfig enables allowImportingTsExtensions, and
check:design-tokens fails any extensionless import of the token module. Proof:
with the extension, @apply p-4 text-base z-modal duration-fast in a probe
stylesheet compiles to padding 16px, font-size 16px with line-height 24px,
z-index 60 and transition-duration 120ms.

Negative probes, each reverted after the run, 24 of 24 caught:

- Contrast: a light text pair below 4.5:1, a high contrast text pair below
  7:1, an HSL triple replaced by a hex value, a role missing from a theme
  (parity), a stylesheet value edited alone, a color variable outside the role
  list, and a dark block missing a role.
- Typography: body size reduced to 14px, a required step renamed, a line
  height below its font size, and a non-ascending scale.
- Motion: reducedValue no longer 0ms, a duration in seconds, a missing easing
  curve, an invented easing value, durations not zeroed in the reduced motion
  block, a renamed reduced motion media query, a forced colors border rule
  replaced, and a focus ring color that is not Highlight.
- Wiring and export: an inline fontSize literal, a missing
  transitionDuration wiring, a removed motion variable, an invented z-index
  layer, and a stale config/design-tokens.json.

Positive control: a probe component using only token classes passes, and
config/design-tokens.json is byte-identical on regeneration.

Design decisions recorded in the token module: large text may use 3:1, but
every text pair is verified at 4.5:1 so the display sizes keep headroom; the
border role is a documented decorative divider, while the input role carries
the 3:1 control boundary requirement; high contrast text pairs must reach 7:1
in both themes.

npm run verify at 6eb05dd: RESULT PASS (20 of 20 checks passed).

## Sub-step 1.13 evidence -- design tokens A

Delivered: config/design-tokens.ts (spacing, radius, shadow and z-index ladders
plus state and motion variables), tailwind.config.ts wired to those exports by
identifier, the --shadow-* and --z-* variables declared in :root and .dark in
styles/globals.css, and scripts/checks/design-tokens.mjs as the 18th verify
entry (package.json, scripts/verify.mjs and the README script row updated).

Negative probes, each reverted after the run:

- p-[13px], z-[9999] and bg-[#ff0000] in a className and in a cn() argument:
  one arbitrary-value finding per bracket value, with duplicates suppressed.
- Hex color in a TS module, an rgb() literal and an inline style with a raw
  margin, color and hex value: raw-value and inline-style findings. The same
  style block with opacity, fontWeight, order and zIndex var(--z-modal) passed,
  so unitless and tokenized properties are not false positives.
- theme.spacing and theme.zIndex replaced by inline literal scales, and the
  token import removed: "must be the SPACING_TOKENS/Z_INDEX_CLASS_MAP
  identifier" plus "must import its scales from ./config/design-tokens".
- Ladder mutations: a duplicate z-index value, a layer moved below its
  predecessor, a renamed spacing step keeping the old value, and a wrong
  spacing value. All reported, and the stylesheet then reported the mismatch
  between --z-popover and the mutated ladder.
- styles/globals.css mutations: --shadow-xl and --z-modal deleted, a bogus
  --z-debug-overlay added. Missing and unknown variables both reported.
- Positive control: a component using cn(), a conditional class, a template
  literal class, token classes and a var(--z-modal) inline value passed with a
  non-zero class-list counter.

Compiled-CSS proof: npx tailwindcss produced p-4 = 16px, px-2.5 = 10px,
h-10 = 40px and z-modal = 60. The off-scale steps p-7, h-7, h-12, gap-7 and
shadow-3xl do not exist because the scales replace Tailwind's defaults instead
of extending them.

npm run verify at 2f25ca8: RESULT PASS (18 of 18 checks passed).

## Working rhythm (owner instruction, effective 2026-10-16)

From this point every sub-step runs under the permission-gated rhythm:

1. Execute exactly one sub-step.
2. Run `npm run verify` and fix every failure.
3. Commit only that sub-step, one sub-step per commit.
4. Update this progress file.
5. Stop and print the three-line prompt: DONE, NEXT, CONTINUE.
6. Wait for the owner to type `continue` before starting the next sub-step.
   Never cross a segment gate.

The next chat starts at the first unchecked sub-step and follows the same
rhythm from there.

## Session notes

**Sandbox git rollback (2026-10-16, before the 1C gate).** The sandbox `.git`
returned to the branch point `cca1d8d` between turns while the working tree kept
every file, and `node_modules` was dropped with it. Recovery, in order, and worth
repeating exactly: `git fetch origin`; confirm the remote tip
(`git ls-remote origin arena/b7780282-kd`); prove the working tree is identical
to the pushed commit before restoring anything (`git add -A` then
`git diff --cached refs/remotes/origin/arena/b7780282-kd` must print nothing);
then `git reset --hard refs/remotes/origin/arena/b7780282-kd`, `npm install`,
`npx husky install`, `npm run verify`. Nothing was lost, because the tree and the
pushed commit were byte-identical; the check before the reset is what made that a
fact rather than a hope.

- 2026-10-16: the build environment's working copy was restored from a fresh
  clone of the repository and the local branch was moved back to its base
  commit. No work was lost: all nine segment 1A commits were present on
  `origin/arena/b7780282-kd`, the local branch was restored to that tip
  (35b1869) and the working tree matched the commit exactly. Dependencies
  were reinstalled and `npm run verify` returned PASS at 16 of 16 checks.

## Segment 1B gate -- PASSED (2026-10-16)

Gate: "component gallery route renders every primitive in light, dark, high
contrast and reduced motion; no hardcoded color or spacing value exists outside
tokens." Evidence is committed in docs/EVIDENCE/step-01/gate-1B.md, with the
two probes that produce it next to it:

- `node docs/EVIDENCE/step-01/gallery-style-probe.mjs` -- PASS: 244 class
  tokens, 0 without CSS, 0 of 6 negative controls compiled, 32 declaration
  expectations, 0 raw colour or spacing values across 75 files, and the
  safelist control (5 of 5 scope rules with it, 0 of 5 without it).
- `python3 docs/EVIDENCE/step-01/gallery-dom-probe.py` -- PASS: 26 markers in
  each of the five scopes with identical inventories, the five scope rules
  present in the stylesheet the browser loads, 0 accessible-name issues across
  175 buttons, 100 form controls, 45 role-bearing controls and 30 labels.
- `npm run verify` -- PASS, 20 of 20 checks.
- `npx next build` -- PASS; production audit: `GET /gallery` returns 404 with
  5,473 bytes and zero gallery traces, `GET /` returns 404 (no public page
  yet), dead-link audit clean.

Three defects were found while proving the gate and fixed at the source:

1. A composite control lost the attributes the field handed it (Radix Select
   is a context provider, not an element): the label pointed at an id no
   element carried and the combobox had no accessible name. FormField now takes
   an element or a function that receives the field attributes, and the DOM
   probe checks every label target and every role-bearing control, so the
   defect cannot return unnoticed (negative control: 6 findings).
2. The pinned theme scopes could silently stop applying, because a rule in
   `@layer base` is tree shaken by class name. THEME_SCOPE_TOKENS in
   config/design-tokens.ts is now the single owner; the Tailwind safelist is
   derived from it; check:design-tokens compares it with the stylesheet in both
   directions and requires the safelist to derive from it; the gallery scope
   list is derived rather than duplicated.
3. The development-only guard was incomplete: a layout guard alone still let
   Next serialize the page, so a production 404 carried the component tree as a
   flight payload (45,947 bytes) and the page metadata named the route in the
   response head. The guard is repeated in the page and the route declares no
   metadata of its own; the same request is now 5,473 bytes with no trace.

Open item, unchanged: the step 1 gate also requires Lighthouse at least 90 on
the homepage. There is no public page to measure until segments 1C and 1D
build one, so it is carried forward rather than claimed.

## Segment 1B gate state (after sub-step 1.17)

Every sub-step of segment 1B (1.8 to 1.17) is committed and every check is
green. The gate itself -- "component gallery route renders every primitive in
light, dark, high contrast and reduced motion; no hardcoded color or spacing
value exists outside tokens" -- is verified by the probes recorded under
"Sub-step 1.17 evidence" and can be re-run at any time:

- `python3 /tmp/probe/gallery-dom-probe.py` with `npx next dev` running
  (26 markers per scope, five scopes, identical inventories);
- `node /tmp/probe/gallery-css-probe.mjs` (243 class tokens, 0 without CSS,
  6 negative controls, 25 declaration expectations);
- `npm run verify` (20 of 20);
- `npm run check:design-tokens` after injecting `bg-[#ff0000] p-[13px]`
  somewhere under app/ or components/ (3 findings), then revert.

The two probe scripts live outside the repository on purpose: they are
evidence, not part of the product, and the project forbids test files.

## Segment boundary note (owner decision, 2026-10-16)

The plan runs one segment per chat. The owner explicitly instructed the
session to continue with sub-step 1.8 in the same chat, so segment 1B was
started here by owner decision. The record stays accurate: segment 1A closed
with its gate passed, and segment 1B continues under the permission-gated
rhythm (one sub-step per commit, verify between sub-steps, stop for
confirmation).

## Segment 1C gate -- PASSED (2026-10-16)

Gate: "navigation renders correctly for every role; dead-link check passes on the
current route set." Evidence is committed in docs/EVIDENCE/step-01/gate-1C.md,
produced at the frozen tree `319e75d` by three commands:

- `python3 docs/EVIDENCE/step-01/shell-probe.py` -- `findings: 0`,
  `RESULT: PASS`: every role framed by the shell its role model calls for; the
  map's answer for twelve audience-and-role pairs rendered by the page itself
  (owner 15 planned modules, staff 13, a client none, platform roles 8, client
  portal 4, cross-audience 0, public one live destination for a reader with or
  without a session); nine navigation surfaces correct as rendered; 37 planned
  labels inside no navigation landmark; an empty navigation rendering no landmark
  and no anchor; three breadcrumb cases; and the 1.23 command surface measured
  through the same row builder the palette uses.
- `node scripts/checks/dead-links.mjs` -- `PASS (3 routes, 3 verified links, 0
dynamic links skipped)`, exit code 0, against the route set `/gallery`,
  `/shells`, `/shortcuts`.
- `npm run verify` -- `RESULT: PASS (23 of 23 checks passed)`, exit code 0.

Production, measured on the same tree: `next build` OK with 9 static pages;
`next start` answers 200 for `/shortcuts` (18,490 bytes, public shell, no specimen
marker) and 404 with no trace for `/`, `/shells`, `/gallery`, `/dashboard`,
`/admin` and `/client-portal`.

Ten defects were found while proving this segment and fixed at the source; the
four that mattered are recorded in the gate file: a live 500 from a footer string
parameter, touch targets that sat on a wrapper instead of the control, two nested
navigation landmarks, and an empty rail that announced itself. Two of the ten were
audit rules that silently stopped matching - the fix was not only the rule but a
count in the check's summary line, so a rule that matches nothing is visible in
`npm run verify`.

## Sub-step 1.27 starting point

1.27 is "Usability primitives: `use-saved-views`, `use-undo`, `use-autosave`,
optimistic update helpers, explainability message component and string
catalogue". What 1.26 hands it:

**Nothing in the primitives depends on storage yet, and that is deliberate.**
`lib/security/logout.ts` publishes a `kd:logout` event and
`installLogoutClearSignal(listener)` returns its unsubscribe, so the first hook
that holds a user's data in `localStorage`, `sessionStorage` or memory clears it
on sign-out with one line. A saved view that writes to storage without
subscribing is exactly the copy of a workspace that a sign-out is supposed to
remove, and `check:web-hardening` already fails a module that touches storage
inside the logout path rather than announcing what happened.

**Copy has a home and a protocol.** Every string is a leaf of a namespace in
`lib/i18n/strings/en.ts`; `states.ts` and `security.ts` are the two most recent
examples of the pattern, including the rule that a refusal message says what was
refused and what to do next. The explainability messages of 1.27 are copy of that
same kind: a saved view that failed, an undo that expired, an autosave that could
not reach the server.

**The states it must reuse.** `LoadingState`, `StatusState`, `ErrorState`,
`SuccessState`, `ErrorBoundary` and `LiveRegion` already exist, with `useRetry`
for a bounded backoff, so an optimistic update that fails has a component to fall
back to and an announcement to make rather than a new pattern to invent.

**What must not regress.** `check:page-states` reads the state modules, the
boundary's one bounded retry and the 320 pixel layer; `check:motion` owns the
arrival feedback an optimistic update uses; `check:web-hardening` refuses
`dangerouslySetInnerHTML` and any hand-written script or link, so an optimistic
helper may not invent a rendering shortcut. Universal columns, optimistic
locking and the audit entry on every mutation are step 2 concerns, but the
optimistic helper built here is what those mutations will be written against, so
its contract has to be stated in a way a later step can rely on.

Closed in "## Sub-step 1.27 evidence" above, code `535c54e`: every one of those
hand-overs was used rather than worked around - the logout signal is subscribed
by both storage hooks, the copy lives in two new namespaces, and the states it
names are reused rather than reinvented.

## Sub-step 1.29 starting point

1.29 is "Public site pages B: contact, industries, calculators, the free invoice
generator shell, terms, privacy, blog shell, 404, 500, offline". What 1.28 hands
it:

**A shell that already carries the chrome.** `PublicShell` renders the skip link,
the single main landmark and the public footer, and `app/(public)/layout.tsx`
wraps every public route in it, so a new page is a component with a metadata
export and nothing else. The header is the one piece deliberately left for 1.29:
it is the surface that carries the contact destination and the language switch,
and building it in 1.28 would have meant building half of it twice. It arrives
between the skip link and the main landmark without moving either.

**A navigation map that already publishes the shapes.** `config/nav-map.ts` has
the `public-site` block with `home`, `features`, `pricing` and `about` live, and
the remaining public routes are still planned entries: a planned entry may carry
no destination, and the check fails one that does. Flipping `contact`,
`industries`, `calculators`, `terms`, `privacy` and `blog` to live means giving
each one a real route in the same commit, because `check:dead-links` cross
checks every published destination against the route inventory.

**A claim floor to extend rather than relax.** `scripts/checks/public-site.mjs`
refuses 24 claim patterns and 7 company fact shapes in the four namespaces of
1.28. The legal pages, the contact page and the industry pages add namespaces
that this check does not yet read: the contact page in particular is where a
phone number, an address and an email become legitimate, so the fact patterns
have to move from "refused everywhere" to "refused everywhere except the one
namespace where the owner supplies them". That is a deliberate change of the
rule and it should be made in the open rather than by weakening the list.

**The state and error surfaces already exist.** The 404, 500 and offline pages
are `app/not-found.tsx`, `app/error.tsx` and an offline route, and they read the
`ERROR_CODES` and correlation ids of 1.24 rather than inventing copy. They also
have to keep the heading outline rule: one h1, no skipped level, which the
rendered probe already reads.

**What must not regress.** The rendered probe
`docs/EVIDENCE/step-01/public-pages-probe.py` reads four pages by name and
checks the footer, the heading outline and the claim vocabulary in each
response; it grows with 1.29 rather than being replaced. `check:i18n-strings`
scans every `.tsx` under `app/` and `components/`, so the new pages may not
write a literal sentence, and `check:design-tokens` refuses a class step that is
not on the scale. The single price table stays the only owner of a figure: the
free invoice generator is a shell in this step, and it renders copy rather than a
number.

## Sub-step 1.31 starting point

1.31 is "Governance A: CI workflow, CODEOWNERS, pull request template,
CONTRIBUTING, SECURITY, CHANGELOG, LICENSE". What 1.30 hands it:

**A check floor that runs without a server.** `npm run verify` is 29 entries
(typecheck, lint, format check, environment validation, the token export and the
twenty-four checks) and none of them needs a running server, so a CI job is
`npm ci` and `npm run verify` with no services. The two probes in
`docs/EVIDENCE/step-01/` do need a server - `next dev` for most of them,
`next build && next start` for the production runs - and the evidence files say
which port each one expects.

**The licence is still unset.** `package.json` carries `UNLICENSED` and there is
no LICENSE file; 1.31 owns both, and `check:path-comment` exempts LICENSE when it
arrives.

**Hooks that already exist.** Husky is installed with a pre-commit hook that runs
the full verify and a commit-msg hook that refuses a subject longer than 72
characters. A CI workflow should run the same two things rather than a second,
weaker definition of green.

**One environment variable is public and named.** `NEXT_PUBLIC_APP_URL` is the
only variable the build reads for the origin (`lib/seo/site.ts`); the schema in
`lib/env/validate-env.ts` is the only place a variable is declared, and
`.env.example` lists what a deployment must set. The three Supabase variables are
required in production by that schema and are already refused outside `lib/env`.

## Segment 1D gate starting point

Step 1 has no sub-step left. The next action is the segment 1D gate, and it runs
only on the owner's word. What it has to measure, with the machinery for each
item already in place:

- **The production build passes.** A copy of the repository outside the working
  tree, `npm ci`, `npx next build`, then the artefact assertions the CI build job
  makes (`.next` removed first, `BUILD_ID` present, the crawler files emitted,
  the sitemap route built) and zero dynamicIO diagnostics in the build output. At
  1.32 the local run was exit 0 with 0 diagnostics, and the runner runs the same
  build on every push.
- **Lighthouse at least 90 on the homepage.** This environment has no browser, so
  the number cannot be produced here. The recorded substitute is the
  public-pages probe's measurement of the homepage: document bytes, the number of
  stylesheets and the script count, server rendered, with the policy in front of
  them. The item stays open in the handoff until the owner runs Lighthouse
  against the deployed preview, and the gate record says exactly that instead of
  printing a number nobody measured.
- **The dead-link audit is clean.** `check:dead-links` is in the floor: 15 routes
  and 58 verified links with 0 dynamic links skipped at this commit, and the pages
  1.28 and 1.29 added are inside the audit.
- **`npm run verify` is fully green.** 30 of 30 entries at this commit, which is
  the unchanged command the `verify` job of `.github/workflows/ci.yml` runs on
  the runner.
- **The evidence record** is `docs/EVIDENCE/step-01/gate-1D.md`: the command, the
  commit, the raw output, and a closing paragraph naming what the result does not
  cover (the browser item) rather than leaving it implied.

After the gate is recorded, step 1 is complete: the chat closes with
"Segment 1D complete; step 1 complete", the merge into `integration` follows the
pull request review, and step 2 opens with `docs/PLAN/chat-prompts/CHAT_02.md`.

## Blockers

None recorded.

## Notes for the next segment (1B)

- Toolchain: Node v22.22.3, npm 10.9.8. Add dependencies with
  `npm install --save` / `--save-dev` so package.json and the lockfile stay
  in sync, then commit both.
- Every new file needs its path comment on line 1: `// path: ...` for
  TypeScript, JavaScript and Markdown, `# path: ...` for shell, YAML, TOML,
  .env.example and ignore files, `/* path: ... */` for CSS, `-- path: ...`
  for SQL, `<!-- path: ... -->` for HTML and SVG. JSON, lockfiles,
  next-env.d.ts and LICENSE are exempt.
- `npm run verify` runs 20 entries: typecheck, lint, format:check,
  env:validate, tokens:export and the fifteen checks. Extend the verify entry
  list by appending to `ENTRIES` in scripts/verify.mjs when a new check lands
  (it was 16 when this note was first written; 1.15 to 1.17 added four).
- Money-math and any-types are heuristic guards: keep count and paging
  identifiers free of money words (the guard flagged `const total =` in
  scripts/verify.mjs and the fix was `totalCount`).
- The structured logger must not use the console object; write to
  process.stdout and process.stderr like the check scripts do.
- Extend .env.example and lib/env/validate-env.ts (ENV_SOURCE_KEYS,
  SECRET_ENV_KEYS, PRODUCTION_REQUIRED_KEYS) when a sub-step adds variables.
- LICENSE and package.json `license` are UNLICENSED until sub-step 1.31.
- Tailwind theme extension points are ready in tailwind.config.ts (colors
  already bound to CSS variables in styles/globals.css); 1.13 filled spacing,
  radius, shadow and z-index; 1.14 filled colour (four themes), typography and
  motion and added the token JSON export. Component primitives in 1.15 and
  1.16 must use role classes only (bg-primary, text-muted-foreground,
  border-input) and text steps from the typography scale.
