-- path: migrations/20260116070100_audit_capture.sql
--
-- Sub-step 2.8, second half: the capture trigger on every table, the signature
-- and Merkle functions, the verification function and the export function. The
-- ledger tables and the chain are in 20260116070000_audit_ledger.sql.
--
-- CAPTURE. Every INSERT, every UPDATE and every DELETE on a table writes one
-- audit_logs row, in the same transaction as the change. A row that is rolled
-- back takes its audit row with it. An UPDATE that changes nothing but updated_at
-- or the signature writes no row: updated_at changes on every update, so counting
-- it would record an empty change, and a signature is the signer's act, not a
-- change to the data. The changed columns are recorded by name, never by value,
-- so the ledger holds no personal data from the row itself. Redaction of the
-- values that do need to be kept is the work of 2.9.
--
-- THE REQUEST CONTEXT. The actor and the request come from transaction-local
-- settings that the server sets once per request, as 2.7 sets the claims:
--
--   request.ip_address       the client address (inet)
--   request.user_agent       the client user agent (text)
--   request.device_fingerprint  the device fingerprint (text)
--   request.location         a JSON object with the country, city and ISP
--   request.correlation_id   the request trace id (uuid)
--
-- The actor is read from the same request.jwt.claims that 2.7 reads. A setting
-- that is absent is recorded as null. A setting that is malformed raises, and the
-- write is refused, so a bad request context cannot produce a silent record.
--
-- THE CAPTURE ROLE. The capture function is SECURITY DEFINER and runs as the
-- owner, so it can write the ledger past its policies. The owner must hold
-- BYPASSRLS, as 2.7 requires. The function's search_path is fixed.
--
-- THE SIGNATURE FUNCTIONS. audit_attach_signature and
-- audit_attach_root_signature are the only way a signature is stored. They are
-- executable by the owner alone, so the signing runner, which connects as the
-- owner, is the only caller. audit_register_signing_key and
-- audit_merkle_checkpoint are restricted the same way.
--
-- THE VERIFICATION. audit_verify_chain() returns one row per violation and none
-- when the chain holds. It checks the sequence, the previous-hash link and the
-- recomputed hash of every row, the Merkle root of every checkpoint, and that no
-- checkpoint covers rows the ledger no longer has. A tail that was removed
-- without any checkpoint covering it is not detected by this function; that
-- limit is recorded in the sub-step evidence.
--
-- THE EXPORT. audit_export_jsonl returns the rows of a sequence range as JSON
-- lines, one object per row, with the hashes and the signature. It is invoked by
-- the caller, not the owner, so the policies decide which rows a caller may see.
-- CSV and syslog or CEF forwarding are later steps (FEATURE_LIST C1 and C2).

-- The capture trigger.

CREATE OR REPLACE FUNCTION audit_row_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_row jsonb;
  v_old_core jsonb;
  v_new_core jsonb;
  v_changed jsonb := '[]'::jsonb;
  v_company uuid;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    v_old_core := to_jsonb(OLD) - ARRAY['signature', 'signing_key_id', 'updated_at'];
    v_new_core := to_jsonb(NEW) - ARRAY['signature', 'signing_key_id', 'updated_at'];
    IF v_old_core = v_new_core THEN
      RETURN NULL;
    END IF;
    SELECT coalesce(jsonb_agg(o.key ORDER BY o.key), '[]'::jsonb)
      INTO v_changed
      FROM jsonb_each(v_old_core) AS o(key, value)
      JOIN jsonb_each(v_new_core) AS n(key, value) ON n.key = o.key
      WHERE o.value IS DISTINCT FROM n.value;
    v_row := to_jsonb(NEW);
  ELSIF TG_OP = 'INSERT' THEN
    v_row := to_jsonb(NEW);
  ELSE
    v_row := to_jsonb(OLD);
  END IF;

  -- A company is its own tenant. Every other table names its tenant in
  -- company_id, and a platform row has none.
  v_company := CASE
    WHEN TG_TABLE_NAME = 'companies' THEN (v_row ->> 'id')::uuid
    ELSE (v_row ->> 'company_id')::uuid
  END;

  INSERT INTO audit_logs (
    company_id,
    user_id,
    action,
    resource_type,
    resource_id,
    ip_address,
    user_agent,
    device_fingerprint,
    location,
    metadata,
    correlation_id
  )
  VALUES (
    v_company,
    public.current_user_id(),
    TG_TABLE_NAME || '.' || CASE TG_OP
      WHEN 'INSERT' THEN 'created'
      WHEN 'UPDATE' THEN 'updated'
      ELSE 'deleted'
    END,
    TG_TABLE_NAME,
    (v_row ->> 'id')::uuid,
    NULLIF(current_setting('request.ip_address', true), '')::inet,
    NULLIF(current_setting('request.user_agent', true), ''),
    NULLIF(current_setting('request.device_fingerprint', true), ''),
    NULLIF(current_setting('request.location', true), '')::jsonb,
    jsonb_build_object('operation', lower(TG_OP), 'changed', v_changed),
    NULLIF(current_setting('request.correlation_id', true), '')::uuid
  );

  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION audit_row_change() IS
  'AFTER INSERT, UPDATE OR DELETE capture for every table except audit_logs: writes one ledger row in the same transaction.';

