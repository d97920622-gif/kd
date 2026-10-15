// path: docs/PLAN/01_REQUIREMENTS_TRACEABILITY.md
# Requirements Traceability Matrix

Purpose: prove that nothing from `MASTER_PROMPT.md`, `FEATURE_LIST.md` and the
added requirements is dropped. Each row names the owning step. A step may
extend another step's output only through the append protocol.

## 1. FEATURE_LIST.md parts mapped to steps

| Part | Feature count | Sections | Owning step(s) |
| --- | --- | --- | --- |
| Part 1 Core Foundation and Branding | 375 | A Branding and design system, B layout architecture, C responsive, D page states, E navigation integrity, F accessibility, G public site, H content completeness, I visual excellence, J design QA, K illustration and media, L footer and shared, M print and export | Step 1 |
| Part 2 Auth, Onboarding and Settings | 391 | A authentication system | Step 3 |
| Part 2 | | B universal SMTP (platform and tenant) | Step 12 (interface created in Step 4) |
| Part 2 | | C onboarding, D company profile and settings, E team management, F KYC, G custom domain, H notifications, I platform billing and subscriptions, J gateway settings, K tenant security policy, L one-click backup | Step 4 |
| Part 3 Invoicing and Business Core | 476 | A invoicing core, B US professional invoice, C server-side PDF engine, D estimates and other documents, E project and time billing, L reports, M billing lifecycle | Step 5 |
| Part 3 | | F client CRM, G product and service catalog, H inventory and warehouse, I suppliers and purchase orders, J e-commerce integrations, K dashboard, N tax and compliance, O batch and bulk operations | Step 6 |
| Part 4 Payment, Gateway and MoR | 423 | A1 gateway architecture, L2 payment fraud prevention (payment-side), L3 payment audit | Step 8 |
| Part 4 | | A2 Stripe, A3 PayPal, A4 Paddle, A5 NMI, A6 Rapyd, A7 Adyen, A8 custom gateway, plus the nine additional processors (Verifone, Braintree, BlueSnap, Square, Payoneer, FastSpring, PayPro Global, Payarc/PaymentCloud, Authorize.Net) | Step 9 |
| Part 4 | | B payout partners, C payment processing and experience, D payment links and hosted checkout, E digital wallets, F virtual wallet and MoR, G merchant of record, H chargeback and dispute, I consent evidence, J client subscriptions, K BNPL, L1 PCI DSS, M payment reports | Step 10 |
| Part 5 Client Experience and Branding | 275 | A tokens, B client pages, C email journey, D tenant branding, E white-label, F form and data safety, G document integrity, H owner-only send, I collections and dunning UX, J industry presets, K tenant lifecycle UX, L client data quality | Step 11 |
| Part 6 WhatsApp, Social, API and Integrations | 413 | A WhatsApp automation, B social media automation, C in-app sharing, D public REST API and webhooks, E integration ecosystem, F bank feed and reconciliation, G OCR, H contracts and e-sign, I multi-channel messaging, J support and help, K data migration and import | Step 12 |
| Part 7 Super Admin, SEO, Analytics and Marketing | 445 | A super admin overview and user management, B plan and subscription admin, C CMS and content, D SEO depth, E analytics and pixels, F conversion optimization, G marketing automation, H platform first-run setup, I entitlement and monetization, J legal and trust pages, K platform intelligence, L platform engineering, M SaaS growth and retention | Step 14 (H setup wizard shell in Step 4) |
| Part 8 Payroll, HR, Accounting and Reports | 356 | A payroll, B HR, C expenses, D double-entry accounting, E financial statements, F bank reconciliation, G fixed assets, H budgets, I multi-book, J periods and close, K tax filing, L audit features, M financial intelligence | Step 13 |
| Part 9 Security, Compliance and Performance | 296 | A multi-tenant isolation, B encryption and secrets, K database engineering, L concurrency, R edge cases | Steps 2 and 15 |
| Part 9 | | C application security, D bot and abuse prevention, G privacy and GDPR/CCPA/PDPA | Step 15 |
| Part 9 | | E file upload security, N storage abstraction, O media optimization | Step 7 |
| Part 9 | | F token and link security | Step 11 |
| Part 9 | | H supply chain and CI security, M Netlify runtime reality, J performance budget | Steps 15 and 16 |
| Part 9 | | I webhook security, P Asia-centric features, Q enterprise and B2B | Steps 3, 4, 6, 8, 10, 12, 15 |
| Part 9 | | S observability and incident, T delivery quality gate | Steps 14 and 16 |
| Part 10 Deploy, CI/CD and Final Polish | 150 | A deploy and hosting, B cron job list, C delivery quality gate, D documentation, E observability, F domain and email infrastructure, G customer lifecycle and offboarding, H release and cost ops, I final polish, J innovative differentiators | Step 16 |
| Part 11 Enhanced Security, Roles and Zero Trust | 425 | A roles and global approval engine | Step 4 |
| Part 11 | | B file upload security deep dive | Steps 7 and 15 |
| Part 11 | | C immutable audit and SIEM | Steps 2 and 14 |
| Part 11 | | D fraud security deepening | Steps 8 and 15 |
| Part 11 | | E data governance and compliance, F supply chain, G monitoring and incident, H VPN and IP security, I input security, K user tracking, L zero trust and zero tolerance, M conflict and duplicate prevention | Step 15 |
| Part 11 | | J chargeback and refund documentation | Step 10 |

## 2. Added requirements mapped to steps

