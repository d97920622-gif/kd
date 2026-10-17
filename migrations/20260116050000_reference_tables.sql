-- path: migrations/20260116050000_reference_tables.sql
--
-- Sub-step 2.6: the platform reference tables.
--
--   currencies        ISO 4217 codes. USD is the only base currency; other rows
--                     are display currencies for read-only conversion
--                     (MASTER_PROMPT.md rule 2).
--   timezones         IANA zone names. The standard offset is stored for display
--                     only; every calculation reads the zone database at run
--                     time, so a daylight-saving change is never frozen here.
--   countries         ISO 3166-1 codes with the calling code used by phone
--                     formats (FEATURE_LIST 3504).
--   tax_jurisdictions the jurisdiction code, its country, its level (country,
--                     state or local) and the date window it applies. Rates are
--                     step 6's versioned table and are not stored here.
--
-- All four are platform rows: company_id is null, enforced by a named check.
-- Read-only policies for authenticated tenants are the intent recorded here;
-- sub-step 2.7 enables row level security and writes the policies with
-- current_company_id(). Audit triggers arrive in 2.8.
--
-- KEYS. An ISO code is never reused, and a foreign key can only point at an
-- unconditional unique index. So each code has two indexes: a full unique
-- index that the foreign keys target, and a partial unique index on
-- deleted_at IS NULL that the soft-delete standard (check 17) reads. The pair
-- keeps a retired code reserved while still letting a live row be checked.
--
-- SEEDS. Only the two rows the schema's own column defaults need are inserted
-- here: USD (company_settings.currency_code and plans.currency_code default to
-- it) and UTC (company_settings.timezone defaults to it). Every other row is
-- seeded in 2.14. A database that already holds a company with a country or
-- timezone outside the seeds cannot apply the foreign keys below until the
-- seeds run; a fresh database is unaffected.
--
-- FOREIGN KEYS ON EXISTING TABLES. Five keys are added to tables from 2.3 and
-- 2.5, as those files deferred them in writing: companies.country_code,
-- company_settings.timezone, company_settings.currency_code, plans.currency_code
-- and subscriptions.currency_code. Each has its own leading index.

-- Currencies first: countries references it.

