// path: docs/PLAN/05_ADDITIONAL_REQUIREMENTS_SPEC.md
# Additional Requirements -- Normative Specification

These requirements are additions to `MASTER_PROMPT.md` and have the same
authority. Every chat must implement them exactly as written below. Where
wording differs from an earlier document, this file is stricter and wins.

## A1. Provider documentation rule (applies to Step 9 and every future adapter)

- Before writing any processor adapter code, the chat must fetch the
  processor's current official documentation from the processor's own site in
  that same session.
- Writing adapter code from memory or assumption is prohibited.
- Each processor gets `docs/PROVIDERS/<provider>.md` recording:
  documentation URLs used, sandbox URLs used, fetch date, API version,
  authentication model, request and response shape for the calls implemented,
  webhook signature mechanism, and test card or test account facts.
- If a documentation page moved, record the new canonical page.
- If a sandbox is not published, record exactly what is published (test mode,
  test cards, simulator, or manual approval) and the page that states it.

## A2. Processor list (16 total, one adapter file each)

Stripe, NMI, Adyen, Verifone (2Checkout), Braintree (PayPal), BlueSnap,
Square, Payoneer, FastSpring, Paddle, PayPro Global, PayPal (standalone),
Payarc/PaymentCloud, Rapyd, Authorize.Net, and Custom.

- One file per processor in `lib/payment/adapters/`.
- One registry file `lib/payment/registry.ts` listing all implemented
  processors with capabilities and supported modes.
- A registry entry may exist only when the adapter code exists. No stubs, no
  placeholders, no "planned" entries in the registry itself.
- Custom adapter: generic HTTPS gateway driven by owner-provided JSON config,
  no provider-specific behaviour hardcoded.

## A3. NMI dual mode (both modes must exist)

- Mode 1 Collect.js: default mode. Single-use token, expires after 24 hours.
- Mode 2 Payment Component: requires an npm package. The package addition is
  requested through the integrator because `package.json` is integrator-owned.
  The adapter must implement the server-side path and the client integration
  contract, and must document the exact npm request in
  `docs/PROVIDERS/nmi.md`.
- Both modes send the payment through the same shared server module, which
  calls the NMI REST API. No duplicated server logic per mode.
- Every processor exposes a mode selector: Collect.js equivalent, hosted
  fields or component equivalent, redirect equivalent, API-only.
- Exactly one mode per processor is active at a time.
- A mode change is allowed only after a successful test in the new mode.
- Every mode change writes an audit entry including previous mode, new mode,
  actor, test evidence reference and timestamp.

## A4. Super admin API connect console

- A page under `app/(admin)/gateways/` where super_admin can, without changing
  documentation or redeploying: enter credentials for any processor, test the
  connection, enable it, disable it.
- Access: super_admin only, plus 2FA step-up and fresh identity verification
  in the same session before the page renders or any credential action runs.
- Credentials are encrypted with AES-256-GCM before storage. The encryption
  master key comes from environment variables, never from the database.
- After save, the credential is never displayed again. The UI shows only the
  last four characters, the environment (sandbox or live) and the last
  updated timestamp.
- A processor cannot be enabled until a connection test succeeds.
- A processor that has no adapter code cannot be added from the dashboard.
- Routing rules: when no routing rule matches, the payment is aborted. It is
  never sent to another processor as a fallback.

## A5. Login lock

- Two consecutive failed attempts (wrong password or wrong 2FA code) on the
  same account lock that account for 2 hours.
- While locked: correct password does not log in; password reset is blocked;
  changing the password does not lift the lock.
- When a lock starts, the account owner receives an email alert.
- Unlock is possible only by an admin or admin_staff holding the unlock
  permission, and only after confirming email contact with the owner. Every
  unlock writes an audit entry with actor, target, reason and timestamp.
- Failure counters and lock state live in the database so a server restart
  preserves them.
- IP-based rate limiting runs in parallel.
- Error messages never reveal whether an account exists.

## A6. Card payment rules

- Card number, expiry and CVV are entered only in the processor's own secure
  form. Our code and servers never read, store, log or key-capture them.
- After one successful payment on an invoice with a card, the same card is
  blocked for that invoice for the next 24 hours. The rule is per invoice;
  other invoices are unaffected.
- Card or authentication failures (card number, CVV, OTP, 3DS failure) count
  against the card token. Two such failures within 24 hours cause the third
  attempt with that card to be rejected.
