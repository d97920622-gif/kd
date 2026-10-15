// path: docs/PLAN/08_SUBSTEP_CHECKLISTS.md
# Sub-step Work Orders (all 16 steps)

Each line is one commit. `[ ]` becomes `[x]` in
`docs/handoffs/CHAT_NN_PROGRESS.md` as the sub-step passes its gates.
Target paths are the expected primary files; extra files are allowed only
inside the area owned by the step.

## STEP 01 -- Foundation, Governance, Design System, Layout Architecture

- [ ] 1.1 Toolchain: `package.json`, `tsconfig.json` (strict, noImplicitAny, strictNullChecks, noUnusedLocals, noUnusedParameters), `next.config.js`, `tailwind.config.ts`, `.eslintrc.json`, `.prettierrc`, `.gitignore`, `.env.example`, `components.json`, husky hooks, lint-staged
- [ ] 1.2 Quality gates: `scripts/check-*.sh` (english-only, no-todo, no-coming-soon, no-tests, path-comment, no-console, forbidden-brands, migration-pairs, rls-coverage, schema-standards, dead-links, secrets, any-types, money-math) plus `npm run verify`
- [ ] 1.3 Core libraries: `lib/logger/structured-logger.ts`, `lib/errors/*`, `lib/env/*`, `lib/utils/currency.ts` (decimal.js, USD only), `lib/utils/date.ts`, `lib/utils/formatting.ts`, `lib/utils/slug.ts`, `lib/utils/hash.ts`, `lib/i18n/strings/en.ts`
- [ ] 1.4 Design tokens: `styles/globals.css`, `config/design-tokens.ts`, spacing, radius, shadow, z-index, typography, motion tokens, dark mode, high contrast, reduced motion, design token JSON export
- [ ] 1.5 Brand system: `components/branding/*`, logo variants, favicon pack 16/32/180/192/512, apple touch icon, PWA manifest icons, default OG image, brand voice guide, asset library page
- [ ] 1.6 shadcn/ui base set: `components/ui/*` with four states, form primitives with React Hook Form and Zod resolver, toast, sheet, dialog, table, tabs, tooltip, skeleton
- [ ] 1.7 Layouts and shells: public, auth, dashboard, admin, client portal layouts; `components/layout/*` sidebar, topbar, mobile drawer, bottom nav, sticky action bar, breadcrumbs, footer, offline banner
- [ ] 1.8 Navigation: `config/nav-map.ts` single source with reserved growth blocks, role filter hook, command palette, keyboard shortcuts page, dead-link checker wiring
- [ ] 1.9 Page states and polish: skeleton library, error boundary, empty state, success states, 320px utilities, accessibility primitives, Framer Motion providers, page transitions, stagger, confetti, illustration baseline
- [ ] 1.10 Public site skeleton with real English copy: homepage, about, features, pricing, contact, industries, calculators, free invoice generator shell, terms, privacy, blog shell, 404, 500, offline
- [ ] 1.11 Platform plumbing: `middleware.ts`, `instrumentation.ts`, security headers and CSP nonce baseline, sitemap and robots baseline, metadata baseline, print stylesheet
- [ ] 1.12 Governance: `.github/workflows/ci.yml`, CODEOWNERS, PR template, CONTRIBUTING, SECURITY, CHANGELOG, LICENSE, ADR-0001 to ADR-0005, README update, `docs/handoffs/CHAT_01_COMPLETED.md`

## STEP 02 -- Database Foundation, Migrations, RLS, Encryption, Audit Ledger

