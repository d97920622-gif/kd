// path: docs/handoffs/CHAT_01_PROGRESS.md

# CHAT 01 PROGRESS -- Step 1: Foundation, Governance, Design System, Layout Architecture

Status: in progress
Current segment: 1C (brand, layout, navigation) -- sub-steps 1.18, 1.19 and 1.20 complete, 1.21 next
Last completed sub-step: 1.20 (role-aware dashboard, admin and client portal shells).
Next sub-step: 1.21 (layout components: sidebar, topbar, mobile drawer, bottom navigation, breadcrumbs, footer, offline banner, sticky action bar).
Segment 1A: complete
Segment 1B: complete (gate evidence in docs/EVIDENCE/step-01/gate-1B.md)
Segment 1C: in progress (1.18, 1.19 and 1.20 complete; segment gate pending)
Date started: 2026-10-15
Branch: arena/b7780282-kd

Segment model: this step runs as four segments (1A to 1D), one segment per
chat, per docs/PLAN/10_SEGMENT_GUIDE.md. A chat executes exactly one segment
and stops at the segment gate.

## SEGMENT 1A -- Toolchain and quality gates (chat 1 of 4)

| Sub-step | Description                                                                                                                    | Status | Commit  |
| -------- | ------------------------------------------------------------------------------------------------------------------------------ | ------ | ------- |
| 1.1      | Repository toolchain baseline: package.json, tsconfig.json, next.config.js, .prettierrc, .gitignore, husky hooks, lint-staged  | done   | 57947a7 |
| 1.2      | ESLint configuration: no-explicit-any error, no-console error, non-ASCII restricted syntax, import order, React and Next rules | done   | 8317d34 |
| 1.3      | Tailwind and token pipeline: tailwind.config.ts, PostCSS, components.json, CSS layer structure                                 | done   | b154ba3 |
| 1.4      | Environment schema validation: lib/env/validate-env.ts, boot-time fail fast, typed access, .env.example                        | done   | a88f8b7 |
| 1.5      | Check scripts A: english-only, no-todo, no-coming-soon, no-tests, path-comment                                                 | done   | e25ddac |
| 1.6      | Check scripts B: no-console, forbidden-brands, migration-pairs, dead-links, secrets, any-types, money-math                     | done   | 98951cf |
| 1.7      | Verify runner: npm run verify, report format, pre-commit and commit-msg wiring, CI-ready exit codes                            | done   | 98ac273 |

Progress file created in 82a6ff5.

Segment 1A gate: every check script runs on the current tree without false
positives; all scripts documented in README.md. Status: PASSING.

Gate evidence (recorded in full in CHAT_01_COMPLETED.md section 7):

- npm run verify: RESULT PASS (16 of 16 checks passed), exit code 0.
- All twelve npm run check:* scripts exit 0 with a PASS summary line.
- All four mandated .sh wrappers run and exit 0.
- README.md documents all 23 npm scripts.
- Every check was proved to fail on a deliberate violation before the
  violation was removed (negative probes for all twelve checks).
- Pre-commit hook rejected a staged violation with exit code 1 (no commit
  created); commit-msg hook rejected an over-long subject line.

## SEGMENT 1B -- Core libraries and design system (chat 2 of 4)

| Sub-step | Description                                                                                                                                      | Status | Commit             |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ------------------ |
| 1.8      | Structured logger: JSON lines, levels, correlation id, redaction hook, zero console usage                                                        | done   | to fill at handoff |
| 1.9      | Error library: typed error classes, error codes, response envelope builder, no detail leakage                                                    | done   | to fill at handoff |
| 1.10     | USD money utilities: decimal.js wrappers, parse, format, arithmetic, rounding policy, money-math guard                                           | done   | to fill at handoff |
| 1.11     | Utility set: date (UTC), formatting, slug, hash (SHA-256, HMAC), id helpers                                                                      | done   | to fill at handoff |
| 1.12     | i18n string catalogue: lib/i18n/strings/en.ts structure, key naming, copy rules                                                                  | done   | to fill at handoff |
| 1.13     | Design tokens A: spacing 4/8/12/16/24/32/48/64, radius scale, shadow scale, z-index scale                                                        | done   | 2f25ca8            |
| 1.14     | Design tokens B: typography scale, color palette with contrast pairs, dark mode, high contrast, reduced motion, motion tokens, token JSON export | done   | 6eb05dd            |
| 1.15     | shadcn/ui primitives A: button, input, textarea, label, checkbox, radio group, select, switch                                                    | done   | cdba8d2            |
| 1.16     | shadcn/ui primitives B: dialog, sheet, popover, dropdown, tabs, tooltip, toast, table, skeleton, badge                                           | done   | b5bb363            |
| 1.17     | Form primitives: React Hook Form with Zod resolver, four states, aria-live errors, submit states                                                 | done   | a976d75            |

Segment 1B gate: component gallery renders every primitive in light, dark,
high contrast and reduced motion; no hardcoded color or spacing outside
tokens. Status: PASSED on 2026-10-16 (evidence in
docs/EVIDENCE/step-01/gate-1B.md, commit 2cd305d).

## SEGMENT 1C -- Brand, layout, navigation (chat 3 of 4)

| Sub-step | Description                                                                                                                  | Status  | Commit  |
| -------- | ---------------------------------------------------------------------------------------------------------------------------- | ------- | ------- |
| 1.18     | Brand assets: logo variants, favicon pack 16/32/180/192/512, apple touch icon, PWA icons, OG image, brand voice guide        | done    | b8511e6 |
| 1.19     | Layout shells: public and auth layouts with skip links, focus order, print base                                              | pending | -       |
| 1.20     | Layout shells: dashboard, admin and client portal layouts with role-aware framing                                            | pending | -       |
| 1.21     | Layout components: sidebar, topbar, mobile drawer, bottom navigation, breadcrumbs, footer, offline banner, sticky action bar | pending | -       |
| 1.22     | Navigation source: config/nav-map.ts with reserved growth blocks, role filter hook, breadcrumb generator, dead-link wiring   | pending | -       |
| 1.23     | Command palette and keyboard shortcuts page with focus management and ARIA labels                                            | pending | -       |

Segment 1C gate: navigation renders correctly for every role; dead-link check
passes on the current route set. Status: pending.

