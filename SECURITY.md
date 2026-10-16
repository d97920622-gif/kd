// path: SECURITY.md

# Security policy

KD SOLUTION IT holds invoices, client records and payment instructions for
other businesses, so a defect here is not only a defect in this repository. This
file says how to report one, what happens to the report, and what the platform
already refuses to do.

## Supported versions

| Version line     | Supported |
| ---------------- | --------- |
| 0.1.x            | yes       |
| anything earlier | no        |

The supported line is the version in `package.json`, on the `integration`
branch. A security fix is written against the current line and released as a
patch; older lines are not maintained, and a deployment that has not been
updated is the owner's decision to record separately.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting on this repository: open the
Security tab and choose "Report a vulnerability".

- Private advisory form: https://github.com/d97920622-gif/kd/security/advisories/new

That channel is private between the reporter and the owner of the repository,
which is what makes it safe for the report and the fix to exist at the same
time. Do not open a public issue for a vulnerability: a public issue that
describes an exploitable defect is a disclosure, and a disclosure that arrives
before a fix gives everyone the defect and nobody the fix. A public issue is
appropriate only after a fixed release exists and the owner and the reporter
have agreed on a date.

A report that can be reproduced in one sitting contains:

- the affected route, module or file, and the version or commit you tested;
- what you expected to happen and what happened instead, one sentence each;
- the smallest sequence of steps that shows it, with the account type you used
  (owner, administrator, staff, client) and whether the defect needs two
  accounts or two workspaces to appear;
- for a data-isolation defect, whether the second workspace was one you own;
- the reference shown on any error page, which identifies the request in the log
  without identifying you.

Never include, in a report or in an attachment:

- a password, a one-time code, a recovery phrase or an API key of any kind;
- full payment details or bank credentials;
- personal data belonging to anyone who has not agreed to be part of the test;
- a copy of a production database, or a screenshot of one.

If you have already sent a credential, say so in the report and rotate it; the
process below starts with the rotation, not with the reproduction.

## What happens next

1. The report is reproduced against a local deployment of the affected commit,
   with data created for the test.
2. It is classified by what it reaches: tenant data of another workspace,
   authentication or session handling, authorisation and role escalation, the
   payment path, a stored secret, or an availability problem.
3. The fix is written on a branch, and it ships with a control that would have
   caught the defect: a rule in `scripts/checks/` that fails when the guarded
   file is mutated, or a probe under `docs/EVIDENCE/` that reads the running
   server. This repository keeps no test files, so a fix that leaves no control
   behind is a fix that can silently return.
4. A database fix goes forward in a new migration; an applied migration is never
   edited (`docs/PLAN/07_BRANCH_AND_GIT_WORKFLOW.md`, section 6).
5. After the fixed version is released, the advisory describes the defect, the
   affected versions and the fixed version, and credits the reporter unless the
   reporter asks to stay anonymous.

A response window is a commitment a deployment makes and keeps, so it is
configured with the support queue rather than printed here - the same rule the
contact page follows for the address a message goes to.

## Scope

In scope: the classes of defect this project wants to hear about. A few of the
surfaces below arrive with a later step, and the specification registers all of
them, so a report against the step that lands one is welcome rather than early:

- tenant isolation: any read or write that reaches another workspace's records;
- authentication and session handling: token handling, session fixation, logout
  that leaves a cached workspace behind, and the breach and lockout rules;
- authorisation: role escalation, a permission that is checked in the interface
  but not in the query, and an audit entry that a mutation can avoid;
- the payment path: idempotency, the webhook signature, and any route that could
  move money twice or lose a settlement record;
- stored data: encryption and key handling, blind indexes, redaction in logs,
  exports and file names;
- input handling: injection through stored rich text, uploaded files, template
  values and query parameters;
- the hardened response baseline: the content security policy, the header
  matrix, the Trusted Types policy and the sanitizer allowlist;
- a vulnerability in a direct dependency of this repository, where the affected
  code path is reachable from this application.

Out of scope:

- physical access, social engineering and anything that needs a compromised
  device or mailbox;
- volumetric denial of service and load testing;
- a defect in a third-party processor, bank or messaging provider's own
  surface, which is reported to that provider;
- findings that require an account you do not own, or data you are not
  authorised to hold;
- a scanner report without a reachable path: a version string, a header that is
  present but unused, or a dependency that is installed but never imported.

## Safe harbour

Research done in good faith under this policy is welcome, and the owner will not
pursue legal action for it. Good faith means: use accounts and workspaces you
created, do not read, change or delete another tenant's data, do not degrade the
service for anyone, keep the report private until a fix is released, and stop as
soon as you have shown that the defect is real.

## What this repository already enforces

- A content security policy with a per-request nonce on every document
  (`middleware.ts`, `lib/security/content-security-policy.ts`), nonce-bound
  scripts and styles, and no inline script or `eval` in production.
- A response header matrix, declared once with a reason per header in
  `config/security-headers.ts` and applied to every response, with the framing
  refusal and transport security switched on in production only - a deliberate
  exception, recorded in `docs/ADR/ADR-0006-web-hardening-baseline.md` and
  measured by `docs/EVIDENCE/step-01/http-hardening-probe.py`.
- A Trusted Types policy and a sanitizer allowlist for the rich text that
  arrives in step 5 (`lib/security/`).
- Server-only environment keys declared once in `lib/env/validate-env.ts` and
  refused in any file that reaches a browser; the server refuses to start on an
  invalid configuration instead of running with one.
- No credential in the repository: `check:secrets` reads every tracked file, and
  `.env` is never committed.
- No logging of values that look like secrets, and no `console` call outside the
  structured logger, which redacts the values it is given.

A defect in any of the above is in scope, and the baseline is the reason the
report can be specific: naming the directive, the header or the line is enough
to start.
