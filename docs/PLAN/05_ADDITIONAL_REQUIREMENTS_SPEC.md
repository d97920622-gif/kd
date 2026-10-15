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
