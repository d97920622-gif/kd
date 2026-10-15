// path: docs/PLAN/00_MASTER_EXECUTION_PLAN.md
# KD SOLUTION IT -- Master Execution Plan (16 Steps / 16 Chats)

Version: 1.0
Supersedes: the "10 chats" list inside `MASTER_PROMPT.md`.
Reason: the feature surface is 3,950 features across 11 parts plus the added
requirements (16 payment processors, NMI dual mode, login lock, card rules,
3DS policy, storage policy, super admin API console). Sixteen steps keep each
chat inside one context window while every requirement stays covered.

## 1. Step map

| Step | Title | Primary parts and requirements | Depends on |
| --- | --- | --- | --- |
| 1 | Foundation, Governance, Design System, Layout Architecture | Part 1 A-M; Part 9 K2/K3 (setup), Part 10 D (baseline docs) | - |
| 2 | Database Foundation, Migrations, RLS, Encryption, Audit Ledger | Part 9 A/B/K, Part 11 C; FORBIDDEN/ALWAYS rules | 1 |
| 3 | Authentication, 2FA, Passkeys, Session Registry, Login Lock, VPN/Proxy/Tor | Part 2 A, Part 11 H; Added requirement 5 | 2 |
| 4 | Roles, Permissions, Approval Engine, Approval Inbox, Enterprise Access, Onboarding, Settings, KYC, Notifications, Platform Billing | Part 2 B-L, Part 7 H, Part 11 A; Added requirement 5 (unlock workflow) | 3 |
| 5 | Invoicing Core, Documents, PDF Engine, Numbering, Editor Experience | Part 3 A-E, L, M | 4 |
| 6 | CRM, Catalog, Inventory, Suppliers, E-commerce Sync, Dashboards, Reports, Tax Engine, Batch | Part 3 F-K, L-N, O | 5 |
| 7 | Storage Abstraction (Google Drive primary / Supabase fallback), File Security, File Records | Rule 3; Part 9 E/N/O; Added requirement 8 | 2 |
| 8 | Payment Framework Core, Card Security Rules, 3DS Policy, Advanced Card Risk, Routing, Super Admin API Console | Part 4 A1/L, Part 11 D/H; Added requirements 4, 6, 7 | 2, 4 |
| 9 | 16 Processor Adapters, NMI Dual Mode, Advanced Capabilities, Sandbox Validation | Part 4 A2-A8; Added requirements 1, 2, 3 | 8 |
| 10 | Checkout Design, Payment Experience, Wallet, MoR, Payouts, Disputes, Consent Evidence, Subscriptions, BNPL | Part 4 B-M | 9 |
| 11 | Client Portal, Token Checkout Page, Tokenized Access, Email Journey, Tenant Branding, White-label, Document Integrity | Part 5 A-L | 10 |
| 12 | Universal SMTP/Email, WhatsApp, Social, Public API v1, Webhooks, Integrations, Support, Channel Transparency | Part 2 B, Part 6 A-K | 11 |
| 13 | Payroll, HR, Expenses, Double-entry Accounting, Tax Liability and Remittance, Financial Statements, Reports | Part 8 A-M | 12 |
| 14 | Super Admin Console, CMS, Blog, SEO, Analytics, Marketing, Growth, Platform Intelligence, Trust Publishing | Part 7 A-M, Part 11 A/B/D/E; Part 9 S | 13 |
| 15 | Deep Security, Privacy Experience, Deception and Anomaly, Compliance, Fraud, Tracking, Zero Trust/Zero Tolerance, Conflict and Duplicate Finalization | Part 9 A-S, Part 11 B-M | 14 |
| 16 | Deployment, CI/CD, Cron, Docs, PWA Security, Performance, Backup/DR, Launch Readiness | Part 10 A-J, Part 9 J/M | 15 |

Steps run strictly in order. Parallelism is not allowed because shared modules
(storage, money, audit, approval, routing) must exist before consumers.

## 2. What each step must produce

Every step produces, at minimum:

1. Code files with `// path:` header, TypeScript strict, no `any`.
2. SQL migrations with matching `_down.sql` rollback, idempotent.
3. RLS enabled on every new table with default-deny policy.
4. Zod schemas for client and server validation.
5. Audit log entry for every mutation.
6. UI with loading, error, empty and success states, mobile at 320px,
   dark mode, WCAG 2.1 AA, i18n strings in `lib/i18n/strings/en.ts`.
7. `.env.example` updates for every new variable.
8. `docs/handoffs/CHAT_NN_COMPLETED.md` handoff.
9. A green run of `npm run verify` (see `04_DEFINITION_OF_DONE_AND_GATES.md`).

## 3. Migration timestamp windows (collision-proof)

Each step owns a timestamp window. Never use a timestamp outside your window.

