// path: docs/EVIDENCE/step-01/gate-1B.md

# Segment 1B gate evidence

Gate statement, from docs/PLAN/08_SUBSTEP_CHECKLISTS.md:

> Segment gate: component gallery route renders every primitive in light, dark,
> high contrast and reduced motion; no hardcoded color or spacing value exists
> outside tokens.

Date: 2026-10-16. Branch: `arena/b7780282-kd`. Sub-steps covered: 1.8 to 1.17.
Evidence rules followed: docs/PLAN/04_DEFINITION_OF_DONE_AND_GATES.md section 4
(command output, reproducible, no screenshots).

## How to reproduce

```sh
npx next dev -H 0.0.0.0 -p 3000          # terminal 1
node docs/EVIDENCE/step-01/gallery-style-probe.mjs
python3 docs/EVIDENCE/step-01/gallery-dom-probe.py
npm run verify
```

Then stop the development server before building. `next build` and `next dev`
share the `.next` directory, so running a build while the development server is
up leaves it serving a stale client manifest (observed as HTTP 500 with
"Could not find the module ... in the React Client Manifest"); the fix is to
order the runs, not to change code.

```sh
npx next build                           # with the development server stopped
SUPABASE_URL=https://example.supabase.co \
SUPABASE_ANON_KEY=aaaaaaaaaaaaaaaaaaaaaaaa \
SUPABASE_SERVICE_ROLE_KEY=bbbbbbbbbbbbbbbbbbbbbbbb \
npx next start -p 3020
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3020/gallery
```

## 1. Half one: every primitive, in every theme

`python3 docs/EVIDENCE/step-01/gallery-dom-probe.py`

```
page size: 362289 bytes
stylesheet size: 43101 bytes
scopes found: 5
markers checked per scope: 26
buttons in the page: 175
form controls in the page: 100
controls with a semantic role: 45
labels with a for attribute: 30
accessible name issues: 0
findings: 0
RESULT: PASS
```

26 markers per scope, identical in all five scopes. The full table is printed
by the probe; the inventory per scope is:

| Marker                                    | light |  dark | hc-light | hc-dark | reduced motion |
| ----------------------------------------- | ----: | ----: | -------: | ------: | -------------: |
| checkbox (`role="checkbox"`)              |     4 |     4 |        4 |       4 |              4 |
| switch                                    |     1 |     1 |        1 |       1 |              1 |
| radio                                     |     2 |     2 |        2 |       2 |              2 |
| combobox (select)                         |     2 |     2 |        2 |       2 |              2 |
| textarea                                  |     3 |     3 |        3 |       3 |              3 |
| email input                               |     3 |     3 |        3 |       3 |              3 |
| label                                     |    20 |    20 |       20 |      20 |             20 |
| tablist / tab                             | 1 / 2 | 1 / 2 |    1 / 2 |   1 / 2 |          1 / 2 |
| button                                    |    35 |    35 |       35 |      35 |             35 |
| table / caption                           | 1 / 1 | 1 / 1 |    1 / 1 |   1 / 1 |          1 / 1 |
| skeleton (`animate-pulse`)                |     5 |     5 |        5 |       5 |              5 |
| badge (`rounded-full`)                    |    12 |    12 |       12 |      12 |             12 |
| fieldset (form lock)                      |     1 |     1 |        1 |       1 |              1 |
| submit button                             |     3 |     3 |        3 |       3 |              3 |
| invalid state (`aria-invalid="true"`)     |     3 |     3 |        3 |       3 |              3 |
| alert region                              |     4 |     4 |        4 |       4 |              4 |
| polite live region                        |     6 |     6 |        6 |       6 |              6 |
| busy state (`aria-busy`)                  |     4 |     4 |        4 |       4 |              4 |
| visually hidden status region             |     1 |     1 |        1 |       1 |              1 |
| dialog / sheet / popover / menu / tooltip |     1 |     1 |        1 |       1 |              1 |
| toast viewport live region                |     1 |     1 |        1 |       1 |              1 |

