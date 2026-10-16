// path: lib/security/trusted-types.ts
/**
 * The Trusted Types policy: the structural half of the XSS defence.
 *
 * Output encoding (which React does) and a sanitizer (which
 * `lib/security/sanitizer.ts` is) both rely on every call site being written
 * correctly. Trusted Types stop being a matter of discipline: with
 * `require-trusted-types-for 'script'` in the content security policy, a
 * browser refuses to let a *string* reach an injection sink at all. The string
 * has to be a `TrustedHTML` produced by a named policy the page has declared,
 * and a named policy is a piece of code a reviewer can read, in a file, under
 * version control. That is the difference this module makes: not "we sanitize
 * everywhere", but "the browser will not accept anything that did not come
 * through here".
 *
 * Two rules the policy follows:
 *
 *   1. **Every function it declares is a real check.** A policy whose
 *      `createHTML` returns its input - the shape a policy takes when it is
 *      added to silence a console warning - is worse than no policy at all,
 *      because it launders arbitrary markup into a value the browser will then
 *      trust. `createHTML` here delegates to the sanitizer, and nothing else.
 *   2. **The functions it does not declare are refusals.** `createScript` is
 *      left out on purpose: with it missing, any sink that would turn a string
 *      into executable script throws, and this application has no such sink.
 *      `createScriptURL` is declared and accepts only a URL on this origin,
 *      which is what a script loader needs and nothing more.
 *
 * The directive that turns the enforcement on is part of the content security
 * policy, which sub-step 1.30 assembles in `middleware.ts` with the per-request
 * nonce. The policy is created here now so that adding the directive is a change
 * to the policy header and not a change to every call site: with the policy in
 * place and no directive, the application behaves exactly as before; with the
 * directive added, it is enforced from the first request.
 *
 * `window.trustedTypes` does not exist in every browser. Where it is missing
 * this module reports that plainly and returns nothing, and the sanitizer stays
 * the answer - which is the same position those browsers are in today.
 */
import { sanitizeHtml } from '@/lib/security/sanitizer';

/**
 * The minimum of the Trusted Types API this product uses, declared here because
 * the TypeScript DOM library does not ship it yet. The declaration is kept as
 * small as the code below needs: a factory that makes policies, the two rule
 * functions this policy implements, and the name a created policy carries.
 * Nothing in the product is allowed to widen it - a second declaration of the
 * same global name in another file would be a compiler error, which is the
 * correct outcome.
 */
declare global {
  /** The rule set a policy is created with. A rule left out is a refusal. */
  interface TrustedTypesPolicyRules {
    createHTML?: (input: string) => string;
    createScriptURL?: (input: string) => string;
  }

  /** A policy after it has been created. */
  interface TrustedTypesPolicy {
    readonly name: string;
  }

  /** The per-document factory. Absent where the API is not implemented. */
  interface TrustedTypesFactory {
    createPolicy(name: string, rules: TrustedTypesPolicyRules): TrustedTypesPolicy;
  }

  interface Window {
    readonly trustedTypes?: TrustedTypesFactory;
  }
}

/** The policy name, which is also what a violation report names. */
export const TRUSTED_TYPES_POLICY_NAME = 'kd-solution-it';

/** What a caller gets back: the sanitizing policy, in plain TypeScript terms. */
export interface SecurityPolicy {
  readonly name: string;
  /** Sanitized markup, safe to hand to a sink. */
  readonly createHtml: (input: string) => string;
  /** A URL on this origin. Throws for anything else. */
  readonly createScriptUrl: (input: string) => string;
}

/** The installed policy, held so a second call is a no-op rather than an error. */
let installed: SecurityPolicy | null = null;
/** Set once the first attempt has run, so a refusal is not retried per render. */
let attempted = false;

/** True when this browser implements the API. */
export function isTrustedTypesSupported(): boolean {
  return typeof window !== 'undefined' && window.trustedTypes !== undefined;
}

/**
 * The policy a caller can use without installing it: sanitizing HTML, and only
 * same-origin script URLs. It exists so that a module which needs markup can
 * depend on the behaviour rather than on the browser API being present.
 */
export function securityPolicy(): SecurityPolicy {
  return {
    name: TRUSTED_TYPES_POLICY_NAME,
    createHtml: (input) => sanitizeHtml(input),
    createScriptUrl: (input) => {
      const resolved = resolveSameOrigin(input);
      if (resolved === null) {
        throw new TypeError(
          `${TRUSTED_TYPES_POLICY_NAME} refuses a script URL outside this origin`,
        );
      }
      return resolved;
    },
  };
}

/**
 * Declare the policy with the browser, once per document.
 *
 * Returns the policy that is in force afterwards. A browser that already has a
 * policy under this name - two copies of the runtime on one page, or a second
 * call after a hot reload - is not an error to shout about, but it is also not
 * a reason to fall back to passing strings through: the returned policy still
 * refuses anything that would need a script sink.
 */
export function installSecurityPolicy(): SecurityPolicy | null {
  if (attempted) {
    return installed;
  }
  attempted = true;
  if (!isTrustedTypesSupported()) {
    return null;
  }
  const factory = window.trustedTypes;
  if (factory === undefined) {
    return null;
  }
  const policy = securityPolicy();
  try {
    factory.createPolicy(TRUSTED_TYPES_POLICY_NAME, {
      createHTML: (input: string) => policy.createHtml(input),
      createScriptURL: (input: string) => policy.createScriptUrl(input),
    });
    installed = policy;
  } catch {
    // The name is taken by a policy this module did not create. Returning null
    // keeps the caller honest: it has no policy it can trust, so it must not
    // reach a sink.
    installed = null;
  }
  return installed;
}

/** The policy that is in force, or null when this browser has none. */
export function installedSecurityPolicy(): SecurityPolicy | null {
  return installed;
}

/**
 * A URL on this origin, or null.
 *
 * Both the relative form the application writes (`/_next/static/...`) and the
 * absolute form a script loader produces are accepted; a protocol-relative URL
 * (`//host/path`) and a different origin are not. `URL` resolves the relative
 * form against the document origin, which is what makes the comparison
 * meaningful rather than a string test that `evil.example` can pass with a
 * prefix.
 */
function resolveSameOrigin(input: string): string | null {
  if (input.trim().length === 0) {
    return null;
  }
  try {
    const resolved = new URL(input, window.location.origin);
    if (resolved.origin !== window.location.origin) {
      return null;
    }
    if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') {
      return null;
    }
    return resolved.href;
  } catch {
    return null;
  }
}
