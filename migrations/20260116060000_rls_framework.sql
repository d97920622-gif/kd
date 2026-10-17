-- path: migrations/20260116060000_rls_framework.sql
--
-- Sub-step 2.7, first half: the row level security framework.
--
-- THE CLAIMS CONTRACT. Every policy reads the caller's identity from one
-- transaction-local setting, `request.jwt.claims`, a JSON object. This is the
-- same setting Supabase's PostgREST fills from the verified JWT, so the policies
-- here run unchanged on Supabase and on this server. The keys are:
--
--   sub        the user id (uuid), read by current_user_id()
--   company_id the tenant the request is scoped to (uuid), read by
--              current_company_id()
--   app_role   the platform role of the caller (text such as super_admin),
--              read by current_role_name()
--
-- A missing or empty setting means an anonymous caller: every helper answers
-- null, and every policy that needs an identity refuses. A setting that is not
-- JSON, or a company_id that is not a uuid, raises an error: the database fails
-- closed rather than reading a half-formed identity as a tenant.
--
-- TRUST. The database trusts whichever server code sets the claims. The server
-- sets them once per transaction from the verified session (sub-step 3 and
-- step 4 wire that), and parameterised queries keep a request from setting them
-- itself. Step 15 audits the path that sets them.
--
-- THE ROLE. kd_app is the role an application request runs as. It is NOLOGIN
-- and NOBYPASSRLS: the application connects as a login role that is granted
-- kd_app, and SET ROLE moves the request onto kd_app. Policies and grants on
-- kd_app arrive in 20260116060100_rls_policies.sql, which also FORCEs row level
-- security, so the table owner is subject to the policies too. Only a role with
-- BYPASSRLS or a superuser sees past them: the migration and seed runners do,
-- and the isolation assertion switches to kd_app before it reads.
--
-- THE TWO FUNCTIONS THAT TEST THE RULES. rls_isolation_violations() reads the
-- live database and is run by `npm run db:assert`. rls_isolation_fuzz() writes
-- synthetic tenants, attacks them, and is run by `npm run db:fuzz`, whose
-- transaction always rolls back. Both are written here, in the migration that
-- owns the rules they test, so a later migration cannot change a rule without
-- the test that proves it.

CREATE OR REPLACE FUNCTION current_jwt_claim(p_name text)
RETURNS text
LANGUAGE sql
STABLE
PARALLEL SAFE
SET search_path = pg_catalog
AS $$
  SELECT NULLIF(NULLIF(current_setting('request.jwt.claims', true), ''), '')::jsonb ->> p_name
$$;

COMMENT ON FUNCTION current_jwt_claim(text) IS
  'Reads one key from the request.jwt.claims setting. Null when anonymous; raises when the setting is not JSON.';

CREATE OR REPLACE FUNCTION current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
PARALLEL SAFE
SET search_path = pg_catalog
AS $$
  SELECT NULLIF(public.current_jwt_claim('sub'), '')::uuid
$$;

COMMENT ON FUNCTION current_user_id() IS
  'The authenticated user id from the sub claim. Null for an anonymous caller.';

CREATE OR REPLACE FUNCTION current_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
PARALLEL SAFE
SET search_path = pg_catalog
AS $$
  SELECT NULLIF(public.current_jwt_claim('company_id'), '')::uuid
$$;

COMMENT ON FUNCTION current_company_id() IS
  'The tenant the request is scoped to, from the company_id claim. Null when the request is not scoped to a tenant.';

CREATE OR REPLACE FUNCTION current_role_name()
RETURNS text
LANGUAGE sql
STABLE
PARALLEL SAFE
SET search_path = pg_catalog
AS $$
  SELECT NULLIF(public.current_jwt_claim('app_role'), '')
$$;

COMMENT ON FUNCTION current_role_name() IS
  'The platform role of the caller from the app_role claim (super_admin, ceo, admin_staff). Null for a tenant user.';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'kd_app') THEN
    CREATE ROLE kd_app NOLOGIN NOBYPASSRLS;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO kd_app;

