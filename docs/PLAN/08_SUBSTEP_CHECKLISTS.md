// path: docs/PLAN/08_SUBSTEP_CHECKLISTS.md
# Sub-step Work Orders (all 16 steps) -- Revision 3

Each line is one commit. `[ ]` becomes `[x]` in
`docs/handoffs/CHAT_NN_PROGRESS.md` as the sub-step passes its gates.
Target paths are the expected primary files; extra files are allowed only
inside the area owned by the step.

Revision 3 change log (finer granularity for the six heavy steps):

- Steps 1, 3, 4, 6, 10 and 13 are split into four segments each, marked by
  `### SEGMENT NX` headings, and their sub-steps are divided further so that a
  single sub-step stays small (one commit, one clear deliverable, one gate).
  A chat executes one segment, stops at that segment gate, writes the progress
  and handoff files, and the next chat continues with the following segment
  using the same chat prompt.
- Sub-step numbers for steps 1, 3, 4, 6, 10 and 13 changed because of that
  split. Cross references in `01_REQUIREMENTS_TRACEABILITY.md` and
  `09_REVISION_2_ADDITIONS.md` were updated to the Revision 3 numbers.
- Steps 2, 5, 7, 8, 9, 11, 12, 14, 15 and 16 keep their Revision 2 numbering
  and run as before.
- Segment rules, stop and start conditions are defined in `10_SEGMENT_GUIDE.md`.

Revision 2 change log (see `09_REVISION_2_ADDITIONS.md`):

- Step 1: added 1.12 web hardening primitives and 1.13 usability primitives.
- Step 2: added 2.10 envelope keys and 2.11 secret registry.
- Step 3: added 3.5 passkeys, 3.6 trusted devices, 3.7 session registry.
- Step 4: added 4.3 approval inbox, 4.11 enterprise access, 4.12 owner
  security centre, and the message delivery event log inside 4.9.
- Step 5: added 5.12 editor experience.
- Step 6: added 6.10 tax core, 6.11 determination engine, 6.12 tax documents
  and reporting.
- Step 8: added 8.7 exemptions and tokenization, 8.8 advanced card risk.
- Step 9: added 9.14 per-processor advanced capabilities.
- Step 10: added 10.3 checkout design system, 10.4 content and trust,
  10.5 edge cases and retry, 10.6 technical hardening.
- Step 11: added 11.3 token checkout composition, 11.10 client explainability.
- Step 12: added 12.8 messaging transparency console.
- Step 13: added 13.11 tax liability ledger, 13.12 remittance workflow,
  13.13 filing operations.
- Step 14: added 14.11 trust and transparency publishing.
- Step 15: added 15.8 privacy experience, 15.9 deception and anomaly.
- Step 16: added 16.8 PWA security.
- Steps 7 kept its original numbering.

## STEP 01 -- Foundation, Governance, Design System, Layout Architecture (segments 1A to 1D)

### SEGMENT 1A -- Toolchain and quality gates (expected chat 1 of 4)
- [ ] 1.1 Repository toolchain baseline: `package.json` scripts, `tsconfig.json` strict options (noImplicitAny, strictNullChecks, noUnusedLocals, noUnusedParameters), `next.config.js`, `.prettierrc`, `.gitignore`, husky hooks, lint-staged
- [ ] 1.2 ESLint configuration: `no-explicit-any` as error, `no-console` as error, non-ASCII restricted syntax, import order, React and Next rules
- [ ] 1.3 Tailwind and token pipeline: `tailwind.config.ts`, PostCSS, `components.json`, CSS layer structure
- [ ] 1.4 Environment schema validation: `lib/env/validate-env.ts`, boot-time fail fast, typed environment access, `.env.example` documented entries
- [ ] 1.5 Check scripts A: `check:english-only`, `check:no-todo`, `check:no-coming-soon`, `check:no-tests`, `check:path-comment`
- [ ] 1.6 Check scripts B: `check:no-console`, `check:forbidden-brands`, `check:migration-pairs`, `check:dead-links`, `check:secrets`, `check:any-types`, `check:money-math`
- [ ] 1.7 Verify runner: `npm run verify` aggregation, report format, pre-commit and commit-msg wiring, CI-ready exit codes
Segment gate: every check script runs on the current tree without false positives; all scripts documented in `README.md`.

### SEGMENT 1B -- Core libraries and design system (expected chat 2 of 4)
- [ ] 1.8 Structured logger: JSON lines, levels, correlation id propagation, redaction hook, zero `console` usage
- [ ] 1.9 Error library: typed error classes, error codes, response envelope builder, no internal detail leakage
- [ ] 1.10 USD money utilities: decimal.js wrappers, parse, format, add, subtract, multiply, divide, rounding policy, money-math guard annotation
- [ ] 1.11 Utility set: `date` (UTC), `formatting`, `slug`, `hash` (SHA-256 and HMAC), id helpers
- [ ] 1.12 i18n string catalogue: `lib/i18n/strings/en.ts` structure, key naming, copy rules, no hardcoded UI strings
- [ ] 1.13 Design tokens A: spacing 4/8/12/16/24/32/48/64, radius scale, shadow scale, z-index scale
- [ ] 1.14 Design tokens B: typography scale, color palette with contrast pairs, dark mode, high contrast, reduced motion, motion tokens, token JSON export
- [ ] 1.15 shadcn/ui primitives A: button, input, textarea, label, checkbox, radio group, select, switch
- [ ] 1.16 shadcn/ui primitives B: dialog, sheet, popover, dropdown, tabs, tooltip, toast, table, skeleton, badge
- [ ] 1.17 Form primitives: React Hook Form with Zod resolver, four states, `aria-live` errors, disabled and loading submit
Segment gate: component gallery route renders every primitive in light, dark, high contrast and reduced motion; no hardcoded color or spacing value exists outside tokens.

