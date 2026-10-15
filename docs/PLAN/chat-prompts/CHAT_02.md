// path: docs/PLAN/chat-prompts/CHAT_02.md
# CHAT 02 OF 16 -- Database Foundation, Migrations, RLS, Encryption, Audit Ledger

Open a NEW chat and paste everything between the marker lines.
Prerequisite: Step 1 complete (`docs/handoffs/CHAT_01_COMPLETED.md`).

=== BEGIN PASTE ===
You are continuing the KD SOLUTION IT platform build. This is CHAT 2 OF 16.
Step 2 of the 16-step execution plan: Database Foundation, Migrations, RLS,
Encryption, Audit Ledger.

READ FIRST, in this order, inside the repository:
1. MASTER_PROMPT.md (absolute rules, database schema rules, security layers 4,
   5 and the immutable audit log section).
2. FEATURE_LIST.md Part 9 sections A, B, K, L and Part 11 section C.
3. docs/PLAN/00_MASTER_EXECUTION_PLAN.md (your migration window is
   20260116000000 to 20260116999999).
4. docs/PLAN/02_CONVENTIONS_AND_GUARDRAILS.md.
5. docs/PLAN/03_FILE_OWNERSHIP_MATRIX.md (you own the DB primitives, RLS
   helpers, encryption core, audit ledger, locking and idempotency).
6. docs/PLAN/04_DEFINITION_OF_DONE_AND_GATES.md (step 2 gates).
7. docs/PLAN/08_SUBSTEP_CHECKLISTS.md, section "STEP 02".
8. docs/handoffs/CHAT_01_COMPLETED.md.

BASE BRANCH CHECK (run this before anything else): confirm that the branch this
chat started from already contains the previous chat's work. For a new step,
docs/handoffs/CHAT_01_COMPLETED.md must exist. For a continuation of the
same step, docs/handoffs/CHAT_02_PROGRESS.md must exist. If they are missing,
stop immediately and report that the chat was started from the wrong base
branch (the owner must select the mainline branch that holds the completed
work); do not recreate earlier files and do not start coding.

SCOPE FOR THIS CHAT:
- 2.1 Migration framework: ordered runner, checksum verification, up and down
  pairs, seeds runner, `npm run db:migrate`, `npm run db:rollback -- <ts>`.
- 2.2 DB primitives: required extensions, `uuid_generate_v7()`,
  `set_updated_at()`, universal column helper, schema standards checker.
- 2.3 Tenancy tables: companies, company_settings, company_members,
  user_profiles, platform_users, invitations, devices, sessions.
- 2.4 Access tables: roles, permissions, role_permissions, user_roles,
  login_attempts, login_lock_state (state only; flow is step 3).
- 2.5 Platform tables: plans, plan_features, subscriptions, entitlements,
  coupons, coupon_redemptions, feature_flags.
- 2.6 Reference tables: countries, currencies, tax_jurisdictions, timezones
  with read-only policies for authenticated tenants.
- 2.7 RLS framework: `current_company_id()`, `current_role_name()`,
  default-deny policy on every table, tenant isolation policies, shared
  read-only policies, isolation assertion script, isolation fuzz script.
- 2.8 Audit ledger: audit_logs with sequence numbers, hash chain, Ed25519
  signatures, append-only enforcement, audit triggers for all tables,
  verification function, merkle root table and function, export function.
- 2.9 Encryption core: AES-256-GCM module, key vault, key rotation module,
  blind index for searchable encrypted fields, PII redaction, benchmark doc.
- 2.10 Envelope key management: per-tenant data encryption keys, wrapped key
  storage, key usage audit, scheduled rotation window, crypto-shredding
  procedure with a verification query.
- 2.11 Secret registry: centralized secret records with owner, purpose, access
  audit, boot-time validation hook and rotation checklist.
- 2.12 Concurrency primitives: idempotency middleware and table, optimistic
  lock service, pessimistic lock service, advisory lock service, leader lock,
  duplicate detector base, request_logs, rate_limits.
- 2.13 Governance data: data_classification, retention policies, DSAR tables,
  soft delete and restore helpers, backup metadata.
- 2.14 Seeds and type generation: plans, permission matrix baseline, countries,
  currencies, tax presets, super_admin bootstrap, types/database.ts pipeline.

FEATURE SOURCES: FEATURE_LIST.md Part 9 A (isolation), B (encryption and
secrets), K (database engineering), L (concurrency), Part 11 C1 (immutable
audit log), plus the audit log field list in MASTER_PROMPT.md.

ADDED IN REVISION 2 (mandatory): read docs/PLAN/09_REVISION_2_ADDITIONS.md and
sections A11 to A15 of docs/PLAN/05_ADDITIONAL_REQUIREMENTS_SPEC.md before
starting. Added sub-steps 2.10 envelope keys with rotation and crypto-shredding, and 2.11 secret registry. Revision 2 only adds; the twenty absolute rules and
requirements A1 to A10 keep full force. Respect the ownership boundary table in
that file so no code is duplicated or conflicting.

NON-NEGOTIABLE RULES: English and ASCII only; USD only with numeric(18,4) and
decimal.js; no test files; no TODO, FIXME, "Coming Soon" or placeholders; no
`any`; no console.log; path comment on every file; every table has id (UUID
v7), company_id, created_at, updated_at, deleted_at, and version on editable
rows; RLS enabled with default-deny on every table; foreign keys ON DELETE
RESTRICT; partial unique index for soft-deleted rows; index on company_id and
created_at; audit trigger on every table; migrations idempotent with a matching
_down.sql; parameterized SQL only; Zero Trust and Zero Tolerance.

EXECUTION LOOP per sub-step: implement, migrate up, migrate down, re-migrate,
run `npm run verify` plus `npm run check:rls-coverage` and
`npm run check:schema-standards`, commit as `<type>(step-02/S.S): <summary>`,
update `docs/handoffs/CHAT_02_PROGRESS.md`.

STEP 2 GATES: fresh-database migration up and down clean; RLS coverage 100
percent; every table has the five universal columns; hash-chain verification
passes; audit trigger present on every table; isolation assertion script
reports zero cross-tenant rows; key rotation rehearsal documented.

COMMIT AND PUSH POLICY: commit and push only to the branch this session is
already on. Never create, rename or switch branches.

END OF CHAT, MANDATORY: write docs/handoffs/CHAT_02_COMPLETED.md with the
required sections and the exact starting point for chat 3.

RESUME INSTRUCTION: read docs/handoffs/CHAT_02_PROGRESS.md, continue from the
first unchecked sub-step, never re-implement an existing passing file.
=== END PASTE ===
