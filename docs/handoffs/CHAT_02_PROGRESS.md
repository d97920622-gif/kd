// path: docs/handoffs/CHAT_02_PROGRESS.md

# CHAT 02 PROGRESS -- Step 2: Database Foundation, Migrations, RLS, Encryption, Audit Ledger

Status: in progress (sub-step 2.6 of 14)
Date started: 2026-10-17
Branch: arena/b7780282-kd
Starting commit: b2ef9ef (the step 1 audit close, pushed to origin)
Work order: docs/PLAN/08_SUBSTEP_CHECKLISTS.md STEP 02 (2.1 to 2.14), read
with docs/PLAN/04 (definition of done and gates), docs/PLAN/03 (ownership),
docs/PLAN/09 and docs/PLAN/05 sections A11 to A15 (Revision 2 additions).

Step 2 is not segmented: the whole step is one chat, one sub-step per commit,
and the loop below is repeated until 2.14 is done.

Per-sub-step loop (docs/PLAN/04 section 2 and the chat prompt):

1. Implement the sub-step.
2. `npm run db:migrate` on a fresh database.
3. `npm run db:rollback -- <timestamp>`.
4. `npm run db:migrate` again.
5. `npm run verify`, `npm run check:rls-coverage`, `npm run check:schema-standards`.
6. Commit `<type>(step-02/S.S): <summary>`.
7. Update this file.

`check:schema-standards` arrived in 2.2 and `check:rls-coverage` arrives in 2.7;
until then the loop runs the checks that exist and the handoff states which one
is not installed yet. The database half of the loop is `npm run db:assert`,
which reads the live catalog through the files in `scripts/db/sql/`.

## Sub-steps

| Sub-step | Description                                                                                                                                                            | Status  | Commit  |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------- |
| 2.1      | Migration framework: ordered runner, checksums, up and down pairs, seeds runner, `db:migrate`, `db:rollback`, `db:seed`, CI database job                               | done    | 49e483a |
| 2.2      | Database primitives: extensions, `uuid_generate_v7()`, `set_updated_at()`, universal column helper, `check-schema-standards`                                           | done    | dba8a11 |
| 2.3      | Tenancy tables: companies, company_settings, company_members, user_profiles, platform_users, invitations, devices, sessions                                            | done    | 1f36e7b |
| 2.4      | Access tables: roles, permissions, role_permissions, user_roles, login_attempts, login_lock_state                                                                      | done    | 90732a9 |
| 2.5      | Platform tables: plans, plan_features, subscriptions, entitlements, coupons, coupon_redemptions, feature_flags                                                         | done    | 5ba6225 |
| 2.6      | Reference tables: countries, currencies, tax_jurisdictions, timezones with read-only policies                                                                          | done    |         |
| 2.7      | RLS framework: `current_company_id()`, `current_role_name()`, default-deny, tenant isolation, shared read-only, isolation assertion and fuzz SQL, `check:rls-coverage` | pending |         |
| 2.8      | Audit ledger: audit_logs, sequence numbers, hash chain, Ed25519, immutability, triggers on every table, verification, merkle roots, export                             | pending |         |
| 2.9      | Encryption core: AES-256-GCM, key vault, key rotation, blind index, PII redaction, benchmark doc                                                                       | pending |         |
| 2.10     | Envelope keys: per-tenant DEKs, wrapped storage, usage audit, scheduled rotation window, crypto-shredding with verification query                                      | pending |         |
| 2.11     | Secret registry: records with owner and purpose, access audit, boot-time validation hook, rotation checklist                                                           | pending |         |
| 2.12     | Concurrency: idempotency middleware and table, optimistic, pessimistic, advisory and leader locks, duplicate detector, request_logs, rate_limits                       | pending |         |
| 2.13     | Governance data: data_classification, retention policies, DSAR tables, soft delete and restore helpers, backup metadata                                                | pending |         |
| 2.14     | Seeds and types: plans, permissions, countries, currencies, tax presets, super_admin bootstrap, `types/database.ts`, handoff                                           | pending |         |

Status values are `pending`, `done` or `blocked`. The commit cell is filled at
the handoff commit, because a commit cannot contain its own hash.

## Decisions taken in 2.6

- **Reference codes have two indexes each.** An ISO code is never reused and a
  foreign key needs an unconditional unique index to point at, so each code has
  a full unique index (the target, which also keeps a retired code reserved) and
  a partial unique index on `deleted_at IS NULL` (the soft-delete standard).
- **Five deferred foreign keys are added here**, each with its own leading index
  and `ON DELETE RESTRICT`: `companies.country_code`, `company_settings.timezone`,
  `company_settings.currency_code`, `plans.currency_code` and
  `subscriptions.currency_code`.
- **Only USD and UTC are seeded by the migration**, because the column defaults
  of `company_settings` and `plans` name them. Every other row is seeded in 2.14.
- **The base currency is USD by a check and by an index**, so a second base
  currency is refused twice over.
