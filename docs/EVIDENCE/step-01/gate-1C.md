// path: docs/EVIDENCE/step-01/gate-1C.md

# Segment 1C gate evidence

Gate statement, from docs/PLAN/08_SUBSTEP_CHECKLISTS.md:

> Segment gate: navigation renders correctly for every role; dead-link check
> passes on the current route set.

Date: 2026-10-16. Branch: `arena/b7780282-kd`, frozen at commit `319e75d`.
Sub-steps covered: 1.18 to 1.23.
Evidence rules followed: docs/PLAN/04_DEFINITION_OF_DONE_AND_GATES.md section 4
(command output, reproducible, no screenshots).

## How to reproduce

```sh
npx next dev -H 0.0.0.0 -p 3000          # terminal 1
python3 docs/EVIDENCE/step-01/shell-probe.py
node scripts/checks/dead-links.mjs
npm run verify
```

Then stop the development server before building. `next build` and `next dev`
share the `.next` directory, so a build started while the development server is
running leaves it serving a stale client manifest.

```sh
npx next build                           # with the development server stopped
npx next start -p 3020 -H 0.0.0.0        # after the build
```

## 1. Half one: navigation renders correctly for every role

Three measurements, none of them a screenshot: the shells are rendered once per
role by the specimen page, the navigation each reader is offered is printed by
the map through the page, and the surfaces themselves are read out of the
response.

### 1.1 Every role is framed by the shell its role model calls for

`python3 docs/EVIDENCE/step-01/shell-probe.py`, "role-aware framing":

```
  role          shell           band  notice  nav
  owner         dashboard       no    no      yes
  staff         dashboard       no    yes     yes
  super_admin   admin           yes   no      yes
  ceo           admin           yes   yes     yes
  admin_staff   admin           yes   yes     yes
  client        client-portal   no    no      no
  unresolved    dashboard       no    no      no
```

The public and auth shells serve a reader who has not been recognised and carry
no role, so they are measured by their landmarks and print markers rather than
by this table. The client portal is a document, not a workspace: it is the one
frame that calls for no navigation, and it renders none.

### 1.2 Every reader is offered exactly what the map offers that reader

The specimen renders the map's answer for twelve audience-and-role pairs. The
table is the page's own output, read back out of the response, so the numbers
are not restated by this document:

| Reader                   | Live entries offered             | Planned modules |
| ------------------------ | -------------------------------- | --------------- |
| public / no session      | Keyboard shortcuts               | 10              |
| public / client          | Keyboard shortcuts               | 10              |
| workspace / owner        | none                             | 15              |
| workspace / staff        | none                             | 13              |
| workspace / client       | none                             | 0               |
| platform / super_admin   | none                             | 8               |
| platform / ceo           | none                             | 8               |
| platform / admin_staff   | none                             | 8               |
| platform / owner         | none                             | 0               |
| client / client          | none                             | 4               |
| client / staff           | none                             | 0               |
| development / no session | Layout shells, Component gallery | 0               |

Four statements this table makes, and the probe checks all four:

- **A role is offered its own audience and no other.** An owner asking the
  platform console gets nothing, a client asking the workspace gets nothing,
  and staff asking the client portal get nothing. The filter is fail-closed: no
  role means no role-gated entry.
- **The role split inside an audience holds.** The workspace owner is offered
  15 modules and the owner's staff 13; both platform lists are identical because
  the console is the same console at three levels of authority, and the
  difference between them is what an action needs before it takes effect, which
  the shell states as a notice rather than by hiding a page.
- **Public is public.** The public audience offers the same single live
  destination to a reader with no session and to a signed-in client, because a
  public page that required a session would not be public.
- **Nothing planned is rendered anywhere.** Thirty-seven planned labels are read
  out of the page's own map table and none of them appears inside a navigation
  landmark in the response; a planned entry carries no href at all, so it cannot
  be rendered as a link, a heading or a disabled control.

### 1.3 The surfaces themselves

`python3 docs/EVIDENCE/step-01/shell-probe.py`, "navigation surfaces":

```
  sidebar             ok
  bottom-navigation   ok
  breadcrumbs         ok
  site-footer         ok
  sticky-action-bar   ok
  top bar             ok
  planned entries     ok (37 planned labels, none inside a navigation landmark)
  drop box            ok (no landmark, no anchor)
  offline banner      ok (absent while online)
```