-- Counts the rows one SELECT returns to the current role. A role with no grant on
-- the table is refused with insufficient_privilege (42501); that refusal means
-- the role sees no rows, so it counts as zero. Every other error propagates, so a
-- real fault is never mistaken for isolation. The caller embeds its values with
-- format(%L), so this function takes no parameters.
CREATE OR REPLACE FUNCTION rls_visible_count(p_sql text)
RETURNS bigint
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_count bigint;
BEGIN
  EXECUTE p_sql INTO v_count;
  RETURN v_count;
EXCEPTION
  WHEN insufficient_privilege THEN
    RETURN 0;
END
$$;

COMMENT ON FUNCTION rls_visible_count(text) IS
  'Counts the rows a single SELECT returns to the current role. A missing grant counts as zero rows.';

-- The isolation assertion. It runs as kd_app with a company claim, then with a
-- user claim, and returns one row for every row a request can see that it must
-- not. It enumerates tenants and users before it switches role, because kd_app
-- cannot see them to list them.
CREATE OR REPLACE FUNCTION rls_isolation_violations()
RETURNS TABLE (rule text, object text, detail text)
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_saved_claims text := current_setting('request.jwt.claims', true);
  v_tables text[];
  v_company_tables text[];
  v_user_tables text[];
  v_companies uuid[];
  v_users uuid[];
  v_table text;
  v_company uuid;
  v_user uuid;
  v_count bigint;
  v_user_column text;
BEGIN
  SELECT coalesce(array_agg(c.relname::text ORDER BY c.relname), '{}')
    INTO v_tables
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r';

  SELECT coalesce(array_agg(c.relname::text ORDER BY c.relname), '{}')
    INTO v_company_tables
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'company_id' AND NOT a.attisdropped
    WHERE n.nspname = 'public' AND c.relkind = 'r';

  SELECT coalesce(array_agg(c.relname::text ORDER BY c.relname), '{}')
    INTO v_user_tables
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'user_id' AND NOT a.attisdropped
    WHERE n.nspname = 'public' AND c.relkind = 'r';

  SELECT coalesce(array_agg(id), '{}') INTO v_companies FROM public.companies;
  SELECT coalesce(array_agg(id), '{}') INTO v_users FROM public.user_profiles;

  SET ROLE kd_app;

  -- Anonymous: no claim at all. Every table must answer zero rows.
  PERFORM set_config('request.jwt.claims', '', true);
  FOREACH v_table IN ARRAY v_tables LOOP
    v_count := rls_visible_count(format('SELECT count(*) FROM public.%I', v_table));
    IF v_count > 0 THEN
      RETURN QUERY SELECT
        'anonymous_reads_rows'::text,
        v_table,
        format('%s row(s) are visible with no session', v_count);
    END IF;
  END LOOP;

  -- Tenant: a company claim and no user. Only that company's rows may appear.
  FOREACH v_company IN ARRAY v_companies LOOP
    PERFORM set_config(
      'request.jwt.claims',
      jsonb_build_object('company_id', v_company)::text,
      true
    );
    FOREACH v_table IN ARRAY v_company_tables LOOP
      v_count := rls_visible_count(format(
        'SELECT count(*) FROM public.%I WHERE company_id IS NOT NULL AND company_id <> %L',
        v_table,
        v_company
      ));
      IF v_count > 0 THEN
        RETURN QUERY SELECT
          'cross_tenant_row_visible'::text,
          v_table,
          format('%s row(s) of another tenant are visible to company %s', v_count, v_company);
      END IF;
    END LOOP;

    SELECT count(*) INTO v_count FROM public.companies WHERE id <> v_company;
    IF v_count > 0 THEN
      RETURN QUERY SELECT
        'cross_tenant_row_visible'::text,
        'companies'::text,
        format('%s other company row(s) are visible to company %s', v_count, v_company);
    END IF;
  END LOOP;

  -- User: a sub claim and no company. Only that user's own rows may appear.
  FOREACH v_user IN ARRAY v_users LOOP
    PERFORM set_config(
      'request.jwt.claims',
      jsonb_build_object('sub', v_user)::text,
      true
    );
    FOREACH v_table IN ARRAY v_user_tables LOOP
      v_count := rls_visible_count(format(
        'SELECT count(*) FROM public.%I WHERE user_id IS NOT NULL AND user_id <> %L',
        v_table,
        v_user
      ));
      IF v_count > 0 THEN
        RETURN QUERY SELECT
          'foreign_user_row_visible'::text,
          v_table,
          format('%s row(s) of another user are visible to user %s', v_count, v_user);
      END IF;
    END LOOP;

    SELECT count(*) INTO v_count FROM public.user_profiles WHERE id <> v_user;
    IF v_count > 0 THEN
      RETURN QUERY SELECT
        'foreign_user_row_visible'::text,
        'user_profiles'::text,
        format('%s other profile(s) are visible to user %s', v_count, v_user);
    END IF;
  END LOOP;

  PERFORM set_config('request.jwt.claims', coalesce(v_saved_claims, ''), true);
  RESET ROLE;
