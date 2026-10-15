// path: docs/PLAN/chat-prompts/CHAT_06.md
# CHAT 06 OF 16 -- CRM, Catalog, Inventory, Suppliers, E-commerce Sync, Dashboards, Reports, Tax Engine, Batch (4 segments)

Open a NEW chat and paste everything between the marker lines.
Prerequisite: Step 5 complete.

=== BEGIN PASTE ===
You are continuing the KD SOLUTION IT platform build. This is CHAT 6 OF 16.
Step 6: CRM, Catalog, Inventory, Suppliers, E-commerce Sync, Dashboards,
Reports, Tax and Batch operations.

READ FIRST: 1. MASTER_PROMPT.md (duplicate prevention section, performance and
schema rules). 2. FEATURE_LIST.md Part 3 sections F to K, N and O, plus the
Asia-specific sections in Part 9 section P. 3. docs/PLAN/
00_MASTER_EXECUTION_PLAN.md (your migration window is 20260316000000 to
20260316999999). 4. docs/PLAN/02_CONVENTIONS_AND_GUARDRAILS.md. 5. docs/PLAN/
03_FILE_OWNERSHIP_MATRIX.md. 6. docs/PLAN/04_DEFINITION_OF_DONE_AND_GATES.md
(step 6 gates). 7. docs/PLAN/08_SUBSTEP_CHECKLISTS.md section "STEP 06".
8. docs/handoffs/CHAT_05_COMPLETED.md.

SEGMENT EXECUTION MODEL: this prompt covers the whole step, which is executed as
segments 6A to 6D, one segment per chat. In this chat, find your
current segment in docs/handoffs/CHAT_06_PROGRESS.md, execute only that segment,
and stop at its segment gate. Then paste this same prompt in a new chat for the
next segment. Segment rules: docs/PLAN/10_SEGMENT_GUIDE.md.

BASE BRANCH CHECK (run this before anything else): confirm that the branch this
chat started from already contains the previous chat's work. For a new step,
docs/handoffs/CHAT_05_COMPLETED.md must exist. For a continuation of the
same step, docs/handoffs/CHAT_06_PROGRESS.md must exist. If they are missing,
stop immediately and report that the chat was started from the wrong base
branch (the owner must select the mainline branch that holds the completed
work); do not recreate earlier files and do not start coding.

SCOPE FOR THIS STEP (all segments; do not implement later steps):
### SEGMENT 6A -- CRM (chat 1 of 4)
- 6.1 Client CRUD with soft delete, restore and audit.
- 6.2 Client profile: multiple contacts, billing and shipping addresses, payment terms.
- 6.3 Client list: search, filter, cursor pagination, mobile card list, four states.
- 6.4 Client activity and history timeline.
- 6.5 Client statements with opening balance, transactions and closing balance.
- 6.6 Client merge and fuzzy duplicate detection using levenshtein distance at most three plus email match.
- 6.7 Client import and export with duplicate preview and validation.
Segment gate: merge produces a single balanced statement; the duplicate detector raises a typed DuplicateError.

### SEGMENT 6B -- Catalog, inventory, suppliers (chat 2 of 4)
- 6.8 Product and service CRUD with categories and images through storage.
- 6.9 Pricing, tax class, SKU uniqueness per tenant and fuzzy name duplicate suggestion.
- 6.10 Warehouses and stock levels.
- 6.11 Stock movements, transfers and adjustments with SELECT FOR UPDATE.
- 6.12 Inventory valuation and low stock alerts.
- 6.13 Supplier registry.
- 6.14 Purchase orders with approval and receiving.
- 6.15 Supplier bills and supplier payments.
Segment gate: inventory concurrency assertion passes; stock never goes negative under concurrent writes.

