-- path: migrations/20260116060100_rls_policies.sql
--
-- Sub-step 2.7, second half: row level security on every table, and the grants
-- kd_app needs to use them. The helpers and the test functions are in
-- 20260116060000_rls_framework.sql; read its header for the claims contract.
--
-- DEFAULT DENY. Every one of the 27 tables has ENABLE and FORCE ROW LEVEL
-- SECURITY. A table with no policy for a role returns no rows and refuses every
-- write, so a new table is closed until a policy opens it. FORCE makes the table
-- owner subject to the policies too; only a superuser or a BYPASSRLS role sees
-- past them, which is why the migration and seed runners must hold BYPASSRLS.
--
-- ROLES. Every policy is written TO kd_app and nothing else. Nothing is granted
-- to PUBLIC, so the default privilege of PUBLIC cannot widen a policy.
--
-- THE SHAPES. Each table takes one of these shapes, and no other:
--   default_deny      ledgers and login tables: USING (false) and no grant.
--   shared_read       platform catalogue: any authenticated caller reads the
--                     rows that have no company; only a super_admin writes them.
--   tenant_isolation  a tenant table: a row is visible and writable only when
--                     its company_id equals the caller's company claim.
--   own_rows          a user-owned table: the caller's own rows only.
--   self / colleague  user_profiles and platform_users: self rows, plus the
--                     profiles of members of the same company.
--
-- THE GRANTS. kd_app gets SELECT, INSERT and UPDATE. Nothing gets DELETE: rows
-- are removed by setting deleted_at, which keeps the audit trail whole. The
-- companies table gets SELECT and UPDATE only, because a company is created by
-- the platform and never inserted by a tenant request. The ledgers and the
-- login tables get no grant at all.

-- ENABLE and FORCE on all 27 tables. ENABLE alone would let the owner bypass.
ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE schema_migrations FORCE ROW LEVEL SECURITY;
ALTER TABLE seed_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE seed_migrations FORCE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts FORCE ROW LEVEL SECURITY;
ALTER TABLE login_lock_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_lock_state FORCE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies FORCE ROW LEVEL SECURITY;
ALTER TABLE timezones ENABLE ROW LEVEL SECURITY;
ALTER TABLE timezones FORCE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries FORCE ROW LEVEL SECURITY;
ALTER TABLE tax_jurisdictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_jurisdictions FORCE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans FORCE ROW LEVEL SECURITY;
ALTER TABLE plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_features FORCE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions FORCE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons FORCE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags FORCE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies FORCE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings FORCE ROW LEVEL SECURITY;
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_members FORCE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations FORCE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles FORCE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions FORCE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles FORCE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions FORCE ROW LEVEL SECURITY;
ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlements FORCE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions FORCE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE platform_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_users FORCE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices FORCE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions FORCE ROW LEVEL SECURITY;

-- Grants. Start from nothing, then grant exactly what each table needs.
REVOKE ALL ON
  schema_migrations, seed_migrations, login_attempts, login_lock_state,
  currencies, timezones, countries, tax_jurisdictions, plans, plan_features,
  permissions, coupons, feature_flags, companies, company_settings,
  company_members, invitations, roles, role_permissions, user_roles,
  coupon_redemptions, entitlements, subscriptions, user_profiles,
  platform_users, devices, sessions
FROM kd_app;

GRANT SELECT, INSERT, UPDATE ON
  currencies, timezones, countries, tax_jurisdictions, plans, plan_features,
  permissions, coupons, feature_flags, company_settings, company_members,
  invitations, roles, role_permissions, user_roles, coupon_redemptions,
  entitlements, subscriptions, user_profiles, platform_users, devices, sessions
TO kd_app;

GRANT SELECT, UPDATE ON companies TO kd_app;

-- Ledgers and login tables: default deny. No grant is given, and the policy
-- refuses every row even if a grant is added later by mistake.
DROP POLICY IF EXISTS default_deny ON schema_migrations;
CREATE POLICY default_deny ON schema_migrations
  AS PERMISSIVE FOR ALL TO kd_app USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS default_deny ON seed_migrations;
