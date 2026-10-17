-- path: migrations/20260116070000_audit_ledger_down.sql
--
-- Rollback for the audit ledger tables. It runs after 20260116070100_audit_capture
-- has been rolled back, so no capture trigger is left on any table and no other
-- table writes to the ledger. The file is one transaction and removes the ledger
-- and all its history, as a rehearsal requires. See the header of the up file:
-- a production database must never run this.
--
-- The order is fixed by three dependencies. audit_entry_hash takes an audit_logs
-- row, so it is dropped before the table. audit_logs refers to the signing key
-- registry, so the ledger goes first, then the Merkle roots and the registry. The
-- trigger functions are dropped last, because the tables hold triggers that call
-- them until they are dropped.

DROP FUNCTION IF EXISTS audit_entry_hash(text, audit_logs);

DROP TABLE IF EXISTS audit_logs;

DROP TABLE IF EXISTS audit_merkle_roots;

DROP TABLE IF EXISTS audit_signing_keys;

DROP FUNCTION IF EXISTS audit_logs_chain();

DROP FUNCTION IF EXISTS audit_signed_once();

DROP FUNCTION IF EXISTS audit_append_only();

DROP FUNCTION IF EXISTS audit_genesis_hash();
