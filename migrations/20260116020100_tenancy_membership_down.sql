-- path: migrations/20260116020100_tenancy_membership_down.sql
--
-- Rollback for the membership half of the tenancy tables. Reverse dependency
-- order: sessions references devices, company_members and invitations
-- reference companies and user_profiles. No CASCADE, so a later table that
-- depends on one of these stops the rollback instead of silently losing its
-- rows.

DROP TABLE IF EXISTS sessions;

DROP TABLE IF EXISTS devices;

DROP TABLE IF EXISTS invitations;

DROP TABLE IF EXISTS company_members;