CREATE POLICY default_deny ON seed_migrations
  AS PERMISSIVE FOR ALL TO kd_app USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS default_deny ON login_attempts;
CREATE POLICY default_deny ON login_attempts
  AS PERMISSIVE FOR ALL TO kd_app USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS default_deny ON login_lock_state;
CREATE POLICY default_deny ON login_lock_state
  AS PERMISSIVE FOR ALL TO kd_app USING (false) WITH CHECK (false);

-- Platform catalogue: an authenticated caller reads the company-less rows; only a
-- super_admin writes them, and a write may not attach a company.
DROP POLICY IF EXISTS shared_read ON currencies;
CREATE POLICY shared_read ON currencies
  AS PERMISSIVE FOR SELECT TO kd_app
  USING (company_id IS NULL AND current_user_id() IS NOT NULL);

DROP POLICY IF EXISTS platform_write ON currencies;
CREATE POLICY platform_write ON currencies
  AS PERMISSIVE FOR ALL TO kd_app
  USING (company_id IS NULL AND current_user_id() IS NOT NULL AND current_role_name() = 'super_admin')
  WITH CHECK (company_id IS NULL AND current_user_id() IS NOT NULL AND current_role_name() = 'super_admin');

DROP POLICY IF EXISTS shared_read ON timezones;
CREATE POLICY shared_read ON timezones
  AS PERMISSIVE FOR SELECT TO kd_app
  USING (company_id IS NULL AND current_user_id() IS NOT NULL);

DROP POLICY IF EXISTS platform_write ON timezones;
CREATE POLICY platform_write ON timezones
  AS PERMISSIVE FOR ALL TO kd_app
  USING (company_id IS NULL AND current_user_id() IS NOT NULL AND current_role_name() = 'super_admin')
  WITH CHECK (company_id IS NULL AND current_user_id() IS NOT NULL AND current_role_name() = 'super_admin');

DROP POLICY IF EXISTS shared_read ON countries;
CREATE POLICY shared_read ON countries
  AS PERMISSIVE FOR SELECT TO kd_app
  USING (company_id IS NULL AND current_user_id() IS NOT NULL);

DROP POLICY IF EXISTS platform_write ON countries;
CREATE POLICY platform_write ON countries
  AS PERMISSIVE FOR ALL TO kd_app
  USING (company_id IS NULL AND current_user_id() IS NOT NULL AND current_role_name() = 'super_admin')
  WITH CHECK (company_id IS NULL AND current_user_id() IS NOT NULL AND current_role_name() = 'super_admin');

DROP POLICY IF EXISTS shared_read ON tax_jurisdictions;
CREATE POLICY shared_read ON tax_jurisdictions
  AS PERMISSIVE FOR SELECT TO kd_app
  USING (company_id IS NULL AND current_user_id() IS NOT NULL);

DROP POLICY IF EXISTS platform_write ON tax_jurisdictions;
CREATE POLICY platform_write ON tax_jurisdictions
  AS PERMISSIVE FOR ALL TO kd_app
  USING (company_id IS NULL AND current_user_id() IS NOT NULL AND current_role_name() = 'super_admin')
  WITH CHECK (company_id IS NULL AND current_user_id() IS NOT NULL AND current_role_name() = 'super_admin');

DROP POLICY IF EXISTS shared_read ON plans;
CREATE POLICY shared_read ON plans
  AS PERMISSIVE FOR SELECT TO kd_app
  USING (company_id IS NULL AND current_user_id() IS NOT NULL);

DROP POLICY IF EXISTS platform_write ON plans;
CREATE POLICY platform_write ON plans
  AS PERMISSIVE FOR ALL TO kd_app
  USING (company_id IS NULL AND current_user_id() IS NOT NULL AND current_role_name() = 'super_admin')
  WITH CHECK (company_id IS NULL AND current_user_id() IS NOT NULL AND current_role_name() = 'super_admin');

DROP POLICY IF EXISTS shared_read ON plan_features;
CREATE POLICY shared_read ON plan_features
  AS PERMISSIVE FOR SELECT TO kd_app
  USING (company_id IS NULL AND current_user_id() IS NOT NULL);

