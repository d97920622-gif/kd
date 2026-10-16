// path: CONTRIBUTING.md

# Contributing to KD SOLUTION IT

This repository is built from a specification, not from taste. Before changing
anything, read the document that asks for the change, in this order:

1. `MASTER_PROMPT.md`, the absolute rules (language, currency, security).
2. `FEATURE_LIST.md`, the numbered feature register. It is the only file in the
   repository that is not English, and the only file the English-only check
   exempts.
3. `docs/PLAN/00_MASTER_EXECUTION_PLAN.md` and
   `docs/PLAN/02_CONVENTIONS_AND_GUARDRAILS.md`.
4. `docs/PLAN/03_FILE_OWNERSHIP_MATRIX.md`, which says which step owns a file.
5. `docs/PLAN/04_DEFINITION_OF_DONE_AND_GATES.md`, the definition of done and
   the per-step gates.
6. `docs/PLAN/08_SUBSTEP_CHECKLISTS.md`, section STEP 01, for the sub-step being
   built.
7. `docs/PLAN/09_REVISION_2_ADDITIONS.md` and sections A11 to A15 of
   `docs/PLAN/05_ADDITIONAL_REQUIREMENTS_SPEC.md` for the first steps.

A change that the plan does not ask for is out of scope, however good it is. A
change the plan asks for is not optional, however small it looks.

## Prerequisites

- Node.js 22. The `engines` field in `package.json` requires 22 or newer, and
  the continuous integration job pins the same major, so a version that works
  locally is a version that runs in CI.
- npm 10 or newer, which arrives with Node.js 22.
- Python 3.11 or newer for the evidence probes under `docs/EVIDENCE/`. The
  probes are not part of the product and are not part of `npm run verify`: they
  read a running server by hand and their output is recorded in the handoff.

## Set up

```sh
git clone https://github.com/d97920622-gif/kd.git
cd kd
npm ci
cp .env.example .env
npm run dev
```

`npm ci` installs exactly the versions in `package-lock.json` and then runs the
`prepare` script, which installs the two Git hooks. The hooks are not optional:
`pre-commit` formats and lints the staged files and then runs the full
verification floor, and `commit-msg` enforces the commit convention. A commit
that skips them is a commit that fails in front of a reviewer instead.

`.env` holds local values only and is never committed. `check:secrets` fails the
build when a credential reaches a tracked file, and `.env.example` is the
template a new environment is created from: a variable that is not in it cannot
be set by a deployment.

## Commands

| Command                  | What it does                                                                                                   |
| ------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `npm run dev`            | Development server on port 3000                                                                                |
| `npm run build`          | Production build                                                                                               |
| `npm run start`          | Serve the production build                                                                                     |
| `npm run verify`         | Every gate: typecheck, lint, format check, environment validation, the token export check and every rule check |
| `npm run lint`           | ESLint with zero tolerated warnings                                                                            |
| `npm run lint:fix`       | ESLint with fixes applied                                                                                      |
| `npm run format`         | Prettier writes every formatted file                                                                           |
| `npm run format:check`   | Prettier reports instead of writing                                                                            |
| `npm run typecheck`      | `tsc --noEmit`                                                                                                 |
| `npm run env:validate`   | Validate the environment against the Zod schema                                                                |
| `npm run changelog`      | Rewrite `CHANGELOG.md` from the commit history                                                                 |
| `npm run tokens:export`  | Rewrite the design token export                                                                                |
| `npm run brand:generate` | Rewrite the brand asset pack                                                                                   |

`npm run verify` is the gate. It is what the pre-commit hook runs, what CI runs,
and what a handoff records; a change is done when it is green, not when it looks
green. Individual checks can be run on their own while working
(`npm run check:english-only`, `npm run check:governance`), but the verdict is
the aggregate one.

## Commit convention

`docs/PLAN/07_BRANCH_AND_GIT_WORKFLOW.md`, section 3, defines it, and the
`commit-msg` hook enforces it:

```
<type>(step-NN/S.S): <imperative summary>
```

- Types: `feat`, `fix`, `refactor`, `perf`, `docs`, `chore`, `security`.
- One sub-step per commit. Never squash two sub-steps into one commit, and
  never split one sub-step across two.
- The subject stays within 72 characters, because that is what a log line and a
  review list can show.
- The body explains the decision, not the diff; the diff already shows the
  change.

## Branches and pull requests

- `integration` is the mainline and the deployment source. Nothing is committed
  to it directly.
- Work happens on a session branch (`arena/<session-id>`) or a short-lived
  `step-NN-<slug>` branch, and reaches `integration` through a pull request
  that carries this repository's pull request template.
- `main` is the release mirror. It only receives merges from `integration` at
  release time.
- Never force push on `integration` or `main`. Never create a second long-lived
  branch.
- CI runs on every push to a session branch and on every pull request into
  `integration` or `main`. The `ci` job is the aggregate check branch
  protection requires; it fails when either the verification floor or the
  production build fails.

## What every file must satisfy

- A `path:` comment as the first line, in the comment syntax of the file type.
- ASCII English only: no non-English script in code, comments, copy, seeds,
  file names or commit messages.
- No test files, no test runner and no test dependency anywhere (Rule 4). A
  rule is proved by a check script that fails when the file it guards is
  mutated, and a behaviour is proved by a probe that reads a running server,
  not by a test file.
- No `any`. No `console` call outside the logger. No unfinished-work marker and
  no filler text: `check:no-todo` and `check:no-coming-soon` hold the exact word
  lists, and they read every tracked file that is not part of the
  owner-supplied specification.
- Every user-facing string lives in `lib/i18n/strings/en/` and is read through
  `t()`. Copy is added, never renamed.
- Money is USD only, held as `numeric(18,4)` in the database and computed with
  `decimal.js` through `lib/utils/currency.ts`. A JavaScript number never
  touches an amount.
- Input is validated with Zod on the client and again on the server, and
  sanitized before it is stored or rendered.
- Never write a payment processor's brand name. The approved names are "Global
  Payout Partners" and "Local Payment Methods via Licensed Partners", and
  `check:forbidden-brands` refuses the rest.
- A mutation writes an audit entry, an editable row carries a version for
  optimistic locking, and a payment path is idempotent. These arrive with the
  schema in step 2 and are requirements from the first table onward.

## Adding a check

A rule that is only written in a document is a rule that erodes. A new rule
arrives as three files:

1. `scripts/checks/<rule>.mjs`, which scans tracked files only, prints
   `path:line:column: message` findings and exits non-zero on any finding.
2. An entry in `scripts/verify.mjs`, so the aggregate gate runs it.
3. A control: a mutation of the guarded file that must make the check fail. The
   controls for earlier sub-steps are recorded in the handoff, and a rule
   without a control is a rule nobody has ever seen fail.

## Definition of done

A sub-step is done when every box in
`docs/PLAN/04_DEFINITION_OF_DONE_AND_GATES.md` section 1 is true, when
`npm run verify` is fully green, when `docs/handoffs/CHAT_NN_PROGRESS.md`
records the evidence and the next starting point, and when the commit that
closes it follows the convention above.

## Security

Report a vulnerability through the process in `SECURITY.md`, never in a public
issue, and never with live customer data attached.

## Licence

This repository is proprietary. See `LICENSE`: all rights reserved, no licence
granted for use, copying or distribution outside the owner's own deployments.
