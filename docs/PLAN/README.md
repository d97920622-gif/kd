// path: docs/PLAN/README.md
# KD SOLUTION IT -- Execution Plan (16 Steps / 16 Chats)

This folder is the single source of truth for HOW the platform is built.
The WHAT lives in `MASTER_PROMPT.md` and `FEATURE_LIST.md`.
This plan does not replace them; it orders the work, prevents duplicate or
conflicting code, and defines the exact instruction text for every chat.

## Files

| File | Purpose |
| --- | --- |
| `00_MASTER_EXECUTION_PLAN.md` | The 16 steps, scope, dependencies, order, critical path |
| `01_REQUIREMENTS_TRACEABILITY.md` | Every requirement mapped to a step (nothing can be dropped) |
| `02_CONVENTIONS_AND_GUARDRAILS.md` | Canonical rules block, sub-step loop, resume and handoff protocol |
| `03_FILE_OWNERSHIP_MATRIX.md` | Which step owns which file or directory (duplicate prevention) |
| `04_DEFINITION_OF_DONE_AND_GATES.md` | Global definition of done, per-step gates, evidence rules |
| `05_ADDITIONAL_REQUIREMENTS_SPEC.md` | Normative English spec of the added requirements (login lock, card rules, 3DS, storage, API console, NMI modes) |
| `06_PROVIDER_DOCS_REGISTRY.md` | 16 payment processors, official docs, sandbox facts, adapter file names |
| `07_BRANCH_AND_GIT_WORKFLOW.md` | `integration` mainline, commit convention, PR and release rules |
| `08_SUBSTEP_CHECKLISTS.md` | Sub-step work orders for all 16 steps |
| `09_REVISION_2_ADDITIONS.md` | Revision 2 placement, ownership boundaries, heavy-step notes, added gates |
| `10_SEGMENT_GUIDE.md` | Segment model: how one heavy step is executed across four chats |
| `11_USAGE_HANDBOOK.md` | A to Z operating guide: branch selection, per-chat loop, review checklist, troubleshooting |
| `12_SIMPLE_GUIDE.md` | Start here: the three actions, permission gate, closing report, FAQ |
| `chat-prompts/CHAT_01.md` ... `CHAT_16.md` | Paste-ready instruction for each of the 16 chats |
| `../handoffs/` | One handoff document per completed chat |

## Start here

Read `12_SIMPLE_GUIDE.md` first (three actions: paste a prompt, type
continue, type merge). For the detailed variant read `11_USAGE_HANDBOOK.md`: it explains the one-time branch setup
(make `integration` the mainline and the default branch), which branch to
select in each new chat, the per-chat loop, the owner review checklist and
troubleshooting.

## How to run the build

1. Read `00_MASTER_EXECUTION_PLAN.md` and `08_SUBSTEP_CHECKLISTS.md` once.
2. Open chat 1, paste the whole content of `chat-prompts/CHAT_01.md`.
3. The chat works sub-step by sub-step, commits after each sub-step, and ends
   with `docs/handoffs/CHAT_01_COMPLETED.md`. Steps 1, 3, 4, 6, 10 and 13 run
   as four segments each: one segment per chat, stop at the segment gate, then
   paste the same prompt again for the next segment.
4. Continue with chat 2, 3, ... 16 in order. Never skip a step.
5. If a step cannot finish in one chat, the same chat-prompt file contains the
   resume instruction. Continue in a new chat that starts from the first
   incomplete sub-step. No work is repeated and no file is written twice.

## Rules of engagement

- One step per chat. One sub-step per commit.
- A step never edits a file owned by another step without the append protocol
  defined in `03_FILE_OWNERSHIP_MATRIX.md`.
- Every chat ends with a handoff document. The next chat reads it first.
- No test files, no TODO, no FIXME, no "Coming Soon", no placeholder text,
  no `any`, no `console.log`, English only, USD only.
- If a requirement is unclear, the chat must implement the strictest
  interpretation and record the decision in `docs/ADR/`.
