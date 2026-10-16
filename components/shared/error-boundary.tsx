// path: components/shared/error-boundary.tsx
'use client';

import { Component, type ErrorInfo } from 'react';

import { ErrorState } from '@/components/shared/status-state';
import { t } from '@/lib/i18n';
import { newShortReference } from '@/lib/utils/id';

/**
 * ErrorBoundary: the component that stops one broken panel from taking the page.
 *
 * React reports a render error to a class component and to nothing else, which
 * is why this file is a class and why that is not going to change: a hook cannot
 * catch a render error, and pretending otherwise is how a product ends up with
 * an error screen that covers only the promises someone remembered to wrap.
 *
 * What happens when it catches:
 *
 *   1. **The reader gets a state, not a stack.** The fallback is the error member
 *      of the state family, so a failure looks like every other state the
 *      product shows: illustration, heading, sentence, reference, actions. A raw
 *      exception message is never rendered - it names internals, and it is
 *      written for a developer.
 *   2. **The failure gets a reference.** A short, misread-safe code is generated
 *      once per caught error and shown to the reader, because "it did not work"
 *      is not something support can act on and a code is. The error object goes
 *      to `onError` for the caller to log; nothing is written to the console,
 *      which `check:no-console` forbids and which is not where a product's
 *      errors are read anyway.
 *   3. **Reporting is one click and claims nothing it cannot do.** The report
 *      control copies the reference and the page address to the clipboard and
 *      says so under the actions. There is no reporting endpoint in this build,
 *      so the control performs the one complete action available; the step that
 *      adds the endpoint changes what the same button sends, not what the reader
 *      does.
 *   4. **A retry is real, and it is bounded.** Resetting the boundary re-mounts
 *      the subtree and re-runs the render that failed. Re-rendering while the
 *      same broken input is still in place would turn one crash into a loop, so
 *      the boundary retries once on its own - enough for a transient render
 *      failure, which is the common case - and stops. Every further attempt is
 *      the reader's decision, and their retry always runs.
 *   5. **`resetKey` is how the caller says the input changed.** A new path or a
 *      new filter clears the caught error instead of leaving the reader on a
 *      failure screen after they have fixed what caused it.
 *
 * What a boundary cannot catch is written down so nobody assumes it: errors
 * thrown in event handlers, in timers, and inside the boundary itself. A failure
 * during a server render belongs to the route's own `error.tsx`, which renders
 * the same state family.
 */
export interface ErrorBoundaryProps {
  readonly children: React.ReactNode;
  /** Names the area this boundary protects, and narrows the fallback's copy. */
  readonly scope?: string;
  /** Called once per caught error, with the reference already generated. */
  readonly onError?: (error: Error, reference: string, info: ErrorInfo) => void;
  /** Rendered in the action row: a link home, a way back, a contact. */
  readonly extra?: React.ReactNode;
  /** Change this value - a new path, a new filter - to clear a caught error. */
  readonly resetKey?: string | number;
  readonly className?: string;
}

interface ErrorBoundaryState {
  readonly error: Error | null;
  readonly reference: string | null;
  /** Failed render attempts: the automatic one, then the reader's. */
  readonly attempts: number;
  readonly reported: boolean;
  /** True once the single automatic retry has been spent. */
  readonly autoRetried: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null, reference: null, attempts: 0, reported: false, autoRetried: false };
  }

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // A fresh reference per caught error, so two failures never share a code in
    // the support conversation.
    return { error, reference: newShortReference('ERR'), reported: false };
  }

  public override componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, this.state.reference ?? 'ERR-UNKNOWN', info);
    this.setState((state) => ({ attempts: state.attempts + 1 }));
    if (!this.state.autoRetried) {
      this.setState({ autoRetried: true });
      // One silent re-render, on the next tick. If the failure was transient the
      // reader never sees the fallback; if it was not, the fallback appears with
      // the attempt already counted, and no further retry happens without the
      // reader asking for one.
      window.setTimeout(() => {
        this.setState((state) =>
          state.error === null ? state : { error: null, reference: null, reported: false },
        );
      }, 0);
    }
  }

  public override componentDidUpdate(previous: ErrorBoundaryProps): void {
    if (this.state.error !== null && previous.resetKey !== this.props.resetKey) {
      this.reset();
    }
  }

  private readonly reset = (): void => {
    this.setState({
      error: null,
      reference: null,
      attempts: 0,
      reported: false,
      autoRetried: false,
    });
  };

  private readonly retry = (): void => {
    this.setState((state) => ({
      error: null,
      reference: null,
      reported: false,
      attempts: state.attempts,
    }));
  };

  private readonly report = (): void => {
    const reference = this.state.reference ?? 'ERR-UNKNOWN';
    const address = typeof window === 'undefined' ? '' : window.location.href;
    this.setState({ reported: true });
    void navigator.clipboard?.writeText(`${reference} ${address}`.trim());
  };

  public override render(): React.ReactNode {
    const { error, reference, attempts, reported } = this.state;
    if (error === null) {
      return this.props.children;
    }
    const scoped = this.props.scope !== undefined;
    return (
      <ErrorState
        reference={reference ?? undefined}
        attempts={Math.max(1, attempts)}
        titleKey={scoped ? 'states.label_error_inline_title' : 'states.label_error_title'}
        descriptionKey={
          scoped ? 'states.label_error_inline_description' : 'states.label_error_description'
        }
        reportNote={reported ? t('states.label_error_report_copied') : undefined}
        onRetry={this.retry}
        onReport={this.report}
        extra={this.props.extra}
        className={this.props.className}
      />
    );
  }
}
