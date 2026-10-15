// path: components/ui/select.tsx
'use client';

import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils/cn';

/**
 * Select: a listbox built on Radix Select.
 *
 * A native select is not used because a native option list cannot show the
 * two line rows this product needs (an invoice number above its customer
 * name) and cannot be themed. Radix keeps the accessibility contract a
 * native select has: role="combobox" with aria-expanded on the trigger,
 * role="listbox" with role="option" items, arrow key and type-ahead
 * navigation, Escape to close, focus returned to the trigger, and a hidden
 * native select so the value still submits inside a plain form.
 *
 * Layering follows the z-index ladder: the content sits at z-dropdown, above
 * a modal, because a select is often opened inside a dialog.
 *
 * The two scroll buttons are icon-only, so each one carries an accessible
 * name from the string catalogue, and the icons themselves are hidden from
 * assistive technology.
 *
 * The placeholder is passed by the caller through SelectValue, so no display
 * text lives in this file.
 */
export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export type SelectTriggerProps = React.ComponentProps<typeof SelectPrimitive.Trigger>;

export type SelectContentProps = React.ComponentProps<typeof SelectPrimitive.Content>;

export type SelectItemProps = React.ComponentProps<typeof SelectPrimitive.Item>;

export type SelectLabelProps = React.ComponentProps<typeof SelectPrimitive.Label>;

export type SelectSeparatorProps = React.ComponentProps<typeof SelectPrimitive.Separator>;

export type SelectScrollButtonProps = React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>;

export function SelectTrigger({
  className,
  children,
  ...props
}: SelectTriggerProps): React.ReactElement {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        'flex h-11 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm transition-colors duration-fast ease-standard disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive data-[placeholder]:text-muted-foreground [&>span]:truncate',
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function SelectContent({
  className,
  children,
  position = 'popper',
  ...props
}: SelectContentProps): React.ReactElement {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className={cn(
          'relative z-dropdown max-h-[var(--radix-select-content-available-height)] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md',
          position === 'popper' && 'min-w-[var(--radix-select-trigger-width)]',
          className,
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export function SelectLabel({ className, ...props }: SelectLabelProps): React.ReactElement {
  return (
    <SelectPrimitive.Label
      className={cn('px-2 py-1.5 text-sm font-semibold text-muted-foreground', className)}
      {...props}
    />
  );
}

export function SelectItem({ className, children, ...props }: SelectItemProps): React.ReactElement {
  return (
    <SelectPrimitive.Item
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-ring transition-colors duration-fast ease-standard focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <span className="absolute left-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check aria-hidden="true" className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

export function SelectSeparator({ className, ...props }: SelectSeparatorProps): React.ReactElement {
  return (
    <SelectPrimitive.Separator className={cn('-mx-1 my-1 h-px bg-border', className)} {...props} />
  );
}

export function SelectScrollUpButton({
  className,
  ...props
}: SelectScrollButtonProps): React.ReactElement {
  return (
    <SelectPrimitive.ScrollUpButton
      {...props}
      aria-label={t('ui.scroll_up')}
      className={cn('flex cursor-default items-center justify-center py-1', className)}
    >
      <ChevronUp aria-hidden="true" className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  );
}

export function SelectScrollDownButton({
  className,
  ...props
}: SelectScrollButtonProps): React.ReactElement {
  return (
    <SelectPrimitive.ScrollDownButton
      {...props}
      aria-label={t('ui.scroll_down')}
      className={cn('flex cursor-default items-center justify-center py-1', className)}
    >
      <ChevronDown aria-hidden="true" className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  );
}