- [ ] 2.1 Migration framework: runner, ordering, checksums, up and down pairs, seeds runner, `npm run db:migrate`, `npm run db:rollback`
- [ ] 2.2 DB primitives: extensions, `uuid_generate_v7()`, `set_updated_at()`, universal column helper, `check-schema-standards.sql`
- [ ] 2.3 Tenancy tables: companies, company_settings, company_members, user_profiles, platform_users, invitations, devices, sessions
- [ ] 2.4 Access tables: roles, permissions, role_permissions, user_roles, login_attempts, login_lock_state
- [ ] 2.5 Platform tables: plans, plan_features, subscriptions, entitlements, coupons, coupon_redemptions, feature_flags
- [ ] 2.6 Reference tables: countries, currencies, tax_jurisdictions, timezones with read-only policies
- [ ] 2.7 RLS framework: `current_company_id()`, `current_role_name()`, default-deny policies, tenant isolation policies, isolation assertion SQL, isolation fuzz SQL
- [ ] 2.8 Audit ledger: audit_logs, sequence numbers, hash chain, Ed25519 signatures, immutability rules, audit triggers, verification function, merkle roots, export
- [ ] 2.9 Encryption core: `lib/encryption/aes-256-gcm.ts`, `key-vault.ts`, `key-rotation.ts`, blind index, PII redaction, secret storage helper, benchmark doc
- [ ] 2.10 Concurrency primitives: idempotency middleware and table, optimistic lock, pessimistic lock, advisory lock, leader lock, duplicate detector base, request_logs, rate_limits
- [ ] 2.11 Governance data: data_classification, retention policies, dsar tables, soft delete and restore helpers, backup metadata
- [ ] 2.12 Seeds and types: plans, permissions, countries, currencies, tax presets, super_admin bootstrap, `types/database.ts` generation, handoff

## STEP 03 -- Authentication, 2FA, Session, Login Lock, VPN/Proxy/Tor

- [ ] 3.1 Supabase clients and middleware auth, session cookie policy, session id rotation on login, session timeout configuration
- [ ] 3.2 Signup: Turnstile, honeypot, email verification, disposable email blocklist, VPN and proxy and Tor block, signup rate limits, audit
- [ ] 3.3 Login lock engine: two consecutive failures lock 2 hours, DB-persisted counters, reset blocked while locked, password change does not unlock, owner email alert, unlock workflow with owner contact confirmation and audit, generic error messages, IP rate limit
- [ ] 3.4 2FA TOTP: enrollment with QR, verification, 10 one-time backup codes, recovery, mandatory per role, step-up helper for sensitive actions
- [ ] 3.5 OAuth: Google and GitHub, encrypted token storage, account linking rules, session fixation prevention, new device alerts, session revoke and device list
- [ ] 3.6 Password controls: policy minimum 12 chars with complexity, HIBP k-anonymity check, history of last 5, reset flow that honors the lock
- [ ] 3.7 Network trust: `lib/security/vpn-proxy-detector.ts`, `ip-reputation.ts`, geo rules, corporate IP whitelist, enforcement matrix for signup, login, payment, KYC, admin
- [ ] 3.8 Auth surfaces: API routes with Zod, sanitization, CSRF, audit; auth pages login, signup, forgot, reset, verify email, 2FA, locked account, session list, security settings with four states and a11y; handoff

## STEP 04 -- Roles, Permissions, Approval Engine, Onboarding, Settings, KYC, Notifications, Platform Billing

- [ ] 4.1 Roles and permissions: `lib/auth/roles.ts`, `lib/auth/permissions.ts`, `config/permissions.ts`, server and client guards, admin_staff sub-roles, nav role filtering completion
- [ ] 4.2 Approval engine: approval_requests, L1/L2/L3 levels, SLA and auto-escalation, delegation, dual approval, bulk approval, history view, dashboards, audit
- [ ] 4.3 Super admin first-run setup wizard and platform configuration
- [ ] 4.4 Owner onboarding wizard, industry presets, first-run experience, entitlements-aware steps
- [ ] 4.5 Company profile and settings: branding settings, invoice settings, custom domain, tenant security policy, one-click backup
- [ ] 4.6 Team management: staff invites, granular permissions, activity monitoring, staff security controls, staff draft to owner approval workflow
- [ ] 4.7 KYC system: document upload through storage interface, review console, gate map, statuses, re-verification, notifications, audit
- [ ] 4.8 Notifications: in-app center, preferences, event matrix, realtime updates, digest, email dispatch interface for step 12
- [ ] 4.9 Platform billing: plan management, subscription lifecycle, coupons, entitlement engine, dunning, platform invoices and billing UI
- [ ] 4.10 Tenant settings surfaces: gateway configuration shell, payout partner settings with generic naming, security enforcement per role; handoff

## STEP 05 -- Invoicing Core, Documents, PDF Engine, Numbering

