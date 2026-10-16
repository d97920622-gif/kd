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

1. Install Node.js 20 or newer (the build sandbox runs Node 22) and npm 10 or
   newer.
2. Run `npm install`. This installs dependencies and activates the Git hooks
   (husky installs `.husky/pre-commit` and `.husky/commit-msg`).
3. Run `cp .env.example .env` and fill the local values. `.env` is gitignored
   and must never be committed.
4. Run `npm run dev` for the development server on http://localhost:3000.
5. Run `npm run verify` before every commit. The same command is the CI gate.

## Toolchain

| Area       | Choice                                                                                         |
| ---------- | ---------------------------------------------------------------------------------------------- |
| Runtime    | Node.js 20+ (LTS) with npm                                                                     |
| Framework  | Next.js 15, App Router, React Server Components                                                |
| Language   | TypeScript 5 in strict mode, zero `any`                                                        |
| Styling    | Tailwind CSS 3 with CSS variable design tokens in `styles/globals.css`                         |
| Components | shadcn/ui on Radix primitives, class-variance-authority for variants, single icon set (Lucide) |
| Validation | Zod on the client and on the server, one schema per entity                                     |
| Money      | decimal.js, USD only, numeric(18,4) in the database                                            |
| Quality    | ESLint, Prettier, husky, lint-staged and the check scripts below                               |

## Quality gates and scripts

`npm run verify` is the single gate. It runs the type checker, the linter,
the formatter check, the environment validation and all twelve rule checks in
a fixed order, prints one PASS or FAIL line per entry, and exits with code 0
only when everything passed. The pre-commit hook runs lint-staged and then
`npm run verify`, so a failing gate can never be committed.

| Script                           | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                    | Development server.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `npm run build`                  | Production build.                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `npm run start`                  | Start the production build.                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `npm run lint`                   | ESLint with zero warnings allowed.                                                                                                                                                                                                                                                                                                                                                                                                             |
| `npm run lint:fix`               | ESLint with automatic fixes.                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `npm run format`                 | Prettier write over the repository.                                                                                                                                                                                                                                                                                                                                                                                                            |
| `npm run format:check`           | Prettier check, used by verify.                                                                                                                                                                                                                                                                                                                                                                                                                |
| `npm run typecheck`              | TypeScript compiler in check mode.                                                                                                                                                                                                                                                                                                                                                                                                             |
| `npm run env:validate`           | Validates the environment against `lib/env/validate-env.ts`.                                                                                                                                                                                                                                                                                                                                                                                   |
| `npm run tokens:export`          | Writes `config/design-tokens.json` from `config/design-tokens.ts` for design tooling, and validates every exported group. With `--check` it exits 1 when the committed JSON is stale, which is how verify keeps it current.                                                                                                                                                                                                                    |
| `npm run verify`                 | Every gate in one command, CI-ready exit code.                                                                                                                                                                                                                                                                                                                                                                                                 |
| `npm test`                       | Alias of `npm run verify`; the platform ships no test runner.                                                                                                                                                                                                                                                                                                                                                                                  |
| `npm run check:english-only`     | ASCII-only scan; `FEATURE_LIST.md` is the documented exemption.                                                                                                                                                                                                                                                                                                                                                                                |
| `npm run check:no-todo`          | No unfinished-work markers in any file.                                                                                                                                                                                                                                                                                                                                                                                                        |
| `npm run check:no-coming-soon`   | No unfinished-launch or filler wording in any file.                                                                                                                                                                                                                                                                                                                                                                                            |
| `npm run check:no-tests`         | No test file, test directory or test framework dependency.                                                                                                                                                                                                                                                                                                                                                                                     |
| `npm run check:path-comment`     | First line of every source file declares its path.                                                                                                                                                                                                                                                                                                                                                                                             |
| `npm run check:i18n-strings`     | No hardcoded display text: every JSX text node and display attribute in `app/` and `components/` must come from `lib/i18n/strings/en.ts`. Also validates catalogue health: key naming, duplicate keys, non-empty ASCII values, placeholder shape and plural pairs. Rules: `docs/COPY_RULES.md`.                                                                                                                                                |
| `npm run check:design-tokens`    | Design token discipline. Verifies the mandated spacing, radius, shadow and z-index scales in `config/design-tokens.ts`; that `tailwind.config.ts` takes those scales from the token module by identifier; that `styles/globals.css` declares every `--z-*` and `--shadow-*` variable with the ladder value; and that no application file uses an arbitrary Tailwind value (`p-[13px]`, `z-[9999]`), a raw color literal or a raw inline style. |
| `npm run check:color-contrast`   | WCAG 2.1 AA of the palette. Verifies that all four themes (light, dark, high-contrast light, high-contrast dark) declare every color role; that `styles/globals.css` matches `config/design-tokens.ts` value for value; and that every declared foreground and background pair reaches 4.5:1 for text, 3:1 for focus and field boundaries, and 7:1 for text in the two high contrast themes.                                                   |
| `npm run check:no-console`       | The console object is forbidden outside process streams.                                                                                                                                                                                                                                                                                                                                                                                       |
| `npm run check:forbidden-brands` | The Rule 5 partner naming convention is enforced.                                                                                                                                                                                                                                                                                                                                                                                              |
| `npm run check:migration-pairs`  | Every migration has a rollback file with the same timestamp.                                                                                                                                                                                                                                                                                                                                                                                   |
| `npm run check:dead-links`       | Internal links and nav entries resolve to real routes.                                                                                                                                                                                                                                                                                                                                                                                         |
| `npm run check:secrets`          | No credential, key or token is committed.                                                                                                                                                                                                                                                                                                                                                                                                      |
| `npm run check:any-types`        | The `any` type is forbidden in TypeScript sources.                                                                                                                                                                                                                                                                                                                                                                                             |
| `npm run check:money-math`       | Money arithmetic only inside `lib/utils/currency.ts`, which must carry the annotation line `money-math-guard: sanctioned`. The check fails if the annotation is missing there, if it appears in any other file, or if a money-named value is used with a JavaScript operator, `Number()`, `Math.*` or `toFixed`.                                                                                                                               |

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

