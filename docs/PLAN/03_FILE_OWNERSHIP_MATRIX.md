// path: docs/PLAN/03_FILE_OWNERSHIP_MATRIX.md
# File Ownership Matrix (duplicate and conflict prevention)

Rule: a file has exactly one owning step. Other steps may read it, import it
and extend it only through the append protocol in section 3.

## 1. Ownership by area

| Area | Path | Owning step |
| --- | --- | --- |
| Toolchain, lint, verify scripts | `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `.eslintrc.json`, `.prettierrc`, `components.json`, `scripts/*` | 1 |
| Design system, tokens, brand | `styles/*`, `components/ui/*`, `components/branding/*`, `config/design-tokens.ts` | 1 |
| Layouts, navigation, states | `app/(public)/layout.tsx`, `app/(auth)/layout.tsx`, `app/(dashboard)/layout.tsx`, `app/(admin)/layout.tsx`, `app/(client-portal)/layout.tsx`, `config/nav-map.ts`, `components/layout/*`, `components/shared/*` | 1 |
| i18n strings, logger, errors, env schema | `lib/i18n/strings/en.ts`, `lib/logger/*`, `lib/errors/*`, `lib/env/*`, `lib/utils/*` | 1 |
| DB primitives, RLS helpers, audit ledger, encryption core, locking, idempotency | `migrations/20260116*`, `lib/supabase/*`, `lib/encryption/*`, `lib/security/audit-log.ts`, `lib/security/hash-chain.ts`, `services/base/*`, `lib/middleware/idempotency.ts`, `lib/middleware/tenant.ts` | 2 |
| Auth, login lock, 2FA, sessions, VPN detection | `app/(auth)/*`, `app/api/auth/*`, `lib/auth/*` (except approval and permissions), `lib/security/vpn-proxy-detector.ts`, `lib/security/device-fingerprint.ts`, `services/auth/*` | 3 |
| Roles, permissions, approval engine, onboarding, settings, KYC UI, notifications, platform billing | `lib/auth/roles.ts`, `lib/auth/permissions.ts`, `lib/auth/approval-*.ts`, `config/permissions.ts`, `config/plans.ts`, `app/api/approvals/*`, `app/api/team/*`, `app/api/kyc/*`, `app/api/settings/*`, `services/approval/*`, `services/notification/*`, `services/kyc/*`, `services/entitlement/*`, `components/onboarding/*`, `components/settings/*` | 4 |
| Invoicing, documents, PDF | `app/api/invoices/*`, `app/api/estimates/*`, `app/api/pdf/*`, `services/invoice/*`, `services/estimate/*`, `services/pdf/*`, `lib/pdf/*`, `schemas/invoice.ts`, `components/invoice/*`, `components/pdf/*`, `pdf-templates/*`, `types/invoice.ts` | 5 |
| CRM, catalog, inventory, suppliers, e-commerce, dashboards, reports | `app/api/clients/*`, `app/api/products/*`, `app/api/inventory/*`, `app/api/suppliers/*`, `app/api/reports/*`, `services/client/*`, `services/product/*`, `services/inventory/*`, `services/supplier/*`, `lib/integrations/shopify.ts`, `lib/integrations/woocommerce.ts`, `components/charts/*`, `components/tables/*` | 6 |
| Storage, file security, media | `lib/storage/*`, `services/storage/*`, `app/api/storage/*`, `app/api/export/*`, `app/api/import/*` (file side) | 7 |
| Payment framework, card rules, 3DS policy, routing, API console | `lib/payment/adapters/base.ts`, `lib/payment/registry.ts`, `lib/payment/routing.ts`, `lib/payment/velocity.ts`, `lib/payment/http-client.ts`, `config/payment-limits.ts`, `config/payment-methods.ts`, `services/payment/card-rules.ts`, `services/payment/three-ds-policy.ts`, `services/payment/gateway-credentials.ts`, `app/(admin)/gateways/*`, `app/api/webhooks/_verify/*`, `lib/security/fraud-engine.ts` | 8 |
| Processor adapters | `lib/payment/adapters/<provider>.ts` (one file per processor), `services/payment/providers/<provider>-service.ts`, `docs/PROVIDERS/<provider>.md` | 9 |
| Payment experience, wallet, MoR, payouts, disputes, consent, subscriptions, BNPL | `services/payment/*` (except card rules, 3DS, providers), `services/wallet/*`, `services/mor/*`, `services/payout/*`, `services/dispute/*`, `services/subscription/*`, `services/consent/*`, `app/api/payments/*`, `app/api/wallet/*`, `app/api/payouts/*`, `app/api/disputes/*`, `app/(dashboard)/wallet/*`, `components/payment/*` | 10 |
| Client portal, tokens, client emails, tenant branding, white-label | `app/(client-portal)/*`, `lib/auth/tokens.ts`, `services/token/*`, `components/client/*`, `services/branding/*`, `emails/*` (client journey templates) | 11 |
| SMTP adapters, WhatsApp, social, public API, integrations, support | `lib/email/*`, `lib/whatsapp/*`, `lib/social/*`, `lib/multi-channel/*`, `app/api/public/v1/*`, `app/api/webhooks/whatsapp/*`, `app/api/support/*`, `services/email/*`, `services/webhook/*`, `services/support/*`, `docs/API.md`, `docs/openapi/*` | 12 |
| Payroll, HR, expenses, accounting, statements, reports | `app/api/payroll/*`, `app/api/accounting/*`, `app/api/expenses/*`, `services/payroll/*`, `services/accounting/*`, `services/hr/*`, `services/expense/*`, `services/report/*`, `lib/pdf/payslip-pdf.tsx`, `lib/pdf/report-pdf.tsx` | 13 |
| Admin console, CMS, SEO, analytics, marketing, platform intelligence, audit console | `app/(admin)/*` (except gateways), `app/api/admin/*`, `services/cms/*`, `services/seo/*`, `lib/seo/*`, `lib/analytics/*`, `services/audit/*` (viewer), `lib/security/siem-forwarder.ts`, `services/marketing/*`, `components/admin/*`, `components/marketing/*` | 14 |
| Security hardening, compliance, zero trust, conflict and duplicate finalization | `lib/security/*` (except files owned by 3, 8, 14), `lib/compliance/*`, `services/duplicate/*`, `docs/SECURITY_MODEL.md`, `docs/COMPLIANCE.md` | 15 |
| Deploy, CI, cron, docs, PWA, performance | `netlify.toml`, `docker/*`, `.github/workflows/*`, `cron/*`, `workers/*`, `public/manifest.json`, `public/sw.js`, `instrumentation.ts`, `middleware.ts`, `docs/**` (final), `scripts/backup.sh`, `scripts/restore.sh`, `scripts/deploy.sh` | 16 |

## 2. Single-source-of-truth modules (never duplicate)

| Concern | One implementation | Notes |
| --- | --- | --- |
| Money | `lib/utils/currency.ts` with decimal.js | No other file may define money helpers |
| FX rates and freeze | `lib/fx/exchange-rates.ts` (step 6) | Display conversion only |
| Sanitization | `lib/security/sanitizer.ts` | Extended by step 15, never re-created |
| Logger | `lib/logger/structured-logger.ts` | No direct console usage anywhere |
| Errors | `lib/errors/*` | One class per error code |
| Audit write | `lib/security/audit-log.ts` | Steps call it, never insert directly |
| Tenant resolution | `lib/middleware/tenant.ts` | Every API route uses it |
| Rate limit | `lib/middleware/rate-limit.ts` | Config in `config/rate-limits.ts` |
| Idempotency | `lib/middleware/idempotency.ts` | Payments and webhooks mandatory |
| RLS helpers | `migrations/20260116*` SQL functions | `current_company_id()`, `current_role_name()` |
| Encryption | `lib/encryption/aes-256-gcm.ts`, `lib/encryption/key-vault.ts` | No local crypto implementations |
| Storage access | `lib/storage/upload.ts`, `lib/storage/download.ts` | No direct Drive or Storage SDK calls elsewhere |
| Gateway HTTP | `lib/payment/http-client.ts` | Timeouts, retries, SSRF guard |
| Approval requests | `lib/auth/approval-engine.ts` | Never a parallel approval path |
| Notifications | `services/notification/notification-service.ts` | All modules emit through it |
| Contract/config values | `config/*` | No hardcoded limits inside modules |

## 3. Append protocol (extending another step's file)

Allowed only when a later step must register itself into a shared registry:

1. Add, never rewrite. Keep existing exports and signatures unchanged.
2. Add a new array entry or a new export. Do not reorder existing entries.
3. Never change a completed migration. Create a new migration in your window.
4. Update `config/nav-map.ts` by adding entries in the step section comment
   block reserved for navigation growth.
5. Update `lib/i18n/strings/en.ts` by adding new keys only; never edit or
   delete existing keys.
6. Record the extension in the handoff: file, reason, added exports.

Files explicitly designed for appends: `config/nav-map.ts`,
`lib/i18n/strings/en.ts`, `lib/payment/registry.ts`,
`lib/payment/adapters/base.ts` (capability union), `config/permissions.ts`,
`cron/registry.ts`, `.env.example`, `lib/security/siem-forwarder.ts`.

## 4. Forbidden duplicates

Never create: a second currency util, a second sanitizer, a second logger,
a second storage client, a second payment registry, a second approval path,
a second audit writer, a second rate limiter, a second idempotency layer,
a second token generator. If something similar exists, extend it.

## 5. Revision 2 ownership additions and explicit exceptions

Exceptions below override the general rows in section 1.

| Path | Owner | Exception reason |
| --- | --- | --- |
| `lib/auth/sso/*`, `lib/auth/enterprise-access/*` | Step 4 | `lib/auth/*` belongs to Step 3, except approval, permissions and these enterprise access modules |
| `lib/auth/webauthn.ts`, `lib/auth/trusted-device.ts`, `services/auth/device-service.ts`, `services/auth/session-service.ts` | Step 3 | Authentication and session trust |
| `components/security/*`, `app/(dashboard)/settings/security/*` | Step 4 | Owner security centre and enterprise access UI |
| `components/privacy/*`, `app/(dashboard)/settings/privacy/*` | Step 15 | Privacy experience, consent ledger, residency |
| `lib/encryption/envelope.ts`, `lib/security/secret-registry.ts` | Step 2 | Key management and secret registry |
| `services/tax/*`, `config/tax/*`, `app/api/tax/*` | Step 6 | Determination, rates, tax classes, tax documents, tax reporting |
| `services/accounting/tax-remittance/*`, `app/api/accounting/tax-remittance/*` | Step 13 | Liability ledger, periods, returns, remittance, filing |
| `services/payment/checkout/*`, `components/payment/*` | Step 10 | Checkout state, payment page logic and design system |
| `app/(client-portal)/*`, `components/client/*` | Step 11 | Token routes and client pages that compose the Step 10 checkout |
| `lib/payment/tokenization.ts`, `services/payment/three-ds-policy.ts`, `lib/payment/card-testing-detector.ts`, `lib/payment/velocity.ts` | Step 8 | Card acceptance, exemptions, tokenization, risk |
| `services/notification/message-log-service.ts` and its table | Step 4 | Single message delivery event log for every channel |
| `components/shared/explainability-message.tsx`, `lib/hooks/use-saved-views.ts`, `lib/hooks/use-undo.ts`, `lib/hooks/use-autosave.ts` | Step 1 | Single usability primitives used by every module |
| `lib/security/deception/*` | Step 15 | Honeytokens, canaries and anomaly baselines |
| `public/sw.js`, `public/manifest.json`, push subscription module | Step 16 | PWA shell, offline queue and push |

Consumers may import these modules and call their exported functions. They may
not copy their logic, create a second implementation, or write to their tables
directly. The Revision 2 boundary table in
`09_REVISION_2_ADDITIONS.md` section 2 is binding.
