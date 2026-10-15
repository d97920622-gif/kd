// path: docs/PLAN/chat-prompts/CHAT_15.md
# CHAT 15 OF 16 -- Deep Security, Privacy Experience, Deception and Anomaly, Compliance, Fraud, Tracking, Zero Trust, Conflict and Duplicate Finalization

Open a NEW chat and paste everything between the marker lines.
Prerequisite: Step 14 complete.

=== BEGIN PASTE ===
You are continuing the KD SOLUTION IT platform build. This is CHAT 15 OF 16.
Step 15: deep security hardening, compliance, fraud and abuse prevention,
tracking, zero trust and zero tolerance, and the finalization of conflict and
duplicate prevention.

READ FIRST: 1. MASTER_PROMPT.md (all ten security layers, zero tolerance
policies, conflict and duplicate prevention, forbidden practices).
2. FEATURE_LIST.md Part 9 sections A to S, Part 11 sections B to M.
3. docs/PLAN/05_ADDITIONAL_REQUIREMENTS_SPEC.md (all sections; verify each is
now enforced in code). 4. docs/PLAN/00_MASTER_EXECUTION_PLAN.md (your
migration window is 20260801000000 to 20260801999999). 5. docs/PLAN/
02_CONVENTIONS_AND_GUARDRAILS.md. 6. docs/PLAN/03_FILE_OWNERSHIP_MATRIX.md
(you own lib/security except files owned by steps 3, 8 and 14, lib/compliance,
services/duplicate, SECURITY_MODEL.md, COMPLIANCE.md). 7. docs/PLAN/
04_DEFINITION_OF_DONE_AND_GATES.md (step 15 gates). 8. docs/PLAN/
08_SUBSTEP_CHECKLISTS.md section "STEP 15".
9. docs/handoffs/CHAT_14_COMPLETED.md.

SCOPE FOR THIS CHAT:
- 15.1 Tenant isolation hardening: RLS audit, cross-tenant access returns 404
  never 403 and never data, storage isolation, IDOR sweep across every
  endpoint, isolation fuzz script, RLS performance optimization with security
  definer helpers.
- 15.2 Encryption and secrets hardening: encrypted field inventory, blind
  index coverage for searchable encrypted fields, key rotation drill, boot
  time environment validation, secret access audit log, client bundle secret
  scanner in CI, PII redaction for logs and Sentry, backup encryption.
- 15.3 Application security sweep: SQL injection, XSS, CSRF, SSRF, CSP with
  nonces and Trusted Types, security headers and HSTS, CORS allowlist, open
  redirect guard, mass assignment with Zod strict, prototype pollution,
  ReDoS with safe-regex checks, path traversal, header injection, null byte
  rejection, NFC normalization, zero-width and RTL removal.
- 15.4 Bot and abuse prevention: rate limit matrix per endpoint, brute force
  backoff, Turnstile coverage, honeypots, device fingerprint reuse detection,
  headless browser detection, traffic anomaly detection, auto-suspend,
  payload and zip bomb guards, coupon and referral abuse guards, account
  takeover and session hijack detection, insider threat rules.
- 15.5 Fraud engine completion: scoring, AML and sanctions screening with a
  weekly re-screening cron, transaction monitoring and anomaly detection, case
  management, blacklists keyed on card token or fingerprint, manual review
  queue, fraud analytics.
- 15.6 Network trust completion: VPN, proxy, Tor, datacenter and residential
  proxy detection, IP reputation scoring, geo fences, country blocks, admin
  whitelist for corporate networks, enforcement matrix across signup, login,
  payment, KYC and admin.
- 15.7 Compliance: GDPR, CCPA, PDPA and other jurisdictions, DSAR handler,
  consent manager, data classification, retention enforcement, residency and
  sovereignty rules, cross-border transfer controls, jurisdiction
  configuration, compliance audit exports.
