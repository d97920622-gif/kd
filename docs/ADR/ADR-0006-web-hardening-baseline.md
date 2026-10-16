// path: docs/ADR/ADR-0006-web-hardening-baseline.md

# ADR-0006 -- Web hardening baseline

- Status: Accepted
- Date: 2026-10-16
- Step: 1 (sub-step 1.26)
- Supersedes: none
- Superseded by: none

## Context

The plan asks step 1 for a web hardening baseline: Trusted Types, the three
cooperating headers (COOP, COEP, CORP), Permissions-Policy, Clear-Site-Data on
logout and Subresource Integrity, with a header matrix and this record
(`docs/PLAN/08_SUBSTEP_CHECKLISTS.md` 1.26, `docs/PLAN/05_ADDITIONAL_REQUIREMENTS_SPEC.md`
A13.8). MASTER_PROMPT layer 2 adds clickjacking protection, a nonce-based content
security policy and the sanitizer that XSS prevention is built on, and names
`lib/security/sanitizer.ts` as the implementation.

The build at the start of this sub-step is a Next.js 15 App Router application
with no middleware, no route handlers a browser can call, no third-party scripts,
no third-party stylesheet, no fonts from a CDN and no embeds. It serves its own
chunk graph, its own stylesheet, its own images and two development-only routes.
The next chunk of work that changes that picture is step 3 (authentication, which
adds a session and a sign-out route), step 8 (payments, which will eventually
name a processor origin) and step 5 (an editor, which is the first ingest point
for user-authored rich text).

Two constraints shape the decision more than the list itself:

1. **A static header value cannot carry a per-request nonce.** The nonce part of
   the content security policy has to be built where a request is handled, which
   is `middleware.ts`, and that file belongs to sub-step 1.30. Whatever is
   decided here has to be compatible with something that does not exist yet and
   must not have to be rewritten when it arrives.
2. **A development server is not a deployment.** The platform this repository is
   reviewed in serves the development build over plain HTTP to a preview window.
   Two of the requested headers exist specifically to stop a document from being
   framed, and one exists to enforce HTTPS. Applied in development, the first two
   break the review surface and the third does nothing. An exception is needed,
   and an exception nobody writes down is the kind that quietly becomes permanent
   and wide.

## Decision

**1. The header matrix is data, in `config/security-headers.ts`.**

Every header is one entry with its value, the environment it applies in, the
reason it exists and the failure it prevents. `next.config.js` turns that data
into Next.js's `headers()` shape for `/:path*`; it contains no header value of
its own. `scripts/checks/web-hardening.mjs` reads both halves, so the matrix and
the configuration cannot drift apart.

**2. Eleven headers ship: eight everywhere, three in production only.**

| Header                              | Value                                          | Scope      |
| ----------------------------------- | ---------------------------------------------- | ---------- |
| `X-Content-Type-Options`            | `nosniff`                                      | all        |
| `Referrer-Policy`                   | `strict-origin-when-cross-origin`              | all        |
| `X-DNS-Prefetch-Control`            | `off`                                          | all        |
| `X-Permitted-Cross-Domain-Policies` | `none`                                         | all        |
| `Cross-Origin-Opener-Policy`        | `same-origin`                                  | all        |
| `Cross-Origin-Embedder-Policy`      | `require-corp`                                 | all        |
| `Cross-Origin-Resource-Policy`      | `same-origin`                                  | all        |
| `Permissions-Policy`                | 22 features refused, 4 allowed to `self`       | all        |
| `Content-Security-Policy`           | `frame-ancestors 'none'`                       | production |
| `X-Frame-Options`                   | `DENY`                                         | production |
| `Strict-Transport-Security`         | `max-age=63072000; includeSubDomains; preload` | production |

The three production-only entries are the entire difference between the two
matrices, and the check fails if a fourth appears.

**3. The content security policy starts with the framing refusal, and 1.30
completes it.**

This sub-step sends `Content-Security-Policy: frame-ancestors 'none'` on every
production response and nothing else. Sub-step 1.30 appends the directive set
MASTER_PROMPT layer 2 lists - `default-src 'self'`, `script-src 'self'
'nonce-{random}'`, `style-src 'self' 'nonce-{random}'`, `img-src 'self' https:
data:`, `connect-src 'self' https://api.supabase.co`, `form-action 'self'`,
`base-uri 'self'`, `object-src 'none'`, `upgrade-insecure-requests`,
`block-all-mixed-content` and `require-trusted-types-for 'script'` - in
`middleware.ts`, where the per-request nonce exists.

Two policies on one response are not an error: a browser enforces the
**intersection** of every policy it receives. That is what makes splitting the
work safe. The baseline directive sent from the build configuration cannot be
loosened by anything a later step adds, and it applies to responses that never
reach middleware.

