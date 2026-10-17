// path: seeds/README.md

# Seeds

Seeds are the reference data the platform cannot start without: plans, the
permission matrix, countries, currencies, tax presets and the bootstrap
platform administrator. They are applied by `npm run db:seed`.

## Naming and order

```text
seeds/{14-digit timestamp}_{snake_case_description}.sql
```

Files run in timestamp order and each one is recorded in `seed_migrations`
with its SHA-256 checksum. A seed has no down file: reference data is not
reverted, it is corrected by the next seed. An applied seed is never edited,
because the next run stops on a checksum mismatch.

The step 2 seed block starts at `20260116140000`, after the last step 2
migration block (`20260116120000`).

## Contract

1. **Idempotent.** Every insert ends in `ON CONFLICT ... DO NOTHING` or an
   equivalent guard on the business key. `db:seed` is run on every deploy, and
   a seed that fails on the second run is a deploy that never finishes.
2. **Parameterless.** A seed file is plain SQL run as one transaction; it must
   not contain `BEGIN`, `COMMIT` or `ROLLBACK`.
3. **Company scoped or platform scoped on purpose.** Reference tables
   (`countries`, `currencies`, `tax_jurisdictions`, `timezones`) are platform
   rows with `company_id` null. Plan rows are platform rows. A seed that writes
   tenant data does not belong here.
4. **Deterministic identifiers.** A seeded row is found by its business key,
   never by a generated primary key that differs between environments.
5. **Money in USD.** `numeric(18,4)` columns, exact decimal literals, no
   floating point.

## Sub-step 2.14

Sub-step 2.14 adds the seed files themselves: `plans`, `permissions`,
`countries`, `currencies`, `tax presets` and the `super_admin` bootstrap. This
file states the contract they must satisfy; the directory carries no seed yet,
and `db:seed` reports zero pending until then.
