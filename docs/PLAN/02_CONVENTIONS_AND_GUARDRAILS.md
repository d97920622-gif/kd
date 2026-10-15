// path: docs/PLAN/02_CONVENTIONS_AND_GUARDRAILS.md
# Conventions and Guardrails (apply to every step, every chat)

This file is the canonical rule block. Every chat must read it and follow it.
The same block is condensed inside each `chat-prompts/CHAT_NN.md` file.

## 1. Non-negotiable rules (restated)

1. English only. Zero non-ASCII characters in any repository file, including
   comments, seeds, UI text, filenames, docs and commit messages.
2. USD only. All money is `numeric(18,4)`. Never use JavaScript Number for
   money. Use decimal.js for every calculation and comparison.
3. Text and structured data always live in Supabase PostgreSQL. Files live in
   the tenant's Google Drive when linked, otherwise in Supabase Storage.
   Every file is AES-256-GCM encrypted before upload and records
   `storage_provider`.
4. No test files of any kind. No `tests/` folder, no `.test.ts`, no `.spec.ts`,
   no Playwright, no Jest, no Vitest.
5. No TODO, no FIXME, no "Coming Soon", no placeholder or lorem ipsum text.
6. No `any` type. TypeScript strict everywhere. Explicit return types.
7. No `console.log`. Use the structured logger from step 1.
8. Every file starts with `// path: relative/path/to/file.ext`.
9. Every table has `id` (UUID v7), `company_id`, `created_at`, `updated_at`,
   `deleted_at` plus `version` on editable rows.
10. Every table has RLS enabled with a default-deny policy and tenant
    isolation policy.
11. Every mutation writes an audit log entry with correlation id.
12. Every API validates input with Zod on the server and reuses the same
    schema/client validation on the client.
13. Every input is sanitized: XSS, SQL injection (parameterized queries only),
    CSRF (double-submit), SSRF, path traversal, header injection, null byte,
    Unicode normalization (NFC), zero-width and RTL removal.
14. Every payment carries an idempotency key.
15. Every editable record uses optimistic locking (`version` column,
    `WHERE id = ? AND version = ?`, `ConflictError` on 0 rows).
16. Roles: `super_admin` > `ceo` > `admin_staff` > `owner` > `staff`.
    Clients never log in; they use tokenized links.
17. Every approval-managed action flows through the approval chain
    (staff -> CEO -> super_admin) with L1/L2/L3 levels.
18. Never write bKash, Nagad, GCash, UPI, PromptPay, PayNow, Alipay,
    WeChat Pay, DuitNow, MoMo, OVO, GoPay, PayPay, KakaoPay, GrabPay,
    TrueMoney, Dana or Boost anywhere. Use "Global Payout Partners" for
    payouts and "Local Payment Methods via Licensed Partners" for collection.
19. Zero Trust and Zero Tolerance on every request, every role, every path.
20. VPN, proxy, Tor and datacenter IP detection and blocking on signup,
    payment, KYC upload and admin access; flag with step-up 2FA on login.

## 2. Forbidden features (never build)

- QR business card module.
- AI provider layer (OpenAI, Claude, Gemini or similar).
- `accountant`, `affiliate`, `reseller` roles.
- Test files and test folders.
- Any non-USD storage of amounts, any float money math.

## 3. Naming and structure

- Files: kebab-case. React components: PascalCase. Functions: camelCase.
- Constants: SCREAMING_SNAKE_CASE. Types: PascalCase.
- Tables: snake_case plural. Columns: snake_case.
- Indexes: `idx_{table}_{columns}`. Foreign keys: `fk_{table}_{ref_table}`.
- Checks: `chk_{table}_{column}_{rule}`. Enums: `{name}_enum`.
- Max 500 lines per file, max 50 lines per function. Split, never exceed.
- React Server Components by default; client components only when needed and
  marked `"use client"`.

## 4. Required companion artifacts per data feature

For every entity a step introduces all of these, in this order:

1. Migration (up and down) with indexes, constraints, RLS, audit trigger.
2. Zod schema (`schemas/<entity>.ts`) exported as `createX`, `updateX`.
3. TypeScript domain type (`types/<entity>.ts`).
4. Repository/service (`services/<entity>/<entity>-service.ts`).
5. API route (`app/api/<entity>/route.ts`) with rate limit, idempotency,
   sanitization, correlation id, audit log, error envelope.
