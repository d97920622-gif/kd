// path: docs/PLAN/chat-prompts/CHAT_14.md
# CHAT 14 OF 16 -- Super Admin Console, CMS, SEO, Analytics, Marketing, Growth, Intelligence, Trust Publishing

Open a NEW chat and paste everything between the marker lines.
Prerequisite: Step 13 complete.

=== BEGIN PASTE ===
You are continuing the KD SOLUTION IT platform build. This is CHAT 14 OF 16.
Step 14: super admin console, CMS and blog, SEO depth, analytics and pixels,
conversion and marketing automation, platform intelligence, monitoring and the
audit console.

READ FIRST: 1. MASTER_PROMPT.md (role model, monitoring and alerting,
immutable audit log and SIEM). 2. FEATURE_LIST.md Part 7 sections A to M,
Part 11 sections A, B, D and E, Part 9 section S. 3. docs/PLAN/
00_MASTER_EXECUTION_PLAN.md (your migration window is 20260716000000 to
20260716999999). 4. docs/PLAN/02_CONVENTIONS_AND_GUARDRAILS.md. 5. docs/PLAN/
03_FILE_OWNERSHIP_MATRIX.md (you own app/(admin) except gateways, admin APIs,
CMS, SEO, analytics, marketing, audit viewer, SIEM forwarders).
6. docs/PLAN/04_DEFINITION_OF_DONE_AND_GATES.md (step 14 gates).
7. docs/PLAN/08_SUBSTEP_CHECKLISTS.md section "STEP 14".
8. docs/handoffs/CHAT_13_COMPLETED.md.

BASE BRANCH CHECK (run this before anything else): confirm that the branch this
chat started from already contains the previous chat's work. For a new step,
docs/handoffs/CHAT_13_COMPLETED.md must exist. For a continuation of the
same step, docs/handoffs/CHAT_14_PROGRESS.md must exist. If they are missing,
stop immediately and report that the chat was started from the wrong base
branch (the owner must select the mainline branch that holds the completed
work); do not recreate earlier files and do not start coding.

SCOPE FOR THIS CHAT:
- 14.1 Admin dashboard, user management, tenant management, time-limited and
  clearly marked audited impersonation, admin communication.
- 14.2 Plan, subscription and coupon administration, revenue analytics,
  monetization controls, entitlement administration.
- 14.3 CMS editor for every public page, blog management with categories,
  authors and scheduling, legal pages, email template manager, status page
  with incidents, media library backed by the storage abstraction.
- 14.4 SEO depth: eight JSON-LD schema types, metadata and Open Graph image
  generation, sitemap and robots, SEO audits and reports, search engine
  verification, canonical and redirect management.
- 14.5 Analytics and pixels: GA4, GTM, Meta Pixel with CAPI, TikTok, LinkedIn,
  X, Microsoft Clarity and Pinterest; consent-gated loading; pixel manager;
  in-app analytics.
- 14.6 Conversion optimization: A/B testing framework, trust signals,
  conversion tools, lead magnets, calculators, the complete free invoice
  generator.
- 14.7 Marketing automation: email campaigns, drip sequences, lead scoring,
  lead generation forms, lifecycle automation, win-back sequences.
- 14.8 Platform intelligence and engineering: revenue analytics, tenant
  intelligence, platform health, background job console, configuration
  management, feature flags.
- 14.9 Monitoring, alerting and incident response: rule engine with thresholds
  and anomaly patterns, channels (email, Slack, Discord, webhook, PagerDuty,
  SMS), deduplication, escalation, silence windows, on-call roster, incident
  workflow with severity levels and commander, published runbooks, SLO and
  error budget tracking.
- 14.10 Audit console: audit log viewer with search and export, SIEM forwarders
  for Splunk, Elastic, Datadog, CloudWatch, Sentinel and Chronicle with CEF,
  LEEF and UDM formatting, user behaviour analytics, insider threat signals,
  tamper detection alerts; growth and retention tools.
- 14.11 Trust and transparency publishing: /.well-known/security.txt,
  vulnerability disclosure page with policy and contact, transparency report
  page, sub-processor list, data processing agreement page, accessibility
  statement, privacy notice linkage.

ADDED IN REVISION 2 (mandatory): read docs/PLAN/09_REVISION_2_ADDITIONS.md and
sections A11 to A15 of docs/PLAN/05_ADDITIONAL_REQUIREMENTS_SPEC.md before
starting. Added sub-step 14.11 trust and transparency publishing. Revision 2 only adds; the twenty absolute rules and
requirements A1 to A10 keep full force. Respect the ownership boundary table in
that file so no code is duplicated or conflicting.

NON-NEGOTIABLE RULES: English and ASCII only; USD only; numeric(18,4) with
decimal.js; no test files; no TODO, FIXME, "Coming Soon" or placeholders; no
`any`; no console.log; path comment on every file; Zod on client and server;
sanitize every input including rich text through DOMPurify and CMS HTML; RLS
default-deny; audit entry for every admin action, impersonation start and end,
CMS publish, plan change, refund of platform subscriptions, feature flag
change, alert acknowledgement and incident update; admin routes restricted to
super_admin, ceo and admin_staff with step-up when required; secrets encrypted
with AES-256-GCM and never logged; never write forbidden payment brand names;
Zero Trust and Zero Tolerance.

EXECUTION LOOP per sub-step: implement, migrate, run `npm run verify`, commit
as `<type>(step-14/S.S): <summary>`, update
`docs/handoffs/CHAT_14_PROGRESS.md`.

STEP 14 GATES: admin routes restricted and step-up enforced with evidence;
every CMS write audited; white-label tenants show no platform branding; audit
viewer is read-only; SIEM forwarder sends a test event successfully or records
the missing credential precisely; incident workflow auditable end to end.

COMMIT AND PUSH POLICY: commit and push only to the branch this session is
already on. Never create, rename or switch branches.

END OF CHAT, MANDATORY: write docs/handoffs/CHAT_14_COMPLETED.md with scope,
sub-steps, files, migrations, env vars, decisions, evidence and the next
starting point.

RESUME INSTRUCTION: read docs/handoffs/CHAT_14_PROGRESS.md, continue from the
first unchecked sub-step, never re-implement an existing passing file.
=== END PASTE ===
