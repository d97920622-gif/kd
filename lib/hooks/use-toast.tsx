// path: lib/hooks/use-toast.tsx
'use client';

import { createContext, useCallback, useContext, useMemo, useReducer } from 'react';

import { Button } from '@/components/ui/button';
import {
  TOAST_DURATION_MS,
  Toast,
  ToastAction,
  ToastCloseButton,
  ToastDescription,
  ToastTitleText,
  ToastViewport,
  ToastProviderPrimitive,
  type ToastProps,
} from '@/components/ui/toast';

/**
 * Toast state for the whole application.
 *
 * The state lives in a reducer and a context provider, not in a module level
 * array. That matters in three ways:
 *
 *   1. Server safety. A module level queue would be shared by every request
 *      that the same Node process handles, so one tenant could see another
 *      tenant's notification. The queue belongs to a render tree instead.
 *   2. Deterministic order. The reducer assigns increasing ids, so the toast
 *      stack is stable no matter how many toasts arrive in the same tick.
 *   3. Bounded memory. The list is capped, because an unbounded queue is a
 *      slow leak in a long lived tab.
 *
 * The maximum is a parameter of the provider, so a future surface can keep a
 * longer history without changing this file.
 *
 * Toast content is always passed in from the string catalogue by the caller:
 * this module formats nothing and holds no display text.
 *
 * One surface, mounted once (sub-step 1.27). `ToastProvider` wraps the
 * application in the root layout and publishes `push`, so a component deep in
 * a page can raise a toast without rendering its own stack - which is what
 * makes the undo primitive possible: a five second undo is a toast with an
 * action, and a second toast surface would be a second place for it to go
 * wrong. The gallery keeps its own stack inside each theme scope, because the
 * gallery's job is to render the primitive in every theme rather than to use
 * the application's.
 */
export const TOAST_LIMIT = 3;

/**
 * An action inside a toast: the one decision a reader may make from a notice.
 *
 * It exists for the undo window (FEATURE_LIST item 1852), where the action is
 * the point of the toast rather than an extra. The label is copy and arrives
 * resolved, like every other string here.
 */
export interface ToastActionRequest {
  readonly label: string;
  readonly onAction: () => void;
}

/** A toast request from application code. */
export interface ToastRequest {
  readonly title: string;
  readonly description?: string;
  readonly variant?: 'default' | 'success' | 'warning' | 'destructive';
  readonly duration?: number;
  readonly action?: ToastActionRequest;
}

/** A queued toast: the request plus its identity. */
export interface QueuedToast extends ToastRequest {
  readonly id: string;
  readonly open: boolean;
}

interface ToastState {
  readonly toasts: readonly QueuedToast[];
  readonly nextId: number;
}

type ToastActionType =
  | { readonly type: 'add'; readonly request: ToastRequest; readonly id: string }
  | { readonly type: 'dismiss'; readonly id: string }
  | { readonly type: 'dismiss_all' };

function toastReducer(state: ToastState, action: ToastActionType): ToastState {
  switch (action.type) {
    case 'add':
      return {
        nextId: state.nextId + 1,
        toasts: [...state.toasts, { ...action.request, id: action.id, open: true }].slice(
          -TOAST_LIMIT,
        ),
      };
    case 'dismiss':
      return {
        ...state,
        toasts: state.toasts.map((toast) =>
          toast.id === action.id ? { ...toast, open: false } : toast,
        ),
      };
    case 'dismiss_all':
      return { ...state, toasts: state.toasts.map((toast) => ({ ...toast, open: false })) };
    default:
      return state;
  }
}

