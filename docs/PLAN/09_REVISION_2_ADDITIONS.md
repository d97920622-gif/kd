// path: docs/PLAN/09_REVISION_2_ADDITIONS.md
# Revision 2 Additions -- Placement, Boundaries and Gates

Status: normative. Read together with `05_ADDITIONAL_REQUIREMENTS_SPEC.md`
sections A11 to A15 (what must be true) and `08_SUBSTEP_CHECKLISTS.md` (the
work orders, which are the single canonical sub-step list).

Rules of this revision:

- Revision 2 only ADDS. Nothing in Revision 1 is removed, relaxed or renamed.
- The twenty absolute rules and added requirements A1 to A10 keep full force.
- No new step is created. Everything is placed inside the existing sixteen
  steps so the chat count stays sixteen.
- Every new sub-step is one commit, exactly like every existing sub-step.
- Migration windows do not change. New tables and policies are created inside
  the owning step's existing window.
- If an instruction in this file ever appears to conflict with a Revision 1
  file, the stricter reading wins and the conflict is recorded in an ADR.

## 1. Step scope after Revision 2

| Step | Title after Revision 2 | Added scope |
| --- | --- | --- |
| 1 | Foundation, Governance, Design System, Layout Architecture | Web hardening primitives incl. Trusted Types, COOP, COEP, CORP, Permissions-Policy, Clear-Site-Data, SRI; usability primitives incl. saved views, undo, autosave, explainability message component |
| 2 | Database Foundation, Migrations, RLS, Encryption, Audit Ledger | Envelope key management per tenant, key usage audit, key rotation, crypto-shredding; centralized secret registry |
| 3 | Authentication, 2FA, Passkeys, Session Registry, Login Lock, VPN/Proxy/Tor | Passkeys and hardware keys, trusted devices and device centre, session registry, rotating refresh tokens, mid-session change detection, self-service account freeze |
| 4 | Roles, Permissions, Approval Engine, Approval Inbox, Enterprise Access, Onboarding, Settings, KYC, Notifications, Platform Billing | SSO and SCIM enterprise access, tenant IP allowlist, just-in-time access, break-glass with dual approval, owner security centre, approval inbox, message delivery event log |
| 5 | Invoicing Core, Documents, PDF Engine, Numbering, Editor Experience | Autosave, undo, saved views, explainability messages on invoice actions |
| 6 | CRM, Catalog, Inventory, Suppliers, E-commerce Sync, Dashboards, Reports, Tax Engine, Batch | Tax profiles, determination engine, versioned rates, tax documents and tax reporting |
| 7 | Storage Abstraction, File Security, File Records | unchanged |
| 8 | Payment Framework Core, Card Rules, 3DS Policy, Advanced Card Risk, Routing, Super Admin API Console | Network tokenization, 3DS2 exemptions, card-testing detection, authorization holds, processor fraud-tool adapter |
| 9 | 16 Processor Adapters, NMI Dual Mode, Advanced Capabilities, Sandbox Validation | Per-processor tokenization, exemption, risk-tool and hold capability integration |
| 10 | Checkout Design, Payment Experience, Wallet, MoR, Payouts, Disputes, Consent Evidence, Subscriptions, BNPL | Full checkout design system, content and trust layer, edge cases and retry, monetary transparency, MoR tax hold, chargeback auto-defence |
| 11 | Client Portal, Token Checkout Page, Tokenized Access, Email Journey, Branding, White-label, Document Integrity | Token-gated checkout composition, client explainability and support view |
| 12 | Universal SMTP, WhatsApp, Social, Public API v1, Webhooks, Integrations, Support, Channel Transparency | Messaging transparency and compliance console |
| 13 | Payroll, HR, Expenses, Double-entry Accounting, Tax Liability and Remittance, Statements, Reports | Tax liability ledger, tax periods and returns, remittance workflow, filing calendar, accountant pack, platform SaaS tax |
| 14 | Super Admin Console, CMS, SEO, Analytics, Marketing, Growth, Intelligence, Trust Publishing | security.txt, vulnerability disclosure, transparency report, sub-processor list, DPA page, accessibility statement |
| 15 | Deep Security, Privacy Experience, Deception and Anomaly, Compliance, Fraud, Zero Trust, Conflict and Duplicate Finalization | Privacy dashboard, consent ledger, residency selection, appeal path, honeytokens, per-tenant baselines, log integrity verification, WORM export, SBOM and provenance |
| 16 | Deployment, CI/CD, Cron, Docs, PWA Security, Performance, Backup/DR, Launch | Biometric app lock, encrypted offline queue, push alert channel |