- [ ] 5.1 Invoice schema: migrations, RLS, duplicate hash, version, audit trigger, `types/invoice.ts`
- [ ] 5.2 Invoice CRUD: service, API, multi-step form, list and detail, drafts, trash and restore, bulk actions, filters, cursor pagination, mobile card list
- [ ] 5.3 Line items and calculation engine: discounts, taxes, shipping, withholding, rounding policy, decimal only
- [ ] 5.4 Numbering: advisory lock, per-tenant sequence, prefixes, gapless guarantee, concurrency assertion script
- [ ] 5.5 Status machine and workflow: transitions, guards, timeline, activity log, reminder hooks
- [ ] 5.6 Metadata and extras: custom fields, tags, notes, terms, attachments through storage, consent capture hook, duplicate detection
- [ ] 5.7 US professional invoice layout, template set, branding auto-fill, print stylesheet
- [ ] 5.8 PDF engine: server-side React-PDF, immutable snapshot archive, hash, watermark, signed download, CSV and Excel export
- [ ] 5.9 Documents: estimates, credit notes, debit notes, proforma, advance and deposit invoices, recurring invoices, installment plans
- [ ] 5.10 Projects and time tracking, billable hours to invoice, batch invoice generation
- [ ] 5.11 Invoice reports: sent versus paid, aging, revenue summary, billing lifecycle hooks; handoff

## STEP 06 -- CRM, Catalog, Inventory, Suppliers, E-commerce Sync, Dashboards, Reports, Tax, Batch

- [ ] 6.1 Client CRM CRUD, profiles, multiple contacts, search and filter, cursor pagination, four states
- [ ] 6.2 Client activity, history, statements, merge, fuzzy duplicate detection, import and export
- [ ] 6.3 Product and service catalog: CRUD, categories, pricing, tax class, SKU uniqueness, fuzzy name duplicate suggestion
- [ ] 6.4 Inventory: warehouses, stock levels, movements, transfers, adjustments, valuation, low stock alerts, row locking
- [ ] 6.5 Suppliers, purchase orders, supplier bills, supplier payments
- [ ] 6.6 E-commerce sync: Shopify adapter, WooCommerce adapter, order to invoice mapping, sync management, idempotency, retries, error log
- [ ] 6.7 Dashboard: revenue overview, sent versus paid, charts, widget layout, customization, drill-downs
- [ ] 6.8 Reports baseline: sales, payment, expense, tax, client, inventory, project; saved views, exports, scheduling, sharing
- [ ] 6.9 Billing lifecycle: reminder engine, late fees and penalties, escalation states, dunning
- [ ] 6.10 Tax: jurisdictions, rates, inclusive and exclusive, reverse charge, VAT and GST, Asia presets, tax reports
- [ ] 6.11 Batch and bulk operations plus FX: batch invoice, bulk actions, batch guard, `lib/fx/exchange-rates.ts` with historical freeze for display; handoff

## STEP 07 -- Storage Abstraction, File Security, File Records

- [ ] 7.1 `files` table, `storage_provider`, company integration flags, provider capabilities
- [ ] 7.2 Adapter base and Google Drive adapter: service account OAuth2, per-tenant folders, resumable upload, quota monitoring
- [ ] 7.3 Supabase Storage adapter, runtime provider resolver, automatic failover, provider health checks
- [ ] 7.4 Encryption pipeline: AES-256-GCM before upload, per-tenant key derivation, key version tags, zero-knowledge notes
- [ ] 7.5 Upload pipeline: magic bytes, MIME and extension cross-check, size limits per type, zip bomb and polyglot detection, EXIF and GPS strip, image re-encode, SVG sanitize or rasterize, PDF JavaScript removal, Office macro removal, ClamAV hook, quarantine, quota, rate limit, chunking, client and server hash check, content hash duplicate detection
- [ ] 7.6 Download pipeline: short-lived signed URLs, watermarking with tenant id, access audit, download rate limit, hotlink prevention
- [ ] 7.7 Lifecycle: retention policy enforcement, archival, deletion and restore, legal hold
- [ ] 7.8 Provider migration tool: plan, move, verify checksum, switch provider, audit, resume after failure
- [ ] 7.9 Module integration and media: invoice attachments, KYC documents, branding assets, payslips, evidence packs, exports; AVIF and WebP derivatives, thumbnails, srcset
- [ ] 7.10 Storage admin surfaces: owner usage view, admin quarantine console, migration console, usage reports; handoff

