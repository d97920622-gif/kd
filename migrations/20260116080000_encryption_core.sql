-- path: migrations/20260116080000_encryption_core.sql
--
-- Sub-step 2.9: the encryption core support table.
--
--   encryption_key_versions  the lifecycle record of each platform key version:
--                            which purpose it serves (field encryption or blind
--                            index), its number, whether it is the active one,
--                            and a key check that proves the environment root
--                            key derives the same key. The table holds no key
--                            material. The root key lives only in the
--                            environment (MASTER_PROMPT layer 4; PLAN 11 section
--                            10), and every other key is derived from it at run
--                            time by lib/encryption/key-vault.ts.
--
-- Platform rows only: company_id is null, enforced by a named check. Per-tenant
-- data keys are sub-step 2.10 and have their own table.
--
-- ACTIVATION. One active version per purpose is held by a partial unique index.
-- Writes go through encryption_activate_key_version(), which runs as the owner
-- and is refused unless the caller is a super_admin or a deployment role. The
-- function retires the active version, inserts the next number and records a
-- reason, under a per-purpose advisory lock, in one transaction. Versions are
-- contiguous, so a skipped or repeated number is refused.
--
-- RLS. Row level security is enabled and forced. kd_app reads only the platform
-- rows, and only as a super_admin, through platform_key_read. Like the 2.8
-- ledger, the table takes a SELECT grant and no write grant, and it has no write
-- policy, so every write goes through the function.
--
-- AUDIT. The capture trigger from 2.8 records every activation and retirement.
--
-- DEFINER AND ROW LEVEL SECURITY. The activation function is SECURITY DEFINER
-- and the table is FORCE RLS, so the owner must hold BYPASSRLS or be a
-- superuser, as 2.7 and 2.8 already require. Without it the insert is refused
-- and the failure is closed.

CREATE TABLE IF NOT EXISTS encryption_key_versions (
  id uuid NOT NULL DEFAULT uuid_generate_v7(),
  company_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version integer NOT NULL DEFAULT 0,

  purpose text NOT NULL,
  key_version integer NOT NULL,
  state text NOT NULL DEFAULT 'active',
  key_check text NOT NULL,
  reason text NOT NULL,
  activated_at timestamptz NOT NULL DEFAULT now(),
  retired_at timestamptz,

  CONSTRAINT pk_encryption_key_versions PRIMARY KEY (id),
  CONSTRAINT chk_encryption_key_versions_company_id_absent CHECK (company_id IS NULL),
  CONSTRAINT chk_encryption_key_versions_purpose_allowed CHECK (purpose IN ('field', 'blind_index')),
  CONSTRAINT chk_encryption_key_versions_key_version_range CHECK (key_version BETWEEN 1 AND 100000),
  CONSTRAINT chk_encryption_key_versions_state_allowed CHECK (state IN ('active', 'retired')),
  -- A key check is HMAC-SHA256 in lowercase hex, computed by the key vault.
  CONSTRAINT chk_encryption_key_versions_key_check_format CHECK (key_check ~ '^[0-9a-f]{64}$'),
  CONSTRAINT chk_encryption_key_versions_reason_length CHECK (char_length(btrim(reason)) BETWEEN 3 AND 200),
  -- An active version has no retirement time. A retired version keeps the time
  -- it was retired, which cannot precede its activation.
  CONSTRAINT chk_encryption_key_versions_retired_at_state CHECK (
    (state = 'active' AND retired_at IS NULL)
    OR (state = 'retired' AND retired_at IS NOT NULL AND retired_at >= activated_at)
  )
);

-- A version number is never reused for a purpose, live or soft-deleted.
CREATE UNIQUE INDEX IF NOT EXISTS idx_encryption_key_versions_purpose_key_version
  ON encryption_key_versions (purpose, key_version);

CREATE UNIQUE INDEX IF NOT EXISTS idx_encryption_key_versions_purpose_key_version_live
  ON encryption_key_versions (purpose, key_version)
  WHERE deleted_at IS NULL;

