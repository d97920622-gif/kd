-- path: migrations/20260116040000_platform_plans.sql
--
-- Sub-step 2.5, first half: the plan catalog.
--
--   plans          the four published tiers (free, starter, pro, enterprise)
--                  plus any later tier. Platform rows: company_id is null.
--   plan_features  the plan by feature matrix, with the numeric limit each
--                  row grants (FEATURE_LIST 700, 701, 726).
--   feature_flags  a global switch, optionally overridden per tenant, which
--                  the CEO may toggle only with super_admin approval
--                  (FEATURE_LIST 3616). A flag is never a second entitlement:
--                  the entitlement engine reads plans, the flag layer gates a
--                  release, and the two are deliberately separate tables so
--                  one cannot silently answer for the other.
--
-- MONEY. Prices are numeric(18,4) NOT NULL, matching the rule in
-- MASTER_PROMPT.md. The platform bills in USD only (docs/PLAN/02 rule 2), so
-- currency_code is checked to 'USD' here; sub-step 2.6 creates the currencies
-- table and adds the foreign key in its own migration.
--
-- The public pricing page (lib/i18n/strings/en/pricing.ts) already states that
-- the plan table wins when the two disagree, and that the four slugs are free,
-- starter, pro and enterprise. Sub-step 2.14 seeds exactly those four rows
-- with the figures the page publishes.
--
-- RLS arrives in 2.7; audit triggers in 2.8.

