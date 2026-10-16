// path: lib/hooks/use-toast.tsx
'use client';

import { useCallback, useMemo, useReducer } from 'react';

import {
  TOAST_DURATION_MS,
  Toast,
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
 */
export const TOAST_LIMIT = 3;

/** A toast request from application code. */
export interface ToastRequest {
  readonly title: string;
  readonly description?: string;
  readonly variant?: 'default' | 'success' | 'warning' | 'destructive';
  readonly duration?: number;
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
          <ToastCloseButton />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProviderPrimitive>
  );
}

/** Convenience alias so a consumer can type a toast variant without importing ToastProps. */
export type ToastVariant = NonNullable<ToastProps['variant']>;