## 2. Hardware boundaries that prevent duplicate or conflicting code

These boundaries are binding. A file or behaviour listed on the right side may
never be implemented again on the left side.

| Area | Single owner | Consumers (read and call only) |
| --- | --- | --- |
| Checkout component set, checkout state, payment page logic | Step 10, `components/payment/*`, `services/payment/checkout/*`, `app/api/payments/*` | Step 11 composes it inside the token route with tenant branding; Step 9 supplies the processor presentation modes |
| Token route and client pages | Step 11, `app/(client-portal)/*`, `components/client/*` | Step 10 exposes checkout API only; Step 12 supplies message delivery |
| Tax determination, tax rates, tax classes, tax documents and tax reporting | Step 6, `services/tax/*`, `config/tax/*`, `app/api/tax/*` | Step 5 invoice calculation calls the tax service; Step 10 checkout calls the tax service for the tax line; Step 13 reads tax data for returns |
| Tax liability ledger, tax periods, returns, remittance, filing, evidence | Step 13, `services/accounting/tax-remittance/*`, `app/api/accounting/tax-remittance/*` | Step 10 MoR settlement reads the liability owner flag; Step 6 never moves money |
| Tax hold inside merchant-of-record settlement | Step 10, `services/mor/*` | Step 13 reconciles the held amount against the liability ledger |
| Tax reversal on refund, credit note, chargeback | Step 6 service call (determination and reversal rules) invoked by Step 10 refund flow | No direct tax row edits from Step 10 |
| Envelope keys, key rotation, crypto-shredding, secret registry | Step 2, `lib/encryption/*`, `lib/security/secret-registry.ts` | Steps 7, 8, 12 call the key vault API only |
| Passkeys and device trust | Step 3, `lib/auth/webauthn.ts`, `lib/auth/trusted-device.ts`, `services/auth/device-service.ts` | Step 4 step-up helper calls it for elevated actions |
| Enterprise access SSO, SCIM, IP allowlist, JIT, break-glass | Step 4, `lib/auth/sso/*`, `lib/auth/enterprise-access/*` | Step 14 shows platform-level status only |
| Tenant security centre UI | Step 4, `components/security/*`, `app/(dashboard)/settings/security/*` | Step 15 links to it, never duplicates it |
| Privacy experience, consent ledger, residency, appeal path | Step 15, `components/privacy/*`, `app/(dashboard)/settings/privacy/*` | Step 4 links to it from the security centre |
| Message delivery event log for every channel | Step 4, `services/notification/message-log-service.ts` and its table | Step 11 reads it for the client view; Step 12 appends channel writers through the append protocol and owns the admin transparency console |
| Explainability message component and string catalogue | Step 1, `components/shared/explainability-message.tsx`, `lib/i18n/strings/en.ts` | Steps 5, 10, 11, 12 supply context values only |
| Saved views, undo, autosave engines | Step 1, `lib/hooks/use-saved-views.ts`, `lib/hooks/use-undo.ts`, `lib/hooks/use-autosave.ts` | Steps 5, 6, 13 apply them to their modules |
| Service worker, offline shell, install prompt, push | Step 16, `public/sw.js`, `public/manifest.json` | Step 1 owns layout shells only and never registers a service worker |
| Network tokenization and 3DS2 exemptions | Step 8, `lib/payment/tokenization.ts`, `services/payment/three-ds-policy.ts` | Step 9 implements per-processor capability; Step 10 consumes the result only |
| Card acceptance decisions, velocity, blacklist | Step 8, `services/payment/card-rules.ts`, `lib/payment/velocity.ts` | Step 9 and Step 10 never re-implement acceptance rules |

Ordering note that avoids an impossible dependency: the message delivery event
log is created in Step 4 (highest consumer is the notification module), so
Step 11 can read it and Step 12 can extend it later. Nothing in Step 11 depends
on a Step 12 table. The message delivery event log lives in sub-step 4.17
(segment 4C).

## 3. New sub-steps by step (canonical detail lives in 08)

