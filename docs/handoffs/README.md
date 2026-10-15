// path: docs/handoffs/README.md
# Handoff Documents

Every chat produces handoff files here. The next chat reads them before
touching any code.

## Files per step

| File | Written when | Content |
| --- | --- | --- |
| `CHAT_NN_PROGRESS.md` | created at the start, updated after every sub-step | sub-step checklist with status and commit hash, current blocker |
| `CHAT_NN_COMPLETED.md` | at the end of the chat, even if the step is partial | full handoff as defined in `docs/PLAN/02_CONVENTIONS_AND_GUARDRAILS.md` section 9 |

Numbering uses two digits: `CHAT_01` to `CHAT_16`.

## Required sections in a completed handoff

1. Step scope and status (complete, or partial with the first incomplete
   sub-step).
2. Sub-steps completed with commit hashes.
3. Files created.
4. Files extended, with the reason and the append protocol reference.
5. Migrations added, up and down paths, tables created, RLS policies added.
6. Environment variables added, with masked examples.
7. Decisions and assumptions, with ADR links.
8. Verification evidence: command output summary for every gate.
9. Exact starting point for the next chat.

## Existing handoffs

| File | Content |
| --- | --- |
| `CHAT_00_COMPLETED.md` | Planning package: the 16-step plan, guardrails, traceability, provider registry and chat prompts |
| `_TEMPLATE.md` | The blank template to copy for each new step |
