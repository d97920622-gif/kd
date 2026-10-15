// path: docs/PLAN/chat-prompts/CHAT_04.md
# CHAT 04 OF 16 -- Roles, Permissions, Approval Engine, Approval Inbox, Enterprise Access, Onboarding, Settings, KYC, Notifications, Platform Billing (4 segments)

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

SEGMENT EXECUTION MODEL: this prompt covers the whole step, which is executed as
segments 4A to 4D, one segment per chat. In this chat, find your
current segment in docs/handoffs/CHAT_04_PROGRESS.md, execute only that segment,
and stop at its segment gate. Then paste this same prompt in a new chat for the
next segment. Segment rules: docs/PLAN/10_SEGMENT_GUIDE.md.

BASE BRANCH CHECK (run this before anything else): confirm that the branch this
chat started from already contains the previous chat's work. For a new step,
docs/handoffs/CHAT_03_COMPLETED.md must exist. For a continuation of the
same step, docs/handoffs/CHAT_04_PROGRESS.md must exist. If they are missing,
stop immediately and report that the chat was started from the wrong base
branch (the owner must select the mainline branch that holds the completed
work); do not recreate earlier files and do not start coding.

SCOPE FOR THIS STEP (all segments; do not implement later steps):
### SEGMENT 4A -- Roles, permissions, approval engine (chat 1 of 4)
- 4.1 Roles: super_admin, ceo, admin_staff, owner and staff definitions plus the seven admin_staff sub-roles; forbidden roles absent everywhere.
- 4.2 Permission matrix: config/permissions.ts with module and action granularity, entitlement awareness.
- 4.3 Guards: server-side authorization, client-side visibility, cross-tenant 404 policy.
- 4.4 Approval engine core: approval_requests, L1/L2/L3 levels, SLA and auto-escalation, delegation, dual approval, bulk approval, full history.
- 4.5 Approval inbox UI: unified queue, filters by module and requester, SLA countdown, bulk approve and reject with confirmation, audit.
Segment gate: permission matrix SQL assertion passes; approval chain enforced on every managed action.

### SEGMENT 4B -- Onboarding, company settings, team (chat 2 of 4)
- 4.6 Super admin first-run setup wizard and platform configuration.
- 4.7 Owner onboarding wizard, industry presets, first-run experience, entitlement-aware steps.
- 4.8 Company profile and branding settings with live preview.
- 4.9 Invoice settings, custom domain setup and tenant security policy.
- 4.10 Team management: invites, granular permission assignment, member lifecycle.
- 4.11 Staff activity monitoring, staff security controls and permission review hooks.
- 4.12 Staff draft to owner approval send workflow with audit.
Segment gate: onboarding completes end to end on a fresh tenant; staff cannot send without owner approval.

### SEGMENT 4C -- KYC, notifications, message log (chat 3 of 4)
- 4.13 KYC upload through the storage abstraction, statuses and re-verification.
- 4.14 KYC review console for kyc_reviewer, gate map, notifications and audit.
- 4.15 Notification center: in-app list, read state, realtime updates, four states.
- 4.16 Notification preferences, event matrix, digest scheduling and the email dispatch interface consumed by step 12.
- 4.17 Message delivery event log service and table that every channel writes into.
Segment gate: KYC gate blocks gated features until approved; the message log receives entries from notification dispatch.

### SEGMENT 4D -- Platform billing, enterprise access, security centre (chat 4 of 4)
- 4.18 Platform billing: plan management and subscription lifecycle.
- 4.19 Coupons, entitlement engine and dunning.
- 4.20 Platform invoices and the owner billing UI.
- 4.21 Enterprise access A: SAML and OIDC single sign-on adapter, domain verification, just-in-time provisioning rules.
- 4.22 Enterprise access B: SCIM provisioning, tenant IP allowlist, just-in-time access with expiry, break-glass with dual approval and mandatory audit.
- 4.23 Owner security centre: security score and checklist, who-did-what digest, permission review reminder, session and device review links.
- 4.24 Tenant settings surfaces: gateway configuration shell, payout partner settings with generic naming, handoff.
Segment gate: entitlements correct after a plan change; break-glass use audited and notified.

ADDED IN REVISION 2 (mandatory): read docs/PLAN/09_REVISION_2_ADDITIONS.md and
sections A11 to A15 of docs/PLAN/05_ADDITIONAL_REQUIREMENTS_SPEC.md before
starting. Added sub-step 4.5 approval inbox in segment 4A, the message delivery event log as sub-step 4.17 in segment 4C, and enterprise access plus the owner security centre as sub-steps 4.21, 4.22 and 4.23 in segment 4D. Revision 2 only adds; the twenty absolute rules and
requirements A1 to A10 keep full force. Respect the ownership boundary table in
that file so no code is duplicated or conflicting.

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
starting point. Also record the segment status: complete with the next segment named,
or partial with the exact sub-step to resume from.

SEGMENT RULE: execute exactly one segment per chat. Never start the next segment
in the same chat. At the end of a segment, run npm run verify, record the segment
gate evidence, update the progress file, and state the segment status line:
"Segment NNX complete; next segment NNX+1" or "Segment NNX partial; resume at
sub-step NN.YY".

RESUME INSTRUCTION: read docs/handoffs/CHAT_04_PROGRESS.md, continue from the
first unchecked sub-step, never re-implement an existing passing file.
=== END PASTE ===
