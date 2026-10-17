-- path: migrations/20260116020000_tenancy_identity.sql
--
-- Sub-step 2.3, first half: the tenant root and the identity tables.
--
--   companies        the tenant. company_id is null on this one table because
--                    a tenant cannot be scoped to itself; the row is the scope.
--   company_settings one row per tenant: the operational defaults step 3
--                    (session limits) and step 4 (settings screen) read.
--   user_profiles    a person. Identity is platform-level: one profile, many
--                    memberships, so company_id stays null here.
--   platform_users   the three platform roles above every tenant:
--                    super_admin, ceo and admin_staff with its sub-roles.
--
-- The four tables in the second half of the sub-step
-- (20260116020100_tenancy_membership.sql) reference companies and
-- user_profiles, which is why the two files are ordered this way.
--
-- Status columns are text with a named CHECK, not a native PostgreSQL enum.
-- The evolution policy (FEATURE_LIST K1) is: a closed set that changes only
-- with a release uses a CHECK, which can be altered inside the same
-- transaction that ships the change; a set that grows without a migration
-- (plans, permissions, jurisdictions) uses a lookup table. If a native enum is
-- ever introduced it must be named {name}_enum per MASTER_PROMPT.
--
-- RLS is deliberately absent: sub-step 2.7 owns the framework and enables a
-- default-deny policy on every table in one place. Audit triggers arrive with
-- 2.8 for the same reason.

