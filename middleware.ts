// path: middleware.ts
import { type NextRequest, NextResponse } from 'next/server';

import {
  CSP_NONCE_HEADER,
  contentSecurityPolicy,
  type CspEnvironment,
  newCspNonce,
} from '@/lib/security/content-security-policy';

/**
 * The one request-time decision this application makes before a route runs.
 *
 * Scope of sub-step 1.30, and why the file is thin: the static half of the
 * hardening baseline lives in `config/security-headers.ts`, where it is data
 * that can be reviewed, diffed and asserted without a server. What is left for
 * middleware is the only header that cannot be static - the content security
 * policy that names a per-request nonce - plus the one thing middleware is
 * genuinely good at: refusing before the route does any work.
 *
 * Three decisions:
 *
 *   1. **The nonce is generated inside the handler.** A nonce is only a nonce
 *      if it is different on every response: one generated at module scope is
 *      a constant with a random-looking value, which is exactly the shape of a
 *      policy that looks strict and protects nothing. The call below runs once
 *      per request, and `scripts/checks/platform-plumbing.mjs` asserts that the
 *      call site is inside the handler rather than above it.
 *   2. **The policy is set on the request and on the response.** The response
 *      header is what the browser enforces. The request header is how Next.js
 *      finds the nonce to stamp onto the scripts it writes into the document -
 *      it reads the policy off the incoming request headers - so the
 *      framework's own inline scripts are covered by the same policy instead of
 *      needing an exemption.
 *   3. **The policy covers documents, not static files.** A stylesheet or a
 *      favicon is not a document and does not run anything; asking middleware
 *      to touch every asset costs a function invocation per image and adds no
 *      protection. The matcher below is therefore the document routes, and the
 *      static prefixes are excluded - the same prefixes Next.js serves
 *      immutably.
 *
 * What this file deliberately does not do:
 *
 *   - It does not read the environment beyond the single value that decides
 *     which policy to build. Server-only configuration is validated by
 *     `lib/env/validate-env.ts`, and the fail-fast half of that rule runs in
 *     `instrumentation.ts` when the server process starts, because a process
 *     that boots with a broken configuration should not answer a request at
 *     all - which a middleware that threw on every request would turn into a
 *     500 per page instead of a refusal to start.
 *   - It does not authenticate, redirect or rewrite anything. There are no
 *     signed-in routes yet; step 2 onwards owns sessions, and a routing rule
 *     written here before the sessions exist is a rule that has to be undone.
 *   - It does not log. A log line per request is a log line per request for
 *     every crawler, and the structured logger already has one place to record
 *     a failure: `instrumentation.ts`.
 */
export function middleware(request: NextRequest): NextResponse {
  const environment: CspEnvironment =
    process.env.NODE_ENV === 'production' ? 'production' : 'development';
  const nonce = newCspNonce();
  const policy = contentSecurityPolicy({ nonce, environment });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('Content-Security-Policy', policy);
  requestHeaders.set(CSP_NONCE_HEADER, nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', policy);
  return response;
}

/**
 * The document routes, and nothing else.
 *
 * `_next/static` and `_next/image` are the framework's own immutable asset
 * paths, `brand` and `icons` are the committed brand pack, and the four file
 * names are the favicon and the apple touch icon that the framework serves
 * from the application directory.
 */
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|brand/|icons/).*)'],
};
