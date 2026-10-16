// path: config/security-headers.ts
/**
 * Web hardening baseline: every security header this application sends, in one
 * place, with the reason it is there.
 *
 * The plan asks for cooperating headers (COOP, COEP, CORP), Permissions-Policy,
 * Clear-Site-Data on logout and a Subresource Integrity baseline
 * (docs/PLAN/05_ADDITIONAL_REQUIREMENTS_SPEC.md A13.8, docs/PLAN/08 1.26), and
 * STEP 01 layer 2 of MASTER_PROMPT asks for clickjacking protection and a
 * nonce-based content security policy. A header list spread across a config
 * file, a middleware and a comment in a pull request is a list where the next
 * person changes one copy, and nothing fails.
 *
 * So the matrix is data: one entry per header, each with the environment it
 * applies in, why it is sent, and the failure it prevents. `next.config.js`
 * turns the data into Next.js's `headers()` shape, `scripts/checks/web-hardening.mjs`
 * verifies the data and the consumer, and
 * `docs/EVIDENCE/step-01/http-hardening-probe.py` reads the headers off a
 * running server to prove they arrive.
 *
 * Three rules this file follows:
 *
 *   1. **Deny first.** Every directive names what is refused. Something allowed
 *      by accident is the usual way a header turns out to be decorative, so the
 *      Permissions-Policy below lists the features the product does not use and
 *      refuses them, and the two it does use are narrowed to this origin.
 *   2. **Nothing here needs a per-request nonce.** These are static values, so
 *      they belong in the build configuration where they are applied to every
 *      response without a request-time decision. The content security policy
 *      that *does* need a nonce - script-src and style-src with a per-request
 *      value - is built in middleware.ts in sub-step 1.30, and it adds
 *      directives to the same policy this file starts: a browser enforces the
 *      intersection of every policy it is given, so the baseline below stays
 *      true whatever 1.30 appends.
 *   3. **Development is a deliberate exception, not an oversight.** Three
 *      headers apply in production only, and the check fails if a fourth
 *      appears or one of these three moves. Transport security is meaningless
 *      over the plain HTTP of a development server, and the two framing
 *      directives would block the development server from being reviewed
 *      inside the hosting platform's preview window - which is the one place
 *      this build is meant to be looked at. The exception is recorded here, in
 *      the ADR and in the check, so it cannot be widened silently.
 *
 * The import of this module from `next.config.js` carries the .ts extension for
 * the reason tailwind.config.ts explains: Node strips the types and runs the
 * data, and without the extension the specifier can resolve to something else
 * beside it.
 */

/** Where a header applies: everywhere, or on the deployed HTTPS origin only. */
export type SecurityHeaderEnvironment = 'all' | 'production';

export interface SecurityHeaderRule {
  /** The HTTP header name, spelled exactly as the browser expects it. */
  readonly name: string;
  /** The value sent. Static by design; see rule 2 above. */
  readonly value: string;
  readonly environment: SecurityHeaderEnvironment;
  /** Why this header is sent, in the terms the threat is described in. */
  readonly rationale: string;
  /** What goes wrong when it is missing or wrong. */
  readonly failureMode: string;
}

/**
 * The matrix, in the order the headers are sent.
 *
 * The order is documentation only - HTTP header order carries no meaning - but
 * keeping the two cross-origin isolation headers next to the resource policy
 * they depend on makes the group readable in a response dump.
 */