**4. COEP is `require-corp` from the first production request, deliberately.**

`require-corp` means a cross-origin subresource loads only if it opts in with
`Cross-Origin-Resource-Policy` or a CORS grant. The product currently loads
nothing cross-origin, so the header costs nothing today; adopting it now means
the first feature that wants an embedded third-party resource has to make an
explicit, reviewable decision instead of inheriting permission it never asked
for. The segment gate's Lighthouse run and the dead-link audit both exercise the
header on real pages, so an accidental cross-origin load is caught by the build
rather than by a user.

**5. Permissions-Policy refuses by default, and the four exceptions have named
consumers.**

22 features are refused with `()`, including `clipboard-read`: nothing in this
product pastes. `fullscreen`, `clipboard-write`,
`publickey-credentials-create` and `publickey-credentials-get` are allowed to
`self`. The first has a document viewer as its consumer, the second is what the
copy control on a failure report uses, and the last two are what passkey sign-in
in step 3 is built on. A feature that is not on the list is refused, because
`Permissions-Policy` is an allowlist: silence means nothing is permitted, which
is the direction this product wants to fail in. A future Chromium release that
adds a feature therefore adds a refusal, not a grant.

**6. Clear-Site-Data is built here and sent by the sign-out route in step 3, with
a TLS guard.**

`clearSiteDataHeader(requestUrl)` returns `Clear-Site-Data: "cache", "cookies",
"storage"` for a request that arrived over HTTPS and `null` otherwise, because
the specification makes a browser ignore the header on an insecure origin. The
client half is `lib/security/logout.ts`: `logOut()` announces
`kd:logout` before navigating to `/logout`, and `installLogoutClearSignal()` is
the one-line subscription a data-holding hook uses. Step 3 adds the route; the
protocol exists now so the first module that caches anything does not invent its
own.

**7. Trusted Types are enforced structurally, and the directive that turns them
on is 1.30's.**

`lib/security/trusted-types.ts` declares one policy named `kd-solution-it` with
two functions: `createHTML` delegates to the sanitizer, and `createScriptURL`
accepts only a same-origin `http(s)` URL and throws otherwise. `createScript` is
**not** declared, so a sink that would turn a string into script throws rather
than running it. `installSecurityPolicy()` is called once per browser session
from a client component in the root layout. Until
`require-trusted-types-for 'script'` arrives with 1.30, the policy exists and
nothing is enforced; when it arrives, enforcement begins without a call site
changing.

**8. Sanitization is an allowlist, not a blocklist.**

`lib/security/sanitizer.ts` parses markup with an inert `DOMParser`, keeps the
24 elements in `SAFE_ELEMENTS` (with the two attributes `a` may carry), drops
every other element **with its subtree**, removes every attribute whose name is
not listed or that begins with `on`, and refuses any URL whose scheme is not
`http`, `https`, `mailto` or `tel` after stripping the control characters a
browser ignores inside a scheme. `style` attributes and `<style>` elements are
refused outright, which is why nothing has to scrub `expression(`, `@import` or
`url(` out of a declaration. Where no DOM parser exists the function returns an
empty string rather than the input.

**9. Subresource Integrity is adopted for third-party resources, which means it
is currently a rule with no call sites, and the rule is enforced by the check.**

SRI protects a document from a _changed_ resource: the browser refuses a file
whose bytes do not match the hash in the `integrity` attribute. That only has
meaning for a resource the application does not serve, because a first-party
asset is delivered by the same origin, versioned in the same deploy and served
by the same handler as the document that references it - if the origin is
compromised, the `integrity` attribute arrives with the markup that carries it,
and the protection is gone. Next.js also owns its chunk graph: the script tags
are emitted by the framework with build hashes in their names, and hand-written
`integrity` attributes do not survive that pipeline.

So the decision is: **no third-party resource may be loaded without SRI**, and
today the product loads none. `check:web-hardening` enforces the rule
structurally rather than aspirationally - any `<script>` or `<link>` element
written by hand in application code, and any `next/script` or `next/head`
import, fails the check with the message that such a resource needs an
`integrity` attribute with a SHA-384 hash and that the decision belongs in an
ADR. The rule has no exceptions in this sub-step because it has no subjects;
when a processor SDK arrives in step 8 with a real hash and a documented
fallback, it is one entry in that ADR.

## Consequences

**Positive**

- Every response carries the hardening baseline whether or not middleware runs,
  which matters because a request for a cached static asset is the one most
  likely to bypass request-time code.
- The matrix is reviewable as data. Adding a header means adding one entry with
  its reason; the check refuses an entry without one.
