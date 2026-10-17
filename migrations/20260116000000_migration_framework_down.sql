-- path: migrations/20260116000000_migration_framework_down.sql
--
-- Rollback for the migration framework. The runner deletes the ledger row
-- before it executes this file, because the file removes the ledger itself.
-- No other table references these two, so no cascade is needed or wanted.

DROP TABLE IF EXISTS seed_migrations;

DROP TABLE IF EXISTS schema_migrations;
