-- path: migrations/20260116030000_access_tables.sql
--
-- Sub-step 2.4: the access tables. Roles, the permission catalog, the two join
-- tables, and the storage for login attempts and the login lock.
--
--   roles             a tenant's staff role: one of the five presets
--                     (sales, accounts, support, manager, viewer) or a custom
--                     role the owner created (FEATURE_LIST 602, 603).
--   permissions       the platform catalog of resource dot action codes
--                     (FEATURE_LIST 604). Platform-level reference data:
--                     company_id is null and a named check enforces it.
--   role_permissions  which codes a role grants.
--   user_roles        which roles a member holds.
--   login_attempts    every login attempt, for the audit trail and the
--                     velocity rule (FEATURE_LIST 449, 442).
--   login_lock_state  the brute-force lock's state only. The two-failure
--                     threshold, the 60 minute lock and the exponential
--                     backoff are step 3 (FEATURE_LIST 440, 441); this table
--                     is what survives a restart so the flow can read it.
--
-- TWO TENANCY INVARIANTS IN THE SCHEMA, NOT IN A SERVICE:
--
-- 1. Composite foreign keys. `role_permissions` and `user_roles` reference
--    `roles (id, company_id)` and `user_roles` references
--    `company_members (id, company_id)`, so a row cannot attach a role or a
--    member that belongs to a different tenant. The 2.7 policy then only has
--    to scope by company_id; it does not have to police an inconsistent join.
-- 2. The tenant root rule from 2.3 is unchanged: every tenant row carries a
--    NOT NULL company_id, the platform catalog carries null.
--
-- WHAT IS NOT HERE. The permission OVERRIDE of FEATURE_LIST 606 and the
-- permission-inheritance engine of 605 are step 4's permission matrix, its
-- gate ("permission matrix SQL assertion passes") and its screen. The audit
-- of who changed a permission (607) is written by 2.8's audit trigger, which
-- attaches to these tables like every other.
--
-- RLS arrives in 2.7 for every table; audit triggers arrive in 2.8.

CREATE TABLE IF NOT EXISTS roles (
  id uuid NOT NULL DEFAULT uuid_generate_v7(),
  company_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version integer NOT NULL DEFAULT 0,

  role_key text NOT NULL,
  name text NOT NULL,
  description text,
  is_preset boolean NOT NULL DEFAULT false,
  rank smallint NOT NULL DEFAULT 100,
  created_by_user_id uuid,

  CONSTRAINT pk_roles PRIMARY KEY (id),
  CONSTRAINT fk_roles_companies
    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE RESTRICT,
  CONSTRAINT fk_roles_created_by_user_profiles
    FOREIGN KEY (created_by_user_id) REFERENCES user_profiles (id) ON DELETE RESTRICT,
  CONSTRAINT chk_roles_role_key_format
    CHECK (role_key ~ '^[a-z][a-z0-9_]{1,31}$'),
  CONSTRAINT chk_roles_name_length CHECK (char_length(btrim(name)) BETWEEN 2 AND 60),
  CONSTRAINT chk_roles_description_length
    CHECK (description IS NULL OR char_length(description) <= 400),
  CONSTRAINT chk_roles_rank_range CHECK (rank BETWEEN 0 AND 999)
);

-- A role key is unique inside one tenant while the row is live.
CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_company_id_role_key
  ON roles (company_id, role_key)
  WHERE deleted_at IS NULL;

-- The composite target the two join tables reference.
CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_id_company_id
  ON roles (id, company_id);

CREATE INDEX IF NOT EXISTS idx_roles_company_id_created_at
  ON roles (company_id, created_at);

CREATE INDEX IF NOT EXISTS idx_roles_created_by_user_id
  ON roles (created_by_user_id, created_at);

COMMENT ON TABLE roles IS
  'A tenant staff role: a preset or a custom role. The permission presets and the matrix engine are step 4.';

