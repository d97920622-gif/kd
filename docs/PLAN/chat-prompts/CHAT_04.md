// path: docs/PLAN/chat-prompts/CHAT_04.md
# CHAT 04 OF 16 -- Roles, Permissions, Approval Engine, Onboarding, Settings, KYC, Notifications, Platform Billing

Open a NEW chat and paste everything between the marker lines.
Prerequisite: Step 3 complete.

=== BEGIN PASTE ===
You are continuing the KD SOLUTION IT platform build. This is CHAT 4 OF 16.
Step 4: Roles, Permissions, Approval Engine, Onboarding, Settings, KYC,
Notifications and Platform Billing.

READ FIRST: 1. MASTER_PROMPT.md (role model, approval workflow engine, schema
rules). 2. FEATURE_LIST.md Part 2 sections B to L, Part 7 section H, Part 11
section A. 3. docs/PLAN/00_MASTER_EXECUTION_PLAN.md (your migration window is
20260216000000 to 20260216999999). 4. docs/PLAN/02_CONVENTIONS_AND_GUARDRAILS.md.
5. docs/PLAN/03_FILE_OWNERSHIP_MATRIX.md (you own roles, permissions, approval
engine, onboarding, settings, KYC service, notifications, platform billing).
6. docs/PLAN/04_DEFINITION_OF_DONE_AND_GATES.md (step 4 gates).
7. docs/PLAN/08_SUBSTEP_CHECKLISTS.md section "STEP 04".
8. docs/handoffs/CHAT_03_COMPLETED.md.

SCOPE FOR THIS CHAT:
- 4.1 Roles and permissions: super_admin > ceo > admin_staff > owner > staff,
  clients tokenized with no login; admin_staff sub-roles kyc_reviewer,
  payment_processor, support_agent, content_manager, compliance_officer,
  fraud_analyst, finance_analyst; config/permissions.ts matrix; server and
  client guards; nav role filtering completed; the accountant, affiliate and
  reseller roles must not exist anywhere.
- 4.2 Approval engine: approval_requests table, L1 staff, L2 CEO, L3
  super_admin; SLA with auto-escalation; delegation with super_admin fallback;
  dual approval for critical actions; bulk approval; full approval history;
  approval dashboards per role; audit entry for every decision; every managed
  action routes through this single engine (no parallel approval path).
- 4.3 Super admin first-run setup wizard and platform configuration.
- 4.4 Owner onboarding wizard: company creation, profile, industry presets,
  branding, invoice defaults, first-run experience, entitlement-aware steps.
- 4.5 Company profile and settings: profile, branding settings, invoice
  settings, custom domain, tenant security policy, notification preferences,
  one-click backup request.
- 4.6 Team management: staff invites, granular permission assignment,
  staff activity monitoring, owner-controlled staff security, staff draft to
  owner approval send workflow.
- 4.7 KYC: document upload through the storage abstraction, review console for
  kyc_reviewer, KYC gate map for gated features, statuses, re-verification,
  notifications, audit.
- 4.8 Notifications: in-app center, preferences, event matrix, realtime
  updates, digest, and the email dispatch interface consumed by step 12
  (implement the interface and queue now; SMTP adapters arrive in step 12).
- 4.9 Platform billing: plan management, subscription lifecycle, coupons,
  entitlement engine, dunning, platform invoices and billing UI.
- 4.10 Tenant settings surfaces: gateway configuration shell and payout
  partner settings using only the generic names "Global Payout Partners" and
  "Local Payment Methods via Licensed Partners".

NON-NEGOTIABLE RULES: English and ASCII only; USD only with numeric(18,4) and
decimal.js; no test files; no TODO, FIXME, "Coming Soon" or placeholders; no
`any`; no console.log; path comment on every file; Zod on client and server;
sanitize every input; RLS default-deny on every new table; optimistic locking
on editable rows; idempotency on mutations that can repeat; audit entry on
every mutation and every approval, rejection, impersonation and unlock;
approval chain staff -> CEO -> super_admin enforced; Zero Trust and Zero
Tolerance.

EXECUTION LOOP per sub-step: implement, migrate, verify with
`npm run verify` plus the permission-matrix assertion, commit as
`<type>(step-04/S.S): <summary>`, update `docs/handoffs/CHAT_04_PROGRESS.md`.

STEP 4 GATES: permission matrix SQL assertion passes for every role; approval
chain enforced on every managed action with recorded evidence; unauthorized
roles receive 404 on cross-tenant or out-of-scope resources; KYC gate blocks
gated features until approved; platform billing produces correct entitlement
state.

COMMIT AND PUSH POLICY: commit and push only to the branch this session is
already on. Never create, rename or switch branches.

END OF CHAT, MANDATORY: write docs/handoffs/CHAT_04_COMPLETED.md with scope,
sub-steps, files, migrations, env vars, decisions, evidence and the next
starting point.

RESUME INSTRUCTION: read docs/handoffs/CHAT_04_PROGRESS.md, continue from the
first unchecked sub-step, never re-implement an existing passing file.
=== END PASTE ===
