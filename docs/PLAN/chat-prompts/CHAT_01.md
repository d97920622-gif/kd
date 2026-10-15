// path: docs/PLAN/chat-prompts/CHAT_01.md
# CHAT 01 OF 16 -- Foundation, Governance, Design System, Layout Architecture

Open a NEW chat and paste everything between the marker lines.
Prerequisite: none. This is the first build chat.

=== BEGIN PASTE ===
You are starting the KD SOLUTION IT platform build. This is CHAT 1 OF 16.
Step 1 of the 16-step execution plan: Foundation, Governance, Design System,
Layout Architecture.

READ FIRST, in this order, inside the repository:
1. MASTER_PROMPT.md -- binding specification and the 20 absolute rules.
2. FEATURE_LIST.md -- the 3,950-feature source list. Its language is Bengali
   because it is an owner-supplied specification. Never copy its language into
   code, comments, filenames, UI text, seeds or commits. English only.
3. docs/PLAN/00_MASTER_EXECUTION_PLAN.md -- step map, dependencies, migration
   timestamp windows.
4. docs/PLAN/02_CONVENTIONS_AND_GUARDRAILS.md -- the rule block you must obey.
5. docs/PLAN/03_FILE_OWNERSHIP_MATRIX.md -- files you own plus the append
   protocol.
6. docs/PLAN/04_DEFINITION_OF_DONE_AND_GATES.md -- global and step 1 gates.
7. docs/PLAN/08_SUBSTEP_CHECKLISTS.md, section "STEP 01".

SCOPE FOR THIS CHAT (never implement later steps):
- 1.1 Toolchain: package.json, tsconfig.json strict (noImplicitAny,
  strictNullChecks, noUnusedLocals, noUnusedParameters), next.config.js,
  tailwind.config.ts, .eslintrc.json, .prettierrc, .gitignore, .env.example,
  components.json, husky hooks, lint-staged.
- 1.2 Quality gate scripts and `npm run verify`.
- 1.3 Core libraries: structured logger, error classes, env schema validation,
  USD-only currency utilities with decimal.js, date, formatting, slug, hash,
  lib/i18n/strings/en.ts.
- 1.4 Design tokens: spacing 4/8/12/16/24/32/48/64, radius scale, shadow
  scale, z-index scale, typography scale, motion tokens, dark mode, high
  contrast, reduced motion, design token JSON export.
- 1.5 Brand system: logo variants light/dark/icon, favicon pack
  16/32/180/192/512, apple touch icon, PWA manifest icons, default OG image,
  brand voice guide, asset library.
- 1.6 shadcn/ui base component set with four states, form primitives using
  React Hook Form plus Zod resolver.
- 1.7 Layouts and shells for public, auth, dashboard, admin and client portal,
  with sidebar, topbar, mobile drawer, bottom navigation, sticky action bar,
  breadcrumbs, footer, offline banner.
- 1.8 config/nav-map.ts as the single navigation source with growth blocks,
  role filter hook, command palette, keyboard shortcuts page, dead-link
  checker.
- 1.9 Page-state system, 320px responsive utilities, accessibility primitives,
  Framer Motion providers with page transitions, stagger and confetti,
  illustration baseline.
- 1.10 Public site skeleton with real English copy: homepage, about, features,
  pricing, contact, industries, calculators, free invoice generator shell,
  terms, privacy, blog shell, 404, 500, offline.
- 1.11 middleware.ts, instrumentation.ts, security headers and CSP nonce
  baseline, sitemap and robots baseline, metadata baseline, print stylesheet.
- 1.12 Web hardening primitives: Trusted Types policy, COOP, COEP, CORP,
  Permissions-Policy, Clear-Site-Data on logout, Subresource Integrity
  baseline, header matrix tests, ADR-0006.
- 1.13 Usability primitives: use-saved-views, use-undo, use-autosave,
  optimistic update helpers, explainability message component and string
  catalogue, empty and error copy conventions.
- 1.14 Governance: .github/workflows/ci.yml, CODEOWNERS, pull request
  template, CONTRIBUTING, SECURITY, CHANGELOG, LICENSE, ADR-0001 to ADR-0007,
  README update, handoff document.

FEATURE SOURCES: FEATURE_LIST.md Part 1 sections A to M, plus Part 10 section
D baseline documentation.

ADDED IN REVISION 2 (mandatory): read docs/PLAN/09_REVISION_2_ADDITIONS.md and
sections A11 to A15 of docs/PLAN/05_ADDITIONAL_REQUIREMENTS_SPEC.md before
starting. Added sub-steps 1.12 web hardening primitives and 1.13 usability primitives. Revision 2 only adds; the twenty absolute rules and
requirements A1 to A10 keep full force. Respect the ownership boundary table in
that file so no code is duplicated or conflicting.

NON-NEGOTIABLE RULES:
- English only, ASCII only, in every file, comment, seed and commit message.
  The only exemption is the owner-supplied FEATURE_LIST.md; record that
  exemption in the english-only checker and in ADR-0002.
- USD only. Money is numeric(18,4) and decimal.js. Never JavaScript Number.
- No test files of any kind. No TODO, FIXME, "Coming Soon" or placeholder
  text. No `any`. No console.log (structured logger only). Path comment on
  every file. Audit entry on every mutation. Zod validation on client and
  server. Sanitize every input. Idempotency on payments. Optimistic locking on
  editable rows. RLS with default-deny on every table. Universal columns on
  every table. Never write forbidden payment brand names; use
  "Global Payout Partners" and "Local Payment Methods via Licensed Partners".
- Zero Trust and Zero Tolerance everywhere.

EXECUTION LOOP per sub-step: read the sub-step, implement only files you own
(append protocol for shared files), run `npm run verify` and fix every
failure, commit as `<type>(step-01/S.S): <summary>` with one sub-step per
commit, update `docs/handoffs/CHAT_01_PROGRESS.md`, then continue.
Never start the next sub-step while a gate fails.

STEP 1 GATES: production build succeeds; Lighthouse at least 90 on the
homepage; dead-link audit clean; `npm run verify` fully green; no non-ASCII
character outside the documented exemption; `/api/health` returns a typed
response.

COMMIT AND PUSH POLICY: commit and push only to the branch this session is
already on. Never create, rename or switch branches. Never force push. The
owner merges into `integration` on GitHub after review.

END OF CHAT, MANDATORY: write docs/handoffs/CHAT_01_COMPLETED.md with scope
and status, sub-steps completed with commit hashes, files added, files
extended with reason, migrations, environment variables, decisions and ADRs,
verification evidence, and the exact starting point for chat 2. Then report in
the chat: sub-steps completed, gates evidence, and the first incomplete
sub-step if any.

RESUME INSTRUCTION, only when this prompt is pasted after a partial step:
read docs/handoffs/CHAT_01_PROGRESS.md, find the first unchecked sub-step, and
continue exactly there. Never re-implement an existing passing file.
=== END PASTE ===