- 15.8 Privacy experience: user and owner privacy dashboard showing stored
  data classes with export and delete actions, consent ledger view, per-tenant
  data residency selection, cross-border transfer record, appeal path with
  review and notification for every automated block.
- 15.9 Deception, anomaly and log integrity: honeytokens and canaries,
  per-tenant behavioural baselines, impossible travel detection, automated
  containment with appeal and owner notification, continuous audit log
  integrity verification, WORM export with escrow.
- 15.10 Supply chain and CI security: SCA with Snyk and Dependabot, SAST with
  Semgrep, DAST with OWASP ZAP, secret scanning with gitleaks and truffleHog,
  container scanning with Trivy, IaC scanning with Checkov, SBOM generation,
  dependency pinning policy, signed commits and provenance hooks.
- 15.11 Observability and incident response: Sentry with PII scrubbing, real
  user monitoring, synthetic checks, database, payment, email, WhatsApp and
  storage monitors, cron dead man switch, SSL, domain and DNS monitors, alert
  routing, incident workflow, disaster recovery plan with a documented drill
  and RTO under four hours and RPO under one hour.
- 15.12 Conflict and duplicate finalization: all fifteen conflict and
  duplicate implementations verified as code in services/ with typed errors,
  audit entries, user-visible resolution paths, concurrency assertion scripts
  and leader locks on every cron.
- 15.13 Performance and database engineering: Core Web Vitals budgets, bundle
  budget under 200KB initial JavaScript, media pipeline, caching and ISR,
  index coverage audit, query timeouts, N+1 sweep, cursor pagination
  everywhere.
- 15.14 Zero Trust and Zero Tolerance finalization: device, network, user and
  transaction trust scores, adaptive MFA, just-in-time and just-enough access,
  break glass procedure, automated responses with an appeal path, security
  posture dashboard, penetration test log and remediation record.

ADDED IN REVISION 2 (mandatory): read docs/PLAN/09_REVISION_2_ADDITIONS.md and
sections A11 to A15 of docs/PLAN/05_ADDITIONAL_REQUIREMENTS_SPEC.md before
starting. Added sub-steps 15.8 privacy experience, 15.9 deception, anomaly and log integrity. Revision 2 only adds; the twenty absolute rules and
requirements A1 to A10 keep full force. Respect the ownership boundary table in
that file so no code is duplicated or conflicting.

NON-NEGOTIABLE RULES: English and ASCII only; USD only; numeric(18,4) with
decimal.js; no test files, use SQL and HTTP assertion scripts instead; no TODO,
FIXME, "Coming Soon" or placeholders; no `any`; no console.log; path comment on
every file; Zod on client and server; sanitize every input; RLS default-deny
and verified; audit entry for every security-relevant action including blocks,
bans, unlocks, key rotations and break glass use; secrets never logged; never
write forbidden payment brand names; Zero Trust and Zero Tolerance with no
exceptions for any role, including super_admin.

EXECUTION LOOP per sub-step: implement, run the relevant assertion scripts,
run `npm run verify`, commit as `<type>(step-15/S.S): <summary>`, update
`docs/handoffs/CHAT_15_PROGRESS.md`.

STEP 15 GATES: the complete security checklist from Part 9 and Part 11 signed
off with evidence; isolation fuzz reports zero leaks; zero tolerance
automations verified; no critical or high dependency vulnerabilities; all
duplicate and conflict implementations raise typed errors and write audit
entries; DR drill documented with measured RTO and RPO.

COMMIT AND PUSH POLICY: commit and push only to the branch this session is
already on. Never create, rename or switch branches.

END OF CHAT, MANDATORY: write docs/handoffs/CHAT_15_COMPLETED.md with the full
security sign-off table, evidence, and the next starting point.

RESUME INSTRUCTION: read docs/handoffs/CHAT_15_PROGRESS.md, continue from the
first unchecked sub-step, never re-implement an existing passing file.
=== END PASTE ===