### SEGMENT 6C -- E-commerce, dashboard, reports, lifecycle (chat 3 of 4)
- 6.16 Shopify adapter: order import, mapping and idempotency.
- 6.17 WooCommerce adapter: order import, mapping and idempotency.
- 6.18 Sync management: retries, error log, manual resync and audit.
- 6.19 Dashboard core: revenue overview, sent versus paid, key metrics.
- 6.20 Dashboard customization: widget layout, saved views and drill-downs.
- 6.21 Reports A: sales, payment and expense reports with filters and exports.
- 6.22 Reports B: tax, client, inventory and project reports with saved views, scheduling and sharing.
- 6.23 Billing lifecycle: reminder engine, late fees and penalties, escalation states and dunning.
Segment gate: every report reconciles to its source documents; exports are reproducible.

### SEGMENT 6D -- Tax engine, batch, FX (chat 4 of 4)
- 6.24 Tax core: tax profiles per company with registration number, filing frequency and liability owner, jurisdictions and effective-dated versioned rates.
- 6.25 Tax classes, inclusive and exclusive handling, per-line and invoice-level modes, rounding policy.
- 6.26 Tax determination engine: place of supply, country and state, B2B and B2C, reverse charge, exemption with expiry, zero-rated, out of scope, explainability record.
- 6.27 Tax documents: country-specific mandatory fields, reverse-charge statement and exemption certificate register.
- 6.28 Tax reporting: collected versus remitted versus outstanding per period, jurisdiction and rate, customer tax summary and exports.
- 6.29 Batch and bulk operations: batch invoice, bulk actions, batch guard and audit.
- 6.30 FX rates with historical freeze for display conversion only, handoff.
Segment gate: no rate is hardcoded anywhere; the determination result is stored and explained on every document.

ADDED IN REVISION 2 (mandatory): read docs/PLAN/09_REVISION_2_ADDITIONS.md and
sections A11 to A15 of docs/PLAN/05_ADDITIONAL_REQUIREMENTS_SPEC.md before
starting. Added sub-steps 6.24 to 6.28 tax core, determination engine, tax documents and reporting, all in segment 6D. Revision 2 only adds; the twenty absolute rules and
requirements A1 to A10 keep full force. Respect the ownership boundary table in
that file so no code is duplicated or conflicting.

NON-NEGOTIABLE RULES: English and ASCII only; base currency USD; display
conversion must never change stored amounts; numeric(18,4) and decimal.js; no
test files; no TODO, FIXME, "Coming Soon" or placeholders; no `any`; no
console.log; path comment on every file; Zod on client and server; sanitize
every input; RLS default-deny; optimistic locking with version; idempotency on
sync and bulk operations; audit entry on every mutation and export; duplicate
detectors implemented in services/ and never inline in routes; Zero Trust and
Zero Tolerance.

EXECUTION LOOP per sub-step: implement, migrate, run `npm run verify`, commit
as `<type>(step-06/S.S): <summary>`, update
`docs/handoffs/CHAT_06_PROGRESS.md`.

STEP 6 GATES: tenant isolation verified on every list and detail query;
duplicate detectors raise typed DuplicateError with a resolution path;
statement generation balances to zero; inventory concurrency assertion passes;
import preview shows duplicates before commit.

COMMIT AND PUSH POLICY: commit and push only to the branch this session is
already on. Never create, rename or switch branches.

END OF CHAT, MANDATORY: write docs/handoffs/CHAT_06_COMPLETED.md with scope,
sub-steps, files, migrations, env vars, decisions, evidence and the next
starting point. Also record the segment status: complete with the next segment named,
or partial with the exact sub-step to resume from.

SEGMENT RULE: execute exactly one segment per chat. Never start the next segment
in the same chat. At the end of a segment, run npm run verify, record the segment
gate evidence, update the progress file, and state the segment status line:
"Segment NNX complete; next segment NNX+1" or "Segment NNX partial; resume at
sub-step NN.YY".

RESUME INSTRUCTION: read docs/handoffs/CHAT_06_PROGRESS.md, continue from the
first unchecked sub-step, never re-implement an existing passing file.
=== END PASTE ===