- **A tax jurisdiction window cannot overlap another live window for the same
  code.** A unique index cannot express a date window, so a trigger does it, under
  a per-code advisory lock, and the probe proves an update is refused too.
- **The rollback refuses while a tenant still uses a reference value.** Without
  that guard the rollback orphaned data that the re-migrate could not restore; the
  refusal is a restrict violation and drops nothing (evidence section 5).
- **Row level security is still off on every table.** 2.6 records the read-only
  intent for tenants in the migration header; 2.7 enables RLS on all 27 tables.

## Decisions taken in 2.5

- **Prices are `numeric(18,4)` and USD only.** Every money column is exact;
  `currency_code` is checked to `'USD'` until 2.6 adds the `currencies`
  foreign key. The probe reads `12.0000` back as the string `12.0000`.
- **The plan table owns a published price.** `lib/i18n/strings/en/pricing.ts`
  already says the plan table wins and names the four slugs; 2.14 seeds
  `free`, `starter`, `pro` and `enterprise` with `0`, `12`/`120`, `29`/`290`.
- **A subscription stores a price snapshot** (`price_amount`), never a read of
  the current plan price, so a later price change cannot rewrite an agreed
  amount.
- **One live subscription per tenant**, enforced by a partial unique index;
  an upgrade is cancel plus insert in one transaction.
- **Entitlements are the materialised answer** the guard reads, one row per
  tenant per feature with its source; the engine that writes them is step 4.
- **A feature flag is not an entitlement.** `feature_flags` gates a release
  (global row or per-tenant override, with a rollout); `entitlements` bills a
  feature. Two tables so one cannot answer for the other.
- **A coupon is one-time per tenant, enforced by a partial unique index.**
  The first draft also carried `max_redemptions_per_company`, which the probe
  proved contradictory (a reversed redemption blocked reuse, and a limit of 3
  could never be reached). The column was removed in favour of the index;
  the evidence records the defect and the reasoning.

## Decisions taken in 2.4

- **Roles are tenant rows, the permission catalog is platform reference.** A
  tenant's "manager" is not another tenant's; the catalog that every tenant
  reads has a null `company_id` enforced by a named check.
- **Tenancy is enforced by composite foreign keys, not by a service.**
  `role_permissions` and `user_roles` reference `roles (id, company_id)`, and
  `user_roles` references `company_members (id, company_id)`. Three
  cross-tenant inserts are refused by the database in the evidence file.
- **The composite target index must exist before the table that references
  it.** The first apply failed with `42830`, rolled back cleanly, and the
  corrected order applied; the failure is recorded in the evidence, not
  hidden.
- **`permissions.code` must agree with its parts** (`code = resource || '.' ||
action`), and `category` is not enumerated because resources grow with
  later steps.
- **`login_attempts` stores a hashed email, never clear text.** `email_hash`
  becomes the blind index 2.9 formalises and is the column the velocity query
  reads. `correlation_id` is unique per live row, so a retried handler cannot
  double-record one attempt.
- **`login_lock_state` is storage only.** Thresholds, the 60 minute lock and
  the exponential backoff are step 3. The state was proved to survive a
  `pg_ctl -m fast` restart, which is the property the step 3 gate depends on.
- **The permission override and the matrix engine are step 4**, with the
  "permission matrix SQL assertion" gate. 2.4 creates the six tables the
  checklist names and nothing more.

## Decisions taken in 2.3

- **Three layers, and `company_id` says which one.** `companies` is the
  tenant root (`company_id` null, enforced by a named check); `user_profiles`
  and `platform_users` are platform-level identity (`company_id` null,
  enforced); the other six tables are tenant rows, with `devices` and
  `sessions` nullable only for platform staff.
- **Status columns are text with a named check.** The evolution policy:
  closed sets that change with a release use a check, open sets use a lookup
  table, and a native enum (if one is ever needed) is named `{name}_enum`.
  Reason: the runner wraps each file in one transaction, and a value added to
  an enum in that transaction cannot be used by the same migration.
- **`company_members.role` is the hierarchy level, not a permission preset.**
  `owner` and `staff` only. The presets and the matrix are 2.4's `roles`,
  `permissions`, `role_permissions` and `user_roles`.
- **One active owner per tenant is a database rule**, through
  `idx_company_members_company_id_owner` on `(company_id) WHERE role =
'owner' AND status = 'active' AND deleted_at IS NULL`.
- **Devices and sessions are storage only.** Trust and the device centre are
  3.17; the registry, freeze and refresh rotation are 3.18. The tables carry
  the state those flows will read and write.
- **Invitations default to seven days** (`expires_at DEFAULT now() + interval
'7 days'`, FEATURE_LIST 591), store a SHA-256 token hash, and allow one
  pending row per email per tenant.
- **Two migrations for one sub-step.** 2.3 exceeded the 500-line file limit in
  one file, so it ships as `20260116020000_tenancy_identity` and
  `20260116020100_tenancy_membership`, both inside the 2.3 block and both in
  the 2.3 commit.

