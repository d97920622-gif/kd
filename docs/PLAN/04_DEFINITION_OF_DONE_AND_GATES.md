// path: docs/PLAN/04_DEFINITION_OF_DONE_AND_GATES.md
# Definition of Done and Quality Gates

## 1. Global definition of done (every sub-step)

A sub-step is done only when all boxes below are true. Anything less means the
sub-step is still open and the chat continues.

- [ ] Files exist with `// path:` header, ASCII only, English only.
- [ ] `npx tsc --noEmit` passes with zero errors.
- [ ] `npm run lint` passes with zero errors and zero warnings.
- [ ] `npm run check:english-only` passes (exemption list is exact).
- [ ] `npm run check:no-todo` and `npm run check:no-coming-soon` pass.
- [ ] `npm run check:no-tests` passes.
- [ ] `npm run check:path-comment` passes.
- [ ] `npm run check:no-console` passes.
- [ ] `npm run check:forbidden-brands` passes.
- [ ] Migrations (if any) apply forward and roll back cleanly.
- [ ] `npm run check:rls-coverage` shows 100 percent coverage for new tables.
- [ ] `npm run check:schema-standards` passes for new tables.
- [ ] Mutations write an audit entry; verified with a query in the handoff.
- [ ] API routes: Zod validation, rate limit, idempotency where required,
      sanitization, correlation id, typed error envelope.
- [ ] UI: loading, error, empty, success states; 320px; dark mode; a11y.
- [ ] `.env.example` updated for every new variable.
- [ ] `docs/handoffs/CHAT_NN_PROGRESS.md` updated.
- [ ] Conventional commit created with the sub-step id.

## 2. Verification commands (created in Step 1, extended later)

| Command | Checks |
| --- | --- |
| `npm run verify` | Runs every check below plus lint and typecheck |
| `npm run check:english-only` | Non-ASCII scan with documented exemption list |
| `npm run check:no-todo` | TODO, FIXME, XXX, HACK |
| `npm run check:no-coming-soon` | "Coming Soon", "coming soon", placeholder wording |
| `npm run check:no-tests` | Any test file or tests directory |
| `npm run check:path-comment` | First line of every source file |
| `npm run check:no-console` | console.log and friends outside the logger |
| `npm run check:forbidden-brands` | Forbidden payment brand names |
| `npm run check:migration-pairs` | Every up migration has a down migration |
| `npm run check:rls-coverage` | RLS enabled and policied on every table |
| `npm run check:schema-standards` | Universal columns, money type, indexes |
| `npm run check:dead-links` | nav-map and internal links resolve to real routes |
| `npm run check:secrets` | No secrets, keys or tokens committed |
| `npm run check:any-types` | No `any` usage |
| `npm run check:money-math` | No Number arithmetic on money fields |
| `npm run db:migrate` | Applies migrations in order |
| `npm run db:rollback -- <ts>` | Rolls back one migration with its down file |
| `npm run db:assert` | Runs SQL assertion scripts (isolation, ledger, locks) |

## 3. Per-step gates (must be recorded in the handoff)

| Step | Additional gate |
| --- | --- |
| 1 | Build succeeds; Lighthouse at least 90 on homepage; nav dead-link audit clean |
| 2 | Migration up/down on empty database; RLS coverage 100 percent; hash-chain verification passes; every table has the five universal columns |
| 3 | Lock state survives server restart (database assertion); no endpoint reveals account existence; VPN and proxy blocking active on signup |
| 4 | Permission matrix SQL assertion passes; approval chain enforced on every managed action; unlock workflow requires confirmed owner contact |
| 5 | Gapless invoice numbering under concurrent inserts (SQL assertion); PDF snapshot reproducible; zero Number usage in money paths |
| 6 | Tenant isolation on every query; duplicate detectors raise typed errors; statement generation balanced |
| 7 | No file leaves the system unencrypted; provider failover proven; provider migration round-trip verified; no PII in filenames |
| 8 | Card rules covered by SQL assertions; no PAN or CVV path exists; routing mismatch aborts payment (no failover); console requires step-up 2FA; no processor registerable without adapter code |
| 9 | For each of the 16 processors: docs fetched and recorded with date, sandbox verified, webhook signature verification proven, idempotent processing proven, mode selection enforced |
| 10 | Every payment mutation idempotent; settlement reconciliation balanced; evidence pack contains all ten parts; refund flows audited |
| 11 | Token pages noindex and rate limited; no token in referrer or gateway redirect; email duplicate guard active; e-sign evidence stored encrypted |
| 12 | Every outbound message logged and idempotent; webhook signatures verified; API keys hashed at rest with scopes |
| 13 | Debits equal credits assertion passes after every posting; period close irreversible and audited; payslip PDF archived |
| 14 | Admin routes restricted to super_admin, ceo, admin_staff with step-up; CMS writes audited; no platform branding leaks in white-label tenants |
| 15 | Full security checklist from Part 9 and Part 11 signed off; zero tolerance automations verified with scripts; isolation fuzz clean |
| 16 | Production deploy green; all 20 cron jobs registered and monitored; docs complete; traceability matrix at 3,950 features with zero unmapped |

## 3A. Revision 2 gates

The gates introduced by Revision 2 (checkout rendering and transparency, tax
segregation and remittance evidence, passkey and lock compatibility, privacy
appeal path, crypto-shredding proof, PWA local data proof, no-duplicate
ownership check) are listed in `09_REVISION_2_ADDITIONS.md` section 5 and are
mandatory in the owning step's handoff.

## 4. Evidence rules

- Evidence is text captured into the handoff or a file under `docs/EVIDENCE/`.
- No screenshots required; use command output, query results and counts.
- Every claim in a handoff must be reproducible by running the listed command.
- Never mark a gate passed without the command output recorded.

## 5. Stop conditions (chat must stop and report)

- A requirement conflicts with another requirement: stop, choose the strictest
  reading, record an ADR, then continue.
- A gate cannot pass without touching another step's owned file: stop, use the
  append protocol, record it, continue.
- A provider API is unreachable or credentials absent: implement fully with
  the documented request and response shapes, mark the sandbox proof as
  pending in `docs/PROVIDERS/<provider>.md`, and record the exact missing
  credential in the handoff. Never invent API behaviour.
