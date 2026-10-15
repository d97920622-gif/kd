// path: docs/handoffs/CHAT_00_COMPLETED.md
# CHAT 00 COMPLETED -- Planning Package (16 Steps / 16 Chats)

Status: complete
Date: 2026-10-15
Purpose: produce the plan only. No application code was written in this chat.

## 1. What was produced

| File | Content |
| --- | --- |
| `docs/PLAN/README.md` | Plan index and how to run the 16 chats |
| `docs/PLAN/00_MASTER_EXECUTION_PLAN.md` | The 16 steps, dependencies, migration timestamp windows, completion definition, continuation protocol |
| `docs/PLAN/01_REQUIREMENTS_TRACEABILITY.md` | Every feature part and added requirement mapped to a step; absolute rules mapped to enforcement artefacts; feature accounting rule |
| `docs/PLAN/02_CONVENTIONS_AND_GUARDRAILS.md` | Canonical rule block, forbidden features, naming, companion artefacts, error envelope, sub-step loop, commit convention, resume and handoff protocol, security and UI checklists |
| `docs/PLAN/03_FILE_OWNERSHIP_MATRIX.md` | One owner per file, single sources of truth, append protocol, forbidden duplicates |
| `docs/PLAN/04_DEFINITION_OF_DONE_AND_GATES.md` | Global definition of done, verification command list, per-step gates, evidence rules, stop conditions |
| `docs/PLAN/05_ADDITIONAL_REQUIREMENTS_SPEC.md` | Normative English spec for the added requirements A1 to A10 |
| `docs/PLAN/06_PROVIDER_DOCS_REGISTRY.md` | Sixteen processors with adapter paths, documentation links, sandbox facts, per-adapter requirements, NMI dual mode, documentation verification protocol |
| `docs/PLAN/07_BRANCH_AND_GIT_WORKFLOW.md` | `integration` mainline, commit convention, pull request content, release and rollback procedure |
| `docs/PLAN/08_SUBSTEP_CHECKLISTS.md` | Sub-step work orders for all sixteen steps |
| `docs/PLAN/chat-prompts/README.md` | Chat index and resume rule |
| `docs/PLAN/chat-prompts/CHAT_01.md` to `CHAT_16.md` | Paste-ready prompt per chat |
| `docs/handoffs/README.md` and `_TEMPLATE.md` | Handoff conventions and template |
| `README.md` | Updated project entry point |
| `MASTER_PROMPT.md` | Added the execution plan override section and corrected the repository URL |
| `.gitignore` | Standard ignore rules for Node, Next.js, environment files, build output, editors and OS files |

## 2. Key decisions

- Sixteen steps replace the historical ten-chat list because the added
  requirements (sixteen processors, NMI dual mode, login lock, card rules,
  3DS policy, storage policy, super admin API console) do not fit ten chats.
- One chat per step, one commit per sub-step, one handoff per chat.
- Migration timestamps are allocated per step to make collisions impossible.
- Files have exactly one owner; later steps extend through the append
  protocol only.
- `FEATURE_LIST.md` stays in the repository as the owner-supplied
  specification and is the single documented exemption to the English-only
  scanner; nothing else may contain non-ASCII characters.
- `integration` is the long-lived mainline; `main` is the release mirror.

## 3. Verification evidence for this chat

- Repository inspected: `MASTER_PROMPT.md`, `FEATURE_LIST.md`, `README.md`.
- Requirement coverage checked part by part against
  `docs/PLAN/01_REQUIREMENTS_TRACEABILITY.md`.
- Sandbox and test-mode facts for BlueSnap, FastSpring, PayPro Global, Payarc,
  Rapyd, Paddle and Payoneer researched from their own documentation and
  recorded in `docs/PLAN/06_PROVIDER_DOCS_REGISTRY.md`; every adapter chat must
  re-verify at implementation time.
- ASCII-only check applied to all planning files.

## 4. Starting point for chat 1

- Open a new chat and paste `docs/PLAN/chat-prompts/CHAT_01.md`.
- Do not paste more than one step prompt per chat.

