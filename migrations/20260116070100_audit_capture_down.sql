-- path: migrations/20260116070100_audit_capture_down.sql
--
-- Rollback for the audit capture. It drops the capture trigger from every table
-- first, because each trigger depends on audit_row_change, and only then the
-- functions. The file is one transaction. It removes no data: the ledger rows
-- stay until 20260116070000_audit_ledger_down.sql drops the ledger tables. The
-- rollback runner deletes this migration's ledger row before this file runs, and
-- that delete is itself captured, so the rollback leaves one more ledger row
-- behind, as an ordinary change would. The chain is still whole.

DROP TRIGGER IF EXISTS trg_schema_migrations_audit ON schema_migrations;

DROP TRIGGER IF EXISTS trg_seed_migrations_audit ON seed_migrations;

DROP TRIGGER IF EXISTS trg_companies_audit ON companies;

DROP TRIGGER IF EXISTS trg_company_settings_audit ON company_settings;

DROP TRIGGER IF EXISTS trg_user_profiles_audit ON user_profiles;

DROP TRIGGER IF EXISTS trg_platform_users_audit ON platform_users;

DROP TRIGGER IF EXISTS trg_company_members_audit ON company_members;

DROP TRIGGER IF EXISTS trg_invitations_audit ON invitations;

DROP TRIGGER IF EXISTS trg_devices_audit ON devices;

DROP TRIGGER IF EXISTS trg_sessions_audit ON sessions;

DROP TRIGGER IF EXISTS trg_roles_audit ON roles;

DROP TRIGGER IF EXISTS trg_permissions_audit ON permissions;

DROP TRIGGER IF EXISTS trg_role_permissions_audit ON role_permissions;

DROP TRIGGER IF EXISTS trg_user_roles_audit ON user_roles;

DROP TRIGGER IF EXISTS trg_login_attempts_audit ON login_attempts;

DROP TRIGGER IF EXISTS trg_login_lock_state_audit ON login_lock_state;

DROP TRIGGER IF EXISTS trg_plans_audit ON plans;

DROP TRIGGER IF EXISTS trg_plan_features_audit ON plan_features;

DROP TRIGGER IF EXISTS trg_feature_flags_audit ON feature_flags;

DROP TRIGGER IF EXISTS trg_subscriptions_audit ON subscriptions;

DROP TRIGGER IF EXISTS trg_entitlements_audit ON entitlements;

DROP TRIGGER IF EXISTS trg_coupons_audit ON coupons;

DROP TRIGGER IF EXISTS trg_coupon_redemptions_audit ON coupon_redemptions;

DROP TRIGGER IF EXISTS trg_currencies_audit ON currencies;

DROP TRIGGER IF EXISTS trg_timezones_audit ON timezones;

DROP TRIGGER IF EXISTS trg_countries_audit ON countries;

DROP TRIGGER IF EXISTS trg_tax_jurisdictions_audit ON tax_jurisdictions;

DROP TRIGGER IF EXISTS trg_audit_merkle_roots_audit ON audit_merkle_roots;

DROP TRIGGER IF EXISTS trg_audit_signing_keys_audit ON audit_signing_keys;

DROP FUNCTION IF EXISTS audit_export_jsonl(bigint, bigint);

DROP FUNCTION IF EXISTS audit_verify_chain();

DROP FUNCTION IF EXISTS audit_merkle_checkpoint();

DROP FUNCTION IF EXISTS audit_merkle_root(bigint, bigint);

DROP FUNCTION IF EXISTS audit_attach_root_signature(uuid, uuid, text);

DROP FUNCTION IF EXISTS audit_attach_signature(uuid, uuid, text);

DROP FUNCTION IF EXISTS audit_register_signing_key(text, text);

DROP FUNCTION IF EXISTS audit_row_change();
