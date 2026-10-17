-- path: migrations/20260116020100_tenancy_membership.sql
--
-- Sub-step 2.3, second half: membership, invitations, devices and sessions.
--
--   company_members  who belongs to which tenant, at the tenant role level
--                    (owner or staff). The permission presets a staff member
--                    holds are sub-step 2.4's user_roles, not this column.
--   invitations      a pending email invitation: hashed token, seven day
--                    expiry (FEATURE_LIST 591), one pending invite per email
--                    per tenant.
--   devices          a known device for a person. The device centre that
--                    trusts, names and revokes devices is step 3.
--   sessions         the session registry's storage. Listing, revoking,
--                    freezing and rotating sessions is step 3, segment 3D.
--
-- This file only stores the state; it never implements the flow. That is the
-- boundary Revision 2 draws for 3.17 and 3.18, and the same rule sub-step 2.4
-- follows for the login lock: the table here, the behaviour there.
--
-- Devices and sessions carry a nullable company_id because a platform staff
-- member (platform_users) acts outside any tenant. Every tenant member's row
-- carries the acting tenant, and the 2.7 policy scopes it.

CREATE TABLE IF NOT EXISTS company_members (
  id uuid NOT NULL DEFAULT uuid_generate_v7(),
  company_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version integer NOT NULL DEFAULT 0,

  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'staff',
  status text NOT NULL DEFAULT 'invited',
  joined_at timestamptz,
  invited_by_user_id uuid,

  CONSTRAINT pk_company_members PRIMARY KEY (id),
  CONSTRAINT fk_company_members_companies
    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE RESTRICT,
  CONSTRAINT fk_company_members_user_profiles
    FOREIGN KEY (user_id) REFERENCES user_profiles (id) ON DELETE RESTRICT,
  CONSTRAINT fk_company_members_invited_by_user_profiles
    FOREIGN KEY (invited_by_user_id) REFERENCES user_profiles (id) ON DELETE RESTRICT,
  CONSTRAINT chk_company_members_role_allowed CHECK (role IN ('owner', 'staff')),
  CONSTRAINT chk_company_members_status_allowed
    CHECK (status IN ('invited', 'active', 'suspended', 'removed')),
  CONSTRAINT chk_company_members_joined_at_consistent
    CHECK (
      (status = 'invited' AND joined_at IS NULL)
      OR (status <> 'invited' AND joined_at IS NOT NULL)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_company_members_company_id_user_id
  ON company_members (company_id, user_id)
  WHERE deleted_at IS NULL;

-- Exactly one active owner per tenant. Ownership transfer moves the old owner
-- to staff in the same transaction that promotes the new one.
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_members_company_id_owner
  ON company_members (company_id)
  WHERE role = 'owner' AND status = 'active' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_company_members_company_id_created_at
  ON company_members (company_id, created_at);

CREATE INDEX IF NOT EXISTS idx_company_members_user_id
  ON company_members (user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_company_members_invited_by_user_id
  ON company_members (invited_by_user_id, created_at);

COMMENT ON TABLE company_members IS
  'Membership of a person in a tenant, at the owner or staff level. Permission presets live in user_roles (2.4).';

CREATE TABLE IF NOT EXISTS invitations (
  id uuid NOT NULL DEFAULT uuid_generate_v7(),
  company_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version integer NOT NULL DEFAULT 0,

  email text NOT NULL,
  role text NOT NULL DEFAULT 'staff',
  token_hash text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  revoked_at timestamptz,
  invited_by_user_id uuid NOT NULL,

  CONSTRAINT pk_invitations PRIMARY KEY (id),
  CONSTRAINT fk_invitations_companies
    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE RESTRICT,
  CONSTRAINT fk_invitations_invited_by_user_profiles
    FOREIGN KEY (invited_by_user_id) REFERENCES user_profiles (id) ON DELETE RESTRICT,
  CONSTRAINT chk_invitations_email_format
    CHECK (email = lower(email) AND email ~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'),
  CONSTRAINT chk_invitations_role_allowed CHECK (role IN ('owner', 'staff')),
  CONSTRAINT chk_invitations_status_allowed
    CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  CONSTRAINT chk_invitations_token_hash_format CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT chk_invitations_expiry_after_creation CHECK (expires_at > created_at),
  CONSTRAINT chk_invitations_state_consistent
    CHECK (
      (status = 'pending' AND accepted_at IS NULL AND revoked_at IS NULL)
      OR (status = 'accepted' AND accepted_at IS NOT NULL AND revoked_at IS NULL)
      OR (status = 'revoked' AND revoked_at IS NOT NULL AND accepted_at IS NULL)
      OR (status = 'expired' AND accepted_at IS NULL AND revoked_at IS NULL)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_invitations_token_hash
  ON invitations (token_hash)
  WHERE deleted_at IS NULL;

-- One pending invitation per email per tenant. A resend reuses the row and its
-- expiry (FEATURE_LIST 592); a new invite after a cancel is a new row, so the
-- revoked one no longer holds the address.
CREATE UNIQUE INDEX IF NOT EXISTS idx_invitations_company_id_email_pending
  ON invitations (company_id, email)
  WHERE status = 'pending' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_invitations_company_id_created_at
  ON invitations (company_id, created_at);

CREATE INDEX IF NOT EXISTS idx_invitations_invited_by_user_id
  ON invitations (invited_by_user_id, created_at);

COMMENT ON TABLE invitations IS
  'A pending staff invitation: SHA-256 token hash, seven day default expiry, one pending row per email per tenant.';

CREATE TABLE IF NOT EXISTS devices (
  id uuid NOT NULL DEFAULT uuid_generate_v7(),
  company_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version integer NOT NULL DEFAULT 0,

  user_id uuid NOT NULL,
  device_fingerprint_hash text NOT NULL,
  name text,
  platform text,
  status text NOT NULL DEFAULT 'pending',
  ip_address inet,
  user_agent text,
  trusted_at timestamptz,
  last_seen_at timestamptz,
  revoked_at timestamptz,

  CONSTRAINT pk_devices PRIMARY KEY (id),
  CONSTRAINT fk_devices_companies
    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE RESTRICT,
  CONSTRAINT fk_devices_user_profiles
    FOREIGN KEY (user_id) REFERENCES user_profiles (id) ON DELETE RESTRICT,
  CONSTRAINT chk_devices_fingerprint_format CHECK (device_fingerprint_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT chk_devices_name_length CHECK (name IS NULL OR char_length(btrim(name)) BETWEEN 1 AND 80),
  CONSTRAINT chk_devices_platform_allowed
    CHECK (platform IS NULL OR platform IN ('web', 'ios', 'android', 'desktop', 'other')),
  CONSTRAINT chk_devices_status_allowed CHECK (status IN ('pending', 'trusted', 'revoked')),
  CONSTRAINT chk_devices_user_agent_length CHECK (user_agent IS NULL OR char_length(user_agent) <= 512),
  CONSTRAINT chk_devices_trust_state_consistent
    CHECK (
      (status = 'pending' AND trusted_at IS NULL AND revoked_at IS NULL)
      OR (status = 'trusted' AND trusted_at IS NOT NULL AND revoked_at IS NULL)
      OR (status = 'revoked' AND revoked_at IS NOT NULL)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_devices_user_id_fingerprint
  ON devices (user_id, device_fingerprint_hash)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_devices_company_id_created_at
  ON devices (company_id, created_at);

COMMENT ON TABLE devices IS
  'A known device for a person. Trust, naming and revocation are step 3 (3.17); this table is the storage.';

CREATE TABLE IF NOT EXISTS sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v7(),
  company_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version integer NOT NULL DEFAULT 0,

  user_id uuid NOT NULL,
  device_id uuid,
  session_token_hash text NOT NULL,
  ip_address inet,
  user_agent text,
  expires_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  revoked_reason text,

  CONSTRAINT pk_sessions PRIMARY KEY (id),
  CONSTRAINT fk_sessions_companies
    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE RESTRICT,
  CONSTRAINT fk_sessions_user_profiles
    FOREIGN KEY (user_id) REFERENCES user_profiles (id) ON DELETE RESTRICT,
  CONSTRAINT fk_sessions_devices
    FOREIGN KEY (device_id) REFERENCES devices (id) ON DELETE RESTRICT,
  CONSTRAINT chk_sessions_token_hash_format CHECK (session_token_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT chk_sessions_user_agent_length CHECK (user_agent IS NULL OR char_length(user_agent) <= 512),
  CONSTRAINT chk_sessions_expiry_after_creation CHECK (expires_at > created_at),
  CONSTRAINT chk_sessions_revocation_consistent
    CHECK (
      (revoked_at IS NULL AND revoked_reason IS NULL)
      OR (revoked_at IS NOT NULL AND revoked_reason IS NOT NULL)
    ),
  CONSTRAINT chk_sessions_revoked_reason_allowed
    CHECK (
      revoked_reason IS NULL
      OR revoked_reason IN (
        'logout', 'logout_all', 'password_change', 'admin_revoke',
        'idle_timeout', 'suspicious_activity', 'account_freeze'
      )
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_session_token_hash
  ON sessions (session_token_hash)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_company_id_created_at
  ON sessions (company_id, created_at);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id
  ON sessions (user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_sessions_device_id
  ON sessions (device_id, created_at);

COMMENT ON TABLE sessions IS
  'The session registry storage: hashed token, expiry, revocation. Listing, revoking and freeze are step 3 (3.18).';

DROP TRIGGER IF EXISTS trg_company_members_set_updated_at ON company_members;

CREATE TRIGGER trg_company_members_set_updated_at
  BEFORE UPDATE ON company_members
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_invitations_set_updated_at ON invitations;

CREATE TRIGGER trg_invitations_set_updated_at
  BEFORE UPDATE ON invitations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_devices_set_updated_at ON devices;

CREATE TRIGGER trg_devices_set_updated_at
  BEFORE UPDATE ON devices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_sessions_set_updated_at ON sessions;

CREATE TRIGGER trg_sessions_set_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

SELECT assert_universal_columns('company_members');

SELECT assert_universal_columns('invitations');

SELECT assert_universal_columns('devices');

SELECT assert_universal_columns('sessions');