## 5. Revision 2 (added on owner request after the first planning pass)

Added scope: the modern checkout page, the tax collection and remittance
engine, the security modernization set and the usability modernization set.

| File | Change |
| --- | --- |
| `docs/PLAN/05_ADDITIONAL_REQUIREMENTS_SPEC.md` | Added normative sections A11 to A15 |
| `docs/PLAN/09_REVISION_2_ADDITIONS.md` | New file: placement, ownership boundaries, no-conflict table, heavy-step guidance, added gates |
| `docs/PLAN/08_SUBSTEP_CHECKLISTS.md` | Rewritten as Revision 2; new sub-steps added and renumbered per step |
| `docs/PLAN/00_MASTER_EXECUTION_PLAN.md` | Step titles updated; added sections 7 and 8 |
| `docs/PLAN/01_REQUIREMENTS_TRACEABILITY.md` | Added section 6 mapping every Revision 2 requirement to steps and sub-steps |
| `docs/PLAN/03_FILE_OWNERSHIP_MATRIX.md` | Added section 5 with new owners and explicit exceptions |
| `docs/PLAN/04_DEFINITION_OF_DONE_AND_GATES.md` | Added section 3A referencing the Revision 2 gates |
| `docs/PLAN/chat-prompts/CHAT_01.md` to `CHAT_16.md` | Each prompt carries an ADDED IN REVISION 2 block |
| `README.md`, `docs/PLAN/README.md`, `docs/PLAN/chat-prompts/README.md` | Step titles and indexes updated |

Nothing from the original specification was removed or weakened. The step
count stays sixteen; heavy steps continue with the same prompt using the
resume instruction.

## 6. Revision 3 (finer granularity for the six heavy steps)

Requested by the owner: break the heavy steps into even smaller pieces so a
single chat can complete them without errors.

| File | Change |
| --- | --- |
| `docs/PLAN/08_SUBSTEP_CHECKLISTS.md` | Revision 3: steps 1, 3, 4, 6, 10 and 13 rewritten as four segments each with finer sub-steps (total sub-steps 204) |
| `docs/PLAN/10_SEGMENT_GUIDE.md` | New file: segment model, stop and start checklists, segment map, size discipline |
| `docs/PLAN/09_REVISION_2_ADDITIONS.md` | Sub-step references updated to Revision 3 numbers; section 3A added |
| `docs/PLAN/01_REQUIREMENTS_TRACEABILITY.md` | Revision 2 rows updated to Revision 3 sub-step numbers; section 7 added |
| `docs/PLAN/00_MASTER_EXECUTION_PLAN.md` | Section 8 replaced with the segment model and expected chat counts |
| `docs/PLAN/chat-prompts/CHAT_01, 03, 04, 06, 10, 13` | Segmented scope, segment execution model, segment rule and status line |
| `README.md`, `docs/PLAN/README.md`, `docs/PLAN/chat-prompts/README.md` | Segment guidance added |

Nothing was removed. The step count stays sixteen; the six heavy steps simply
run as four chats each with small, individually verifiable sub-steps.

## 7. Revision 4 (usage handbook and branch-check guard)

| File | Change |
| --- | --- |
| `docs/PLAN/11_USAGE_HANDBOOK.md` | New file: A to Z operating guide, one-time branch setup, branch selection table, per-chat loop, copy-paste blocks, owner review checklist, mistake-prevention matrix, troubleshooting, release sequence, secret checklist, document quick reference, do-not-do list |
| `docs/PLAN/chat-prompts/CHAT_01.md` to `CHAT_16.md` | Each prompt begins with a BASE BRANCH CHECK that stops the chat when it was started from a branch without the plan or without the previous completed work |
| `README.md`, `docs/PLAN/README.md`, `docs/PLAN/chat-prompts/README.md` | Pointers to the handbook and the one-time branch setup |

No specification content was changed. This revision only adds operating rules
that prevent wrong-branch starts and lost work.
