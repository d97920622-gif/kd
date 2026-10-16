// path: components/ui/toast.tsx
'use client';

import * as ToastPrimitive from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';

import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils/cn';

/**
 * Toast: a short message about something that already happened.
 *
 * Radix renders the viewport as a live region, so a toast is announced
 * without stealing focus, and it can be dismissed by pointer, by keyboard and
 * by swipe. Three rules keep toasts from becoming noise:
 *
 *   1. A toast reports, it never asks. A decision belongs in a dialog,
 *      because a toast that scrolls away cannot hold a question.
 *   2. A toast never carries the only copy of a critical error. It is a
 *      notice; the failure itself is recorded and shown where the user was
 *      working, which survives a refresh and a screen reader review.
 *   3. A toast is short: a title, optionally one line of detail and an
 *      optional action. Anything longer is a page.
 *
 * Layering uses z-toast, the topmost layer: a toast must be readable while a
 * dialog or a sheet is open, and it must never be covered by one.
 */
export const ToastProviderPrimitive = ToastPrimitive.Provider;
export const ToastViewportPrimitive = ToastPrimitive.Viewport;
export const ToastTitle = ToastPrimitive.Title;
export const ToastDescription = ToastPrimitive.Description;
export const ToastAction = ToastPrimitive.Action;
export const ToastClose = ToastPrimitive.Close;

/** How long a toast stays before it dismisses itself, in milliseconds. */
export const TOAST_DURATION_MS = 5000;

export const toastVariants = cva(
  'pointer-events-auto group relative flex w-full items-start justify-between gap-4 rounded-md border p-4 shadow-2xl',
  {
    variants: {
      variant: {
        default: 'border-border bg-popover text-popover-foreground',
        success: 'border-success bg-success text-success-foreground',
        warning: 'border-warning bg-warning text-warning-foreground',
        destructive: 'border-destructive bg-destructive text-destructive-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export type ToastProps = React.ComponentProps<typeof ToastPrimitive.Root> &
  VariantProps<typeof toastVariants>;

export type ToastViewportProps = React.ComponentProps<typeof ToastPrimitive.Viewport>;

export type ToastActionProps = React.ComponentProps<typeof ToastPrimitive.Action>;

/** The stack of visible toasts, pinned to the bottom on small screens. */
export function ToastViewport({ className, ...props }: ToastViewportProps): React.ReactElement {
  return (
    <ToastPrimitive.Viewport
      className={cn(
        'fixed bottom-0 right-0 z-toast flex max-h-screen w-full flex-col gap-2 p-4 sm:max-w-sm',
        className,
      )}
      {...props}
    />
  );
}

export function Toast({ className, variant, ...props }: ToastProps): React.ReactElement {
  return <ToastPrimitive.Root className={cn(toastVariants({ variant }), className)} {...props} />;
}

export function ToastCloseButton({
  className,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Close>): React.ReactElement {
  return (
    <ToastPrimitive.Close
      aria-label={t('common.action_close')}
      className={cn(
        'shrink-0 rounded-sm text-current opacity-70 transition-opacity duration-fast ease-standard hover:opacity-100',
        className,
      )}
      toast-close=""
      {...props}
    >
      <X aria-hidden="true" className="size-4" />
    </ToastPrimitive.Close>
  );
}

export type ToastTitleProps = React.ComponentProps<typeof ToastPrimitive.Title>;

/**
 * Toast title. It is the announced line, so it must name the outcome in one
 * sentence and never repeat the page title.
 */
export function ToastTitleText({ className, ...props }: ToastTitleProps): React.ReactElement {
  return <ToastPrimitive.Title className={cn('text-sm font-semibold', className)} {...props} />;
}
