-- path: migrations/20260116050000_reference_tables_down.sql
--
-- Rollback for the reference tables. The foreign keys on the tables from 2.3
-- and 2.5 are removed first, because they reference the reference tables;
-- then the reference tables are dropped in dependency order: tax_jurisdictions
-- references countries, and countries references currencies. No CASCADE.
--
-- The rollback refuses while a tenant row still holds a value that only these
-- tables define. Without that guard the drop would succeed, and the next
-- migrate would fail to re-add the foreign keys over the orphaned values. The
-- whole file is one transaction, so a refusal leaves every table in place.
-- The two columns that the 2.5 checks do not pin to USD are guarded here; the
-- currency columns of plans and subscriptions are pinned to USD by 2.5.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM companies WHERE country_code IS NOT NULL) THEN
    RAISE EXCEPTION 'refusing to drop the reference tables: a company still names a country; clear companies.country_code first'
      USING ERRCODE = 'restrict_violation';
  END IF;

  IF EXISTS (
    SELECT 1 FROM company_settings
    WHERE timezone <> 'UTC' OR currency_code <> 'USD'
  ) THEN
    RAISE EXCEPTION 'refusing to drop the reference tables: company settings still name a timezone or currency other than UTC and USD; reset company_settings first'
      USING ERRCODE = 'restrict_violation';
  END IF;
END
$$;

ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS fk_subscriptions_currencies;

DROP INDEX IF EXISTS idx_subscriptions_currency_code;

ALTER TABLE plans DROP CONSTRAINT IF EXISTS fk_plans_currencies;

DROP INDEX IF EXISTS idx_plans_currency_code;

ALTER TABLE company_settings DROP CONSTRAINT IF EXISTS fk_company_settings_currencies;

DROP INDEX IF EXISTS idx_company_settings_currency_code;

ALTER TABLE company_settings DROP CONSTRAINT IF EXISTS fk_company_settings_timezones;

DROP INDEX IF EXISTS idx_company_settings_timezone;

ALTER TABLE companies DROP CONSTRAINT IF EXISTS fk_companies_countries;

DROP INDEX IF EXISTS idx_companies_country_code;

DROP TABLE IF EXISTS tax_jurisdictions;

DROP FUNCTION IF EXISTS tax_jurisdictions_refuse_overlap();

DROP TABLE IF EXISTS countries;

DROP TABLE IF EXISTS timezones;

DROP TABLE IF EXISTS currencies;