Each surface is checked against the same five things, per element: a named
landmark, at least one readable entry label, exactly one entry claiming
`aria-current="page"` and never two, a 44 pixel touch target on every entry, and
the device inset on every pinned bar. The bottom bar renders two entries in the
specimen and is capped at five in the map. The trails are checked in all three
of their cases: a registered path (one item, not a link, claiming the current
page), a path below a registered entry (the ancestor as a link, no current
claim) and a path the map has never heard of (no trail at all).

The drop box is the gate's own negative control for the empty case: a rail asked
for by an audience the map has nothing live for renders **no landmark and no
anchor**, which is the correct shape, because a landmark whose content renders
nothing is a region a screen reader announces and nobody can use. Both wired
layouts gate the slot on a non-empty menu for the same reason.

The command surface that 1.23 adds is the map's third reader and is measured the
same way: the palette's list for the development audience is exactly
`specimen-shells, specimen-gallery, palette.open, main.focus`, the list for the
public audience exactly `shortcuts, palette.open, main.focus`, each with one
active row and one current row, neither able to reach the other audience's page.

## 2. Half two: the dead-link check on the current route set

```
$ node scripts/checks/dead-links.mjs
check:dead-links PASS (3 routes, 3 verified links, 0 dynamic links skipped)
exit code: 0
```

The route set is the tree, not a list:

```
$ find app -name "page.tsx" | sed 's#^app/##; s#/page.tsx$##' | sed -E 's/\([^)]*\)//g'
/gallery
/shells
/shortcuts
```

Three routes, three links, nothing skipped. `check:dead-links` reads the map's
literals as its link source and the app tree as its route inventory, so an entry
that publishes a destination with no page behind it fails the check, and a page
that no entry publishes fails `check:nav-map` instead. The map's published
destinations, as the rendered page prints them:

```
Published destinations: /shortcuts, /shells, /gallery
```

Two moments in this segment, both recorded because they are the gate working:

1. **1.21.** The specimen's sample link pointed at `/` while there was no
   homepage, and the check failed with `dead-link /`. The link was repointed at
   the two routes this build serves rather than the check being relaxed, and
   `/shortcuts` inherited the same discipline in 1.23: the page and its live map
   entry landed in one commit.
2. **1.23.** `/shortcuts` flipped from planned to live in the commit that added
   the page, so the route count and the verified-link count rose together - 2
   routes and 2 links before it, 3 and 3 after it.

The development routes are held to the same rule: they are registered in the
development block of the map, and `check:nav-map` fails a development route that
appears in no block and a development-audience query made outside `app/(dev)/`.

## 3. Negative controls

The gate rests on checks and a probe, so the controls that prove they bite are
part of the evidence. Every control below was applied, required to fail with the
message the rule promises, and reverted.

- **1.21**: eight probe controls - no entry current, two entries current, the
  reserved entry rendered, the pinned bar's inset removed, a rail link losing its
  target, the footer's legal line losing its parameter, the drawer trigger losing
  its name, and the offline banner rendering for an online reader.
- **1.22**: twenty-three check controls and four probe controls - a planned entry
  carrying an href, an unknown label key, a duplicate id, an unknown role, a
  gated module with no roles, a missing audience block, six primary entries, an
  unknown parent, a duplicate destination, an unregistered route, an unexported
  function, an href written into a layout, a component filtering by role, the
  development audience in a product module, `ownsLandmark={false}` in the
  specimen, one surface wired and not the other, a layout whose gate is not the
  map, a layout asking the wrong audience, a surface importing the map, an empty
  rail that no longer drops itself, a registered trail rendered as a link, a
  trail drawn for an unknown path, a planned label inside a navigation landmark,
  a reader row filtered by the wrong role, and - on the page - two entries
  claiming the current page, a planned label as an entry name, the offline banner
  rendering while online, and an entry with no readable name.
- **1.23**: fifteen controls - eleven against the check (the palette losing
  `aria-activedescendant`, a focusable option, a `ctrl+k` chord, two commands on
  one chord, a shortcut to a planned page, a chord spelled outside the registry,
  a listener that ignores text fields, a matcher that demands shift for `?`, a
  reference page that stops reading the registry, a fourth `.focus()` call, and
  the immunity control that requires a chord named only in a comment to pass),
  and four against the rendered page (rows that stop marking the current page,
  the public list built for the wrong audience, a trigger that stops advertising
  its chord, and a reference page that loses its table marker).

## 4. Defects found and fixed while proving this gate

Each was found by an evidence run, not by reading the code, which is the
argument for running the evidence.

