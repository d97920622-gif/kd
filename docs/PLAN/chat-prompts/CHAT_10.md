// path: docs/PLAN/chat-prompts/CHAT_10.md
# CHAT 10 OF 16 -- Checkout Design, Payment Experience, Wallet, MoR, Payouts, Disputes, Consent Evidence, Subscriptions, BNPL

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
- 10.2 Checkout experience core: hosted and embedded, payment page security
  with VPN, proxy and Tor checks, device fingerprint, Turnstile, mobile wallet
  priority, all four states.
- 10.3 Checkout design system: two-column desktop with sticky order summary,
  single-column mobile with sticky pay bar and safe-area, express pay row
  above the card form, step indicator, skeletons, inline validation, dark mode
  parity, motion with reduced-motion, 320px layout, WCAG AA focus order,
  tenant white-label theming tokens.
- 10.4 Checkout content and trust layer: monetary transparency with subtotal,
  discount, tax line and total, no hidden charges, refund policy auto-display,
  statement descriptor, seller contact, contact-seller-first message,
  immutable order summary snapshot, explainability messages for declines and
  next steps.
- 10.5 Checkout edge cases and retry: method switch and retry without losing
  the invoice, per-attempt idempotency, same-card same-invoice 24-hour notice,
  manual review messaging, expired and revoked link handling, partial payment,
  installment and BNPL options, multi-invoice payment selection, saved
  tokenized payment methods.
- 10.6 Checkout technical hardening: iframe sandbox attributes, CSP frame-src
  allowlist, Subresource Integrity, autocomplete and input type attributes,
  LCP under 2.5s and CLS under 0.1 budgets, assertion that card fields exist
  only inside processor frames.
- 10.7 Payment links: create, share, expiry, revoke, usage analytics.
- 10.8 Pluggable integration modes UI: iframe, SDK, redirect and API only per
  declared capability.
- 10.9 Refunds: full and partial, approval flow, reason codes, evidence,
  reconciliation, tax reversal through the Step 6 service.
- 10.10 Partial payments, allocation across invoices, credit application.
- 10.11 Surcharge and fees: fee calculator, platform fee, net settlement, fee
  reporting; all amounts USD numeric(18,4).
- 10.12 Wallet: balances, double-entry ledger, serializable isolation on
  mutations, top-up, withdrawal, holds, statements, negative balance
  protection.
- 10.13 Merchant of record engine: MoR flow, KYC-gated routing, collected-tax
  hold driven by the liability owner flag from the Step 6 tax profile,
  settlement batches, payout engine with step-up approvals, payout partner
  generic naming, payout reconciliation.
- 10.14 Chargeback, dispute and auto-defence: chargeback handling, the
  ten-part evidence pack (invoice snapshot, receipt, consent proof, delivery
  proof, communication log, client identity, chronological timeline, audit
  chain, platform details, gateway ready formatting), auto-submit per
  processor, deadline tracker, reason code mapping, win and loss analytics,
  chargeback reserve calculator, rate monitoring with the 0.65 percent
  threshold alert, auto-defence workspace.
- 10.15 Consent evidence engine: consent capture with checkbox timestamp, IP,
  device fingerprint, terms and refund policy versions, immutable consent text
  snapshot, visual render, delivery proof, timeline builder, audit chain
  export.
- 10.16 Client subscriptions: plans, recurring billing engine, management UI,
  dunning, proration rules.
- 10.17 BNPL and installment financing framework with eligibility, schedules
  and reporting.
- 10.18 Payment reports and analytics, PCI DSS posture document, payment audit
  trail, fraud review queue integration.

ADDED IN REVISION 2 (mandatory): read docs/PLAN/09_REVISION_2_ADDITIONS.md and
sections A11 to A15 of docs/PLAN/05_ADDITIONAL_REQUIREMENTS_SPEC.md before
starting. Added sub-steps 10.3 checkout design system, 10.4 checkout content and trust layer, 10.5 checkout edge cases and retry, 10.6 checkout technical hardening. Revision 2 only adds; the twenty absolute rules and
requirements A1 to A10 keep full force. Respect the ownership boundary table in
that file so no code is duplicated or conflicting.

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