CREATE TABLE IF NOT EXISTS currencies (
  id uuid NOT NULL DEFAULT uuid_generate_v7(),
  company_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version integer NOT NULL DEFAULT 0,

  code text NOT NULL,
  numeric_code text NOT NULL,
  name text NOT NULL,
  minor_units smallint NOT NULL,
  is_base boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,

  CONSTRAINT pk_currencies PRIMARY KEY (id),
  CONSTRAINT chk_currencies_company_id_absent CHECK (company_id IS NULL),
  CONSTRAINT chk_currencies_code_format CHECK (code ~ '^[A-Z]{3}$'),
  CONSTRAINT chk_currencies_numeric_code_format CHECK (numeric_code ~ '^[0-9]{3}$'),
  CONSTRAINT chk_currencies_name_length CHECK (char_length(btrim(name)) BETWEEN 2 AND 80),
  CONSTRAINT chk_currencies_minor_units_range CHECK (minor_units BETWEEN 0 AND 4),
  -- The platform bills in USD only; a second base currency would be a second
  -- answer to the question the money code never asks.
  CONSTRAINT chk_currencies_base_is_usd CHECK (NOT is_base OR code = 'USD')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_currencies_code
  ON currencies (code);

CREATE UNIQUE INDEX IF NOT EXISTS idx_currencies_code_live
  ON currencies (code)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_currencies_is_base_live
  ON currencies (is_base)
  WHERE is_base AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_currencies_company_id_created_at
  ON currencies (company_id, created_at);

COMMENT ON TABLE currencies IS
  'ISO 4217 currency codes. USD is the single base currency; other rows are display currencies for read-only conversion.';

-- Timezones.

CREATE TABLE IF NOT EXISTS timezones (
  id uuid NOT NULL DEFAULT uuid_generate_v7(),
  company_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version integer NOT NULL DEFAULT 0,

  iana_name text NOT NULL,
  display_name text NOT NULL,
  standard_offset_minutes integer NOT NULL,
  observes_dst boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,

  CONSTRAINT pk_timezones PRIMARY KEY (id),
  CONSTRAINT chk_timezones_company_id_absent CHECK (company_id IS NULL),
  CONSTRAINT chk_timezones_iana_name_format CHECK (
    char_length(iana_name) BETWEEN 1 AND 64
    AND iana_name ~ '^[A-Za-z0-9_+-]+(/[A-Za-z0-9_+-]+)*$'
  ),
  CONSTRAINT chk_timezones_display_name_length CHECK (char_length(btrim(display_name)) BETWEEN 2 AND 120),
  -- Standard offsets run from UTC-12 to UTC+14 in quarter-hour steps.
  CONSTRAINT chk_timezones_standard_offset_range
    CHECK (standard_offset_minutes BETWEEN -720 AND 840 AND standard_offset_minutes % 15 = 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_timezones_iana_name
  ON timezones (iana_name);

CREATE UNIQUE INDEX IF NOT EXISTS idx_timezones_iana_name_live
  ON timezones (iana_name)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_timezones_company_id_created_at
  ON timezones (company_id, created_at);

COMMENT ON TABLE timezones IS
  'IANA zone names with the standard offset for display. Calculations read the zone database at run time, never this column.';

-- Countries.

CREATE TABLE IF NOT EXISTS countries (
  id uuid NOT NULL DEFAULT uuid_generate_v7(),
  company_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version integer NOT NULL DEFAULT 0,

  iso_code text NOT NULL,
  alpha3_code text NOT NULL,
  numeric_code text NOT NULL,
  name text NOT NULL,
  calling_code text,
  default_currency_code text,
  is_active boolean NOT NULL DEFAULT true,

  CONSTRAINT pk_countries PRIMARY KEY (id),
  CONSTRAINT fk_countries_currencies
    FOREIGN KEY (default_currency_code) REFERENCES currencies (code) ON DELETE RESTRICT,
  CONSTRAINT chk_countries_company_id_absent CHECK (company_id IS NULL),
  CONSTRAINT chk_countries_iso_code_format CHECK (iso_code ~ '^[A-Z]{2}$'),
  CONSTRAINT chk_countries_alpha3_code_format CHECK (alpha3_code ~ '^[A-Z]{3}$'),
  CONSTRAINT chk_countries_numeric_code_format CHECK (numeric_code ~ '^[0-9]{3}$'),
  CONSTRAINT chk_countries_name_length CHECK (char_length(btrim(name)) BETWEEN 2 AND 120),
  CONSTRAINT chk_countries_calling_code_format
    CHECK (calling_code IS NULL OR calling_code ~ '^\+[1-9][0-9]{0,3}$')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_countries_iso_code
  ON countries (iso_code);

CREATE UNIQUE INDEX IF NOT EXISTS idx_countries_iso_code_live
  ON countries (iso_code)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_countries_default_currency_code
  ON countries (default_currency_code);

CREATE INDEX IF NOT EXISTS idx_countries_company_id_created_at
  ON countries (company_id, created_at);

COMMENT ON TABLE countries IS
  'ISO 3166-1 countries with the calling code used by phone formats. Seeded in 2.14.';

-- Tax jurisdictions. The overlap guard below is the reason this is a trigger
-- and not an index: a plain unique index cannot express a date window.

CREATE TABLE IF NOT EXISTS tax_jurisdictions (
  id uuid NOT NULL DEFAULT uuid_generate_v7(),
  company_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version integer NOT NULL DEFAULT 0,

  code text NOT NULL,
  country_code text NOT NULL,
  region_code text,
  level text NOT NULL,
  display_name text NOT NULL,
  effective_from date NOT NULL,
  effective_to date,

  CONSTRAINT pk_tax_jurisdictions PRIMARY KEY (id),
  CONSTRAINT fk_tax_jurisdictions_countries
    FOREIGN KEY (country_code) REFERENCES countries (iso_code) ON DELETE RESTRICT,
  CONSTRAINT chk_tax_jurisdictions_company_id_absent CHECK (company_id IS NULL),
  CONSTRAINT chk_tax_jurisdictions_code_format
    CHECK (code ~ '^[A-Z]{2}(-[A-Z0-9]{1,10}){0,2}$'),
  -- The code is built from the country, so it must start with it.
  CONSTRAINT chk_tax_jurisdictions_code_matches_country
    CHECK (starts_with(code, country_code)),
  CONSTRAINT chk_tax_jurisdictions_region_code_format
    CHECK (region_code IS NULL OR region_code ~ '^[A-Z0-9]{1,10}$'),
  CONSTRAINT chk_tax_jurisdictions_level_allowed
    CHECK (level IN ('country', 'state', 'local')),
  -- A country row has no region; a state or local row must name one.
  CONSTRAINT chk_tax_jurisdictions_region_matches_level
    CHECK ((level = 'country') = (region_code IS NULL)),
  CONSTRAINT chk_tax_jurisdictions_display_name_length
    CHECK (char_length(btrim(display_name)) BETWEEN 2 AND 120),
  CONSTRAINT chk_tax_jurisdictions_effective_window
    CHECK (effective_to IS NULL OR effective_to > effective_from)
);

-- One live row per code and start date; the overlap trigger covers the rest.
CREATE UNIQUE INDEX IF NOT EXISTS idx_tax_jurisdictions_code_effective_from_live
  ON tax_jurisdictions (code, effective_from)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tax_jurisdictions_country_code_level
  ON tax_jurisdictions (country_code, level);

CREATE INDEX IF NOT EXISTS idx_tax_jurisdictions_company_id_created_at
  ON tax_jurisdictions (company_id, created_at);

COMMENT ON TABLE tax_jurisdictions IS
  'Tax jurisdictions by country, state or local level, each with the date window it applies. Rates are step 6.';

CREATE OR REPLACE FUNCTION tax_jurisdictions_refuse_overlap()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Two writers for one code are serialised here, so a race cannot slip two
  -- overlapping windows past the check below.
  PERFORM pg_advisory_xact_lock(hashtext('tax_jurisdictions:' || NEW.code));

  IF EXISTS (
    SELECT 1
    FROM tax_jurisdictions t
    WHERE t.code = NEW.code
      AND t.id <> NEW.id
      AND t.deleted_at IS NULL
      AND t.effective_from < coalesce(NEW.effective_to, 'infinity'::date)
      AND NEW.effective_from < coalesce(t.effective_to, 'infinity'::date)
  ) THEN
    RAISE EXCEPTION 'tax jurisdiction % overlaps an existing window', NEW.code
      USING ERRCODE = 'exclusion_violation';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION tax_jurisdictions_refuse_overlap() IS
  'Refuses a live tax jurisdiction whose date window overlaps another live window for the same code.';

-- The two rows the column defaults need. ON CONFLICT on the full unique
-- index keeps the file idempotent.

INSERT INTO currencies (code, numeric_code, name, minor_units, is_base, is_active)
VALUES ('USD', '840', 'United States dollar', 2, true, true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO timezones (iana_name, display_name, standard_offset_minutes, observes_dst, is_active)
VALUES ('UTC', 'Coordinated Universal Time', 0, false, true)
ON CONFLICT (iana_name) DO NOTHING;

-- The deferred foreign keys on tables from 2.3 and 2.5.

ALTER TABLE companies DROP CONSTRAINT IF EXISTS fk_companies_countries;

ALTER TABLE companies
  ADD CONSTRAINT fk_companies_countries
    FOREIGN KEY (country_code) REFERENCES countries (iso_code) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_companies_country_code
  ON companies (country_code);

ALTER TABLE company_settings DROP CONSTRAINT IF EXISTS fk_company_settings_timezones;

ALTER TABLE company_settings
  ADD CONSTRAINT fk_company_settings_timezones
    FOREIGN KEY (timezone) REFERENCES timezones (iana_name) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_company_settings_timezone
  ON company_settings (timezone);

ALTER TABLE company_settings DROP CONSTRAINT IF EXISTS fk_company_settings_currencies;

ALTER TABLE company_settings
  ADD CONSTRAINT fk_company_settings_currencies
    FOREIGN KEY (currency_code) REFERENCES currencies (code) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_company_settings_currency_code
  ON company_settings (currency_code);

ALTER TABLE plans DROP CONSTRAINT IF EXISTS fk_plans_currencies;

ALTER TABLE plans
  ADD CONSTRAINT fk_plans_currencies
    FOREIGN KEY (currency_code) REFERENCES currencies (code) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_plans_currency_code
  ON plans (currency_code);

ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS fk_subscriptions_currencies;

ALTER TABLE subscriptions
  ADD CONSTRAINT fk_subscriptions_currencies
    FOREIGN KEY (currency_code) REFERENCES currencies (code) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_subscriptions_currency_code
  ON subscriptions (currency_code);

-- Triggers. Each trigger name is unique to its table, and the overlap guard
-- reads only the date window, never updated_at.

DROP TRIGGER IF EXISTS trg_currencies_set_updated_at ON currencies;

CREATE TRIGGER trg_currencies_set_updated_at
  BEFORE UPDATE ON currencies
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_timezones_set_updated_at ON timezones;

CREATE TRIGGER trg_timezones_set_updated_at
  BEFORE UPDATE ON timezones
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_countries_set_updated_at ON countries;

CREATE TRIGGER trg_countries_set_updated_at
  BEFORE UPDATE ON countries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_tax_jurisdictions_set_updated_at ON tax_jurisdictions;

CREATE TRIGGER trg_tax_jurisdictions_set_updated_at
  BEFORE UPDATE ON tax_jurisdictions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_tax_jurisdictions_refuse_overlap ON tax_jurisdictions;

CREATE TRIGGER trg_tax_jurisdictions_refuse_overlap
  BEFORE INSERT OR UPDATE ON tax_jurisdictions
  FOR EACH ROW EXECUTE FUNCTION tax_jurisdictions_refuse_overlap();

SELECT assert_universal_columns('currencies');
SELECT assert_universal_columns('timezones');
SELECT assert_universal_columns('countries');
SELECT assert_universal_columns('tax_jurisdictions');
