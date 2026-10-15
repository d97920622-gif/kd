// path: docs/PLAN/chat-prompts/README.md
# Chat Prompts Index

Before the first chat, read `docs/PLAN/11_USAGE_HANDBOOK.md` for the one-time
branch setup (`integration` as mainline and default branch) and the per-chat
loop. Every prompt now begins with a BASE BRANCH CHECK that stops the chat if it
was started from a branch without the completed work.

How to use: open a new chat for the step you are on, open the matching file
below, and paste everything between its BEGIN PASTE and END PASTE markers.
Each prompt is self-sufficient: it names the files to read, the scope, the
sub-steps, the rules, the gates, the commit policy and the handoff duty.

| Chat | File | Step title | Prerequisite |
| --- | --- | --- | --- |
| 1 | `CHAT_01.md` | Foundation, governance, design system, layout architecture | none |
| 2 | `CHAT_02.md` | Database foundation, migrations, RLS, encryption, audit ledger | 1 |
| 3 | `CHAT_03.md` | Authentication, 2FA, passkeys, session registry, login lock, VPN/proxy/Tor | 2 |
| 4 | `CHAT_04.md` | Roles, permissions, approval engine, approval inbox, enterprise access, onboarding, settings, KYC, notifications, platform billing | 3 |
| 5 | `CHAT_05.md` | Invoicing core, documents, PDF engine, numbering, editor experience | 4 |
| 6 | `CHAT_06.md` | CRM, catalog, inventory, suppliers, e-commerce sync, dashboards, reports, tax engine, batch | 5 |
| 7 | `CHAT_07.md` | Storage abstraction, file security, file records | 2 (run after 6) |
| 8 | `CHAT_08.md` | Payment framework core, card rules, 3DS policy, advanced card risk, routing, super admin API console | 2, 4 |
| 9 | `CHAT_09.md` | 16 processor adapters, NMI dual mode, advanced capabilities, sandbox validation | 8 |
| 10 | `CHAT_10.md` | Checkout design, payment experience, wallet, MoR, payouts, disputes, consent evidence, subscriptions, BNPL | 9 |
| 11 | `CHAT_11.md` | Client portal, token checkout page, tokenized access, email journey, branding, white-label, document integrity | 10 |
| 12 | `CHAT_12.md` | Universal SMTP, WhatsApp, social, public API v1, webhooks, integrations, support, channel transparency | 11 |
| 13 | `CHAT_13.md` | Payroll, HR, expenses, double-entry accounting, tax liability and remittance, statements, reports | 12 |
| 14 | `CHAT_14.md` | Super admin console, CMS, SEO, analytics, marketing, growth, intelligence, trust publishing | 13 |
| 15 | `CHAT_15.md` | Deep security, privacy experience, deception and anomaly, compliance, fraud, tracking, zero trust, conflict and duplicate finalization | 14 |
| 16 | `CHAT_16.md` | Deployment, CI/CD, cron, docs, PWA security, performance, backup/DR, launch | 15 |

## If a step does not finish in one chat

Paste the same file again in a new chat. Its final RESUME INSTRUCTION section
tells the agent to read `docs/handoffs/CHAT_NN_PROGRESS.md` and continue from
the first unchecked sub-step, so no work is repeated and no file is written
twice.

## Permission gated work rhythm

Every prompt instructs the agent to work one sub-step at a time and to stop after
each one with `DONE`, `NEXT` and `CONTINUE?`. The owner types `continue` for the
next sub-step or `stop` to close the chat. When the chat closes, it prints
`STATUS`, `NEXT` and `MERGE`; the owner types `merge` to have the work merged
into `integration`. Nothing runs without the owner's permission.

## Segment model for the heavy steps

Each prompt covers its whole step. Steps 1, 3, 4, 6, 10 and 13 are divided into
four segments, and a chat executes exactly one segment:

| Step | Segments | Sub-steps | Chats |
| --- | --- | --- | --- |
| 1 | 1A to 1D | 1.1 to 1.32 | 4 |
| 3 | 3A to 3D | 3.1 to 3.22 | 4 |
| 4 | 4A to 4D | 4.1 to 4.24 | 4 |
| 6 | 6A to 6D | 6.1 to 6.30 | 4 |
| 10 | 10A to 10D | 10.1 to 10.32 | 4 |
| 13 | 13A to 13D | 13.1 to 13.34 | 4 |
| all other steps | single segment | as listed in the prompt | 1 to 2 |

Rules: execute one segment, run the segment gate, update
`docs/handoffs/CHAT_NN_PROGRESS.md` and `CHAT_NN_COMPLETED.md`, state the
segment status line, then stop. Paste the same prompt again for the next
segment. Full rules are in `docs/PLAN/10_SEGMENT_GUIDE.md`.

## Revision 2 note

Every prompt carries an ADDED IN REVISION 2 block that points to
`docs/PLAN/09_REVISION_2_ADDITIONS.md`. That file lists the added sub-steps for
the step and the ownership boundaries that prevent duplicate or conflicting
code. Steps 1, 3, 4, 6, 10 and 13 are split into four segments each; paste the
same prompt again and follow its RESUME INSTRUCTION and segment rules.

## Reminders for every chat

- Paste only one step prompt per chat. Do not combine steps.
- Never let a chat touch files owned by another step except through the
  append protocol in `docs/PLAN/03_FILE_OWNERSHIP_MATRIX.md`.
- The chat must commit per sub-step and must end with a handoff document.
