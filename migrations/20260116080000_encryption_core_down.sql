-- path: migrations/20260116080000_encryption_core_down.sql
--
-- Rollback for the encryption core. The activation function is dropped first,
-- then the table, whose capture, updated_at and policy objects go with it.
--
-- Rolling this back in production destroys the record of which key versions
-- were active. Without that record the environment root key still derives the
-- same keys, but nothing states which version each purpose is on. Rolling back
-- 2.9 in production is forbidden, as it is for 2.8.

DROP FUNCTION IF EXISTS encryption_activate_key_version(text, integer, text, text);

DROP TABLE IF EXISTS encryption_key_versions;
