-- path: scripts/db/sql/check-schema-standards.sql
--
-- The catalog audit of the schema standards (sub-step 2.2), run by
-- `npm run db:assert`. It reads the live database, not the migration files:
-- a table created by hand, or by a migration that drifted, is inspected the
-- same way as one the runner applied.
--
-- The query returns one row per violation and no row when the schema passes:
--   rule    the standard that was broken
--   object  the table or constraint the row is about
--   detail  what was found, in one sentence
--
-- Rules, all from MASTER_PROMPT.md (database schema rules) and
-- docs/PLAN/02_CONVENTIONS_AND_GUARDRAILS.md section 1 rule 9:
--
--   1  every table carries the six universal columns
--   2  id is uuid NOT NULL DEFAULT uuid_generate_v7()
--   3  created_at is timestamptz NOT NULL DEFAULT now()
--   4  updated_at is timestamptz NOT NULL DEFAULT now()
--   5  deleted_at is a nullable timestamptz
--   6  version is integer NOT NULL DEFAULT 0
--   7  company_id is uuid
--   8  the primary key is on id
--   9  no timestamp without time zone exists
--   10 no money, real or double precision column exists
--   11 every money-named numeric column is numeric(18,4)
--   12 every foreign key is ON DELETE RESTRICT
--   13 every foreign key has a leading index
--   14 every index is named idx_{table}_{columns} or is the primary key
--   15 every check constraint is named chk_{table}_{column}_{rule}
--   16 every foreign key is named fk_{table}_{referenced_table}
--   17 every table has a partial unique index on deleted_at IS NULL
--   18 every table has an index led by company_id
--   19 every table has an index containing created_at
--   20 every table has its trg_{table}_set_updated_at trigger