The probe also proves that the stylesheet the browser loads carries the five
pinned scope rules, because a rule inside `@layer base` is tree shaken by class
name and "the element has the scope class" is not the same claim as "the scope
applies":

```
stylesheet scope rules the browser loads:
  theme-light              yes   --background: 0 0% 100%
  theme-dark               yes   --background: 222.2 84% 4.9%
  theme-hc-light           yes   --border: 0 0% 30%
  theme-hc-dark            yes   --foreground: 0 0% 100%
  theme-reduced-motion     yes   --duration-fast: 0ms
```

The reduced motion scope is proven at the token level as well:
`npm run check:design-tokens` requires every duration token to be set to its
`reducedValue` (0ms) inside `.theme-reduced-motion` and requires the scope to
collapse `transition-duration` and `animation-duration` for its descendants.

## 2. Half two: no hardcoded colour or spacing outside tokens

`node docs/EVIDENCE/step-01/gallery-style-probe.mjs`

```
scope rules with the safelist: 5 of 5
scope rules without the safelist: 0 of 5
style sources scanned: 36
class tokens found: 244
compiled stylesheet: 37642 bytes
tokens with no CSS: 0
negative controls that compiled: 0
declaration expectations: 32
declaration failures: 0
files audited for raw values: 75
raw value findings: 0
RESULT: PASS
```

What each line means:

- **244 class tokens, 0 without CSS.** Every class used by `components/ui`,
  `components/shared`, `lib/hooks` and `app/` compiles. Tailwind ignores an
  unknown class silently, so a token that produced no CSS would be a step that
  does not exist (a mistyped scale step, a replaced width) applied to an
  element that then silently has no spacing.
- **0 of 6 negative controls compiled.** `w-72`, `w-40`, `min-w-40`, `max-w-64`,
  `gap-72` and `mt-72` are steps this project replaced, so they exist in no
  stylesheet.
- **32 declaration expectations.** Anchors carried forward from 1.15 and 1.16
  (44px control height, 44px icon button, the checkbox hit-area expansion,
  the whole z-index ladder, the five layout width tokens, the 16px body size,
  the motion tokens) plus the 1.17 form layer (`.sr-only` live region, the
  fieldset reset, `aria-[invalid=true]` borders, the destructive error fill)
  and the five pinned scopes.
- **0 raw values across 75 files.** An independent sweep of `app/`,
  `components/` and `lib/` for hex, `rgb()` and `hsl()` literals and for
  inline `style={{ ... }}` attributes. The token definition files
  (`styles/globals.css`, `config/design-tokens.ts`, `tailwind.config.ts`) are
  the only sanctioned places for a literal and are excluded by design.
  `npm run check:design-tokens` enforces the same rule inside the verify run.
- **Safelist control: 5 of 5 with it, 0 of 5 without it.** The pinned scopes
  are authored inside `@layer base`, which Tailwind tree shakes by class name.
  This pair of compiles, with a content file that names no scope class, proves
  the rules survive only because `tailwind.config.ts` safelists the class names
  from `THEME_SCOPE_TOKENS`. Without the safelist the gallery renders five
  panes that all look like the page theme while claiming to be four themes.

## 3. Negative controls (evidence that the checks bite)

