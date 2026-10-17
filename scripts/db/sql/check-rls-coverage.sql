-- path: scripts/db/sql/check-rls-coverage.sql
--
-- The live row level security coverage audit (sub-step 2.7), run by
-- `npm run db:assert`. It reads the catalogs, not the migration files, so a
-- table created by hand, or a policy changed after the migration ran, is found.
-- Every public table must have row level security enabled and forced, must have
-- at least one policy, and every policy must be granted to kd_app only and must
-- not be open (USING (true) or WITH CHECK (true)). Zero rows is 100% coverage.

WITH tables AS (
  SELECT c.relname::text AS table_name,
         c.relrowsecurity AS enabled,
         c.relforcerowsecurity AS forced
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
)
SELECT 'rls_disabled'::text AS rule, t.table_name::text AS object,
       'row level security is not enabled'::text AS detail
FROM tables t
WHERE NOT t.enabled
UNION ALL
SELECT 'rls_not_forced', t.table_name,
       'FORCE ROW LEVEL SECURITY is not set, so the owner bypasses the policies'
FROM tables t
WHERE NOT t.forced
UNION ALL
SELECT 'rls_no_policy', t.table_name,
       'no policy exists, so the table is closed to every role'
FROM tables t
WHERE NOT EXISTS (
  SELECT 1 FROM pg_policies p
  WHERE p.schemaname = 'public' AND p.tablename = t.table_name
)
UNION ALL
SELECT 'rls_policy_open', p.tablename::text,
       'policy ' || p.policyname || ' is USING (true) or WITH CHECK (true)'
FROM pg_policies p
WHERE p.schemaname = 'public'
  AND (p.qual = 'true' OR p.with_check = 'true')
UNION ALL
SELECT 'rls_policy_role', p.tablename::text,
       'policy ' || p.policyname || ' is not granted to kd_app alone'
FROM pg_policies p
WHERE p.schemaname = 'public'
  AND p.roles IS DISTINCT FROM ARRAY['kd_app']::name[]
ORDER BY 1, 2;