export const SECURITY_HEADERS: readonly SecurityHeaderRule[] = [
  {
    name: 'X-Content-Type-Options',
    value: 'nosniff',
    environment: 'all',
    rationale:
      'Stops a browser from second-guessing the content type it was sent, which is what turns an uploaded file served from a wrong path into a script.',
    failureMode:
      'Without it a response that a browser decides is HTML can run as HTML even though the server called it text or an image.',
  },
  {
    name: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
    environment: 'all',
    rationale:
      'A URL from this product can carry a client reference or an invoice number. This policy sends no path at all to another origin and the full URL only to this one.',
    failureMode:
      'The browser default leaks full internal URLs to every site a user navigates to next.',
  },
  {
    name: 'X-DNS-Prefetch-Control',
    value: 'off',
    environment: 'all',
    rationale:
      'Nothing in this product is loaded from a third-party origin, so there is no hostname worth resolving ahead of time and no reason to tell one.',
    failureMode:
      'A speculative DNS lookup tells a third party which pages a reader is about to open, before they open them.',
  },
  {
    name: 'X-Permitted-Cross-Domain-Policies',
    value: 'none',
    environment: 'all',
    rationale:
      'Refuses the cross-domain policy files that old plugin hosts would otherwise look for beside a document.',
    failureMode: 'A permissive policy lets a plugin load this origin as data from somewhere else.',
  },
  {
    name: 'Cross-Origin-Opener-Policy',
    value: 'same-origin',
    environment: 'all',
    rationale:
      'Puts a document in its own browsing context group, so a page that opened this one holds no reference to it and cannot navigate it or read it back.',
    failureMode:
      'A window opened from this origin keeps a live handle on it, which is the shape of both tab hijacking and the side-channel attacks the header class is named after.',
  },
  {
    name: 'Cross-Origin-Embedder-Policy',
    value: 'require-corp',
    environment: 'all',
    rationale:
      'Requires every subresource of a document to be same-origin, or to carry a resource policy or a CORS grant that opts in. This product serves all of its own assets and embeds nothing from anywhere else.',
    failureMode:
      'Without it a document can be made to load a resource whose response gives away information to the document that embedded it.',
  },
  {
    name: 'Cross-Origin-Resource-Policy',
    value: 'same-origin',
    environment: 'all',
    rationale:
      'The other half of the pair above: this origin may not be loaded as a subresource by another site, whatever kind of resource it is.',
    failureMode:
      'An image, a font or a script from this origin becomes loadable by any page on the web, which leaks both content and timing.',
  },
  {
    name: 'Permissions-Policy',
    value:
      'accelerometer=(), ambient-light-sensor=(), autoplay=(), camera=(), clipboard-read=(), clipboard-write=(self), display-capture=(), encrypted-media=(), fullscreen=(self), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(), publickey-credentials-create=(self), publickey-credentials-get=(self), screen-wake-lock=(), serial=(), speaker-selection=(), usb=(), xr-spatial-tracking=()',
    environment: 'all',
    rationale:
      'A device capability is refused unless the product has a use for it: the four that are allowed are narrowed to this origin and each has a named consumer - fullscreen for a document view, the two public key credential features for passkey sign-in in step 3, and clipboard write for the copy control on a failure report. Reading the clipboard is refused, since nothing in the product pastes. Everything else, from the camera to the payment request interface, is refused before a script can ask.',
    failureMode:
      'An unlisted capability is available to any script on the page, so a single compromised dependency can ask for the camera, the microphone or the location without the product ever having decided it wanted them.',
  },
  {
    name: 'Content-Security-Policy',
    value: "frame-ancestors 'none'",
    environment: 'production',
    rationale:
      'The modern half of the clickjacking pair in MASTER_PROMPT layer 2, and the one a browser that ignores X-Frame-Options still obeys. This row states what the deployed origin must carry: sub-step 1.30 composes the full policy per request in middleware.ts, adds script-src and style-src with a nonce, and sends that composed policy in development as well, where the framing refusal below is left out so a development build can be reviewed inside a hosting preview window - the one difference the development relaxation list names. Because a browser enforces the intersection of every policy it receives, nothing the middleware adds can loosen it.',
    failureMode:
      'Without it a hostile page can frame the product whole and overlay controls on it, which is how a user is talked into approving a payment they never saw.',
  },
  {
    name: 'X-Frame-Options',
    value: 'DENY',
    environment: 'production',
    rationale:
      'The older half of the same pair, kept because a browser built before frame-ancestors still reads only this one.',
    failureMode:
      'The product renders inside a frame on another site, where its own click targets are not the ones the reader believes they are pressing.',
  },
  {
    name: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
    environment: 'production',
    rationale:
      'Two years of enforced HTTPS with no downgrade window, for this origin and its subdomains, submitted for the browser preload list.',
    failureMode:
      'A first request over plain HTTP can be answered by anyone on the path, and every later request is only as protected as that first one was.',
  },
];

/**
 * The route pattern the matrix is attached to: every response the application
 * serves, assets included. A header that covers documents but not the files
 * they load is a header with a hole in it.
 */
export const SECURITY_HEADER_SOURCE = '/:path*';

/**
 * The matrix for one environment, in the shape Next.js `headers()` wants.
 *
 * `'production'` is passed for the deployed build and `'development'` for a
 * development server or a preview, so the three production-only entries are the
 * only difference between the two responses.
 */
export function securityHeadersFor(
  environment: 'development' | 'production',
): readonly { readonly key: string; readonly value: string }[] {
  return SECURITY_HEADERS.filter(
    (header) => header.environment === 'all' || environment === 'production',
  ).map((header) => ({ key: header.name, value: header.value }));
}
