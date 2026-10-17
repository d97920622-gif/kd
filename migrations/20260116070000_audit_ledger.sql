-- path: migrations/20260116070000_audit_ledger.sql
--
-- Sub-step 2.8, first half: the audit ledger tables, the hash chain and the
-- rules that make the ledger append-only. The capture trigger, the signing and
-- Merkle functions, the verification function and the export function are in
-- 20260116070100_audit_capture.sql.
--
-- THE LEDGER. audit_logs holds one row per audited change, in one global chain.
-- Each row carries a sequence number, the SHA-256 of the row before it
-- (previous_hash), and its own SHA-256 (current_hash) over that previous hash and
-- the row's content. The database computes all three when the row is written,
-- under one transaction-scoped advisory lock, so a caller cannot choose a
-- sequence number or a hash. A rolled back transaction takes its audit rows with
-- it, so the sequence has no gaps unless a row is removed by something that
-- bypasses these rules, and the verification function detects that.
--
-- THE SIGNATURE. PostgreSQL has no Ed25519 signing, and the signing key must
-- never be stored in the database (docs/PLAN/11, section 10: the audit signing
-- key is environment only). So the database writes the chain and the signing is
-- done by scripts/db/audit-sign.mjs, which holds the private key in its
-- environment. The runner attaches each signature to its row once. Until it
-- runs, a row is unsigned, and scripts/db/audit-verify.mjs reports it. The
-- public key of each signer is registered in audit_signing_keys, which holds
-- public material only.
--
-- IMMUTABILITY. audit_logs and audit_merkle_roots refuse DELETE and TRUNCATE, and
-- refuse an UPDATE of anything except the first attachment of a signature.
-- audit_signing_keys refuses every UPDATE and DELETE, so a key cannot be edited;
-- a rotation registers a new key. No role is granted INSERT, UPDATE or DELETE on
-- these tables: writes go through SECURITY DEFINER functions only.
--
-- SHAPE. audit_logs and the two ledger tables take a new policy shape, audit_read,
-- which is recorded here because 2.7 did not name it. It is SELECT only: a tenant
-- reads the rows of its own company, and a super_admin reads the platform rows
-- (company_id null). The ledger tables take no write policy, so a write is
-- refused for every role except the definer functions.
--
-- DEFINER AND ROW LEVEL SECURITY. The capture trigger and the chain function run
-- as the table owner so they can write and read the whole ledger past the
-- policies. FORCE makes the owner subject to the policies, so this depends on the
-- owner holding BYPASSRLS or being a superuser. That is the same requirement 2.7
-- already places on the migration and seed runners. If the owner lacks it, the
-- chain function sees no prior row, computes sequence 1 again, and the unique
-- index refuses the write, so the failure is closed rather than silent.
--
-- NAMING. The field list in MASTER_PROMPT.md names some columns differently from
-- the universal standard, and the standard wins, so the ledger keeps one spelling
-- of each concept: company_id is the tenant column (MASTER_PROMPT tenant_id),
-- created_at is the transaction timestamp (MASTER_PROMPT timestamp, set by
-- now(), which is the database clock). user_id is not a foreign key: an audit row
-- must outlive the identity it names, so the identity is a plain uuid.
--
-- NO AUDIT OF THE LEDGER ITSELF. audit_logs carries no capture trigger, because
-- an insert into the ledger that writes a ledger row would never end. The other
-- two ledger tables are audited like every table: their inserts are recorded, and
-- a signature attachment, which changes nothing but the signature, is not.
--
-- ROLLBACK. The down file removes the ledger and all its history. That is what a
-- rehearsal needs. A production database must never roll back this file: the
-- release runbook (step 16) forbids it, because the history cannot be rebuilt.

-- The signing key registry comes first, because audit_logs refers to it.

