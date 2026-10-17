-- path: migrations/20260116000000_migration_framework.sql
--
-- The migration framework itself: two ledgers and nothing else.
--
-- schema_migrations records every migration this runner has applied, with the
-- SHA-256 checksum of the file that was applied and how long it took. The
-- runner compares that checksum with the file before every run and refuses to
-- continue when an applied migration has been edited: a database that differs
-- from its own history cannot be rebuilt from that history.
--
-- seed_migrations is the same ledger for seeds/, which are data files that are
-- idempotent by contract and have no rollback pair.
--
-- The runner wraps each file in one transaction, so a file must never contain
-- BEGIN, COMMIT or ROLLBACK.
--
-- PostgreSQL 15 or newer: gen_random_uuid() is built in and needs no
-- extension. The uuid v7 generator arrives with the database primitives of
-- sub-step 2.2, which takes over the id default for these two tables there.
--
-- Both tables carry the universal column set. They hold platform-level rows,
-- so company_id stays null. A migration id is unique across the whole
-- database and its row is deleted, not soft-deleted, when the migration is
-- rolled back, which is why the unique index is not partial.

CREATE TABLE IF NOT EXISTS schema_migrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  migration_id text NOT NULL,
  description text NOT NULL,
  checksum text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now(),
  execution_ms integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version integer NOT NULL DEFAULT 1,
  CONSTRAINT chk_schema_migrations_migration_id_format
    CHECK (migration_id ~ '^[0-9]{14}_[a-z0-9]+(_[a-z0-9]+)*$'),
  CONSTRAINT chk_schema_migrations_checksum_format
    CHECK (checksum ~ '^[0-9a-f]{64}$'),
  CONSTRAINT chk_schema_migrations_execution_ms_range
    CHECK (execution_ms >= 0),
  CONSTRAINT chk_schema_migrations_version_positive
    CHECK (version >= 1)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_schema_migrations_migration_id
  ON schema_migrations (migration_id);

CREATE INDEX IF NOT EXISTS idx_schema_migrations_company_id_created_at
  ON schema_migrations (company_id, created_at);

COMMENT ON TABLE schema_migrations IS
  'One row per migration applied by scripts/db/migrate.mjs, with the checksum that was applied.';

COMMENT ON COLUMN schema_migrations.checksum IS
  'SHA-256 of the normalized migration file at apply time; a mismatch is drift and stops the runner.';

CREATE TABLE IF NOT EXISTS seed_migrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  seed_id text NOT NULL,
  description text NOT NULL,
  checksum text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now(),
  execution_ms integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version integer NOT NULL DEFAULT 1,
  CONSTRAINT chk_seed_migrations_seed_id_format
    CHECK (seed_id ~ '^[0-9]{14}_[a-z0-9]+(_[a-z0-9]+)*$'),
  CONSTRAINT chk_seed_migrations_checksum_format
    CHECK (checksum ~ '^[0-9a-f]{64}$'),
  CONSTRAINT chk_seed_migrations_execution_ms_range
    CHECK (execution_ms >= 0),
  CONSTRAINT chk_seed_migrations_version_positive
    CHECK (version >= 1)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_seed_migrations_seed_id
  ON seed_migrations (seed_id);

CREATE INDEX IF NOT EXISTS idx_seed_migrations_company_id_created_at
  ON seed_migrations (company_id, created_at);

COMMENT ON TABLE seed_migrations IS
  'One row per seed file applied by scripts/db/seed.mjs, with the checksum that was applied.';
