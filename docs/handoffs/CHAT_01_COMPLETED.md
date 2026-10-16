// path: docs/handoffs/CHAT_01_COMPLETED.md

# CHAT 01 COMPLETED -- Step 1: Foundation, Governance, Design System, Layout Architecture

Status: sub-steps complete -- segments 1A, 1B and 1C are closed with their gates
recorded; segment 1D's sub-steps 1.24 to 1.32 are complete and the segment gate is
the next action, run only on the owner's word.
Segment status: Segment 1D partial; resume at the 1D gate (sub-steps 1.1 to 1.32 complete)
First incomplete sub-step: none; 1.32 is the last sub-step of step 1, so what remains
of step 1 is the segment 1D gate itself
Date: 2026-10-17
Branch: arena/b7780282-kd (merged into integration after review)
Verification floor at this commit: `npm run verify` PASS, 30 of 30 entries

## 1. Scope and status of this chat

Chat 1 of step 1 executed the whole of step 1 in four segments, under the
owner's permission-gated rhythm: one sub-step, one commit, one verification run,
one evidence record, then the three gated lines and a stop for the owner's word.
Segment 1A built the toolchain and the quality gates (1.1 to 1.7). Segment 1B
built the core libraries and the design system (1.8 to 1.17, including the
component gallery its gate needs). The owner continued into 1C in the same chat,
which built the brand pack, the layout shells and the navigation surface (1.18 to
1.23, gate recorded). The owner continued again into 1D, which built the page and
motion states, the web hardening baseline, the usability primitives, the public
site with its claim floor, the platform plumbing (middleware nonce, sitemap,
robots, metadata, print contract), the repository governance files and the
architecture decision records (1.24 to 1.32).

What step 1 deliberately did not build: no database object and no migration
(step 2), no authentication, session or sign-out route (step 3), no role store or
approval engine (step 4), no editor (step 5), no payment surface (steps 8 to 10),
no deployment workflow and no security workflow beyond CI (step 16.3), and no
test of any kind, because Rule 4 forbids a test runner and the platform measures
itself with check scripts, probes and controls instead.

## 2. Sub-steps completed

Segment 1A -- toolchain and quality gates.

| Sub-step | Summary                                                                                                                                                                                                               | Commit  |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 1.1      | Repository toolchain baseline: package.json scripts and pinned dependencies, tsconfig.json strict options, next.config.js, next-env.d.ts, .prettierrc, .prettierignore, extended .gitignore, husky hooks, lint-staged | 57947a7 |
| 1.2      | ESLint configuration: no-explicit-any and no-console as errors, non-ASCII restricted syntax for literals, template elements, JSX text and identifiers, import order, React, Next and forbidden-import rules           | 8317d34 |
| 1.3      | Tailwind and token pipeline: tailwind.config.ts (breakpoint system, CSS variable colors, radius scale), postcss.config.js, components.json, styles/globals.css layer structure, lib/utils/cn.ts                       | b154ba3 |
| 1.4      | Environment schema validation: lib/env/validate-env.ts with Zod, fail-fast boot behaviour, value-free error messages, secret key registry, lib/env/cli.ts, .env.example                                               | a88f8b7 |
| 1.5      | Check scripts A: check:english-only, check:no-todo, check:no-coming-soon, check:no-tests, check:path-comment plus the shared helper library and the four mandated .sh wrappers                                        | e25ddac |
| 1.6      | Check scripts B: check:no-console, check:forbidden-brands, check:migration-pairs, check:dead-links, check:secrets, check:any-types, check:money-math                                                                  | 98951cf |
| 1.7      | Verify runner: scripts/verify.mjs aggregation with PASS/FAIL report and CI-ready exit codes, pre-commit and commit-msg wiring, README quality gate documentation                                                      | 98ac273 |

Segment 1A supporting commits: 82a6ff5 (progress file created), 35b1869 (handoff
for segment 1A), cdc2dcf (the permission-gated rhythm recorded), cca1d8d (the
branch setup options documented).

Segment 1B -- core libraries and design system.

