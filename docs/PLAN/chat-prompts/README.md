// path: docs/PLAN/chat-prompts/README.md
# Chat Prompts Index

How to use: open a new chat for the step you are on, open the matching file
below, and paste everything between its BEGIN PASTE and END PASTE markers.
Each prompt is self-sufficient: it names the files to read, the scope, the
sub-steps, the rules, the gates, the commit policy and the handoff duty.

| Chat | File | Step title | Prerequisite |
| --- | --- | --- | --- |
| 1 | `CHAT_01.md` | Foundation, governance, design system, layout architecture | none |
| 2 | `CHAT_02.md` | Database foundation, migrations, RLS, encryption, audit ledger | 1 |
| 3 | `CHAT_03.md` | Authentication, 2FA, session, login lock, VPN/proxy/Tor | 2 |
| 4 | `CHAT_04.md` | Roles, permissions, approval engine, onboarding, settings, KYC, notifications, platform billing | 3 |
| 5 | `CHAT_05.md` | Invoicing core, documents, PDF engine, numbering | 4 |
| 6 | `CHAT_06.md` | CRM, catalog, inventory, suppliers, e-commerce sync, dashboards, reports, tax, batch | 5 |
| 7 | `CHAT_07.md` | Storage abstraction, file security, file records | 2 (run after 6) |
| 8 | `CHAT_08.md` | Payment framework core, card rules, 3DS policy, routing, super admin API console | 2, 4 |
| 9 | `CHAT_09.md` | 16 processor adapters, NMI dual mode, sandbox validation | 8 |
| 10 | `CHAT_10.md` | Payment experience, wallet, MoR, payouts, disputes, consent evidence, subscriptions, BNPL | 9 |
| 11 | `CHAT_11.md` | Client portal, tokenized access, email journey, branding, white-label, document integrity | 10 |
| 12 | `CHAT_12.md` | Universal SMTP, WhatsApp, social, public API v1, webhooks, integrations, support | 11 |
| 13 | `CHAT_13.md` | Payroll, HR, expenses, double-entry accounting, statements, reports | 12 |
| 14 | `CHAT_14.md` | Super admin console, CMS, SEO, analytics, marketing, growth, intelligence | 13 |
| 15 | `CHAT_15.md` | Deep security, compliance, fraud, tracking, zero trust, conflict and duplicate finalization | 14 |
| 16 | `CHAT_16.md` | Deployment, CI/CD, cron, docs, PWA, performance, backup/DR, launch | 15 |

## If a step does not finish in one chat

Paste the same file again in a new chat. Its final RESUME INSTRUCTION section
tells the agent to read `docs/handoffs/CHAT_NN_PROGRESS.md` and continue from
the first unchecked sub-step, so no work is repeated and no file is written
twice.

## Reminders for every chat

- Paste only one step prompt per chat. Do not combine steps.
- Never let a chat touch files owned by another step except through the
  append protocol in `docs/PLAN/03_FILE_OWNERSHIP_MATRIX.md`.
- The chat must commit per sub-step and must end with a handoff document.