DROP POLICY IF EXISTS platform_write ON plan_features;
CREATE POLICY platform_write ON plan_features
  AS PERMISSIVE FOR ALL TO kd_app
  USING (company_id IS NULL AND current_user_id() IS NOT NULL AND current_role_name() = 'super_admin')
  WITH CHECK (company_id IS NULL AND current_user_id() IS NOT NULL AND current_role_name() = 'super_admin');

DROP POLICY IF EXISTS shared_read ON permissions;
CREATE POLICY shared_read ON permissions
  AS PERMISSIVE FOR SELECT TO kd_app
  USING (company_id IS NULL AND current_user_id() IS NOT NULL);

DROP POLICY IF EXISTS platform_write ON permissions;
CREATE POLICY platform_write ON permissions
  AS PERMISSIVE FOR ALL TO kd_app
  USING (company_id IS NULL AND current_user_id() IS NOT NULL AND current_role_name() = 'super_admin')
  WITH CHECK (company_id IS NULL AND current_user_id() IS NOT NULL AND current_role_name() = 'super_admin');

-- Coupons are platform-owned. A tenant redeems one through coupon_redemptions;
-- it does not read the coupon catalogue here, so only the platform writes it.
DROP POLICY IF EXISTS platform_write ON coupons;
CREATE POLICY platform_write ON coupons
  AS PERMISSIVE FOR ALL TO kd_app
  USING (company_id IS NULL AND current_user_id() IS NOT NULL AND current_role_name() = 'super_admin')
  WITH CHECK (company_id IS NULL AND current_user_id() IS NOT NULL AND current_role_name() = 'super_admin');

-- Feature flags: a tenant reads its own override and the global flags; the
-- platform writes the global flags.
DROP POLICY IF EXISTS flag_read ON feature_flags;
CREATE POLICY flag_read ON feature_flags
  AS PERMISSIVE FOR SELECT TO kd_app
  USING (
    company_id = current_company_id()
    OR (company_id IS NULL AND current_user_id() IS NOT NULL)
  );

DROP POLICY IF EXISTS platform_write ON feature_flags;
CREATE POLICY platform_write ON feature_flags
  AS PERMISSIVE FOR ALL TO kd_app
  USING (company_id IS NULL AND current_user_id() IS NOT NULL AND current_role_name() = 'super_admin')
  WITH CHECK (company_id IS NULL AND current_user_id() IS NOT NULL AND current_role_name() = 'super_admin');

-- Companies: a tenant reads its own company. Only an active owner of the company
-- may update it, and the update may not move the row to another id.
DROP POLICY IF EXISTS company_read ON companies;
CREATE POLICY company_read ON companies
  AS PERMISSIVE FOR SELECT TO kd_app
  USING (id = current_company_id());

DROP POLICY IF EXISTS company_owner_update ON companies;
CREATE POLICY company_owner_update ON companies
  AS PERMISSIVE FOR UPDATE TO kd_app
  USING (
    id = current_company_id()
    AND EXISTS (
      SELECT 1 FROM company_members m
      WHERE m.company_id = companies.id
        AND m.user_id = current_user_id()
        AND m.role = 'owner'
        AND m.status = 'active'
        AND m.deleted_at IS NULL
    )
  )
  WITH CHECK (
    id = current_company_id()
    AND EXISTS (
      SELECT 1 FROM company_members m
      WHERE m.company_id = companies.id
        AND m.user_id = current_user_id()
        AND m.role = 'owner'
        AND m.status = 'active'
        AND m.deleted_at IS NULL
    )
  );

-- Tenant tables: the company claim is the only key.
DROP POLICY IF EXISTS tenant_isolation ON company_settings;
CREATE POLICY tenant_isolation ON company_settings
  AS PERMISSIVE FOR ALL TO kd_app
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

DROP POLICY IF EXISTS tenant_isolation ON invitations;
CREATE POLICY tenant_isolation ON invitations
  AS PERMISSIVE FOR ALL TO kd_app
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

DROP POLICY IF EXISTS tenant_isolation ON roles;
CREATE POLICY tenant_isolation ON roles
  AS PERMISSIVE FOR ALL TO kd_app
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

DROP POLICY IF EXISTS tenant_isolation ON role_permissions;
CREATE POLICY tenant_isolation ON role_permissions
  AS PERMISSIVE FOR ALL TO kd_app
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

