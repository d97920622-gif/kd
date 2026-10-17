-- path: scripts/db/fuzz/rls-isolation.sql
--
-- The isolation fuzz (sub-step 2.7), run by `npm run db:fuzz`. It calls
-- rls_isolation_fuzz(200): two synthetic tenants, one platform administrator,
-- then 200 attacks between the tenants. The first 156 sweep every tenant table,
-- every operation and both directions once, so no pair depends on luck; the
-- rest are seeded random. It also runs an anonymous sweep over every table and
-- a user-to-user read sweep. Zero rows means every attack was refused or
-- affected no row. The runner wraps this statement in a transaction that is
-- always rolled back.

SELECT rule, object, detail
FROM rls_isolation_fuzz(200)
ORDER BY rule, object, detail;
