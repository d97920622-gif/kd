-- path: migrations/20260116040100_platform_billing.sql
--
-- Sub-step 2.5, second half: subscription, entitlement and coupon storage.
--
--   subscriptions        one tenant's subscription to one plan: interval,
--                        period, trial end, cancellation state, the price
--                        snapshot it was sold at (FEATURE_LIST 706-713).
--   entitlements         the materialised answer the server-side guard reads:
--                        one row per tenant per feature, with the effective
--                        limit and where it came from (FEATURE_LIST 725-732).
--   coupons              platform discount codes (FEATURE_LIST 717-724).
--   coupon_redemptions   one tenant's use of one coupon, with the discount
--                        that was actually applied.
--
-- BOUNDARIES.
--
-- - The entitlement ENGINE is not here. This sub-step stores what the engine
--   will read; the central engine, the soft paywall, the quota meter and the
--   server-side enforcement of FEATURE_LIST 725-732 belong to the billing step
--   (step 4) and its gate.
-- - Coupons are platform rows: company_id is null and a named check enforces
--   it, because FEATURE_LIST I3 sits under the platform billing section. A
--   tenant's coupons for its own clients are part of the client billing
--   surface in step 10, not this table.
-- - A coupon is redeemed ONCE per tenant (FEATURE_LIST 723). That rule is the
--   partial unique index on coupon_redemptions, not a column, so there is no
--   per-tenant limit column that could disagree with it. A future multi-use
--   coupon needs a new migration that drops the index and adds the counter;
--   until then the database cannot hold a second live redemption, and a
--   reversed redemption still counts as used, because reversing a refund is
--   an accounting correction rather than a fresh entitlement.
-- - The subscription price is a SNAPSHOT (`price_amount` plus
--   `currency_code`), not a pointer to `plans.monthly_price`. A plan price
--   change must not rewrite the amount a tenant already agreed to; the
--   snapshot is what the invoice will quote.
--
-- RLS arrives in 2.7; audit triggers in 2.8.

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid NOT NULL DEFAULT uuid_generate_v7(),
  company_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version integer NOT NULL DEFAULT 0,

  plan_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'trialing',
  billing_interval text NOT NULL DEFAULT 'month',
  price_amount numeric(18,4) NOT NULL,
  currency_code text NOT NULL DEFAULT 'USD',
  seats smallint NOT NULL DEFAULT 1,
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL,
  trial_ends_at timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  canceled_at timestamptz,
  ended_at timestamptz,
  failed_payment_count smallint NOT NULL DEFAULT 0,
  external_reference text,

  CONSTRAINT pk_subscriptions PRIMARY KEY (id),
  CONSTRAINT fk_subscriptions_companies
    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE RESTRICT,
  CONSTRAINT fk_subscriptions_plans
    FOREIGN KEY (plan_id) REFERENCES plans (id) ON DELETE RESTRICT,
  CONSTRAINT chk_subscriptions_status_allowed
    CHECK (status IN ('trialing', 'active', 'past_due', 'paused', 'canceled')),
  CONSTRAINT chk_subscriptions_billing_interval_allowed
    CHECK (billing_interval IN ('month', 'year')),
  CONSTRAINT chk_subscriptions_price_non_negative CHECK (price_amount >= 0),
  CONSTRAINT chk_subscriptions_currency_code_usd CHECK (currency_code = 'USD'),
  CONSTRAINT chk_subscriptions_seats_range CHECK (seats BETWEEN 1 AND 5000),
  CONSTRAINT chk_subscriptions_period_order CHECK (current_period_end > current_period_start),
  CONSTRAINT chk_subscriptions_trial_consistent
    CHECK ((status = 'trialing') = (trial_ends_at IS NOT NULL)),
  CONSTRAINT chk_subscriptions_cancel_consistent
    CHECK (cancel_at_period_end = false OR canceled_at IS NOT NULL),
  CONSTRAINT chk_subscriptions_canceled_status_consistent
    CHECK ((status = 'canceled') = (ended_at IS NOT NULL)),
  CONSTRAINT chk_subscriptions_failed_payment_range
    CHECK (failed_payment_count BETWEEN 0 AND 3),
  CONSTRAINT chk_subscriptions_external_reference_length
    CHECK (external_reference IS NULL OR char_length(external_reference) <= 120)
);

-- A tenant has one live subscription at a time. A second row is only allowed
-- after the first is canceled, which is how an upgrade is recorded: cancel
-- and create inside one transaction, never two live rows.
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_company_id_live
  ON subscriptions (company_id)
  WHERE status IN ('trialing', 'active', 'past_due', 'paused') AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_company_id_created_at
  ON subscriptions (company_id, created_at);

CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id
  ON subscriptions (plan_id, created_at);

-- The renewal and dunning jobs scan by the period end.
CREATE INDEX IF NOT EXISTS idx_subscriptions_status_current_period_end
  ON subscriptions (status, current_period_end);

COMMENT ON TABLE subscriptions IS
  'A tenant subscription with the price it was sold at. One live row per tenant; the engine that prorates and duns is step 4.';

CREATE TABLE IF NOT EXISTS entitlements (
  id uuid NOT NULL DEFAULT uuid_generate_v7(),
  company_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version integer NOT NULL DEFAULT 0,

  subscription_id uuid,
  feature_key text NOT NULL,
  is_enabled boolean NOT NULL,
  limit_value bigint,
  limit_period text,
  source text NOT NULL DEFAULT 'plan',
  computed_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,

  CONSTRAINT pk_entitlements PRIMARY KEY (id),
  CONSTRAINT fk_entitlements_companies
    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE RESTRICT,
  CONSTRAINT fk_entitlements_subscriptions
    FOREIGN KEY (subscription_id) REFERENCES subscriptions (id) ON DELETE RESTRICT,
  CONSTRAINT chk_entitlements_feature_key_format
    CHECK (feature_key ~ '^[a-z][a-z0-9_]{1,47}$'),
  CONSTRAINT chk_entitlements_source_allowed
    CHECK (source IN ('plan', 'trial', 'coupon', 'override')),
  CONSTRAINT chk_entitlements_limit_value_positive
    CHECK (limit_value IS NULL OR limit_value >= 0),
  CONSTRAINT chk_entitlements_limit_period_allowed
    CHECK (limit_period IS NULL OR limit_period IN ('day', 'month', 'year', 'lifetime')),
  CONSTRAINT chk_entitlements_limit_period_pair
    CHECK ((limit_value IS NULL) = (limit_period IS NULL)),
  -- A disabled feature with a cap is a row two readers would interpret two
  -- ways: the guard must see one answer, so a disabled row carries no limit.
  CONSTRAINT chk_entitlements_disabled_has_no_limit
    CHECK (is_enabled OR limit_value IS NULL),
  CONSTRAINT chk_entitlements_expiry_after_computation
    CHECK (expires_at IS NULL OR expires_at > computed_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_entitlements_company_id_feature_key
  ON entitlements (company_id, feature_key)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_entitlements_company_id_created_at
  ON entitlements (company_id, created_at);

CREATE INDEX IF NOT EXISTS idx_entitlements_subscription_id
  ON entitlements (subscription_id, created_at);

CREATE INDEX IF NOT EXISTS idx_entitlements_feature_key
  ON entitlements (feature_key, company_id);

COMMENT ON TABLE entitlements IS
  'The materialised entitlement per tenant per feature, with its source. The guard reads this row; the engine that writes it is step 4.';

CREATE TABLE IF NOT EXISTS coupons (
  id uuid NOT NULL DEFAULT uuid_generate_v7(),
  company_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version integer NOT NULL DEFAULT 0,

  code text NOT NULL,
  description text,
  discount_type text NOT NULL,
  discount_value numeric(18,4) NOT NULL,
  currency_code text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'draft',
  max_redemptions_total integer,
  applicable_plan_ids uuid[],
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_by_user_id uuid,

  CONSTRAINT pk_coupons PRIMARY KEY (id),
  CONSTRAINT fk_coupons_created_by_user_profiles
    FOREIGN KEY (created_by_user_id) REFERENCES user_profiles (id) ON DELETE RESTRICT,
  CONSTRAINT chk_coupons_company_id_absent CHECK (company_id IS NULL),
  -- Codes are stored in canonical upper case, so the unique index below is
  -- case-insensitive by construction rather than by a second lower() index.
  CONSTRAINT chk_coupons_code_canonical CHECK (code = upper(code)),
  CONSTRAINT chk_coupons_code_format CHECK (code ~ '^[A-Z0-9][A-Z0-9_-]{3,31}$'),
  CONSTRAINT chk_coupons_description_length
    CHECK (description IS NULL OR char_length(description) <= 300),
  CONSTRAINT chk_coupons_discount_type_allowed
    CHECK (discount_type IN ('percentage', 'fixed')),
  CONSTRAINT chk_coupons_discount_value_non_negative CHECK (discount_value > 0),
  CONSTRAINT chk_coupons_percentage_range
    CHECK (discount_type <> 'percentage' OR discount_value BETWEEN 0 AND 100),
  CONSTRAINT chk_coupons_fixed_currency_usd
    CHECK (discount_type <> 'fixed' OR currency_code = 'USD'),
  CONSTRAINT chk_coupons_status_allowed
    CHECK (status IN ('draft', 'active', 'expired', 'revoked')),
  CONSTRAINT chk_coupons_max_redemptions_total_positive
    CHECK (max_redemptions_total IS NULL OR max_redemptions_total > 0),
  -- A restriction with no plan in it would match nothing, which reads as
  -- "no coupon works" rather than "every plan works"; null is the open case.
  CONSTRAINT chk_coupons_applicable_plans_not_empty
    CHECK (applicable_plan_ids IS NULL OR cardinality(applicable_plan_ids) > 0),
  CONSTRAINT chk_coupons_window_order CHECK (expires_at IS NULL OR expires_at > starts_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_coupons_code
  ON coupons (code)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_coupons_company_id_created_at
  ON coupons (company_id, created_at);

CREATE INDEX IF NOT EXISTS idx_coupons_status_expires_at
  ON coupons (status, expires_at);

CREATE INDEX IF NOT EXISTS idx_coupons_created_by_user_id
  ON coupons (created_by_user_id, created_at);

COMMENT ON TABLE coupons IS
  'Platform discount codes. applicable_plan_ids is an array because a coupon can name several plans; the redemption handler validates each id against plans, which an array foreign key cannot do.';

CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id uuid NOT NULL DEFAULT uuid_generate_v7(),
  company_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version integer NOT NULL DEFAULT 0,

  coupon_id uuid NOT NULL,
  subscription_id uuid,
  redeemed_by_user_id uuid,
  discount_amount numeric(18,4) NOT NULL,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  reversed_at timestamptz,
  reversal_reason text,

  CONSTRAINT pk_coupon_redemptions PRIMARY KEY (id),
  CONSTRAINT fk_coupon_redemptions_companies
    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE RESTRICT,
  CONSTRAINT fk_coupon_redemptions_coupons
    FOREIGN KEY (coupon_id) REFERENCES coupons (id) ON DELETE RESTRICT,
  CONSTRAINT fk_coupon_redemptions_subscriptions
    FOREIGN KEY (subscription_id) REFERENCES subscriptions (id) ON DELETE RESTRICT,
  CONSTRAINT fk_coupon_redemptions_redeemed_by_user_profiles
    FOREIGN KEY (redeemed_by_user_id) REFERENCES user_profiles (id) ON DELETE RESTRICT,
  CONSTRAINT chk_coupon_redemptions_discount_non_negative CHECK (discount_amount >= 0),
  CONSTRAINT chk_coupon_redemptions_reversal_consistent
    CHECK (
      (reversed_at IS NULL AND reversal_reason IS NULL)
      OR (reversed_at IS NOT NULL AND reversal_reason IS NOT NULL)
    ),
  CONSTRAINT chk_coupon_redemptions_reversal_reason_length
    CHECK (reversal_reason IS NULL OR char_length(reversal_reason) BETWEEN 3 AND 300),
  CONSTRAINT chk_coupon_redemptions_reversed_after_redemption
    CHECK (reversed_at IS NULL OR reversed_at >= redeemed_at)
);

-- The one-use-per-tenant rule of FEATURE_LIST 723, enforced by the database:
-- a second live redemption of the same coupon by the same tenant is refused.
CREATE UNIQUE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon_id_company_id
  ON coupon_redemptions (coupon_id, company_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_company_id_created_at
  ON coupon_redemptions (company_id, created_at);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon_id
  ON coupon_redemptions (coupon_id, redeemed_at);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_subscription_id
  ON coupon_redemptions (subscription_id, created_at);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_redeemed_by_user_id
  ON coupon_redemptions (redeemed_by_user_id, created_at);

COMMENT ON TABLE coupon_redemptions IS
  'One tenant''s use of one coupon, with the discount applied. The partial unique index is the one-time policy: one live redemption per tenant per coupon, reversed or not.';

DROP TRIGGER IF EXISTS trg_subscriptions_set_updated_at ON subscriptions;

CREATE TRIGGER trg_subscriptions_set_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_entitlements_set_updated_at ON entitlements;

CREATE TRIGGER trg_entitlements_set_updated_at
  BEFORE UPDATE ON entitlements
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_coupons_set_updated_at ON coupons;

CREATE TRIGGER trg_coupons_set_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_coupon_redemptions_set_updated_at ON coupon_redemptions;

CREATE TRIGGER trg_coupon_redemptions_set_updated_at
  BEFORE UPDATE ON coupon_redemptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

SELECT assert_universal_columns('subscriptions');

SELECT assert_universal_columns('entitlements');

SELECT assert_universal_columns('coupons');

SELECT assert_universal_columns('coupon_redemptions');