## SEGMENT 1D -- States, hardening, public site, governance (chat 4 of 4)

| Sub-step | Description                                                                                                                                    | Status  | Commit |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------ |
| 1.24     | Page-state system: skeleton library, error boundary with retry, empty state with CTA, success state, 320px utilities, accessibility primitives | pending | -      |
| 1.25     | Motion and media: Framer Motion providers, page transitions, stagger, confetti, illustration baseline, reduced-motion handling                 | pending | -      |
| 1.26     | Web hardening primitives: Trusted Types, COOP, COEP, CORP, Permissions-Policy, Clear-Site-Data, SRI baseline, header matrix, ADR-0006          | pending | -      |
| 1.27     | Usability primitives: use-saved-views, use-undo, use-autosave, optimistic update helpers, explainability message and strings                   | pending | -      |
| 1.28     | Public site pages A: homepage, features, pricing, about with real English copy and metadata                                                    | pending | -      |
| 1.29     | Public site pages B: contact, industries, calculators, free invoice generator shell, terms, privacy, blog shell, 404, 500, offline             | pending | -      |
| 1.30     | Platform plumbing: middleware.ts, instrumentation.ts, CSP nonce baseline, sitemap and robots baseline, metadata baseline, print stylesheet     | pending | -      |
| 1.31     | Governance A: CI workflow, CODEOWNERS, pull request template, CONTRIBUTING, SECURITY, CHANGELOG, LICENSE                                       | pending | -      |
| 1.32     | Governance B: ADR-0001 to ADR-0007, README update, docs/handoffs/CHAT_01_COMPLETED.md                                                          | pending | -      |

Segment 1D gate: production build passes; Lighthouse at least 90 on the
homepage; dead-link audit clean; npm run verify fully green. Status: pending.

## Sub-step 1.20 evidence -- role-aware shells for the three signed-in and tokenized audiences

Delivered the three remaining route-group shells, the framing data they render
from, the slot contract sub-step 1.21 fills, and the one seam through which a
layout will ask who the reader is.

**The frame is data.** `components/layout/role-framing.ts` describes what each
of the six roles of the role model sees around the content: audience, whether a
persistent band is shown, which approval notice applies, whether navigation
exists at all. Copy is referenced by catalogue key typed as the catalogue's own
union, so a frame that names a string nobody wrote fails the type check.
`components/layout/role-frame.tsx` renders the band and the notice; the
platform band uses the warning surface pair and the notice uses the muted pair,
both already verified contrasts. The band is hidden in print: a customer's
invoice must not carry a line reading "platform administration".

**Three shells, three briefs.** `dashboard-shell.tsx` is the tenant workspace:
quiet chrome, no band for the owner, the approval notice for the owner's staff,
because that reader is the one whose work is reviewed. `admin-shell.tsx` is
platform administration: a persistent band on every screen, because the mistake
it prevents - acting on a tenant's records while believing you are in your own
workspace - cannot be undone by a toast. `client-portal-shell.tsx` is the
tokenized client: no navigation of any kind, one column at the document
measure, and a single slot for the tenant's own header, because white-label
tenants put their own branding there (A11, 11.5).

**Navigation is gated by the frame, not by the caller.** `shell-slots.tsx`
renders the four slots 1.21 needs (top bar, sidebar, footer, mobile bottom bar)
and refuses to paint the two navigation slots unless the frame allows
navigation. An unresolved reader therefore gets landmarks and content and no
menu, even if a caller hands one in: the links would lead to routes that refuse
the request, which reads as a broken product rather than as a session that
ended. Nothing about this is authorization - a menu is not a permission - but
failing closed in the frame costs nothing and removes a class of confusing
screens.

**The seam.** `components/layout/session-role.ts` is the single place a layout
asks who the reader is. In development it answers the lowest-privilege role of
the group's audience (staff for the workspace, admin staff for platform
administration), because a preview that ran as the owner or the founder would
show the developer the frame almost nobody sees. Outside development it answers
null. Step 3 replaces the body with the session read and nothing else changes.
The seam never previews the client role, because that audience has no session
to preview.

**The print base moved to the root.** `styles/print.css` is now imported once,
by `app/layout.tsx`, instead of by each group layout. Every group can be
printed for a reason - an invoice from the workspace, a receipt from the client
portal, a pricing page from the public site - and a base every group must
remember to include is a base some group will one day omit. `check:layout-shells`
now requires the root layout to import it and forbids a route-group layout from
importing it a second time.

**Verification.** `npm run verify`: RESULT PASS (22 of 22). `check:layout-shells`
grew to cover five shells and five route-group layouts, and the framing rules
with them: every role of the role model is framed and no role is invented;
every copy key a frame names is checked against the catalogue files; each
audience's group must render the shell the table gives it; the client frame must
declare `hasNavigation: false` and its shell must accept no navigation slot;
every role-aware shell must publish the role and audience on its root element;
and the seam must fail closed, must not preview a privileged role, and must not
preview the client role.

Eight negative controls, each run and reverted: a role deleted from the table; a
frame naming a key no namespace declares; the seam previewing as the super
admin; the seam losing its null branch; the client shell gaining a sidebar; the
admin group rendering the dashboard shell; the frame no longer gating
navigation (the unresolved reader then showed a menu); the client portal
rendering a navigation landmark.

**Rendered evidence.** `docs/EVIDENCE/step-01/shell-probe.py` now measures the
specimen page per shell rather than in aggregate: 9 shells rendered, each with
exactly one skip link carrying the catalogue label, one focusable main landmark
before which the skip link is the only focusable element, and the skip link
before the landmark inside its own block. Then the framing table, one row per
reader, read from the copy the reader actually sees:

| role        | shell         | band | notice             | navigation |
| ----------- | ------------- | ---- | ------------------ | ---------- |
| owner       | dashboard     | no   | no                 | yes        |
| staff       | dashboard     | no   | staff notice       | yes        |
| super_admin | admin         | yes  | no                 | yes        |
| ceo         | admin         | yes  | CEO notice         | yes        |
| admin_staff | admin         | yes  | admin staff notice | yes        |
| client      | client-portal | no   | no                 | no         |
| unresolved  | dashboard     | no   | no                 | no         |

Three more negative controls were run against the probe: the owner given the
staff notice, navigation gating removed, and a navigation landmark inside the
client portal. All three turn it into a FAIL.

