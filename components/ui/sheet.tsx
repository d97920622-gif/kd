// path: components/ui/sheet.tsx
'use client';

import * as SheetPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';

import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils/cn';

/**
 * Sheet: a panel that slides in from an edge.
 *
 * A sheet is a dialog that occupies an edge instead of the centre, so it is
 * built on Radix Dialog rather than on a second modal implementation: the
 * same focus trap, the same Escape handling, the same inert background and
 * the same requirement for a title.
 *
 * The bottom variant is the mobile pattern (a filter panel, a quick action
 * list) and is constrained to the viewport height so the action buttons stay
 * reachable on a small screen. The side variants are the desktop pattern.
 *
 * Layering matches the dialog: backdrop at z-overlay, panel at z-modal.
 */
export const Sheet = SheetPrimitive.Root;
export const SheetTrigger = SheetPrimitive.Trigger;
export const SheetClose = SheetPrimitive.Close;
export const SheetPortal = SheetPrimitive.Portal;

export type SheetContentProps = React.ComponentProps<typeof SheetPrimitive.Content> &
  VariantProps<typeof sheetVariants>;

export type SheetOverlayProps = React.ComponentProps<typeof SheetPrimitive.Overlay>;

const sheetVariants = cva(
  'fixed z-modal flex flex-col gap-4 overflow-y-auto bg-background p-6 shadow-xl transition-transform duration-slow ease-enter',
  {
    variants: {
      side: {
        // Edge panels span a large fraction of the viewport rather than a
        // computed pixel width: a fraction adapts to every screen, and the
        // visible sliver of the page behind it is what tells the user that
        // the panel can be dismissed.
        top: 'inset-x-0 top-0 max-h-screen rounded-b-xl border-b',
        bottom: 'inset-x-0 bottom-0 max-h-screen rounded-t-xl border-t',
        left: 'inset-y-0 left-0 h-full w-4/5 max-w-sheet rounded-r-xl border-r',
        right: 'inset-y-0 right-0 h-full w-4/5 max-w-sheet rounded-l-xl border-l',
      },
    },
    defaultVariants: {
      side: 'right',
    },
  },
);

export function SheetOverlay({ className, ...props }: SheetOverlayProps): React.ReactElement {
  return (
    <SheetPrimitive.Overlay
      className={cn('fixed inset-0 z-overlay bg-foreground/60', className)}
      {...props}
    />
  );
}

export function SheetContent({
  className,
  children,
  side = 'right',
  ...props
}: SheetContentProps): React.ReactElement {
  return (
    <SheetPrimitive.Portal>
      <SheetOverlay />
      <SheetPrimitive.Content className={cn(sheetVariants({ side }), className)} {...props}>
        {children}
        <SheetPrimitive.Close
          aria-label={t('common.action_close')}
          className="absolute right-4 top-4 rounded-sm text-muted-foreground transition-colors duration-fast ease-standard hover:text-foreground"
        >
          <X aria-hidden="true" className="size-4" />
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

export function SheetHeader({
  className,
  ...props
}: React.ComponentProps<'div'>): React.ReactElement {
  return <div className={cn('flex flex-col gap-2 text-left', className)} {...props} />;
}

export function SheetFooter({
  className,
  ...props
}: React.ComponentProps<'div'>): React.ReactElement {
  return <div className={cn('mt-auto flex flex-col gap-2', className)} {...props} />;
}

export function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>): React.ReactElement {
  return (
    <SheetPrimitive.Title
      className={cn('text-lg font-semibold leading-snug tracking-tight', className)}
      {...props}
    />
  );
}

export function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>): React.ReactElement {
  return (
    <SheetPrimitive.Description
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}
