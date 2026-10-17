// path: migrations/README.md

# Migrations

Every schema change to the platform database is a migration pair in this
directory, applied by `npm run db:migrate` and reverted by
`npm run db:rollback -- <timestamp>`.

## Naming

```text
migrations/{14-digit timestamp}_{snake_case_description}.sql
migrations/{14-digit timestamp}_{snake_case_description}_down.sql
```

- The timestamp is the version. It is unique across the directory, it sorts
  lexicographically in apply order, and `check:migration-pairs` fails when two
  files share one or when a pair is incomplete.
- The description is lower snake case: `create_audit_logs`, not `CreateAuditLogs`.
- A pair is one commit. The up file and the down file are written together and
  reviewed together, because a rollback nobody tested is not a rollback.

## Step 2 timestamp window

Step 2 may only use timestamps inside `20260116000000` to `20260116999999`
(`docs/PLAN/00_MASTER_EXECUTION_PLAN.md` section 3). Each sub-step owns a block
of one hundred sequence numbers, and later steps keep to their own window.

| Sub-step | Block start    | Scope                                    |
| -------- | -------------- | ---------------------------------------- |
| 2.1      | 20260116000000 | Migration framework: the two ledgers     |
| 2.2      | 20260116010000 | Database primitives and the schema check |
| 2.3      | 20260116020000 | Tenancy tables                           |
| 2.4      | 20260116030000 | Access tables                            |
| 2.5      | 20260116040000 | Platform tables                          |
| 2.6      | 20260116050000 | Reference tables                         |
| 2.7      | 20260116060000 | Row level security framework             |
| 2.8      | 20260116070000 | Audit ledger                             |
| 2.9      | 20260116080000 | Encryption core support tables           |
| 2.10     | 20260116090000 | Envelope keys and key usage              |
| 2.11     | 20260116100000 | Secret registry                          |
| 2.12     | 20260116110000 | Concurrency support tables               |
| 2.13     | 20260116120000 | Governance data                          |

Sub-step 2.14 adds no migration: it adds seed data, which lives in `seeds/`
and has its own ledger. A sub-step that needs more than one migration takes
the next free sequence number inside its own block, for example
`20260116060100` for the second migration of sub-step 2.7.

## Rules the runner enforces

1. **One transaction per file.** The runner opens the transaction, runs the
   file, writes the ledger row and commits. A file must never contain `BEGIN`,
   `COMMIT` or `ROLLBACK`: the second transaction boundary would commit half a
   migration.
2. **A file is idempotent.** `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT
EXISTS`, `CREATE OR REPLACE FUNCTION`, and `DROP ... IF EXISTS` in the down
   file. A migration that fails midway has already rolled back, but a rerun
   after an unrelated failure must not fail on an object it created in an
   earlier, committed run.
3. **A file does not depend on a session setting the runner does not make.**
   The runner sets `lock_timeout` only. Extensions, search path and role are
   the database's configuration.
4. **An applied file is never edited.** The ledger stores the SHA-256 of the
   file that was applied. A file whose content changed stops the next run with
   a drift error: schema that differs from its own history cannot be rebuilt.
   A correction is a new migration.
5. **A pair is reversible on an empty database.** The down file removes
   exactly what the up file added, and the fresh-database gate runs the pair
   down and up again before the sub-step is committed.
6. **Money is `numeric(18,4)` and timestamps are `timestamptz`.** These are in
   `MASTER_PROMPT.md`; the runner cannot check them, so the review does.

## Commands

```sh
npm run db:migrate                    # apply everything pending
npm run db:migrate -- --dry-run       # print the plan, change nothing
npm run db:rollback -- 20260116000000 # revert that migration and every later one
npm run db:rollback -- all            # revert everything, newest first
npm run db:seed                       # apply the seed files in seeds/
```

`DATABASE_URL` is the only input. It is read from the environment or from
`.env` (the command loads that file when it exists) and is never printed, never
logged and never written to a migration.