- The intersection property means 1.30's policy can be strict without this
  sub-step having to anticipate it, and a mistake in 1.30 can only narrow the
  effective policy, never widen it.
- Under `require-corp` every cross-origin load is a decision with a name
  attached, which is the property a payments product wants and cannot add
  retroactively without an audit.
- Clear-Site-Data and the sign-out signal exist before the first thing that
  caches data does, so the requirement cannot be forgotten by a later step that
  has no reason to know about it.

**Negative and accepted**

- The three production-only headers do not apply to a development server, so a
  reviewer who only ever runs `next dev` never sees them. Accepted: the
  difference is enumerated in the data file, the check prints it, and
  `docs/EVIDENCE/step-01/http-hardening-probe.py` reads all eleven off a
  production server on demand.
- `require-corp` will refuse a future cross-origin embed until it opts in. That
  is the intent, and the cost is one resource-policy decision at that time.
- The permission list is long and will age: browsers add features faster than
  this file is edited. Accepted because the failure mode of an unlisted feature
  is refusal, not permission - the list is documentation of the interesting
  refusals, not the mechanism.
- SRI is a rule with no call sites in step 1. Accepted and stated plainly: an
  integrity attribute on a first-party asset from the same deploy is theatre,
  and claiming coverage for it would be worse than admitting the rule is waiting
  for a subject.
- Trusted Types enforcement is off until 1.30 adds the directive, so for one
  sub-step the policy is declared and not required. Accepted: it is created in
  the same sub-step as the sanitizer it depends on, and the directive is a
  one-line change to a header that belongs to a file that does not exist yet.

## Alternatives considered

**A `middleware.ts` that sets every header now, including the policy with a
nonce.** Rejected because it moves 1.30's deliverable into 1.26 and leaves two
files owning one header - the matrix in the configuration and the completed
policy in middleware - which is exactly the split this ADR avoids. It would also
make the hardening depend on middleware running, and a static asset response is
the case where that is least certain.

**A blocklist sanitizer, as MASTER_PROMPT layer 2 enumerates the threats.**
Rejected: the enumeration describes what must not survive, and there is no way to
guarantee an enumeration is complete. An allowlist of 24 elements with `p`, `a`
and `code` in it is small enough to review, and everything else - including
constructs that do not exist yet - is dropped by default. `FORBIDDEN_ELEMENTS`
is kept as documentation of the interesting refusals and is not what the code
tests against.

**Sanitize with `innerHTML` on a detached element.** Rejected because assigning
markup to a live element parses it as markup _and_ its content can be fetched;
`DOMParser` builds a document that neither runs nor fetches.

**A package such as `dompurify` or `trusted-types`.** Rejected for step 1: the
sanitizer here is about 200 lines and the policy about 150, the exact subset this
product renders is a product decision either way, and a dependency added for a
subset decision would still need this file's allowlist. `check:web-hardening`
asserts the behaviour, and the `lib/security/` boundary means a library can
replace the internals later without a call site changing. This is the same
posture as the animation renderer in ADR-0007-adjacent work in 1.25: the contract
first, the dependency when a surface needs it.

**Send `Clear-Site-Data` unconditionally, including over plain HTTP.**
Rejected: browsers ignore the header on an insecure origin, so sending it there
produces a log line and no effect, and the reviewer who sees it believes a cache
was cleared. Returning null makes the refusal visible.

**Enable `strict-dynamic` in the future policy so a script loader can add
scripts.** Deferred to 1.30, where the policy is assembled, and flagged here
because it is the directive that most weakens `script-src`. If it is adopted it
needs its own line in this ADR's successor.

## Verification

- `scripts/checks/web-hardening.mjs` (the twenty-sixth check) asserts: the
  matrix contains the required headers with the required values; every entry has
  a rationale, a failure mode and a valid environment; the production-only set is
  exactly three named headers; the Permissions-Policy refuses every listed
  feature and allows exactly the four with named consumers to `self`; COOP/COEP/CORP are present with the
  isolation values; `next.config.js` consumes the matrix through
  `securityHeadersFor` for `/:path*` and contains no header value of its own; the
  sanitizer's allowlist, forbidden-element list, URL schemes and parser use; the
  Trusted Types policy name, the declared functions and the absent
  `createScript`; the logout clear signal and the TLS guard; and that no
  hand-written `<script>`/`<link>` element or `next/script` import exists in
  application code without an integrity attribute. Static negative controls and
  rendered controls are recorded with the sub-step's evidence.
- `docs/EVIDENCE/step-01/http-hardening-probe.py` reads the headers off a running
  server: `next dev` must serve exactly eight and `next start` exactly eleven,
  with the three production-only names absent in development and present in
  production.