### SEGMENT 1C -- Brand, layout, navigation (expected chat 3 of 4)
- [ ] 1.18 Brand assets: logo variants light/dark/icon, favicon pack 16/32/180/192/512, apple touch icon, PWA icons, default OG image, brand voice guide
- [ ] 1.19 Layout shells: public and auth layouts with skip links, focus order, print base
- [ ] 1.20 Layout shells: dashboard, admin and client portal layouts with role-aware framing
- [ ] 1.21 Layout components: sidebar, topbar, mobile drawer, bottom navigation, breadcrumbs, footer, offline banner, sticky action bar
- [ ] 1.22 Navigation source: `config/nav-map.ts` with reserved growth blocks, role filter hook, breadcrumb generator, dead-link wiring
- [ ] 1.23 Command palette and keyboard shortcuts page with focus management and ARIA labels
Segment gate: navigation renders correctly for every role; dead-link check passes on the current route set.

### SEGMENT 1D -- States, hardening, public site, governance (expected chat 4 of 4)
- [ ] 1.24 Page-state system: skeleton library, error boundary with retry, empty state with CTA, success state, 320px utilities, accessibility primitives
- [ ] 1.25 Motion and media: Framer Motion providers, page transitions, stagger, confetti, illustration baseline, reduced-motion handling
- [ ] 1.26 Web hardening primitives: Trusted Types policy, COOP, COEP, CORP, Permissions-Policy, Clear-Site-Data on logout, SRI baseline, header matrix tests, `docs/ADR/ADR-0006-web-hardening-baseline.md`
- [ ] 1.27 Usability primitives: `use-saved-views`, `use-undo`, `use-autosave`, optimistic update helpers, explainability message component and string catalogue
- [ ] 1.28 Public site pages A: homepage, features, pricing, about with real English copy and metadata
- [ ] 1.29 Public site pages B: contact, industries, calculators, free invoice generator shell, terms, privacy, blog shell, 404, 500, offline
- [ ] 1.30 Platform plumbing: `middleware.ts`, `instrumentation.ts`, CSP nonce baseline, sitemap and robots baseline, metadata baseline, print stylesheet
- [ ] 1.31 Governance A: CI workflow, CODEOWNERS, pull request template, CONTRIBUTING, SECURITY, CHANGELOG, LICENSE
- [ ] 1.32 Governance B: ADR-0001 to ADR-0007, README update, `docs/handoffs/CHAT_01_COMPLETED.md`
Segment gate: production build passes; Lighthouse at least 90 on the homepage; dead-link audit clean; `npm run verify` fully green.

## STEP 02 -- Database Foundation, Migrations, RLS, Encryption, Audit Ledger

- [ ] 2.1 Migration framework: runner, ordering, checksums, up and down pairs, seeds runner, `npm run db:migrate`, `npm run db:rollback -- <ts>`
- [ ] 2.2 DB primitives: extensions, `uuid_generate_v7()`, `set_updated_at()`, universal column helper, `check-schema-standards.sql`
- [ ] 2.3 Tenancy tables: companies, company_settings, company_members, user_profiles, platform_users, invitations, devices, sessions
- [ ] 2.4 Access tables: roles, permissions, role_permissions, user_roles, login_attempts, login_lock_state
- [ ] 2.5 Platform tables: plans, plan_features, subscriptions, entitlements, coupons, coupon_redemptions, feature_flags
- [ ] 2.6 Reference tables: countries, currencies, tax_jurisdictions, timezones with read-only policies
- [ ] 2.7 RLS framework: `current_company_id()`, `current_role_name()`, default-deny policies, tenant isolation policies, isolation assertion SQL, isolation fuzz SQL
- [ ] 2.8 Audit ledger: audit_logs, sequence numbers, hash chain, Ed25519 signatures, immutability rules, audit triggers, verification function, merkle roots, export
- [ ] 2.9 Encryption core: `lib/encryption/aes-256-gcm.ts`, `key-vault.ts`, `key-rotation.ts`, blind index, PII redaction, benchmark doc
- [ ] 2.10 Envelope key management: per-tenant data encryption keys, wrapped key storage, key usage audit, scheduled rotation window, crypto-shredding procedure with verification query
- [ ] 2.11 Secret registry: `lib/security/secret-registry.ts`, secret records with owner and purpose, access audit, boot-time validation hook, rotation checklist
- [ ] 2.12 Concurrency primitives: idempotency middleware and table, optimistic lock, pessimistic lock, advisory lock, leader lock, duplicate detector base, request_logs, rate_limits
- [ ] 2.13 Governance data: data_classification, retention policies, dsar tables, soft delete and restore helpers, backup metadata
- [ ] 2.14 Seeds and types: plans, permissions, countries, currencies, tax presets, super_admin bootstrap, `types/database.ts` generation, handoff

## STEP 03 -- Authentication, 2FA, Passkeys, Session Registry, Login Lock, VPN/Proxy/Tor (segments 3A to 3D)

### SEGMENT 3A -- Auth foundations (expected chat 1 of 4)
- [ ] 3.1 Supabase clients: browser, server, admin (service role kept server-only)
- [ ] 3.2 Session policy: HttpOnly plus Secure plus SameSite=Strict cookie, session id rotation on login, configurable timeout (default 24 hours)
- [ ] 3.3 Auth middleware: route protection, tenant resolution, redirect rules, no PII in URLs
- [ ] 3.4 CSRF double-submit on auth routes and credential payload sanitization
- [ ] 3.5 Auth rate limits: per IP and per account counters, response headers, typed `RateLimitError`
Segment gate: session rotation proven on login; forged CSRF requests rejected.

