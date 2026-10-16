// path: lib/forms/csrf-token.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { z } from 'zod';

/**
 * The one-time token every form submission carries.
 *
 * The threat this closes is a request forged from another site: a page the
 * user did not intend to submit from, posting to this platform with the
 * session cookie the browser attaches automatically. A token the attacker
 * cannot read and cannot reuse turns that forged request into a rejected one.
 *
 * The token is one-time. A submission spends the token it was rendered with,
 * and the response is expected to carry a fresh one, which this hook installs
 * for the next submission. A replay of a captured request finds a spent token
 * and fails.
 *
 * Where the token comes from and goes:
 *   - the server render mints it and passes it to the form as a prop, so it
 *     exists before the first paint and no submission can happen without it;
 *   - the submission sends it in the `x-csrf-token` header and, for a
 *     form-data submission, in the `csrf_token` field;
 *   - every response carries the next token in the same `x-csrf-token` header
 *     (a response body that holds one is also accepted, inside `data` for a
 *     success envelope);
 *   - the server side that mints, records and rejects tokens lives in the
 *     request pipeline (lib/middleware/csrf.ts, sub-step 3.4). The client can
 *     only ever send a token, never invent one.
 *
 * A submission attempt spends the token even when no response arrives,
 * because a request that timed out may still have been processed. Reusing a
 * token after a network failure would be a replay, and the honest recovery is
 * the reload action of the token frame, not a second guess.
 */

/** Form field name that carries the token in a form-data submission. */
export const CSRF_TOKEN_FIELD = 'csrf_token';

/** Header that carries the token in both directions. */
export const CSRF_TOKEN_HEADER = 'x-csrf-token';

/** Shape a rotated token must have before it replaces the current one. */
const tokenSchema = z.string().min(16).max(256);

const payloadTokenSchema = z.object({ [CSRF_TOKEN_FIELD]: tokenSchema });
const envelopeTokenSchema = z.object({ data: z.object({ [CSRF_TOKEN_FIELD]: tokenSchema }) });

/** Reads a rotated token out of a response body, or null when it has none. */
export function readRotatedToken(payload: unknown): string | null {
  const direct = payloadTokenSchema.safeParse(payload);
  if (direct.success) {
    return direct.data[CSRF_TOKEN_FIELD];
  }
  const enveloped = envelopeTokenSchema.safeParse(payload);
  if (enveloped.success) {
    return enveloped.data.data[CSRF_TOKEN_FIELD];
  }
  return null;
}

/** Reads a rotated token out of the response headers, or null when absent. */
export function readRotatedTokenFromHeaders(headers: Headers): string | null {
  const value = headers.get(CSRF_TOKEN_HEADER);
  if (value === null) {
    return null;
  }
  const parsed = tokenSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export interface OneTimeCsrfToken {
  /** The token to send with the next submission; empty when none is usable. */
  readonly token: string;
  /** True when a usable token is available. */
  readonly hasToken: boolean;
  /** True when a submission already spent the current token. */
  readonly isSpent: boolean;
  /**
   * Returns the current token and marks it spent. A second call before a
   * rotation returns an empty string, which the server rejects loudly instead
   * of replaying a spent token.
   */
  readonly spendToken: () => string;
  /** Installs a replacement token. Returns false when it is not usable. */
  readonly installToken: (value: string | null) => boolean;
  /**
   * Installs the token carried by a response: the header first, then the body.
   * Returns false when the response carried none, which leaves the form in the
   * expired state.
   */
  readonly installFromResponse: (response: { payload?: unknown; headers?: Headers }) => boolean;
}

/** Holds the current one-time token for one form. */
export function useOneTimeCsrfToken(initialToken: string): OneTimeCsrfToken {
  const [token, setToken] = useState(initialToken);
  const [isSpent, setSpent] = useState(false);
  const spentRef = useRef(false);

  useEffect(() => {
    setToken(initialToken);
    spentRef.current = false;
    setSpent(false);
  }, [initialToken]);

  const spendToken = useCallback((): string => {
    if (spentRef.current) {
      return '';
    }
    spentRef.current = true;
    setSpent(true);
    return token;
  }, [token]);

  const installToken = useCallback((value: string | null): boolean => {
    const parsed = value === null ? null : tokenSchema.safeParse(value);
    if (parsed === null || !parsed.success) {
      return false;
    }
    spentRef.current = false;
    setSpent(false);
    setToken(parsed.data);
    return true;
  }, []);

  const installFromResponse = useCallback(
    (response: { payload?: unknown; headers?: Headers }): boolean => {
      const fromHeaders =
        response.headers === undefined ? null : readRotatedTokenFromHeaders(response.headers);
      if (fromHeaders !== null) {
        return installToken(fromHeaders);
      }
      return installToken(
        response.payload === undefined ? null : readRotatedToken(response.payload),
      );
    },
    [installToken],
  );

  return {
    token,
    hasToken: token.length > 0,
    isSpent,
    spendToken,
    installToken,
    installFromResponse,
  };
}
