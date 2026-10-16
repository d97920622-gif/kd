// path: components/ui/dialog.tsx
'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils/cn';

/**
 * Dialog: a modal surface for a decision or a short task.
 *
 * Accessibility comes from Radix and is the reason a dialog is never built
 * from a positioned div: focus moves into the dialog on open and returns to
 * the element that opened it on close, Tab and Shift+Tab stay inside the
 * panel, Escape closes it, the rest of the page is inert to assistive
 * technology through aria-hidden on the body, and a title is announced.
 *
 * Every dialog must render a DialogTitle. Without one the panel has no
 * accessible name, and a screen reader user hears an unlabelled group.
 * DialogDescription is optional; when it is omitted pass aria-describedby={undefined}
 * to DialogContent so assistive technology does not wait for a description
 * that will never exist.
 *
 * Layering follows the z-index ladder: the backdrop sits at z-overlay and the
 * panel at z-modal, so a dropdown or a select opened inside the dialog still
 * paints above it without a special case.
 */
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogPortal = DialogPrimitive.Portal;

export type DialogContentProps = React.ComponentProps<typeof DialogPrimitive.Content>;

export type DialogOverlayProps = React.ComponentProps<typeof DialogPrimitive.Overlay>;

export function DialogOverlay({ className, ...props }: DialogOverlayProps): React.ReactElement {
  return (
    <DialogPrimitive.Overlay
      className={cn('fixed inset-0 z-overlay bg-foreground/60', className)}
      {...props}
    />
  );
}

export function DialogContent({
  className,
  children,
  ...props
}: DialogContentProps): React.ReactElement {
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-modal grid max-h-screen w-11/12 max-w-dialog -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-xl border bg-background p-6 shadow-xl',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          aria-label={t('common.action_close')}
          className="absolute right-4 top-4 rounded-sm text-muted-foreground transition-colors duration-fast ease-standard hover:text-foreground"
        >
          <X aria-hidden="true" className="size-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({
  className,
  ...props
}: React.ComponentProps<'div'>): React.ReactElement {
  return <div className={cn('flex flex-col gap-2 text-left', className)} {...props} />;
}

export function DialogFooter({
  className,
  ...props
}: React.ComponentProps<'div'>): React.ReactElement {
  return (
    <div
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
}

export function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>): React.ReactElement {
  return (
    <DialogPrimitive.Title
      className={cn('text-lg font-semibold leading-snug tracking-tight', className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>): React.ReactElement {
  return (
    <DialogPrimitive.Description
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}