## Decisions taken in 2.2

- **`uuid_generate_v7()` is plpgsql over `gen_random_bytes`**: 48-bit
  millisecond prefix from `clock_timestamp()`, version nibble 7, variant `10`,
  62 random bits. No extension provides v7 on PostgreSQL 16, and `pgcrypto`
  already provides the randomness.
- **One `updated_at` writer.** `set_updated_at()` is a `BEFORE UPDATE` trigger
  function; it never touches `version`, because a hidden bump would defeat the
  optimistic lock of 2.12.
- **The universal columns are declared inline, with a guard.** Every later
  migration writes the six columns explicitly and ends with
  `assert_universal_columns(...)`, so a forgotten column fails the apply.
  `apply_universal_columns()` exists for an existing table that gains them.
- **Two halves of one standard.** The text check (`check:schema-standards`)
  runs in `verify` with no database; the catalog query
  (`scripts/db/sql/check-schema-standards.sql`) runs in `db:assert` and in the
  CI database job. Twenty rules, the same twenty.
- **`db:assert` is a runner, not a second implementation.** It executes every
  read-only file in `scripts/db/sql/` inside a read-only transaction. The
  isolation assertion (2.7), ledger verification (2.8) and lock assertion
  (2.12) add files, never another command.
- **The 2.1 ledgers were brought to the standard** rather than exempted: `id`
  defaults to v7, `version` starts at 0, the business-key unique indexes are
  partial on `deleted_at IS NULL`.

## Decisions taken in 2.1

- **The migration timestamp is the version.** The ledger stores the file name,
  its SHA-256, the duration and the apply time; nothing else is a version.
- **The runner owns the transaction.** One file plus its ledger row commit
  together. Files must not contain `BEGIN`, `COMMIT` or `ROLLBACK`.
- **Checksums cover normalized text** (BOM removed, CRLF folded, trailing blank
  lines removed). Any applied file is immutable; a fix is a new migration.
- **One advisory lock key** (`20260116000000`) serializes migrate, rollback and
  seed, so two runners cannot interleave.
- **Rollback deletes the ledger row first**, inside the same transaction,
  because the framework down file drops the ledger table.
- **The seeds ledger ships in 2.1, the seed files in 2.14.** `db:seed` reports
  zero pending until then.
- **The CI workflow gained a fourth job**, `database`, which applies the whole
  set to `postgres:16`, reverts it with `-- all`, applies it again and runs the
  seeds. The aggregate `ci` job depends on it.
- **`check:migration-pairs` was fixed.** It could not classify a `_down` file,
  so the first real pair failed the check. The fix and its four negative probes
  are recorded in `docs/EVIDENCE/step-02/2.1-migration-framework.md` section 5.

## Environment for the database loop

PostgreSQL is not installed in the sandbox, so the evidence runs used the
npm-distributed server binary `@embedded-postgres/linux-x64@17.5.0-beta.15`
(PostgreSQL 17.5) on port 55432, started outside the working tree from
`/tmp/pgtest`. The exact commands are in the evidence file, section 2. CI uses
`postgres:16`. `DATABASE_URL` is the only input the commands read; it is never
printed or logged.

## Step 2 gates (recorded at the end in CHAT_02_COMPLETED.md)

1. Fresh database migrates up and down clean.
2. RLS coverage is 100 percent.
3. The five universal columns are on every table.
4. Hash chain verification passes.
5. An audit trigger is present on every table.
6. The isolation assertion reports zero cross-tenant rows.
7. The key rotation rehearsal is documented.

At the moment of writing: gate 1 is proven for the 2.1 to 2.6 objects
(`db:assert` reports zero violations after a full down and up cycle), gate 3
is proven by the catalog query for all twenty-seven tables, gates 2, 4, 5 and
6 belong to later sub-steps, and gate 7 belongs to 2.10. The step 3
dependency "lock state survives a server restart" was already proven against
the 2.4 storage.

## Next action

Sub-step 2.7: the row level security framework. Read the 2.7 row in
`docs/PLAN/08_SUBSTEP_CHECKLISTS.md`, the RLS rules in `docs/PLAN/03` and the
tenancy section of `docs/PLAN/02`, then add one migration pair that creates
`current_company_id()` and `current_role_name()`, enables row level security on
all twenty-seven tables with default-deny, and writes the tenant isolation policy
(company_id must equal the caller's company) and the shared read-only policy for
the platform reference rows (`plans`, `plan_features`, `permissions`, `currencies`,
`countries`, `timezones`, `tax_jurisdictions`, and the global rows of
`feature_flags`). The isolation assertion and the isolation fuzz SQL go in
`scripts/db/sql/`, and `scripts/checks/rls-coverage.mjs` with an
`npm run check:rls-coverage` script arrives with them, with a README row.

Test the policies as a non-owner role, because the table owner bypasses row
level security unless the table is forced.
