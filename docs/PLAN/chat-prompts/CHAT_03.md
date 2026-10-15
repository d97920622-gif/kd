// path: docs/PLAN/chat-prompts/CHAT_03.md
# CHAT 03 OF 16 -- Authentication, 2FA, Passkeys, Session Registry, Login Lock, VPN/Proxy/Tor

Open a NEW chat and paste everything between the marker lines.
Prerequisite: Step 2 complete.

=== BEGIN PASTE ===
You are continuing the KD SOLUTION IT platform build. This is CHAT 3 OF 16.
Step 3 of the 16-step execution plan: Authentication, 2FA, Session, Login Lock
and VPN, Proxy and Tor blocking.

READ FIRST, in this order, inside the repository:
1. MASTER_PROMPT.md (security layers 3, 6 and 8; zero tolerance policies).
2. FEATURE_LIST.md Part 2 section A, Part 11 section H.
3. docs/PLAN/05_ADDITIONAL_REQUIREMENTS_SPEC.md section A5 (login lock) and
   section A9 (branch policy).
4. docs/PLAN/00_MASTER_EXECUTION_PLAN.md (your migration window is
   20260201000000 to 20260201999999).
5. docs/PLAN/02_CONVENTIONS_AND_GUARDRAILS.md.
6. docs/PLAN/03_FILE_OWNERSHIP_MATRIX.md (you own app/(auth), app/api/auth,
   lib/auth except approval and permissions, lib/security/vpn-proxy-detector.ts
   and device-fingerprint.ts, services/auth).
7. docs/PLAN/04_DEFINITION_OF_DONE_AND_GATES.md (step 3 gates).
8. docs/PLAN/08_SUBSTEP_CHECKLISTS.md, section "STEP 03".
9. docs/handoffs/CHAT_02_COMPLETED.md.

SCOPE FOR THIS CHAT:
- 3.1 Supabase browser, server and admin clients; middleware auth; session
  cookie policy HttpOnly, Secure, SameSite=Strict; session id rotation on
  login; configurable session timeout (default 24 hours).
- 3.2 Signup: Cloudflare Turnstile, honeypot field, email verification,
  disposable email blocklist, VPN, proxy and Tor blocking, signup rate limits,
  audit entry.
- 3.3 Login lock engine, exactly as required: two consecutive failed attempts
  (wrong password or wrong 2FA code) lock the account for 2 hours; while
  locked, correct password does not log in; password reset is blocked;
  changing the password does not lift the lock; the owner receives an email
  alert when a lock starts; unlock is possible only by an admin or admin_staff
  holding the unlock permission and only after confirming email contact with
  the owner; every unlock writes an audit entry with actor, target, reason and
  timestamp; failure counters and lock state live in the database so a server
  restart preserves them; IP-based rate limiting runs in parallel; error
  messages never reveal whether an account exists.
- 3.4 2FA TOTP: enrollment with QR code, verification, ten one-time backup
  codes, recovery flow, mandatory for every account-holding role, step-up
  helper used by later steps for gateway, payout, KYC and admin actions.
- 3.5 Passkeys and hardware keys: WebAuthn registration and authentication
  ceremonies, additive factor beside TOTP, phishing-resistant prompt, named
  credentials, recovery and re-enrollment, audit entries.
- 3.6 Trusted devices and device centre: device registry, trust scoring,
  revocation, new device alerts, device list UI with four states.
- 3.7 Session registry and continuous verification: global session list,
  short-lived access with rotating refresh token, mid-session IP or device
  change detection, self-service account freeze and unfreeze with audit.
- 3.8 OAuth Google and GitHub with encrypted token storage, account linking
  rules, session fixation prevention, new device alerts, session revoke and a
  device and session list.
- 3.9 Password controls: minimum 12 characters with upper, lower, number and
  special; HIBP k-anonymity breach check; history of last five passwords;
  reset flow that honors an active lock.
- 3.10 Network trust: lib/security/vpn-proxy-detector.ts, ip-reputation.ts,
  geo rules, corporate IP whitelist managed by super_admin, enforcement matrix
  for signup and login now, with hooks consumed later by payment, KYC and
  admin.
- 3.11 Auth surfaces: API routes with Zod, sanitization, CSRF double submit,
  correlation id, audit entries, typed errors; pages for login, signup,
  forgot password, reset password, verify email, 2FA challenge, passkey,
  locked account, device centre, session list and security settings, each with
  loading, error, empty and success states, 320px support, dark mode and
  WCAG 2.1 AA.

FEATURE SOURCES: FEATURE_LIST.md Part 2 section A (auth system, OAuth, 2FA,
session management, login security) and Part 11 section H (VPN and IP
security).

ADDED IN REVISION 2 (mandatory): read docs/PLAN/09_REVISION_2_ADDITIONS.md and
sections A11 to A15 of docs/PLAN/05_ADDITIONAL_REQUIREMENTS_SPEC.md before
starting. Added sub-steps 3.5 passkeys and hardware keys, 3.6 trusted devices and device centre, 3.7 session registry and self-service freeze. Revision 2 only adds; the twenty absolute rules and
requirements A1 to A10 keep full force. Respect the ownership boundary table in
that file so no code is duplicated or conflicting.

NON-NEGOTIABLE RULES: English and ASCII only; no test files; no TODO, FIXME,
"Coming Soon" or placeholders; no `any`; no console.log; path comment on every
file; Zod on client and server; sanitize every input; RLS default-deny; audit
entry on every mutation including lock, unlock, 2FA setup, 2FA reset, session
revoke; secrets encrypted with AES-256-GCM and never logged; generic error
messages; Zero Trust and Zero Tolerance.

EXECUTION LOOP per sub-step: implement, migrate, run `npm run verify`, commit
as `<type>(step-03/S.S): <summary>`, update
`docs/handoffs/CHAT_03_PROGRESS.md`.

STEP 3 GATES: lock state and counters survive a server restart (database
assertion recorded); no endpoint reveals account existence; password reset is
blocked while locked; unlock requires confirmed owner contact and is audited;
VPN and proxy blocking active on signup and flagged with step-up 2FA on login;
all auth endpoints rate limited and audited.

COMMIT AND PUSH POLICY: commit and push only to the branch this session is
already on. Never create, rename or switch branches.

END OF CHAT, MANDATORY: write docs/handoffs/CHAT_03_COMPLETED.md and report
sub-steps completed, evidence and the next starting point.

RESUME INSTRUCTION: read docs/handoffs/CHAT_03_PROGRESS.md, continue from the
first unchecked sub-step, never re-implement an existing passing file.
=== END PASTE ===