### SEGMENT 3B -- Signup, login, login lock (expected chat 2 of 4)
- [ ] 3.6 Signup flow: Turnstile verification, honeypot field, email verification, disposable email blocklist, audit entry
- [ ] 3.7 Login flow: credential check, generic error messages, no account existence leakage, IP rate limit
- [ ] 3.8 Login lock engine core: consecutive failure counters for password and 2FA, 2-hour lock, database persistence that survives restart
- [ ] 3.9 Lock enforcement: correct password denied, password reset blocked, password change does not unlock, session issuance blocked
- [ ] 3.10 Lock notification: owner email alert on lock start with device and IP context, generic user-facing copy
- [ ] 3.11 Unlock workflow: authorized admin or admin_staff only, confirmed owner contact required, audit entry with actor, target, reason and timestamp
Segment gate: lock state survives a server restart (database assertion recorded); no endpoint reveals account existence.

### SEGMENT 3C -- Factors and credentials (expected chat 3 of 4)
- [ ] 3.12 2FA TOTP: enrollment with QR code, verification, ten one-time backup codes, recovery flow, mandatory per role
- [ ] 3.13 Step-up helper for sensitive actions (gateway, payout, KYC, admin) with challenge TTL and audit
- [ ] 3.14 Passkeys and hardware keys: WebAuthn registration and authentication, additive factor beside TOTP, named credentials, recovery and re-enrollment, audit entries
- [ ] 3.15 Password controls: minimum 12 characters with complexity, HIBP k-anonymity check, history of last five, reset flow that honors an active lock
- [ ] 3.16 OAuth: Google and GitHub, encrypted token storage, account linking rules, session fixation prevention
Segment gate: passkey and TOTP coexist without weakening the login lock; step-up enforced and audited.

### SEGMENT 3D -- Devices, sessions, network trust, surfaces (expected chat 4 of 4)
- [ ] 3.17 Trusted devices and device centre: registry, trust scoring, revocation, new device alerts, UI with four states
- [ ] 3.18 Session registry: global session list, short-lived access with rotating refresh, mid-session IP or device change detection, self-service freeze and unfreeze with audit
- [ ] 3.19 Network trust: `vpn-proxy-detector`, `ip-reputation`, geo rules, corporate IP whitelist, enforcement matrix definition
- [ ] 3.20 Network enforcement: VPN, proxy and Tor blocked on signup, flagged with step-up 2FA on login, audit entries
- [ ] 3.21 Auth surfaces A: login, signup, forgot password, reset password, verify email pages with four states, 320px, dark mode, WCAG AA
- [ ] 3.22 Auth surfaces B: 2FA challenge, passkey, locked account, device centre, session list, security settings, handoff
Segment gate: all auth endpoints rate limited and audited; accessibility and 320px checks recorded.

## STEP 04 -- Roles, Permissions, Approval Engine, Approval Inbox, Enterprise Access, Onboarding, Settings, KYC, Notifications, Platform Billing (segments 4A to 4D)

### SEGMENT 4A -- Roles, permissions, approval engine (expected chat 1 of 4)
- [ ] 4.1 Roles: super_admin, ceo, admin_staff, owner, staff definitions plus the seven admin_staff sub-roles; forbidden roles absent everywhere
- [ ] 4.2 Permission matrix: `config/permissions.ts` with module and action granularity, entitlement awareness
- [ ] 4.3 Guards: server-side authorization, client-side visibility, cross-tenant 404 policy
- [ ] 4.4 Approval engine core: approval_requests, L1/L2/L3 levels, SLA and auto-escalation, delegation, dual approval, bulk approval, full history
- [ ] 4.5 Approval inbox UI: unified queue, filters by module and requester, SLA countdown, bulk approve and reject with confirmation, audit
Segment gate: permission matrix SQL assertion passes; approval chain enforced on every managed action.

### SEGMENT 4B -- Onboarding, company settings, team (expected chat 2 of 4)
- [ ] 4.6 Super admin first-run setup wizard and platform configuration
- [ ] 4.7 Owner onboarding wizard, industry presets, first-run experience, entitlement-aware steps
- [ ] 4.8 Company profile and branding settings with live preview
- [ ] 4.9 Invoice settings, custom domain setup, tenant security policy
- [ ] 4.10 Team management: invites, granular permission assignment, member lifecycle
- [ ] 4.11 Staff activity monitoring, staff security controls, permission review hooks
- [ ] 4.12 Staff draft to owner approval send workflow with audit
Segment gate: onboarding completes end to end on a fresh tenant; staff cannot send without owner approval.

### SEGMENT 4C -- KYC, notifications, message log (expected chat 3 of 4)
- [ ] 4.13 KYC upload through the storage abstraction, statuses, re-verification
- [ ] 4.14 KYC review console for kyc_reviewer, gate map, notifications, audit
- [ ] 4.15 Notification center: in-app list, read state, realtime updates, four states
- [ ] 4.16 Notification preferences, event matrix, digest scheduling, email dispatch interface consumed by step 12
- [ ] 4.17 Message delivery event log service and table that every channel writes into
Segment gate: KYC gate blocks gated features until approved; the message log receives entries from notification dispatch.

### SEGMENT 4D -- Platform billing, enterprise access, security centre (expected chat 4 of 4)
- [ ] 4.18 Platform billing: plan management and subscription lifecycle
- [ ] 4.19 Coupons, entitlement engine, dunning
- [ ] 4.20 Platform invoices and owner billing UI
- [ ] 4.21 Enterprise access A: SAML and OIDC single sign-on adapter, domain verification, just-in-time provisioning rules
- [ ] 4.22 Enterprise access B: SCIM provisioning, tenant IP allowlist, just-in-time access with expiry, break-glass with dual approval and mandatory audit
- [ ] 4.23 Owner security centre: security score and checklist, who-did-what digest, permission review reminder, session and device review links
- [ ] 4.24 Tenant settings surfaces: gateway configuration shell, payout partner settings with generic naming, handoff
Segment gate: entitlements correct after plan change; break-glass use audited and notified.