## STEP 08 -- Payment Framework Core, Card Rules, 3DS Policy, Routing, Super Admin API Console

- [ ] 8.1 Adapter base interface, capability union, mode enum, shared result types, error mapping contract
- [ ] 8.2 Registry: `lib/payment/registry.ts` append-only with implemented processors only, processor metadata, per-processor config schema
- [ ] 8.3 Payment domain schema: payment_intents, payments, gateway_transactions, refunds, webhook_events, payment_reviews, idempotency
- [ ] 8.4 Shared server payment module and `lib/payment/http-client.ts` with timeouts, retries, SSRF guard, PII-safe logging
- [ ] 8.5 Card rules engine: no PAN path, same card and same invoice 24-hour block, two authentication failures block the token for 24 hours, balance failures excluded, blacklist by token or fingerprint, decline logging, manual review queue
- [ ] 8.6 3DS policy engine: request 3DS, postal code and IP country match rule, evidence storage, manual review routing
- [ ] 8.7 Velocity limits: `config/payment-limits.ts`, card and IP attempt counters, window enforcement, alerting
- [ ] 8.8 Routing engine: rules, priority, capability and KYC gating, abort when no rule matches, never failover, decision log
- [ ] 8.9 Webhook framework: signature verification per processor, timestamp tolerance, replay protection, event id deduplication, idempotent processing, retry handling
- [ ] 8.10 Super admin API console: encrypted credential store, masked display with last four and environment and updated time, connection test, enable and disable, adapter-exists guard, step-up 2FA and re-verification, mode selector with single active mode and test-before-switch, audit entries, UI
- [ ] 8.11 Fraud engine core: risk scoring, blacklists, blocklists, AML and sanctions hooks, review queue UI, audit; handoff

## STEP 09 -- 16 Processor Adapters, NMI Dual Mode, Sandbox Validation

- [ ] 9.1 Documentation protocol: fetch current official docs per processor, write `docs/PROVIDERS/<provider>.md` with URLs, versions, auth model, payload shapes, webhook signature method, sandbox facts, fetch date
- [ ] 9.2 Shared server module completion used by every adapter over the provider REST API, with amount as decimal string and USD only
- [ ] 9.3 Stripe adapter: payment intents, hosted checkout, webhooks, refunds, Connect hooks for MoR
- [ ] 9.4 PayPal standalone adapter (Orders v2) and Braintree adapter
- [ ] 9.5 Paddle adapter: checkout, subscriptions, webhooks, sandbox base URL and credentials
- [ ] 9.6 NMI adapter: Collect.js default mode with single-use 24-hour token, Payment Component mode with the npm request recorded for the integrator, both paths through the shared server module, token expiry handling
- [ ] 9.7 Authorize.Net adapter: hosted fields, transaction API, webhooks, sandbox
- [ ] 9.8 Adyen adapter: checkout, webhooks, MarketPay hooks
- [ ] 9.9 Verifone (2Checkout) adapter and BlueSnap adapter
- [ ] 9.10 Square adapter and Payoneer adapter with capability matrix per account type
- [ ] 9.11 FastSpring adapter and PayPro Global adapter with test-mode handling and IPN simulator validation
- [ ] 9.12 Payarc/PaymentCloud adapter and Rapyd adapter
- [ ] 9.13 Custom adapter: owner-defined HTTPS gateway, JSON-driven config, SSRF-guarded, configurable signature scheme
- [ ] 9.14 Sandbox validation per processor: recorded calls, observed results, evidence files, mode selection proof
- [ ] 9.15 Registry and console wiring: implemented processors registered, connectable in admin console, capability and mode matrix surface, `docs/PROVIDERS/INDEX.md`, corrections applied to `06_PROVIDER_DOCS_REGISTRY.md`; handoff

## STEP 10 -- Payment Experience, Wallet, MoR, Payouts, Disputes, Consent Evidence, Subscriptions, BNPL

