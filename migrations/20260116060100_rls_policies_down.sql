-- path: migrations/20260116060100_rls_policies_down.sql
--
-- Rollback for the RLS policies. It drops every policy first, then removes FORCE
-- and then ENABLE on each of the 27 tables, then revokes every grant given to
-- kd_app. It must run before the framework rollback, because the policies call
-- the claim helpers. The file is one transaction. It removes no data.

DROP POLICY IF EXISTS default_deny ON schema_migrations;
DROP POLICY IF EXISTS default_deny ON seed_migrations;
DROP POLICY IF EXISTS default_deny ON login_attempts;
DROP POLICY IF EXISTS default_deny ON login_lock_state;

DROP POLICY IF EXISTS shared_read ON currencies;
DROP POLICY IF EXISTS platform_write ON currencies;
DROP POLICY IF EXISTS shared_read ON timezones;
DROP POLICY IF EXISTS platform_write ON timezones;
DROP POLICY IF EXISTS shared_read ON countries;
DROP POLICY IF EXISTS platform_write ON countries;
DROP POLICY IF EXISTS shared_read ON tax_jurisdictions;
DROP POLICY IF EXISTS platform_write ON tax_jurisdictions;
DROP POLICY IF EXISTS shared_read ON plans;
DROP POLICY IF EXISTS platform_write ON plans;
DROP POLICY IF EXISTS shared_read ON plan_features;
DROP POLICY IF EXISTS platform_write ON plan_features;
DROP POLICY IF EXISTS shared_read ON permissions;
DROP POLICY IF EXISTS platform_write ON permissions;
DROP POLICY IF EXISTS platform_write ON coupons;

DROP POLICY IF EXISTS flag_read ON feature_flags;
DROP POLICY IF EXISTS platform_write ON feature_flags;

DROP POLICY IF EXISTS company_read ON companies;
DROP POLICY IF EXISTS company_owner_update ON companies;

DROP POLICY IF EXISTS tenant_isolation ON company_settings;
DROP POLICY IF EXISTS tenant_isolation ON invitations;
DROP POLICY IF EXISTS tenant_isolation ON roles;
DROP POLICY IF EXISTS tenant_isolation ON role_permissions;
DROP POLICY IF EXISTS tenant_isolation ON user_roles;
DROP POLICY IF EXISTS tenant_isolation ON coupon_redemptions;
DROP POLICY IF EXISTS tenant_isolation ON entitlements;
DROP POLICY IF EXISTS tenant_isolation ON subscriptions;
DROP POLICY IF EXISTS tenant_isolation ON company_members;
DROP POLICY IF EXISTS member_own_rows ON company_members;

DROP POLICY IF EXISTS profile_self ON user_profiles;
DROP POLICY IF EXISTS profile_colleague ON user_profiles;

DROP POLICY IF EXISTS platform_self_read ON platform_users;
DROP POLICY IF EXISTS platform_write ON platform_users;

DROP POLICY IF EXISTS own_rows ON devices;
DROP POLICY IF EXISTS own_rows ON sessions;

ALTER TABLE schema_migrations NO FORCE ROW LEVEL SECURITY;
ALTER TABLE schema_migrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE seed_migrations NO FORCE ROW LEVEL SECURITY;
ALTER TABLE seed_migrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts NO FORCE ROW LEVEL SECURITY;
ALTER TABLE login_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE login_lock_state NO FORCE ROW LEVEL SECURITY;
ALTER TABLE login_lock_state DISABLE ROW LEVEL SECURITY;
ALTER TABLE currencies NO FORCE ROW LEVEL SECURITY;
ALTER TABLE currencies DISABLE ROW LEVEL SECURITY;
ALTER TABLE timezones NO FORCE ROW LEVEL SECURITY;
ALTER TABLE timezones DISABLE ROW LEVEL SECURITY;
ALTER TABLE countries NO FORCE ROW LEVEL SECURITY;
ALTER TABLE countries DISABLE ROW LEVEL SECURITY;
ALTER TABLE tax_jurisdictions NO FORCE ROW LEVEL SECURITY;
ALTER TABLE tax_jurisdictions DISABLE ROW LEVEL SECURITY;
ALTER TABLE plans NO FORCE ROW LEVEL SECURITY;
ALTER TABLE plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE plan_features NO FORCE ROW LEVEL SECURITY;
ALTER TABLE plan_features DISABLE ROW LEVEL SECURITY;
ALTER TABLE permissions NO FORCE ROW LEVEL SECURITY;
ALTER TABLE permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE coupons NO FORCE ROW LEVEL SECURITY;
ALTER TABLE coupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags NO FORCE ROW LEVEL SECURITY;
ALTER TABLE feature_flags DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies NO FORCE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings NO FORCE ROW LEVEL SECURITY;
ALTER TABLE company_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_members NO FORCE ROW LEVEL SECURITY;
ALTER TABLE company_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE invitations NO FORCE ROW LEVEL SECURITY;
ALTER TABLE invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE roles NO FORCE ROW LEVEL SECURITY;
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions NO FORCE ROW LEVEL SECURITY;
ALTER TABLE role_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles NO FORCE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions NO FORCE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE entitlements NO FORCE ROW LEVEL SECURITY;
ALTER TABLE entitlements DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions NO FORCE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles NO FORCE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE platform_users NO FORCE ROW LEVEL SECURITY;
ALTER TABLE platform_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE devices NO FORCE ROW LEVEL SECURITY;
ALTER TABLE devices DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions NO FORCE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;

REVOKE ALL ON
  schema_migrations, seed_migrations, login_attempts, login_lock_state,
  currencies, timezones, countries, tax_jurisdictions, plans, plan_features,
  permissions, coupons, feature_flags, companies, company_settings,
  company_members, invitations, roles, role_permissions, user_roles,
  coupon_redemptions, entitlements, subscriptions, user_profiles,
  platform_users, devices, sessions
FROM kd_app;