END
$$;

COMMENT ON FUNCTION rls_isolation_violations() IS
  'The live isolation assertion. Zero rows when an anonymous caller sees nothing, a tenant sees only its own rows, and a user sees only its own user-owned rows.';

-- The isolation fuzz. It runs in a read-write transaction that the runner always
-- rolls back, so it may create synthetic tenants, users and rows. It seeds two
-- tenants and a platform user, then attacks the tenant tables as one tenant
-- against the other: reads, in-place updates, moves in both directions, forged
-- inserts and deletes. Each attack must be refused by row level security or
-- must affect no row. A forged insert must be refused by the policy itself
-- (SQLSTATE 42501), so a constraint error cannot pass for isolation.
CREATE OR REPLACE FUNCTION rls_isolation_fuzz(p_rounds integer DEFAULT 200)
RETURNS TABLE (rule text, object text, detail text)
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_suffix text := substr(md5(random()::text), 1, 8);
  v_tenant_tables text[] := ARRAY[
    'companies', 'company_members', 'company_settings', 'invitations', 'roles',
    'role_permissions', 'user_roles', 'coupon_redemptions', 'entitlements',
    'subscriptions', 'feature_flags', 'devices', 'sessions'
  ];
  v_user_tables text[] := ARRAY['company_members', 'devices', 'sessions', 'platform_users', 'user_profiles'];
  v_user_columns text[] := ARRAY['user_id', 'user_id', 'user_id', 'user_id', 'id'];
  v_company uuid[];
  v_user uuid[];
  v_templates jsonb := '{}'::jsonb;
  v_plan uuid;
  v_plan_tier integer;
  v_coupon uuid;
  v_permission uuid;
  v_role uuid[];
  v_member uuid[];
  v_subscription uuid[];
  v_id uuid;
  v_row jsonb;
  v_table text;
  v_scope text;
  v_user_column text;
  v_is_company boolean;
  v_attacker integer;
  v_victim integer;
  v_op integer;
  v_index integer;
  v_count bigint;
  v_rows bigint;
  v_state text;
  v_message text;
  v_rule text;
  v_object text;
  v_detail text;
  v_round integer;
