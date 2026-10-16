// path: components/shared/explainability-message.tsx
import { t } from '@/lib/i18n';
import { isSafeUrl } from '@/lib/security/sanitizer';
import {
  explainabilityKey,
  formatUtcTimestamp,
  resolveExplainabilityReason,
  sanitizeReference,
} from '@/lib/usability/explainability';
import { cn } from '@/lib/utils/cn';

/**
 * ExplainabilityMessage: why an outcome happened, what happens next and when
 * to expect the result (docs/PLAN/05 A14.3, FEATURE_LIST item 1494).
 *
 * The component exists because the alternative - each surface writing its own
 * sentence about money - produces the failure this requirement is aimed at: a
 * payment that says "failed" and nothing else, or a hold with no reason and no
 * end. So the shape is fixed and the words are not the caller's:
 *
 *   - the caller passes a **reason**, and this component resolves it to the
 *     four sentences in lib/i18n/strings/en/explainability.ts;
 *   - the caller passes **context values** - a reference, an instant, a
 *     support address - and never a sentence of its own. That is the contract
 *     steps 5, 10, 11 and 12 build on (docs/PLAN/09_REVISION_2_ADDITIONS.md);
 *   - an unknown reason is not an error state. It resolves to the sentence for
 *     `unknown_outcome`, which names the reference and points at support,
 *     because a panel with a heading and no words is the worst version of this
 *     component and the one a payload would otherwise produce.
 *
 * Every value that arrives from a payload is treated as input: the reason is
 * resolved against the closed list, the reference is stripped of control
 * characters and capped, the instant is validated before it is rendered as a
 * `<time>` label, and the support address is kept only when it stays on this
 * origin or is an absolute https address. Nothing here renders markup: the
 * sentences are text, which is what makes this component safe to place beside
 * a hostile string.
 *
 * The `<time>` element carries the machine-readable instant while the visible
 * label is the fixed UTC string, so a reader sees one unambiguous time rather
 * than a local time that differs between the server that rendered the page and
 * the browser that hydrated it.
 */

/**
 * A support link as it may be rendered, or null.
 *
 * A payload may carry the link, so it is a URL from untrusted input. It is kept
 * only when it is a relative path on this origin - but not a protocol-relative
 * one, which leaves the origin as surely as an absolute address does - or an
 * absolute https address. Everything else, including `javascript:`, `data:` and
 * a scheme written with control characters inside it, is dropped. The scheme
 * half of that rule is the sanitizer's, shared rather than copied, and the
 * origin half is this component's, because only this component knows it is
 * rendering a link for a reader to follow.
 */
function supportHref(value: string | undefined): string | null {
  if (value === undefined || !isSafeUrl(value)) {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }
  return /^https:\/\//i.test(trimmed) ? trimmed : null;
}

export interface ExplainabilityMessageProps {
  /** The reason from the payload. An unknown value resolves to the fallback. */
  readonly reason: string;
  /** The identifier a support request should quote: a correlation id or a reference. */
  readonly reference?: string;
  /** The instant the outcome is expected by, as an ISO-8601 string. */
  readonly expectedBy?: string;
  /** Where to send a reader who needs a person. Relative or https only. */
  readonly supportHref?: string;
  /**
   * The heading id, so several panels on one page keep distinct names. The
   * default is derived from the reason, which is unique until a page shows the
   * same reason twice.
   */
  readonly headingId?: string;
  /** 3 by default; 4 for a panel inside a section that already has a heading. */
  readonly headingLevel?: 3 | 4;
  /** Extra controls a later step adds below the sentences. */
  readonly children?: React.ReactNode;
  readonly className?: string;
}

export function ExplainabilityMessage({
  reason,
  reference,
  expectedBy,
  supportHref: supportHrefValue,
  headingId,
  headingLevel = 3,
  children,
  className,
}: ExplainabilityMessageProps): React.ReactElement {
  const resolved = resolveExplainabilityReason(reason);
  const titleId = headingId ?? `explainability-${resolved}`;
  const Heading = headingLevel === 4 ? 'h4' : 'h3';
  const referenceText = sanitizeReference(reference);
  const expectedLabel = formatUtcTimestamp(expectedBy);
  const safeSupport = supportHref(supportHrefValue);

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        'flex flex-col items-start gap-2 rounded-lg border border-border bg-card p-6 text-card-foreground',
        className,
      )}
      data-explainability={resolved}
    >
      <Heading id={titleId} className="text-base font-semibold">
        {t(explainabilityKey(resolved, 'headline'))}
      </Heading>

      <p className="text-sm">{t(explainabilityKey(resolved, 'explanation'))}</p>

      <p className="text-sm">
        <span className="font-medium">{t('explainability.label_next')}</span>{' '}
        {t(explainabilityKey(resolved, 'next'))}
      </p>

      <p className="text-sm text-muted-foreground">
        {t(explainabilityKey(resolved, 'expected'))}
        {expectedLabel === null ? null : (
          <span>
            {' '}
            <time dateTime={expectedBy}>
              {t('explainability.label_expected_by', { time: expectedLabel })}
            </time>
          </span>
        )}
      </p>

      {referenceText === null ? null : (
        <p className="grid gap-1 text-sm">
          <span className="font-medium">{t('explainability.label_reference')}</span>
          <code className="wrap-anywhere rounded-sm bg-muted px-1.5 py-0.5 font-mono text-xs">
            {referenceText}
          </code>
        </p>
      )}

      {safeSupport === null ? null : (
        <a
          className="text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          href={safeSupport}
        >
          {t('explainability.label_support')}
        </a>
      )}

      {children}
    </section>
  );
}
