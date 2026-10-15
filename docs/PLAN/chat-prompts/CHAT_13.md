// path: docs/PLAN/chat-prompts/CHAT_13.md
# CHAT 13 OF 16 -- Payroll, HR, Expenses, Double-entry Accounting, Tax Liability and Remittance, Statements, Reports (4 segments)

Open a NEW chat and paste everything between the marker lines.
Prerequisite: Step 12 complete.

=== BEGIN PASTE ===
You are continuing the KD SOLUTION IT platform build. This is CHAT 13 OF 16.
Step 13: payroll, HR, expenses, double-entry accounting, financial statements
and the full reports suite.

READ FIRST: 1. MASTER_PROMPT.md (schema rules, concurrency, evidence). 2.
FEATURE_LIST.md Part 8 sections A to M. 3. docs/PLAN/
00_MASTER_EXECUTION_PLAN.md (your migration window is 20260701000000 to
20260701999999). 4. docs/PLAN/02_CONVENTIONS_AND_GUARDRAILS.md. 5. docs/PLAN/
03_FILE_OWNERSHIP_MATRIX.md. 6. docs/PLAN/04_DEFINITION_OF_DONE_AND_GATES.md
(step 13 gates). 7. docs/PLAN/08_SUBSTEP_CHECKLISTS.md section "STEP 13".
8. docs/handoffs/CHAT_12_COMPLETED.md.

SEGMENT EXECUTION MODEL: this prompt covers the whole step, which is executed as
segments 13A to 13D, one segment per chat. In this chat, find your
current segment in docs/handoffs/CHAT_13_PROGRESS.md, execute only that segment,
and stop at its segment gate. Then paste this same prompt in a new chat for the
next segment. Segment rules: docs/PLAN/10_SEGMENT_GUIDE.md.

BASE BRANCH CHECK (run this before anything else): confirm that the branch this
chat started from already contains the previous chat's work. For a new step,
docs/handoffs/CHAT_12_COMPLETED.md must exist. For a continuation of the
same step, docs/handoffs/CHAT_13_PROGRESS.md must exist. If they are missing,
stop immediately and report that the chat was started from the wrong base
branch (the owner must select the mainline branch that holds the completed
work); do not recreate earlier files and do not start coding.

SCOPE FOR THIS STEP (all segments; do not implement later steps):
### SEGMENT 13A -- Payroll (chat 1 of 4)
- 13.1 Employee profiles with documents stored through the storage abstraction.
- 13.2 Pay structures: allowances, deductions and display currency rules.
- 13.3 Payroll tax calculation per jurisdiction with presets.
- 13.4 Pay runs with the approval chain and lock after approval.
- 13.5 Payslip generation and encrypted archive with content hash.
- 13.6 Payroll duplicate detection on tenant, employee and pay period, plus payout integration.
- 13.7 Payroll accounting integration and payroll reports.
- 13.8 Employee self-service portal over token links.
Segment gate: payroll totals reconcile to payslips and to the ledger.

### SEGMENT 13B -- HR and expenses (chat 2 of 4)
- 13.9 Organization structure and positions.
- 13.10 Onboarding and offboarding checklists.
- 13.11 Performance notes and leave management with balances and approval.
- 13.12 Expense CRUD with categories and cost centers.
- 13.13 Receipt capture with OCR and smart entry.
- 13.14 Expense policies and approval routing.
- 13.15 Recurring expenses and reimbursements.
- 13.16 Expense reports and duplicate hash detection.
Segment gate: expense posting produces balanced journals; duplicate detection raises typed errors.

### SEGMENT 13C -- Accounting core and reconciliation (chat 3 of 4)
- 13.17 Chart of accounts templates and account management.
- 13.18 Manual journal entries with posting rules and duplicate detection.
- 13.19 Automated journals from invoices, payments, expenses, payroll and fixed assets.
- 13.20 Period locks and trial balance.
- 13.21 Bank reconciliation A: statement import and matching engine with rules.
- 13.22 Bank reconciliation B: unmatched queues, adjustments and reconciliation reports.
- 13.23 Fixed assets and depreciation schedules with disposal.
- 13.24 Budgets with allocation, tracking and variance alerts.
- 13.25 Multi-book, multi-entity and consolidation with accounting standards configuration.
Segment gate: debits equal credits after every posting; period close is irreversible and audited.