6. UI pages/components with four states.
7. Duplicate detection where applicable.
8. Nav entry in `config/nav-map.ts` if it has a page.

## 5. Error, logging and response envelope

```ts
// Success
{ "data": T, "meta": { "correlation_id": "uuid", "page": {...} } }
// Failure
{ "error": { "code": "invoice_not_found", "message": "English message",
             "details": [], "correlation_id": "uuid" } }
```

- Error classes: `ValidationError`, `UnauthorizedError`, `ForbiddenError`,
  `NotFoundError`, `ConflictError`, `RateLimitError`, `DuplicateError`,
  `GatewayError`, `StorageError`, `ComplianceError`.
- Never expose internal error details, SQL text or stack traces to users.

## 6. Sub-step execution loop (mandatory in every chat)

For each sub-step, in order:

1. Re-read the owning part of `FEATURE_LIST.md` and the sub-step line in
   `08_SUBSTEP_CHECKLISTS.md`.
2. Create or extend files owned by the step (ownership matrix).
3. Write migrations with rollback, run them, verify RLS coverage.
4. Run `npm run verify` (lint, typecheck, english-only, no-todo, no-tests,
   path-comment, no-console-log, migration-pair, rls-coverage, dead-link).
5. Write the audit log entry path and confirm the mutation writes it.
6. Update `docs/handoffs/CHAT_NN_PROGRESS.md` checklist line to done.
7. Commit with a conventional commit message including the sub-step id.

Do not start sub-step N+1 while any gate of sub-step N fails.

## 7. Commit convention

```
<type>(step-NN/SS): <imperative summary>
```

Types: `feat`, `fix`, `refactor`, `perf`, `docs`, `chore`, `security`.
Example: `feat(step-08/8.3): add card velocity and token blacklist engine`.
One sub-step per commit. Never squash two sub-steps into one commit. Never
force push. Never commit `.env`, secrets, `node_modules` or build output.

## 8. Resume protocol (when a chat runs out of context)

1. Read `docs/handoffs/CHAT_NN_PROGRESS.md` and the newest
   `CHAT_NN_COMPLETED.md`.
2. Run `npm run verify` and `git status` to confirm the tree state.
3. Find the first unchecked sub-step. Continue exactly there.
4. Never rewrite a file that already exists and passes verification; extend it.
5. End the chat with an updated progress file.

## 9. Handoff protocol

Path: `docs/handoffs/CHAT_NN_COMPLETED.md`. Required sections:

- Step scope and status (complete or partial with first incomplete sub-step).
- Sub-steps completed, with commit hashes.
- Files created, files extended (with reason).
- Migrations added (up/down pairs), tables added, RLS policies added.
- Environment variables added, with masked examples.
- Decisions and assumptions (link to ADRs).
- Verification evidence: `npm run verify` output, migration up/down result,
  RLS coverage summary, audit ledger check.
- Exact starting point for the next chat.

## 10. Security checklist per sub-step

- Zero Trust: authenticate and authorize every request, every time.
- Least privilege: minimum scope, minimum duration, JIT for elevation.
- Segregation: no client-supplied `company_id` trusted, always resolved
  server-side from the session.
- Cross-tenant access returns 404, never 403, never data.
- Secrets: AES-256-GCM at rest, master key from environment, masked in UI,
  never logged, never returned by API.
- Rate limit and idempotency present on every mutating endpoint.
- Audit log written for create, update, delete, view-sensitive, export,
  impersonation, approval, unlock, mode switch, key change.
- No card number, expiry or CVV ever reaches our servers, logs or database.

## 11. UI checklist per screen

- Loading skeleton, error with retry, empty with CTA, success confirmation.
- 320px layout verified, touch targets at least 44x44, font at least 16px.
- Keyboard navigable, focus ring visible, ARIA labels on icon buttons,
  `aria-live` for errors, skip link present.
- Dark mode parity, reduced motion respected, contrast at least 4.5:1.
- All copy in English, sourced from `lib/i18n/strings/en.ts`.

## 12. Documentation duty

- Complex logic gets a short JSDoc block.
- New architectural decisions get `docs/ADR/ADR-NNNN-*.md` (context, decision,
  consequences, alternatives).
- New operational procedures get a file in `docs/RUNBOOKS/`.
- API changes get an entry in `docs/API.md` and the OpenAPI spec.