CREATE TABLE IF NOT EXISTS plans (
  id uuid NOT NULL DEFAULT uuid_generate_v7(),
  company_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version integer NOT NULL DEFAULT 0,

  slug text NOT NULL,
  name text NOT NULL,
  description text,
  tier smallint NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  monthly_price numeric(18,4) NOT NULL,
  yearly_price numeric(18,4) NOT NULL,
  currency_code text NOT NULL DEFAULT 'USD',
  trial_days integer NOT NULL DEFAULT 14,
  is_featured boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  archived_at timestamptz,

  CONSTRAINT pk_plans PRIMARY KEY (id),
  CONSTRAINT chk_plans_company_id_absent CHECK (company_id IS NULL),
  CONSTRAINT chk_plans_slug_format CHECK (slug ~ '^[a-z][a-z0-9-]{1,31}$'),
  CONSTRAINT chk_plans_name_length CHECK (char_length(btrim(name)) BETWEEN 2 AND 60),
  CONSTRAINT chk_plans_description_length
    CHECK (description IS NULL OR char_length(description) <= 400),
  CONSTRAINT chk_plans_tier_range CHECK (tier BETWEEN 0 AND 99),
  CONSTRAINT chk_plans_status_allowed
    CHECK (status IN ('draft', 'active', 'archived')),
  CONSTRAINT chk_plans_monthly_price_non_negative CHECK (monthly_price >= 0),
  CONSTRAINT chk_plans_yearly_price_non_negative CHECK (yearly_price >= 0),
  CONSTRAINT chk_plans_currency_code_usd CHECK (currency_code = 'USD'),
  CONSTRAINT chk_plans_trial_days_range CHECK (trial_days BETWEEN 0 AND 90),
  CONSTRAINT chk_plans_archive_consistent
    CHECK ((status = 'archived') = (archived_at IS NOT NULL)),
  CONSTRAINT chk_plans_published_consistent
    CHECK (published_at IS NULL OR status IN ('active', 'archived'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_plans_slug
  ON plans (slug)
  WHERE deleted_at IS NULL;

-- The public page lists the tiers in order and reads them by slug, so the
-- tier number is unique among live rows too.
CREATE UNIQUE INDEX IF NOT EXISTS idx_plans_tier
  ON plans (tier)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_plans_company_id_created_at
  ON plans (company_id, created_at);

CREATE INDEX IF NOT EXISTS idx_plans_status_tier
  ON plans (status, tier);

COMMENT ON TABLE plans IS
  'The platform plan catalog: four published tiers plus later ones. Prices are USD numeric(18,4); 2.14 seeds the four slugs the pricing page publishes.';

CREATE TABLE IF NOT EXISTS plan_features (
  id uuid NOT NULL DEFAULT uuid_generate_v7(),
  company_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version integer NOT NULL DEFAULT 0,

  plan_id uuid NOT NULL,
  feature_key text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  limit_value bigint,
  limit_period text,
  description text,

  CONSTRAINT pk_plan_features PRIMARY KEY (id),
  CONSTRAINT fk_plan_features_plans
    FOREIGN KEY (plan_id) REFERENCES plans (id) ON DELETE RESTRICT,
  CONSTRAINT chk_plan_features_company_id_absent CHECK (company_id IS NULL),
  CONSTRAINT chk_plan_features_key_format
    CHECK (feature_key ~ '^[a-z][a-z0-9_]{1,47}$'),
  CONSTRAINT chk_plan_features_limit_value_positive
    CHECK (limit_value IS NULL OR limit_value >= 0),
  CONSTRAINT chk_plan_features_limit_period_allowed
    CHECK (limit_period IS NULL OR limit_period IN ('day', 'month', 'year', 'lifetime')),
  -- A limit without a period would be read as a lifetime cap by one caller and
  -- as a monthly cap by the next, so the pair is all or nothing.
  CONSTRAINT chk_plan_features_limit_period_pair
    CHECK ((limit_value IS NULL) = (limit_period IS NULL)),
  CONSTRAINT chk_plan_features_description_length
    CHECK (description IS NULL OR char_length(description) <= 200)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_plan_features_plan_id_feature_key
  ON plan_features (plan_id, feature_key)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_plan_features_company_id_created_at
  ON plan_features (company_id, created_at);

CREATE INDEX IF NOT EXISTS idx_plan_features_feature_key
  ON plan_features (feature_key, plan_id);

COMMENT ON TABLE plan_features IS
  'The plan by feature matrix. A row that is absent means the plan does not grant the feature; is_enabled false means it grants the feature but not now (for example a locked beta); a null limit means no numeric cap.';

CREATE TABLE IF NOT EXISTS feature_flags (
  id uuid NOT NULL DEFAULT uuid_generate_v7(),
  company_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version integer NOT NULL DEFAULT 0,

  flag_key text NOT NULL,
  description text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT false,
  rollout_percentage smallint NOT NULL DEFAULT 0,
  expires_at timestamptz,
  created_by_user_id uuid,

  CONSTRAINT pk_feature_flags PRIMARY KEY (id),
  CONSTRAINT fk_feature_flags_companies
    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE RESTRICT,
  CONSTRAINT fk_feature_flags_created_by_user_profiles
    FOREIGN KEY (created_by_user_id) REFERENCES user_profiles (id) ON DELETE RESTRICT,
  CONSTRAINT chk_feature_flags_key_format CHECK (flag_key ~ '^[a-z][a-z0-9_]{1,47}$'),
  CONSTRAINT chk_feature_flags_description_length
    CHECK (char_length(btrim(description)) BETWEEN 8 AND 300),
  CONSTRAINT chk_feature_flags_rollout_range CHECK (rollout_percentage BETWEEN 0 AND 100),
  -- A disabled flag cannot roll out, and a flag that is on at zero percent is
  -- off with extra steps; both are states a reader would misread.
  CONSTRAINT chk_feature_flags_rollout_consistent
    CHECK (is_enabled OR rollout_percentage = 0),
  CONSTRAINT chk_feature_flags_expiry_after_creation CHECK (expires_at IS NULL OR expires_at > created_at)
);

-- The global flag: one live row per key with no tenant.
CREATE UNIQUE INDEX IF NOT EXISTS idx_feature_flags_flag_key_global
  ON feature_flags (flag_key)
  WHERE company_id IS NULL AND deleted_at IS NULL;

-- The tenant override: one live row per key per tenant.
CREATE UNIQUE INDEX IF NOT EXISTS idx_feature_flags_company_id_flag_key
  ON feature_flags (company_id, flag_key)
  WHERE company_id IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_feature_flags_company_id_created_at
  ON feature_flags (company_id, created_at);

CREATE INDEX IF NOT EXISTS idx_feature_flags_created_by_user_id
  ON feature_flags (created_by_user_id, created_at);

COMMENT ON TABLE feature_flags IS
  'A global release switch, optionally overridden per tenant. Separate from entitlements on purpose: a flag gates a release, an entitlement bills a feature.';

DROP TRIGGER IF EXISTS trg_plans_set_updated_at ON plans;

CREATE TRIGGER trg_plans_set_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_plan_features_set_updated_at ON plan_features;

CREATE TRIGGER trg_plan_features_set_updated_at
  BEFORE UPDATE ON plan_features
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_feature_flags_set_updated_at ON feature_flags;

CREATE TRIGGER trg_feature_flags_set_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

SELECT assert_universal_columns('plans');

SELECT assert_universal_columns('plan_features');

SELECT assert_universal_columns('feature_flags');
