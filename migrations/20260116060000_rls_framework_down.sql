-- path: migrations/20260116060000_rls_framework_down.sql
--
-- Rollback for the RLS framework. It runs after 20260116060100_rls_policies_down.sql,
-- so the policies and table grants are already gone by the time this file runs.
-- The file removes the test functions, the claim helpers and this database's
-- usage of the public schema.
--
-- THE ROLE IS NOT DROPPED. kd_app is a cluster object, and PostgreSQL refuses
-- (2BP01) to drop a role that holds a privilege in any database on the same
-- server. A second database may still use it, and the rollback of one database
-- must never fail on another. Once the privileges in this database are revoked,
-- kd_app is an inert NOLOGIN role with no reach, and the up file creates it only
-- when it is missing, so re-applying is safe. An operator who knows that no
-- database uses the role may drop it with DROP ROLE kd_app.

DROP FUNCTION IF EXISTS rls_isolation_fuzz(integer);

DROP FUNCTION IF EXISTS rls_isolation_violations();

DROP FUNCTION IF EXISTS rls_visible_count(text);

DROP FUNCTION IF EXISTS current_role_name();

DROP FUNCTION IF EXISTS current_company_id();

DROP FUNCTION IF EXISTS current_user_id();

DROP FUNCTION IF EXISTS current_jwt_claim(text);

REVOKE USAGE ON SCHEMA public FROM kd_app;