### SEGMENT 13D -- Statements, tax remittance, intelligence (chat 4 of 4)
- 13.26 Profit and loss with comparatives and drill-down.
- 13.27 Balance sheet with comparatives and drill-down.
- 13.28 Cash flow statement, statement of equity and exports.
- 13.29 Period close checklist, tax filing preparation and accounting-grade audit features.
- 13.30 Tax liability ledger: segregated Tax Payable accounts per jurisdiction and rate, tax periods, return draft from Step 6 determination data and reconciliation assertion.
- 13.31 Tax return review and approval with variance explanation.
- 13.32 Tax remittance workflow: remittance record with method, authority reference, date, proof and USD FX freeze, journal entry Dr Tax Payable and Cr Bank, bank reconciliation link, filed and closed states and evidence pack.
- 13.33 Filing operations: filing calendar with deadline reminders, penalty and interest tracking, accountant-ready export pack and platform self-billing tax treatment.
- 13.34 Financial intelligence: cash flow forecasting, BI dashboards and fifteen plus reports with scheduling and saved views, handoff.
Segment gate: no return can be marked filed without an approved remittance record containing method, authority reference, date and proof; statements reconcile to the trial balance.

ADDED IN REVISION 2 (mandatory): read docs/PLAN/09_REVISION_2_ADDITIONS.md and
sections A11 to A15 of docs/PLAN/05_ADDITIONAL_REQUIREMENTS_SPEC.md before
starting. Added sub-steps 13.30 tax liability ledger, 13.32 tax remittance workflow and 13.33 filing operations, in segment 13D. Revision 2 only adds; the twenty absolute rules and
requirements A1 to A10 keep full force. Respect the ownership boundary table in
that file so no code is duplicated or conflicting.

NON-NEGOTIABLE RULES: English and ASCII only; USD only; numeric(18,4) with
decimal.js, never JavaScript Number; no test files; no TODO, FIXME, "Coming
Soon" or placeholders; no `any`; no console.log; path comment on every file;
Zod on client and server; sanitize every input; RLS default-deny; optimistic
locking with version; idempotency on pay runs, journal posting and imports;
audit entry for every payroll, journal, expense, period and reconciliation
mutation; payslips and statements archived encrypted through the storage
abstraction; never write forbidden payment brand names; Zero Trust and Zero
Tolerance.

EXECUTION LOOP per sub-step: implement, migrate, run `npm run verify` plus the
ledger balance assertion, commit as `<type>(step-13/S.S): <summary>`, update
`docs/handoffs/CHAT_13_PROGRESS.md`.

STEP 13 GATES: debits equal credits after every posting; period close is
irreversible and audited; payroll totals reconcile to payslips and to the
ledger; reports reconcile to the trial balance; duplicate detectors raise
typed errors; payslip PDFs archived with hashes.

COMMIT AND PUSH POLICY: commit and push only to the branch this session is
already on. Never create, rename or switch branches.

END OF CHAT, MANDATORY: write docs/handoffs/CHAT_13_COMPLETED.md with scope,
sub-steps, files, migrations, env vars, decisions, evidence and the next
starting point. Also record the segment status: complete with the next segment named,
or partial with the exact sub-step to resume from.

SEGMENT RULE: execute exactly one segment per chat. Never start the next segment
in the same chat. At the end of a segment, run npm run verify, record the segment
gate evidence, update the progress file, and state the segment status line:
"Segment NNX complete; next segment NNX+1" or "Segment NNX partial; resume at
sub-step NN.YY".

RESUME INSTRUCTION: read docs/handoffs/CHAT_13_PROGRESS.md, continue from the
first unchecked sub-step, never re-implement an existing passing file.
=== END PASTE ===
