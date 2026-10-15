// path: docs/PLAN/chat-prompts/CHAT_08.md
# CHAT 08 OF 16 -- Payment Framework Core, Card Rules, 3DS Policy, Routing, Super Admin API Console

Open a NEW chat and paste everything between the marker lines.
Prerequisite: Steps 2 and 4 complete.

=== BEGIN PASTE ===
You are continuing the KD SOLUTION IT platform build. This is CHAT 8 OF 16.
Step 8: Payment framework core, card payment rules, 3DS policy, gateway
routing and the super admin API connect console.

READ FIRST: 1. MASTER_PROMPT.md (payment security, PCI rules, zero tolerance).
2. FEATURE_LIST.md Part 4 sections A1, L2, L3 and Part 11 sections D2 and H.
3. docs/PLAN/05_ADDITIONAL_REQUIREMENTS_SPEC.md sections A4 (API connect
console), A6 (card rules) and A7 (verification and 3DS). 4. docs/PLAN/
06_PROVIDER_DOCS_REGISTRY.md (processor list and adapter paths).
5. docs/PLAN/00_MASTER_EXECUTION_PLAN.md (your migration window is
20260416000000 to 20260416999999). 6. docs/PLAN/
02_CONVENTIONS_AND_GUARDRAILS.md. 7. docs/PLAN/03_FILE_OWNERSHIP_MATRIX.md.
8. docs/PLAN/04_DEFINITION_OF_DONE_AND_GATES.md (step 8 gates).
9. docs/PLAN/08_SUBSTEP_CHECKLISTS.md section "STEP 08".
10. docs/handoffs/CHAT_07_COMPLETED.md.

SCOPE FOR THIS CHAT:
- 8.1 Adapter base interface, capability union type, interaction mode enum
  (hosted fields, redirect, component, API only), shared result types and the
  error mapping contract.
- 8.2 Registry lib/payment/registry.ts: append-only, implemented processors
  only, processor metadata and per-processor config schema. A registry entry
  may exist only when adapter code exists.
- 8.3 Payment domain schema: payment_intents, payments, gateway_transactions,
  refunds, webhook_events, payment_reviews, idempotency_keys usage.
- 8.4 Shared server payment module plus lib/payment/http-client.ts with
  timeouts, bounded retries, SSRF guard and PII-safe logging. Every processor
  later calls provider REST APIs only through this module.
- 8.5 Card rules engine, exactly as required: card number, expiry and CVV are
  entered only in the processor's own secure form; our code never reads,
  stores or key-captures them; after one successful payment on an invoice with
  a card, the same card is blocked for that invoice for 24 hours while other
  invoices are unaffected; two card or authentication failures (wrong number,
  wrong CVV, wrong OTP, 3DS failure) on a card token within 24 hours cause the
  third attempt with that card to be rejected; insufficient balance failures
  are excluded from that count; processor fraud signals or our blacklist cause
  immediate rejection; blacklisting keys on card token or processor card
  fingerprint and never on the card number; decline logging; manual review
  queue.
- 8.6 3DS policy engine: request 3DS on every payment where available; when
  3DS is not completed, allow the payment only if the billing postal code and
  the payer IP country both match the invoice data; otherwise hold the payment
  and route the case to manual review; store authentication evidence.
- 8.7 Velocity limits: config/payment-limits.ts defaults for card attempts,
  IP attempts, invoice attempts and review thresholds; counters per card
  token, per IP and per invoice; alerting on breach.
- 8.8 Routing engine: deterministic rules by company, country, currency,
  capability and KYC status; when no rule matches the payment is aborted and
  never sent to another processor as a fallback; decision log for every
  routing evaluation.
- 8.9 Webhook framework: per-processor signature verification adapters,
  timestamp tolerance, replay protection, event id deduplication in
  webhook_events, idempotent processing, retry and dead-letter handling.
- 8.10 Super admin API connect console: a page under app/(admin)/gateways/
  where super_admin can enter credentials for any processor that has adapter
  code, test the connection, enable it, disable it, and switch the active
  mode, all without documentation changes or redeploys. Credentials are
  encrypted with AES-256-GCM before storage with the master key from
  environment variables and never from the database; after save a credential
  is never displayed again, only the last four characters, the environment and
  the last updated timestamp; a processor cannot be enabled until a connection
  test succeeds; a processor without adapter code cannot be added; access
  requires super_admin plus 2FA step-up plus fresh identity verification in
  the same session; exactly one mode per processor is active at a time and a
  mode change requires a successful test in the new mode; every credential
  action and mode change writes an audit entry.
- 8.11 Fraud engine core: risk scoring, blacklists, blocklists, AML and
  sanctions screening hooks, review queue UI, fraud analytics baseline.

NON-NEGOTIABLE RULES: English and ASCII only; every amount is USD,
numeric(18,4), decimal.js only, never JavaScript Number; no test files; no
TODO, FIXME, "Coming Soon" or placeholders; no `any`; no console.log; path
comment on every file; Zod on client and server; sanitize every input;
idempotency key required on every payment creation and every webhook
processing step; optimistic locking with version; RLS default-deny; audit
entry for payment create, confirm, capture, void, refund, review decision,
credential change and mode change; never write forbidden payment brand names,
use "Global Payout Partners" and "Local Payment Methods via Licensed
Partners"; secrets never logged; Zero Trust and Zero Tolerance.

EXECUTION LOOP per sub-step: implement, migrate, run `npm run verify` plus the
step assertion scripts, commit as `<type>(step-08/S.S): <summary>`, update
`docs/handoffs/CHAT_08_PROGRESS.md`.

STEP 8 GATES: card rules covered by SQL and service assertions; no code path
can receive or store a PAN, expiry or CVV; routing mismatch aborts the payment
and is proven to never fail over; the console requires step-up and
re-verification and refuses processors without adapters; every mode switch
requires a passed test and writes an audit entry; velocity limits configurable
without redeploy.

COMMIT AND PUSH POLICY: commit and push only to the branch this session is
already on. Never create, rename or switch branches.

END OF CHAT, MANDATORY: write docs/handoffs/CHAT_08_COMPLETED.md with scope,
sub-steps, files, migrations, env vars, decisions, evidence and the exact
starting point for chat 9, which implements the 16 processor adapters.

RESUME INSTRUCTION: read docs/handoffs/CHAT_08_PROGRESS.md, continue from the
first unchecked sub-step, never re-implement an existing passing file.
=== END PASTE ===