CREATE TABLE IF NOT EXISTS permissions (
  id uuid NOT NULL DEFAULT uuid_generate_v7(),
  company_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version integer NOT NULL DEFAULT 0,

  code text NOT NULL,
  resource text NOT NULL,
  action text NOT NULL,
  category text NOT NULL,
  description text,
  is_critical boolean NOT NULL DEFAULT false,

  CONSTRAINT pk_permissions PRIMARY KEY (id),
  CONSTRAINT chk_permissions_company_id_absent CHECK (company_id IS NULL),
  CONSTRAINT chk_permissions_code_matches_parts CHECK (code = resource || '.' || action),
  CONSTRAINT chk_permissions_resource_format CHECK (resource ~ '^[a-z][a-z0-9_]{1,31}$'),
  CONSTRAINT chk_permissions_action_format CHECK (action ~ '^[a-z][a-z0-9_]{1,31}$'),
  CONSTRAINT chk_permissions_code_format
    CHECK (code ~ '^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$'),
  CONSTRAINT chk_permissions_category_format CHECK (category ~ '^[a-z][a-z0-9_]{1,31}$'),
  CONSTRAINT chk_permissions_description_length
    CHECK (description IS NULL OR char_length(description) <= 200)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_permissions_code
  ON permissions (code)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_permissions_company_id_created_at
  ON permissions (company_id, created_at);

CREATE INDEX IF NOT EXISTS idx_permissions_category_resource
  ON permissions (category, resource, action);

COMMENT ON TABLE permissions IS
  'The platform permission catalog, one row per resource.action code. Seeded in 2.14; the matrix is step 4.';

CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid NOT NULL DEFAULT uuid_generate_v7(),
  company_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version integer NOT NULL DEFAULT 0,

  role_id uuid NOT NULL,
  permission_id uuid NOT NULL,
  granted_by_user_id uuid,

  CONSTRAINT pk_role_permissions PRIMARY KEY (id),
  CONSTRAINT fk_role_permissions_roles
    FOREIGN KEY (role_id, company_id) REFERENCES roles (id, company_id) ON DELETE RESTRICT,
  CONSTRAINT fk_role_permissions_permissions
    FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE RESTRICT,
  CONSTRAINT fk_role_permissions_companies
    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE RESTRICT,
  CONSTRAINT fk_role_permissions_granted_by_user_profiles
    FOREIGN KEY (granted_by_user_id) REFERENCES user_profiles (id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_role_permissions_role_id_permission_id
  ON role_permissions (role_id, permission_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_role_permissions_company_id_created_at
  ON role_permissions (company_id, created_at);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id_company_id
  ON role_permissions (role_id, company_id);

CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id
  ON role_permissions (permission_id, created_at);

CREATE INDEX IF NOT EXISTS idx_role_permissions_granted_by_user_id
  ON role_permissions (granted_by_user_id, created_at);

COMMENT ON TABLE role_permissions IS
  'Which permission codes a role grants, scoped to the role''s tenant by a composite foreign key.';

-- The composite target user_roles references. id is already unique alone; the
-- pair index is what a composite foreign key requires, and it must exist
-- before the table that points at it.
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_members_id_company_id
  ON company_members (id, company_id);

CREATE TABLE IF NOT EXISTS user_roles (
  id uuid NOT NULL DEFAULT uuid_generate_v7(),
  company_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version integer NOT NULL DEFAULT 0,

  company_member_id uuid NOT NULL,
  role_id uuid NOT NULL,
  granted_by_user_id uuid,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,

  CONSTRAINT pk_user_roles PRIMARY KEY (id),
  CONSTRAINT fk_user_roles_company_members
    FOREIGN KEY (company_member_id, company_id)
    REFERENCES company_members (id, company_id) ON DELETE RESTRICT,
  CONSTRAINT fk_user_roles_roles
    FOREIGN KEY (role_id, company_id) REFERENCES roles (id, company_id) ON DELETE RESTRICT,
  CONSTRAINT fk_user_roles_companies
    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE RESTRICT,
  CONSTRAINT fk_user_roles_granted_by_user_profiles
    FOREIGN KEY (granted_by_user_id) REFERENCES user_profiles (id) ON DELETE RESTRICT,
  CONSTRAINT chk_user_roles_expiry_after_assignment
    CHECK (expires_at IS NULL OR expires_at > assigned_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_company_member_id_role_id
  ON user_roles (company_member_id, role_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_roles_company_id_created_at
  ON user_roles (company_id, created_at);

CREATE INDEX IF NOT EXISTS idx_user_roles_company_member_id_company_id
  ON user_roles (company_member_id, company_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_role_id_company_id
  ON user_roles (role_id, company_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_granted_by_user_id
  ON user_roles (granted_by_user_id, created_at);

COMMENT ON TABLE user_roles IS
  'The roles a tenant member holds. expires_at carries the just-in-time access expiry of step 4; the engine is step 4.';

CREATE TABLE IF NOT EXISTS login_attempts (
  id uuid NOT NULL DEFAULT uuid_generate_v7(),
  company_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version integer NOT NULL DEFAULT 0,

  user_id uuid,
  email_hash text NOT NULL,
  outcome text NOT NULL,
  ip_address inet,
  user_agent text,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  correlation_id uuid NOT NULL DEFAULT gen_random_uuid(),

  CONSTRAINT pk_login_attempts PRIMARY KEY (id),
  CONSTRAINT fk_login_attempts_companies
    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE RESTRICT,
  CONSTRAINT fk_login_attempts_user_profiles
    FOREIGN KEY (user_id) REFERENCES user_profiles (id) ON DELETE RESTRICT,
  CONSTRAINT chk_login_attempts_email_hash_format CHECK (email_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT chk_login_attempts_outcome_allowed
    CHECK (outcome IN ('success', 'bad_password', 'unknown_account', 'locked', 'mfa_failed', 'blocked')),
  CONSTRAINT chk_login_attempts_known_account_on_success
    CHECK (outcome <> 'success' OR user_id IS NOT NULL),
  CONSTRAINT chk_login_attempts_user_agent_length
    CHECK (user_agent IS NULL OR char_length(user_agent) <= 512)
);

-- One row per request: a retried handler cannot record the same attempt twice.
CREATE UNIQUE INDEX IF NOT EXISTS idx_login_attempts_correlation_id
  ON login_attempts (correlation_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_login_attempts_company_id_created_at
  ON login_attempts (company_id, created_at);

-- The velocity rule reads this index (attempts per email per hour).
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_hash_attempted_at
  ON login_attempts (email_hash, attempted_at);

-- The IP rule reads this one (FEATURE_LIST 443).
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_address_attempted_at
  ON login_attempts (ip_address, attempted_at);

CREATE INDEX IF NOT EXISTS idx_login_attempts_user_id
  ON login_attempts (user_id, created_at);

COMMENT ON TABLE login_attempts IS
  'Every login attempt with a hashed email, the outcome and the correlation id. The email is never stored in clear here.';

CREATE TABLE IF NOT EXISTS login_lock_state (
  id uuid NOT NULL DEFAULT uuid_generate_v7(),
  company_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version integer NOT NULL DEFAULT 0,

  user_id uuid,
  email_hash text NOT NULL,
  failed_attempts smallint NOT NULL DEFAULT 0,
  lock_level smallint NOT NULL DEFAULT 0,
  first_failed_at timestamptz,
  last_failed_at timestamptz,
  locked_until timestamptz,
  lock_reason text,

  CONSTRAINT pk_login_lock_state PRIMARY KEY (id),
  CONSTRAINT fk_login_lock_state_companies
    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE RESTRICT,
  CONSTRAINT fk_login_lock_state_user_profiles
    FOREIGN KEY (user_id) REFERENCES user_profiles (id) ON DELETE RESTRICT,
  CONSTRAINT chk_login_lock_state_email_hash_format CHECK (email_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT chk_login_lock_state_failed_attempts_range
    CHECK (failed_attempts BETWEEN 0 AND 1000),
  CONSTRAINT chk_login_lock_state_lock_level_range CHECK (lock_level BETWEEN 0 AND 20),
  CONSTRAINT chk_login_lock_state_reason_allowed
    CHECK (
      lock_reason IS NULL
      OR lock_reason IN ('brute_force', 'velocity', 'suspicious_activity', 'admin_lock')
    ),
  CONSTRAINT chk_login_lock_state_lock_consistent
    CHECK (
      (locked_until IS NULL AND lock_reason IS NULL)
      OR (locked_until IS NOT NULL AND lock_reason IS NOT NULL)
    ),
  CONSTRAINT chk_login_lock_state_lock_after_last_failure
    CHECK (locked_until IS NULL OR last_failed_at IS NULL OR locked_until > last_failed_at),
  CONSTRAINT chk_login_lock_state_first_before_last
    CHECK (
      first_failed_at IS NULL
      OR last_failed_at IS NULL
      OR last_failed_at >= first_failed_at
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_login_lock_state_email_hash
  ON login_lock_state (email_hash)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_login_lock_state_company_id_created_at
  ON login_lock_state (company_id, created_at);

CREATE INDEX IF NOT EXISTS idx_login_lock_state_user_id
  ON login_lock_state (user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_login_lock_state_locked_until
  ON login_lock_state (locked_until)
  WHERE locked_until IS NOT NULL;

COMMENT ON TABLE login_lock_state IS
  'Storage for the login lock: counters, the backoff level and the locked-until instant. The lock logic is step 3.';

DROP TRIGGER IF EXISTS trg_roles_set_updated_at ON roles;

CREATE TRIGGER trg_roles_set_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_permissions_set_updated_at ON permissions;

CREATE TRIGGER trg_permissions_set_updated_at
  BEFORE UPDATE ON permissions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_role_permissions_set_updated_at ON role_permissions;

CREATE TRIGGER trg_role_permissions_set_updated_at
  BEFORE UPDATE ON role_permissions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_user_roles_set_updated_at ON user_roles;

CREATE TRIGGER trg_user_roles_set_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_login_attempts_set_updated_at ON login_attempts;

CREATE TRIGGER trg_login_attempts_set_updated_at
  BEFORE UPDATE ON login_attempts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_login_lock_state_set_updated_at ON login_lock_state;

CREATE TRIGGER trg_login_lock_state_set_updated_at
  BEFORE UPDATE ON login_lock_state
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

SELECT assert_universal_columns('roles');

SELECT assert_universal_columns('permissions');

SELECT assert_universal_columns('role_permissions');

SELECT assert_universal_columns('user_roles');

SELECT assert_universal_columns('login_attempts');

SELECT assert_universal_columns('login_lock_state');
