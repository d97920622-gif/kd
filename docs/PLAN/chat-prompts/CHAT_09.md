// path: docs/PLAN/chat-prompts/CHAT_09.md
# CHAT 09 OF 16 -- 16 Processor Adapters, NMI Dual Mode, Advanced Capabilities, Sandbox Validation

Open a NEW chat and paste everything between the marker lines.
Prerequisite: Step 8 complete. This step requires internet access to read the
processors' current official documentation in the same session.

=== BEGIN PASTE ===
You are continuing the KD SOLUTION IT platform build. This is CHAT 9 OF 16.
Step 9: the sixteen payment processor adapters, NMI dual mode and sandbox
validation.

READ FIRST: 1. MASTER_PROMPT.md. 2. FEATURE_LIST.md Part 4 sections A2 to A8.
3. docs/PLAN/05_ADDITIONAL_REQUIREMENTS_SPEC.md sections A1 (documentation
rule), A2 (processor list), A3 (NMI dual mode). 4. docs/PLAN/
06_PROVIDER_DOCS_REGISTRY.md (all sixteen processors, docs links, sandbox
facts, fixed adapter paths). 5. docs/PLAN/00_MASTER_EXECUTION_PLAN.md (your
migration window is 20260501000000 to 20260501999999). 6. docs/PLAN/
02_CONVENTIONS_AND_GUARDRAILS.md. 7. docs/PLAN/03_FILE_OWNERSHIP_MATRIX.md.
8. docs/PLAN/04_DEFINITION_OF_DONE_AND_GATES.md (step 9 gates).
9. docs/PLAN/08_SUBSTEP_CHECKLISTS.md section "STEP 09".
10. docs/handoffs/CHAT_08_COMPLETED.md.

BINDING DOCUMENTATION RULE: before writing any processor adapter you must
fetch that processor's current official documentation from the processor's own
website in this session. Writing adapter code from memory or assumption is
forbidden. For every processor create docs/PROVIDERS/<provider>.md recording
the documentation URLs used, sandbox URLs used, fetch date, API version,
authentication model, request and response shapes for the calls implemented,
webhook signature mechanism, test cards or test account facts, and any
deviation found from docs/PLAN/06_PROVIDER_DOCS_REGISTRY.md.

BASE BRANCH CHECK (run this before anything else): confirm that the branch this
chat started from already contains the previous chat's work. For a new step,
docs/handoffs/CHAT_08_COMPLETED.md must exist. For a continuation of the
same step, docs/handoffs/CHAT_09_PROGRESS.md must exist. If they are missing,
stop immediately and report that the chat was started from the wrong base
branch (the owner must select the mainline branch that holds the completed
work); do not recreate earlier files and do not start coding.

SCOPE FOR THIS CHAT, one adapter file per processor:
- 9.1 Documentation protocol executed for all sixteen processors.
- 9.2 Shared server module completion; every adapter routes its server calls
  through the shared module and the SSRF-guarded HTTP client.
- 9.3 Stripe: payment intents, hosted checkout, webhooks, refunds, Connect
  hooks for merchant of record.
- 9.4 PayPal standalone (Orders v2) and Braintree.
- 9.5 Paddle: checkout, subscriptions, webhooks, sandbox credentials.
- 9.6 NMI dual mode: Collect.js is the default mode with single-use tokens
  that expire after 24 hours; the Payment Component mode requires an npm
  package whose addition is requested through the integrator because
  package.json is integrator-owned; record the exact npm request text in
  docs/PROVIDERS/nmi.md; both modes converge on the same shared server module
  calling the NMI REST API; mode is per company with exactly one active mode
  and a switch requires a passed test plus an audit entry.
- 9.7 Authorize.Net: hosted fields, transaction API, webhooks, sandbox.
- 9.8 Adyen: checkout, webhooks, MarketPay hooks.
- 9.9 Verifone (2Checkout) and BlueSnap.
- 9.10 Square and Payoneer with a per-account-type capability matrix.
- 9.11 FastSpring and PayPro Global including test mode and IPN simulator.
- 9.12 Payarc/PaymentCloud and Rapyd.
- 9.13 Custom adapter: owner-defined HTTPS gateway, JSON-driven
  configuration, SSRF-guarded, configurable signature scheme, no
  provider-specific behaviour hardcoded.
- 9.14 Advanced capability integration per processor: network tokenization,
  3DS2 exemptions, hosted risk or fraud tooling, authorization holds, wallet
  express pay; implement where the processor documents support and record the
  evidence in docs/PROVIDERS/<provider>.md.
- 9.15 Sandbox validation per processor with recorded calls and observed
  results; when credentials are unavailable, record the exact missing
  credential and mark the sandbox proof pending without inventing behaviour.
- 9.16 Registry and console wiring, capability and mode matrix surface,
  docs/PROVIDERS/INDEX.md, corrections applied back to
  docs/PLAN/06_PROVIDER_DOCS_REGISTRY.md.

ADDED IN REVISION 2 (mandatory): read docs/PLAN/09_REVISION_2_ADDITIONS.md and
sections A11 to A15 of docs/PLAN/05_ADDITIONAL_REQUIREMENTS_SPEC.md before
starting. Added sub-step 9.14 advanced capability integration per processor with documented evidence. Revision 2 only adds; the twenty absolute rules and
requirements A1 to A10 keep full force. Respect the ownership boundary table in
that file so no code is duplicated or conflicting.

NON-NEGOTIABLE RULES: English and ASCII only; every amount is USD,
numeric(18,4), decimal.js only; no test files, use SQL and HTTP assertion
scripts instead; no TODO, FIXME, "Coming Soon" or placeholders; no `any`; no
console.log; path comment on every file; Zod validation of every request and
response payload; sanitize every input; idempotency on create, confirm and
webhook processing; webhook processing only after signature verification;
audit entry for every payment action and mode change; no card number, expiry
or CVV may ever reach our servers; never write forbidden payment brand names;
secrets encrypted with AES-256-GCM and never logged; Zero Trust and Zero
Tolerance.

EXECUTION LOOP per sub-step: fetch docs, record facts, implement the adapter,
run the sandbox validation calls, register the processor only when the code
and evidence exist, run `npm run verify`, commit as
`<type>(step-09/S.S): <summary>`, update
`docs/handoffs/CHAT_09_PROGRESS.md`.

STEP 9 GATES: sixteen adapters exist with one file each; every processor has
docs/PROVIDERS/<provider>.md with a fetch date; sandbox validation evidence
recorded or a precise pending-credential record; webhook signature
verification proven per processor; idempotent processing proven; NMI has both
modes implemented and the mode switch rule enforced; registry contains only
implemented processors; connectable from the admin console.

COMMIT AND PUSH POLICY: commit and push only to the branch this session is
already on. Never create, rename or switch branches.

END OF CHAT, MANDATORY: write docs/handoffs/CHAT_09_COMPLETED.md listing per
processor: docs verified, sandbox state, mode support, evidence paths, pending
credentials.

RESUME INSTRUCTION: read docs/handoffs/CHAT_09_PROGRESS.md, continue from the
first unchecked processor sub-step, never re-implement an existing passing
adapter.
=== END PASTE ===