**Production.** `next build` OK, 8 static pages. With `next start`: `/shells`
404 at 7,196 bytes with zero occurrences of the page title, `data-shell`,
`main-content` or the framing copy; `/gallery` unchanged at 404 / 6,172 bytes;
`/dashboard`, `/admin` and `/client-portal` answer 404 because they have no
pages yet, and the layouts themselves emit no route. The development group
stays invisible in production.

## Sub-step 1.19 evidence -- layout shells, focus order and the print base

Delivered two route-group shells, the four components they are built from, the
print base, and a development-only specimen page that renders both shells with
a document inside them.

**Structure.** `components/layout/skip-link.tsx` is the first focusable element
of every shell: visually hidden until focused, then drawn over the page corner
at the 44px touch height with the focus ring from the token set. Its label comes
from the catalogue (`common.label_skip_to_content`, added in 1.12 and unused
until now) and its target comes from `MAIN_CONTENT_ID`, the constant exported by
`components/layout/main-content.tsx`, which is the only place a `<main>`
landmark is declared. That element carries `tabIndex={-1}`, without which the
browser moves the fragment target but not the focus, and the skip link leaves
the reader exactly where they started. `public-shell.tsx` wraps a full-height
column that prints as a flow; `auth-shell.tsx` centres one panel of at most
`max-w-dialog` (32rem, from the layout width scale) with the brand mark above
it and no navigation at all, because an auth page has exactly one task.
`app/(public)/layout.tsx` and `app/(auth)/layout.tsx` are thin: they render the
shell and import the print base.

**The print base** is `styles/print.css`, and it is five decisions rather than a
list of tweaks:

1. _Paper is not a theme._ The sheet is white and the toner is black, so the
   semantic roles are remapped onto a fixed paper palette for `:root`, `.dark`
   and every pinned theme scope. A reader in dark mode who prints an invoice
   gets black on white, which is what makes the document usable rather than a
   cartridge accident.
2. _Chrome does not print._ `nav`, `button`, dialogs, menus, tooltips, Radix
   popper wrappers and anything marked `data-print="hide"` are hidden. Blocks
   marked `data-print="only"` exist for paper alone, so a document header or a
   signature line has somewhere honest to live.
3. _A row is not split across sheets._ `thead` repeats, rows, figures, tables
   and headings are kept whole, and headings stay with what they introduce.
4. _Meaning survives without colour._ Anything marked `data-print="outline"`
   keeps an ink border, because a status carried only by a fill prints as blank
   paper.
5. _Links keep their underline, motion stops, shadows disappear._

**The paper palette** is part of the token module, not the stylesheet:
`PRINT_TOKENS` (paper, ink, muted ink, rule), `PRINT_ROLE_MAP` (the 23 semantic
roles and the print token each one takes), `PRINT_CONTRAST_PAIRS` and
`PRINT_PAGE_MARGIN_MM`. The variables are declared in `styles/globals.css`
`:`root`` so the token check verifies them in both directions exactly like a
theme role, and `scripts/checks/color-contrast.mjs` now verifies the paper
palette too: 4 tokens and 3 ratios, with ink on paper held to the 7:1 AAA
threshold because paper has no backlight. The `tokens:export` JSON gained a
`print` group (11 groups, 24,310 bytes).

**Verification.** `npm run verify`: RESULT PASS (22 of 22). The new
`check:layout-shells` is the seventeenth rule check and it holds the shell
contract statically: the skip link and the landmark share one id and neither
may write it as a literal, the link comes before the landmark in every shell,
the landmark must be focusable, no route under a layout group may declare its
own `<main>`, both route layouts import the print base, the `@page` margin must
equal `PRINT_PAGE_MARGIN_MM`, and every role in `PRINT_ROLE_MAP` must be
remapped in the paper block. It reads code with comments stripped for the
structural rules and the raw source for the string rules, because a check that
reads comments can be satisfied by prose.

Six negative controls, each run and reverted: a literal target id fails; removing
`tabIndex={-1}` fails (and only after comments are stripped, which is how that
rule was found to be vacuous); dropping one role from the paper block fails; a
raw hex colour in the print base fails; a page margin that drifts from the token
fails; moving the skip link after the landmark fails. Two more controls were
run against the probe below.

**The rendered evidence** is `docs/EVIDENCE/step-01/shell-probe.py` (run by
hand against `http://127.0.0.1:3000/shells`, never wired into verify). It reads
the response the server sends and reports: 2 skip links pointing at
`#main-content`, 2 main landmarks each carrying the id and `tabindex="-1"`,
exactly 1 focusable element before the first landmark (the skip link itself),
1 `@media print` block in the loaded stylesheet with the chrome rule, the
button rule, the print-only rule, the ink outline rule, the row-break rule and
the 16mm page margin, the four paper palette values equal to the token module,
and the print markers intact in the markup. Result: PASS. Two negative controls
against it: removing the button rule from the print base and dropping
`data-print="outline"` from the specimen both turn it into a FAIL.

**Print behaviour is not print-preview-verified.** No browser is available in
this repository by design, so the probe proves that the rules and the markup
they select on both arrive in the response, not how the sheets come out of a
printer. That limitation is recorded here rather than glossed over; the
document-level print rules (invoice templates, page numbering) belong to the
steps that build those documents.

**Production guard.** `next build` OK, 8 static pages (`/shells` 1.14 kB, 112 kB
first load). With `next start`: `/shells` answers 404 at 7,196 bytes - the same
size as the generic not-found page - with zero occurrences of the page title,
the specimen copy, `main-content` or `data-print`. `/gallery` is unchanged at
404 / 6,172 bytes. The development group stays invisible in production.

**Also in this commit:** the comment in `app/layout.tsx` that promised brand
typefaces in sub-step 1.18 was wrong - no font is delivered in step 1 - and now
records the truth: the families are system stacks pointed at by
`--font-sans` and `--font-mono`, and a self-hosted face has to arrive with
subsetting and a preload (MASTER_PROMPT performance requirements, sub-step
16.9) rather than as a build-time download. No behaviour changed with it.

## Sub-step 1.18 evidence -- brand pack, social image and brand voice

