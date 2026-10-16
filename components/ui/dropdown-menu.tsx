// path: components/ui/dropdown-menu.tsx
'use client';

import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Check, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils/cn';

/**
 * Dropdown menu: a list of actions opened from a trigger.
 *
 * Radix supplies the menu contract assistive technology expects: role="menu"
 * with role="menuitem" children, arrow key navigation with wrap-around,
 * type-ahead, Home and End, Escape to close with focus returned to the
 * trigger, and closing on outside interaction. A list of clickable divs
 * provides none of that, which is why every action list uses this primitive.
 *
 * Two rules that keep the pattern usable:
 *   1. A menu item is an action, never a form control. A checkbox or a radio
 *      group inside a menu uses CheckboxItem or RadioItem so the state is
 *      announced; anything more complex belongs in a dialog.
 *   2. A destructive action is separated and labelled with the destructive
 *      role, so it is never the item a fast pointer lands on by accident.
 *
 * Layering uses z-dropdown, above a modal, because a menu is often opened
 * from a row inside a dialog.
 */
export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;
export const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
export const DropdownMenuSub = DropdownMenuPrimitive.Sub;
export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

export type DropdownMenuContentProps = React.ComponentProps<typeof DropdownMenuPrimitive.Content>;

export type DropdownMenuItemProps = React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  /** Renders the item with the destructive role; use for delete and revoke. */
  readonly destructive?: boolean;
};

export type DropdownMenuCheckboxItemProps = React.ComponentProps<
  typeof DropdownMenuPrimitive.CheckboxItem
>;

export type DropdownMenuRadioItemProps = React.ComponentProps<
  typeof DropdownMenuPrimitive.RadioItem
>;

export type DropdownMenuLabelProps = React.ComponentProps<typeof DropdownMenuPrimitive.Label>;

export type DropdownMenuSeparatorProps = React.ComponentProps<
  typeof DropdownMenuPrimitive.Separator
>;

export type DropdownMenuShortcutProps = React.ComponentProps<'span'>;

export type DropdownMenuSubTriggerProps = React.ComponentProps<
  typeof DropdownMenuPrimitive.SubTrigger
>;

export type DropdownMenuSubContentProps = React.ComponentProps<
  typeof DropdownMenuPrimitive.SubContent
>;

export function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: DropdownMenuContentProps): React.ReactElement {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          'z-dropdown max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-menu overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

export function DropdownMenuItem({
  className,
  destructive = false,
  ...props
}: DropdownMenuItemProps): React.ReactElement {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-2 text-sm transition-colors duration-fast ease-standard focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        destructive === true && 'text-destructive focus:bg-destructive/10 focus:text-destructive',
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: DropdownMenuCheckboxItemProps): React.ReactElement {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      checked={checked}
      className={cn(
        'relative flex cursor-default select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm transition-colors duration-fast ease-standard focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <span className="absolute left-2 flex size-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Check aria-hidden="true" className="size-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

export function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: DropdownMenuRadioItemProps): React.ReactElement {
  return (
    <DropdownMenuPrimitive.RadioItem
      className={cn(
        'relative flex cursor-default select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm transition-colors duration-fast ease-standard focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <span className="absolute left-2 flex size-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <span aria-hidden="true" className="block size-2 rounded-full bg-primary" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
}

export function DropdownMenuLabel({
  className,
  ...props
}: DropdownMenuLabelProps): React.ReactElement {
  return (
    <DropdownMenuPrimitive.Label
      className={cn('px-2 py-1.5 text-sm font-semibold text-muted-foreground', className)}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: DropdownMenuSeparatorProps): React.ReactElement {
  return (
    <DropdownMenuPrimitive.Separator
      className={cn('-mx-1 my-1 h-px bg-border', className)}
      {...props}
    />
  );
}

export function DropdownMenuShortcut({
  className,
  ...props
}: DropdownMenuShortcutProps): React.ReactElement {
  return (
    <span
      className={cn('ml-auto text-xs tracking-widest text-muted-foreground', className)}
      {...props}
    />
  );
}

export function DropdownMenuSubTrigger({
  className,
  children,
  ...props
}: DropdownMenuSubTriggerProps): React.ReactElement {
  return (
    <DropdownMenuPrimitive.SubTrigger
      className={cn(
        'flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-2 text-sm transition-colors duration-fast ease-standard focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRight aria-hidden="true" className="ml-auto size-4" />
    </DropdownMenuPrimitive.SubTrigger>
  );
}

export function DropdownMenuSubContent({
  className,
  ...props
}: DropdownMenuSubContentProps): React.ReactElement {
  return (
    <DropdownMenuPrimitive.SubContent
      className={cn(
        'z-dropdown min-w-menu rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
        className,
      )}
      {...props}
    />
  );
}