- [ ] 10.1 Payment orchestration: initiate, confirm, capture, void, receipt, notification, status machine
- [ ] 10.2 Checkout experience: hosted and embedded, payment page security with VPN checks and fingerprint and Turnstile, mobile wallet priority, four states
- [ ] 10.3 Payment links: create, share, expiry, revoke, analytics
- [ ] 10.4 Pluggable integration modes UI: iframe, SDK, redirect, API per capability
- [ ] 10.5 Refunds: full and partial, approval flow, reasons, evidence, reconciliation
- [ ] 10.6 Partial payments, allocation, credit application
- [ ] 10.7 Surcharge and fees: fee calculator, platform fee, net settlement, fee reporting
- [ ] 10.8 Wallet: balances, ledger, serializable isolation, top-up, withdrawal, holds, statements, negative balance protection
- [ ] 10.9 MoR engine: merchant of record flow, KYC-gated routing, settlement batches, payout engine, payout approvals with step-up, payout partner generic naming, payout reconciliation
- [ ] 10.10 Disputes: chargeback handling, ten-part evidence pack, auto-submit per processor format, deadline tracker, reason code mapping, win and loss analytics, reserve calculator, rate monitoring
- [ ] 10.11 Consent evidence: capture with timestamp and IP and fingerprint and versions, immutable text snapshot, delivery proof, timeline builder, audit chain export
- [ ] 10.12 Client subscriptions: plans, recurring billing engine, management UI, dunning
- [ ] 10.13 BNPL and installment financing framework with schedules and reporting
- [ ] 10.14 Payment reports and analytics, PCI DSS posture document, payment audit trail; handoff

## STEP 11 -- Client Portal, Tokenized Access, Email Journey, Branding, White-label, Document Integrity

- [ ] 11.1 Token engine: HMAC-SHA256 128-bit, per-document links, plan-based expiry, revoke, re-issue, optional email OTP gate, no PII in URLs, masked in logs, leak alerts, noindex, rate limit
- [ ] 11.2 Client pages: invoice view, payment, estimate approval, receipt view and download, client hub, contract sign, expired and invalid pages
- [ ] 11.3 Client email journey: invoice, reminders, receipts, statements, dunning, delivery tracking, duplicate send guard, per-tenant sender
- [ ] 11.4 Tenant branding: logo, colors, fonts, email skin, auto-apply, live preview, per-document overrides
- [ ] 11.5 White-label: platform brand removal, custom domain plan gating, email domain, DNS and SSL guidance
- [ ] 11.6 Form and data safety UX: validation, autosave, unsaved changes guard, double submit guard, PII masking
- [ ] 11.7 Document integrity and workflow: immutable snapshots, hash verification on view, e-signature capture and evidence, staff draft to owner send, bulk email workflow
- [ ] 11.8 Quality and lifecycle UX: client data quality, industry presets and templates, tenant lifecycle and growth UX, mobile and print polish; handoff

## STEP 12 -- Universal SMTP, WhatsApp, Social, Public API v1, Webhooks, Integrations, Support

- [ ] 12.1 SMTP adapter layer: Resend, SendGrid, SES, Mailgun, Postmark, generic SMTP; platform configuration; tenant BYO SMTP with verification; DKIM, SPF and DMARC checks; queue with retry and backoff; bounce and complaint handling; email log; deliverability dashboard
- [ ] 12.2 Email templates: React Email set for every transactional event, versioning, per-tenant branding, preview and test send
- [ ] 12.3 WhatsApp: Meta Cloud API client, WABA configuration, encrypted credentials, template manager, send API, automation rules, bulk campaigns, delivery and read tracking, inbound reply webhook, consent and compliance
- [ ] 12.4 Social automation: connections with encrypted tokens, seven platform adapters, composer, calendar, scheduler, auto-post rules, evergreen queue, approval flow, analytics, in-app sharing
- [ ] 12.5 Public REST API v1: keys and scopes, endpoints, rate limits, cursor pagination, idempotency, OpenAPI spec, docs page, developer portal, sandbox keys, usage analytics
- [ ] 12.6 Outbound webhooks: subscriptions, HMAC signing, retries, dead letter, delivery logs
- [ ] 12.7 Integrations: Zapier, Make, Chrome extension, Plaid and Salt Edge bank feeds, transaction import, smart reconciliation, receipt OCR with Google Vision, contracts and e-signature, multi-channel messaging engine with routing and fallback
- [ ] 12.8 Support: help center, ticket system with SLA, feedback and NPS, canned responses, agent assignment
- [ ] 12.9 Data migration and import wizard with duplicate preview, mapping, validation, audit; handoff

