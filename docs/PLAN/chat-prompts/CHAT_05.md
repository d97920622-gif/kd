// path: docs/PLAN/chat-prompts/CHAT_05.md
# CHAT 05 OF 16 -- Invoicing Core, Documents, PDF Engine, Numbering, Editor Experience

Open a NEW chat and paste everything between the marker lines.
Prerequisite: Step 4 complete.

=== BEGIN PASTE ===
You are continuing the KD SOLUTION IT platform build. This is CHAT 5 OF 16.
Step 5: Invoicing Core, Documents, PDF Engine and Numbering.

READ FIRST: 1. MASTER_PROMPT.md (schema rules, concurrency section, forbidden
practices). 2. FEATURE_LIST.md Part 3 sections A to E, L and M. 3. docs/PLAN/
00_MASTER_EXECUTION_PLAN.md (your migration window is 20260301000000 to
20260301999999). 4. docs/PLAN/02_CONVENTIONS_AND_GUARDRAILS.md. 5. docs/PLAN/
03_FILE_OWNERSHIP_MATRIX.md (you own invoices, estimates, PDF, pdf-templates).
6. docs/PLAN/04_DEFINITION_OF_DONE_AND_GATES.md (step 5 gates).
7. docs/PLAN/08_SUBSTEP_CHECKLISTS.md section "STEP 05".
8. docs/handoffs/CHAT_04_COMPLETED.md.

SCOPE FOR THIS CHAT:
- 5.1 Invoice schema: migrations, RLS, duplicate_hash, version, audit trigger,
  types/invoice.ts, Zod schemas.
- 5.2 Invoice CRUD: service, API, multi-step form, list and detail, drafts,
  trash and restore, bulk actions, filters, cursor pagination, mobile card
  list, four UI states.
- 5.3 Line items and the calculation engine: discounts, taxes through the
  Step 6 tax service, shipping, withholding, rounding policy, decimal.js only,
  numeric(18,4) columns.
- 5.4 Numbering: pg_advisory_xact_lock based per-tenant sequence, prefixes and
  suffixes, gapless guarantee, concurrency assertion script.
- 5.5 Status machine and workflow: transitions, guards, timeline, activity
  log, reminder hooks consumed by step 6.
- 5.6 Metadata and extras: custom fields, tags, notes, terms, attachments
  through the storage abstraction, consent capture hook, invoice duplicate
  detection (SHA-256 over tenant, client, total, date).
- 5.7 US professional invoice layout (Amazon-acceptable), template set,
  branding auto-fill, print stylesheet.
- 5.8 PDF engine: server-side React-PDF, immutable snapshot archive through
  storage, content hash, watermark option, signed download, CSV and Excel
  export.
- 5.9 Documents: estimates, credit notes with tax reversal, debit notes,
  proforma invoices, advance and deposit invoices, recurring invoices,
  installment plans.
- 5.10 Projects and time tracking: projects, timers, billable hours to
  invoice conversion, batch invoice generation.
- 5.11 Invoice reports: sent versus paid, aging, revenue summary; billing
  lifecycle hooks handed to step 6.
- 5.12 Editor experience: autosave, undo, saved views and explainability
  messages on invoice and document actions using the Step 1 primitives.

ADDED IN REVISION 2 (mandatory): read docs/PLAN/09_REVISION_2_ADDITIONS.md and
sections A11 to A15 of docs/PLAN/05_ADDITIONAL_REQUIREMENTS_SPEC.md before
starting. Added sub-step 5.12 editor experience (autosave, undo, saved views, explainability). Revision 2 only adds; the twenty absolute rules and
requirements A1 to A10 keep full force. Respect the ownership boundary table in
that file so no code is duplicated or conflicting.

NON-NEGOTIABLE RULES: English and ASCII only; USD only; every amount is
numeric(18,4) and every calculation uses decimal.js; JavaScript Number must
never touch money; no test files; no TODO, FIXME, "Coming Soon" or
placeholders; no `any`; no console.log; path comment on every file; Zod on
client and server; sanitize every input (rich text through DOMPurify); RLS
default-deny; optimistic locking with version; idempotency on document
generation and bulk operations; audit entry on create, update, delete, send,
void, restore and export; Zero Trust and Zero Tolerance.

EXECUTION LOOP per sub-step: implement, migrate, run `npm run verify` plus the
numbering concurrency assertion, commit as `<type>(step-05/S.S): <summary>`,
update `docs/handoffs/CHAT_05_PROGRESS.md`.

STEP 5 GATES: gapless numbering proven under concurrent inserts; PDF snapshot
reproducible byte for byte from the stored archive; zero Number usage in money
paths (checker green); duplicate detection raises a typed warning before
create; every invoice mutation audited.

COMMIT AND PUSH POLICY: commit and push only to the branch this session is
already on. Never create, rename or switch branches.

END OF CHAT, MANDATORY: write docs/handoffs/CHAT_05_COMPLETED.md with scope,
sub-steps, files, migrations, env vars, decisions, evidence and the next
starting point.

RESUME INSTRUCTION: read docs/handoffs/CHAT_05_PROGRESS.md, continue from the
first unchecked sub-step, never re-implement an existing passing file.
=== END PASTE ===