- Insufficient-balance failures do not count toward that limit.
- Processor fraud signals or our own blacklist cause immediate rejection.
- Blacklisting is keyed on card token or processor card fingerprint, never on
  the card number.
- Velocity limits on card and IP attempts exist with defaults in
  `config/payment-limits.ts`.
- All amounts are USD, stored `numeric(18,4)`, and computed without
  JavaScript Number.

## A7. Verification and 3DS

- Request 3DS on every payment where the processor supports it.
- If 3DS is not completed, the payment proceeds only when both the billing
  postal code and the payer IP country match the invoice data. If either does
  not match, the payment is not taken and the case enters the manual review
  queue.
- VPN, proxy and Tor checks apply on the payment page.
- Webhooks are accepted only when the signature verifies, and processing is
  idempotent.

## A8. File storage

- Text and accounting data always live in Supabase Postgres.
- Files (PDF, images, KYC documents, logos) go to the company's Google Drive
  when the company has it linked, otherwise to Supabase Storage.
- Every file is encrypted with AES-256-GCM before upload.
- Every file record stores `storage_provider`.
- The provider decision is made at runtime per company.
- When one provider is unavailable the file goes to the other automatically.
- A migration tool moves files between providers, verifies the transfer and
  records an audit entry.

## A9. Branch policy

- `integration` is the long-lived mainline branch. All step branches merge
  into `integration`, and `integration` is the deployment source of truth.
- `main` acts as the release mirror only when the owner chooses to promote.
- Session branches created by the build environment are pushed as usual and
  merged into `integration` by the owner after review.
- See `07_BRANCH_AND_GIT_WORKFLOW.md` for the exact procedure.

## A10. Acceptance phrasing for later chats

When a later chat is unsure whether an added requirement is satisfied, it must
answer all of the following from code and evidence, not from intent:

1. Which file implements it, and which sub-step created that file?
2. Which database table or config holds its state?
3. Which audit action records it?
4. Which verification command proves it?
5. Which UI surface exposes or is protected by it?

## A11. Checkout page (modern, attractive, secure, white-label)

The checkout is a first-class product surface, not a form. It must satisfy all
of the following:

1. Layout. Two columns on desktop with a sticky order summary on the right; a
   single column on mobile with a sticky pay bar respecting the safe area.
   Express payment methods (wallets) appear above the card form, followed by a
   labelled divider before card entry.
2. Clarity. A step indicator shows where the payer is; every state has a
   skeleton while loading, inline validation on blur, and a plain-language
   result screen. Autosave keeps the checkout context so a dropped connection
   does not lose progress.
3. Branding. The checkout is themed entirely from tenant branding (logo,
   colors, fonts) with no platform branding on entitled plans. Dark mode,
   reduced motion, 320px layout and WCAG 2.1 AA are mandatory.
4. Trust. Real trust content only: processor name, PCI statement, refund
   policy auto-display, statement descriptor, seller contact, the
   contact-seller-first notice, and the transaction reference on success.
5. Money transparency. Subtotal, discount, tax line and total are always shown
   separately. No hidden charge may appear after confirmation. The tax line is
   produced by the Step 6 tax determination service and never recomputed on the
   client.
6. Fields. Only what is needed: email, name, billing address, postal code
   (mandatory because of the 3DS rule in A7), country, optional business tax
   registration number, coupon, note, and the consent checkbox whose text,
   version, timestamp, IP and device fingerprint are stored immutably.
7. Card data. Card number, expiry and CVV are entered only inside the
   processor's own hosted fields. Our DOM and servers never read, store, log
   or key-capture them.
8. Saved methods. Returning payers may use their own tokenized saved method,
   which is displayed as brand and last four digits only.
9. Edge cases. Method switch and retry without losing the invoice, per-attempt
   idempotency key, the same-card same-invoice 24-hour notice, the manual
   review notice, expired and revoked links, partial payment, installment and
   BNPL options, and multi-invoice selection.
10. Performance and hardening. LCP under 2.5s, CLS under 0.1, iframe sandbox
    attributes, CSP frame-src allowlist, Subresource Integrity, correct
    autocomplete and input type attributes.

## A12. Tax collection and remittance engine

1. Tax profile per company: jurisdiction, tax registration number, filing
   frequency, and the liability owner (platform when the platform is merchant
   of record, owner when the owner is the merchant).
