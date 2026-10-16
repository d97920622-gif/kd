// path: docs/ADR/ADR-0005-route-group-taxonomy-and-async-boundaries.md

# ADR-0005 -- Route-group taxonomy and the async boundaries

- Status: Accepted
- Date: 2026-10-17
- Step: 1 (decided in sub-steps 1.19 to 1.23 and 1.30, recorded in sub-step 1.32)
- Supersedes: none
- Superseded by: none

## Context

The mandated structure in MASTER_PROMPT paints the application surface in broad
strokes: `app/(public)/`, `app/(auth)/`, `app/(dashboard)/`, `app/(admin)/` and
the API tree, with `components/layout/`, `components/ui/`, `components/shared/`
and `config/` beside it. What it does not say is what the parenthesis means in
practice, and the answer decides four things at once: which shell wraps a page,
whether the page is a Server or a Client Component, what a navigation entry is
allowed to point at, and whether the page can be static.

Step 1 lands the shells (1.19 and 1.20) and the navigation surface (1.21 to
1.23), and sub-step 1.30 adds the request-time security boundary, which is where
the last of those four questions became urgent: a document that carries a
per-request nonce cannot be prerendered, so the layouts that wrap renderable
pages must be rendered per request while the pages that carry no nonce stay
static. The two facts - a route group is an audience, and an async boundary is a
purpose - had to be written down together, because a rule about one of them read
alone produces the wrong answer for the other.

## Decision

**A route group is an audience, not a URL segment.** `app/(public)/`,
`app/(auth)/`, `app/(dashboard)/`, `app/(admin)/` and `app/(dev)/` name who the
route is for; the path a reader sees is the route below the group, so
`app/(public)/pricing/page.tsx` answers `/pricing`. Five groups exist: four
audiences and one development-only surface. A group owns exactly one layout, and
that layout is the only place the audience's chrome is composed.

**The public surface is server-rendered and static.** Every page under
`app/(public)/` is a Server Component with a `metadata` export composed through
`lib/seo/metadata.ts`, so a title, a description, a canonical URL and the social
image are decided once and cannot disagree between two pages. The twelve public
pages plus the 404, the route error page and the offline page are the inventory
`check:public-site` verifies.

**Role-aware chrome takes data, never a session.** The dashboard, admin and
client-portal shells (1.20) accept the navigation entries, the role and the
account for the current reader as props and render one frame per role through one
seam. Authentication and the role store are step 3 and step 4, so a shell that
read a session would be a shell that cannot be rendered, gated or reviewed in step
1 - and a privileged default is exactly the defect the 1.20 gate found and fixed.
The rule stands: no shell decides who the reader is.

**Navigation is one destination source, and it is not importable from the
shells.** `config/nav-map.ts` is the only declaration of a destination; the
breadcrumb generator, the palette and the footer read it, and
`components/layout/` may not import it - the entries arrive as props. That is
what makes "navigation renders correctly for every role" a property of a data
structure rather than of five components, and it is why the dead-link check can
audit the map as data.

**A route that carries a nonce is dynamic; a route that does not is static.**
`app/layout.tsx` declares `force-dynamic` because the nonce in the content
security policy is minted per request in `middleware.ts` and the stylesheet link
and script tags of a document must carry it. The file routes that hold no nonce
are explicit about it: `app/robots.ts`, `app/sitemap.ts` and
`app/opengraph-image.tsx` each declare `force-static`, `next.config.js` keeps
`cacheComponents` off, and the production build is verified to report zero
dynamicIO diagnostics. A page below a dynamic layout is still free to be static
itself; what it may not do is read a request value.

**Development-only surfaces say so in the layout.** `app/(dev)/` guards with
`isDevelopment()` and calls `notFound()` outside development, so the component
gallery answers 404 in a production deployment and cannot be read as a component
inventory. The guard lives in the layout because a page cannot be forgotten if
the shell refuses to render it.

## Consequences

- Adding an audience is adding a group with a layout and a nav audience, and the
  four questions (shell, rendering, destinations, statics) are answered by the
  group's own rules rather than by a convention someone remembers.
- Pages do not decide their own chrome. A page that needs a different frame is
  evidence that it belongs to a different audience, which is the cheapest
  possible moment to notice.
- The dynamic root layout is a real cost: every HTML document is rendered per
  request. It is accepted because it is what the nonce requires, and it is bounded
  by `force-static` on the three file routes and a build that reports zero
  dynamicIO diagnostics.
- A new public page needs a `metadata` export, one `h1`, no skipped heading level
  and copy that states nothing this build cannot evidence, or the public-site
  check fails. That is the intended shape of the constraint, not an obstacle: the
  check is the reason the copy could be audited at all before launch.
- The props rule means a later step wires the session into the shells in one
  place - the group layout that already owns the composition - instead of in
  every shell.

## Alternatives considered

- **One flat `app/` with per-page layouts.** The App Router allows it, the URL
  space is identical, and an audience boundary stops being a boundary: any page
  can be wrapped by any shell, and a role-aware rule has nowhere to live.
  Rejected.
- **A client-side navigation layer** (a provider that reads the route and
  decides the frame). It would make every shell a Client Component and hand the
  nav map to the browser. Rejected; the shells render on the server, with
  navigation data as props.
- **Static documents with a header-only content security policy** (no nonce).
  A static page under `output: export` cannot carry a per-request nonce at all,
  and the header-only policy would have to allow the inline bootstrap Next emits.
  Rejected in 1.30, and the settlement is recorded there: the document is
  dynamic on purpose.
- **`force-dynamic` on every route.** Simple, uniform, and it gives up static
  generation for the sitemap, the robots file and the social image, which are
  exactly the responses a crawler wants cached. Rejected in favour of naming the
  three.
- **Roles read from a cookie in the shell.** No authentication exists yet, so it
  would be a fabricated session in step 1. Rejected; the seam takes the role as
  data.

## Verification

- `check:layout-shells`: 5 shells and 5 route-group layouts verified (skip link
  first, one landmark per page, id shared with the landmark), 6 roles framed
  through one seam with no privileged default, 10 navigation surfaces verified.
- `check:nav-map`: `config/nav-map.ts` with 6 roles filtered, one audience per
  surface, no destination outside the map, wiring gated on a non-empty menu.
- `check:platform-plumbing`: 6 public sections decided once each in
  `lib/seo/sitemap.ts`, 13 published destinations, the metadata baseline composed
  once for every page, and documents rendered per request so the nonce reaches
  the scripts; the platform probe confirms the sitemap's 12 locations answer 200.
- `check:public-site`: 12 public pages and 11 namespaces verified as Server
  Components with catalogue metadata, one `h1`, no skipped heading level; 12
  distinct titles between 20 and 70 characters.
- The production build is verified to emit zero dynamicIO diagnostics with
  `force-static` on `app/robots.ts`, `app/sitemap.ts` and
  `app/opengraph-image.tsx` and `cacheComponents` off in `next.config.js`.