Delivered the whole brand pack as generated artefacts, not uploaded files.
config/brand.ts is the single source of truth: the mark geometry on a 32 unit
grid (capsule strokes, one stem and two arms for the K, one stem and one bowl
for the D, stroke width 3.4), three variants described as colour-role
references rather than values, the asset list, the ICO sizes and the social
image dimensions. Not one colour literal exists in any asset; every one of them
is a `{role, theme}` reference resolved through the token palette, which is what
makes a palette change reach the favicon without anyone re-exporting it.

Nine assets are generated by scripts/generate-brand-assets.ts and committed:

| Asset                              | Size          | Variant            |
| ---------------------------------- | ------------- | ------------------ |
| app/favicon.ico                    | 16, 32, 48    | plate icon         |
| app/icon.png                       | 512           | plate icon         |
| app/apple-icon.png                 | 180           | plate icon         |
| public/brand/logo-light.svg        | 32 grid units | glyph, foreground  |
| public/brand/logo-dark.svg         | 32 grid units | glyph, foreground  |
| public/brand/logo-icon.svg         | 32 grid units | plate and glyph    |
| public/icons/icon-192.png          | 192           | plate icon         |
| public/icons/icon-512.png          | 512           | plate icon         |
| public/icons/icon-maskable-512.png | 512           | plate fills square |

The tenth artefact is the default social image, built rather than uploaded.
MASTER_PROMPT places it at lib/seo/og-image.ts; it composes a 1200 by 630
ImageResponse from the same geometry and the same tokens, embeds the mark as
an SVG data URI and draws the product name and description from the catalogue.
It is measured, not committed, and it has no URL yet on purpose: metadata
belongs to the public routes, and the only page in the build is the
development gallery, which must leave no trace in a production response. The
route that mounts it lands with the public site in segment 1D.

The brand voice guide is docs/BRAND_VOICE.md: who is being written to, the
four voice words in priority order, tone by context, the words this product
uses and the words it avoids, partner naming, money and date voice, sentence
shapes, long form against short form, the wording rules that accessibility
adds, and a review checklist. docs/COPY_RULES.md keeps its own role: it defines
what a valid string is, the voice guide defines how it sounds.

Verification, `npm run verify`: RESULT PASS (21 of 21 checks passed), exit code 0. check:brand-assets is the new entry (the sixteenth rule check) and it holds
four lines: the nine assets exist and are current with a fresh render; no
unmanaged file sits in a generated directory; every colour in every SVG is a
palette colour; and the rendered pixels are measured through
scripts/brand/verify-generated.ts, which imports the same renderer the
generator uses. The pixel layer asserts the ink is centred on both axes, stays
clear of the canvas edge, fills 46 to 62 of 64 pixels, shows three ink runs on
the midline (K with its arm, D stem, D bowl), keeps the plate opaque and its
corners transparent, and that the 16 pixel tab icon still shows both letters.

Three defects were found and fixed by that measurement layer, which is why it
exists:

1. The first rasteriser drew in grid units on a pixel plane. Every icon carried
   the monogram in its top left corner at a sixth of its size. The pixels were
   the only thing wrong; nothing in any file looked incorrect.
2. The mark was centred by its coordinates rather than by its ink. Half the
   stroke width sits outside the geometry, so it sat visibly low and left.
3. At 16 pixels the design padding of 4 units cost a quarter of the square and
   the monogram became a smear. The two smallest ICO sizes now take a tighter
   documented margin (BRAND_SMALL_ICON_MAX_SIZE, BRAND_SMALL_ICON_PADDING).

Negative controls, each run and then reverted: a hand-edited SVG colour fails
on the palette rule and on currency; moving the D stem two units fails on
centring; a stroke width of 10 collapses the midline to one run; removing the
small-icon margin fails on currency; a flat social image fails with three
distinct byte values; shrinking OG_IMAGE_WIDTH fails on the network crop size.
The check is not decoration.

The component gallery gained a brand section (app/(dev)/gallery/showcase-brand.tsx)
so the mark is exercised in all five theme scopes: 25 glyph renders and 5 plate
renders in the rendered page, each with the size ladder 16, 24, 32 and 48, the
named variant, and the four generated files fetched by URL. Both segment 1B
probes still pass after the change: the style probe reports 0 class tokens
without CSS and 0 raw values across 80 files, and the DOM probe reports 26
markers per scope in all five scopes with 0 accessible-name issues.

Production build, `next build`: OK, 7 static pages. The brand pack is now part
of the response head: `/favicon.ico` (16x16) and `/icon.png` (512x512) are
linked, and `/icon.png`, `/apple-icon.png` and `/brand/logo-light.svg` all
serve 200 in development. The development gallery still answers 404 in
production at 6,172 bytes with zero traces of the page (the growth from the
5,473 bytes recorded at the 1B gate is the two icon links the brand pack adds
to every head, not page content).

## Sub-step 1.17 evidence -- form primitives and the component gallery

Delivered the shared form layer and the component gallery the 1B segment gate
asks for.

The shared layer is four components and five library modules:
components/shared/form-wrapper.tsx (the four states, the one-time token, the
submit lock), form-field.tsx (label, hint, error and control wired by id and
aria-describedby, with the error as a live region), form-error-summary.tsx
(every invalid field as a link, focus moved to the summary when a submission is
refused) and submit-button.tsx (disabled and aria-busy while submitting, the
pending label announced). lib/forms/ holds the field rules built from the
validation catalogue, the error mapper, the response reader, the one-time
token client and the field id helper; lib/hooks/use-zod-form.ts is the single
React Hook Form entry point, because validate on blur, revalidate on change,
first error only and focus the first invalid control are platform defaults that
a caller cannot be trusted to repeat.

Two rules are enforced in code rather than promised. Every submission carries a
one-time token (MASTER_PROMPT item 11): the server render mints it, the
submission sends it in the x-csrf-token header, spends it as the request
leaves, and installs the replacement from the response header or body, so a
replayed request carries a spent token. The server half lives in the request
pipeline (lib/middleware/csrf.ts, sub-step 3.4). And no parser text can reach a
user: a message is displayed only when it is a sentence in the validation
catalogue, otherwise the mapper substitutes the catalogue sentence for that
kind of failure. That is what closes the gap the catalogue leaves open, since
the validation strings carry no {min} or {max} placeholders and a Zod default
message is not copy.