| Sub-step | Summary                                                                                                                                                                                       | Commit  |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 1.8      | Structured logger: JSON lines, levels, correlation id propagation, redaction hook, no console usage                                                                                           | 7cf207e |
| 1.9      | Error library: typed error classes, error codes, envelope builders, no internal detail leakage                                                                                                | 9d5f6c7 |
| 1.10     | USD money utilities on decimal.js: parse, format, arithmetic, rounding policy, money-math guard annotation                                                                                    | d3b5e0d |
| 1.11     | Utility set: date (UTC), formatting, slug, hash (SHA-256 and HMAC), id helpers (UUIDv7 and short references)                                                                                  | dc9592a |
| 1.12     | i18n string catalogue: namespaced structure, key naming rules, copy rules, the literal-copy checker                                                                                           | e17e112 |
| 1.13     | Design tokens A: spacing, radius, shadow and z-index scales, wired into Tailwind and enforced by check:design-tokens                                                                          | 2f25ca8 |
| 1.14     | Design tokens B: typography, colour palette with contrast pairs, dark mode, high contrast, reduced motion, motion tokens, JSON export                                                         | 6eb05dd |
| 1.15     | shadcn/ui primitives A: button, input, textarea, label, checkbox, radio group, select, switch                                                                                                 | cdba8d2 |
| 1.16     | shadcn/ui primitives B: dialog, sheet, popover, dropdown menu, tabs, tooltip, toast, table, skeleton, badge, plus the toast queue and the layout width tokens                                 | b5bb363 |
| 1.17     | Form primitives: React Hook Form with a Zod resolver, the four form states, live-region errors, disabled and loading submit, one-time CSRF token, and the component gallery the 1B gate needs | a976d75 |

Segment 1B evidence commits: 7512444 (1.13), cd64a61 (1.14), 1e78f1f (1.15),
c5a22b7 (1.16), 2b9e998 (1.17), 2cd305d (theme scopes enforced and the 1B gate
closed). Segment 1B gate evidence: `docs/EVIDENCE/step-01/gate-1B.md`.

Segment 1C -- brand, layout, navigation.

| Sub-step | Summary                                                                                                                         | Commit  | Evidence |
| -------- | ------------------------------------------------------------------------------------------------------------------------------- | ------- | -------- |
| 1.18     | Brand assets: logo variants, the favicon pack, the apple touch icon, PWA icons, the default social image, the brand voice guide | b8511e6 | e76be97  |
| 1.19     | Layout shells: public and auth layouts with skip links, focus order and the print base                                          | e95c963 | 88e993a  |
| 1.20     | Layout shells: dashboard, admin and client portal layouts with role-aware framing through one seam                              | 2e3c0aa | 89439a3  |
| 1.21     | Layout components: sidebar, topbar, mobile drawer, breadcrumbs, footer, offline banner, sticky action bar, safe-area tokens     | 5411c93 | c5b23dd  |
| 1.22     | Navigation source: config/nav-map.ts with reserved growth blocks, the role filter, the breadcrumb generator, dead-link wiring   | 37c481b | 1528283  |
| 1.23     | Command palette and the keyboard shortcuts page with focus management and ARIA labels                                           | d048e01 | 319e75d  |

Segment 1C gate: recorded in `docs/EVIDENCE/step-01/gate-1C.md`, commit d9437f0.

Segment 1D -- states, hardening, public site, governance.

| Sub-step | Summary                                                                                                                                                                 | Commit  | Evidence    |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ----------- |
| 1.24     | Page states: loading, empty, error and offline surfaces, bounded retry, the 320 pixel layer                                                                             | 4c9f2a2 | 6f6a0ac     |
| 1.25     | Motion layer: durations from the token bridge, reduced motion, the bounded celebration, illustration baseline                                                           | dcd6b0f | c2926fd     |
| 1.26     | Web hardening baseline: Trusted Types, COOP, COEP, CORP, Permissions-Policy, Clear-Site-Data on logout, SRI rule, header matrix, ADR-0006                               | fb97830 | fbc2546     |
| 1.27     | Usability primitives: saved views, the five second undo window, autosave drafts, the optimistic queue, explainability                                                   | 535c54e | 9db8e73     |
| 1.28     | Public pages, the site footer and the claim floor that refuses copy this build cannot evidence                                                                          | 8c75f2b | a123c2e     |
| 1.29     | Public pages B, the state pages and the free calculators                                                                                                                | 260a23b | 2224f6a     |
| 1.30     | Platform plumbing: middleware with the per-request nonce, instrumentation and its Node half, sitemap, robots, metadata baseline, print contract                         | 0afc679 | 136bff2     |
| 1.31     | Governance A: the CI workflow and its three jobs, review ownership, the pull request template, CONTRIBUTING, SECURITY, the proprietary licence, the generated changelog | 9654866 | 6c685a4     |
| 1.32     | Governance B: the seven architecture decision records and their index, the README refresh, this handoff, and the checks that keep them honest                           | 4dfa2b0 | this commit |

