// path: README.md
# KD SOLUTION IT

Enterprise multi-tenant SaaS platform for invoicing, payments, payroll and
accounting, built for the Asian market.

- Currency: USD only. All money is `numeric(18,4)` with decimal arithmetic.
- Text and structured data: Supabase PostgreSQL.
- Files: the company's Google Drive when linked, otherwise Supabase Storage,
  always AES-256-GCM encrypted before upload with `storage_provider` recorded.
- Language: English only in code, UI, comments, seeds and documentation.

## Specification sources

| File | Role |
| --- | --- |
| `MASTER_PROMPT.md` | Binding specification: absolute rules, stack, schema rules, security layers |
| `FEATURE_LIST.md` | Owner-supplied feature list (3,950 features, eleven parts). It is the only file allowed to contain non-ASCII characters |
| `docs/PLAN/` | The execution plan: sixteen steps, sub-step work orders, segment guide, guardrails, traceability, provider registry, revision 2 additions, chat prompts |

## How the build is executed

The project is built in sixteen steps, one step per chat:

1. Read `docs/PLAN/00_MASTER_EXECUTION_PLAN.md` and
   `docs/PLAN/08_SUBSTEP_CHECKLISTS.md`.
2. Open a new chat and paste the matching file from
   `docs/PLAN/chat-prompts/` (CHAT_01 for step 1, CHAT_02 for step 2, and so
   on up to CHAT_16).
3. The chat implements sub-step by sub-step, commits after each sub-step, runs
   `npm run verify`, and ends with a handoff document in `docs/handoffs/`.
4. Steps 1, 3, 4, 6, 10 and 13 are divided into four segments each. A chat
   executes exactly one segment, stops at the segment gate, and the same prompt
   is pasted again in a new chat for the next segment. For every other step, if
   one chat is not enough, paste the same prompt again: the resume instruction
   continues from the first unchecked sub-step without repeating work. Full
   segment rules: `docs/PLAN/10_SEGMENT_GUIDE.md`.

Never skip a step and never paste two step prompts into one chat. Each prompt
is self-sufficient and states its scope, rules, gates and handoff duty.

## Step map

| Step | Title |
| --- | --- |
| 1 | Foundation, governance, design system, layout architecture |
| 2 | Database foundation, migrations, RLS, encryption, audit ledger |
| 3 | Authentication, 2FA, passkeys, session registry, login lock, VPN/proxy/Tor blocking |
| 4 | Roles, permissions, approval engine, approval inbox, enterprise access, onboarding, settings, KYC, notifications, platform billing |
| 5 | Invoicing core, documents, PDF engine, numbering, editor experience |
| 6 | CRM, catalog, inventory, suppliers, e-commerce sync, dashboards, reports, tax engine, batch |
| 7 | Storage abstraction, file security, file records |
| 8 | Payment framework core, card rules, 3DS policy, advanced card risk, routing, super admin API console |
| 9 | Sixteen processor adapters, NMI dual mode, advanced capabilities, sandbox validation |
| 10 | Checkout design, payment experience, wallet, merchant of record, payouts, disputes, consent evidence, subscriptions, BNPL |
| 11 | Client portal, token checkout page, tokenized access, email journey, branding, white-label, document integrity |
| 12 | Universal SMTP, WhatsApp, social, public API v1, webhooks, integrations, support, channel transparency |
| 13 | Payroll, HR, expenses, double-entry accounting, tax liability and remittance, financial statements, reports |
| 14 | Super admin console, CMS, SEO, analytics, marketing, growth, platform intelligence, trust publishing |
| 15 | Deep security, privacy experience, deception and anomaly, compliance, fraud, tracking, zero trust, conflict and duplicate finalization |
| 16 | Deployment, CI/CD, cron, documentation, PWA security, performance, backup and disaster recovery, launch |

## Branch policy

`integration` is the long-lived mainline and the deployment source of truth.
`main` is the release mirror. Step work is committed on the session branch and
merged into `integration` after review. The exact procedure is in
`docs/PLAN/07_BRANCH_AND_GIT_WORKFLOW.md`.

## Non-negotiable rules (summary)

English only, USD only, `numeric(18,4)` with decimal.js, no JavaScript Number
for money, no test files, no TODO, no FIXME, no "Coming Soon", no placeholder
text, no `any`, no `console.log`, a `// path:` comment at the top of every
file, universal columns on every table, RLS enabled with default-deny on every
table, an audit entry for every mutation, Zod validation on client and server,
sanitized input everywhere, idempotency key on every payment, optimistic
locking on every editable record, the approval chain staff to CEO to
super_admin, Zero Trust and Zero Tolerance, and the generic payment partner
naming ("Global Payout Partners", "Local Payment Methods via Licensed
Partners").

## Documentation

- `docs/PLAN/` build plan, guardrails, traceability, provider registry.
- `docs/handoffs/` one handoff per completed chat.
- `docs/ADR/` architecture decision records (created from step 1).
- `docs/PROVIDERS/` per-processor verified documentation records (created from
  step 9).
- `docs/RUNBOOKS/` operational runbooks (created from step 14 and completed in
  step 16).
