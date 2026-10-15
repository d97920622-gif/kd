// path: docs/PLAN/chat-prompts/CHAT_10.md
# CHAT 10 OF 16 -- Checkout Design, Payment Experience, Wallet, MoR, Payouts, Disputes, Consent Evidence, Subscriptions, BNPL (4 segments)

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

SEGMENT EXECUTION MODEL: this prompt covers the whole step, which is executed as
segments 10A to 10D, one segment per chat. In this chat, find your
current segment in docs/handoffs/CHAT_10_PROGRESS.md, execute only that segment,
and stop at its segment gate. Then paste this same prompt in a new chat for the
next segment. Segment rules: docs/PLAN/10_SEGMENT_GUIDE.md.

BASE BRANCH CHECK (run this before anything else): confirm that the branch this
chat started from already contains the previous chat's work. For a new step,
docs/handoffs/CHAT_09_COMPLETED.md must exist. For a continuation of the
same step, docs/handoffs/CHAT_10_PROGRESS.md must exist. If they are missing,
stop immediately and report that the chat was started from the wrong base
branch (the owner must select the mainline branch that holds the completed
work); do not recreate earlier files and do not start coding.

SCOPE FOR THIS STEP (all segments; do not implement later steps):
### SEGMENT 10A -- Checkout page (chat 1 of 4)
- 10.1 Checkout shell and layout: two-column desktop with sticky order summary, single-column mobile with safe-area pay bar.
- 10.2 Checkout design system: tenant white-label theming tokens, dark mode parity, motion with reduced motion, 320px layout, WCAG AA focus order.
- 10.3 Express payment row above the card form with wallet buttons per capability and a labelled divider.
- 10.4 Payer fields: email, name, billing address, postal code required for the 3DS rule, country, optional business tax registration number, coupon, note and inline validation.
- 10.5 Monetary transparency: subtotal, discount, tax line from the Step 6 tax service and total, with no hidden charges.
- 10.6 Content and trust layer: refund policy auto-display, statement descriptor, seller contact, contact-seller-first notice and explainability messages for declines and next steps.
- 10.7 Consent capture: checkbox text, terms and refund policy versions, timestamp, IP, device fingerprint and immutable snapshot.
- 10.8 Saved tokenized payment methods for returning payers, displayed as brand and last four digits only.
- 10.9 Checkout edge cases: method switch and retry, per-attempt idempotency, same-card same-invoice 24-hour notice, manual review notice, expired and revoked links, partial payment, installment and BNPL options, multi-invoice selection.
- 10.10 Checkout technical hardening: iframe sandbox attributes, CSP frame-src allowlist, SRI, autocomplete and input types, LCP under 2.5s and CLS under 0.1 budgets, card-fields-in-processor-frames assertion.
Segment gate: checkout renders with tenant branding and no platform branding on entitled plans; transparency assertion passes; card-field assertion passes.

### SEGMENT 10B -- Payment core, links, refunds, fees (chat 2 of 4)
- 10.11 Payment orchestration status machine with transitions and guards.
- 10.12 Payment intent creation with idempotency key and gateway transaction linkage.
- 10.13 Capture, void, receipt generation, customer notification and reconciliation.
- 10.14 Payment links: create, share, expiry, revoke and usage analytics.
- 10.15 Pluggable integration modes UI: iframe, SDK, redirect and API only per declared capability.
- 10.16 Refunds: full and partial with approval flow, reason codes, evidence, reconciliation and tax reversal through the Step 6 service.
- 10.17 Partial payments, allocation across invoices and credit application.
- 10.18 Surcharge and fees: fee calculator, platform fee, net settlement and fee reporting.
Segment gate: every payment mutation is idempotent; webhook replay attempts are rejected.

### SEGMENT 10C -- Wallet, merchant of record, payouts (chat 3 of 4)
- 10.19 Wallet core: balances, double-entry ledger and serializable isolation on mutations.
- 10.20 Wallet operations: top-up, withdrawal, holds, statements and negative balance protection.
- 10.21 Merchant of record flow and KYC-gated routing.
- 10.22 MoR collected-tax hold driven by the liability owner flag from the Step 6 tax profile, plus settlement batches.
- 10.23 Payout engine with step-up approvals and generic partner naming.
- 10.24 Payout reconciliation against settlements and wallet movements.
Segment gate: wallet ledger balances to zero; settlement reconciliation is balanced against gateway payouts.

### SEGMENT 10D -- Disputes, consent evidence, subscriptions, BNPL, reports (chat 4 of 4)
- 10.25 Chargeback intake, reason code mapping and deadline tracker.
- 10.26 Evidence pack: all ten parts assembled in one action, gateway-ready formatting and auto-submit per processor.
- 10.27 Auto-defence workspace, chargeback reserve calculator and rate monitoring with the 0.65 percent threshold alert.
- 10.28 Consent evidence engine: delivery proof, chronological timeline and audit chain export.
- 10.29 Client subscriptions: plans, recurring billing, management UI, dunning and proration rules.
- 10.30 BNPL and installment financing with eligibility, schedules and reporting.
- 10.31 Payment reports and analytics.
- 10.32 PCI DSS posture document, payment audit trail, fraud review queue integration and handoff.
Segment gate: an evidence pack is complete for a sample dispute; refund and payout flows are audited and approval-gated.

ADDED IN REVISION 2 (mandatory): read docs/PLAN/09_REVISION_2_ADDITIONS.md and
sections A11 to A15 of docs/PLAN/05_ADDITIONAL_REQUIREMENTS_SPEC.md before
starting. Added sub-steps 10.1 to 10.10 covering the checkout shell, design system, trust layer, edge cases and technical hardening, all in segment 10A. Revision 2 only adds; the twenty absolute rules and
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
starting point. Also record the segment status: complete with the next segment named,
or partial with the exact sub-step to resume from.

SEGMENT RULE: execute exactly one segment per chat. Never start the next segment
in the same chat. At the end of a segment, run npm run verify, record the segment
gate evidence, update the progress file, and state the segment status line:
"Segment NNX complete; next segment NNX+1" or "Segment NNX partial; resume at
sub-step NN.YY".

RESUME INSTRUCTION: read docs/handoffs/CHAT_10_PROGRESS.md, continue from the
first unchecked sub-step, never re-implement an existing passing file.
HOW TO WORK (permission gated, simple). Work one sub-step at a time.

After every sub-step: run npm run verify, commit that sub-step, update
docs/handoffs/CHAT_10_PROGRESS.md, then print exactly these three lines and stop:
DONE: sub-step 10.YY - <one short line>
NEXT: sub-step 10.ZZ - <one short line>
CONTINUE? type continue for the next sub-step, or stop to finish this chat

Then wait. Do not start the next sub-step until the owner types continue. Never
put two sub-steps in one commit, never skip a check, and never cross a segment
gate.

When the owner types stop, print the closing report instead:
STATUS: complete | partial
NEXT: <the file to paste in the next chat>
MERGE: ready to merge into integration | nothing to merge
If the owner replies with the word merge, open a pull request from this session
branch into integration and merge it with a merge commit, then confirm in one line.

For this step: after the last sub-step of a segment, NEXT points to the first sub-step of the next segment; while segments remain, the next chat pastes this same file 10 again, and when the step is complete the next chat pastes CHAT_11.md.

=== END PASTE ===