## STEP 13 -- Payroll, HR, Expenses, Double-entry Accounting, Statements, Reports

- [ ] 13.1 Payroll core: employee profiles, pay structures, allowances and deductions, tax calculation per jurisdiction, pay runs with approval, payslips, duplicate detection
- [ ] 13.2 Payroll finance: payout integration, accounting integration, reports and compliance documents, employee self-service portal over token links
- [ ] 13.3 HR lite: org structure, onboarding and offboarding checklists, performance notes, leave management
- [ ] 13.4 Expenses: CRUD, receipt capture with OCR, categories, policies, approvals, recurring, reimbursements, reports, duplicate hash detection
- [ ] 13.5 Accounting core: chart of accounts templates, accounts, manual journal entries, posting rules, duplicate detection on post
- [ ] 13.6 Automated journals from invoices, payments, expenses, payroll and assets; period locks; trial balance; audit trail
- [ ] 13.7 Financial statements: profit and loss, balance sheet, cash flow, equity, comparatives, drill-down, export
- [ ] 13.8 Bank reconciliation accounting-grade: statement import, matching engine, rules, unmatched queue, reconciliation reports
- [ ] 13.9 Fixed assets and depreciation; budgets and variance; multi-book and multi-entity with consolidation; accounting standards config
- [ ] 13.10 Period management and close checklist, tax filing preparation, tax reports, accounting audit features
- [ ] 13.11 Financial intelligence: cash flow forecasting, BI dashboards, fifteen plus reports with scheduling and sharing; handoff

## STEP 14 -- Super Admin Console, CMS, SEO, Analytics, Marketing, Growth, Intelligence

- [ ] 14.1 Admin dashboard, user management, tenant management, time-limited audited impersonation, admin communication
- [ ] 14.2 Plan, subscription and coupon administration, revenue analytics, monetization, entitlement administration
- [ ] 14.3 CMS editor for every public page, blog management, legal pages, email template manager, status page and incidents, media library
- [ ] 14.4 SEO: eight JSON-LD schema types, metadata and OG generation, sitemap and robots, SEO audits, search engine verification, redirects
- [ ] 14.5 Analytics and pixels: GA4, GTM, Meta Pixel with CAPI, TikTok, LinkedIn, X, Clarity, Pinterest; consent gating; pixel manager; in-app analytics
- [ ] 14.6 Conversion: A/B testing framework, trust signals, conversion tools, lead magnets, calculators, full free invoice generator
- [ ] 14.7 Marketing automation: campaigns, drip sequences, lead scoring, lead generation, lifecycle, win-back
- [ ] 14.8 Platform intelligence and engineering: revenue analytics, tenant intelligence, platform health, background job console, config management, feature flags
- [ ] 14.9 Monitoring, alerting and incident response: rules, channels, deduplication, escalation, on-call roster, runbooks, SLO and error budget
- [ ] 14.10 Audit console: viewer, search, export, SIEM forwarders for Splunk, Elastic, Datadog, CloudWatch, Sentinel and Chronicle; user behaviour analytics; insider threat; tamper alerts; growth and retention tools; handoff

## STEP 15 -- Deep Security, Compliance, Fraud, Tracking, Zero Trust, Conflict and Duplicate Finalization