1. **A live 500 on a product shell (1.21).** `site-footer.tsx` passed
   `{ count: year }` to a template whose placeholder is `year`. The string layer
   is strict and throws rather than rendering braces, so the footer took the page
   down on every route that mounted it. Fixed at the call site; the probe now
   checks the legal line's copy, so the class of defect is measured rather than
   trusted.
2. **Touch targets on the wrapper, not the control (1.21).** The breadcrumb
   anchors were 44 pixels tall only on their list item: the class sat on the
   wrapper, so the anchor itself was shorter than the minimum. The class moved to
   the element that receives the pointer, and `check:layout-shells` now requires
   the touch class on each anchor.
3. **A dead link to a page that did not exist (1.21).** The specimen linked `/`;
   the check failed it. Repointed at the routes this build serves.
4. **Two nested navigation landmarks (1.22).** The shell's sidebar and bottom-bar
   slots declare the landmark, and the surfaces declared their own, so a screen
   reader was offered a navigation region inside a navigation region with the
   same content. `ownsLandmark` now carries that decision, the wiring passes
   false where the frame owns it, and the check fails `ownsLandmark={false}`
   anywhere else.
5. **An empty rail that announced itself (1.22).** A rail with no entries and no
   header is a landmark a reader has to walk into to find empty. `SidebarNav` now
   renders nothing in that case, and both wired layouts ask the map first.
6. **A second role filter (1.22).** The role filter leaked into the navigation
   wiring, which would have been a second answer to who may be offered what. The
   ban is global over `app`, `components` and `lib`, and the map is the only
   filter.
7. **An audit rule that could be satisfied by the wrong element (1.22).** The
   `ownsLandmark` rule matched a fixed-width window, so one surface's attribute
   could satisfy it for another. Rules now match the element's own opening tag.
8. **An audit rule scoped too narrowly (1.22).** The destination rule was scoped
   to the navigation chrome and missed the wiring module. Both are read now.
9. **A probe that credited one list with another's rows (1.23).** The first
   version of the command-surface section matched attributes inside a block that
   the next block also matched. Every option is now read from its own opening
   tag, and the two lists exist to be told apart.
10. **An audit parser that found no rows (1.23).** The registry check matched
    nothing and reported a pass it had not earned. The row pattern was rewritten
    against the formatted file, and the declaration count is now reported in the
    check's own summary line (`3 commands on 2 chords`), so a rule that silently
    stops matching is visible in `npm run verify`.

## 5. Gate result

`npm run verify` at `319e75d`:

```

== KD SOLUTION IT verify ==
branch arena/b7780282-kd at 319e75d
PASS typecheck                completed with no output (  7.1s)
PASS lint                     completed with no output (  5.0s)
PASS format:check             All matched files use Prettier code style! (  5.2s)
PASS env:validate             env:validate PASS (NODE_ENV=development) (  0.5s)
PASS tokens:export            tokens:export PASS (config/design-tokens.json is current: 12 groups, 25486 bytes) (  0.4s)
PASS check:english-only       check:english-only PASS (217 text files scanned, 1 documented exemption) (  0.1s)
PASS check:no-todo            check:no-todo PASS (179 text files scanned) (  0.0s)
PASS check:no-coming-soon     check:no-coming-soon PASS (179 text files scanned) (  0.1s)
PASS check:no-tests           check:no-tests PASS (224 tracked files inspected) (  0.0s)
PASS check:path-comment       check:path-comment PASS (206 source files carry a valid path comment) (  0.1s)
PASS check:i18n-strings       check:i18n-strings PASS (63 JSX files checked for literal copy, 10 catalogue namespaces with 422 keys validated) (  0.6s)
PASS check:design-tokens      check:design-tokens PASS (151 source files scanned, 488 class lists checked, spacing/radius/shadow/z-index/typography/motion scales wired from config/design-tokens.ts with reduced motion and forced colors verified) (  1.1s)
PASS check:color-contrast     check:color-contrast PASS (4 themes, 23 color roles, 76 contrast ratios verified against WCAG 2.1 AA, paper palette 4 tokens and 3 ratios verified) (  0.5s)
PASS check:no-console         check:no-console PASS (153 source files scanned) (  0.1s)
PASS check:forbidden-brands   check:forbidden-brands PASS (179 text files scanned) (  0.1s)
PASS check:migration-pairs    check:migration-pairs PASS (no migrations yet: nothing to pair) (  0.0s)
PASS check:dead-links         check:dead-links PASS (3 routes, 3 verified links, 0 dynamic links skipped) (  0.0s)
PASS check:secrets            check:secrets PASS (217 text files scanned) (  0.1s)
PASS check:any-types          check:any-types PASS (130 TypeScript files scanned) (  0.1s)
PASS check:money-math         check:money-math PASS (153 script files scanned) (  0.1s)
PASS check:brand-assets       check:brand-assets PASS (9 assets current (mark in light and dark, plate icon, favicon pack 16/32/48, apple touch icon 180, PWA icons 192 and 512, maskable 512), palette-only colours, centring and 16 pixel legibility verified, default social image rendered and measured at the network crop size) (  2.3s)
PASS check:layout-shells      check:layout-shells PASS (5 shells and 5 route-group layouts verified (skip link first, one landmark per page, id shared with the landmark), 6 roles framed through one seam with no privileged default, 9 navigation surfaces verified (named landmarks, one owner of the current page, 44 pixel targets, device inset on pinned bars, drawer state owned in the component), print base verified against config/design-tokens.ts) (  0.6s)
PASS check:nav-map            check:nav-map PASS (config/nav-map.ts verified: 6 roles filtered, one audience per surface, no destination outside the map, wiring gated on a non-empty menu, 3 commands on 2 chords) (  0.6s)
RESULT: PASS (23 of 23 checks passed)
exit code: 0
```

