-- path: migrations/20260116010000_database_primitives_down.sql
--
-- Rollback for the database primitives. Order matters: the two ledgers point
-- their id defaults at uuid_generate_v7(), so the defaults are restored to
-- gen_random_uuid() before the function is dropped. Dropping the function
-- first would fail on the dependency, which is the correct behaviour but not
-- the intended rollback path.

ALTER TABLE schema_migrations
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE schema_migrations
  ALTER COLUMN version SET DEFAULT 1;

ALTER TABLE schema_migrations
  DROP CONSTRAINT IF EXISTS chk_schema_migrations_version_non_negative;

ALTER TABLE schema_migrations
  ADD CONSTRAINT chk_schema_migrations_version_positive CHECK (version >= 1);

DROP INDEX IF EXISTS idx_schema_migrations_migration_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_schema_migrations_migration_id
  ON schema_migrations (migration_id);

ALTER TABLE seed_migrations
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE seed_migrations
  ALTER COLUMN version SET DEFAULT 1;

ALTER TABLE seed_migrations
  DROP CONSTRAINT IF EXISTS chk_seed_migrations_version_non_negative;

ALTER TABLE seed_migrations
  ADD CONSTRAINT chk_seed_migrations_version_positive CHECK (version >= 1);

DROP INDEX IF EXISTS idx_seed_migrations_seed_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_seed_migrations_seed_id
  ON seed_migrations (seed_id);

DROP TRIGGER IF EXISTS trg_schema_migrations_set_updated_at ON schema_migrations;

DROP TRIGGER IF EXISTS trg_seed_migrations_set_updated_at ON seed_migrations;

DROP FUNCTION IF EXISTS assert_universal_columns(regclass);

DROP FUNCTION IF EXISTS apply_universal_columns(regclass, boolean);

DROP FUNCTION IF EXISTS set_updated_at();

DROP FUNCTION IF EXISTS uuid_generate_v7();

-- No CASCADE. If a later object still depends on either extension the
-- rollback stops, because dropping it would remove a function something else
-- is using.
DROP EXTENSION IF EXISTS pg_trgm;

DROP EXTENSION IF EXISTS pgcrypto;
