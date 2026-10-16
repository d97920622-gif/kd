// path: components/ui/tabs.tsx
'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cn } from '@/lib/utils/cn';

/**
 * Tabs: one panel visible at a time within the same context.
 *
 * Arrows move between tabs, Home and End jump to the ends, only the selected
 * tab is in the tab order, and each tab points at its panel with
 * aria-controls, so a screen reader user knows which panel belongs to which
 * tab. Radix also keeps the panel mounted state correct: an unmounted panel
 * cannot hold focus or a scroll position, so panels that must survive a tab
 * change are rendered inside the same TabsContent with forceMount.
 *
 * A tab changes what is shown inside one task. Moving between tasks is
 * navigation (a link or a sidebar entry), not a tab, and a long form is not
 * a tab set: it is one form with sections.
 *
 * The tab list scrolls horizontally on a narrow screen instead of wrapping,
 * which keeps the order of the tabs readable at 320px.
 */
export const Tabs = TabsPrimitive.Root;

export type TabsListProps = React.ComponentProps<typeof TabsPrimitive.List>;

export type TabsTriggerProps = React.ComponentProps<typeof TabsPrimitive.Trigger>;

export type TabsContentProps = React.ComponentProps<typeof TabsPrimitive.Content>;

export function TabsList({ className, ...props }: TabsListProps): React.ReactElement {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex max-w-full items-center justify-start gap-1 overflow-x-auto rounded-md bg-muted p-1 text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: TabsTriggerProps): React.ReactElement {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'inline-flex min-h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-colors duration-fast ease-standard disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: TabsContentProps): React.ReactElement {
  return <TabsPrimitive.Content className={cn('mt-4', className)} {...props} />;
}