## 3. Files created

The repository holds 335 tracked files at this commit. The shape, by area:

| Area          | What is there                                                                                                                                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Root          | package.json and package-lock.json, tsconfig.json, next.config.js, .eslintrc.json, .prettierrc, .prettierignore, .gitignore, .env.example, README.md, CONTRIBUTING.md, SECURITY.md, CHANGELOG.md, LICENSE                      |
| `.github/`    | workflows/ci.yml (verify, build and the aggregate ci job), CODEOWNERS, pull_request_template.md                                                                                                                                |
| `.husky/`     | pre-commit (lint-staged then the floor) and commit-msg (conventional commit, subject limit, ASCII)                                                                                                                             |
| `app/`        | Root layout, template, error and not-found, robots.ts, sitemap.ts, opengraph-image.tsx, favicon.ico, icon.png, apple-icon.png; route groups (public), (auth), (dashboard), (admin), (client-portal) and (dev); 15 pages in all |
| `components/` | ui/ (12 primitives), shared/ (the form layer), layout/ (5 shells and 10 navigation surfaces), navigation/, public/, branding/, security/, motion/                                                                              |
| `config/`     | brand.ts, commands.ts, design-tokens.ts with its generated design-tokens.json, nav-map.ts, security-headers.ts                                                                                                                 |
| `lib/`        | brand, calculators, env, errors, forms, hooks, i18n (26 namespaces, 1022 keys), logger, motion, security, seo, usability, utils                                                                                                |
| `scripts/`    | verify.mjs, the 25 check modules and their two helpers, changelog.mjs, export-design-tokens.ts, generate-brand-assets.ts, the four mandated .sh wrappers, brand/ (the renderer and its verification)                           |
| `styles/`     | globals.css (four themes, the token variables, the layer structure) and print.css (the two named print sheets)                                                                                                                 |
| `public/`     | brand/ (logo light, dark and icon), icons/ (the favicon pack, the apple touch icon, the PWA and maskable icons)                                                                                                                |
| `docs/`       | PLAN/ (the sixteen-step plan and its supporting documents), ADR/ (seven records and their index), EVIDENCE/step-01/ (the gate records and the probes), handoffs/, BRAND_VOICE.md, COPY_RULES.md                                |
| `migrations/` | Not created: step 2 owns the first migration, and until then check:migration-pairs reports that there is nothing to pair                                                                                                       |

## 4. Files extended

