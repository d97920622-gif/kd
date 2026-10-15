// path: docs/PLAN/chat-prompts/CHAT_01.md
# CHAT 01 OF 16 -- Foundation, Governance, Design System, Layout Architecture (4 segments)

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

SEGMENT EXECUTION MODEL: this prompt covers the whole step, which is executed as
segments 1A to 1D, one segment per chat. In this chat, find your
current segment in docs/handoffs/CHAT_01_PROGRESS.md, execute only that segment,
and stop at its segment gate. Then paste this same prompt in a new chat for the
next segment. Segment rules: docs/PLAN/10_SEGMENT_GUIDE.md.

SCOPE FOR THIS STEP (all segments; do not implement later steps):
### SEGMENT 1A -- Toolchain and quality gates (chat 1 of 4)
- 1.1 Repository toolchain baseline: package.json scripts, tsconfig.json strict options, next.config.js, .prettierrc, .gitignore, husky hooks, lint-staged.
- 1.2 ESLint configuration: no-explicit-any as error, no-console as error, non-ASCII restricted syntax, import order, React and Next rules.
- 1.3 Tailwind and token pipeline: tailwind.config.ts, PostCSS, components.json, CSS layer structure.
- 1.4 Environment schema validation: lib/env/validate-env.ts, boot-time fail fast, typed environment access, .env.example documented entries.
- 1.5 Check scripts A: check:english-only, check:no-todo, check:no-coming-soon, check:no-tests, check:path-comment.
- 1.6 Check scripts B: check:no-console, check:forbidden-brands, check:migration-pairs, check:dead-links, check:secrets, check:any-types, check:money-math.
- 1.7 Verify runner: npm run verify aggregation, report format, pre-commit and commit-msg wiring, CI-ready exit codes.
Segment gate: every check script runs without false positives; all scripts documented in README.md.

### SEGMENT 1B -- Core libraries and design system (chat 2 of 4)
- 1.8 Structured logger: JSON lines, levels, correlation id propagation, redaction hook, zero console usage.
- 1.9 Error library: typed error classes, error codes, response envelope builder, no internal detail leakage.
- 1.10 USD money utilities: decimal.js wrappers, parse, format, add, subtract, multiply, divide, rounding policy, money-math guard annotation.
- 1.11 Utility set: date in UTC, formatting, slug, hash with SHA-256 and HMAC, id helpers.
- 1.12 i18n string catalogue: lib/i18n/strings/en.ts structure, key naming, copy rules, no hardcoded UI strings.
- 1.13 Design tokens A: spacing 4/8/12/16/24/32/48/64, radius scale, shadow scale, z-index scale.
- 1.14 Design tokens B: typography scale, color palette with contrast pairs, dark mode, high contrast, reduced motion, motion tokens, token JSON export.
- 1.15 shadcn/ui primitives A: button, input, textarea, label, checkbox, radio group, select, switch.
- 1.16 shadcn/ui primitives B: dialog, sheet, popover, dropdown, tabs, tooltip, toast, table, skeleton, badge.
- 1.17 Form primitives: React Hook Form with Zod resolver, four states, aria-live errors, disabled and loading submit.
Segment gate: component gallery shows every primitive in light, dark, high contrast and reduced motion; no hardcoded color or spacing outside tokens.

### SEGMENT 1C -- Brand, layout, navigation (chat 3 of 4)
- 1.18 Brand assets: logo variants light/dark/icon, favicon pack 16/32/180/192/512, apple touch icon, PWA icons, default OG image, brand voice guide.
- 1.19 Layout shells: public and auth layouts with skip links, focus order and print base.
- 1.20 Layout shells: dashboard, admin and client portal layouts with role-aware framing.
- 1.21 Layout components: sidebar, topbar, mobile drawer, bottom navigation, breadcrumbs, footer, offline banner, sticky action bar.
- 1.22 Navigation source: config/nav-map.ts with reserved growth blocks, role filter hook, breadcrumb generator, dead-link wiring.
- 1.23 Command palette and keyboard shortcuts page with focus management and ARIA labels.
Segment gate: navigation renders correctly for every role; dead-link check passes on the current route set.

### SEGMENT 1D -- States, hardening, public site, governance (chat 4 of 4)
- 1.24 Page-state system: skeleton library, error boundary with retry, empty state with CTA, success state, 320px utilities, accessibility primitives.
- 1.25 Motion and media: Framer Motion providers, page transitions, stagger, confetti, illustration baseline, reduced-motion handling.
- 1.26 Web hardening primitives: Trusted Types policy, COOP, COEP, CORP, Permissions-Policy, Clear-Site-Data on logout, SRI baseline, header matrix tests, ADR-0006.
- 1.27 Usability primitives: use-saved-views, use-undo, use-autosave, optimistic update helpers, explainability message component and string catalogue.
- 1.28 Public site pages A: homepage, features, pricing, about with real English copy and metadata.
- 1.29 Public site pages B: contact, industries, calculators, free invoice generator shell, terms, privacy, blog shell, 404, 500, offline.
- 1.30 Platform plumbing: middleware.ts, instrumentation.ts, CSP nonce baseline, sitemap and robots baseline, metadata baseline, print stylesheet.
- 1.31 Governance A: CI workflow, CODEOWNERS, pull request template, CONTRIBUTING, SECURITY, CHANGELOG, LICENSE.
- 1.32 Governance B: ADR-0001 to ADR-0007, README update, docs/handoffs/CHAT_01_COMPLETED.md.
Segment gate: production build passes; Lighthouse at least 90 on the homepage; dead-link audit clean; npm run verify fully green.

FEATURE SOURCES: FEATURE_LIST.md Part 1 sections A to M, plus Part 10 section
D baseline documentation.

ADDED IN REVISION 2 (mandatory): read docs/PLAN/09_REVISION_2_ADDITIONS.md and
sections A11 to A15 of docs/PLAN/05_ADDITIONAL_REQUIREMENTS_SPEC.md before
starting. Added sub-steps 1.26 web hardening primitives and 1.27 usability primitives, both in segment 1D. Revision 2 only adds; the twenty absolute rules and
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
sub-step if any. Also record the segment status: complete with the next segment named,
or partial with the exact sub-step to resume from.

SEGMENT RULE: execute exactly one segment per chat. Never start the next segment
in the same chat. At the end of a segment, run npm run verify, record the segment
gate evidence, update the progress file, and state the segment status line:
"Segment NNX complete; next segment NNX+1" or "Segment NNX partial; resume at
sub-step NN.YY".

RESUME INSTRUCTION, only when this prompt is pasted after a partial step:
read docs/handoffs/CHAT_01_PROGRESS.md, find the first unchecked sub-step, and
continue exactly there. Never re-implement an existing passing file.
=== END PASTE ===
