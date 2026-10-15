// path: docs/PLAN/chat-prompts/CHAT_06.md
# CHAT 06 OF 16 -- CRM, Catalog, Inventory, Suppliers, E-commerce Sync, Dashboards, Reports, Tax, Batch

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

SCOPE FOR THIS CHAT:
- 6.1 Client CRM CRUD, profiles, multiple contacts, search and filter, cursor
  pagination, four states.
- 6.2 Client activity, history, statements, merge, fuzzy duplicate detection
  (levenshtein distance at most three plus email match), import and export.
- 6.3 Product and service catalog: CRUD, categories, pricing, tax class, SKU
  uniqueness per tenant on non-deleted rows, fuzzy name duplicate suggestion.
- 6.4 Inventory: warehouses, stock levels, movements, transfers, adjustments,
  valuation, low stock alerts, SELECT FOR UPDATE on stock mutations.
- 6.5 Suppliers, purchase orders, supplier bills, supplier payments.
- 6.6 E-commerce sync: Shopify adapter, WooCommerce adapter, order to invoice
  mapping, sync management, idempotency, retries, error log.
- 6.7 Dashboard: revenue overview, sent versus paid, Recharts visualizations,
  widget layout, customization, drill-downs.
- 6.8 Reports baseline: sales, payment, expense, tax, client, inventory and
  project reports with filters, saved views, exports, scheduling and sharing.
- 6.9 Billing lifecycle: reminder engine, late fees and penalties, escalation
  states, dunning; email and WhatsApp delivery is dispatched through the
  notification interface until step 12 lands.
- 6.10 Tax: jurisdictions, rates, inclusive and exclusive handling, reverse
  charge, VAT and GST rules, Asia presets, tax reports.
- 6.11 Batch and bulk operations plus FX: batch invoice generation, bulk
  actions, batch_operations table with duplicate guard, and
  lib/fx/exchange-rates.ts with historical freeze for display conversion only.

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
starting point.

RESUME INSTRUCTION: read docs/handoffs/CHAT_06_PROGRESS.md, continue from the
first unchecked sub-step, never re-implement an existing passing file.
=== END PASTE ===
