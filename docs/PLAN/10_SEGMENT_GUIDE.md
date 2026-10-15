// path: docs/PLAN/10_SEGMENT_GUIDE.md
# Segment Guide (how one step is executed across several chats)

Purpose: the six heavy steps (1, 3, 4, 6, 10, 13) carry a large amount of work.
Each of them is divided into four segments, and each segment is executed in its
own chat. Segments never change the step count (still sixteen steps and sixteen
prompts); they only define where a chat stops and where the next chat starts.

## 1. Segment rules

1. One chat executes exactly one segment, from its first unchecked sub-step to
   the segment gate.
2. A chat never starts the next segment, even when time or context remains.
   This keeps every commit, handoff and gate small and verifiable.
3. At the end of a segment the chat runs `npm run verify`, records the segment
   gate evidence, updates `docs/handoffs/CHAT_NN_PROGRESS.md`, and updates
   `docs/handoffs/CHAT_NN_COMPLETED.md` with the status line
   `Segment NNX complete; next segment NNX+1`.
4. The next chat pastes the same chat prompt again. The prompt's RESUME
   INSTRUCTION tells the agent to read the progress file, find the first
   unchecked sub-step, and continue from the next segment.
5. No sub-step is ever executed twice and no file is written by two segments.
6. A segment gate failure blocks the next segment. Fix forward inside the same
   segment, never inside the next one.

## 2. Segment map

| Step | Segment | Focus | Sub-steps | Chats for the step |
| --- | --- | --- | --- | --- |
| 1 | 1A | Toolchain and quality gates | 1.1 to 1.7 | 4 |
| 1 | 1B | Core libraries and design system | 1.8 to 1.17 | |
| 1 | 1C | Brand, layout, navigation | 1.18 to 1.23 | |
| 1 | 1D | States, hardening, public site, governance | 1.24 to 1.32 | |
| 2 | 2A | Whole step (single segment) | 2.1 to 2.14 | 1 |
| 3 | 3A | Auth foundations | 3.1 to 3.5 | 4 |
| 3 | 3B | Signup, login, login lock | 3.6 to 3.11 | |
| 3 | 3C | Factors and credentials | 3.12 to 3.16 | |
| 3 | 3D | Devices, sessions, network trust, surfaces | 3.17 to 3.22 | |
| 4 | 4A | Roles, permissions, approval engine | 4.1 to 4.5 | 4 |
| 4 | 4B | Onboarding, company settings, team | 4.6 to 4.12 | |
| 4 | 4C | KYC, notifications, message log | 4.13 to 4.17 | |
| 4 | 4D | Platform billing, enterprise access, security centre | 4.18 to 4.24 | |
| 5 | 5A | Whole step (single segment) | 5.1 to 5.12 | 1 |
| 6 | 6A | CRM | 6.1 to 6.7 | 4 |
| 6 | 6B | Catalog, inventory, suppliers | 6.8 to 6.15 | |
| 6 | 6C | E-commerce, dashboard, reports, lifecycle | 6.16 to 6.23 | |
| 6 | 6D | Tax engine, batch, FX | 6.24 to 6.30 | |
| 7 | 7A | Whole step (single segment) | 7.1 to 7.10 | 1 |
| 8 | 8A | Whole step (single segment) | 8.1 to 8.13 | 1 |
| 9 | 9A | Whole step (single segment) | 9.1 to 9.16 | 1 |
| 10 | 10A | Checkout page | 10.1 to 10.10 | 4 |
| 10 | 10B | Payment core, links, refunds, fees | 10.11 to 10.18 | |
| 10 | 10C | Wallet, merchant of record, payouts | 10.19 to 10.24 | |
| 10 | 10D | Disputes, consent evidence, subscriptions, BNPL, reports | 10.25 to 10.32 | |
| 11 | 11A | Whole step (single segment) | 11.1 to 11.10 | 1 |
| 12 | 12A | Whole step (single segment) | 12.1 to 12.10 | 1 |
| 13 | 13A | Payroll | 13.1 to 13.8 | 4 |
| 13 | 13B | HR and expenses | 13.9 to 13.16 | |
| 13 | 13C | Accounting core and reconciliation | 13.17 to 13.25 | |
| 13 | 13D | Statements, tax remittance, intelligence | 13.26 to 13.34 | |
| 14 | 14A | Whole step (single segment) | 14.1 to 14.11 | 1 |
| 15 | 15A | Whole step (single segment) | 15.1 to 15.14 | 1 |
| 16 | 16A | Whole step (single segment) | 16.1 to 16.11 | 1 |

A single-segment step may still need a second chat if context runs out; the
resume instruction continues from the first unchecked sub-step, so nothing is
repeated.

## 3. Segment start checklist (first message of a chat)

1. Read the step prompt and its ADDED IN REVISION 2 block.
2. Read `docs/handoffs/CHAT_NN_PROGRESS.md`; identify the current or next
   segment.
3. Confirm the working tree is clean and `npm run verify` is green before
   writing new code.
4. Start at the first unchecked sub-step of the current segment.

## 4. Segment end checklist (last actions of a chat)

1. Run `npm run verify` and record the output summary.
2. Run the segment gate commands and record the evidence.
3. Update `docs/handoffs/CHAT_NN_PROGRESS.md` with every completed sub-step and
   its commit hash, plus the segment status.
4. Update `docs/handoffs/CHAT_NN_COMPLETED.md` with scope, files, migrations,
   env vars, decisions and `Segment NNX complete; next segment NNX+1`.
5. Commit the handoff files and push the session branch.
6. Stop. Do not start the next segment in the same chat.

## 5. Segment size discipline

- One sub-step equals one commit and touches a small, named set of files.
- If a sub-step turns out to need more than roughly one screen of new logic,
  split it into two sub-steps inside the same segment and note the split in the
  progress file.
- Never merge two sub-steps into one commit.
- Never leave a segment with a failing gate.

## 6. Relationship to the other plan files

- Work orders and segment headings: `08_SUBSTEP_CHECKLISTS.md`.
- Ownership boundaries so segments never collide: `03_FILE_OWNERSHIP_MATRIX.md`
  and `09_REVISION_2_ADDITIONS.md` section 2.
- Gates: `04_DEFINITION_OF_DONE_AND_GATES.md` plus each segment gate line in
  `08_SUBSTEP_CHECKLISTS.md`.
- Paste-ready prompts: `chat-prompts/CHAT_01.md` to `CHAT_16.md`, each carrying
  its own segment table and stop condition.