## STEP 05 -- Invoicing Core, Documents, PDF Engine, Numbering, Editor Experience

- [ ] 5.1 Invoice schema: migrations, RLS, duplicate hash, version, audit trigger, `types/invoice.ts`
- [ ] 5.2 Invoice CRUD: service, API, multi-step form, list and detail, drafts, trash and restore, bulk actions, filters, cursor pagination, mobile card list
- [ ] 5.3 Line items and calculation engine: discounts, taxes through the Step 6 tax service, shipping, withholding, rounding policy, decimal only
- [ ] 5.4 Numbering: advisory lock, per-tenant sequence, prefixes, gapless guarantee, concurrency assertion script
- [ ] 5.5 Status machine and workflow: transitions, guards, timeline, activity log, reminder hooks
- [ ] 5.6 Metadata and extras: custom fields, tags, notes, terms, attachments through storage, consent capture hook, duplicate detection
- [ ] 5.7 US professional invoice layout, template set, branding auto-fill, print stylesheet
- [ ] 5.8 PDF engine: server-side React-PDF, immutable snapshot archive, hash, watermark, signed download, CSV and Excel export
- [ ] 5.9 Documents: estimates, credit notes with tax reversal, debit notes, proforma, advance and deposit invoices, recurring invoices, installment plans
- [ ] 5.10 Projects and time tracking, billable hours to invoice, batch invoice generation
- [ ] 5.11 Invoice reports: sent versus paid, aging, revenue summary, billing lifecycle hooks
- [ ] 5.12 Editor experience: autosave, undo, saved views and explainability messages on invoice and document actions using the Step 1 primitives; handoff

## STEP 06 -- CRM, Catalog, Inventory, Suppliers, E-commerce Sync, Dashboards, Reports, Tax Engine, Batch (segments 6A to 6D)

### SEGMENT 6A -- CRM (expected chat 1 of 4)
- [ ] 6.1 Client CRUD with soft delete, restore and audit
- [ ] 6.2 Client profile: multiple contacts, billing and shipping addresses, payment terms
- [ ] 6.3 Client list: search, filter, cursor pagination, mobile card list, four states
- [ ] 6.4 Client activity and history timeline
- [ ] 6.5 Client statements with opening balance, transactions and closing balance
- [ ] 6.6 Client merge and fuzzy duplicate detection (levenshtein distance at most three plus email match)
- [ ] 6.7 Client import and export with duplicate preview and validation
Segment gate: merge produces a single balanced statement; the duplicate detector raises a typed `DuplicateError`.

### SEGMENT 6B -- Catalog, inventory, suppliers (expected chat 2 of 4)
- [ ] 6.8 Product and service CRUD with categories and images through storage
- [ ] 6.9 Pricing, tax class, SKU uniqueness per tenant, fuzzy name duplicate suggestion
- [ ] 6.10 Warehouses and stock levels
- [ ] 6.11 Stock movements, transfers and adjustments with `SELECT FOR UPDATE`
- [ ] 6.12 Inventory valuation and low stock alerts
- [ ] 6.13 Supplier registry
- [ ] 6.14 Purchase orders with approval and receiving
- [ ] 6.15 Supplier bills and supplier payments
Segment gate: inventory concurrency assertion passes; stock never goes negative under concurrent writes.

### SEGMENT 6C -- E-commerce, dashboard, reports, lifecycle (expected chat 3 of 4)
- [ ] 6.16 Shopify adapter: order import, mapping, idempotency
- [ ] 6.17 WooCommerce adapter: order import, mapping, idempotency
- [ ] 6.18 Sync management: retries, error log, manual resync, audit
- [ ] 6.19 Dashboard core: revenue overview, sent versus paid, key metrics
- [ ] 6.20 Dashboard customization: widget layout, saved views, drill-downs
- [ ] 6.21 Reports A: sales, payment and expense reports with filters and exports
- [ ] 6.22 Reports B: tax, client, inventory and project reports with saved views, scheduling and sharing
- [ ] 6.23 Billing lifecycle: reminder engine, late fees and penalties, escalation states, dunning
Segment gate: every report reconciles to its source documents; exports are reproducible.

### SEGMENT 6D -- Tax engine, batch, FX (expected chat 4 of 4)
- [ ] 6.24 Tax core: tax profiles per company (registration number, filing frequency, liability owner), jurisdictions, effective-dated versioned rates
- [ ] 6.25 Tax classes, inclusive and exclusive handling, per-line and invoice-level modes, rounding policy
- [ ] 6.26 Tax determination engine: place of supply, country and state, B2B and B2C, reverse charge, exemption with expiry, zero-rated, out of scope, explainability record
- [ ] 6.27 Tax documents: country-specific mandatory fields, reverse-charge statement, exemption certificate register
- [ ] 6.28 Tax reporting: collected versus remitted versus outstanding per period, jurisdiction and rate, customer tax summary, exports
- [ ] 6.29 Batch and bulk operations: batch invoice, bulk actions, batch guard, audit
- [ ] 6.30 FX rates with historical freeze for display conversion only, handoff
Segment gate: no rate is hardcoded anywhere; the determination result is stored and explained on every document.

## STEP 07 -- Storage Abstraction, File Security, File Records

