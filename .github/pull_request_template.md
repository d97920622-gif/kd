// path: .github/pull_request_template.md

# Pull request

One sub-step per commit and one commit per sub-step. The fields below are the
plan's own list (`docs/PLAN/07_BRANCH_AND_GIT_WORKFLOW.md`, section 4), so a
reviewer reads the diff against the specification rather than against memory.

<!-- Notes for the author: replace every comment with the answer, delete the
sections that do not apply to this step, and keep the gates table - an empty
gates table is a pull request that has not been run. -->

## Step number

<!-- Which step this pull request belongs to, for example step-01. -->

## Sub-steps included

<!-- Every sub-step id this pull request closes, for example 1.31 and 1.32,
with the commit that closed each one. -->

## Files added

<!-- One line per new file: what it is, and which anchor in docs/PLAN asked for
it. -->

## Files extended with reason

<!-- One line per edited file: what changed, and why the change belonged in
this sub-step rather than in the next one. -->

## Migrations with up and down paths

<!-- The forward file and its rollback file, or the word none when the step
carries no schema change. Every migration is paired; check:migration-pairs
proves the pairing. -->

## Environment variables added

<!-- New or renamed variables, with the line added to .env.example. A variable
without a template line is a variable the next deployment cannot set. -->

## Verification output summary

<!-- The tail of npm run verify, the production build result, and the probes
that were run against the built server, with the finding count for each. -->

## Gates table

<!-- One row per gate that applies to this step, taken from
docs/PLAN/04_DEFINITION_OF_DONE_AND_GATES.md, with the evidence that shows the
gate passed. -->

## Handoff link

<!-- The progress file and the evidence files this pull request adds, for
example docs/handoffs/CHAT_01_PROGRESS.md. -->

## Checklist

- [ ] Commits follow `<type>(step-NN/S.S): <imperative summary>`, one per
      sub-step, and no two sub-steps were squashed into one.
- [ ] `npm run verify` passes with the full check list green.
- [ ] The production build passes, and the platform routes are in the output.
- [ ] Every new file starts with a `path:` comment and contains ASCII English
      only.
- [ ] No test file, test runner or test dependency was added (Rule 4).
- [ ] No `any`, no `console` call, no unhandled promise and no unused export.
- [ ] Every user-facing string is in `lib/i18n/strings/en/`, not in a component.
- [ ] Money is handled with `decimal.js` through `lib/utils/currency.ts`, never
      with a JavaScript number.
- [ ] No credential, key or token is committed; `.env.example` is updated and
      `.env` is untouched.
- [ ] New rules are proved: a check fires on a mutated copy, and a probe reads
      the running server.
- [ ] `docs/handoffs/CHAT_NN_PROGRESS.md` records the sub-step, its evidence
      and the next starting point.