CREATE TABLE IF NOT EXISTS audit_signing_keys (
  id uuid NOT NULL DEFAULT uuid_generate_v7(),
  company_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version integer NOT NULL DEFAULT 0,

  key_id text NOT NULL,
  algorithm text NOT NULL,
  public_key_pem text NOT NULL,

  CONSTRAINT pk_audit_signing_keys PRIMARY KEY (id),
  CONSTRAINT chk_audit_signing_keys_company_id_absent CHECK (company_id IS NULL),
  CONSTRAINT chk_audit_signing_keys_key_id_format CHECK (key_id ~ '^[a-z0-9][a-z0-9._-]{2,63}$'),
  CONSTRAINT chk_audit_signing_keys_algorithm_ed25519 CHECK (algorithm = 'ed25519'),
  CONSTRAINT chk_audit_signing_keys_public_key_pem_shape CHECK (
    starts_with(public_key_pem, '-----BEGIN PUBLIC KEY-----')
    AND char_length(public_key_pem) BETWEEN 100 AND 512
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_audit_signing_keys_key_id_live
  ON audit_signing_keys (key_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_audit_signing_keys_company_id_created_at
  ON audit_signing_keys (company_id, created_at);

-- The Merkle roots. A root covers the contiguous sequence range
-- [first_sequence, last_sequence] and records how many leaves it hashed, so a
-- root over a duplicated last leaf cannot pass for a root over a shorter range.

CREATE TABLE IF NOT EXISTS audit_merkle_roots (
  id uuid NOT NULL DEFAULT uuid_generate_v7(),
  company_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version integer NOT NULL DEFAULT 0,

  first_sequence bigint NOT NULL,
  last_sequence bigint NOT NULL,
  leaf_count integer NOT NULL,
  root_hash text NOT NULL,
  signing_key_id uuid,
  signature text,

  CONSTRAINT pk_audit_merkle_roots PRIMARY KEY (id),
  CONSTRAINT chk_audit_merkle_roots_company_id_absent CHECK (company_id IS NULL),
  CONSTRAINT chk_audit_merkle_roots_first_sequence_positive CHECK (first_sequence > 0),
  CONSTRAINT chk_audit_merkle_roots_range_order CHECK (first_sequence <= last_sequence),
  CONSTRAINT chk_audit_merkle_roots_leaf_count_matches_range CHECK (
    leaf_count = last_sequence - first_sequence + 1
  ),
  CONSTRAINT chk_audit_merkle_roots_root_hash_format CHECK (root_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT chk_audit_merkle_roots_signature_pair CHECK (
    (signature IS NULL) = (signing_key_id IS NULL)
  ),
  CONSTRAINT chk_audit_merkle_roots_signature_format CHECK (
    signature IS NULL OR signature ~ '^[A-Za-z0-9+/]{86}==$'
  ),
  CONSTRAINT fk_audit_merkle_roots_audit_signing_keys
    FOREIGN KEY (signing_key_id) REFERENCES audit_signing_keys (id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_audit_merkle_roots_last_sequence
  ON audit_merkle_roots (last_sequence);

CREATE UNIQUE INDEX IF NOT EXISTS idx_audit_merkle_roots_last_sequence_live
  ON audit_merkle_roots (last_sequence)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_audit_merkle_roots_company_id_created_at
  ON audit_merkle_roots (company_id, created_at);

CREATE INDEX IF NOT EXISTS idx_audit_merkle_roots_signing_key_id
  ON audit_merkle_roots (signing_key_id);

CREATE INDEX IF NOT EXISTS idx_audit_merkle_roots_signature_pending
  ON audit_merkle_roots (last_sequence)
  WHERE signature IS NULL;

-- The ledger itself.

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v7(),
  company_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version integer NOT NULL DEFAULT 0,

  sequence_number bigint NOT NULL,
  user_id uuid,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid NOT NULL,
  ip_address inet,
  user_agent text,
  device_fingerprint text,
  location jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  previous_hash text NOT NULL,
  current_hash text NOT NULL,
  signature text,
  signing_key_id uuid,
  correlation_id uuid,

  CONSTRAINT pk_audit_logs PRIMARY KEY (id),
  CONSTRAINT chk_audit_logs_sequence_number_positive CHECK (sequence_number > 0),
  CONSTRAINT chk_audit_logs_action_format CHECK (
    char_length(action) BETWEEN 3 AND 120
    AND action ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$'
  ),
  CONSTRAINT chk_audit_logs_resource_type_format CHECK (resource_type ~ '^[a-z][a-z0-9_]{1,63}$'),
  CONSTRAINT chk_audit_logs_user_agent_length CHECK (
    user_agent IS NULL OR char_length(user_agent) <= 512
  ),
  CONSTRAINT chk_audit_logs_device_fingerprint_length CHECK (
    device_fingerprint IS NULL OR char_length(device_fingerprint) <= 256
  ),
  CONSTRAINT chk_audit_logs_location_object CHECK (
    location IS NULL OR jsonb_typeof(location) = 'object'
  ),
  CONSTRAINT chk_audit_logs_metadata_object CHECK (jsonb_typeof(metadata) = 'object'),
  CONSTRAINT chk_audit_logs_previous_hash_format CHECK (previous_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT chk_audit_logs_current_hash_format CHECK (current_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT chk_audit_logs_signature_pair CHECK (
    (signature IS NULL) = (signing_key_id IS NULL)
  ),
  CONSTRAINT chk_audit_logs_signature_format CHECK (
    signature IS NULL OR signature ~ '^[A-Za-z0-9+/]{86}==$'
  ),
  CONSTRAINT fk_audit_logs_companies
    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE RESTRICT,
  CONSTRAINT fk_audit_logs_audit_signing_keys
    FOREIGN KEY (signing_key_id) REFERENCES audit_signing_keys (id) ON DELETE RESTRICT
);

-- Two unique indexes on the sequence: the full one enforces the chain, and the
-- live one satisfies the soft-delete standard (check 17).
CREATE UNIQUE INDEX IF NOT EXISTS idx_audit_logs_sequence_number
  ON audit_logs (sequence_number);

CREATE UNIQUE INDEX IF NOT EXISTS idx_audit_logs_sequence_number_live
  ON audit_logs (sequence_number)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_audit_logs_current_hash
  ON audit_logs (current_hash);

CREATE INDEX IF NOT EXISTS idx_audit_logs_company_id_created_at
  ON audit_logs (company_id, created_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id_created_at
  ON audit_logs (user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created_at
  ON audit_logs (action, created_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type_resource_id
  ON audit_logs (resource_type, resource_id, created_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_signing_key_id
  ON audit_logs (signing_key_id);

-- The signer's work queue: the rows still waiting for a signature.
CREATE INDEX IF NOT EXISTS idx_audit_logs_signature_pending
  ON audit_logs (sequence_number)
  WHERE signature IS NULL;

-- The hash functions. A hash is over the previous hash and a canonical JSON
-- array of the content fields, in a fixed order. Timestamps are written in UTC
-- with microsecond precision, so the text does not depend on the session time
-- zone. jsonb text output is canonical, so key order cannot change a hash.

CREATE OR REPLACE FUNCTION audit_genesis_hash()
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = pg_catalog
AS $$
  SELECT repeat('0', 64)
$$;

COMMENT ON FUNCTION audit_genesis_hash() IS
  'The previous_hash of the first ledger row: sixty-four zeros.';

CREATE OR REPLACE FUNCTION audit_entry_hash(p_previous text, p_row audit_logs)
RETURNS text
LANGUAGE sql
STABLE
PARALLEL SAFE
SET search_path = pg_catalog, public
AS $$
  SELECT encode(
    public.digest(
      p_previous || jsonb_build_array(
        p_row.sequence_number,
        p_row.id,
        to_char(p_row.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
        p_row.company_id,
        p_row.user_id,
        p_row.action,
        p_row.resource_type,
        p_row.resource_id,
        p_row.ip_address::text,
        p_row.user_agent,
        p_row.device_fingerprint,
        p_row.location,
        p_row.metadata,
        p_row.correlation_id
      )::text,
      'sha256'
    ),
    'hex'
  )
$$;

COMMENT ON FUNCTION audit_entry_hash(text, audit_logs) IS
  'SHA-256 over the previous hash and the canonical content of one ledger row. The signature is not hashed.';

-- The chain writer. Under the chain lock it reads the last row, numbers the new
-- row one above it, names the last row's hash as previous_hash, and computes
-- current_hash. Whatever the caller supplied for these three columns is replaced.

CREATE OR REPLACE FUNCTION audit_logs_chain()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_last_sequence bigint;
  v_last_hash text;
BEGIN
  -- Transaction-scoped: the lock is released at commit or rollback. Every
  -- writer of the chain takes this same key, and the read below runs after the
  -- lock is granted, so two writers never number the same row.
  PERFORM pg_advisory_xact_lock(hashtext('audit_logs:chain'));

  SELECT a.sequence_number, a.current_hash
    INTO v_last_sequence, v_last_hash
    FROM audit_logs a
    ORDER BY a.sequence_number DESC
    LIMIT 1;

  NEW.sequence_number := coalesce(v_last_sequence, 0) + 1;
  NEW.previous_hash := coalesce(v_last_hash, audit_genesis_hash());
  NEW.current_hash := audit_entry_hash(NEW.previous_hash, NEW);
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION audit_logs_chain() IS
  'BEFORE INSERT on audit_logs: assigns sequence_number, previous_hash and current_hash under the chain lock.';

-- The guard for the two tables that take a signature. A DELETE is refused. An
-- UPDATE is allowed only when it attaches the first signature and changes nothing
-- else. updated_at is excluded from the comparison, because the 2.2 trigger sets
-- it to the time of signing.

CREATE OR REPLACE FUNCTION audit_signed_once()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION '% is append-only: DELETE is refused', TG_TABLE_NAME
      USING ERRCODE = 'restrict_violation';
  END IF;

  IF OLD.signature IS NOT NULL OR NEW.signature IS NULL OR NEW.signing_key_id IS NULL THEN
    RAISE EXCEPTION '% is append-only: a signature may be attached once and never changed', TG_TABLE_NAME
      USING ERRCODE = 'restrict_violation';
  END IF;

  IF (to_jsonb(OLD) - ARRAY['signature', 'signing_key_id', 'updated_at'])
     IS DISTINCT FROM
     (to_jsonb(NEW) - ARRAY['signature', 'signing_key_id', 'updated_at']) THEN
    RAISE EXCEPTION '% is append-only: only the signature may change', TG_TABLE_NAME
      USING ERRCODE = 'restrict_violation';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION audit_signed_once() IS
  'BEFORE UPDATE OR DELETE on the signed ledger tables: refuses DELETE, and allows one signature attachment and nothing else.';

-- The guard for the signing key registry: no update and no delete at all. The
-- same function refuses TRUNCATE on every ledger table at statement level.

CREATE OR REPLACE FUNCTION audit_append_only()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  RAISE EXCEPTION '% is append-only: % is refused', TG_TABLE_NAME, TG_OP
    USING ERRCODE = 'restrict_violation';
  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION audit_append_only() IS
  'Refuses UPDATE, DELETE and TRUNCATE on the ledger tables that take no change at all.';

-- Row level security. Every policy is TO kd_app, as in 2.7. The ledger tables
-- take SELECT policies only, and there is no write policy for any role.

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_merkle_roots ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_merkle_roots FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_signing_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_signing_keys FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_audit_read ON audit_logs
  AS PERMISSIVE FOR SELECT TO kd_app
  USING (company_id = current_company_id());

CREATE POLICY platform_audit_read ON audit_logs
  AS PERMISSIVE FOR SELECT TO kd_app
  USING (company_id IS NULL AND current_user_id() IS NOT NULL AND current_role_name() = 'super_admin');

CREATE POLICY platform_audit_read ON audit_merkle_roots
  AS PERMISSIVE FOR SELECT TO kd_app
  USING (company_id IS NULL AND current_user_id() IS NOT NULL AND current_role_name() = 'super_admin');

CREATE POLICY platform_audit_read ON audit_signing_keys
  AS PERMISSIVE FOR SELECT TO kd_app
  USING (company_id IS NULL AND current_user_id() IS NOT NULL AND current_role_name() = 'super_admin');

-- Grants. Reads only. Nothing is granted for writes, because every write goes
-- through a definer function, and nothing is granted for DELETE.

GRANT SELECT ON audit_logs, audit_merkle_roots, audit_signing_keys TO kd_app;

-- Triggers on the three ledger tables. The set_updated_at trigger is the 2.2
-- standard, and check 20 of the schema standards requires it on every table.

CREATE TRIGGER trg_audit_logs_set_updated_at
  BEFORE UPDATE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_audit_logs_chain
  BEFORE INSERT ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION audit_logs_chain();

CREATE TRIGGER trg_audit_logs_signed_once
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION audit_signed_once();

CREATE TRIGGER trg_audit_logs_no_truncate
  BEFORE TRUNCATE ON audit_logs
  FOR EACH STATEMENT EXECUTE FUNCTION audit_append_only();

CREATE TRIGGER trg_audit_merkle_roots_set_updated_at
  BEFORE UPDATE ON audit_merkle_roots
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_audit_merkle_roots_signed_once
  BEFORE UPDATE OR DELETE ON audit_merkle_roots
  FOR EACH ROW EXECUTE FUNCTION audit_signed_once();

CREATE TRIGGER trg_audit_merkle_roots_no_truncate
  BEFORE TRUNCATE ON audit_merkle_roots
  FOR EACH STATEMENT EXECUTE FUNCTION audit_append_only();

CREATE TRIGGER trg_audit_signing_keys_set_updated_at
  BEFORE UPDATE ON audit_signing_keys
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_audit_signing_keys_append_only
  BEFORE UPDATE OR DELETE ON audit_signing_keys
  FOR EACH ROW EXECUTE FUNCTION audit_append_only();

CREATE TRIGGER trg_audit_signing_keys_no_truncate
  BEFORE TRUNCATE ON audit_signing_keys
  FOR EACH STATEMENT EXECUTE FUNCTION audit_append_only();

SELECT assert_universal_columns('audit_signing_keys');
SELECT assert_universal_columns('audit_merkle_roots');
SELECT assert_universal_columns('audit_logs');
