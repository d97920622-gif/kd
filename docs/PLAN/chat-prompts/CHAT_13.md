// path: docs/PLAN/chat-prompts/CHAT_13.md
# CHAT 13 OF 16 -- Payroll, HR, Expenses, Double-entry Accounting, Financial Statements, Reports

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

SCOPE FOR THIS CHAT:
- 13.1 Payroll core: employee profiles, pay structures, allowances and
  deductions, tax calculation per jurisdiction with presets, pay runs with
  approval, payslip generation, duplicate detection on tenant, employee and
  pay period.
- 13.2 Payroll finance: payout integration through the payout engine,
  accounting integration, compliance documents, reports, employee
  self-service portal over token links.
- 13.3 HR lite: organization structure, onboarding and offboarding checklists,
  performance notes, leave and absence management with balances and approval.
- 13.4 Expenses: CRUD, receipt capture with OCR, categories, policies,
  approvals, recurring expenses, reimbursements, expense reports, duplicate
  hash detection on receipt hash, amount and date.
- 13.5 Accounting core: chart of accounts templates, account management,
  manual journal entries, posting rules, period awareness, duplicate detection
  on post using a hash of sorted accounts, amount and date.
- 13.6 Automated journals generated from invoices, payments, expenses, payroll
  and fixed assets; period locks; trial balance; full audit trail.
- 13.7 Financial statements: profit and loss, balance sheet, cash flow,
  statement of equity, comparatives by period, drill-down to source documents,
  export to PDF and CSV.
- 13.8 Bank reconciliation at accounting grade: statement import, matching
  engine with rules, unmatched queues, adjustment entries, reconciliation
  reports, audit.
- 13.9 Fixed assets with depreciation schedules and disposal; budgets with
  allocation, tracking and variance alerts; multi-book and multi-entity with
  consolidation; accounting standards configuration.
- 13.10 Period management and close checklist; tax filing preparation; tax
  reports; accounting-grade audit features.
- 13.11 Financial intelligence: cash flow forecasting, BI dashboards, and at
  least fifteen reports with scheduling, saved views and sharing.

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
starting point.

RESUME INSTRUCTION: read docs/handoffs/CHAT_13_PROGRESS.md, continue from the
first unchecked sub-step, never re-implement an existing passing file.
=== END PASTE ===