/** The reducer plus its two entry points, used by the provider. */
export function useToastQueue(): {
  readonly toasts: readonly QueuedToast[];
  readonly push: (request: ToastRequest) => void;
  readonly dismiss: (id: string) => void;
  readonly dismissAll: () => void;
} {
  const [state, dispatch] = useReducer(toastReducer, { toasts: [], nextId: 1 });

  const push = useCallback((request: ToastRequest): void => {
    const id = `toast-${String(Date.now())}-${String(Math.random()).slice(2, 8)}`;
    dispatch({ type: 'add', request, id });
  }, []);

  const dismiss = useCallback((id: string): void => {
    dispatch({ type: 'dismiss', id });
  }, []);

  const dismissAll = useCallback((): void => {
    dispatch({ type: 'dismiss_all' });
  }, []);

  return useMemo(
    () => ({ toasts: state.toasts, push, dismiss, dismissAll }),
    [state.toasts, push, dismiss, dismissAll],
  );
}

/**
 * Wrap the application once with this provider. It renders the Radix
 * provider, the viewport and the visible toasts, so a page only calls
 * useToastQueue and renders its own content.
 */
export function ToastStack({
  toasts,
  onDismiss,
}: {
  readonly toasts: readonly QueuedToast[];
  readonly onDismiss: (id: string) => void;
}): React.ReactElement {
  return (
    <ToastProviderPrimitive duration={TOAST_DURATION_MS} swipeDirection="right">
      {toasts.map((queued) => (
        <Toast
          key={queued.id}
          open={queued.open}
          variant={queued.variant}
          duration={queued.duration}
          onOpenChange={(open) => {
            if (!open) {
              onDismiss(queued.id);
            }
          }}
        >
          <div className="grid gap-1">
            <ToastTitleText>{queued.title}</ToastTitleText>
            {queued.description === undefined ? null : (
              <ToastDescription className="text-sm opacity-90">
                {queued.description}
              </ToastDescription>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {queued.action === undefined ? null : (
              <ToastAction asChild altText={queued.action.label}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    queued.action?.onAction();
                  }}
                >
                  {queued.action.label}
                </Button>
              </ToastAction>
            )}
            <ToastCloseButton />
          </div>
        </Toast>
      ))}
      <ToastViewport />
    </ToastProviderPrimitive>
  );
}

/** Convenience alias so a consumer can type a toast variant without importing ToastProps. */
export type ToastVariant = NonNullable<ToastProps['variant']>;

/**
 * The toast surface: one per document, mounted in the root layout.
 *
 * The context publishes only the three entry points, never the queue itself,
 * so a consumer cannot render the stack a second time or reach into the state.
 */
export interface ToastActions {
  readonly push: (request: ToastRequest) => void;
  readonly dismiss: (id: string) => void;
  readonly dismissAll: () => void;
}

const ToastContext = createContext<ToastActions | null>(null);

/**
 * Wrap the application once with this provider. It owns the queue, renders the
 * single viewport and the visible toasts, and publishes the entry points.
 *
 * The viewport is rendered even when the queue is empty, so the live region a
 * screen reader listens to is present before the first toast rather than
 * appearing with it: a region that arrives together with its message is a
 * region some readers never hear.
 */
export function ToastProvider({
  children,
}: {
  readonly children: React.ReactNode;
}): React.ReactElement {
  const toasts = useToastQueue();

  const actions = useMemo<ToastActions>(
    () => ({ push: toasts.push, dismiss: toasts.dismiss, dismissAll: toasts.dismissAll }),
    [toasts.push, toasts.dismiss, toasts.dismissAll],
  );

  return (
    <ToastContext.Provider value={actions}>
      {children}
      <div data-toast-stack="global">
        <ToastStack toasts={toasts.toasts} onDismiss={toasts.dismiss} />
      </div>
    </ToastContext.Provider>
  );
}

/**
 * The toast entry points for a component that needs them.
 *
 * A missing provider is a wiring defect rather than a runtime condition, so it
 * is loud where it can be caught - the development build - and a no-op in
 * production, where a broken page is worse than a missing notice that the page
 * itself also reports in place.
 */
export function useToast(): ToastActions {
  const actions = useContext(ToastContext);
  if (actions === null) {
    if (process.env.NODE_ENV !== 'production') {
      throw new RangeError('useToast requires a ToastProvider above it.');
    }
    return { push: () => undefined, dismiss: () => undefined, dismissAll: () => undefined };
  }
  return actions;
}