CREATE TABLE IF NOT EXISTS companies (
  id uuid NOT NULL DEFAULT uuid_generate_v7(),
  company_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version integer NOT NULL DEFAULT 0,

  name text NOT NULL,
  slug text NOT NULL,
  legal_name text,
  company_type text,
  country_code text,
  address_street text,
  address_city text,
  address_state text,
  address_postal_code text,
  phone text,
  email text,
  website text,
  tax_registration_number text,
  registration_number text,
  billing_contact_name text,
  billing_contact_email text,
  billing_contact_phone text,
  status text NOT NULL DEFAULT 'active',

  CONSTRAINT pk_companies PRIMARY KEY (id),
  CONSTRAINT chk_companies_company_id_absent CHECK (company_id IS NULL),
  CONSTRAINT chk_companies_name_length CHECK (char_length(btrim(name)) BETWEEN 2 AND 160),
  CONSTRAINT chk_companies_slug_format
    CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(slug) BETWEEN 2 AND 64),
  CONSTRAINT chk_companies_company_type_allowed
    CHECK (company_type IS NULL OR company_type IN ('sole_proprietor', 'llc', 'corporation', 'partnership')),
  CONSTRAINT chk_companies_country_code_format
    CHECK (country_code IS NULL OR country_code ~ '^[A-Z]{2}$'),
  CONSTRAINT chk_companies_email_format
    CHECK (
      email IS NULL
      OR (email = lower(email) AND email ~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$')
    ),
  CONSTRAINT chk_companies_billing_contact_email_format
    CHECK (
      billing_contact_email IS NULL
      OR (
        billing_contact_email = lower(billing_contact_email)
        AND billing_contact_email ~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'
      )
    ),
  CONSTRAINT chk_companies_phone_length
    CHECK (phone IS NULL OR char_length(phone) BETWEEN 7 AND 32),
  CONSTRAINT chk_companies_website_format
    CHECK (website IS NULL OR website ~ '^https://[a-z0-9.-]+\.[a-z]{2,}(/[^[:space:]]*)?$'),
  CONSTRAINT chk_companies_status_allowed CHECK (status IN ('active', 'suspended', 'closed'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_slug
  ON companies (slug)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_companies_company_id_created_at
  ON companies (company_id, created_at);

CREATE INDEX IF NOT EXISTS idx_companies_status_created_at
  ON companies (status, created_at);

COMMENT ON TABLE companies IS
  'One row per tenant. The tenant root: company_id is null here by design and every other tenant table points at id.';

CREATE TABLE IF NOT EXISTS company_settings (
  id uuid NOT NULL DEFAULT uuid_generate_v7(),
  company_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version integer NOT NULL DEFAULT 0,

  timezone text NOT NULL DEFAULT 'UTC',
  locale text NOT NULL DEFAULT 'en',
  date_format text NOT NULL DEFAULT 'YYYY-MM-DD',
  time_format text NOT NULL DEFAULT '24h',
  week_starts_on smallint NOT NULL DEFAULT 1,
  fiscal_year_start_month smallint NOT NULL DEFAULT 1,
  currency_code text NOT NULL DEFAULT 'USD',
  session_idle_timeout_minutes integer NOT NULL DEFAULT 30,
  session_max_concurrent smallint NOT NULL DEFAULT 5,
  onboarding_completed_at timestamptz,

  CONSTRAINT pk_company_settings PRIMARY KEY (id),
  CONSTRAINT fk_company_settings_companies
    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE RESTRICT,
  CONSTRAINT chk_company_settings_timezone_format
    CHECK (
      char_length(timezone) BETWEEN 1 AND 64
      AND timezone ~ '^[A-Za-z0-9_+-]+(/[A-Za-z0-9_+-]+)*$'
    ),
  CONSTRAINT chk_company_settings_locale_format CHECK (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  CONSTRAINT chk_company_settings_date_format_allowed
    CHECK (date_format IN ('YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY')),
  CONSTRAINT chk_company_settings_time_format_allowed CHECK (time_format IN ('12h', '24h')),
  CONSTRAINT chk_company_settings_week_starts_on_range CHECK (week_starts_on BETWEEN 0 AND 6),
  CONSTRAINT chk_company_settings_fiscal_year_start_month_range
    CHECK (fiscal_year_start_month BETWEEN 1 AND 12),
  CONSTRAINT chk_company_settings_currency_code_format CHECK (currency_code ~ '^[A-Z]{3}$'),
  CONSTRAINT chk_company_settings_session_idle_timeout_range
    CHECK (session_idle_timeout_minutes BETWEEN 5 AND 1440),
  CONSTRAINT chk_company_settings_session_max_concurrent_range
    CHECK (session_max_concurrent BETWEEN 1 AND 100)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_company_settings_company_id
  ON company_settings (company_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_company_settings_company_id_created_at
  ON company_settings (company_id, created_at);

COMMENT ON TABLE company_settings IS
  'One row per tenant: locale, timezone, fiscal year and the session limits step 3 enforces.';

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid NOT NULL DEFAULT uuid_generate_v7(),
  company_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version integer NOT NULL DEFAULT 0,

  email text NOT NULL,
  full_name text NOT NULL,
  phone text,
  locale text NOT NULL DEFAULT 'en',
  status text NOT NULL DEFAULT 'pending_verification',
  email_verified_at timestamptz,
  last_seen_at timestamptz,

  CONSTRAINT pk_user_profiles PRIMARY KEY (id),
  CONSTRAINT chk_user_profiles_company_id_absent CHECK (company_id IS NULL),
  CONSTRAINT chk_user_profiles_email_format
    CHECK (email = lower(email) AND email ~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'),
  CONSTRAINT chk_user_profiles_full_name_length
    CHECK (char_length(btrim(full_name)) BETWEEN 2 AND 120),
  CONSTRAINT chk_user_profiles_phone_length
    CHECK (phone IS NULL OR char_length(phone) BETWEEN 7 AND 32),
  CONSTRAINT chk_user_profiles_locale_format CHECK (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  CONSTRAINT chk_user_profiles_status_allowed
    CHECK (status IN ('pending_verification', 'active', 'suspended')),
  CONSTRAINT chk_user_profiles_verification_consistent
    CHECK (email_verified_at IS NULL OR status <> 'pending_verification')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_email
  ON user_profiles (email)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id_created_at
  ON user_profiles (company_id, created_at);

COMMENT ON TABLE user_profiles IS
  'A person. Identity is platform-level so one profile can belong to more than one company through company_members.';

CREATE TABLE IF NOT EXISTS platform_users (
  id uuid NOT NULL DEFAULT uuid_generate_v7(),
  company_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version integer NOT NULL DEFAULT 0,

  user_id uuid NOT NULL,
  platform_role text NOT NULL,
  sub_role text,
  status text NOT NULL DEFAULT 'active',
  granted_at timestamptz NOT NULL DEFAULT now(),
  granted_by_user_id uuid,
  revoked_at timestamptz,
  revocation_reason text,

  CONSTRAINT pk_platform_users PRIMARY KEY (id),
  CONSTRAINT fk_platform_users_user_profiles
    FOREIGN KEY (user_id) REFERENCES user_profiles (id) ON DELETE RESTRICT,
  CONSTRAINT fk_platform_users_granted_by_user_profiles
    FOREIGN KEY (granted_by_user_id) REFERENCES user_profiles (id) ON DELETE RESTRICT,
  CONSTRAINT chk_platform_users_company_id_absent CHECK (company_id IS NULL),
  CONSTRAINT chk_platform_users_platform_role_allowed
    CHECK (platform_role IN ('super_admin', 'ceo', 'admin_staff')),
  CONSTRAINT chk_platform_users_sub_role_allowed
    CHECK (
      sub_role IS NULL
      OR (
        platform_role = 'admin_staff'
        AND sub_role IN (
          'kyc_reviewer', 'payment_processor', 'support_agent', 'content_manager',
          'compliance_officer', 'fraud_analyst', 'finance_analyst'
        )
      )
    ),
  CONSTRAINT chk_platform_users_status_allowed
    CHECK (status IN ('active', 'suspended', 'revoked')),
  CONSTRAINT chk_platform_users_granted_by_not_self CHECK (granted_by_user_id IS NULL OR granted_by_user_id <> user_id),
  CONSTRAINT chk_platform_users_revocation_consistent
    CHECK (
      (revoked_at IS NULL AND revocation_reason IS NULL)
      OR (revoked_at IS NOT NULL AND revocation_reason IS NOT NULL)
    ),
  CONSTRAINT chk_platform_users_revoked_status_consistent
    CHECK ((status = 'revoked') = (revoked_at IS NOT NULL))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_users_user_id
  ON platform_users (user_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_platform_users_company_id_created_at
  ON platform_users (company_id, created_at);

CREATE INDEX IF NOT EXISTS idx_platform_users_granted_by_user_id
  ON platform_users (granted_by_user_id, created_at);

COMMENT ON TABLE platform_users IS
  'Platform staff above every tenant: super_admin, ceo, and admin_staff with one optional sub-role.';

DROP TRIGGER IF EXISTS trg_companies_set_updated_at ON companies;

CREATE TRIGGER trg_companies_set_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_company_settings_set_updated_at ON company_settings;

CREATE TRIGGER trg_company_settings_set_updated_at
  BEFORE UPDATE ON company_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_user_profiles_set_updated_at ON user_profiles;

CREATE TRIGGER trg_user_profiles_set_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_platform_users_set_updated_at ON platform_users;

CREATE TRIGGER trg_platform_users_set_updated_at
  BEFORE UPDATE ON platform_users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- The author guard: a forgotten universal column fails this migration rather
-- than the step gate.
SELECT assert_universal_columns('companies');

SELECT assert_universal_columns('company_settings');

SELECT assert_universal_columns('user_profiles');

SELECT assert_universal_columns('platform_users');
