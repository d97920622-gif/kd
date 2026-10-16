// path: app/(dev)/gallery/showcase-security.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';

import { SECURITY_HEADERS } from '@/config/security-headers';
import { t } from '@/lib/i18n';
import { canSanitize, sanitizeHtml } from '@/lib/security/sanitizer';
import { isTrustedTypesSupported } from '@/lib/security/trusted-types';

/**
 * The hardening baseline, rendered so that it is a thing a reviewer can look at
 * rather than a paragraph in an ADR.
 *
 * Three specimens, each one answering a question a reviewer would otherwise have
 * to take on trust:
 *
 *   1. **What does the sanitizer do to a hostile string?** One input is rendered
 *      twice: once through `sanitizeHtml` and once as text, unchanged. The
 *      sanitizer's output is shown as *text* rather than as markup, because this
 *      page is a report about the sanitizer and inserting its result as HTML
 *      would make the gallery a second injection sink - the exact thing it is
 *      demonstrating against. Everything here is rendered by React, and no
 *      `dangerouslySetInnerHTML` exists anywhere in this product.
 *   2. **Which headers did this response carry?** Read from a `HEAD` request the
 *      browser makes to the page it is already on, which is the response the
 *      reader received rather than the configuration the project declares. A
 *      browser withholds the header list of the *document* itself from script,
 *      so there is no other honest way to ask. When the request fails the pane
 *      says so and points at the probe that reads the same headers from outside
 *      the browser.
 *   3. **Is Trusted Types enforced here?** The pane reports what this browser
 *      implements and names the policy the application declares. It does not
 *      claim enforcement, because enforcement is the
 *      `require-trusted-types-for` directive that arrives with the nonce policy
 *      in sub-step 1.30.
 *
 * The hostile string is a specimen and lives in this file as a constant rather
 * than in the catalogue: it is markup being demonstrated, not copy a person
 * reads, and it has to contain the constructs the sanitizer removes. Every
 * sentence around it is a catalogue string, like every other sentence in the
 * product.
 */
const HOSTILE_INPUT = [
  '<p>An invoice reference and a <a href="javascript:alert(1)">link</a>.</p>',
  '<script>throw new Error("this never runs")</script>',
  '<iframe src="https://example.test/embed"></iframe>',
  '<img src="x" onerror="alert(1)">',
  '<svg><script>alert(2)</script></svg>',
  '<div style="background:url(javascript:alert(3))">styled</div>',
  '<p>Kept: <strong>bold</strong>, <a href="/shells" title="a real target">a real link</a>.</p>',
].join('');

/** Every header name the baseline declares, in the order the matrix lists them. */
const TRACKED_HEADERS: readonly string[] = SECURITY_HEADERS.map((header) => header.name);

/** The production-only names, so the pane can say why one is absent here. */
const PRODUCTION_ONLY: readonly string[] = SECURITY_HEADERS.filter(
  (header) => header.environment === 'production',
).map((header) => header.name);

export function ShowcaseSecurity(): React.ReactElement {
  const [sanitized, setSanitized] = useState<string | null>(null);
  const [trustedTypes, setTrustedTypes] = useState<boolean | null>(null);
  const [received, setReceived] = useState<readonly string[] | null>(null);
  const [headersRead, setHeadersRead] = useState(false);

  useEffect(() => {
    // The sanitizer needs a parser, which needs a browser, and the render has to
    // be identical on the server and in the browser: reading these in an effect
    // is what keeps the two the same. On the server the sanitizer refuses rather
    // than passing the input through, and the pane says so.
    setSanitized(canSanitize() ? sanitizeHtml(HOSTILE_INPUT) : null);
    setTrustedTypes(isTrustedTypesSupported());

    let cancelled = false;
    const controller = new AbortController();
    fetch(window.location.pathname, {
      method: 'HEAD',
      credentials: 'same-origin',
      signal: controller.signal,
    })
      .then((response) => {
        if (!cancelled) {
          setReceived(Array.from(response.headers.keys()));
          setHeadersRead(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReceived(null);
          setHeadersRead(false);
        }
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const sentHere = useMemo(() => new Set(received ?? []), [received]);

  return (
    <section aria-labelledby="gallery-security-heading" className="grid gap-4">
      <h3 id="gallery-security-heading" className="text-xl font-semibold">
        {t('gallery.label_section_security')}
      </h3>
      <p className="max-w-sheet text-base text-muted-foreground">
        {t('gallery.label_security_note')}
      </p>
      <p data-security="header-count" className="text-sm text-muted-foreground">
        {t('security.label_hardening_count')} {received === null ? '0' : String(received.length)}
      </p>

      <div className="grid gap-3 rounded-lg border border-border bg-card p-4">
        <p className="text-base font-medium">{t('security.label_sanitizer_title')}</p>
        <p className="max-w-sheet text-sm text-muted-foreground">
          {t('security.label_sanitizer_description')}
        </p>
        <dl className="grid gap-3">
          <div className="grid gap-1">
            <dt className="text-sm font-medium">{t('security.label_sanitizer_input')}</dt>
            <dd
              data-security="sanitizer-input"
              className="wrap-anywhere rounded-md bg-muted p-3 font-mono text-xs"
            >
              {HOSTILE_INPUT}
            </dd>
          </div>
          <div className="grid gap-1">
            <dt className="text-sm font-medium">{t('security.label_sanitizer_output')}</dt>
            <dd
              data-security="sanitizer-output"
              className="wrap-anywhere rounded-md bg-muted p-3 font-mono text-xs"
            >
              {sanitized ?? t('security.label_hardening_unavailable')}
            </dd>
          </div>
          <div className="grid gap-1">
            <dt className="text-sm font-medium">{t('security.label_sanitizer_text_mode')}</dt>
            <dd className="wrap-anywhere rounded-md bg-muted p-3 font-mono text-xs">
              {HOSTILE_INPUT}
            </dd>
          </div>
        </dl>
      </div>

      <div className="grid gap-3 rounded-lg border border-border bg-card p-4">
        <p className="text-base font-medium">{t('security.label_hardening_title')}</p>
        <p className="max-w-sheet text-sm text-muted-foreground">
          {t('security.label_hardening_description')}
        </p>
        <ul data-security="header-matrix" className="grid gap-2">
          {TRACKED_HEADERS.map((name) => (
            <li key={name} className="flex flex-wrap items-baseline justify-between gap-2">
              <code className="wrap-anywhere font-mono text-xs">{name}</code>
              <span className="text-xs text-muted-foreground">
                {headersRead && sentHere.has(name)
                  ? t('gallery.label_security_header_sent')
                  : !headersRead && PRODUCTION_ONLY.includes(name)
                    ? t('security.label_hardening_pending')
                    : t('security.label_hardening_unknown')}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-3 rounded-lg border border-border bg-card p-4">
        <p className="text-base font-medium">{t('security.label_trusted_types_title')}</p>
        <p data-security="trusted-types" className="max-w-sheet text-sm text-muted-foreground">
          {trustedTypes === null
            ? t('security.label_hardening_unavailable')
            : trustedTypes
              ? t('security.label_trusted_types_supported')
              : t('security.label_trusted_types_unsupported')}
        </p>
        <p data-security="clear-site-data" className="max-w-sheet text-sm text-muted-foreground">
          {t('security.label_clearsite_withheld')}
        </p>
      </div>
    </section>
  );
}
