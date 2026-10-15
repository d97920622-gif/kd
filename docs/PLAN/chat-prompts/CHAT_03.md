// path: docs/PLAN/chat-prompts/CHAT_03.md
# CHAT 03 OF 16 -- Authentication, 2FA, Passkeys, Session Registry, Login Lock, VPN/Proxy/Tor (4 segments)

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

SEGMENT EXECUTION MODEL: this prompt covers the whole step, which is executed as
segments 3A to 3D, one segment per chat. In this chat, find your
current segment in docs/handoffs/CHAT_03_PROGRESS.md, execute only that segment,
and stop at its segment gate. Then paste this same prompt in a new chat for the
next segment. Segment rules: docs/PLAN/10_SEGMENT_GUIDE.md.

BASE BRANCH CHECK (run this before anything else): confirm that the branch this
chat started from already contains the previous chat's work. For a new step,
docs/handoffs/CHAT_02_COMPLETED.md must exist. For a continuation of the
same step, docs/handoffs/CHAT_03_PROGRESS.md must exist. If they are missing,
stop immediately and report that the chat was started from the wrong base
branch (the owner must select the mainline branch that holds the completed
work); do not recreate earlier files and do not start coding.

SCOPE FOR THIS STEP (all segments; do not implement later steps):
### SEGMENT 3A -- Auth foundations (chat 1 of 4)
- 3.1 Supabase clients: browser, server and admin, with the service role kept server-only.
- 3.2 Session policy: HttpOnly plus Secure plus SameSite=Strict cookie, session id rotation on login, configurable timeout with a default of 24 hours.
- 3.3 Auth middleware: route protection, tenant resolution, redirect rules, no PII in URLs.
- 3.4 CSRF double-submit on auth routes and credential payload sanitization.
- 3.5 Auth rate limits: per IP and per account counters, response headers, typed RateLimitError.
Segment gate: session rotation proven on login; forged CSRF requests rejected.

### SEGMENT 3B -- Signup, login, login lock (chat 2 of 4)
- 3.6 Signup flow: Turnstile verification, honeypot field, email verification, disposable email blocklist, audit entry.
- 3.7 Login flow: credential check, generic error messages, no account existence leakage, IP rate limit.
- 3.8 Login lock engine core: consecutive failure counters for password and 2FA, 2-hour lock, database persistence that survives restart.
- 3.9 Lock enforcement: correct password denied, password reset blocked, password change does not unlock, session issuance blocked.
- 3.10 Lock notification: owner email alert on lock start with device and IP context, generic user-facing copy.
- 3.11 Unlock workflow: authorized admin or admin_staff only, confirmed owner contact required, audit entry with actor, target, reason and timestamp.
Segment gate: lock state survives a server restart with the database assertion recorded; no endpoint reveals account existence.

### SEGMENT 3C -- Factors and credentials (chat 3 of 4)
- 3.12 2FA TOTP: enrollment with QR code, verification, ten one-time backup codes, recovery flow, mandatory per role.
- 3.13 Step-up helper for sensitive actions (gateway, payout, KYC, admin) with challenge TTL and audit.
- 3.14 Passkeys and hardware keys: WebAuthn registration and authentication, additive factor beside TOTP, named credentials, recovery and re-enrollment, audit entries.
- 3.15 Password controls: minimum 12 characters with complexity, HIBP k-anonymity check, history of last five, reset flow that honors an active lock.
- 3.16 OAuth: Google and GitHub, encrypted token storage, account linking rules, session fixation prevention.
Segment gate: passkey and TOTP coexist without weakening the login lock; step-up enforced and audited.

### SEGMENT 3D -- Devices, sessions, network trust, surfaces (chat 4 of 4)
- 3.17 Trusted devices and device centre: registry, trust scoring, revocation, new device alerts, UI with four states.
- 3.18 Session registry: global session list, short-lived access with rotating refresh, mid-session IP or device change detection, self-service freeze and unfreeze with audit.
- 3.19 Network trust: vpn-proxy-detector, ip-reputation, geo rules, corporate IP whitelist, enforcement matrix definition.
- 3.20 Network enforcement: VPN, proxy and Tor blocked on signup, flagged with step-up 2FA on login, audit entries.
- 3.21 Auth surfaces A: login, signup, forgot password, reset password, verify email pages with four states, 320px, dark mode, WCAG AA.
- 3.22 Auth surfaces B: 2FA challenge, passkey, locked account, device centre, session list, security settings, handoff.
Segment gate: all auth endpoints rate limited and audited; accessibility and 320px checks recorded.

FEATURE SOURCES: FEATURE_LIST.md Part 2 section A (auth system, OAuth, 2FA,
session management, login security) and Part 11 section H (VPN and IP
security).

ADDED IN REVISION 2 (mandatory): read docs/PLAN/09_REVISION_2_ADDITIONS.md and
sections A11 to A15 of docs/PLAN/05_ADDITIONAL_REQUIREMENTS_SPEC.md before
starting. Added sub-steps 3.14 passkeys, 3.17 trusted devices and device centre, 3.18 session registry and self-service freeze, in segments 3C and 3D. Revision 2 only adds; the twenty absolute rules and
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
sub-steps completed, evidence and the next starting point. Also record the segment status: complete with the next segment named,
or partial with the exact sub-step to resume from.

SEGMENT RULE: execute exactly one segment per chat. Never start the next segment
in the same chat. At the end of a segment, run npm run verify, record the segment
gate evidence, update the progress file, and state the segment status line:
"Segment NNX complete; next segment NNX+1" or "Segment NNX partial; resume at
sub-step NN.YY".

RESUME INSTRUCTION: read docs/handoffs/CHAT_03_PROGRESS.md, continue from the
first unchecked sub-step, never re-implement an existing passing file.
=== END PASTE ===
