-- path: migrations/20260116020000_tenancy_identity_down.sql
--
-- Rollback for the identity half of the tenancy tables. Reverse dependency
-- order: platform_users references user_profiles, company_settings references
-- companies. No CASCADE: the second half of the sub-step
-- (20260116020100_tenancy_membership.sql) references companies and
-- user_profiles too, and it is reverted first because it carries the later
-- timestamp.

DROP TABLE IF EXISTS platform_users;

DROP TABLE IF EXISTS user_profiles;

DROP TABLE IF EXISTS company_settings;

DROP TABLE IF EXISTS companies;