The gallery renders the same full component set five times, once per pinned
scope, and it is the last piece of the gate. The scopes are new blocks in
styles/globals.css (.theme-light, .theme-dark, .theme-hc-light,
.theme-hc-dark and .theme-reduced-motion), and both token checks were extended
so a scope cannot drift: color-contrast now verifies all eight blocks against
config/design-tokens.ts token by token (4 themes, 23 roles, 76 ratios, with
negative controls proving that a changed --background in one scope and a
changed duration in the reduced motion scope both fail the check), and
design-tokens verifies the reduced motion scope sets every duration to its
reducedValue and collapses animation and transition for its descendants. The
route exists in development only: app/(dev)/layout.tsx calls notFound()
outside the development environment, so a production deployment answers 404 and
cannot be read as a component inventory.

Evidence, in the order it was produced:

- `npm run verify` PASS 20/20. Counts at this sub-step: i18n-strings 32 JSX
  files / 7 namespaces / 257 keys; design-tokens 96 source files / 197 class
  lists; color-contrast 4 themes / 23 roles / 76 ratios, now over 8 blocks;
  any-types 79 TypeScript files; secrets 154 files.
- Compiled CSS probe (/tmp/probe/gallery-css-probe.mjs): 243 class tokens
  across 36 files (components/ui, components/shared, lib/hooks, app/) with 0
  tokens that produce no CSS, 0 of 6 negative controls compiling (w-72, w-40,
  min-w-40, max-w-64, gap-72, mt-72 are off this project's replaced spacing
  scale and exist in no stylesheet) and 25 declaration expectations passing,
  including .sr-only, the fieldset reset, aria-[invalid=true] borders and the
  destructive error fill. The probe found and fixed its own bug on the way: it
  only collected className expressions, so a plain className="sr-only" was
  invisible to it and the first run reported the visually hidden live region
  missing.
- Rendered gallery probe (/tmp/probe/gallery-dom-probe.py) against
  `next dev`: 26 markers per scope across all five scopes, with identical
  inventories in every scope (checkbox 4, switch 1, radio 2, combobox 2,
  textarea 3, label 20, tablist 1, tab 2, button 35, table 1, caption 1,
  skeleton 5, badge 12, fieldset 1, submit 3, aria-invalid 3, role=alert 4,
  aria-live=polite 6, aria-busy 4, sr-only 1, dialog/sheet/popover/menu/
  tooltip triggers 1 each, toast viewport 1). 0 findings.
- `npx next build`: compiled successfully, 4 of 4 static pages, /gallery
  prerendered. Production guard proven with `next start`: GET /gallery returns
  HTTP 404 and 0 scope markers, so the gallery is absent from a production
  deployment.
- Negative control for the segment gate rule "no hardcoded color or spacing
  outside tokens": `bg-[#ff0000] p-[13px]` injected into
  app/(dev)/gallery/theme-scope.tsx fails check:design-tokens with 3 findings
  (arbitrary Tailwind value, arbitrary Tailwind value, raw color literal);
  restored, check PASS.

Two defects found in already committed layers, both fixed at the source rather
than worked around:

1. `tPlural` could not be called correctly. Its parameter was typed as an
   ordinary catalogue key, but the base of a plural pair is never a key of its
   own, so the first real caller (the error summary) failed to type check.
   lib/i18n/types.ts now derives EnglishPluralKey from the catalogue and
   requires the _other member to exist, so `tPlural('forms.error_summary_title',
n)` compiles and a key without a pair does not.
2. check:money-math read the slash of a self-closing JSX tag as division:
   `<ShowcaseFeedback />` matched "money identifier followed by an operator"
   because the component name contains "fee". The check now excludes the
   self-closing and closing tag forms and still reports `{total / 2}`.

One dependency change: react-hook-form 7.90.0 and @hookform/resolvers 5.9.1.
The repository's pre-commit hook also had to learn one thing: next-env.d.ts is
generated by Next.js and sits in the ESLint ignore list, so lint-staged now
uses `!(*.d).{js,jsx,mjs,ts,tsx}` and no longer hands a declaration file to the
linter.

## Sub-step 1.16 evidence -- shadcn/ui primitives B

Delivered ten primitives (dialog, sheet, popover, dropdown menu, tabs,
tooltip, toast, table, skeleton, badge) plus lib/hooks/use-toast.tsx, which
holds the toast queue in a reducer behind a provider rather than in a module
level array: a module level queue would be shared by every request the same
Node process handles, so one tenant could see another tenant's notification.
The queue is also capped, because an unbounded list is a slow leak in a long
lived tab.

Layering is the point of this sub-step and is verified by compiled CSS:
backdrop z-overlay (50), panel z-modal (60), menu z-dropdown (70), popover
z-popover (80), tooltip z-tooltip (90), toast z-toast (100). A select opened
inside a dialog, and a tooltip opened from a control inside a popover, both
resolve without a special case.

Panel widths became tokens. Width utilities in this project come from the
spacing scale, so w-72, min-w-40 and max-w-64 produced no CSS at all: those
classes exist in default Tailwind only because of the default scale that this
project replaces. LAYOUT_WIDTH_TOKENS now defines menu (10rem minimum),
popover (20rem), tooltip (16rem maximum), dialog (32rem maximum) and sheet
(24rem maximum), wired through theme.extend width, minWidth and maxWidth so
the Tailwind defaults (fractions, auto, full) stay available. The token check
verifies every width has a unit and documents its usage, and the export
includes the group.

Evidence:

- Class compilation probe: 205 class tokens across 19 files, compiled with
  Tailwind against exactly those files. Zero tokens produced no CSS. Twenty
  four declaration expectations verified, including the six layer positions,
  the dialog fraction width with a token ceiling, the sheet fraction width,
  the named panel widths, the slow motion token and the enter curve on overlay
  panels, the 44px table header row, badge pills with the xs text step and the
  skeleton pulse. Negative controls confirm p-7, gap-7, h-13, text-mdup,
  z-9999 and the retired calc-based width generate nothing.
