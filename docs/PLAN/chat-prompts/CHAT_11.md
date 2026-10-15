// path: docs/PLAN/chat-prompts/CHAT_11.md
# CHAT 11 OF 16 -- Client Portal, Token Checkout Page, Tokenized Access, Email Journey, Branding, White-label, Document Integrity

Open a NEW chat and paste everything between the marker lines.
Prerequisite: Step 10 complete.

=== BEGIN PASTE ===
You are continuing the KD SOLUTION IT platform build. This is CHAT 11 OF 16.
Step 11: tokenized client portal, client email journey, tenant branding,
white-label tier and document integrity.

READ FIRST: 1. MASTER_PROMPT.md (security layer 8 token and link security,
rule 4 no client login). 2. FEATURE_LIST.md Part 5 sections A to L, plus
Part 9 section F. 3. docs/PLAN/00_MASTER_EXECUTION_PLAN.md (your migration
window is 20260601000000 to 20260601999999). 4. docs/PLAN/
02_CONVENTIONS_AND_GUARDRAILS.md. 5. docs/PLAN/03_FILE_OWNERSHIP_MATRIX.md.
6. docs/PLAN/04_DEFINITION_OF_DONE_AND_GATES.md (step 11 gates).
7. docs/PLAN/08_SUBSTEP_CHECKLISTS.md section "STEP 11".
8. docs/handoffs/CHAT_10_COMPLETED.md.

BASE BRANCH CHECK (run this before anything else): confirm that the branch this
chat started from already contains the previous chat's work. For a new step,
docs/handoffs/CHAT_10_COMPLETED.md must exist. For a continuation of the
same step, docs/handoffs/CHAT_11_PROGRESS.md must exist. If they are missing,
stop immediately and report that the chat was started from the wrong base
branch (the owner must select the mainline branch that holds the completed
work); do not recreate earlier files and do not start coding.

SCOPE FOR THIS CHAT:
- 11.1 Token engine: HMAC-SHA256 signed 128-bit random tokens, per-document
  links, plan-based expiry (7, 30, 90 or 365 days), revoke, re-issue, optional
  email OTP gate with 6 digits and 5 minute expiry, no PII in URLs, masked in
  logs and analytics, leak detection alerts, noindex on all token pages,
  rate limiting and brute-force guard.
- 11.2 Client pages under app/(client-portal): invoice view at /i/[token],
  estimate approval at /e/[token], receipt view and download at /r/[token],
  client hub at /hub/[token], contract signing at /c/[token], expired and
  invalid token pages.
- 11.3 Token checkout composition: /i/[token]/pay and payment link routes
  render the Step 10 checkout component set inside tenant branding with
  noindex, token rate limits, OTP gate, no token in referrer or gateway
  redirect, saved-method display.
- 11.4 Client email journey: invoice email, payment reminders, receipts,
  statements, dunning messages, delivery tracking with open and click events,
  duplicate send guard, per-tenant sender identity.
- 11.5 Tenant branding: logo, colors, fonts, email skin, auto-apply to
  documents and portal, live preview, per-document overrides.
- 11.6 White-label: platform brand removal, custom domain with plan gating,
  email domain configuration, DNS and SSL guidance.
- 11.7 Form and data safety UX: inline validation, autosave, unsaved changes
  guard, double submit guard, PII masking in the interface.
- 11.8 Document integrity and workflow: immutable snapshots, hash verification
  on view, e-signature capture with evidence, staff draft to owner send
  approval flow, bulk email workflow.
- 11.9 Quality and lifecycle UX: client data quality checks, industry presets
  and template library, tenant lifecycle and growth UX, mobile and print
  polish for all client pages.
- 11.10 Client explainability and support: plain-language reason for a failed
  or held payment, what happens next, expected receipt time, delivery
  transparency view backed by the Step 4 message log, contact-seller-first
  flow for disputes.

ADDED IN REVISION 2 (mandatory): read docs/PLAN/09_REVISION_2_ADDITIONS.md and
sections A11 to A15 of docs/PLAN/05_ADDITIONAL_REQUIREMENTS_SPEC.md before
starting. Added sub-steps 11.3 token checkout composition, 11.10 client explainability and support. Revision 2 only adds; the twenty absolute rules and
requirements A1 to A10 keep full force. Respect the ownership boundary table in
that file so no code is duplicated or conflicting.

NON-NEGOTIABLE RULES: English and ASCII only; USD only; numeric(18,4) with
decimal.js; no test files; no TODO, FIXME, "Coming Soon" or placeholders; no
`any`; no console.log; path comment on every file; Zod on client and server;
sanitize every input; RLS default-deny on every new table; audit entry for
token issue, revoke, re-issue, view of sensitive documents, e-signature and
send actions; tokens are never passed to gateway redirects and never appear in
referrers; emails are queued through the notification interface and delivered
by step 12 adapters; never write forbidden payment brand names; Zero Trust and
Zero Tolerance.

EXECUTION LOOP per sub-step: implement, migrate, run `npm run verify`, commit
as `<type>(step-11/S.S): <summary>`, update
`docs/handoffs/CHAT_11_PROGRESS.md`.

STEP 11 GATES: token pages are noindex and rate limited; expired and revoked
tokens behave correctly; no token appears in referrer or gateway redirect; the
email duplicate guard prevents repeat sends within one minute; e-signature
evidence is stored encrypted with a content hash; white-label removes platform
branding only for entitled plans.

COMMIT AND PUSH POLICY: commit and push only to the branch this session is
already on. Never create, rename or switch branches.

END OF CHAT, MANDATORY: write docs/handoffs/CHAT_11_COMPLETED.md with scope,
sub-steps, files, migrations, env vars, decisions, evidence and the next
starting point.

RESUME INSTRUCTION: read docs/handoffs/CHAT_11_PROGRESS.md, continue from the
first unchecked sub-step, never re-implement an existing passing file.
HOW TO WORK (permission gated, simple). Work one sub-step at a time.

After every sub-step: run npm run verify, commit that sub-step, update
docs/handoffs/CHAT_11_PROGRESS.md, then print exactly these three lines and stop:
DONE: sub-step 11.YY - <one short line>
NEXT: sub-step 11.ZZ - <one short line>
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

For this step: the next chat pastes CHAT_12.md; if this step is not finished, it pastes this same file 11 again instead.

=== END PASTE ===