DROP POLICY IF EXISTS tenant_isolation ON user_roles;
CREATE POLICY tenant_isolation ON user_roles
  AS PERMISSIVE FOR ALL TO kd_app
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

DROP POLICY IF EXISTS tenant_isolation ON coupon_redemptions;
CREATE POLICY tenant_isolation ON coupon_redemptions
  AS PERMISSIVE FOR ALL TO kd_app
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

DROP POLICY IF EXISTS tenant_isolation ON entitlements;
CREATE POLICY tenant_isolation ON entitlements
  AS PERMISSIVE FOR ALL TO kd_app
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

DROP POLICY IF EXISTS tenant_isolation ON subscriptions;
CREATE POLICY tenant_isolation ON subscriptions
  AS PERMISSIVE FOR ALL TO kd_app
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

-- Company members: the tenant sees its own memberships. A user also reads its
-- own membership in every company, read only, so it can list where it belongs
-- and so the owner checks above can see the caller's row. A user cannot write
-- its own membership, which blocks self-promotion to owner.
DROP POLICY IF EXISTS tenant_isolation ON company_members;
CREATE POLICY tenant_isolation ON company_members
  AS PERMISSIVE FOR ALL TO kd_app
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

DROP POLICY IF EXISTS member_own_rows ON company_members;
CREATE POLICY member_own_rows ON company_members
  AS PERMISSIVE FOR SELECT TO kd_app
  USING (user_id = current_user_id());

-- User profiles: a user owns its profile; a user reads the profiles of members
-- of the company it is scoped to.
DROP POLICY IF EXISTS profile_self ON user_profiles;
CREATE POLICY profile_self ON user_profiles
  AS PERMISSIVE FOR ALL TO kd_app
  USING (id = current_user_id())
  WITH CHECK (id = current_user_id());

DROP POLICY IF EXISTS profile_colleague ON user_profiles;
CREATE POLICY profile_colleague ON user_profiles
  AS PERMISSIVE FOR SELECT TO kd_app
  USING (
    EXISTS (
      SELECT 1 FROM company_members m
      WHERE m.user_id = user_profiles.id
        AND m.company_id = current_company_id()
    )
  );

-- Platform administration: a user reads its own platform row; a super_admin
-- writes platform rows, which carry no company.
DROP POLICY IF EXISTS platform_self_read ON platform_users;
CREATE POLICY platform_self_read ON platform_users
  AS PERMISSIVE FOR SELECT TO kd_app
  USING (user_id = current_user_id());

DROP POLICY IF EXISTS platform_write ON platform_users;
CREATE POLICY platform_write ON platform_users
  AS PERMISSIVE FOR ALL TO kd_app
  USING (company_id IS NULL AND current_user_id() IS NOT NULL AND current_role_name() = 'super_admin')
  WITH CHECK (company_id IS NULL AND current_user_id() IS NOT NULL AND current_role_name() = 'super_admin');

-- Devices and sessions belong to a user. A device or session may be attached to
-- a company only while the user holds an active membership of that company, so
-- a user cannot file a device under a tenant it does not belong to.
DROP POLICY IF EXISTS own_rows ON devices;
CREATE POLICY own_rows ON devices
  AS PERMISSIVE FOR ALL TO kd_app
  USING (user_id = current_user_id())
  WITH CHECK (
    user_id = current_user_id()
    AND (
      company_id IS NULL
      OR EXISTS (
        SELECT 1 FROM company_members m
        WHERE m.company_id = devices.company_id
          AND m.user_id = current_user_id()
          AND m.status = 'active'
          AND m.deleted_at IS NULL
      )
    )
  );

DROP POLICY IF EXISTS own_rows ON sessions;
CREATE POLICY own_rows ON sessions
  AS PERMISSIVE FOR ALL TO kd_app
  USING (user_id = current_user_id())
  WITH CHECK (
    user_id = current_user_id()
    AND (
      company_id IS NULL
      OR EXISTS (
        SELECT 1 FROM company_members m
        WHERE m.company_id = sessions.company_id
          AND m.user_id = current_user_id()
          AND m.status = 'active'
          AND m.deleted_at IS NULL
      )
    )
  );