2. Determination: place of supply, client country and state, product tax class,
   B2B or B2C, reverse charge, exemption with expiry, zero-rated and out of
   scope. Rates live in an effective-dated versioned table and are never
   hardcoded. Every determination stores its reasoning for explainability.
3. Collection: inclusive or exclusive amounts, per-line or invoice level,
   rounding policy, credit note, refund and chargeback automatically reverse
   the collected tax.
4. Segregation: collected tax is held on segregated Tax Payable accounts per
   jurisdiction and rate. It never enters revenue and never enters a spendable
   balance.
5. Remittance: tax period, return draft, review, approval chain (staff to CEO
   to super_admin), remittance record with method, authority reference, date,
   proof upload and USD FX freeze, journal entry Dr Tax Payable and Cr Bank,
   bank reconciliation link, filed and closed states, evidence pack.
6. Filing operations: filing calendar with deadline reminders, penalty and
   interest tracking, accountant-ready export pack, and separate treatment of
   the platform's own subscription tax.
7. Mandatory document fields for tax invoices and credit notes per country,
   exemption certificate register with expiry, and reverse-charge statements.

## A13. Security modernization

1. Passkeys and hardware keys (WebAuthn) as an additive, phishing-resistant
   factor beside TOTP, with named credentials, recovery and audit.
2. Trusted devices and a device centre: device registry, trust scoring,
   revocation, new device alerts.
3. Session registry: global session list, short-lived access token with
   rotating refresh, mid-session IP or device change detection, self-service
   account freeze with audit.
4. Enterprise access: SAML and OIDC single sign-on, SCIM provisioning, tenant
   IP allowlist, just-in-time access with expiry, break-glass with dual
   approval and mandatory audit.
5. Envelope key management: per-tenant data encryption keys, wrapped storage,
   key usage audit, scheduled rotation, and crypto-shredding for offboarding.
6. Central secret registry with owner, purpose, access audit and rotation
   checklist.
7. Network tokenization, 3DS2 exemption handling with documented fallback,
   authorization holds, card-testing detection, and a processor fraud-tool
   adapter that respects gateway-hosted risk decisions.
8. Web hardening: Trusted Types, cooperating headers (COOP, COEP, CORP),
   Permissions-Policy, Clear-Site-Data on logout, Subresource Integrity.
9. Deception and anomaly: honeytokens and canaries, per-tenant behavioural
   baselines, impossible travel detection, automated containment with a
   notification and a working appeal path, continuous audit log integrity
   verification, WORM export.
10. Supply chain: SBOM, dependency pinning, signed commits and provenance,
    DAST in the pipeline.
11. Privacy: user and owner privacy dashboard with export and delete, consent
    ledger, per-tenant data residency selection, cross-border transfer record,
    sub-processor list, DPA page, security.txt, vulnerability disclosure page,
    transparency report, accessibility statement.
12. PWA: biometric app lock, encrypted offline queue, no PII in local storage
    or caches, push alert channel.

## A14. Usability and feature modernization

1. Approval inbox with SLA countdown, filters and bulk actions.
2. Saved views, undo, autosave and optimistic UI primitives used by every
   module that edits records.
3. Explainability messages for money and delivery outcomes: why a payment
   failed or is held, what happens next, expected receipt time.
4. Channel transparency: per-channel delivery, open, click, retry and failure
   views for the owner and a simple view for the client.
5. Owner security centre: security score, checklist, who-did-what digest and
   permission review reminder.
6. Client experience: one-tap pay, hub, receipt and statement download,
   installment and BNPL options, contact-seller-first flow.
7. Finance experience: AR aging automation, cash flow forecast, budget alerts,
   bank reconciliation auto-match and the tax remittance workspace.
8. Developer experience: sandbox keys, webhook replay, OpenAPI documentation.
9. PWA install, offline draft, push notification.
10. Status page with incident communication and an accessibility statement.
11. Rule-based automation only (macros, templates, scheduled reports). No AI
    provider of any kind is added.

## A15. Revision precedence and no-regression rule

- Revision 2 only adds. Nothing in Revision 1 is removed, weakened or renamed.
- The twenty absolute rules and added requirements A1 to A10 remain in force
  and take precedence if any wording ever appears to conflict.
- Every new sub-step obeys the same definition of done, the same audit,
  validation, sanitization, idempotency, locking, RLS and testing rules.
- Placement, ownership boundaries and gates for these additions are in
  `09_REVISION_2_ADDITIONS.md`; the work orders are in
  `08_SUBSTEP_CHECKLISTS.md`.