- DOM render probe: 70 assertions in jsdom (installed outside the repository,
  never a dependency of it), mounting the real components through react-dom
  client rendering so portals, focus movement and keyboard handling actually
  run. Verified: the dialog is labelled and described by its title and
  description, it is portalled, focus moves inside on open and returns to the
  trigger on Escape, and the page behind it is hidden from assistive
  technology while open and reachable again after close; sheet variants pin
  the panel to the left edge with a fraction width; the menu opens on
  ArrowDown, exposes role menu with two menuitem children, focuses the first
  item, moves with ArrowDown, marks the destructive item, closes on Escape and
  returns focus; the popover reports aria-haspopup dialog and keeps its
  content interactive; the tooltip appears on keyboard focus and is wired to
  its trigger through aria-describedby; tabs expose tablist, tab and tabpanel
  roles, keep arrow navigation working and hide the inactive panel; the toast
  announces itself as a status inside a live region with a catalogue labelled
  dismiss control; badges are spans with the semantic role pairs; skeletons
  are hidden from assistive technology; table headers scope their column and
  the wrapper scrolls.
- Rule probes: a literal aria-label in toast.tsx fails check:i18n-strings; a
  raw hex color and an arbitrary pixel value in skeleton.tsx fail
  check:design-tokens with three findings. Both reverted.

Two wrong assumptions were caught by the DOM probe instead of being shipped in
this handoff: Radix does not emit aria-modal (it hides the background, which
is the stronger guarantee and is what the probe now asserts), and
popper-positioned content is wrapped in a positioning div, so "portalled"
means outside the application root rather than a direct child of body.

Open item recorded here and resolved in 1.17: the component gallery route did
not exist at 1.16. It needed a root layout, so it was planned for 1.17 together
with the form primitives it must display. Sub-step 1.17 delivered it
(app/(dev)/gallery/, development only, with app/layout.tsx as the root shell);
the segment gate check runs against it now.

npm run verify at b5bb363: RESULT PASS (20 of 20 checks passed).

## Sub-step 1.15 evidence -- shadcn/ui primitives A

Delivered eight primitives in components/ui: button (six variants, four
sizes, asChild), input, textarea, label, checkbox, radio group, select and
switch, plus the ui string namespace for accessible names that have no
visible text. Dependencies added: the six Radix packages, class-variance-
authority and lucide-react.

Review-grade decisions recorded in the files themselves:

- Touch targets. Default and lg controls are 44px and 48px tall and the icon
  button is 44x44. The sm step (36px) exists for pointer-driven dense
  toolbars. A control whose visible shape must stay small gets its 44x44
  pointer target from a pseudo-element whose content is the empty string, so
  the target grows while the box, the check mark and the switch track look
  unchanged.
- Text sizes. Text a user types or reads as content is 16px, because an input
  below 16px makes iOS Safari zoom the viewport on focus. Button labels are
  14px: a button never receives text input and never triggers that zoom.
- Focus. No primitive sets outline-none anywhere. The indicator comes from the
  global :focus-visible rule, which the contrast check already holds at 3:1 in
  all four themes against both the page and the card surface.
- Select layering uses the z-dropdown layer, above a modal, because a select is
  often opened inside a dialog. The content width and maximum height come from
  the variables Radix measures, never from a raw pixel value.
- Radix Select emits the combobox pattern (role combobox, aria-expanded,
  aria-autocomplete) rather than aria-haspopup, and renders a hidden native
  select so the value still submits inside a plain form. Both were verified in
  the rendered markup rather than assumed.

Two defects found by the evidence runs, both fixed in the code:

- aria-invalid:border-destructive produced no CSS at all. Tailwind 3.4 ships
  aria variants for busy, checked, disabled, expanded, hidden, pressed,
  readonly, required and selected, and invalid is not one of them, so the
  invalid styling was silently dead. The primitives now use the arbitrary
  variant aria-[invalid=true]:border-destructive, which compiles to
  [aria-invalid="true"] and matches what React renders.
- The first probe run asserted an aria-haspopup attribute the library does not
  emit, which would have shipped a wrong claim in the handoff; the assertion
  now matches the real contract.

Evidence:

- Class compilation probe: 121 class tokens collected from the eight files with
  the TypeScript API, compiled with Tailwind against exactly those files as
  content. Every token produced CSS, so no class name is a typo or an
  off-scale step. Sixteen declaration expectations verified, including h-11
  equals 44px, size-11 equals 44x44, the checkbox hit area is inset -14px, the
  switch hit area is -10px vertically, the switch thumb travels 20px, the
  textarea floor is 64px, aria-[invalid=true] borders with destructive, the
  empty-content pseudo-element renders, and the select content sits at z-index 70. Negative controls confirm p-7, min-h-20, text-mdup, h-13 and gap-7
  generate no CSS at all.
- Render probe: 70 assertions over server-rendered markup. Button type,
  variants, sizes, asChild and disabled; input type passthrough, autocomplete,
  aria-invalid, disabled and the 16px text; textarea rows and resize policy;
  label for attribute; checkbox role, aria-checked false/true/mixed and
  data-state; radiogroup role with two radio items and checked state; switch
  role with both states; select combobox role, aria-expanded, the hidden native
  select and the catalogue placeholder text. Catalogue scroll_up and scroll_down
  resolve.