| Step | New or reordered sub-steps | Focus |
| --- | --- | --- |
| 1 | 1.26, 1.27 (segment 1D) | Web hardening primitives; usability primitives |
| 2 | 2.10, 2.11 | Envelope keys and rotation; secret registry |
| 3 | 3.14, 3.17, 3.18 (segments 3C and 3D) | Passkeys; trusted devices and device centre; session registry and freeze |
| 4 | 4.5, 4.21, 4.22, 4.23 (segments 4A and 4D) | Approval inbox; enterprise access; owner security centre |
| 5 | 5.12 | Editor experience: autosave, undo, saved views, explainability |
| 6 | 6.24 to 6.28 (segment 6D) | Tax core; determination engine; tax documents and reporting |
| 8 | 8.7, 8.8 | 3DS2 exemptions and network tokenization; advanced card risk and holds |
| 9 | 9.14 | Per-processor advanced capability integration |
| 10 | 10.1 to 10.10 (segment 10A) | Checkout shell and design system; content and trust; edge cases and retry; technical hardening |
| 11 | 11.3, 11.10 | Token checkout composition; client explainability and support |
| 12 | 12.8 | Messaging transparency and compliance console |
| 13 | 13.30, 13.32, 13.33 (segment 13D) | Tax liability ledger; remittance workflow; filing operations |
| 14 | 14.11 | Trust and transparency publishing |
| 15 | 15.8, 15.9 | Privacy experience; deception, anomaly and log integrity |
| 16 | 16.8 | PWA security and local data protection |

## 3A. Revision 3 sub-step numbering

Steps 1, 3, 4, 6, 10 and 13 were divided further in Revision 3 and are now
executed as four segments each (1A to 1D and so on). The sub-step numbers in
this file are the Revision 3 numbers and match
`08_SUBSTEP_CHECKLISTS.md`; segment rules are in `10_SEGMENT_GUIDE.md`. Steps
2, 5, 7, 8, 9, 11, 12, 14, 15 and 16 keep their Revision 2 numbering.

## 4. Execution notes for heavy steps

Steps 1, 3, 4, 6, 10 and 13 carry more sub-steps than one chat usually fits and
are therefore executed as four segments each (see `10_SEGMENT_GUIDE.md`):

- One chat executes one segment and stops at that segment gate.
- The step prompt stays the same; paste the same file again in a new chat.
- The new chat reads `docs/handoffs/CHAT_NN_PROGRESS.md`, finds the first
  unchecked sub-step of the next segment, and continues there. No sub-step is
  repeated and no file is written twice.

## 5. Gates added by Revision 2

| Gate | Applies to | Evidence required |
| --- | --- | --- |
| Checkout renders with tenant branding and no platform branding on entitled plans, at 320px, dark mode, WCAG AA, LCP under 2.5s and CLS under 0.1 | Step 10, Step 11 | Lighthouse run and a rendering checklist recorded in the handoff |
| Checkout shows subtotal, discount, tax line and total with no hidden charge, and the tax line equals the Step 6 determination result | Step 10 | Query comparison recorded in the handoff |
| Card data never enters our DOM or server: verified by a DOM and network assertion that card fields live only in processor frames | Step 10 | Assertion script output |
| Tax collected is segregated: the Tax Payable balance equals tax collected minus tax remitted at every reconciliation point | Step 6, Step 10, Step 13 | Ledger assertion query |
| A tax return cannot be marked filed without an approved remittance record containing method, authority reference, date and proof | Step 13 | Workflow assertion |
| Every automated security block has an appeal path and a notification, and every containment action is audited | Step 15 | Audit query and UI evidence |
| Crypto-shredding removes tenant data keys and renders ciphertext unreadable | Step 2, Step 15 | Restore attempt showing the data is not readable |
| Passkey and hardware key registration and verification work alongside TOTP without weakening the login lock | Step 3 | Flow evidence plus lock behaviour retest |
| Service worker never caches PII or payment data, and offline queue is encrypted | Step 16 | Cache inspection and queue storage inspection |
| No new duplicate implementation exists: the boundary table in section 2 is satisfied | All steps | Ownership check recorded per handoff |

## 6. Checklist before starting any chat after Revision 2

1. Read `05_ADDITIONAL_REQUIREMENTS_SPEC.md` sections A11 to A15.
2. Read this file, especially the boundary table for the current step.
3. Read the current step's section in `08_SUBSTEP_CHECKLISTS.md`.
4. Confirm the sub-step you are about to write is not already owned by another
   step in `03_FILE_OWNERSHIP_MATRIX.md`.
5. Implement, verify, commit, and update the progress file.