-- The signing registry and the signature functions.

CREATE OR REPLACE FUNCTION audit_register_signing_key(p_key_id text, p_public_key_pem text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO audit_signing_keys (key_id, algorithm, public_key_pem)
  VALUES (p_key_id, 'ed25519', p_public_key_pem)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION audit_register_signing_key(text, text) FROM PUBLIC;

CREATE OR REPLACE FUNCTION audit_attach_signature(
  p_id uuid,
  p_signing_key_id uuid,
  p_signature text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  UPDATE audit_logs
    SET signature = p_signature,
        signing_key_id = p_signing_key_id
    WHERE id = p_id
      AND signature IS NULL;

  RETURN FOUND;
END;
$$;

REVOKE EXECUTE ON FUNCTION audit_attach_signature(uuid, uuid, text) FROM PUBLIC;

CREATE OR REPLACE FUNCTION audit_attach_root_signature(
  p_id uuid,
  p_signing_key_id uuid,
  p_signature text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  UPDATE audit_merkle_roots
    SET signature = p_signature,
        signing_key_id = p_signing_key_id
    WHERE id = p_id
      AND signature IS NULL;

  RETURN FOUND;
END;
$$;

REVOKE EXECUTE ON FUNCTION audit_attach_root_signature(uuid, uuid, text) FROM PUBLIC;

-- The Merkle functions. The tree is built level by level. An odd node at the end
-- of a level is paired with itself. That is the usual rule, and it is why each
-- root records its leaf count: a root over a list ending in a duplicate cannot be
-- mistaken for a root over a shorter list.

CREATE OR REPLACE FUNCTION audit_merkle_root(p_first bigint, p_last bigint)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_level text[];
  v_next text[];
  v_left text;
  v_right text;
  i integer;
BEGIN
  SELECT coalesce(array_agg(a.current_hash ORDER BY a.sequence_number), ARRAY[]::text[])
    INTO v_level
    FROM audit_logs a
    WHERE a.sequence_number BETWEEN p_first AND p_last;

  IF cardinality(v_level) = 0 THEN
    RETURN NULL;
  END IF;

  WHILE cardinality(v_level) > 1 LOOP
    v_next := ARRAY[]::text[];
    FOR i IN 1..cardinality(v_level) BY 2 LOOP
      v_left := v_level[i];
      v_right := CASE
        WHEN i + 1 <= cardinality(v_level) THEN v_level[i + 1]
        ELSE v_level[i]
      END;
      v_next := v_next || encode(public.digest(decode(v_left || v_right, 'hex'), 'sha256'), 'hex');
    END LOOP;
    v_level := v_next;
  END LOOP;

  RETURN v_level[1];
END;
$$;

COMMENT ON FUNCTION audit_merkle_root(bigint, bigint) IS
  'The Merkle root over the current_hash of every ledger row in a sequence range. Null for an empty range.';

CREATE OR REPLACE FUNCTION audit_merkle_checkpoint()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_first bigint;
  v_last bigint;
  v_id uuid;
BEGIN
  -- The same chain lock as the writer, so the range is fixed while it is read.
  PERFORM pg_advisory_xact_lock(hashtext('audit_logs:chain'));

  SELECT coalesce(max(r.last_sequence), 0) + 1
    INTO v_first
    FROM audit_merkle_roots r;

  SELECT max(a.sequence_number)
    INTO v_last
    FROM audit_logs a;

  IF v_last IS NULL OR v_last < v_first THEN
    RETURN NULL;
  END IF;

  -- A checkpoint is written only when the ledger changed since the last one.
  -- Writing a root records a row in the ledger, so without this test every run
  -- would write a root over the single row the previous run had just written.
  IF NOT EXISTS (
    SELECT 1
    FROM audit_logs a
    WHERE a.sequence_number >= v_first
      AND a.resource_type <> 'audit_merkle_roots'
  ) THEN
    RETURN NULL;
  END IF;

  INSERT INTO audit_merkle_roots (first_sequence, last_sequence, leaf_count, root_hash)
  VALUES (
    v_first,
    v_last,
    (v_last - v_first + 1)::integer,
    audit_merkle_root(v_first, v_last)
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION audit_merkle_checkpoint() FROM PUBLIC;

-- The verification function. It reads the whole ledger, so it is definer-owned
-- and restricted to the owner, which runs it from db:assert.

CREATE OR REPLACE FUNCTION audit_verify_chain()
RETURNS TABLE (rule text, object text, detail text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  r audit_logs%ROWTYPE;
  v_root audit_merkle_roots%ROWTYPE;
  v_expected_sequence bigint := 0;
  v_expected_previous text := audit_genesis_hash();
  v_last_sequence bigint;
  v_leaves integer;
BEGIN
  FOR r IN SELECT * FROM audit_logs ORDER BY sequence_number LOOP
    v_expected_sequence := v_expected_sequence + 1;

    IF r.sequence_number <> v_expected_sequence THEN
      rule := 'sequence_gap';
      object := r.id::text;
      detail := format('expected sequence %s, found %s', v_expected_sequence, r.sequence_number);
      RETURN NEXT;
      v_expected_sequence := r.sequence_number;
    END IF;

    IF r.previous_hash IS DISTINCT FROM v_expected_previous THEN
      rule := 'chain_link_broken';
      object := r.id::text;
      detail := format('sequence %s does not name the hash of the row before it', r.sequence_number);
      RETURN NEXT;
    END IF;

    IF audit_entry_hash(r.previous_hash, r) IS DISTINCT FROM r.current_hash THEN
      rule := 'hash_mismatch';
      object := r.id::text;
      detail := format('sequence %s: current_hash does not match the row content', r.sequence_number);
      RETURN NEXT;
    END IF;

    v_expected_previous := r.current_hash;
  END LOOP;

  SELECT max(a.sequence_number) INTO v_last_sequence FROM audit_logs a;

  FOR v_root IN SELECT * FROM audit_merkle_roots ORDER BY last_sequence LOOP
    IF v_root.last_sequence > coalesce(v_last_sequence, 0) THEN
      rule := 'chain_truncated';
      object := v_root.id::text;
      detail := format('root covers sequence %s but the ledger ends at %s',
        v_root.last_sequence, coalesce(v_last_sequence, 0));
      RETURN NEXT;
    END IF;

    SELECT count(*)::integer
      INTO v_leaves
      FROM audit_logs a
      WHERE a.sequence_number BETWEEN v_root.first_sequence AND v_root.last_sequence;

    IF v_leaves <> v_root.leaf_count THEN
      rule := 'merkle_leaf_count_mismatch';
      object := v_root.id::text;
      detail := format('root records %s leaves, the range holds %s', v_root.leaf_count, v_leaves);
      RETURN NEXT;
    END IF;

    IF audit_merkle_root(v_root.first_sequence, v_root.last_sequence) IS DISTINCT FROM v_root.root_hash THEN
      rule := 'merkle_root_mismatch';
      object := v_root.id::text;
      detail := format('root over sequences %s to %s does not match the ledger',
        v_root.first_sequence, v_root.last_sequence);
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION audit_verify_chain() IS
  'Returns one row per violation of the hash chain, the sequence, or a Merkle root. No row means the ledger verifies.';

REVOKE EXECUTE ON FUNCTION audit_verify_chain() FROM PUBLIC;

-- The export function. It is an invoker function, so the caller's policies decide
-- which rows are returned.

CREATE OR REPLACE FUNCTION audit_export_jsonl(p_from bigint, p_to bigint)
RETURNS SETOF text
LANGUAGE sql
STABLE
SET search_path = pg_catalog, public
AS $$
  SELECT to_jsonb(a)::text
    FROM audit_logs a
    WHERE a.sequence_number BETWEEN p_from AND p_to
    ORDER BY a.sequence_number
$$;

COMMENT ON FUNCTION audit_export_jsonl(bigint, bigint) IS
  'The ledger rows in a sequence range as JSON lines, one object per row, limited by the caller''s policies.';

-- The capture trigger on every table. The ledger's own tables are listed, except
-- audit_logs, which is excluded by design (see the 2.8 header). The triggers are
-- named trg_{table}_audit. Each is dropped first, so a re-run is idempotent.

DROP TRIGGER IF EXISTS trg_schema_migrations_audit ON schema_migrations;
CREATE TRIGGER trg_schema_migrations_audit
  AFTER INSERT OR UPDATE OR DELETE ON schema_migrations
  FOR EACH ROW EXECUTE FUNCTION audit_row_change();

DROP TRIGGER IF EXISTS trg_seed_migrations_audit ON seed_migrations;
CREATE TRIGGER trg_seed_migrations_audit
  AFTER INSERT OR UPDATE OR DELETE ON seed_migrations
  FOR EACH ROW EXECUTE FUNCTION audit_row_change();

DROP TRIGGER IF EXISTS trg_companies_audit ON companies;
CREATE TRIGGER trg_companies_audit
  AFTER INSERT OR UPDATE OR DELETE ON companies
  FOR EACH ROW EXECUTE FUNCTION audit_row_change();

DROP TRIGGER IF EXISTS trg_company_settings_audit ON company_settings;
CREATE TRIGGER trg_company_settings_audit
  AFTER INSERT OR UPDATE OR DELETE ON company_settings
  FOR EACH ROW EXECUTE FUNCTION audit_row_change();

DROP TRIGGER IF EXISTS trg_user_profiles_audit ON user_profiles;
CREATE TRIGGER trg_user_profiles_audit
  AFTER INSERT OR UPDATE OR DELETE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION audit_row_change();

DROP TRIGGER IF EXISTS trg_platform_users_audit ON platform_users;
CREATE TRIGGER trg_platform_users_audit
  AFTER INSERT OR UPDATE OR DELETE ON platform_users
  FOR EACH ROW EXECUTE FUNCTION audit_row_change();

DROP TRIGGER IF EXISTS trg_company_members_audit ON company_members;
CREATE TRIGGER trg_company_members_audit
  AFTER INSERT OR UPDATE OR DELETE ON company_members
  FOR EACH ROW EXECUTE FUNCTION audit_row_change();

DROP TRIGGER IF EXISTS trg_invitations_audit ON invitations;
CREATE TRIGGER trg_invitations_audit
  AFTER INSERT OR UPDATE OR DELETE ON invitations
  FOR EACH ROW EXECUTE FUNCTION audit_row_change();

DROP TRIGGER IF EXISTS trg_devices_audit ON devices;
CREATE TRIGGER trg_devices_audit
  AFTER INSERT OR UPDATE OR DELETE ON devices
  FOR EACH ROW EXECUTE FUNCTION audit_row_change();

DROP TRIGGER IF EXISTS trg_sessions_audit ON sessions;
CREATE TRIGGER trg_sessions_audit
  AFTER INSERT OR UPDATE OR DELETE ON sessions
  FOR EACH ROW EXECUTE FUNCTION audit_row_change();

DROP TRIGGER IF EXISTS trg_roles_audit ON roles;
CREATE TRIGGER trg_roles_audit
  AFTER INSERT OR UPDATE OR DELETE ON roles
  FOR EACH ROW EXECUTE FUNCTION audit_row_change();

DROP TRIGGER IF EXISTS trg_permissions_audit ON permissions;
CREATE TRIGGER trg_permissions_audit
  AFTER INSERT OR UPDATE OR DELETE ON permissions
  FOR EACH ROW EXECUTE FUNCTION audit_row_change();

DROP TRIGGER IF EXISTS trg_role_permissions_audit ON role_permissions;
CREATE TRIGGER trg_role_permissions_audit
  AFTER INSERT OR UPDATE OR DELETE ON role_permissions
  FOR EACH ROW EXECUTE FUNCTION audit_row_change();

DROP TRIGGER IF EXISTS trg_user_roles_audit ON user_roles;
CREATE TRIGGER trg_user_roles_audit
  AFTER INSERT OR UPDATE OR DELETE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION audit_row_change();

DROP TRIGGER IF EXISTS trg_login_attempts_audit ON login_attempts;
CREATE TRIGGER trg_login_attempts_audit
  AFTER INSERT OR UPDATE OR DELETE ON login_attempts
  FOR EACH ROW EXECUTE FUNCTION audit_row_change();

DROP TRIGGER IF EXISTS trg_login_lock_state_audit ON login_lock_state;
CREATE TRIGGER trg_login_lock_state_audit
  AFTER INSERT OR UPDATE OR DELETE ON login_lock_state
  FOR EACH ROW EXECUTE FUNCTION audit_row_change();

DROP TRIGGER IF EXISTS trg_plans_audit ON plans;
CREATE TRIGGER trg_plans_audit
  AFTER INSERT OR UPDATE OR DELETE ON plans
  FOR EACH ROW EXECUTE FUNCTION audit_row_change();

DROP TRIGGER IF EXISTS trg_plan_features_audit ON plan_features;
CREATE TRIGGER trg_plan_features_audit
  AFTER INSERT OR UPDATE OR DELETE ON plan_features
  FOR EACH ROW EXECUTE FUNCTION audit_row_change();

DROP TRIGGER IF EXISTS trg_feature_flags_audit ON feature_flags;
CREATE TRIGGER trg_feature_flags_audit
  AFTER INSERT OR UPDATE OR DELETE ON feature_flags
  FOR EACH ROW EXECUTE FUNCTION audit_row_change();

DROP TRIGGER IF EXISTS trg_subscriptions_audit ON subscriptions;
CREATE TRIGGER trg_subscriptions_audit
  AFTER INSERT OR UPDATE OR DELETE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION audit_row_change();

DROP TRIGGER IF EXISTS trg_entitlements_audit ON entitlements;
CREATE TRIGGER trg_entitlements_audit
  AFTER INSERT OR UPDATE OR DELETE ON entitlements
  FOR EACH ROW EXECUTE FUNCTION audit_row_change();

DROP TRIGGER IF EXISTS trg_coupons_audit ON coupons;
CREATE TRIGGER trg_coupons_audit
  AFTER INSERT OR UPDATE OR DELETE ON coupons
  FOR EACH ROW EXECUTE FUNCTION audit_row_change();

DROP TRIGGER IF EXISTS trg_coupon_redemptions_audit ON coupon_redemptions;
CREATE TRIGGER trg_coupon_redemptions_audit
  AFTER INSERT OR UPDATE OR DELETE ON coupon_redemptions
  FOR EACH ROW EXECUTE FUNCTION audit_row_change();

DROP TRIGGER IF EXISTS trg_currencies_audit ON currencies;
CREATE TRIGGER trg_currencies_audit
  AFTER INSERT OR UPDATE OR DELETE ON currencies
  FOR EACH ROW EXECUTE FUNCTION audit_row_change();

DROP TRIGGER IF EXISTS trg_timezones_audit ON timezones;
CREATE TRIGGER trg_timezones_audit
  AFTER INSERT OR UPDATE OR DELETE ON timezones
  FOR EACH ROW EXECUTE FUNCTION audit_row_change();

DROP TRIGGER IF EXISTS trg_countries_audit ON countries;
CREATE TRIGGER trg_countries_audit
  AFTER INSERT OR UPDATE OR DELETE ON countries
  FOR EACH ROW EXECUTE FUNCTION audit_row_change();

DROP TRIGGER IF EXISTS trg_tax_jurisdictions_audit ON tax_jurisdictions;
CREATE TRIGGER trg_tax_jurisdictions_audit
  AFTER INSERT OR UPDATE OR DELETE ON tax_jurisdictions
  FOR EACH ROW EXECUTE FUNCTION audit_row_change();

DROP TRIGGER IF EXISTS trg_audit_merkle_roots_audit ON audit_merkle_roots;
CREATE TRIGGER trg_audit_merkle_roots_audit
  AFTER INSERT OR UPDATE OR DELETE ON audit_merkle_roots
  FOR EACH ROW EXECUTE FUNCTION audit_row_change();

DROP TRIGGER IF EXISTS trg_audit_signing_keys_audit ON audit_signing_keys;
CREATE TRIGGER trg_audit_signing_keys_audit
  AFTER INSERT OR UPDATE OR DELETE ON audit_signing_keys
  FOR EACH ROW EXECUTE FUNCTION audit_row_change();