| Step | Window |
| --- | --- |
| 1 | 20260101000000 - 20260101999999 |
| 2 | 20260116000000 - 20260116999999 |
| 3 | 20260201000000 - 20260201999999 |
| 4 | 20260216000000 - 20260216999999 |
| 5 | 20260301000000 - 20260301999999 |
| 6 | 20260316000000 - 20260316999999 |
| 7 | 20260401000000 - 20260401999999 |
| 8 | 20260416000000 - 20260416999999 |
| 9 | 20260501000000 - 20260501999999 |
| 10 | 20260516000000 - 20260516999999 |
| 11 | 20260601000000 - 20260601999999 |
| 12 | 20260616000000 - 20260616999999 |
| 13 | 20260701000000 - 20260701999999 |
| 14 | 20260716000000 - 20260716999999 |
| 15 | 20260801000000 - 20260801999999 |
| 16 | 20260816000000 - 20260816999999 |

## 4. Critical path and risk order

Hard dependencies that must never be reordered:

- Money type system (`lib/utils/currency.ts`, decimal.js) -> every step from 5.
- Audit ledger and hash chain (step 2) -> every mutation step.
- Encryption and key vault (step 2) -> steps 7, 8, 9, 12.
- Tenant context and RLS helpers (step 2) -> every data step.
- Approval engine (step 4) -> steps 5, 6, 10, 13, 14.
- Storage abstraction (step 7) -> steps 4 (KYC), 5 (attachments), 10 (evidence).
- Adapter base and registry (step 8) -> step 9 -> step 10.
- Token engine (step 11) -> step 12 (email links) -> step 13 (payslip links).
- Currency/FX freeze (step 5) -> step 10 (MoR settlement) -> step 13 (reports).

## 5. Definition of a completed step

A step is complete only when all of the following are true:

- All sub-steps in `08_SUBSTEP_CHECKLISTS.md` for that step are checked.
- `npm run verify` passes with zero errors and zero warnings.
- Migrations apply and roll back cleanly on a fresh database.
- RLS coverage report shows every table has a policy.
- Handoff document exists and lists files, migrations, env vars, decisions.
- The step's own gates in `04_DEFINITION_OF_DONE_AND_GATES.md` are recorded.

## 6. Continuation protocol

- Each chat may run out of context. The resume rule is: read the last handoff,
  read the step's sub-step checklist, find the first unchecked sub-step, and
  continue from there. Never re-implement an existing file.
- Never modify a completed step's behaviour to make a later step easier;
  extend it through the append protocol in `03_FILE_OWNERSHIP_MATRIX.md`.
- Every chat ends by writing the handoff even if the step is unfinished.

## 7. Revision 2 additions (checkout, tax, security and usability modernization)

Revision 2 only adds. The twenty absolute rules, requirements A1 to A10 and
every Revision 1 sub-step keep full force. Placement, ownership boundaries,
gates and the no-conflict table live in `09_REVISION_2_ADDITIONS.md`; the
normative requirements are sections A11 to A15 of
`05_ADDITIONAL_REQUIREMENTS_SPEC.md`; the work orders are the single canonical
list in `08_SUBSTEP_CHECKLISTS.md`.

Added scope by step:

| Step | Added scope |
| --- | --- |
| 1 | Web hardening primitives (Trusted Types, COOP, COEP, CORP, Permissions-Policy, Clear-Site-Data, SRI); usability primitives (saved views, undo, autosave, explainability message) |
| 2 | Envelope keys per tenant with rotation and crypto-shredding; secret registry |
| 3 | Passkeys and hardware keys; trusted devices and device centre; session registry, rotating refresh, self-service freeze |
| 4 | Approval inbox; SSO and SCIM enterprise access, IP allowlist, just-in-time access, break-glass; owner security centre; message delivery event log |
| 5 | Editor experience: autosave, undo, saved views, explainability |
| 6 | Tax core, tax determination engine, tax documents and tax reporting |
| 8 | 3DS2 exemptions and network tokenization; card-testing detection, authorization holds, processor fraud-tool adapter |
| 9 | Per-processor advanced capability integration with documented evidence |
| 10 | Checkout design system, content and trust layer, edge cases and retry, technical hardening; MoR tax hold; chargeback auto-defence |
| 11 | Token checkout composition; client explainability and delivery transparency view |
| 12 | Messaging transparency and compliance console |
| 13 | Tax liability ledger, remittance workflow, filing operations and filing calendar |
| 14 | Trust and transparency publishing (security.txt, disclosure, transparency report, sub-processor list, DPA, accessibility statement) |
| 15 | Privacy dashboard, consent ledger, residency selection, appeal path; deception, anomaly and log integrity; SBOM and provenance |
| 16 | PWA security: biometric app lock, encrypted offline queue, push alert channel |

Migration windows are unchanged; new tables and policies are created inside the
owning step's existing window.

## 8. Expected chat usage per step

The plan defines sixteen steps, presented as sixteen chat prompts. A step with
more sub-steps may need more than one chat:

| Step | Expected chats | Reason |
| --- | --- | --- |
| 1, 3, 4, 6, 10, 13 | 1 to 3 | Largest scope; continue with the same prompt using the resume instruction |
| 2, 5, 7, 8, 9, 11, 12, 14, 15, 16 | 1 to 2 | Medium to large scope; continue with the same prompt if needed |

The step count never changes and no work is duplicated; the resume instruction
in each prompt continues from the first unchecked sub-step.