| Primitive   | File                              | Notes                                                                                                  |
| ----------- | --------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Button      | `components/ui/button.tsx`        | Variants default, destructive, outline, secondary, ghost, link; sizes sm, default, lg, icon            |
| Input       | `components/ui/input.tsx`         | 44px tall, 16px text so iOS never zooms on focus, destructive boundary when invalid                    |
| Textarea    | `components/ui/textarea.tsx`      | Starts at the 64px token, vertical resize only                                                         |
| Label       | `components/ui/label.tsx`         | Radix association, dims with a disabled control through the peer variants                              |
| Checkbox    | `components/ui/checkbox.tsx`      | Role checkbox, checked and indeterminate states, 44x44 pointer target                                  |
| Radio group | `components/ui/radio-group.tsx`   | Roving tabindex and arrow key navigation, 44x44 pointer target                                         |
| Select      | `components/ui/select.tsx`        | Combobox with listbox, keyboard and type-ahead navigation, hidden native select for forms              |
| Switch      | `components/ui/switch.tsx`        | Role switch, thumb travel of one token step, 44px vertical pointer target                              |
| Dialog      | `components/ui/dialog.tsx`        | Modal surface: focus moves in and returns to the trigger, page behind hidden from assistive technology |
| Sheet       | `components/ui/sheet.tsx`         | Edge panel built on the dialog: top, bottom, left and right                                            |
| Popover     | `components/ui/popover.tsx`       | Interactive surface anchored to its trigger, opened by pointer or keyboard, never by hover             |
| Dropdown    | `components/ui/dropdown-menu.tsx` | Menu contract: arrow keys, type-ahead, Escape, destructive items separated, submenus                   |
| Tabs        | `components/ui/tabs.tsx`          | Arrow navigation, one visible panel, the tab list scrolls instead of wrapping at 320px                 |
| Tooltip     | `components/ui/tooltip.tsx`       | Hint on hover and on focus, never the only copy of a requirement, never an accessible name             |
| Toast       | `components/ui/toast.tsx`         | Live-region toast; queue and viewport wiring in `lib/hooks/use-toast.tsx`                              |
| Table       | `components/ui/table.tsx`         | Real table elements with scoped headers, a caption and a horizontal scroll wrapper                     |
| Skeleton    | `components/ui/skeleton.tsx`      | Shape of pending content, hidden from assistive technology, pulse stops under reduced motion           |
| Badge       | `components/ui/badge.tsx`         | Status label using the semantic role pairs, never the only signal of a state                           |

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
merged into `integration` after review. The exact procedure is in
`docs/PLAN/07_BRANCH_AND_GIT_WORKFLOW.md`.

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
- `docs/handoffs/` one handoff per completed chat.
- `docs/ADR/` architecture decision records (created from step 1).
- `docs/PROVIDERS/` per-processor verified documentation records (created from
  step 9).
- `docs/RUNBOOKS/` operational runbooks (created from step 14 and completed in
  step 16).