BEGIN
  PERFORM setseed(0.2026);

  -- Seed: two tenants, each with one owner, and one platform administrator.
  FOR v_index IN 1..2 LOOP
    INSERT INTO companies (name, slug, status)
      VALUES ('Fuzz tenant ' || v_index || ' ' || v_suffix, 'fuzz-' || v_index || '-' || v_suffix, 'active')
      RETURNING id INTO v_id;
    v_company[v_index] := v_id;

    INSERT INTO user_profiles (email, full_name, locale, status, email_verified_at)
      VALUES ('fuzz.owner.' || v_index || '.' || v_suffix || '@example.test', 'Fuzz Owner ' || v_index, 'en', 'active', now())
      RETURNING id INTO v_id;
    v_user[v_index] := v_id;

    INSERT INTO company_members (company_id, user_id, role, status, joined_at)
      VALUES (v_company[v_index], v_user[v_index], 'owner', 'active', now())
      RETURNING id INTO v_id;
    v_member[v_index] := v_id;

    INSERT INTO company_settings (company_id) VALUES (v_company[v_index]);

    INSERT INTO roles (company_id, role_key, name, rank, is_preset)
      VALUES (v_company[v_index], 'fuzz_role', 'Fuzz role', 1, false)
      RETURNING id INTO v_id;
    v_role[v_index] := v_id;

    INSERT INTO invitations (company_id, email, role, token_hash, status, expires_at, invited_by_user_id)
      VALUES (
        v_company[v_index],
        'fuzz.invitee.' || v_index || '.' || v_suffix || '@example.test',
        'staff',
        md5(random()::text) || md5(random()::text),
        'pending',
        now() + interval '7 days',
        v_user[v_index]
      );

    INSERT INTO devices (company_id, user_id, device_fingerprint_hash, status)
      VALUES (v_company[v_index], v_user[v_index], md5(random()::text) || md5(random()::text), 'pending');

    INSERT INTO sessions (company_id, user_id, session_token_hash, expires_at, last_seen_at)
      VALUES (
        v_company[v_index],
        v_user[v_index],
        md5(random()::text) || md5(random()::text),
        now() + interval '1 day',
        now()
      );
  END LOOP;

  INSERT INTO user_profiles (email, full_name, locale, status, email_verified_at)
    VALUES ('fuzz.platform.' || v_suffix || '@example.test', 'Fuzz Platform Admin', 'en', 'active', now())
    RETURNING id INTO v_id;
  v_user[3] := v_id;

  INSERT INTO platform_users (user_id, platform_role, status, granted_at)
    VALUES (v_user[3], 'admin_staff', 'active', now());

  INSERT INTO permissions (resource, action, code, category, is_critical)
    VALUES ('fuzz' || v_suffix, 'read', 'fuzz' || v_suffix || '.read', 'fuzz', false)
    RETURNING id INTO v_permission;

  SELECT coalesce(max(tier), 0) + 1 INTO v_plan_tier FROM public.plans;
  INSERT INTO plans (slug, name, tier, status, monthly_price, yearly_price, currency_code, trial_days)
    VALUES ('fuzz-' || v_suffix, 'Fuzz plan', v_plan_tier, 'draft', 0, 0, 'USD', 0)
    RETURNING id INTO v_plan;

  INSERT INTO coupons (code, discount_type, discount_value, currency_code, status, starts_at)
    VALUES ('FZ' || upper(v_suffix), 'percentage', 10, 'USD', 'active', now() - interval '1 day')
    RETURNING id INTO v_coupon;

  FOR v_index IN 1..2 LOOP
    INSERT INTO role_permissions (company_id, role_id, permission_id)
      VALUES (v_company[v_index], v_role[v_index], v_permission);

    INSERT INTO user_roles (company_id, company_member_id, role_id, assigned_at)
      VALUES (v_company[v_index], v_member[v_index], v_role[v_index], now());

    INSERT INTO subscriptions (
      company_id, plan_id, status, billing_interval, price_amount, currency_code, seats,
      current_period_start, current_period_end, cancel_at_period_end, failed_payment_count
    ) VALUES (
      v_company[v_index], v_plan, 'active', 'month', 0, 'USD', 1,
      now(), now() + interval '1 month', false, 0
    )
    RETURNING id INTO v_id;
    v_subscription[v_index] := v_id;

    INSERT INTO coupon_redemptions (coupon_id, subscription_id, company_id, discount_amount, redeemed_at)
      VALUES (v_coupon, v_subscription[v_index], v_company[v_index], 1, now());

    INSERT INTO entitlements (company_id, subscription_id, feature_key, is_enabled, source, computed_at)
      VALUES (v_company[v_index], v_subscription[v_index], 'fuzz_feature', true, 'plan', now());

    INSERT INTO feature_flags (company_id, flag_key, description, is_enabled, rollout_percentage)
      VALUES (
        v_company[v_index],
        'fuzz_flag_' || v_suffix,
        'Fuzz tenant override row for the isolation test',
        false,
        0
      );
  END LOOP;

  -- Templates: one real row per table per tenant, so a forged insert is an
  -- exact copy of the victim's row with only the primary key changed.
  FOR v_index IN 1..2 LOOP
    FOREACH v_table IN ARRAY v_tenant_tables LOOP
      IF v_table = 'companies' THEN
        CONTINUE;
      END IF;
      EXECUTE format('SELECT to_jsonb(x) FROM public.%I x WHERE x.company_id = $1 LIMIT 1', v_table)
        INTO v_row USING v_company[v_index];
      IF v_row IS NULL THEN
        RETURN QUERY SELECT
          'fuzz_seed_missing'::text,
          v_table,
          format('no seeded row for tenant %s; the fuzz cannot test this table', v_index);
      ELSE
        v_templates := v_templates || jsonb_build_object(v_table || ':' || v_index, v_row);
      END IF;
    END LOOP;
  END LOOP;

  SET ROLE kd_app;

  -- Anonymous attacks: no claim at all, over every table in the database.
  PERFORM set_config('request.jwt.claims', '', true);
  FOR v_table IN
    SELECT c.relname::text FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
  LOOP
    v_count := rls_visible_count(format('SELECT count(*) FROM public.%I', v_table));
    IF v_count > 0 THEN
      RETURN QUERY SELECT
        'anonymous_reads_rows'::text,
        v_table,
        format('%s row(s) are visible with no session', v_count);
    END IF;
  END LOOP;

  -- Tenant attacks: a random tenant attacks the other one, a random table, a
  -- random operation. setseed makes the sequence the same on every run.
  FOR v_round IN 1..p_rounds LOOP
    IF v_round <= 2 * 6 * array_length(v_tenant_tables, 1) THEN
      -- The sweep: every table, every operation, and both attack directions, once.
      -- It does not depend on random sampling, so no pair can go untested.
      v_attacker := 1 + ((v_round - 1) / (6 * array_length(v_tenant_tables, 1)))::integer;
      v_index := 1 + (((v_round - 1) / 6) % array_length(v_tenant_tables, 1))::integer;
      v_op := 1 + ((v_round - 1) % 6)::integer;
    ELSE
      v_attacker := 1 + floor(random() * 2)::integer;
      v_index := 1 + floor(random() * array_length(v_tenant_tables, 1))::integer;
      v_op := 1 + floor(random() * 6)::integer;
    END IF;
    v_victim := 3 - v_attacker;
    v_table := v_tenant_tables[v_index];
    v_is_company := v_table = 'companies';
    v_scope := CASE WHEN v_is_company THEN 'id' ELSE 'company_id' END;
    IF v_is_company AND v_op = 5 THEN
      v_op := 1;
    END IF;

    PERFORM set_config(
      'request.jwt.claims',
      jsonb_build_object('company_id', v_company[v_attacker], 'sub', v_user[v_attacker])::text,
      true
    );

    v_state := NULL;
    v_message := NULL;
    v_rows := 0;
    v_count := 0;
    BEGIN
      CASE v_op
        WHEN 1 THEN
          EXECUTE format('SELECT count(*) FROM public.%I WHERE %I = $1', v_table, v_scope)
            INTO v_count USING v_company[v_victim];
        WHEN 2 THEN
          EXECUTE format('UPDATE public.%I SET updated_at = now() WHERE %I = $1', v_table, v_scope)
            USING v_company[v_victim];
          GET DIAGNOSTICS v_rows = ROW_COUNT;
        WHEN 3 THEN
          EXECUTE format('UPDATE public.%I SET %I = $2 WHERE %I = $1', v_table, v_scope, v_scope)
            USING v_company[v_victim], v_company[v_attacker];
          GET DIAGNOSTICS v_rows = ROW_COUNT;
        WHEN 4 THEN
          EXECUTE format('UPDATE public.%I SET %I = $1 WHERE %I = $2', v_table, v_scope, v_scope)
            USING v_company[v_victim], v_company[v_attacker];
          GET DIAGNOSTICS v_rows = ROW_COUNT;
        WHEN 5 THEN
          v_row := (v_templates -> (v_table || ':' || v_victim::text))
            || jsonb_build_object('id', uuid_generate_v7());
          EXECUTE format(
            'INSERT INTO public.%I SELECT (jsonb_populate_record(NULL::public.%I, $1)).*',
            v_table,
            v_table
          ) USING v_row;
          GET DIAGNOSTICS v_rows = ROW_COUNT;
        ELSE
          EXECUTE format('DELETE FROM public.%I WHERE %I = $1', v_table, v_scope)
            USING v_company[v_victim];
          GET DIAGNOSTICS v_rows = ROW_COUNT;
      END CASE;
    EXCEPTION WHEN OTHERS THEN
      v_state := SQLSTATE;
      v_message := SQLERRM;
    END;

    v_rule := NULL;
    IF v_op = 1 THEN
      IF v_state IS NOT NULL THEN
        v_rule := 'fuzz_unexpected_error';
      ELSIF v_count > 0 THEN
        v_rule := 'cross_tenant_read';
      END IF;
    ELSIF v_op IN (2, 3) THEN
      IF v_state IS NOT NULL THEN
        v_rule := 'fuzz_unexpected_error';
      ELSIF v_rows > 0 THEN
        v_rule := 'cross_tenant_write';
      END IF;
    ELSIF v_op = 4 THEN
      IF v_state IS NOT NULL AND v_state <> '42501' THEN
        v_rule := 'fuzz_unexpected_error';
      ELSIF v_state IS NULL AND v_rows > 0 THEN
        v_rule := 'forged_row_accepted';
      END IF;
    ELSIF v_op = 5 THEN
      IF v_state IS NULL THEN
        v_rule := 'forged_insert_accepted';
      ELSIF v_state <> '42501' THEN
        v_rule := 'forged_insert_refused_by_other_rule';
      END IF;
    ELSE
      IF v_state IS NOT NULL AND v_state <> '42501' THEN
        v_rule := 'fuzz_unexpected_error';
      ELSIF v_state IS NULL AND v_rows > 0 THEN
        v_rule := 'cross_tenant_delete';
      END IF;
    END IF;

    IF v_rule IS NOT NULL THEN
      RETURN QUERY SELECT
        v_rule,
        v_table,
        format(
          'round %s, operation %s, attacker tenant %s: sqlstate %s, rows %s, count %s, %s',
          v_round, v_op, v_attacker, coalesce(v_state, 'none'), v_rows, v_count, coalesce(v_message, '')
        );
    END IF;
  END LOOP;

  -- User attacks: each user reads each other user's user-owned rows with no
  -- company claim. Only the user's own rows may appear.
  FOR v_attacker IN 1..3 LOOP
    FOR v_victim IN 1..3 LOOP
      IF v_victim = v_attacker THEN
        CONTINUE;
      END IF;
      PERFORM set_config(
        'request.jwt.claims',
        jsonb_build_object('sub', v_user[v_attacker])::text,
        true
      );
      FOR v_index IN 1..array_length(v_user_tables, 1) LOOP
        v_table := v_user_tables[v_index];
        v_user_column := v_user_columns[v_index];
        v_state := NULL;
        BEGIN
          v_count := rls_visible_count(format(
            'SELECT count(*) FROM public.%I WHERE %I = %L',
            v_table,
            v_user_column,
            v_user[v_victim]
          ));
        EXCEPTION WHEN OTHERS THEN
          v_state := SQLSTATE;
        END;
        IF v_state IS NOT NULL THEN
          RETURN QUERY SELECT
            'fuzz_unexpected_error'::text,
            v_table,
            format('user read failed with sqlstate %s', v_state);
        ELSIF v_count > 0 THEN
          RETURN QUERY SELECT
            'cross_user_read'::text,
            v_table,
            format('%s row(s) of user %s are visible to user %s', v_count, v_victim, v_attacker);
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;

  RESET ROLE;
END
$$;

COMMENT ON FUNCTION rls_isolation_fuzz(integer) IS
  'Seeds two tenants and attacks them as each other. The first 156 rounds sweep every tenant table, every operation and both directions once; any later rounds are seeded random. Then user-owned rows are read across users. Zero rows means every attack was refused. The caller must roll the transaction back.';
