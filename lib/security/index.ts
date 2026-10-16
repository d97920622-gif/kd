// path: lib/security/index.ts
/**
 * The security barrel: what the rest of the product is allowed to reach for.
 *
 * A barrel exists to keep an import path stable while the modules behind it
 * move, and to make the set of things the product may use explicit. This one
 * deliberately re-exports a small surface:
 *
 *   - the sanitizer and its allowlist, because rich text will arrive in step 5
 *     and every consumer has to agree on what a safe subset is;
 *   - the Trusted Types policy, because a sink in any future module has one
 *     correct way to be fed;
 *   - the logout signal, because clearing a signed-in user's cached data is a
 *     security action rather than a navigation detail, and a sign-out that
 *     forgets it leaves a copy of the workspace on the device.
 *
 * It deliberately does not re-export the header matrix. That is build-time data
 * consumed by `next.config.js`, and a component that could import it might be
 * tempted to believe a header list is an application concern.
 */
export {
  canSanitize,
  FORBIDDEN_ATTRIBUTE_PREFIX,
  FORBIDDEN_ELEMENTS,
  isSafeUrl,
  REMOVED_LINK_TEXT,
  REMOVED_MARKER,
  SAFE_ELEMENTS,
  SAFE_URL_SCHEMES,
  sanitizeHtml,
} from '@/lib/security/sanitizer';
export {
  CLEAR_SITE_DATA_HEADER_VALUE,
  clearSiteDataHeader,
  installLogoutClearSignal,
  LOGOUT_PATH,
  LOGOUT_SIGNAL_EVENT,
  logOut,
  type LogoutSignalDetail,
} from '@/lib/security/logout';
export {
  installSecurityPolicy,
  installedSecurityPolicy,
  isTrustedTypesSupported,
  securityPolicy,
  TRUSTED_TYPES_POLICY_NAME,
  type SecurityPolicy,
} from '@/lib/security/trusted-types';
