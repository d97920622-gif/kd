-- path: migrations/20260116010000_database_primitives.sql
--
-- The database primitives every later table depends on (sub-step 2.2):
--
--   1. extensions      pgcrypto (digest, gen_random_bytes) and pg_trgm (fuzzy search)
--   2. uuid_generate_v7()      time-ordered UUIDs for every primary key
--   3. set_updated_at()        the trigger function that maintains updated_at
--   4. apply_universal_columns()  adds the six universal columns to a table
--   5. assert_universal_columns() the author guard used while writing a migration
--
-- This migration also brings the two 2.1 ledgers up to the same standard:
-- their id default becomes uuid_generate_v7(), version starts at 0 as
-- MASTER_PROMPT requires, and the business-key unique indexes become partial
-- on deleted_at IS NULL so a soft-deleted key can be used again.
--
-- Extensions are created in the default schema. On Supabase, where they may
-- already live in the extensions schema, IF NOT EXISTS makes this a no-op and
-- the server search_path resolves the functions either way.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- A UUID version 7: 48 bits of Unix epoch milliseconds, 4 bits of version,
-- 12 random bits, 2 bits of RFC 4122 variant, 62 random bits. The leading
-- timestamp keeps new keys adjacent in the index, which is the whole point of
-- v7 over v4: an insert does not scatter across the btree.
--
-- clock_timestamp(), not now(): two calls in one transaction must not return
-- the same timestamp, or a batch insert inside a transaction would cluster.
-- Uniqueness rests on the 74 random bits; a collision is not a practical risk.
CREATE OR REPLACE FUNCTION uuid_generate_v7()
RETURNS uuid
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  timestamp_ms bigint;
  bytes bytea;
