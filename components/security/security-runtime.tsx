// path: components/security/security-runtime.tsx
'use client';

import { useEffect } from 'react';

import { installSecurityPolicy } from '@/lib/security/trusted-types';

/**
 * SecurityRuntime: the browser-side half of the hardening baseline, mounted
 * once, in the root layout.
 *
 * It declares the Trusted Types policy for this document and renders nothing.
 * One client component in the root layout, for the same reason the motion
 * provider is there: a policy is per-document, `createPolicy` throws when a name
 * is already taken, and a component that installed it per page would install it
 * a hundred times and work until the second page was opened.
 *
 * Why this is a component rather than a line in `lib/security/` that runs on
 * import: a module-level side effect in the security library would run during
 * server rendering too, where `window` does not exist, and in every import of the
 * barrel - including the ones in server components. An effect is explicit about
 * when it happens, which is exactly the property a policy declaration should
 * have.
 *
 * The install is idempotent and silent. A browser without the API gets no policy
 * and no error: `installSecurityPolicy()` returns null, the sanitizer remains the
 * defense, and the gallery says so in a sentence rather than a console warning -
 * the product writes nothing to the console, in any environment.
 *
 * `suppressHydrationWarning` is deliberately not used here, and no DOM is
 * touched during render: this component's render output is `null` on the server
 * and on the client, so it can never be the cause of a mismatch.
 */
export function SecurityRuntime(): null {
  useEffect(() => {
    installSecurityPolicy();
  }, []);
  return null;
}