| Control                                            | Injected into                                   | Result                                                        |
| -------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------- |
| `bg-[#ff0000] p-[13px]`                            | `app/(dev)/gallery/theme-scope.tsx`             | `check:design-tokens` FAIL, 3 findings; reverted, PASS        |
| `.theme-hc-dark --background` changed to `0 0% 5%` | `styles/globals.css`                            | `check:color-contrast` FAIL (scope drift); reverted, PASS     |
| `.theme-reduced-motion --duration-instant: 1ms`    | `styles/globals.css`                            | `check:design-tokens` FAIL (scope drift); reverted, PASS      |
| `safelist: []`                                     | `tailwind.config.ts`                            | `check:design-tokens` FAIL; reverted, PASS                    |
| `.theme-rogue` rule                                | `styles/globals.css`                            | `check:design-tokens` FAIL (undeclared scope); reverted, PASS |
| composite control drops its field attributes       | `app/(dev)/gallery/demo-form.tsx`               | gallery probe FAIL, 6 findings; reverted, PASS                |
| literal `aria-label`                               | `components/ui/toast.tsx` (recorded at 1.16)    | `check:i18n-strings` FAIL; reverted                           |
| hex colour and raw pixel in a skeleton             | `components/ui/skeleton.tsx` (recorded at 1.16) | `check:design-tokens` FAIL; reverted                          |

## 4. Defects found and fixed while proving this gate

1. **A composite control lost the attributes the field gave it.** Radix
   `Select` is a context provider rather than an element, so `id`,
   `aria-describedby` and `aria-invalid` handed to it were dropped: the label
   rendered `for="field-plan"` while no element carried that id, and the
   combobox was announced with no name. `FormField` now takes either an element
   or a function that receives the field attributes, and the gallery's demo
   form places them on the trigger. Measured: the negative control above fails
   the gallery probe with 6 findings, so the class of defect cannot come back
   unnoticed.
2. **The pinned scopes could silently stop applying.** They are authored in
   `@layer base`, which is tree shaken by class name, so a refactor that moved
   the class names out of a scanned file would have turned all four themes into
   the page theme with no warning. The names now have one owner
   (`THEME_SCOPE_TOKENS` in `config/design-tokens.ts`), the Tailwind safelist is
   built from that list, `check:design-tokens` compares the list with
   the stylesheet in both directions and requires the safelist to derive from
   it, and the gallery's scope list is derived rather than duplicated.
3. **The development-only guard was incomplete.** A layout guard alone is not
   enough: the page segment is still rendered and serialized, so a production
   `GET /gallery` answered 404 while carrying the whole component tree as a
   flight payload (45,947 bytes, scope markers and page content present), and
   Next.js collects a page's metadata without rendering it, so the title
   "Component gallery | KD SOLUTION IT" was in the head of that 404. With the
   guard repeated in the page and no metadata export on the route, the same
   request returns 404 with 5,473 bytes and zero occurrences of
   `data-gallery-scope`, `Component gallery`, `theme-light` or any demo copy.

## 5. Gate result

| Requirement                                   | Result                                                        |
| --------------------------------------------- | ------------------------------------------------------------- |
| Gallery renders every primitive               | PASS: 26 markers, 175 buttons, 100 controls, 45 role controls |
| In light                                      | PASS: `.theme-light` block, rules loaded                      |
| In dark                                       | PASS: `.theme-dark` block, rules loaded                       |
| In high contrast (light and dark)             | PASS: both scopes, rules loaded                               |
| In reduced motion                             | PASS: scope rule + zeroed duration tokens                     |
| Same inventory in every theme                 | PASS: 0 findings                                              |
| Accessible names and label associations       | PASS: 0 issues of 350 interactive elements                    |
| No hardcoded colour or spacing outside tokens | PASS: 0 raw values in 75 files, 0 tokens without CSS          |
| `npm run verify`                              | PASS, 20 of 20 checks                                         |
| Production build                              | PASS: `next build` compiled, 4 of 4 static pages              |
| Dead-link audit                               | PASS: 1 route, 0 verified links (nav-map arrives at 1.22)     |

Segment 1B gate: **passed**.

Not in this gate, by design: Lighthouse at least 90 on the homepage is a
step 1 gate (docs/PLAN/04 section 3) and cannot run yet, because there is no
public page to measure until segments 1C and 1D build the public site and its
states. It is recorded as an open item, not as a pass.
