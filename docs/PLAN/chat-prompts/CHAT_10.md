// path: docs/PLAN/chat-prompts/CHAT_10.md
# CHAT 10 OF 16 -- Payment Experience, Wallet, MoR, Payouts, Disputes, Consent Evidence, Subscriptions, BNPL

Open a NEW chat and paste everything between the marker lines.
Prerequisite: Step 9 complete.

=== BEGIN PASTE ===
You are continuing the KD SOLUTION IT platform build. This is CHAT 10 OF 16.
Step 10: payment processing experience, virtual wallet, merchant of record,
payouts, chargebacks and disputes, consent evidence, client subscriptions and
BNPL.

READ FIRST: 1. MASTER_PROMPT.md (chargeback and refund evidence system, user
tracking, zero tolerance). 2. FEATURE_LIST.md Part 4 sections B to M and
Part 11 section J. 3. docs/PLAN/05_ADDITIONAL_REQUIREMENTS_SPEC.md sections A6
and A7 (card rules and 3DS enforcement points). 4. docs/PLAN/
00_MASTER_EXECUTION_PLAN.md (your migration window is 20260516000000 to
20260516999999). 5. docs/PLAN/02_CONVENTIONS_AND_GUARDRAILS.md. 6. docs/PLAN/
03_FILE_OWNERSHIP_MATRIX.md. 7. docs/PLAN/04_DEFINITION_OF_DONE_AND_GATES.md
(step 10 gates). 8. docs/PLAN/08_SUBSTEP_CHECKLISTS.md section "STEP 10".
9. docs/handoffs/CHAT_09_COMPLETED.md.

SCOPE FOR THIS CHAT:
- 10.1 Payment orchestration: initiate, confirm, capture, void, receipt,
  notification, status machine, reconciliation with gateway_transactions.
- 10.2 Checkout experience: hosted and embedded, payment page security with
  VPN, proxy and Tor checks, device fingerprint, Turnstile, mobile wallet
  priority, all four states.
- 10.3 Payment links: create, share, expiry, revoke, usage analytics.
- 10.4 Pluggable integration modes UI: iframe, SDK, redirect and API only per
  declared capability.
- 10.5 Refunds: full and partial, approval flow, reason codes, evidence,
  reconciliation, audit.
- 10.6 Partial payments, allocation across invoices, credit application.
- 10.7 Surcharge and fees: fee calculator, platform fee, net settlement,
  fee reporting; all amounts USD numeric(18,4).
- 10.8 Wallet: balances, double-entry ledger, serializable isolation on
  mutations, top-up, withdrawal, holds, statements, negative balance
  protection.
- 10.9 Merchant of record engine: MoR flow, KYC-gated routing, settlement
  batches, payout engine, payout approvals requiring step-up, payout partner
  naming limited to "Global Payout Partners" and "Local Payment Methods via
  Licensed Partners", payout reconciliation.
- 10.10 Disputes: chargeback handling, the ten-part evidence pack (invoice
  snapshot, receipt, consent proof, delivery proof, communication log, client
  identity, chronological timeline, audit chain, platform details, gateway
  ready formatting), auto-submit per processor, deadline tracker, reason code
  mapping, win and loss analytics, chargeback reserve calculator, rate
  monitoring with the 0.65 percent threshold alert.
- 10.11 Consent evidence engine: consent capture with checkbox timestamp, IP,
  device fingerprint, terms and refund policy versions, immutable consent text
  snapshot, visual render, delivery proof, timeline builder, audit chain
  export.
- 10.12 Client subscriptions: plans, recurring billing engine, management UI,
  dunning, proration rules.
- 10.13 BNPL and installment financing framework with eligibility, schedules
  and reporting.
- 10.14 Payment reports and analytics, PCI DSS posture document, payment audit
  trail, fraud review queue integration.

NON-NEGOTIABLE RULES: English and ASCII only; USD only; numeric(18,4) with
decimal.js, never JavaScript Number; no test files; no TODO, FIXME, "Coming
Soon" or placeholders; no `any`; no console.log; path comment on every file;
Zod on client and server; sanitize every input; idempotency key on every
payment and payout mutation; optimistic locking with version; wallet and
settlement mutations use serializable or row locks; RLS default-deny; audit
entry for every payment, refund, wallet, payout, settlement, dispute and
consent action; evidence files stored encrypted through the storage
abstraction with storage_provider recorded; never write forbidden payment
brand names; Zero Trust and Zero Tolerance.

EXECUTION LOOP per sub-step: implement, migrate, run `npm run verify` plus the
settlement and ledger assertions, commit as `<type>(step-10/S.S): <summary>`,
update `docs/handoffs/CHAT_10_PROGRESS.md`.

STEP 10 GATES: every payment mutation idempotent; wallet ledger balances to
zero; settlement reconciliation balanced against gateway payouts; evidence
pack contains all ten parts and is generated in one action; refund and payout
flows audited and approval-gated; payment page blocks VPN, proxy and Tor;
webhook replay attempts rejected.

COMMIT AND PUSH POLICY: commit and push only to the branch this session is
already on. Never create, rename or switch branches.

END OF CHAT, MANDATORY: write docs/handoffs/CHAT_10_COMPLETED.md with scope,
sub-steps, files, migrations, env vars, decisions, evidence and the next
starting point.

RESUME INSTRUCTION: read docs/handoffs/CHAT_10_PROGRESS.md, continue from the
first unchecked sub-step, never re-implement an existing passing file.
=== END PASTE ===
