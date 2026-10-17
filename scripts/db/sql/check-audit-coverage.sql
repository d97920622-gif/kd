-- path: scripts/db/sql/check-audit-coverage.sql
--
-- The audit trigger assertion (sub-step 2.8), run by `npm run db:assert`. Every
-- public table must have an enabled trigger that calls audit_row_change(), so no
-- change to a table can go unrecorded. audit_logs is the one exception, because
-- it is the ledger and it carries the chain triggers instead (see the 2.8
-- migration header). The check reads the catalog, so a trigger that was dropped,
-- or disabled with ALTER TABLE ... DISABLE TRIGGER, is found.
--
-- A disabled trigger has tgenabled = 'D'. That state is refused like a missing
-- trigger, because it records nothing.
--
-- The query returns one row per violation and no row when every table is covered:
--   rule    audit_trigger_missing, or audit_ledger_trigger_missing
--   object  the table
--   detail  what was missing, in one sentence

WITH tables AS (
  SELECT c.oid, c.relname::text AS table_name
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relname <> 'audit_logs'
)
SELECT 'audit_trigger_missing'::text AS rule,
       t.table_name AS object,
       'no enabled trigger calls audit_row_change(), so changes to this table are not recorded'::text AS detail
FROM tables t
WHERE NOT EXISTS (
  SELECT 1
  FROM pg_trigger tg
  WHERE tg.tgrelid = t.oid
    AND NOT tg.tgisinternal
    AND tg.tgenabled <> 'D'
    AND tg.tgfoid = to_regprocedure('audit_row_change()')
)

UNION ALL

SELECT 'audit_ledger_trigger_missing', 'audit_logs',
       'no enabled trigger calls ' || f.signature || ', so the ledger is not guarded'
FROM (VALUES
  ('audit_logs_chain()'),
  ('audit_signed_once()'),
  ('audit_append_only()')
) AS f(signature)
WHERE NOT EXISTS (
  SELECT 1
  FROM pg_trigger tg
  WHERE tg.tgrelid = to_regclass('public.audit_logs')
    AND NOT tg.tgisinternal
    AND tg.tgenabled <> 'D'
    AND tg.tgfoid = to_regprocedure(f.signature)
)

ORDER BY 2, 1;