BEGIN
  timestamp_ms := (EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::bigint;
  bytes := decode(
    lpad(to_hex(timestamp_ms), 12, '0') || encode(gen_random_bytes(10), 'hex'),
    'hex'
  );
  bytes := set_byte(bytes, 6, (b'0111' || get_byte(bytes, 6)::bit(4))::bit(8)::integer);
  bytes := set_byte(bytes, 8, (b'10' || get_byte(bytes, 8)::bit(6))::bit(8)::integer);
  RETURN encode(bytes, 'hex')::uuid;
END;
$$;

COMMENT ON FUNCTION uuid_generate_v7() IS
  'Returns a time-ordered UUID version 7: 48 bit millisecond prefix, random tail.';

-- The one place updated_at is written. A column default alone cannot maintain
-- it, and a service-layer assignment can be forgotten; a BEFORE UPDATE trigger
-- runs for every writer, including a psql session.
--
-- The trigger does not touch version. Optimistic locking is sub-step 2.12's
-- owner, and a version bump hidden inside an updated_at trigger would make an
-- update succeed without the WHERE clause that the lock requires.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION set_updated_at() IS
  'BEFORE UPDATE trigger function that sets updated_at to the transaction timestamp.';

-- Adds the six universal columns to an existing table, idempotently.
--
-- A migration may declare the columns inline instead; this helper exists so a
-- table that already holds business columns, or a table added later by an
-- ALTER, cannot end up with a different spelling of the same six columns.
-- p_company_scoped true makes company_id NOT NULL for a tenant table; false
-- leaves it nullable for a platform-level table.
CREATE OR REPLACE FUNCTION apply_universal_columns(
  p_table regclass,
  p_company_scoped boolean DEFAULT true
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  table_name text;
BEGIN
  SELECT c.relname INTO table_name FROM pg_class c WHERE c.oid = p_table;
  IF table_name IS NULL THEN
    RAISE EXCEPTION 'apply_universal_columns: relation % does not exist', p_table;
  END IF;

  EXECUTE format('ALTER TABLE %s ADD COLUMN IF NOT EXISTS id uuid NOT NULL DEFAULT uuid_generate_v7()', p_table);
  EXECUTE format('ALTER TABLE %s ADD COLUMN IF NOT EXISTS company_id uuid', p_table);
  EXECUTE format('ALTER TABLE %s ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now()', p_table);
  EXECUTE format('ALTER TABLE %s ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()', p_table);
  EXECUTE format('ALTER TABLE %s ADD COLUMN IF NOT EXISTS deleted_at timestamptz', p_table);
  EXECUTE format('ALTER TABLE %s ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 0', p_table);

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = p_table AND contype = 'p') THEN
    EXECUTE format('ALTER TABLE %s ADD PRIMARY KEY (id)', p_table);
  END IF;

  EXECUTE format(
    'CREATE INDEX IF NOT EXISTS %I ON %s (company_id, created_at)',
    'idx_' || table_name || '_company_id_created_at',
    p_table
  );

  EXECUTE format('DROP TRIGGER IF EXISTS %I ON %s', 'trg_' || table_name || '_set_updated_at', p_table);
  EXECUTE format(
    'CREATE TRIGGER %I BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
    'trg_' || table_name || '_set_updated_at',
    p_table
  );

  IF p_company_scoped THEN
    EXECUTE format('ALTER TABLE %s ALTER COLUMN company_id SET NOT NULL', p_table);
  END IF;
END;
$$;

COMMENT ON FUNCTION apply_universal_columns(regclass, boolean) IS
  'Adds id, company_id, created_at, updated_at, deleted_at and version to a table, with its primary key, tenant index and updated_at trigger.';

-- The author guard. A migration that creates a table calls this at the end of
-- its own change and fails at apply time, not at the step gate, when a column
-- is missing. The full catalog audit is scripts/db/sql/check-schema-standards.sql.
CREATE OR REPLACE FUNCTION assert_universal_columns(p_table regclass)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  missing_columns text;
BEGIN
  SELECT string_agg(expected.name, ', ' ORDER BY expected.ordinal)
  INTO missing_columns
  FROM (
    VALUES (1, 'id'), (2, 'company_id'), (3, 'created_at'),
           (4, 'updated_at'), (5, 'deleted_at'), (6, 'version')
  ) AS expected(ordinal, name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_attribute a
    WHERE a.attrelid = p_table
      AND a.attname = expected.name
      AND a.attnum > 0
      AND NOT a.attisdropped
  );

  IF missing_columns IS NOT NULL THEN
    RAISE EXCEPTION 'table % is missing universal columns: %', p_table, missing_columns;
  END IF;
END;
$$;

COMMENT ON FUNCTION assert_universal_columns(regclass) IS
  'Raises an exception naming the universal columns a table is missing.';

-- Bring the two 2.1 ledgers to the standard. The id default moves to v7 so
-- every identifier in the database is time-ordered, version starts at 0 as
-- MASTER_PROMPT specifies, and the business-key index becomes partial so it
-- agrees with the soft-delete rule every later table follows.
ALTER TABLE schema_migrations
  ALTER COLUMN id SET DEFAULT uuid_generate_v7();

ALTER TABLE schema_migrations
  ALTER COLUMN version SET DEFAULT 0;

ALTER TABLE schema_migrations
  DROP CONSTRAINT IF EXISTS chk_schema_migrations_version_positive;

ALTER TABLE schema_migrations
  ADD CONSTRAINT chk_schema_migrations_version_non_negative CHECK (version >= 0);

DROP INDEX IF EXISTS idx_schema_migrations_migration_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_schema_migrations_migration_id
  ON schema_migrations (migration_id)
  WHERE deleted_at IS NULL;

ALTER TABLE seed_migrations
  ALTER COLUMN id SET DEFAULT uuid_generate_v7();

ALTER TABLE seed_migrations
  ALTER COLUMN version SET DEFAULT 0;

ALTER TABLE seed_migrations
  DROP CONSTRAINT IF EXISTS chk_seed_migrations_version_positive;

ALTER TABLE seed_migrations
  ADD CONSTRAINT chk_seed_migrations_version_non_negative CHECK (version >= 0);

DROP INDEX IF EXISTS idx_seed_migrations_seed_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_seed_migrations_seed_id
  ON seed_migrations (seed_id)
  WHERE deleted_at IS NULL;

-- The ledgers are written once and never updated in normal operation, but a
-- re-applied migration does update updated_at ordering only through a new row.
-- The trigger is attached anyway: the universal rule has no exemption.
DROP TRIGGER IF EXISTS trg_schema_migrations_set_updated_at ON schema_migrations;

CREATE TRIGGER trg_schema_migrations_set_updated_at
  BEFORE UPDATE ON schema_migrations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_seed_migrations_set_updated_at ON seed_migrations;

CREATE TRIGGER trg_seed_migrations_set_updated_at
  BEFORE UPDATE ON seed_migrations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
