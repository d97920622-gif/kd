// path: docs/PLAN/chat-prompts/CHAT_12.md
# CHAT 12 OF 16 -- Universal SMTP, WhatsApp, Social, Public API v1, Webhooks, Integrations, Support, Channel Transparency

Open a NEW chat and paste everything between the marker lines.
Prerequisite: Step 11 complete.

=== BEGIN PASTE ===
You are continuing the KD SOLUTION IT platform build. This is CHAT 12 OF 16.
Step 12: universal SMTP email infrastructure, WhatsApp automation, social
media automation, public REST API v1 with webhooks, integration ecosystem and
support.

READ FIRST: 1. MASTER_PROMPT.md (integrations list, SMTP rules, forbidden
practices). 2. FEATURE_LIST.md Part 2 section B and Part 6 sections A to K.
3. docs/PLAN/00_MASTER_EXECUTION_PLAN.md (your migration window is
20260616000000 to 20260616999999). 4. docs/PLAN/
02_CONVENTIONS_AND_GUARDRAILS.md. 5. docs/PLAN/03_FILE_OWNERSHIP_MATRIX.md.
6. docs/PLAN/04_DEFINITION_OF_DONE_AND_GATES.md (step 12 gates).
7. docs/PLAN/08_SUBSTEP_CHECKLISTS.md section "STEP 12".
8. docs/handoffs/CHAT_11_COMPLETED.md.

BASE BRANCH CHECK (run this before anything else): confirm that the branch this
chat started from already contains the previous chat's work. For a new step,
docs/handoffs/CHAT_11_COMPLETED.md must exist. For a continuation of the
same step, docs/handoffs/CHAT_12_PROGRESS.md must exist. If they are missing,
stop immediately and report that the chat was started from the wrong base
branch (the owner must select the mainline branch that holds the completed
work); do not recreate earlier files and do not start coding.

SCOPE FOR THIS CHAT:
- 12.1 Universal SMTP adapter layer: Resend, SendGrid, SES, Mailgun, Postmark
  and generic SMTP; platform-level configuration by super_admin; per-tenant
  bring-your-own SMTP with verification; DKIM, SPF and DMARC checks;
  DB-backed queue with retry and backoff; bounce and complaint handling; email
  log; deliverability dashboard.
- 12.2 Email templates: React Email set for every transactional event,
  versioning, per-tenant branding, preview and test send, template manager.
- 12.3 WhatsApp Meta Cloud API: client, WABA configuration, encrypted
  credentials, template manager with approval states, send API, automation
  rules, bulk campaigns, delivery and read tracking, inbound reply webhook,
  consent and compliance including opt-in records, quiet hours and block list.
- 12.4 Social automation: connections with encrypted tokens, seven platform
  adapters (Facebook, Instagram, LinkedIn, X, Threads, Telegram, Pinterest),
  composer, content calendar, scheduler, auto-post rules, evergreen queue,
  approval flow, analytics, in-app sharing widgets.
- 12.5 Public REST API v1: API keys with scopes hashed at rest, documented
  endpoints, rate limits, cursor pagination, idempotency, OpenAPI spec, docs
  page, developer portal, sandbox keys, usage analytics.
- 12.6 Outbound webhooks: subscriptions, HMAC signing, retries with backoff,
  dead letter queue, delivery logs, replay tool.
- 12.7 Integrations: Zapier, Make.com, Chrome extension, bank feeds (Plaid and
  Salt Edge) with transaction import and smart reconciliation, receipt OCR with
  Google Cloud Vision and smart entry, contracts and e-signature, multi-channel
  messaging engine with channel routing, fallback chain, consent and quiet
  hours, and additional channel adapters using generic partner naming.
- 12.8 Messaging transparency and compliance console: per-channel delivery,
  open, click, retry and failure views appended to the Step 4 message log
  through the append protocol, consent ledger view, quiet hours, suppression
  list, admin audit.
- 12.9 Support: help center, ticket system with SLA and assignment, canned
  responses, feedback and NPS.
- 12.10 Data migration and import wizard: CSV and competitor import, column
  mapping, validation, duplicate preview with skip, overwrite or create
  options, audit.

ADDED IN REVISION 2 (mandatory): read docs/PLAN/09_REVISION_2_ADDITIONS.md and
sections A11 to A15 of docs/PLAN/05_ADDITIONAL_REQUIREMENTS_SPEC.md before
starting. Added sub-step 12.8 messaging transparency and compliance console. Revision 2 only adds; the twenty absolute rules and
requirements A1 to A10 keep full force. Respect the ownership boundary table in
that file so no code is duplicated or conflicting.

NON-NEGOTIABLE RULES: English and ASCII only; USD only; numeric(18,4) with
decimal.js; no test files; no TODO, FIXME, "Coming Soon" or placeholders; no
`any`; no console.log; path comment on every file; Zod on client and server;
sanitize every input including template bodies; RLS default-deny; audit entry
for credential changes, campaign sends, API key creation and revocation,
webhook delivery failures and imports; API keys and OAuth tokens encrypted or
hashed as appropriate and never logged; every outbound message idempotent;
consent enforced before any WhatsApp or messaging send; never write forbidden
payment brand names; Zero Trust and Zero Tolerance.

EXECUTION LOOP per sub-step: implement, migrate, run `npm run verify`, commit
as `<type>(step-12/S.S): <summary>`, update
`docs/handoffs/CHAT_12_PROGRESS.md`.

STEP 12 GATES: every outbound message logged with provider response and
idempotency key; webhook signatures verified before processing; API keys
scoped and hashed; WhatsApp sends blocked without consent; bank import
reconciliation produces matched and unmatched queues; interface exposes the
complete API documentation page.

COMMIT AND PUSH POLICY: commit and push only to the branch this session is
already on. Never create, rename or switch branches.

END OF CHAT, MANDATORY: write docs/handoffs/CHAT_12_COMPLETED.md with scope,
sub-steps, files, migrations, env vars, decisions, evidence and the next
starting point.

RESUME INSTRUCTION: read docs/handoffs/CHAT_12_PROGRESS.md, continue from the
first unchecked sub-step, never re-implement an existing passing file.
=== END PASTE ===
