// path: docs/ADR/ADR-0007-segments-gates-and-the-verification-floor.md

# ADR-0007 -- Segments, gates and the verification floor

- Status: Accepted
- Date: 2026-10-17
- Step: 1 (the model the whole build runs on, recorded in sub-step 1.32)
- Supersedes: none
- Superseded by: none

## Context

This platform is built in sixteen steps, one chat per step, and steps 1, 3, 4, 6,
10 and 13 are each divided into four segments
(`docs/PLAN/10_SEGMENT_GUIDE.md`). Step 1 alone is thirty-two sub-steps across
four segments, and every one of them ends with the same obligations: a single
commit, a green verification run, an evidence record, an updated handoff file,
and no permission to touch the next sub-step until the owner says so.

The reason a model like this is written down is that its failure mode is
invisible. A chat that runs two sub-steps, or that reports "done" on a green
`npm run verify` while never opening the built site, produces a history that
looks exactly like a correct one: commits, a passing gate, a handoff. What it
does not produce is a recoverable position. When a build stalls three steps
later, the only question that matters is which slice is the first one that was
never actually finished, and a plan that recorded decisions but not _proof_ cannot
answer it.

So the model has three parts that have to hold together: the segments and their
gates, the single command that decides whether a slice is finished, and the
evidence that the command was run on this history rather than on a memory of it.

## Decision

**A sub-step is one commit, and the commit says which sub-step it is.**
`<type>(step-NN/S.S): <summary>` - `feat(step-01/1.30): ...`,
`docs(step-01/1.30): ...`. Two sub-steps are never squashed into one commit, and
a sub-step is never left half-committed to be "cleaned up" by the next one. The
message format is enforced by `.husky/commit-msg` (type, scope, imperative
summary, subject limit, ASCII only), so the history is machine-readable: the
changelog is generated from it (`npm run changelog`), and
`docs/handoffs/CHAT_01_PROGRESS.md` maps every completed sub-step to its SHA.

**The verification floor is one command, and it is the only definition of done.**
`npm run verify` runs the type checker, the linter, the formatter check, the
environment validation, the design token export and the rule checks in fixed
order, prints one PASS or FAIL line per entry, and exits non-zero on the first
failure. It is the pre-commit hook, it is what a pull request is reviewed against
and it is what CI runs - the same command in all three places, so "it passed on
my machine" and "it passed on the runner" are the same claim. A rule that is not
in the floor is a preference, so a new rule arrives as a new entry in
`scripts/verify.mjs` in the same sub-step that writes it.

**A floor pass is necessary and not sufficient.** The gates ask for things no
static check can decide: the production build compiles and emits the expected
artifacts, the built server answers with the headers and the documents the policy
promises, the navigation resolves, the pages render, and the segment's own
conditions hold (segment 1B: the gallery renders every primitive in four themes;
1C: navigation renders for every role and the dead-link audit is clean; 1D: the
build passes, the homepage meets the performance target, the audit is clean and
the floor is green). Those are measured by the probes in
`docs/EVIDENCE/step-01/` and by the build and server steps CI runs, and the
result is written to a gate evidence file: what was run, on which commit, with
what output, and what the result did not cover.

**A gate is crossed by the owner, not by the build.** Each sub-step ends by
printing the same three lines - what is done, what is next, and a request for
permission - and work stops there. A segment boundary is never crossed in the
same breath as the last sub-step of the segment, even when the next sub-step is
known and trivial; the owner's word is the only thing that moves the build across
a boundary. This is what makes a chat's blast radius predictable: one chat is one
segment, and a failure is always inside one gate.

**Every chat hands off, including a partial one.** `docs/handoffs/CHAT_NN_COMPLETED.md`
states the sub-steps completed with their commits, the files created and
extended, the database and environment changes, the verification evidence, the
decisions with their ADR, the known risks, and the first incomplete sub-step.
`docs/handoffs/CHAT_NN_PROGRESS.md` carries the running detail: the latest
sub-step's evidence sits above the previous one's, and the SEGMENT tables record
each sub-step's state and commit. A chat that ends early is a normal outcome; a
chat that ends without a handoff is a lost position.

**No passing file is re-implemented.** On any resume the preflight runs first -
branch against origin, clean tree, dependencies present, `npm run verify` at the
current tip - and then work continues from the first incomplete slice. A file
that passes its check is not rewritten because a new chat prefers a different
shape; the rewrite would invalidate the evidence that the slice was ever
verified.

## Consequences

- The history is the record. A reviewer can read `git log` and see one commit per
  sub-step, and the changelog and the progress file are both derived from it, so
  they cannot drift from the code without failing `check:governance`.
- Progress is slower than it could be and is never ambiguous. The three gated
  lines and the handoff file mean a build can be resumed by someone who was not
  there, from the repository alone.
- The floor grows monotonically: 30 entries at the end of step 1, one per rule
  that was worth writing, each with its own control that proves the rule fires on
  a mutated file. A rule that has no control is a rule nobody has tested.
- Evidence is per sub-step and per gate, so a later failure can be traced to the
  slice that introduced it, and a slice's proof is not overwritten by the next
  one.
- The owner is in the loop at every boundary, which is a cost measured in
  messages and the reason nothing is discovered at the end of a segment.

## Alternatives considered

- **One commit per step, or per day.** Fewer, larger commits; a bisect lands in a
  hundred-file diff, and the changelog would have one entry per step. Rejected.
- **Trust the checks and skip the probes.** The checks read source; they cannot
  see that the built server returns the nonce in both directives, that the sitemap
  answers, or that the gallery renders. Rejected: the probes are what turned three
  real defects into findings in segment 1B.
- **A second, narrower command per step** (for example a build-only gate). Two
  definitions of green is how a build passes locally and fails in CI. Rejected;
  CI runs the same floor plus the build.
- **Let a chat continue to the next sub-step when its own work is green.** It
  removes the owner's checkpoint at the exact moment the build is most confident,
  and it makes a chat's scope depend on how well the previous sub-step went.
  Rejected.
- **Record gate evidence in the chat transcript only.** The transcript is not in
  the repository. Evidence lives in `docs/EVIDENCE/step-NN/`, next to the probes
  that produced it.
- **Squash the segment into one merge commit.** `integration` receives reviewed
  step work; squashing would destroy the per-sub-step mapping the changelog, the
  progress file and the gates all read.

## Verification

- `.husky/commit-msg` rejects a subject that does not match
  `<type>(step-NN/S.S): ...`, is longer than the limit or contains a non-ASCII
  character; `.husky/pre-commit` runs lint-staged and the floor before any commit
  exists.
- `npm run verify` is 30 entries at the end of step 1 and is the only command
  that decides a pass; `.github/workflows/ci.yml` runs it as the `verify` job and
  adds the `build` job with the probes, and `check:governance` refuses a workflow
  that names an individual check script instead.
- `check:governance` cross-reads the governance artefacts against each other and
  against the history: every commit recorded in a completed row of the handoff
  tables must have a changelog entry, and the Node major in the workflow must
  match the one in `engines`.
- The gate evidence files exist for the segments that have closed:
  `docs/EVIDENCE/step-01/gate-1B.md` and `docs/EVIDENCE/step-01/gate-1C.md`, each
  recording the command, the commit and the raw result.
- The per-sub-step evidence in `docs/handoffs/CHAT_01_PROGRESS.md` names the
  commit for every completed sub-step, and the controls in
  `docs/EVIDENCE/step-01/` prove the checks and the probes fail on a mutation
  rather than passing on any input.