- [ ] 7.1 `files` table, `storage_provider`, company integration flags, provider capabilities
- [ ] 7.2 Adapter base and Google Drive adapter: service account OAuth2, per-tenant folders, resumable upload, quota monitoring
- [ ] 7.3 Supabase Storage adapter, runtime provider resolver, automatic failover, provider health checks
- [ ] 7.4 Encryption pipeline: AES-256-GCM before upload, per-tenant envelope key usage, key version tags, zero-knowledge notes
- [ ] 7.5 Upload pipeline: magic bytes, MIME and extension cross-check, size limits per type, zip bomb and polyglot detection, EXIF and GPS strip, image re-encode, SVG sanitize or rasterize, PDF JavaScript removal, Office macro removal, ClamAV hook, quarantine, quota, rate limit, chunking, client and server hash check, content hash duplicate detection
- [ ] 7.6 Download pipeline: short-lived signed URLs, watermarking with tenant id, access audit, download rate limit, hotlink prevention
- [ ] 7.7 Lifecycle: retention policy enforcement, archival, deletion and restore, legal hold
- [ ] 7.8 Provider migration tool: plan, move, verify checksum, switch provider, audit, resume after failure
- [ ] 7.9 Module integration and media: invoice attachments, KYC documents, branding assets, payslips, evidence packs, exports; AVIF and WebP derivatives, thumbnails, srcset
- [ ] 7.10 Storage admin surfaces: owner usage view, admin quarantine console, migration console, usage reports; handoff

## STEP 08 -- Payment Framework Core, Card Rules, 3DS Policy, Advanced Card Risk, Routing, Super Admin API Console

- [ ] 8.1 Adapter base interface, capability union, interaction mode enum, shared result types, error mapping contract
- [ ] 8.2 Registry: `lib/payment/registry.ts` append-only with implemented processors only, processor metadata, per-processor config schema
- [ ] 8.3 Payment domain schema: payment_intents, payments, gateway_transactions, refunds, webhook_events, payment_reviews, idempotency
- [ ] 8.4 Shared server payment module and `lib/payment/http-client.ts` with timeouts, retries, SSRF guard, PII-safe logging
- [ ] 8.5 Card rules engine: no PAN path, same card and same invoice 24-hour block, two authentication failures block the token, balance failures excluded, blacklist by token or fingerprint, decline logging, manual review queue
- [ ] 8.6 3DS policy engine: request 3DS, postal code and IP country match rule, evidence storage, manual review routing
- [ ] 8.7 3DS2 exemptions and network tokenization: `lib/payment/tokenization.ts`, exemption request with documented fallback to challenge, liability shift record, token lifecycle and update events, PAN never present
- [ ] 8.8 Advanced card risk: `lib/payment/card-testing-detector.ts`, BIN velocity and micro-attempt detection, authorization holds, processor fraud-tool adapter that respects gateway-hosted risk decisions, config in `config/payment-limits.ts`
- [ ] 8.9 Velocity limits: card and IP attempt counters, window enforcement, alerting
- [ ] 8.10 Routing engine: rules, priority, capability and KYC gating, abort when no rule matches, never failover, decision log
- [ ] 8.11 Webhook framework: signature verification per processor, timestamp tolerance, replay protection, event id deduplication, idempotent processing, retry handling
- [ ] 8.12 Super admin API console: encrypted credential store, masked display, connection test, enable and disable, adapter-exists guard, step-up 2FA and re-verification, mode selector with single active mode and test-before-switch, audit entries, UI
- [ ] 8.13 Fraud engine core: risk scoring, blacklists, blocklists, AML and sanctions hooks, review queue UI, audit; handoff

## STEP 09 -- 16 Processor Adapters, NMI Dual Mode, Advanced Capabilities, Sandbox Validation

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
- [ ] 9.14 Advanced capability integration per processor: network tokenization, 3DS2 exemptions, hosted risk or fraud tooling, authorization holds, wallet express pay; implement where the processor documents support and record the evidence in `docs/PROVIDERS/<provider>.md`
- [ ] 9.15 Sandbox validation per processor: recorded calls, observed results, evidence files, mode selection proof
- [ ] 9.16 Registry and console wiring: implemented processors registered, connectable in admin console, capability and mode matrix surface, `docs/PROVIDERS/INDEX.md`, corrections applied to `06_PROVIDER_DOCS_REGISTRY.md`; handoff

## STEP 10 -- Checkout Design, Payment Experience, Wallet, MoR, Payouts, Disputes, Consent Evidence, Subscriptions, BNPL (segments 10A to 10D)

### SEGMENT 10A -- Checkout page (expected chat 1 of 4)
- [ ] 10.1 Checkout shell and layout: two-column desktop with sticky order summary, single-column mobile with safe-area pay bar
- [ ] 10.2 Checkout design system: tenant white-label theming tokens, dark mode parity, motion with reduced motion, 320px layout, WCAG AA focus order
- [ ] 10.3 Express payment row above the card form with wallet buttons per capability and a labelled divider
- [ ] 10.4 Payer fields: email, name, billing address, postal code (required for the 3DS rule), country, optional business tax registration number, coupon, note, inline validation
- [ ] 10.5 Monetary transparency: subtotal, discount, tax line from the Step 6 tax service and total, with no hidden charges
- [ ] 10.6 Content and trust layer: refund policy auto-display, statement descriptor, seller contact, contact-seller-first notice, explainability messages for declines and next steps
- [ ] 10.7 Consent capture: checkbox text, terms and refund policy versions, timestamp, IP, device fingerprint and immutable snapshot
- [ ] 10.8 Saved tokenized payment methods for returning payers, displayed as brand and last four digits only
- [ ] 10.9 Checkout edge cases: method switch and retry, per-attempt idempotency, same-card same-invoice 24-hour notice, manual review notice, expired and revoked links, partial payment, installment and BNPL options, multi-invoice selection
- [ ] 10.10 Checkout technical hardening: iframe sandbox attributes, CSP frame-src allowlist, SRI, autocomplete and input types, LCP under 2.5s and CLS under 0.1 budgets, card-fields-in-processor-frames assertion
Segment gate: checkout renders with tenant branding and no platform branding on entitled plans; transparency assertion passes; card-field assertion passes.

