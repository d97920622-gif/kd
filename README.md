// path: README.md

# KD SOLUTION IT

Enterprise multi-tenant SaaS platform for invoicing, payments, payroll and
accounting, built for the Asian market.

- Currency: USD only. All money is `numeric(18,4)` with decimal arithmetic.
- Text and structured data: Supabase PostgreSQL.
- Files: the company's Google Drive when linked, otherwise Supabase Storage,
  always AES-256-GCM encrypted before upload with `storage_provider` recorded.
- Language: English only in code, UI, comments, seeds and documentation.

## Specification sources

| File               | Role                                                                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MASTER_PROMPT.md` | Binding specification: absolute rules, stack, schema rules, security layers                                                                             |
| `FEATURE_LIST.md`  | Owner-supplied feature list (3,950 features, eleven parts). It is the only file allowed to contain non-ASCII characters                                 |
| `docs/PLAN/`       | The execution plan: sixteen steps, sub-step work orders, segment guide, guardrails, traceability, provider registry, revision 2 additions, chat prompts |

## Local development setup

1. Install Node.js 22 (the `engines` field requires 22 or newer, and the CI
   workflow pins major 22) and npm 10 or newer.
2. Run `npm ci`. This installs exactly the versions the lockfile records, and
   the `prepare` script runs husky, which installs `.husky/pre-commit` and
   `.husky/commit-msg`. To add or update a dependency use `npm install --save`
   or `npm install --save-dev` and commit `package.json` and
   `package-lock.json` together.
3. Run `cp .env.example .env` and fill the local values. `.env` is gitignored
   and must never be committed.
4. Run `npm run dev` for the development server on http://localhost:3000.
5. Run `npm run verify` before every commit. The same command is the CI gate.

## Toolchain

| Area       | Choice                                                                                         |
| ---------- | ---------------------------------------------------------------------------------------------- |
| Runtime    | Node.js 22 with npm 10, pinned by the `engines` field and by the CI workflow                   |
| Framework  | Next.js 15, App Router, React Server Components                                                |
| Language   | TypeScript 5 in strict mode, zero `any`                                                        |
| Styling    | Tailwind CSS 3 with CSS variable design tokens in `styles/globals.css`                         |
| Components | shadcn/ui on Radix primitives, class-variance-authority for variants, single icon set (Lucide) |
| Validation | Zod on the client and on the server, one schema per entity                                     |
| Money      | decimal.js, USD only, numeric(18,4) in the database                                            |
| Quality    | ESLint, Prettier, husky, lint-staged and the check scripts below                               |

## Quality gates and scripts

`npm run verify` is the single gate. It runs the type checker, the linter,
the formatter check, the environment validation, the design token export and the
rule checks in a fixed order, prints one PASS or FAIL line per entry (30 entries
in all), and exits with code 0 only when everything passed. The pre-commit hook
runs lint-staged and then `npm run verify`, so a failing gate can never be
committed, and `.github/workflows/ci.yml` runs the same command on every push, so
a local pass and a pipeline pass mean the same thing. `check:governance` keeps
this section honest: every script in `package.json` and every entry the runner
defines must be documented below, and the entry count in this paragraph is
compared with the runner's own list.

| Script                            | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                     | Development server.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `npm run build`                   | Production build.                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `npm run start`                   | Start the production build.                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `npm run lint`                    | ESLint with zero warnings allowed.                                                                                                                                                                                                                                                                                                                                                                                                             |
| `npm run lint:fix`                | ESLint with automatic fixes.                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `npm run format`                  | Prettier write over the repository.                                                                                                                                                                                                                                                                                                                                                                                                            |
| `npm run format:check`            | Prettier check, used by verify.                                                                                                                                                                                                                                                                                                                                                                                                                |
| `npm run typecheck`               | TypeScript compiler in check mode.                                                                                                                                                                                                                                                                                                                                                                                                             |
| `npm run env:validate`            | Validates the environment against `lib/env/validate-env.ts`.                                                                                                                                                                                                                                                                                                                                                                                   |
| `npm run db:migrate`              | Applies every pending migration in `migrations/` inside the deployment advisory lock, refuses on checksum drift, and records each file in `schema_migrations`; `--dry-run` prints the plan.                                                                                                                                                                                                                                                    |
| `npm run db:rollback`             | Reverts a migration and every later one through its `_down.sql` pair; `-- all` reverts the whole set, newest first.                                                                                                                                                                                                                                                                                                                            |
| `npm run db:seed`                 | Applies pending files in `seeds/` and records each checksum in `seed_migrations`; `--dry-run` prints the plan.                                                                                                                                                                                                                                                                                                                                 |
| `npm run changelog`               | Regenerates `CHANGELOG.md` from the commit history; the docs sub-step of every handoff runs it, and no entry is written by hand.                                                                                                                                                                                                                                                                                                               |
| `npm run brand:generate`          | Regenerates the brand pack from one drawing in `config/brand.ts`, in SVG, PNG and ICO, with `--check` reporting drift.                                                                                                                                                                                                                                                                                                                         |
| `npm run changelog`               | Regenerates `CHANGELOG.md` from the commit history; the docs sub-step of every handoff runs it, and no entry is written by hand.                                                                                                                                                                                                                                                                                                               |
| `npm run brand:generate`          | Regenerates the brand pack from one drawing in `config/brand.ts`, in SVG, PNG and ICO, with `--check` reporting drift.                                                                                                                                                                                                                                                                                                                         |
| `npm run tokens:export`           | Writes `config/design-tokens.json` from `config/design-tokens.ts` for design tooling, and validates every exported group. With `--check` it exits 1 when the committed JSON is stale, which is how verify keeps it current.                                                                                                                                                                                                                    |
| `npm run verify`                  | Every gate in one command, CI-ready exit code.                                                                                                                                                                                                                                                                                                                                                                                                 |
| `npm test`                        | Alias of `npm run verify`; the platform ships no test runner.                                                                                                                                                                                                                                                                                                                                                                                  |
| `npm run check:english-only`      | ASCII-only scan; `FEATURE_LIST.md` is the documented exemption.                                                                                                                                                                                                                                                                                                                                                                                |
| `npm run check:no-todo`           | No unfinished-work markers in any file.                                                                                                                                                                                                                                                                                                                                                                                                        |
| `npm run check:no-coming-soon`    | No unfinished-launch or filler wording in any file.                                                                                                                                                                                                                                                                                                                                                                                            |
| `npm run check:no-tests`          | No test file, test directory or test framework dependency.                                                                                                                                                                                                                                                                                                                                                                                     |
| `npm run check:path-comment`      | First line of every source file declares its path.                                                                                                                                                                                                                                                                                                                                                                                             |
| `npm run check:i18n-strings`      | No hardcoded display text: every JSX text node and display attribute in `app/` and `components/` must come from `lib/i18n/strings/en.ts`. Also validates catalogue health: key naming, duplicate keys, non-empty ASCII values, placeholder shape and plural pairs. Rules: `docs/COPY_RULES.md`.                                                                                                                                                |
| `npm run check:design-tokens`     | Design token discipline. Verifies the mandated spacing, radius, shadow and z-index scales in `config/design-tokens.ts`; that `tailwind.config.ts` takes those scales from the token module by identifier; that `styles/globals.css` declares every `--z-*` and `--shadow-*` variable with the ladder value; and that no application file uses an arbitrary Tailwind value (`p-[13px]`, `z-[9999]`), a raw color literal or a raw inline style. |
| `npm run check:color-contrast`    | WCAG 2.1 AA of the palette. Verifies that all four themes (light, dark, high-contrast light, high-contrast dark) declare every color role; that `styles/globals.css` matches `config/design-tokens.ts` value for value; and that every declared foreground and background pair reaches 4.5:1 for text, 3:1 for focus and field boundaries, and 7:1 for text in the two high contrast themes.                                                   |
| `npm run check:no-console`        | The console object is forbidden outside process streams.                                                                                                                                                                                                                                                                                                                                                                                       |
| `npm run check:forbidden-brands`  | The Rule 5 partner naming convention is enforced.                                                                                                                                                                                                                                                                                                                                                                                              |
| `npm run check:migration-pairs`   | Every migration has a rollback file with the same timestamp.                                                                                                                                                                                                                                                                                                                                                                                   |
| `npm run check:dead-links`        | Internal links and nav entries resolve to real routes.                                                                                                                                                                                                                                                                                                                                                                                         |
| `npm run check:secrets`           | No credential, key or token is committed.                                                                                                                                                                                                                                                                                                                                                                                                      |
| `npm run check:any-types`         | The `any` type is forbidden in TypeScript sources.                                                                                                                                                                                                                                                                                                                                                                                             |
| `npm run check:money-math`        | Money arithmetic only inside `lib/utils/currency.ts`, which must carry the annotation line `money-math-guard: sanctioned`. The check fails if the annotation is missing there, if it appears in any other file, or if a money-named value is used with a JavaScript operator, `Number()`, `Math.*` or `toFixed`.                                                                                                                               |
| `npm run check:brand-assets`      | The brand pack: nine assets present and exactly what the generator produces now, palette colours only, centred and legible at 16 pixels, and the default social image rendered at the network crop size.                                                                                                                                                                                                                                       |
| `npm run check:layout-shells`     | The shell contract: five shells and five route-group layouts (skip link first, one landmark per page, id shared with the landmark), six roles framed through one seam with no privileged default, ten navigation surfaces, and the print base.                                                                                                                                                                                                 |
| `npm run check:nav-map`           | `config/nav-map.ts` as the single destination source: six roles filtered, one audience per surface, no destination outside the map, three commands on two chords.                                                                                                                                                                                                                                                                              |
| `npm run check:page-states`       | The loading, empty, error and offline states, each announced, actionable and named; the breakpoint ladder 320 to 1920 exact with no desktop-first media query.                                                                                                                                                                                                                                                                                 |
| `npm run check:motion`            | Motion discipline: the preference is read, durations come from the token bridge, the celebration is bounded and removable, and five durations reach zero under reduced motion.                                                                                                                                                                                                                                                                 |
| `npm run check:web-hardening`     | The hardening baseline: eleven headers verified (two of them deployment-only), Permissions-Policy refusing by default with four named grants, the sanitizer allowlist, Trusted Types, Clear-Site-Data gated on TLS, no hand-written script or link.                                                                                                                                                                                            |
| `npm run check:usability`         | The usability primitives: saved views with a declared key allowlist, the undo floor committed once, a bounded autosave draft, an optimistic queue that re-applies what a failure must not take back, and explainability reasons in both directions.                                                                                                                                                                                            |
| `npm run check:public-site`       | The public surface: twelve pages and eleven namespaces as server components with catalogue metadata, one `h1` and no skipped heading level, no claim this build cannot evidence, prices with one owner, every catalogue key rendered.                                                                                                                                                                                                          |
| `npm run check:platform-plumbing` | Middleware, instrumentation, sitemap, robots and the metadata baseline: six public sections decided once, documents rendered per request so the nonce reaches the scripts, the two server-only keys refused outside `lib/env`.                                                                                                                                                                                                                 |
| `npm run check:governance`        | The governance files cross-read: four CI jobs, Node.js 22 pinned by both the workflow and `engines`, six surfaces under named review, nine pull request fields, the seven decision records, the licence agreeing with the manifest, the changelog carrying every recorded sub-step commit.                                                                                                                                                     |

### Documented exemptions

Checks scan git-tracked files only. Three exemption lists exist, and nothing
outside them is exempt:

1. English-only: `FEATURE_LIST.md`, the owner-supplied specification. The
   exemption is recorded in `docs/ADR/ADR-0002-english-only-exception.md`.
2. Content phrases (unfinished-work markers, launch wording and the partner
   brand list): the governance corpus that restates the rules, which is
   `FEATURE_LIST.md`, `MASTER_PROMPT.md`, `README.md`, `docs/PLAN/**` and
   `docs/handoffs/**`, plus each check script's own pattern definitions.
3. Path comments: owner-supplied and generated files (`MASTER_PROMPT.md`,
   `FEATURE_LIST.md`, `LICENSE`, `next-env.d.ts`, JSON and lockfiles), binary
   assets, and files that cannot carry a comment.

## Component library state

`components/ui/` holds the shadcn/ui primitives built on Radix. Every class
comes from the design tokens, so light, dark, high contrast light and high
contrast dark are complete without a conditional style, and `npm run verify`
fails on a raw color, a raw size or an arbitrary value.

| Primitive   | File                              | Notes                                                                                                                                                                  |
| ----------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button      | `components/ui/button.tsx`        | Variants default, destructive, outline, secondary, ghost, link; sizes sm, default, lg, icon                                                                            |
| Input       | `components/ui/input.tsx`         | 44px tall, 16px text so iOS never zooms on focus, destructive boundary when invalid                                                                                    |
| Textarea    | `components/ui/textarea.tsx`      | Starts at the 64px token, vertical resize only                                                                                                                         |
| Label       | `components/ui/label.tsx`         | Radix association, dims with a disabled control through the peer variants                                                                                              |
| Checkbox    | `components/ui/checkbox.tsx`      | Role checkbox, checked and indeterminate states, 44x44 pointer target                                                                                                  |
| Radio group | `components/ui/radio-group.tsx`   | Roving tabindex and arrow key navigation, 44x44 pointer target                                                                                                         |
| Select      | `components/ui/select.tsx`        | Combobox with listbox, keyboard and type-ahead navigation, hidden native select for forms                                                                              |
| Switch      | `components/ui/switch.tsx`        | Role switch, thumb travel of one token step, 44px vertical pointer target                                                                                              |
| Dialog      | `components/ui/dialog.tsx`        | Modal surface: focus moves in and returns to the trigger, page behind hidden from assistive technology                                                                 |
| Sheet       | `components/ui/sheet.tsx`         | Edge panel built on the dialog: top, bottom, left and right                                                                                                            |
| Popover     | `components/ui/popover.tsx`       | Interactive surface anchored to its trigger, opened by pointer or keyboard, never by hover                                                                             |
| Dropdown    | `components/ui/dropdown-menu.tsx` | Menu contract: arrow keys, type-ahead, Escape, destructive items separated, submenus                                                                                   |
| Tabs        | `components/ui/tabs.tsx`          | Arrow navigation, one visible panel, the tab list scrolls instead of wrapping at 320px                                                                                 |
| Tooltip     | `components/ui/tooltip.tsx`       | Hint on hover and on focus, never the only copy of a requirement, never an accessible name                                                                             |
| Toast       | `components/ui/toast.tsx`         | Live-region toast; queue and viewport wiring in `lib/hooks/use-toast.tsx`                                                                                              |
| Table       | `components/ui/table.tsx`         | Real table elements with scoped headers, a caption and a horizontal scroll wrapper                                                                                     |
| Skeleton    | `components/ui/skeleton.tsx`      | Shape of pending content, hidden from assistive technology, pulse stops under reduced motion                                                                           |
| Badge       | `components/ui/badge.tsx`         | Status label using the semantic role pairs, never the only signal of a state                                                                                           |
| IconButton  | `components/ui/icon-button.tsx`   | A button whose label is a name rather than a word on screen: the label is a required prop backed by a tooltip, so an icon-only control cannot lose its accessible name |
| Kbd         | `components/ui/kbd.tsx`           | A keycap and a chord, so a shortcut reads as separate keys rather than as one string; the chord labels come from the same registry the palette listens on              |

### Shared form layer

`components/shared/` holds the form building blocks every feature composes
instead of writing its own. They sit on React Hook Form with a Zod resolver,
so the same schema that validates in the browser validates again on the server.

| Component        | File                                       | Notes                                                                                                     |
| ---------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| FormWrapper      | `components/shared/form-wrapper.tsx`       | Four states, one-time CSRF token, a submit lock, a locked fieldset and live error regions                 |
| FormField        | `components/shared/form-field.tsx`         | Label, hint, error and control wired by id and `aria-describedby`; the error is a live region             |
| FormErrorSummary | `components/shared/form-error-summary.tsx` | Every invalid field as a link, focus moves to the summary when a submission is refused                    |
| SubmitButton     | `components/shared/submit-button.tsx`      | Disabled and `aria-busy` while submitting, pending label announced through a polite live region           |
| Mapped errors    | `lib/forms/use-mapped-form-errors.ts`      | Flattens the error tree and replaces anything that is not catalogue copy                                  |
| Field rules      | `lib/forms/form-field-options.ts`          | Text, email, url, phone, postal code, tax number, money, choice, multi choice, password, date, acceptance |
| Response reading | `lib/forms/form-submission.ts`             | Parses the success and failure envelopes; server field details land under their own fields                |
| One-time token   | `lib/forms/csrf-token.ts`                  | Sends the token, spends it on submit, installs the replacement from the response                          |
| Form hook        | `lib/hooks/use-zod-form.ts`                | `useForm` with the platform defaults: validate on blur, revalidate on change, focus the first error       |
| Field ids        | `lib/forms/field-id.ts`                    | `fieldIdFor(path)` keeps the control, its label and the error summary link on the same id                 |

Three rules the primitives follow, each one enforced rather than promised:

1. **Touch targets.** Interactive controls are at least 44x44. A control whose
   visible shape must stay small (a 16px checkbox or radio, a 24px switch
   track) gets its pointer target from a pseudo-element that renders nothing at
   all, so the target grows and nothing visible changes.
2. **Focus is never removed.** No primitive sets `outline-none`; the focus
   indicator comes from the global `:focus-visible` rule, and the contrast
   check proves it reaches 3:1 against both the page and the card surface in
   every theme. Overlay primitives move focus into the surface when they open
   and return it to the trigger when they close, which is verified by
   rendering them in a DOM rather than by reading the source. Panel sizes are
   tokens too: `LAYOUT_WIDTH_TOKENS` defines the menu, popover, tooltip,
   dialog and sheet widths, because the width utilities come from the spacing
   scale and an off-scale step such as `w-72` does not exist in this project.
3. **Display text comes from the catalogue.** A part of a control that has no
   visible text, such as the icon-only scroll button of a select, carries an
   accessible name from `lib/i18n/strings/en/ui.ts`. A literal string in an
   `aria-label` fails `check:i18n-strings`.
4. **One submission per intent, one token per submission.** A form disables its
   submit button and locks its controls while a request is in flight, refuses a
   second submission that arrives anyway, and carries a one-time token that it
   spends as the request leaves and replaces from the response, so a replayed
   request is rejected by the server (`lib/middleware/csrf.ts` in sub-step 3.4).
5. **No parser text reaches a user.** A message is displayed only when it is a
   sentence from the catalogue; anything else, including the text of a schema a
   later step writes by hand, is replaced by the catalogue sentence for that
   kind of failure.

### State components

`components/shared/` also holds the states a page shows when it has nothing to
render, so every surface composes the same behaviour instead of inventing one.
Each one is announced, actionable and named: `check:page-states` verifies that
each of them tells a screen reader what happened, offers the reader a way
forward, and takes its words from the catalogue.

| Component      | File                                           | Notes                                                                                                      |
| -------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| StatusState    | `components/shared/status-state.tsx`           | One shell for empty, error, permission and offline: a sentence, a named control and the space between them |
| LoadingState   | `components/shared/loading-state.tsx`          | The skeleton shapes the product's pages actually have, in the four layouts rather than one generic block   |
| ErrorBoundary  | `components/shared/error-boundary.tsx`         | The route error surface: a reference the reader can quote, a bounded retry and no internal detail          |
| SuccessState   | `components/shared/success-state.tsx`          | The done state, with what happens next and, when a count is involved, the plural pair from the catalogue   |
| LiveRegion     | `components/shared/live-region.tsx`            | The one place a change is announced, so two components cannot announce the same thing twice                |
| Illustration   | `components/shared/state-illustration.tsx`     | The drawn, token-coloured illustration that keeps an empty panel from reading as a page that failed        |
| Explainability | `components/shared/explainability-message.tsx` | Why something happened, from a closed set of reasons, with a sanitized reference and a UTC timestamp       |

### Component gallery

`app/(dev)/gallery/` renders every primitive above in light, dark, high
contrast light, high contrast dark and reduced motion, in one page. The scopes
are pinned by the `.theme-*` blocks in `styles/globals.css`, and the contrast
checker compares each of those blocks with `config/design-tokens.ts` token by
token, so a scope cannot drift from the theme it mirrors. The route exists in
development only: outside it the layout calls `notFound()`, so a production
deployment answers 404 and cannot be read as a component inventory.

## Start here

1. Read `docs/PLAN/11_USAGE_HANDBOOK.md`.
2. Do the one-time setup: create the `integration` branch from the planning
   work, set it as the repository default branch, protect it, and point Netlify
   at it.
3. Then follow the per-chat loop below.

## How the build is executed

The project is built in sixteen steps, one step per chat:

1. Read `docs/PLAN/00_MASTER_EXECUTION_PLAN.md` and
   `docs/PLAN/08_SUBSTEP_CHECKLISTS.md`.
2. Open a new chat and paste the matching file from
   `docs/PLAN/chat-prompts/` (CHAT_01 for step 1, CHAT_02 for step 2, and so
   on up to CHAT_16).
3. The chat implements sub-step by sub-step, commits after each sub-step, runs
   `npm run verify`, and ends with a handoff document in `docs/handoffs/`.
4. Steps 1, 3, 4, 6, 10 and 13 are divided into four segments each. A chat
   executes exactly one segment, stops at the segment gate, and the same prompt
   is pasted again in a new chat for the next segment. For every other step, if
   one chat is not enough, paste the same prompt again: the resume instruction
   continues from the first unchecked sub-step without repeating work. Full
   segment rules: `docs/PLAN/10_SEGMENT_GUIDE.md`.

Never skip a step and never paste two step prompts into one chat. Each prompt
is self-sufficient and states its scope, rules, gates and handoff duty.

## Step map

| Step | Title                                                                                                                                  |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Foundation, governance, design system, layout architecture                                                                             |
| 2    | Database foundation, migrations, RLS, encryption, audit ledger                                                                         |
| 3    | Authentication, 2FA, passkeys, session registry, login lock, VPN/proxy/Tor blocking                                                    |
| 4    | Roles, permissions, approval engine, approval inbox, enterprise access, onboarding, settings, KYC, notifications, platform billing     |
| 5    | Invoicing core, documents, PDF engine, numbering, editor experience                                                                    |
| 6    | CRM, catalog, inventory, suppliers, e-commerce sync, dashboards, reports, tax engine, batch                                            |
| 7    | Storage abstraction, file security, file records                                                                                       |
| 8    | Payment framework core, card rules, 3DS policy, advanced card risk, routing, super admin API console                                   |
| 9    | Sixteen processor adapters, NMI dual mode, advanced capabilities, sandbox validation                                                   |
| 10   | Checkout design, payment experience, wallet, merchant of record, payouts, disputes, consent evidence, subscriptions, BNPL              |
| 11   | Client portal, token checkout page, tokenized access, email journey, branding, white-label, document integrity                         |
| 12   | Universal SMTP, WhatsApp, social, public API v1, webhooks, integrations, support, channel transparency                                 |
| 13   | Payroll, HR, expenses, double-entry accounting, tax liability and remittance, financial statements, reports                            |
| 14   | Super admin console, CMS, SEO, analytics, marketing, growth, platform intelligence, trust publishing                                   |
| 15   | Deep security, privacy experience, deception and anomaly, compliance, fraud, tracking, zero trust, conflict and duplicate finalization |
| 16   | Deployment, CI/CD, cron, documentation, PWA security, performance, backup and disaster recovery, launch                                |

## Branch policy

`integration` is the long-lived mainline and the deployment source of truth.
`main` is the release mirror. Step work is committed on the session branch and
merged into `integration` after review. Review ownership is declared in
`.github/CODEOWNERS`, and every pull request uses
`.github/pull_request_template.md`, which asks for the step, the sub-steps, the
files added, the files extended with a reason, the migrations with their rollback
paths, the environment variables, the verification output and the gate table. The
exact procedure is in `docs/PLAN/07_BRANCH_AND_GIT_WORKFLOW.md`.

## Non-negotiable rules (summary)

English only, USD only, `numeric(18,4)` with decimal.js, no JavaScript Number
for money, no test files, no TODO, no FIXME, no "Coming Soon", no placeholder
text, no `any`, no `console.log`, a `// path:` comment at the top of every
file, universal columns on every table, RLS enabled with default-deny on every
table, an audit entry for every mutation, Zod validation on client and server,
sanitized input everywhere, idempotency key on every payment, optimistic
locking on every editable record, the approval chain staff to CEO to
super_admin, Zero Trust and Zero Tolerance, and the generic payment partner
naming ("Global Payout Partners", "Local Payment Methods via Licensed
Partners").

## Documentation

- `docs/PLAN/11_USAGE_HANDBOOK.md` operating guide: branch setup, branch selection per chat, per-chat loop, review checklist, troubleshooting.
- `docs/PLAN/` build plan, guardrails, traceability, provider registry, segment guide.
- `docs/handoffs/` one handoff per completed chat, the running progress file and the template they follow.
- `docs/ADR/` the seven architecture decision records that decide how step 1 is built, and `docs/ADR/README.md`, the index that lists them with their status.
- `CONTRIBUTING.md` setup, the rules every change keeps, the commit format, the branch model and the review process.
- `SECURITY.md` how to report a vulnerability privately, the hardening baseline it is measured against, and what is out of scope.
- `CHANGELOG.md` generated from the commit history by `npm run changelog`; every entry ends in the commit that caused it.
- `.github/` the CI workflow, the review ownership file and the pull request template.
- `docs/PROVIDERS/` per-processor verified documentation records (created from
  step 9).
- `docs/RUNBOOKS/` operational runbooks (created from step 14 and completed in
  step 16).
