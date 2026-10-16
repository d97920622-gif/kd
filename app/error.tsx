// path: app/error.tsx
'use client';

import { useState } from 'react';

import { PublicShell } from '@/components/layout/public-shell';
import { ErrorState } from '@/components/shared/status-state';
import { t } from '@/lib/i18n';
import { newShortReference } from '@/lib/utils/id';

/**
 * The error page (FEATURE_LIST item 135: a 500 page with a report option, item
 * 132: the correlation id, item 133: the one-click report).
 *
 * A route-level error boundary is the half of the pair that
 * `components/shared/error-boundary.tsx` cannot cover: that one catches a
 * failure while a page is rendering in the browser, and this one catches a
 * failure of a server render, which is why Next.js hands it `reset` rather than
 * letting a component decide.
 *
 * What it does, in the order the reader needs it:
 *
 *   1. **The reference comes first.** A server render that failed carries
 *      `error.digest`, which is the id the platform's own log entry was written
 *      under. A reader who quotes it points support at one request. When there
 *      is no digest - a client-side failure inside the boundary - the page
 *      generates a short reference of its own, from the same generator the
 *      render-error boundary uses, so the two failure paths look identical to
 *      the person reporting them. It is generated once, in state, because a
 *      reference that changed on every re-render would be a reference nobody
 *      could quote.
 *   2. **The report control is the one complete action available.** There is no
 *      reporting endpoint in this build, so the control copies the reference and
 *      the address of the page to the clipboard and the page says that is what
 *      happened. It is one click and no typing, which is what item 135 asks for;
 *      the step that adds the endpoint changes where the button sends those two
 *      strings, not what the reader does.
 *   3. **The retry is real.** `reset()` re-renders the segment that failed, and
 *      the attempt count is kept so the reader can see the product knows this is
 *      the second time. Re-rendering is safe here because the boundary is
 *      re-mounted with the same input; the automatic single retry that turns one
 *      transient failure into no visible failure at all is in the render
 *      boundary, where it belongs.
 *   4. **It renders in the public shell.** The error page is reachable by any
 *      reader, signed in or not, and it replaces whatever they were reading. The
 *      shell is what gives them a brand, a navigation and a footer instead of a
 *      dead end - and the offline banner inside it is the one surface that knows
 *      whether the failure was a dropped connection.
 *
 * What this page deliberately does not do: it does not print `error.message`.
 * A stack message names internals and is written for whoever wrote the code; the
 * reader gets the state family's sentence and the reference, and whoever
 * investigates gets the digest from the log.
 */
export default function RouteError({
  error,
  reset,
}: {
  readonly error: Error & { readonly digest?: string };
  readonly reset: () => void;
}): React.ReactElement {
  const [reference] = useState(() => error.digest ?? newShortReference('ERR'));
  const [attempts, setAttempts] = useState(1);
  const [reported, setReported] = useState(false);

  const retry = (): void => {
    setAttempts((count) => count + 1);
    reset();
  };

  const report = (): void => {
    const address = typeof window === 'undefined' ? '' : window.location.href;
    setReported(true);
    void navigator.clipboard?.writeText(`${reference} ${address}`.trim());
  };

  return (
    <PublicShell>
      <section data-public-page="error" className="border-b border-border bg-card">
        <div className="mx-auto max-w-page px-gutter py-section">
          <ErrorState
            reference={reference}
            attempts={attempts}
            onRetry={retry}
            onReport={report}
            reportNote={reported ? t('states.label_error_report_copied') : undefined}
            live="off"
          />
        </div>
      </section>
    </PublicShell>
  );
}