- Rule probes: a literal aria-label in select.tsx fails check:i18n-strings with
  two findings; p-[13px] and bg-[#ff0000] in checkbox.tsx fail
  check:design-tokens with three findings. Both reverted.

Note for 1.16: the segment gate asks for a component gallery route that renders
every primitive in light, dark, high contrast and reduced motion. The route is
not created in 1.15 and belongs to 1.16 or 1.17, and the select content cannot
be server-rendered because Radix renders it in a portal, so the gallery is what
will show it.

npm run verify at cdba8d2: RESULT PASS (20 of 20 checks passed).

## Sub-step 1.14 evidence -- design tokens B

Delivered: typography (nine sizes with line height and tracking, four weights,
two font stacks), motion (five durations with a reduced-motion value each and
four easing curves), the palette as 23 semantic roles in four themes (light,
dark, high-contrast light, high-contrast dark), the WCAG contrast contract as
19 enforced pairs, the token JSON export, and two new verify entries.

Palette defects the new check found and forced a fix for, all in the shipped
values rather than in the check:

- light muted-foreground on the muted surface was 4.34:1, below AA. The token
  is now 215.4 16.3% 40% (5.58:1).
- light success surface carried near-white text at 3.00:1 and the warning
  surface at 2.91:1. Success is now 142.1 76.2% 28% with its near-white label
  at 4.72:1, and the warning surface takes a black label at 6.58:1.
- dark destructive as link text on the canvas was 2:1: a dark red cannot be
  both a danger surface under light text and danger text on a near-black
  canvas. The dark theme now uses the tonal pattern, a vivid red 0 72% 60%
  with a black label, which satisfies both directions.
- light and dark input boundaries were 1.23:1 and 1.37:1 against the canvas,
  below the 3:1 requirement for the visible boundary of a control. They are
  now 215.4 16.3% 55% and 217.2 32.6% 45%.
- dark ring against the canvas was 2.98:1, just under the 3:1 focus
  requirement. The dark ring is now the dark primary, 5.44:1.

A silent configuration failure was found and closed while proving the wiring.
Once config/design-tokens.json existed, the extensionless import
'./config/design-tokens' in tailwind.config.ts resolved to that JSON file
inside Tailwind's own config loader: every named import became undefined,
Tailwind fell back to its default scales, and nothing failed - the config
looked correct because it still imported by identifier. The import in
tailwind.config.ts and scripts/export-design-tokens.ts now carries the .ts
extension, tsconfig enables allowImportingTsExtensions, and
check:design-tokens fails any extensionless import of the token module. Proof:
with the extension, @apply p-4 text-base z-modal duration-fast in a probe
stylesheet compiles to padding 16px, font-size 16px with line-height 24px,
z-index 60 and transition-duration 120ms.

Negative probes, each reverted after the run, 24 of 24 caught:

- Contrast: a light text pair below 4.5:1, a high contrast text pair below
  7:1, an HSL triple replaced by a hex value, a role missing from a theme
  (parity), a stylesheet value edited alone, a color variable outside the role
  list, and a dark block missing a role.
- Typography: body size reduced to 14px, a required step renamed, a line
  height below its font size, and a non-ascending scale.
- Motion: reducedValue no longer 0ms, a duration in seconds, a missing easing
  curve, an invented easing value, durations not zeroed in the reduced motion
  block, a renamed reduced motion media query, a forced colors border rule
  replaced, and a focus ring color that is not Highlight.
- Wiring and export: an inline fontSize literal, a missing
  transitionDuration wiring, a removed motion variable, an invented z-index
  layer, and a stale config/design-tokens.json.

Positive control: a probe component using only token classes passes, and
config/design-tokens.json is byte-identical on regeneration.

Design decisions recorded in the token module: large text may use 3:1, but
every text pair is verified at 4.5:1 so the display sizes keep headroom; the
border role is a documented decorative divider, while the input role carries
the 3:1 control boundary requirement; high contrast text pairs must reach 7:1
in both themes.

npm run verify at 6eb05dd: RESULT PASS (20 of 20 checks passed).

## Sub-step 1.13 evidence -- design tokens A

Delivered: config/design-tokens.ts (spacing, radius, shadow and z-index ladders
plus state and motion variables), tailwind.config.ts wired to those exports by
identifier, the --shadow-* and --z-* variables declared in :root and .dark in
styles/globals.css, and scripts/checks/design-tokens.mjs as the 18th verify
entry (package.json, scripts/verify.mjs and the README script row updated).

Negative probes, each reverted after the run:

- p-[13px], z-[9999] and bg-[#ff0000] in a className and in a cn() argument:
  one arbitrary-value finding per bracket value, with duplicates suppressed.
- Hex color in a TS module, an rgb() literal and an inline style with a raw
  margin, color and hex value: raw-value and inline-style findings. The same
  style block with opacity, fontWeight, order and zIndex var(--z-modal) passed,
  so unitless and tokenized properties are not false positives.
- theme.spacing and theme.zIndex replaced by inline literal scales, and the
  token import removed: "must be the SPACING_TOKENS/Z_INDEX_CLASS_MAP
  identifier" plus "must import its scales from ./config/design-tokens".
- Ladder mutations: a duplicate z-index value, a layer moved below its
  predecessor, a renamed spacing step keeping the old value, and a wrong
  spacing value. All reported, and the stylesheet then reported the mismatch
  between --z-popover and the mutated ladder.
- styles/globals.css mutations: --shadow-xl and --z-modal deleted, a bogus
  --z-debug-overlay added. Missing and unknown variables both reported.
- Positive control: a component using cn(), a conditional class, a template
  literal class, token classes and a var(--z-modal) inline value passed with a
  non-zero class-list counter.

Compiled-CSS proof: npx tailwindcss produced p-4 = 16px, px-2.5 = 10px,
h-10 = 40px and z-modal = 60. The off-scale steps p-7, h-7, h-12, gap-7 and
shadow-3xl do not exist because the scales replace Tailwind's defaults instead
of extending them.

npm run verify at 2f25ca8: RESULT PASS (18 of 18 checks passed).

## Working rhythm (owner instruction, effective 2026-10-16)

From this point every sub-step runs under the permission-gated rhythm:

1. Execute exactly one sub-step.
2. Run `npm run verify` and fix every failure.
3. Commit only that sub-step, one sub-step per commit.
4. Update this progress file.
5. Stop and print the three-line prompt: DONE, NEXT, CONTINUE.
6. Wait for the owner to type `continue` before starting the next sub-step.
   Never cross a segment gate.

The next chat starts at the first unchecked sub-step and follows the same
rhythm from there.

## Session notes

- 2026-10-16: the build environment's working copy was restored from a fresh
  clone of the repository and the local branch was moved back to its base
  commit. No work was lost: all nine segment 1A commits were present on
  `origin/arena/b7780282-kd`, the local branch was restored to that tip
  (35b1869) and the working tree matched the commit exactly. Dependencies
  were reinstalled and `npm run verify` returned PASS at 16 of 16 checks.

## Segment 1B gate -- PASSED (2026-10-16)

Gate: "component gallery route renders every primitive in light, dark, high
contrast and reduced motion; no hardcoded color or spacing value exists outside
tokens." Evidence is committed in docs/EVIDENCE/step-01/gate-1B.md, with the
two probes that produce it next to it:

- `node docs/EVIDENCE/step-01/gallery-style-probe.mjs` -- PASS: 244 class
  tokens, 0 without CSS, 0 of 6 negative controls compiled, 32 declaration
  expectations, 0 raw colour or spacing values across 75 files, and the
  safelist control (5 of 5 scope rules with it, 0 of 5 without it).
- `python3 docs/EVIDENCE/step-01/gallery-dom-probe.py` -- PASS: 26 markers in
  each of the five scopes with identical inventories, the five scope rules
  present in the stylesheet the browser loads, 0 accessible-name issues across
  175 buttons, 100 form controls, 45 role-bearing controls and 30 labels.
- `npm run verify` -- PASS, 20 of 20 checks.
- `npx next build` -- PASS; production audit: `GET /gallery` returns 404 with
  5,473 bytes and zero gallery traces, `GET /` returns 404 (no public page
  yet), dead-link audit clean.

Three defects were found while proving the gate and fixed at the source:

1. A composite control lost the attributes the field handed it (Radix Select
   is a context provider, not an element): the label pointed at an id no
   element carried and the combobox had no accessible name. FormField now takes
   an element or a function that receives the field attributes, and the DOM
   probe checks every label target and every role-bearing control, so the
   defect cannot return unnoticed (negative control: 6 findings).
2. The pinned theme scopes could silently stop applying, because a rule in
   `@layer base` is tree shaken by class name. THEME_SCOPE_TOKENS in
   config/design-tokens.ts is now the single owner; the Tailwind safelist is
   derived from it; check:design-tokens compares it with the stylesheet in both
   directions and requires the safelist to derive from it; the gallery scope
   list is derived rather than duplicated.
3. The development-only guard was incomplete: a layout guard alone still let
   Next serialize the page, so a production 404 carried the component tree as a
   flight payload (45,947 bytes) and the page metadata named the route in the
   response head. The guard is repeated in the page and the route declares no
   metadata of its own; the same request is now 5,473 bytes with no trace.

Open item, unchanged: the step 1 gate also requires Lighthouse at least 90 on
the homepage. There is no public page to measure until segments 1C and 1D
build one, so it is carried forward rather than claimed.

## Segment 1B gate state (after sub-step 1.17)

Every sub-step of segment 1B (1.8 to 1.17) is committed and every check is
green. The gate itself -- "component gallery route renders every primitive in
light, dark, high contrast and reduced motion; no hardcoded color or spacing
value exists outside tokens" -- is verified by the probes recorded under
"Sub-step 1.17 evidence" and can be re-run at any time:

- `python3 /tmp/probe/gallery-dom-probe.py` with `npx next dev` running
  (26 markers per scope, five scopes, identical inventories);
- `node /tmp/probe/gallery-css-probe.mjs` (243 class tokens, 0 without CSS,
  6 negative controls, 25 declaration expectations);
- `npm run verify` (20 of 20);
- `npm run check:design-tokens` after injecting `bg-[#ff0000] p-[13px]`
  somewhere under app/ or components/ (3 findings), then revert.

The two probe scripts live outside the repository on purpose: they are
evidence, not part of the product, and the project forbids test files.

## Segment boundary note (owner decision, 2026-10-16)

The plan runs one segment per chat. The owner explicitly instructed the
session to continue with sub-step 1.8 in the same chat, so segment 1B was
started here by owner decision. The record stays accurate: segment 1A closed
with its gate passed, and segment 1B continues under the permission-gated
rhythm (one sub-step per commit, verify between sub-steps, stop for
confirmation).

## Sub-step 1.21 starting point

1.21 is "Layout components: sidebar, topbar, mobile drawer, bottom navigation,
breadcrumbs, footer, offline banner, sticky action bar", all of which belong in
`components/layout/` (step 1 owns that directory). The attachment points exist
and are already exercised: `ShellSlots` in
`components/layout/shell-slots.tsx` takes `topBar`, `sidebar`, `footer` and
`bottomBar` as nodes and wraps each in the right landmark with an accessible
name from the catalogue, and the frames decide whether navigation is painted at
all, so a component dropped into a slot needs no layout knowledge.

Two facts from the accepted work to build on rather than re-decide: the
dashboard and admin shells are rendered by the specimen page
(`app/(dev)/shells/page.tsx`) once per role with a specimen navigation in the
sidebar slot, which is where the new components should be rendered for the
probe; and `config/nav-map.ts` is 1.22, so the sidebar, the drawer and the
bottom bar consume a navigation list that does not exist yet and should take it
as data through their props rather than reading a config module that is not
written. `check:layout-shells` enumerates shells and route layouts in two arrays
at the top of the file; if 1.21 adds a component with a landmark, that check is
where its rules belong, not a new script.

## Blockers

None recorded.

## Notes for the next segment (1B)

- Toolchain: Node v22.22.3, npm 10.9.8. Add dependencies with
  `npm install --save` / `--save-dev` so package.json and the lockfile stay
  in sync, then commit both.
- Every new file needs its path comment on line 1: `// path: ...` for
  TypeScript, JavaScript and Markdown, `# path: ...` for shell, YAML, TOML,
  .env.example and ignore files, `/* path: ... */` for CSS, `-- path: ...`
  for SQL, `<!-- path: ... -->` for HTML and SVG. JSON, lockfiles,
  next-env.d.ts and LICENSE are exempt.
- `npm run verify` runs 20 entries: typecheck, lint, format:check,
  env:validate, tokens:export and the fifteen checks. Extend the verify entry
  list by appending to `ENTRIES` in scripts/verify.mjs when a new check lands
  (it was 16 when this note was first written; 1.15 to 1.17 added four).
- Money-math and any-types are heuristic guards: keep count and paging
  identifiers free of money words (the guard flagged `const total =` in
  scripts/verify.mjs and the fix was `totalCount`).
- The structured logger must not use the console object; write to
  process.stdout and process.stderr like the check scripts do.
- Extend .env.example and lib/env/validate-env.ts (ENV_SOURCE_KEYS,
  SECRET_ENV_KEYS, PRODUCTION_REQUIRED_KEYS) when a sub-step adds variables.
- LICENSE and package.json `license` are UNLICENSED until sub-step 1.31.
- Tailwind theme extension points are ready in tailwind.config.ts (colors
  already bound to CSS variables in styles/globals.css); 1.13 filled spacing,
  radius, shadow and z-index; 1.14 filled colour (four themes), typography and
  motion and added the token JSON export. Component primitives in 1.15 and
  1.16 must use role classes only (bg-primary, text-muted-foreground,
  border-input) and text steps from the typography scale.