- [ ] 15.1 Tenant isolation hardening: RLS audit, cross-tenant 404 policy, storage isolation, IDOR sweep, isolation fuzz, RLS performance optimization
- [ ] 15.2 Encryption and secrets hardening: encrypted field inventory, blind index coverage, key rotation drill, environment validation, secret access audit, bundle secret scanner, PII redaction, backup encryption
- [ ] 15.3 Application security sweep: SQL injection, XSS, CSRF, SSRF, CSP with nonce and Trusted Types, headers and HSTS, CORS, open redirect, mass assignment, prototype pollution, ReDoS, path traversal, header injection, null byte, NFC normalization, zero-width and RTL removal
- [ ] 15.4 Bot and abuse prevention: rate limit matrix, brute force backoff, Turnstile coverage, honeypots, fingerprint reuse detection, headless detection, traffic anomaly, auto-suspend, payload and zip bomb guards, coupon and referral abuse, account takeover and session hijack detection, insider threat rules
- [ ] 15.5 Fraud engine completion: scoring, AML and sanctions screening with weekly re-screening cron, transaction monitoring, case management, blacklists, review queue, analytics
- [ ] 15.6 Network trust completion: VPN, proxy, Tor, datacenter and residential proxy detection, IP reputation, geo fences, country blocks, admin whitelist, enforcement matrix across signup, login, payment, KYC and admin
- [ ] 15.7 Compliance: GDPR, CCPA, PDPA and other jurisdictions, DSAR handler, consent manager, classification, retention enforcement, residency and sovereignty, cross-border transfer rules, jurisdiction configuration, audit exports
- [ ] 15.8 Supply chain and CI security: SCA, SAST, DAST, secret scanning, container scanning, IaC scanning, SBOM, dependency policy
- [ ] 15.9 Observability and incident response: Sentry with PII scrubbing, RUM, synthetic monitoring, database, payment, email, WhatsApp and storage monitors, cron dead man switch, SSL, domain and DNS monitors, alert routing, incident workflow, DR plan with drill and RTO and RPO validation
- [ ] 15.10 Conflict and duplicate finalization: all fifteen conflict and duplicate implementations verified as code in `services/`, typed errors, audit entries, UI resolution paths, concurrency assertion scripts, leader locks for every cron
- [ ] 15.11 Performance and database engineering: Core Web Vitals, bundle budget, media pipeline, caching and ISR, index coverage audit, query timeouts, N+1 sweep, cursor pagination everywhere
- [ ] 15.12 Zero Trust and Zero Tolerance finalization: device, network, user and transaction trust scores, adaptive MFA, just-in-time and just-enough access, break glass procedure, automated responses with appeal path, posture dashboard, penetration test log; handoff

## STEP 16 -- Deployment, CI/CD, Cron, Docs, PWA, Performance, Backup/DR, Launch

- [ ] 16.1 Netlify production configuration, headers and redirects, ISR and caching, edge functions, environment management, preview deploys, domain and SSL, Cloudflare WAF and TLS and HSTS and DNSSEC, SPF and DKIM and DMARC, Turnstile keys per environment
- [ ] 16.2 Docker and VPS alternative: Dockerfile, compose for app, database, cache and proxy, health checks, self-host runbook, parity notes
- [ ] 16.3 CI/CD: ci workflow, security workflow with SAST, DAST, SCA and secret scanning, deploy workflow with migrations and rollback, release process, changelog automation, branch protection and CODEOWNERS enforcement
- [ ] 16.4 Cron jobs: all twenty jobs implemented, leader-locked, monitored, with a registry, console and dead man switch
- [ ] 16.5 Monitoring launch: Sentry releases and source maps, uptime monitoring, status page, alert channels, log aggregation, dashboards, on-call, published runbooks
- [ ] 16.6 Documentation and governance: README, CONTRIBUTING, SECURITY, CHANGELOG, LICENSE, ERD, ADR set, RUNBOOKS, API.md, DEVOPS.md, SECURITY_MODEL.md, COMPLIANCE.md, data flow diagrams, engineering onboarding guide, handoff index
- [ ] 16.7 PWA and UX polish: manifest, service worker, offline page, install prompt, splash, offline detection, audit sweep of page states, 320px, dark mode, accessibility, motion polish
- [ ] 16.8 Performance: Lighthouse budget enforcement, bundle analysis, image pipeline, fonts, caching, HTTP/3, Brotli, index audit, N+1 audit, load test procedures documented, performance report
- [ ] 16.9 Backup, DR and lifecycle: backup scripts for database and storage, restore drills, RTO and RPO validation, offsite encrypted backups, tenant offboarding with export and delete, data portability, downgrade rules, cost optimization, release and launch checklists, launch war room, thirty-day post-launch plan
- [ ] 16.10 Final audit and sign-off: full checklist sign-off, penetration test remediation verification, zero critical dependencies, traceability matrix finalized at 3,950 features with zero unmapped, completion statement; handoff