### SEGMENT 10B -- Payment core, links, refunds, fees (expected chat 2 of 4)
- [ ] 10.11 Payment orchestration status machine with transitions and guards
- [ ] 10.12 Payment intent creation with idempotency key and gateway transaction linkage
- [ ] 10.13 Capture, void, receipt generation, customer notification and reconciliation
- [ ] 10.14 Payment links: create, share, expiry, revoke, usage analytics
- [ ] 10.15 Pluggable integration modes UI: iframe, SDK, redirect and API only per declared capability
- [ ] 10.16 Refunds: full and partial with approval flow, reason codes, evidence, reconciliation and tax reversal through the Step 6 service
- [ ] 10.17 Partial payments, allocation across invoices, credit application
- [ ] 10.18 Surcharge and fees: fee calculator, platform fee, net settlement and fee reporting
Segment gate: every payment mutation is idempotent; webhook replay attempts are rejected.

### SEGMENT 10C -- Wallet, merchant of record, payouts (expected chat 3 of 4)
- [ ] 10.19 Wallet core: balances, double-entry ledger, serializable isolation on mutations
- [ ] 10.20 Wallet operations: top-up, withdrawal, holds, statements, negative balance protection
- [ ] 10.21 Merchant of record flow and KYC-gated routing
- [ ] 10.22 MoR collected-tax hold driven by the liability owner flag from the Step 6 tax profile, plus settlement batches
- [ ] 10.23 Payout engine with step-up approvals and generic partner naming
- [ ] 10.24 Payout reconciliation against settlements and wallet movements
Segment gate: wallet ledger balances to zero; settlement reconciliation is balanced against gateway payouts.

### SEGMENT 10D -- Disputes, consent evidence, subscriptions, BNPL, reports (expected chat 4 of 4)
- [ ] 10.25 Chargeback intake, reason code mapping and deadline tracker
- [ ] 10.26 Evidence pack: all ten parts assembled in one action, gateway-ready formatting, auto-submit per processor
- [ ] 10.27 Auto-defence workspace, chargeback reserve calculator, rate monitoring with the 0.65 percent threshold alert
- [ ] 10.28 Consent evidence engine: delivery proof, chronological timeline, audit chain export
- [ ] 10.29 Client subscriptions: plans, recurring billing, management UI, dunning, proration rules
- [ ] 10.30 BNPL and installment financing with eligibility, schedules and reporting
- [ ] 10.31 Payment reports and analytics
- [ ] 10.32 PCI DSS posture document, payment audit trail, fraud review queue integration, handoff
Segment gate: an evidence pack is complete for a sample dispute; refund and payout flows are audited and approval-gated.

## STEP 11 -- Client Portal, Token Checkout Page, Tokenized Access, Email Journey, Branding, White-label, Document Integrity

- [ ] 11.1 Token engine: HMAC-SHA256 128-bit, per-document links, plan-based expiry, revoke, re-issue, optional email OTP gate, no PII in URLs, masked in logs, leak alerts, noindex, rate limit
- [ ] 11.2 Client pages: invoice view, estimate approval, receipt view and download, client hub, contract sign, expired and invalid pages
- [ ] 11.3 Token checkout composition: `/i/[token]/pay` and payment link routes render the Step 10 checkout component set inside tenant branding with noindex, token rate limits, OTP gate, no token in referrer or gateway redirect, saved-method display
- [ ] 11.4 Client email journey: invoice, reminders, receipts, statements, dunning, delivery tracking, duplicate send guard, per-tenant sender
- [ ] 11.5 Tenant branding: logo, colors, fonts, email skin, auto-apply, live preview, per-document overrides
- [ ] 11.6 White-label: platform brand removal, custom domain plan gating, email domain, DNS and SSL guidance
- [ ] 11.7 Form and data safety UX: validation, autosave, unsaved changes guard, double submit guard, PII masking
- [ ] 11.8 Document integrity and workflow: immutable snapshots, hash verification on view, e-signature capture and evidence, staff draft to owner send, bulk email workflow
- [ ] 11.9 Quality and lifecycle UX: client data quality, industry presets and templates, tenant lifecycle and growth UX, mobile and print polish
- [ ] 11.10 Client explainability and support: plain-language reason for a failed or held payment, what happens next, expected receipt time, delivery transparency view backed by the Step 4 message log, contact-seller-first flow for disputes; handoff

## STEP 12 -- Universal SMTP, WhatsApp, Social, Public API v1, Webhooks, Integrations, Support, Channel Transparency

- [ ] 12.1 SMTP adapter layer: Resend, SendGrid, SES, Mailgun, Postmark, generic SMTP; platform configuration; tenant BYO SMTP with verification; DKIM, SPF and DMARC checks; queue with retry and backoff; bounce and complaint handling; email log; deliverability dashboard
- [ ] 12.2 Email templates: React Email set for every transactional event, versioning, per-tenant branding, preview and test send
- [ ] 12.3 WhatsApp: Meta Cloud API client, WABA configuration, encrypted credentials, template manager, send API, automation rules, bulk campaigns, delivery and read tracking, inbound reply webhook, consent and compliance
- [ ] 12.4 Social automation: connections with encrypted tokens, seven platform adapters, composer, calendar, scheduler, auto-post rules, evergreen queue, approval flow, analytics, in-app sharing
- [ ] 12.5 Public REST API v1: keys and scopes, endpoints, rate limits, cursor pagination, idempotency, OpenAPI spec, docs page, developer portal, sandbox keys, usage analytics
- [ ] 12.6 Outbound webhooks: subscriptions, HMAC signing, retries, dead letter, delivery logs, replay tool
- [ ] 12.7 Integrations: Zapier, Make, Chrome extension, Plaid and Salt Edge bank feeds, transaction import, smart reconciliation, receipt OCR with Google Vision, contracts and e-signature, multi-channel messaging engine with routing and fallback
- [ ] 12.8 Messaging transparency and compliance console: per-channel delivery, open, click, retry and failure views appended to the Step 4 message log through the append protocol, consent ledger view, quiet hours, suppression list, admin audit
- [ ] 12.9 Support: help center, ticket system with SLA, feedback and NPS, canned responses, agent assignment
- [ ] 12.10 Data migration and import wizard with duplicate preview, mapping, validation, audit; handoff

