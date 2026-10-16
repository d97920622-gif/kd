// path: lib/security/content-security-policy.ts
/**
 * The content security policy that needs a nonce, built where the request is.
 *
 * The header matrix in `config/security-headers.ts` holds every header whose
 * value is static. This module holds the one header that cannot be: a content
 * security policy for `script-src` and `style-src` has to name a value that is
 * different on every response, because the value is what tells the browser
 * "this inline script is the one the server just wrote into the document, not
 * one that arrived with the page". A nonce that repeats is not a nonce.
 *
 * Two policies, and why they differ by exactly two tokens:
 *
 *   1. **Production.** Scripts run from this origin or carry the nonce; there
 *      is no `unsafe-inline` and no `unsafe-eval` anywhere in it. Every inline
 *      script Next.js writes into the document - the flight payload that
 *      hydrates the page - carries the nonce, which is how a document with
 *      inline scripts can be served under a policy that forbids them.
 *      `'strict-dynamic'` is what makes that work for the scripts Next loads
 *      from those: it hands trust to the scripts already running rather than
 *      to a list of paths that would have to be maintained by hand.
 *   2. **Development.** Two relaxations, both named and both about the
 *      development server rather than the product: React Refresh compiles and
 *      evaluates modules at runtime, which needs `'unsafe-eval'`, and
 *      `next dev` writes inline styles for its error overlay and its style
 *      injection, which needs `'unsafe-inline'` in `style-src`. The same
 *      three framing and transport rules the header matrix keeps out of
 *      development stay out here for the same reason: a preview inside the
 *      hosting platform is a document in a frame, and the platform is the one
 *      place this build is meant to be looked at.
 *
 * A browser enforces the intersection of every policy it is sent, so the
 * `frame-ancestors` refusal from the header matrix and the one below cannot
 * loosen each other: whichever is stricter wins. That is why the matrix keeps
 * its row - it states what the deployed origin must carry - while the composed
 * policy, which is what a browser actually receives, is built here for both
 * environments.
 *
 * Nothing in this module touches the environment or a clock, which is what lets
 * `scripts/checks/platform-plumbing.mjs` read it and assert what each
 * environment's policy contains without starting anything.
 */

/** Where a policy is being built. The same two values the header matrix uses. */
export type CspEnvironment = 'development' | 'production';

export interface ContentSecurityPolicyOptions {
  /** The per-request nonce, without the `'nonce-` wrapper. */
  readonly nonce: string;
  readonly environment: CspEnvironment;
}

/** Request header a document may read the nonce from, for its own scripts. */
export const CSP_NONCE_HEADER = 'x-nonce';

/**
 * The directives only the deployed origin carries.
 *
 * Both are deployment-only for the same reason the header matrix already
 * records: `frame-ancestors 'none'` would refuse the hosting preview window
 * that a development build is reviewed inside, and `upgrade-insecure-requests`
 * would rewrite development requests to a scheme nothing is listening on. The
 * two absences are named in `DEVELOPMENT_RELAXATIONS` below, so the list of
 * differences is complete rather than the list of differences someone happened
 * to think of.
 */
const PRODUCTION_DIRECTIVES: readonly string[] = [
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
];

/**
 * The development relaxations, and nothing else.
 *
 * Every difference between the two policies is a line here and every line names
 * the directive it relaxes. Anything not listed is identical in both
 * environments, which is the property that makes this list worth reading: a
 * policy that quietly differs in development is a policy nobody has reviewed.
 *
 * Exported so the check can assert the set rather than parse for the absence of
 * a token: a relaxation that is added without being named here is a relaxation
 * nobody reviewed.
 */
export const DEVELOPMENT_RELAXATIONS: readonly string[] = [
  'frame-ancestors allows the hosting preview window to frame a development build',
  "script-src allows 'unsafe-eval' for React Refresh",
  "style-src allows 'unsafe-inline' for the development style injection",
  "connect-src allows websockets for the development server's live reload",
  "worker-src allows blobs for the development server's compile worker",
];

/**
 * A fresh nonce: 128 random bits, base64url, no padding.
 *
 * Base64url rather than the plain alphabet because the value is embedded in a
 * header, where `+` and `/` are fine but `=` invites a quoting mistake; and the
 * CSP grammar accepts the URL-safe characters. `crypto.getRandomValues` is the
 * platform's own source of randomness and exists in the runtime middleware runs
 * in, which is why this file imports nothing.
 */
export function newCspNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

/**
 * The policy for one response.
 *
 * The nonce appears in `script-src` and in `style-src`: Next.js stamps its own
 * scripts, and a stylesheet the application inlines carries it too. `'self'`
 * stays beside the nonce rather than being replaced by it, because a browser
 * that does not understand `'strict-dynamic'` falls back to the origin list,
 * and that fallback has to be the safe one.
 */
export function contentSecurityPolicy(options: ContentSecurityPolicyOptions): string {
  const nonceSource = `'nonce-${options.nonce}'`;
  const development = options.environment === 'development';
  const scriptDirectives = development
    ? [`script-src 'self' ${nonceSource} 'unsafe-eval' 'strict-dynamic'`]
    : [`script-src 'self' ${nonceSource} 'strict-dynamic'`];
  const styleDirectives = development
    ? [`style-src 'self' ${nonceSource} 'unsafe-inline'`]
    : [`style-src 'self' ${nonceSource}`];
  const connectionDirective = development ? "connect-src 'self' ws: wss:" : "connect-src 'self'";
  const workerDirective = development ? "worker-src 'self' blob:" : "worker-src 'self'";
  // The order is the order a person reads a policy in: what runs, what is
  // drawn, what is reached, and then the refusals.
  const directives = [
    "default-src 'self'",
    ...scriptDirectives,
    ...styleDirectives,
    "img-src 'self'",
    "font-src 'self'",
    "manifest-src 'self'",
    connectionDirective,
    workerDirective,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-src 'none'",
    "media-src 'none'",
    ...(development ? [] : PRODUCTION_DIRECTIVES),
  ];
  return directives.join('; ');
}