WITH expected_columns (ordinal, name) AS (
  VALUES (1, 'id'), (2, 'company_id'), (3, 'created_at'),
         (4, 'updated_at'), (5, 'deleted_at'), (6, 'version')
),
tables AS (
  SELECT c.oid, c.relname
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind = 'r'
    AND n.nspname = 'public'
),
columns AS (
  SELECT a.attrelid,
         a.attnum,
         a.attname,
         format_type(a.atttypid, a.atttypmod) AS data_type,
         a.attnotnull,
         pg_get_expr(d.adbin, d.adrelid) AS default_expression
  FROM pg_attribute a
  LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
  WHERE a.attnum > 0
    AND NOT a.attisdropped
),
evaluated AS (
  SELECT c.attrelid,
         bool_or(c.attname = 'id' AND c.data_type = 'uuid' AND c.attnotnull
           AND coalesce(c.default_expression, '') LIKE 'uuid_generate_v7()%') AS id_ok,
         bool_or(c.attname = 'created_at' AND c.data_type = 'timestamp with time zone'
           AND c.attnotnull AND coalesce(c.default_expression, '') LIKE 'now()%') AS created_at_ok,
         bool_or(c.attname = 'updated_at' AND c.data_type = 'timestamp with time zone'
           AND c.attnotnull AND coalesce(c.default_expression, '') LIKE 'now()%') AS updated_at_ok,
         bool_or(c.attname = 'deleted_at' AND c.data_type = 'timestamp with time zone'
           AND NOT c.attnotnull) AS deleted_at_ok,
         bool_or(c.attname = 'version' AND c.data_type = 'integer' AND c.attnotnull
           AND coalesce(c.default_expression, '') = '0') AS version_ok,
         bool_or(c.attname = 'company_id' AND c.data_type = 'uuid') AS company_id_ok
  FROM columns c
  GROUP BY c.attrelid
),
indexes AS (
  SELECT i.indexrelid,
         i.indrelid,
         idx.relname AS index_name,
         i.indisunique,
         i.indisprimary,
         i.indkey::int2[] AS key_columns,
         pg_get_expr(i.indpred, i.indrelid) AS predicate
  FROM pg_index i
  JOIN pg_class idx ON idx.oid = i.indexrelid
),
violations AS (
  SELECT 'universal_columns_missing' AS rule,
         t.relname AS object,
         'missing: ' || string_agg(e.name, ', ' ORDER BY e.ordinal) AS detail
  FROM tables t
  CROSS JOIN expected_columns e
  WHERE NOT EXISTS (
    SELECT 1 FROM columns c WHERE c.attrelid = t.oid AND c.attname = e.name
  )
  GROUP BY t.relname

  UNION ALL

  SELECT 'id_not_uuid_v7', t.relname,
         'expected uuid NOT NULL DEFAULT uuid_generate_v7()'
  FROM tables t
  JOIN evaluated e ON e.attrelid = t.oid
  WHERE NOT e.id_ok

  UNION ALL

  SELECT 'created_at_not_timestamptz_default', t.relname,
         'expected timestamptz NOT NULL DEFAULT now()'
  FROM tables t
  JOIN evaluated e ON e.attrelid = t.oid
  WHERE NOT e.created_at_ok

  UNION ALL

  SELECT 'updated_at_not_timestamptz_default', t.relname,
         'expected timestamptz NOT NULL DEFAULT now()'
  FROM tables t
  JOIN evaluated e ON e.attrelid = t.oid
  WHERE NOT e.updated_at_ok

  UNION ALL

  SELECT 'deleted_at_not_nullable_timestamptz', t.relname,
         'expected a nullable timestamptz'
  FROM tables t
  JOIN evaluated e ON e.attrelid = t.oid
  WHERE NOT e.deleted_at_ok

  UNION ALL

  SELECT 'version_not_integer_default_0', t.relname,
         'expected integer NOT NULL DEFAULT 0'
  FROM tables t
  JOIN evaluated e ON e.attrelid = t.oid
  WHERE NOT e.version_ok

  UNION ALL

  SELECT 'company_id_not_uuid', t.relname,
         'expected a uuid column'
  FROM tables t
  JOIN evaluated e ON e.attrelid = t.oid
  WHERE NOT e.company_id_ok

  UNION ALL

  SELECT 'primary_key_not_on_id', t.relname,
         'expected the primary key to be (id)'
  FROM tables t
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_constraint p
    JOIN columns c ON c.attrelid = p.conrelid AND c.attnum = ANY (p.conkey)
    WHERE p.conrelid = t.oid
      AND p.contype = 'p'
      AND c.attname = 'id'
      AND cardinality(p.conkey) = 1
  )

  UNION ALL

  SELECT 'timestamp_without_time_zone', t.relname,
         c.attname || ' is ' || c.data_type
  FROM tables t
  JOIN columns c ON c.attrelid = t.oid
  WHERE c.data_type = 'timestamp without time zone'

  UNION ALL

  SELECT 'floating_point_money_type', t.relname,
         c.attname || ' is ' || c.data_type
  FROM tables t
  JOIN columns c ON c.attrelid = t.oid
  WHERE c.data_type IN ('money', 'real', 'double precision')

  UNION ALL

  SELECT 'numeric_money_column_not_18_4', t.relname,
         c.attname || ' is ' || c.data_type
  FROM tables t
  JOIN columns c ON c.attrelid = t.oid
  WHERE c.data_type LIKE 'numeric%'
    AND c.attname ~ '(amount|price|total|subtotal|balance|fee|discount|salary|wage|cost|revenue|credit|debit|refund|payout|tax|gross|net)'
    AND c.data_type <> 'numeric(18,4)'

  UNION ALL

  SELECT 'foreign_key_not_restrict', t.relname,
         con.conname || ': ' || pg_get_constraintdef(con.oid)
  FROM pg_constraint con
  JOIN tables t ON t.oid = con.conrelid
  WHERE con.contype = 'f'
    AND con.confdeltype <> 'r'

  UNION ALL

  SELECT 'foreign_key_not_indexed', t.relname,
         con.conname || ' has no index led by its own columns'
  FROM pg_constraint con
  JOIN tables t ON t.oid = con.conrelid
  WHERE con.contype = 'f'
    AND NOT EXISTS (
      SELECT 1
      FROM indexes i
      WHERE i.indrelid = con.conrelid
        AND array_to_string(
          i.key_columns[0:cardinality(con.conkey) - 1], ','
        ) = array_to_string(con.conkey, ',')
    )

  UNION ALL

  SELECT 'index_name_not_conventional', t.relname,
         i.index_name || ' must start with idx_' || t.relname || '_'
  FROM tables t
  JOIN indexes i ON i.indrelid = t.oid
  WHERE NOT i.indisprimary
    AND NOT starts_with(i.index_name, 'idx_' || t.relname || '_')

  UNION ALL

  SELECT 'check_constraint_name_not_conventional', t.relname,
         con.conname || ' must start with chk_' || t.relname || '_'
  FROM pg_constraint con
  JOIN tables t ON t.oid = con.conrelid
  WHERE con.contype = 'c'
    AND NOT starts_with(con.conname, 'chk_' || t.relname || '_')

  UNION ALL

  SELECT 'foreign_key_name_not_conventional', t.relname,
         con.conname || ' must start with fk_' || t.relname || '_'
  FROM pg_constraint con
  JOIN tables t ON t.oid = con.conrelid
  WHERE con.contype = 'f'
    AND NOT starts_with(con.conname, 'fk_' || t.relname || '_')

  UNION ALL

  SELECT 'partial_unique_soft_delete_index_missing', t.relname,
         'expected a unique index whose predicate is deleted_at IS NULL'
  FROM tables t
  WHERE NOT EXISTS (
    SELECT 1
    FROM indexes i
    WHERE i.indrelid = t.oid
      AND i.indisunique
      AND coalesce(i.predicate, '') LIKE '%deleted_at IS NULL%'
  )

  UNION ALL

  SELECT 'company_id_index_missing', t.relname,
         'expected an index whose first column is company_id'
  FROM tables t
  WHERE NOT EXISTS (
    SELECT 1
    FROM indexes i
    JOIN columns c ON c.attrelid = t.oid AND c.attname = 'company_id'
    WHERE i.indrelid = t.oid
      AND i.key_columns[0] = c.attnum
  )

  UNION ALL

  SELECT 'created_at_index_missing', t.relname,
         'expected an index that contains created_at'
  FROM tables t
  WHERE NOT EXISTS (
    SELECT 1
    FROM indexes i
    JOIN columns c ON c.attrelid = t.oid AND c.attname = 'created_at'
    WHERE i.indrelid = t.oid
      AND c.attnum = ANY (i.key_columns)
  )

  UNION ALL

  SELECT 'updated_at_trigger_missing', t.relname,
         'expected trigger trg_' || t.relname || '_set_updated_at'
  FROM tables t
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_trigger tg
    WHERE tg.tgrelid = t.oid
      AND NOT tg.tgisinternal
      AND tg.tgname = 'trg_' || t.relname || '_set_updated_at'
      -- to_regprocedure answers null instead of raising when the function is
      -- absent, so a database with the primitives rolled back reports one
      -- missing-trigger row per table rather than failing the whole query.
      AND tg.tgfoid = to_regprocedure('set_updated_at()')
  )
)
SELECT rule, object, detail
FROM violations
ORDER BY object, rule;