## STEP 13 -- Payroll, HR, Expenses, Double-entry Accounting, Tax Liability and Remittance, Statements, Reports (segments 13A to 13D)

### SEGMENT 13A -- Payroll (expected chat 1 of 4)
- [ ] 13.1 Employee profiles with documents stored through the storage abstraction
- [ ] 13.2 Pay structures: allowances, deductions, display currency rules
- [ ] 13.3 Payroll tax calculation per jurisdiction with presets
- [ ] 13.4 Pay runs with the approval chain and lock after approval
- [ ] 13.5 Payslip generation and encrypted archive with content hash
- [ ] 13.6 Payroll duplicate detection (tenant, employee, pay period) and payout integration
- [ ] 13.7 Payroll accounting integration and payroll reports
- [ ] 13.8 Employee self-service portal over token links
Segment gate: payroll totals reconcile to payslips and to the ledger.

### SEGMENT 13B -- HR and expenses (expected chat 2 of 4)
- [ ] 13.9 Organization structure and positions
- [ ] 13.10 Onboarding and offboarding checklists
- [ ] 13.11 Performance notes and leave management with balances and approval
- [ ] 13.12 Expense CRUD with categories and cost centers
- [ ] 13.13 Receipt capture with OCR and smart entry
- [ ] 13.14 Expense policies and approval routing
- [ ] 13.15 Recurring expenses and reimbursements
- [ ] 13.16 Expense reports and duplicate hash detection
Segment gate: expense posting produces balanced journals; duplicate detection raises typed errors.

### SEGMENT 13C -- Accounting core and reconciliation (expected chat 3 of 4)
- [ ] 13.17 Chart of accounts templates and account management
- [ ] 13.18 Manual journal entries with posting rules and duplicate detection
- [ ] 13.19 Automated journals from invoices, payments, expenses, payroll and fixed assets
- [ ] 13.20 Period locks and trial balance
- [ ] 13.21 Bank reconciliation A: statement import and matching engine with rules
- [ ] 13.22 Bank reconciliation B: unmatched queues, adjustments, reconciliation reports
- [ ] 13.23 Fixed assets and depreciation schedules with disposal
- [ ] 13.24 Budgets with allocation, tracking and variance alerts
- [ ] 13.25 Multi-book, multi-entity and consolidation with accounting standards configuration
Segment gate: debits equal credits after every posting; period close is irreversible and audited.

### SEGMENT 13D -- Statements, tax remittance, intelligence (expected chat 4 of 4)
- [ ] 13.26 Profit and loss with comparatives and drill-down
- [ ] 13.27 Balance sheet with comparatives and drill-down
- [ ] 13.28 Cash flow statement, statement of equity and exports
- [ ] 13.29 Period close checklist, tax filing preparation, accounting-grade audit features
- [ ] 13.30 Tax liability ledger: segregated Tax Payable accounts per jurisdiction and rate, tax periods, return draft from Step 6 determination data, reconciliation assertion
- [ ] 13.31 Tax return review and approval with variance explanation
- [ ] 13.32 Tax remittance workflow: remittance record (method, authority reference, date, proof, USD FX freeze), journal entry Dr Tax Payable and Cr Bank, bank reconciliation link, filed and closed states, evidence pack
- [ ] 13.33 Filing operations: filing calendar with deadline reminders, penalty and interest tracking, accountant-ready export pack, platform self-billing tax treatment
- [ ] 13.34 Financial intelligence: cash flow forecasting, BI dashboards, fifteen plus reports with scheduling and saved views, handoff
Segment gate: no return can be marked filed without an approved remittance record containing method, authority reference, date and proof; statements reconcile to the trial balance.

## STEP 14 -- Super Admin Console, CMS, SEO, Analytics, Marketing, Growth, Intelligence, Trust Publishing

- [ ] 14.1 Admin dashboard, user management, tenant management, time-limited audited impersonation, admin communication
- [ ] 14.2 Plan, subscription and coupon administration, revenue analytics, monetization, entitlement administration
- [ ] 14.3 CMS editor for every public page, blog management, legal pages, email template manager, status page and incidents, media library
- [ ] 14.4 SEO: eight JSON-LD schema types, metadata and OG generation, sitemap and robots, SEO audits, search engine verification, redirects
- [ ] 14.5 Analytics and pixels: GA4, GTM, Meta Pixel with CAPI, TikTok, LinkedIn, X, Clarity, Pinterest; consent gating; pixel manager; in-app analytics
- [ ] 14.6 Conversion: A/B testing framework, trust signals, conversion tools, lead magnets, calculators, full free invoice generator
- [ ] 14.7 Marketing automation: campaigns, drip sequences, lead scoring, lead generation, lifecycle, win-back
- [ ] 14.8 Platform intelligence and engineering: revenue analytics, tenant intelligence, platform health, background job console, config management, feature flags
- [ ] 14.9 Monitoring, alerting and incident response: rules, channels, deduplication, escalation, on-call roster, runbooks, SLO and error budget
- [ ] 14.10 Audit console: viewer, search, export, SIEM forwarders for Splunk, Elastic, Datadog, CloudWatch, Sentinel and Chronicle; user behaviour analytics; insider threat; tamper alerts; growth and retention tools
- [ ] 14.11 Trust and transparency publishing: `/.well-known/security.txt`, vulnerability disclosure page with policy and contact, transparency report page, sub-processor list, data processing agreement page, accessibility statement, privacy notice linkage; handoff

## STEP 15 -- Deep Security, Privacy Experience, Deception and Anomaly, Compliance, Fraud, Zero Trust, Conflict and Duplicate Finalization