Rendered evidence: `python3 docs/EVIDENCE/step-01/shell-probe.py` ->
`findings: 0`, `RESULT: PASS`, against the same tree
(`/shells` 200 / 348,861 bytes, `/gallery` 200 / 492,770 bytes, `/shortcuts` 200 /
36,088 bytes).

Production: `npx next build` OK, 9 static pages (`/shortcuts` 675 B and 140 kB
first load, `/shells` 6.2 kB, `/gallery` 80.7 kB). With `next start` on port
3020:

```
/               404  7320 bytes   specimen markers: 0
/shells         404  6217 bytes   specimen markers: 0
/gallery        404  6220 bytes   specimen markers: 0
/shortcuts      200 18490 bytes   specimen markers: 0 (the page renders the public shell)
/dashboard      404  7320 bytes   specimen markers: 0
/admin          404  7320 bytes   specimen markers: 0
/client-portal  404  7320 bytes   specimen markers: 0
```

`/shortcuts` is the first public page of the product and answers 200 in
production with one `data-shell="public"` marker and none of the specimen's
(`data-specimen`, `data-command-set`, `data-nav-reader`, `data-nav-landmark`,
`data-trail`: 0 occurrences each). Everything development-only answers 404 and
carries no trace of what it would have rendered.

| Requirement                                          | Result | Evidence                                                                            |
| ---------------------------------------------------- | ------ | ----------------------------------------------------------------------------------- |
| Navigation renders correctly for every role          | PASS   | 6 roles framed by the right shell; 12 reader rows; 9 surfaces; 0 findings           |
| Every role offered only its own audience             | PASS   | owner 15 / staff 13 / client 0; platform roles 8; client portal 4; cross-audience 0 |
| No planned entry reaches any surface                 | PASS   | 37 planned labels, none inside a navigation landmark                                |
| The empty navigation case renders no landmark        | PASS   | drop box: 0 landmarks, 0 anchors; both wired layouts gate on a non-empty menu       |
| Dead-link check passes on the current route set      | PASS   | 3 routes, 3 verified links, 0 dynamic, exit code 0                                  |
| Destination hygiene (one source, no chrome literals) | PASS   | check:nav-map: no destination outside the map                                       |
| `npm run verify` fully green                         | PASS   | 23 of 23 checks, exit code 0                                                        |
| Production build                                     | PASS   | 9 static pages; development routes 404 with no trace                                |

Segment 1C gate: **passed**.

Not in this gate, by design:

- **No browser dependency exists in this build.** Focus traps, computed styles
  at 320 pixels and keyboard traversal are verified in source and in rendered
  attributes, never by pressing a key or laying out a page. The drawer's panel
  mounts into a portal, so it is measured by its trigger and verified by
  `check:layout-shells`; the palette's chord matching and active-descendant walk
  are verified the same way. A browser-dependent probe belongs to the step that
  introduces one.
- **Lighthouse at least 90 on the homepage** remains a step 1 gate and cannot
  run yet: there is no homepage until segment 1D builds the public site. It is
  carried as an open item, not as a pass.
- **The typed `/api/health` response** is a step 1 gate owed by a later segment.
