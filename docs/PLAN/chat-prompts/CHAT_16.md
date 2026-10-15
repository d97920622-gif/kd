// path: docs/PLAN/chat-prompts/CHAT_16.md
# CHAT 16 OF 16 -- Deployment, CI/CD, Cron, Docs, PWA, Performance, Backup/DR, Launch Readiness

Open a NEW chat and paste everything between the marker lines.
Prerequisite: Step 15 complete.

=== BEGIN PASTE ===
You are continuing the KD SOLUTION IT platform build. This is CHAT 16 OF 16.
Step 16: deployment, CI/CD, cron jobs, documentation, PWA, performance,
backup and disaster recovery, and launch readiness.

READ FIRST: 1. MASTER_PROMPT.md (deployment, documentation requirements,
final instruction). 2. FEATURE_LIST.md Part 10 sections A to J, Part 9
sections J and M. 3. docs/PLAN/00_MASTER_EXECUTION_PLAN.md (your migration
window is 20260816000000 to 20260816999999). 4. docs/PLAN/
02_CONVENTIONS_AND_GUARDRAILS.md. 5. docs/PLAN/03_FILE_OWNERSHIP_MATRIX.md.
6. docs/PLAN/04_DEFINITION_OF_DONE_AND_GATES.md (step 16 gates).
7. docs/PLAN/07_BRANCH_AND_GIT_WORKFLOW.md (release and rollback procedure).
8. docs/PLAN/08_SUBSTEP_CHECKLISTS.md section "STEP 16".
9. docs/handoffs/CHAT_15_COMPLETED.md.

SCOPE FOR THIS CHAT:
- 16.1 Netlify production configuration, headers and redirects, ISR and cache
  headers, edge functions, environment management, preview deploys, domain and
  SSL, Cloudflare WAF, DDoS, TLS 1.3, HSTS, DNSSEC, SPF, DKIM and DMARC,
  Turnstile keys per environment.
- 16.2 Docker and VPS alternative: Dockerfile, compose for application,
  database, cache and proxy, health checks, self-host runbook, parity notes
  against Netlify.
- 16.3 CI/CD: ci workflow, security workflow with SAST, DAST, SCA and secret
  scanning, deploy workflow with migrations and rollback, release process,
  changelog automation, branch protection and CODEOWNERS enforcement.
- 16.4 Cron jobs: all twenty jobs implemented, leader-locked, monitored, with
  a registry, a console view and a dead man switch.
- 16.5 Monitoring launch: Sentry releases with source maps, uptime monitoring,
  status page, alert channels, log aggregation, dashboards, on-call, published
  runbooks.
- 16.6 Documentation and governance: README, CONTRIBUTING, SECURITY,
  CHANGELOG, LICENSE, ERD, the ADR set, RUNBOOKS, API.md, DEVOPS.md,
  SECURITY_MODEL.md, COMPLIANCE.md, data flow diagrams, engineering onboarding
  guide, handoff index for all sixteen steps.
- 16.7 PWA and UX polish: manifest, service worker, offline page, install
  prompt, splash screens, offline detection, full audit sweep of loading,
  error, empty and success states, 320px, dark mode, accessibility and motion.
- 16.8 Performance: Lighthouse budget enforcement, bundle analysis, image
  pipeline, font strategy, caching, HTTP/3, Brotli, index audit, N+1 audit,
  load test procedure documented, performance report with measured numbers.
- 16.9 Backup, DR and lifecycle: database and storage backup scripts, restore
  drills, RTO and RPO validation, offsite encrypted backups, tenant offboarding
  with export and delete, data portability, downgrade rules, cost
  optimization, release and launch checklists, launch war room plan, thirty-day
  post-launch plan.
- 16.10 Final audit and sign-off: complete checklist sign-off, penetration test
  remediation verification, zero critical dependencies, traceability matrix
  finalized at 3,950 features with zero unmapped entries, completion statement.

NON-NEGOTIABLE RULES: English and ASCII only; USD only where money appears; no
test files, load tests are documented procedures and SQL or HTTP scripts, not
test files; no TODO, FIXME, "Coming Soon" or placeholders; no `any`; no
console.log; path comment on every file including scripts and configuration
documentation; secrets only through environment variables and never committed;
audit entry for deployment, migration, restore, backup and offboarding
actions; never write forbidden payment brand names; Zero Trust and Zero
Tolerance.

EXECUTION LOOP per sub-step: implement, run `npm run verify`, run the step's
verification (deploy to staging, migrate, roll back, health check, cron dry
run), commit as `<type>(step-16/S.S): <summary>`, update
`docs/handoffs/CHAT_16_PROGRESS.md`.

STEP 16 GATES: production deploy green with health checks; all twenty cron
jobs registered, leader-locked and monitored; migrations applied and rolled
back in staging; restore drill succeeded with measured RTO and RPO;
documentation complete with no missing file; traceability matrix shows 3,950
features with zero unmapped; final security audit signed off.

COMMIT AND PUSH POLICY: commit and push only to the branch this session is
already on. Never create, rename or switch branches. Release promotion to main
is performed by the owner after review, following docs/PLAN/
07_BRANCH_AND_GIT_WORKFLOW.md.

END OF CHAT, MANDATORY: write docs/handoffs/CHAT_16_COMPLETED.md with the
final completion statement, the launch checklist result, and the post-launch
monitoring plan.

RESUME INSTRUCTION: read docs/handoffs/CHAT_16_PROGRESS.md, continue from the
first unchecked sub-step, never re-implement an existing passing file.
=== END PASTE ===