- [ ] 15.1 Tenant isolation hardening: RLS audit, cross-tenant 404 policy, storage isolation, IDOR sweep, isolation fuzz, RLS performance optimization
- [ ] 15.2 Encryption and secrets hardening: encrypted field inventory, blind index coverage, key rotation drill, environment validation, secret access audit, bundle secret scanner, PII redaction, backup encryption
- [ ] 15.3 Application security sweep: SQL injection, XSS, CSRF, SSRF, CSP with nonce and Trusted Types, headers and HSTS, CORS, open redirect, mass assignment, prototype pollution, ReDoS, path traversal, header injection, null byte, NFC normalization, zero-width and RTL removal
- [ ] 15.4 Bot and abuse prevention: rate limit matrix, brute force backoff, Turnstile coverage, honeypots, fingerprint reuse detection, headless detection, traffic anomaly, auto-suspend, payload and zip bomb guards, coupon and referral abuse, account takeover and session hijack detection, insider threat rules
- [ ] 15.5 Fraud engine completion: scoring, AML and sanctions screening with weekly re-screening cron, transaction monitoring, case management, blacklists, review queue, analytics
- [ ] 15.6 Network trust completion: VPN, proxy, Tor, datacenter and residential proxy detection, IP reputation, geo fences, country blocks, admin whitelist, enforcement matrix across signup, login, payment, KYC and admin
- [ ] 15.7 Compliance: GDPR, CCPA, PDPA and other jurisdictions, DSAR handler, consent manager, classification, retention enforcement, residency and sovereignty rules, cross-border transfer controls, jurisdiction configuration, compliance audit exports
- [ ] 15.8 Privacy experience: `components/privacy/*`, `app/(dashboard)/settings/privacy/*`, user and owner privacy dashboard showing stored data classes with export and delete actions, consent ledger view, per-tenant data residency selection, cross-border transfer record, appeal path with review and notification for every automated block
- [ ] 15.9 Deception, anomaly and log integrity: `lib/security/deception/*`, honeytokens and canaries, per-tenant behavioural baselines, impossible travel detection, automated containment with appeal and owner notification, continuous audit log integrity verification, WORM export with escrow
- [ ] 15.10 Supply chain and CI security: SCA, SAST, DAST, secret scanning, container scanning, IaC scanning, SBOM, dependency pinning policy, signed commits and provenance hooks for the deploy pipeline
- [ ] 15.11 Observability and incident response: Sentry with PII scrubbing, RUM, synthetic monitoring, database, payment, email, WhatsApp and storage monitors, cron dead man switch, SSL, domain and DNS monitors, alert routing, incident workflow, DR plan with drill and RTO and RPO validation
- [ ] 15.12 Conflict and duplicate finalization: all fifteen conflict and duplicate implementations verified as code in `services/`, typed errors, audit entries, UI resolution paths, concurrency assertion scripts, leader locks for every cron
- [ ] 15.13 Performance and database engineering: Core Web Vitals, bundle budget, media pipeline, caching and ISR, index coverage audit, query timeouts, N+1 sweep, cursor pagination everywhere
- [ ] 15.14 Zero Trust and Zero Tolerance finalization: device, network, user and transaction trust scores, adaptive MFA, just-in-time and just-enough access, break glass procedure, automated responses with appeal path, posture dashboard, penetration test log; handoff

## STEP 16 -- Deployment, CI/CD, Cron, Docs, PWA Security, Performance, Backup/DR, Launch

- [ ] 16.1 Netlify production configuration, headers and redirects, ISR and caching, edge functions, environment management, preview deploys, domain and SSL, Cloudflare WAF and TLS and HSTS and DNSSEC, SPF and DKIM and DMARC, Turnstile keys per environment
- [ ] 16.2 Docker and VPS alternative: Dockerfile, compose for app, database, cache and proxy, health checks, self-host runbook, parity notes
- [ ] 16.3 CI/CD: ci workflow, security workflow with SAST, DAST, SCA and secret scanning, deploy workflow with migrations and rollback, release process, changelog automation, branch protection and CODEOWNERS enforcement, signature and provenance verification of the build
- [ ] 16.4 Cron jobs: all twenty jobs implemented, leader-locked, monitored, with a registry, console and dead man switch
- [ ] 16.5 Monitoring launch: Sentry releases and source maps, uptime monitoring, status page, alert channels, log aggregation, dashboards, on-call, published runbooks
- [ ] 16.6 Documentation and governance: README, CONTRIBUTING, SECURITY, CHANGELOG, LICENSE, ERD, ADR set, RUNBOOKS, API.md, DEVOPS.md, SECURITY_MODEL.md, COMPLIANCE.md, data flow diagrams, engineering onboarding guide, handoff index
- [ ] 16.7 PWA and UX polish: manifest, service worker, offline page, install prompt, splash, offline detection, audit sweep of page states, 320px, dark mode, accessibility, motion polish
- [ ] 16.8 PWA security and local data: biometric app lock using platform authenticators, encrypted offline queue, no PII or payment data in local storage or caches, push alert channel, secure service worker update flow with verification
- [ ] 16.9 Performance: Lighthouse budget enforcement, bundle analysis, image pipeline, fonts, caching, HTTP/3, Brotli, index audit, N+1 audit, load test procedures documented, performance report
- [ ] 16.10 Backup, DR and lifecycle: database and storage backup scripts, restore drills, RTO and RPO validation, offsite encrypted backups, tenant offboarding with export and delete plus crypto-shredding, data portability, downgrade rules, cost optimization, release and launch checklists, launch war room, thirty-day post-launch plan
- [ ] 16.11 Final audit and sign-off: full checklist sign-off, penetration test remediation verification, zero critical dependencies, traceability matrix finalized at 3,950 features plus the Revision 2 additions with zero unmapped, completion statement; handoff
