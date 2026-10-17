-- path: migrations/20260116030000_access_tables_down.sql
--
-- Rollback for the access tables. Reverse dependency order: user_roles and
-- role_permissions reference roles; user_roles references company_members.
-- The two composite targets this migration added to company_members are
-- dropped with it, before the migration that created company_members is
-- reverted.
--
-- No CASCADE: a later table that references one of these stops the rollback
-- instead of silently losing its rows.

DROP TABLE IF EXISTS login_lock_state;

DROP TABLE IF EXISTS login_attempts;

DROP TABLE IF EXISTS user_roles;

DROP TABLE IF EXISTS role_permissions;

DROP TABLE IF EXISTS permissions;

DROP TABLE IF EXISTS roles;

DROP INDEX IF EXISTS idx_company_members_id_company_id;