-- One active version per purpose.
CREATE UNIQUE INDEX IF NOT EXISTS idx_encryption_key_versions_purpose_active_live
  ON encryption_key_versions (purpose)
  WHERE state = 'active' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_encryption_key_versions_company_id_created_at
  ON encryption_key_versions (company_id, created_at);

COMMENT ON TABLE encryption_key_versions IS
  'Lifecycle of each platform encryption key version: purpose, number, active or retired, and a key check. Holds no key material; the root key is in the environment only.';

COMMENT ON COLUMN encryption_key_versions.key_check IS
  'HMAC-SHA256 of a fixed label under the derived key, in lowercase hex. It proves the environment root key derives the recorded key, and reveals nothing about the key.';

-- Row level security. Enabled and forced, with one policy for the super_admin
-- read and no write policy.

ALTER TABLE encryption_key_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE encryption_key_versions FORCE ROW LEVEL SECURITY;

CREATE POLICY platform_key_read ON encryption_key_versions
  AS PERMISSIVE FOR SELECT TO kd_app
  USING (company_id IS NULL AND current_user_id() IS NOT NULL AND current_role_name() = 'super_admin');

GRANT SELECT ON encryption_key_versions TO kd_app;

-- Activation. The only write path. It runs as the owner; the caller check
-- reads the connecting role, not the definer, so a deployment role is
-- recognised as itself.

CREATE OR REPLACE FUNCTION encryption_activate_key_version(
  p_purpose text,
  p_key_version integer,
  p_key_check text,
  p_reason text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_current integer;
  v_id uuid;
BEGIN
  IF NOT (
    (public.current_role_name() = 'super_admin' AND public.current_user_id() IS NOT NULL)
    OR EXISTS (
      SELECT 1 FROM pg_catalog.pg_roles r
      WHERE r.rolname = session_user AND (r.rolsuper OR r.rolbypassrls)
    )
  ) THEN
    RAISE EXCEPTION 'encryption key activation refused: the caller is neither a super_admin nor a deployment role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_purpose IS NULL OR p_purpose NOT IN ('field', 'blind_index') THEN
    RAISE EXCEPTION 'encryption key activation refused: unknown purpose'
      USING ERRCODE = 'check_violation';
  END IF;

  -- Serialise activations per purpose, so two rotations cannot both claim the
  -- next number or both leave a version active.
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('encryption_key_versions:' || p_purpose));

  SELECT max(e.key_version) INTO v_current
  FROM encryption_key_versions e
  WHERE e.purpose = p_purpose AND e.deleted_at IS NULL;

  IF p_key_version IS DISTINCT FROM coalesce(v_current, 0) + 1 THEN
    RAISE EXCEPTION 'encryption key activation refused: the next version for this purpose is %', coalesce(v_current, 0) + 1
      USING ERRCODE = 'check_violation';
  END IF;

  UPDATE encryption_key_versions
  SET state = 'retired', retired_at = now()
  WHERE purpose = p_purpose AND state = 'active' AND deleted_at IS NULL;

  INSERT INTO encryption_key_versions (company_id, purpose, key_version, state, key_check, reason, activated_at)
  VALUES (NULL, p_purpose, p_key_version, 'active', p_key_check, p_reason, now())
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION encryption_activate_key_version(text, integer, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION encryption_activate_key_version(text, integer, text, text) TO kd_app;

COMMENT ON FUNCTION encryption_activate_key_version(text, integer, text, text) IS
  'Activates the next key version for a purpose and retires the previous one. Refused unless the caller is a super_admin or a deployment role. The only write path to encryption_key_versions.';

-- Triggers. The 2.2 standard, and the 2.8 capture trigger that records every
-- activation and retirement.

DROP TRIGGER IF EXISTS trg_encryption_key_versions_set_updated_at ON encryption_key_versions;

CREATE TRIGGER trg_encryption_key_versions_set_updated_at
  BEFORE UPDATE ON encryption_key_versions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_encryption_key_versions_audit ON encryption_key_versions;

CREATE TRIGGER trg_encryption_key_versions_audit
  AFTER INSERT OR UPDATE OR DELETE ON encryption_key_versions
  FOR EACH ROW EXECUTE FUNCTION audit_row_change();

SELECT assert_universal_columns('encryption_key_versions');
