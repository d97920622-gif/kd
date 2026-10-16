// path: lib/security/logout.ts
/**
 * Signing out, including the part that is not a navigation.
 *
 * The plan asks for `Clear-Site-Data` on logout (docs/PLAN/05 A13.8,
 * docs/PLAN/08 1.26): when a signed-in user signs out, the browser must be told
 * to drop what it cached for this origin, because the next person at that device
 * must not be able to read the previous person's workspace out of a disk cache.
 * There are two halves to that, and they belong to different steps:
 *
 *   - **The header**, which only a server can send. `clearSiteDataHeader()`
 *     builds it and returns null for a request without TLS, because the
 *     specification makes a browser ignore `Clear-Site-Data` on an insecure
 *     origin - a header that silently does nothing is worse than one that was
 *     never sent. The route that answers `POST /logout` is built in step 3 with
 *     authentication, and it calls this function.
 *   - **The client signal**, which is this module's other half. Until step 3
 *     exists there is no session to end, but the *hooks* that will hold a
 *     user's data - saved views, drafts, cached lists - have to exist somewhere a
 *     sign-out can reach them, and a page that unmounts without being told
 *     leaves its copy behind. `logOut()` performs the navigation and announces
 *     the event; `installLogoutClearSignal()` is what those future hooks
 *     subscribe to with one line, so the first module that caches anything does
 *     not have to invent the protocol or remember this requirement.
 *
 * The event carries no payload and no user data: it names *what happened*, so a
 * listener decides what it holds and clears that. An event that enumerated the
 * keys to remove would be a second copy of the thing it is trying to delete.
 *
 * `Cache-Control: no-store` is deliberately not this module's job. It is a
 * per-response decision that belongs to the route that renders a private page,
 * and step 3 owns it; the header matrix covers what is true of every response.
 */

/** Where a sign-out sends the browser. A step 3 route; the path is fixed here. */
export const LOGOUT_PATH = '/logout';
/** The event a data-holding hook listens for. */
export const LOGOUT_SIGNAL_EVENT = 'kd:logout';
/** The header value, which the specification defines exactly and completely. */
export const CLEAR_SITE_DATA_HEADER_VALUE = '"cache", "cookies", "storage"';

export interface LogoutSignalDetail {
  /** True when the reader asked to sign out, rather than a session that expired. */
  readonly requested: boolean;
}

/**
 * The Clear-Site-Data header for a sign-out response, or null.
 *
 * The header is refused on a request that did not arrive over TLS. That is not
 * caution: the specification says a browser ignores the header on an insecure
 * origin, so sending it there would leave a reviewer believing a cache was
 * cleared when it was not.
 */
export function clearSiteDataHeader(requestUrl: string): string | null {
  try {
    const url = new URL(requestUrl);
    if (url.protocol !== 'https:') {
      return null;
    }
  } catch {
    return null;
  }
  return CLEAR_SITE_DATA_HEADER_VALUE;
}

/**
 * Announce that the session ended and go to the sign-in page.
 *
 * The announcement happens before the navigation, because navigating away
 * destroys the page and every listener on it. A caller that has something to
 * flush - a draft to save, a queue to empty while the session is still valid -
 * listens for the event, does its work, and either calls this function itself or
 * lets the caller do it after the flush resolves.
 */
export function logOut(options: { readonly requested?: boolean } = {}): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(
    new CustomEvent<LogoutSignalDetail>(LOGOUT_SIGNAL_EVENT, {
      detail: { requested: options.requested ?? true },
    }),
  );
  window.location.assign(LOGOUT_PATH);
}

/**
 * Subscribe to the sign-out signal.
 *
 * Returns the unsubscribe function, so the caller can drop the listener when its
 * component unmounts - the pattern a React effect needs, written once here so no
 * module has to remember the options object.
 */
export function installLogoutClearSignal(
  listener: (detail: LogoutSignalDetail) => void,
): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }
  const handler = (event: Event): void => {
    listener((event as CustomEvent<LogoutSignalDetail>).detail);
  };
  window.addEventListener(LOGOUT_SIGNAL_EVENT, handler);
  return () => {
    window.removeEventListener(LOGOUT_SIGNAL_EVENT, handler);
  };
}