| Added requirement | Owning step | Implementation anchor |
| --- | --- | --- |
| 1. Read the processor's current official documentation in-session before writing adapter code; never code from memory | Step 9 | `docs/PLAN/06_PROVIDER_DOCS_REGISTRY.md`, `docs/PROVIDERS/*.md` |
| 2. Sixteen processors, one adapter file each, one registry file, sandbox verified | Steps 8 and 9 | `lib/payment/adapters/*.ts`, `lib/payment/registry.ts` |
| 3. NMI two front-end modes, Collect.js default, Payment Component via integrator-owned npm request, one shared server module over NMI REST API, single active mode, test before switch, audit each switch | Steps 8 and 9 | `lib/payment/adapters/nmi.ts`, `services/payment/nmi-mode-manager.ts`, admin console |
| 4. Super admin can connect any processor API from the dashboard (store, test, enable, disable) without doc changes or redeploy, encrypted AES-256-GCM with env master key, masked after save, test must pass before enable, no processor without adapter code, no failover when routing rules do not match | Step 8 | `app/(admin)/gateways/`, `services/payment/gateway-credentials.ts`, `lib/payment/routing.ts` |
| 5. Login lock: two consecutive wrong password or 2FA attempts lock the account for 2 hours, correct password still blocked, password reset blocked, password change does not unlock, owner email alert, unlock only by authorized admin after confirming email contact with owner, every unlock audited, counters and lock state persisted in database, IP rate limit, no account existence leakage | Step 3 | `services/auth/login-lock.ts`, `services/auth/unlock-workflow.ts` |
| 6. Card payment rules: card data only in processor hosted fields, no PAN/CVV/keypress capture, one successful card payment per invoice then same card blocked 24h for that invoice only, two authentication failures on a card token in 24h then reject third attempt, insufficient-balance failures excluded, reject blacklisted cards by token or processor fingerprint, velocity limits in config, USD numeric(18,4), no JS Number math | Steps 8 and 10 | `services/payment/card-rules.ts`, `lib/payment/velocity.ts`, `config/payment-limits.ts` |
| 7. Request 3DS on every payment where available; when 3DS is not completed allow only if billing postal code and payer IP country both match invoice data; otherwise hold for manual review; VPN, proxy, Tor checks on the payment page; webhooks accepted only with verified signature and processed idempotently | Steps 8 and 10 | `services/payment/three-ds-policy.ts`, `app/api/webhooks/*` |
| 8. Text and accounting data always in Supabase Postgres; files to Google Drive when the company linked it, otherwise Supabase Storage; AES-256-GCM before upload; `storage_provider` recorded per file; decision at runtime per company; automatic failover when a provider is unavailable; migration tool to move files between providers | Step 7 | `lib/storage/adapters/*`, `services/storage/provider-resolver.ts`, `services/storage/migration-tool.ts` |
| Branch policy: `integration` is the long-lived mainline | Step 1 onward | `docs/PLAN/07_BRANCH_AND_GIT_WORKFLOW.md` |

## 3. Absolute rules mapped to enforcement

| Rule | Enforcement artefact | Step |
| --- | --- | --- |
| English only | `scripts/check-english-only.sh`, ESLint `no-restricted-syntax`, documented exemption for the owner-supplied `FEATURE_LIST.md` | 1 |
| USD only, numeric(18,4), no Number money | `lib/utils/currency.ts`, ESLint rule against Number in money paths, DB check constraints | 1, 2, 5 |
| Storage policy | Step 7 adapters and resolver | 7 |
| No tests | `scripts/check-no-tests.sh` | 1 |
| No TODO or Coming Soon | `scripts/check-no-todo.sh`, `scripts/check-no-coming-soon.sh` | 1 |
| No `any` | `tsconfig.json` strict, ESLint `no-explicit-any` as error | 1 |
| No console.log | ESLint `no-console` as error, structured logger only | 1 |
| Path comment | `scripts/check-path-comment.sh` | 1 |
| Universal columns | `scripts/check-schema-standards.sql` | 2 |
| RLS default deny | `scripts/check-rls-coverage.sql` | 2 |
| Audit on every mutation | audit triggers plus service-level entries, verified by query | 2 |
| Zod on every API | `schemas/` plus route wrapper | 1, 2 |
| Sanitization | `lib/security/sanitizer.ts` | 1, 15 |
| Idempotency | `lib/middleware/idempotency.ts`, `idempotency_keys` | 2, 8 |
| Optimistic locking | `services/base/optimistic-lock.ts` | 2 |
| Roles and approval chain | `config/permissions.ts`, `lib/auth/approval-engine.ts` | 4 |
| Payment partner naming | `scripts/check-forbidden-brands.sh` | 1 |
| Zero Trust and Zero Tolerance | `lib/security/zero-trust.ts`, enforcement matrix | 15 |
| VPN and proxy blocking | `lib/security/vpn-proxy-detector.ts`, enforcement matrix | 3, 15 |

## 4. Excluded features (must NOT exist anywhere)

- QR business card module: no route, no table, no component.
- AI provider layer: no OpenAI, Claude, Gemini or similar integration.
- `accountant`, `affiliate`, `reseller` roles: absent from every enum,
  permission matrix and UI.
- Automated test files of any kind.

## 5. Feature accounting rule

Each step handoff must list, per FEATURE_LIST section, the features completed
and any feature explicitly deferred to a later step with its destination step.
At Step 16 the final audit sums all sections and must reach 3,950 features
with zero unmapped features. Any deferral not recorded in this matrix is a
defect.