| Path                                | What it carries now                                                                                                                             |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`                      | 39 scripts (the floor, the checks, the two generators and the changelog), engines Node 22 and npm 10, private, UNLICENSED                       |
| `scripts/verify.mjs`                | The 30 entries of the floor in fixed order, one PASS or FAIL line each, CI-ready exit code                                                      |
| `next.config.js`                    | React strict mode, powered-by off, build fails on lint and type errors, cacheComponents off                                                     |
| `styles/globals.css`                | The four theme scopes, the token variables, the print base and the reduced motion layer                                                         |
| `app/layout.tsx`                    | The document shell, the metadata baseline, the print marker, the tooltip provider and force-dynamic for the nonce                               |
| `config/design-tokens.ts`           | Every scale and every colour role, with the generated JSON export beside it                                                                     |
| `docs/handoffs/CHAT_01_PROGRESS.md` | The running record: one evidence section per sub-step, the SEGMENT tables, the starting point of each next sub-step                             |
| `README.md`                         | Setup (Node 22, npm ci), the toolchain table, the 30-entry floor with every script documented, the exemptions, the build model and the step map |

## 5. Database changes

None. Step 1 defines the database rules (universal columns, RLS default-deny,
audit entry per mutation, numeric(18,4) money, optimistic locking) and enforces
what can be enforced without a database: `check:migration-pairs` refuses a
migration without its rollback file, `check:money-math` keeps money arithmetic in
one module, and `check:platform-plumbing` refuses the two server-only keys outside
`lib/env`. The first table, the first policy and the first audit trigger arrive in
step 2, which is where `migrations/` starts.

## 6. Environment variables added

| Variable                    | Tier   | Purpose                                                                                    |
| --------------------------- | ------ | ------------------------------------------------------------------------------------------ |
| `NODE_ENV`                  | server | development, test or production; production enables the strict schema and the boot refusal |
| `NEXT_PUBLIC_APP_URL`       | public | The origin canonical tags, the sitemap, robots and the social image are resolved against   |
| `LOG_LEVEL`                 | server | debug, info, warn or error for the structured logger                                       |
| `SUPABASE_URL`              | secret | Project URL; required in production, refused outside lib/env                               |
| `SUPABASE_ANON_KEY`         | secret | Anonymous key, safe for the browser only because RLS is default-deny                       |
| `SUPABASE_SERVICE_ROLE_KEY` | secret | Server only; bypasses RLS and must never reach a browser, a log line or a response         |

`.env.example` documents every one of them; `.env` is gitignored and
`check:secrets` refuses a credential that ever reaches a tracked file.

## 7. Verification evidence

| Evidence                                          | Result                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run verify` at this commit                   | PASS, 30 of 30 entries                                                                                                                                                                                                                                                                                                                                                                                                              |
| `check:governance`                                | The ten governance artefacts cross-read: 3 CI jobs, Node.js 22 pinned by both the workflow and engines, 6 surfaces under named review, 9 pull request fields, the 7 decision records, the proprietary licence agreeing with the manifest, the changelog carrying every recorded sub-step commit                                                                                                                                     |
| `check:web-hardening`                             | 11 security headers verified (7 in every environment, 3 on the deployed origin), Permissions-Policy refusing by default with 4 named grants, sanitizer allowlist and Trusted Types shaped, Clear-Site-Data gated on TLS, no hand-written script or link in 207 application files                                                                                                                                                    |
| `check:public-site`                               | 12 public pages and 11 namespaces as server components with catalogue metadata, one h1 and no skipped heading level, no unprovable claim, 12 distinct titles, 354 keys checked for a reader, 26 claim words and 7 product fact shapes refused                                                                                                                                                                                       |
| `check:dead-links`                                | 15 routes and 58 links resolve; 0 dynamic links skipped                                                                                                                                                                                                                                                                                                                                                                             |
| Segment 1B gate                                   | `docs/EVIDENCE/step-01/gate-1B.md`: every primitive rendered in four themes and under reduced motion via `check:layout-shells`, `usability-probe.mjs`, `gallery-dom-probe.py` and the style probe                                                                                                                                                                                                                                   |
| Segment 1C gate                                   | `docs/EVIDENCE/step-01/gate-1C.md`: navigation correct for 6 roles, dead-link audit clean, shells and print base verified                                                                                                                                                                                                                                                                                                           |
| Platform probe (production and development)       | `platform-probe.py`: 5 robots checks, 12 sitemap locations all answering 200, the nonce in both directives on 44 script elements, a production policy with no inline and no eval, a static asset without a policy, one stylesheet, no secret in the start-up record                                                                                                                                                                 |
| HTTP hardening probe (production and development) | `http-hardening-probe.py`: 9 header values compared exactly, the content security policy and the Permissions-Policy judged by content, framing refused in production and allowed in development by design                                                                                                                                                                                                                           |
| Production build                                  | `npx next build` exit 0, 0 dynamicIO diagnostics, all public routes present                                                                                                                                                                                                                                                                                                                                                         |
| Continuous integration                            | Runs 38951829955 and 38952873146 on the two 1.31 commits: workflow `ci`, all three jobs green, the build job serving the production build and running both probes against it. The workflow is unchanged since, so the push of this sub-step exercises the same three jobs                                                                                                                                                           |
| Governance probe against the platform             | `governance-probe.py` exit 0, 0 findings: tree clean, the `ci` workflow registered and active, the newest run belonging to HEAD, CODEOWNERS parsing, private vulnerability reporting on, and branch protection on `integration` reported as not configured (the owner's action)                                                                                                                                                     |
| Controls                                          | Control harnesses run per sub-step from outside the repository: each one mutates every guarded file, requires the specific finding and restores the file by hash. The last runs reported 49 controls with 5 immunities for the layout and token guards, 49 controls with 6 immunities for the governance artefacts, and 22 controls with a renamed record and a duplicated record for the decision records, 0 failures in all three |

## 8. Decisions and assumptions

| Decision                                                                                            | Reason                                                                                                                                                                                                                                 | ADR      |
| --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Next.js 15 with React 19, TypeScript 5, Tailwind 3.4, ESLint 8 in eslintrc mode                     | Matches the mandated stack ("Next.js 14+", "Tailwind 3+") and keeps the mandated `.eslintrc.json` file format working with familiar behavior on the target Node LTS line                                                               | ADR-0001 |
| Tailwind 3.4 with `tailwind.config.ts` instead of Tailwind 4 CSS-first configuration                | The mandated structure names `tailwind.config.ts`, `postcss.config.js` and `components.json`; the config-file pipeline is the one those files describe                                                                                 | ADR-0001 |
| `eslint-plugin-import` order rules instead of `simple-import-sort`                                  | The package registry available in the build sandbox does not publish a usable `simple-import-sort`; the import ordering requirement is met by `import/order`, `import/first`, `import/newline-after-import` and `import/no-duplicates` | ADR-0001 |
| Node.js 22 pinned by `engines` and by the CI workflow                                               | One major for both the runner and the manifest, compared by `check:governance` so the two cannot drift                                                                                                                                 | ADR-0001 |
| No test runner, of any kind                                                                         | Rule 4 forbids tests; the platform measures itself with check scripts, probes, controls and CI, and `check:no-tests` refuses a test path, a test dependency or a test script                                                           | ADR-0001 |
| Environment validation is skipped only during `phase-production-build`                              | A production build must not require runtime secrets, while a production server boot must fail fast                                                                                                                                     | ADR-0004 |
| The three Supabase variables are required in production and refused outside `lib/env`               | A missing key fails at boot rather than on the first query, and a server-only key never reaches a browser component or a log line                                                                                                      | ADR-0004 |
| `npm test` is an alias of `npm run verify`                                                          | Rule 4 forbids test runners; CI conventions that call `npm test` must still reach the real gate                                                                                                                                        | ADR-0007 |
| Content checks exempt the governance corpus, the English-only check exempts `FEATURE_LIST.md` alone | The owner specification and the plan restate the prohibited phrases while documenting the rules; the exact lists live in `scripts/checks/_lib.mjs` and the README                                                                      | ADR-0002 |
| Check scripts are Node ESM with thin `.sh` wrappers                                                 | Keeps one implementation, one report format and one exit-code contract while honouring the mandated shell script paths                                                                                                                 | ADR-0007 |
| Heuristic guards (money-math, any-types) are conservative and documented                            | Static analysis without a type checker cannot be exact; the ESLint rules and the type checker cover what the heuristics cannot, and the naming convention removes the false-positive surface                                           | ADR-0001 |
| Copy lives in the catalogue and every visual value lives in the token module                        | A sentence or a colour in one place can be audited and changed; in fourteen files it cannot, and the four themes plus the claim floor depend on both                                                                                   | ADR-0003 |
| A route group is an audience, and role-aware shells take data as props                              | Authentication and the role store belong to steps 3 and 4, so no shell may read a session; one seam renders every role with no privileged default                                                                                      | ADR-0005 |
| `config/nav-map.ts` is the single destination source and is not importable from the shells          | It makes "navigation correct for every role" a property of one data structure, auditable by `check:nav-map` and `check:dead-links`                                                                                                     | ADR-0005 |
| The document is rendered per request so the nonce reaches it, with three file routes static         | A per-request nonce cannot be prerendered; robots, sitemap and the social image hold no nonce and stay static, and the build reports 0 dynamicIO diagnostics                                                                           | ADR-0005 |
| The web hardening baseline refuses inline script in production and allows framing only off-origin   | The policy is deployment-specific: the preview window is a frame, so `frame-ancestors` and HSTS are deployment-only, and a relaxation is written down rather than implied                                                              | ADR-0006 |
| The security policy prints the process and refuses to promise a response window or print an address | A window is a commitment the deployment makes and keeps; the private advisory form is the channel, and an invented address is never read                                                                                               | ADR-0007 |
| One sub-step per commit, one segment per chat, gates crossed only on the owner's word               | The history is the record: the changelog is generated from it, the progress file maps every sub-step to its commit, and a partial chat still hands off a recoverable position                                                          | ADR-0007 |
| The public site states only what this build can evidence                                            | `check:public-site` refuses 26 claim words and 7 product fact shapes, and the omitted sections are omitted rather than faked                                                                                                           | ADR-0003 |

## 9. Known risks and pending external credentials

| Item                                                     | Impact                                                                                                                                                                              | Owner action required                                                                                                                 |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Supabase project credentials are not present             | `env:validate` fails in a production runtime until they exist (by design); no step 1 functionality depends on them                                                                  | Provide `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` before step 2 migrations run                                 |
| Lighthouse at least 90 on the homepage is outstanding    | This environment has no browser, so the 1D gate's performance item cannot be measured here; the public-pages probe's byte, script and stylesheet counts are the recorded substitute | Run Lighthouse against the deployed preview before the 1D gate is closed, and record the result in `docs/EVIDENCE/step-01/gate-1D.md` |
| Branch protection on `integration` is not configured yet | A pull request can be merged without the `ci` check passing                                                                                                                         | Enable branch protection on `integration` and require the `ci` status check                                                           |
| `deploy.yml` and `security.yml` do not exist             | Deployment and the scheduled security jobs (dependency and secret scanning) arrive in step 16.3; CI is the only workflow today                                                      | Nothing now; the plan owner is step 16.3                                                                                              |
| GitHub Actions deprecation notices on the runner         | `actions/checkout@v4` and `actions/setup-node@v4` are annotated as running on the Node 24 runtime, and `ubuntu-latest` moves to Ubuntu 26 on 2026-10-19                             | Step 16.3 pins or upgrades the actions and the runner image                                                                           |
| The dead-link audit grows with the public surface        | 15 routes and 58 links today; a new page that is not reachable from the navigation map is a finding                                                                                 | Nothing now; the check is part of the floor and fails on a broken destination                                                         |
| Focus and ARIA contracts are verified from source        | There is no browser dependency in the floor, so a regression only a real browser would expose is caught by the gallery probes during a segment gate                                 | Run the probes at each segment gate; the tools are committed in `docs/EVIDENCE/step-01/`                                              |

## 10. Starting point for the next chat

- Next: the segment 1D gate, on the owner's word. It runs the production build,
  the dead-link audit, the verification floor and the accessibility, focus and
  print probes, records its evidence in `docs/EVIDENCE/step-01/gate-1D.md`, and
  closes step 1.
- After step 1 is closed and merged: step 2, database foundation, migrations, RLS,
  encryption and the audit ledger, opened with
  `docs/PLAN/chat-prompts/CHAT_02.md`.
- Read before coding, in order: `MASTER_PROMPT.md`, `FEATURE_LIST.md`,
  `docs/PLAN/00_MASTER_EXECUTION_PLAN.md`, `docs/PLAN/02`, `docs/PLAN/03`,
  `docs/PLAN/04`, `docs/PLAN/08` (STEP 02), then the revision 2 files
  `docs/PLAN/09_REVISION_2_ADDITIONS.md` and sections A11 to A15 of
  `docs/PLAN/05_ADDITIONAL_REQUIREMENTS_SPEC.md`.
- Do not re-implement anything from 1.1 to 1.32. On a resume, run the preflight
  first: branch against origin, clean tree, dependencies installed, `npm run
verify` at the current tip. If the floor is green, continue from the first
  incomplete slice rather than rewriting a passing file.
- The working tree is clean, the floor is green at 30 of 30 entries, the
  pre-commit gate is active, and both CI runs on the 1.31 commits are green.
- Segment 1D stops with "Segment 1D complete; step 1 complete" once its gate is
  recorded, or with "Segment 1D partial; resume at the 1D gate" if it is not.
