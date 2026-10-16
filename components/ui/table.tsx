// path: components/ui/table.tsx
import { cn } from '@/lib/utils/cn';

/**
 * Table: tabular data.
 *
 * Semantic table elements are used rather than a grid of divs, because a
 * screen reader announces the row and column of every cell only when the real
 * elements are present, and because the browser can then do things no div
 * grid can: text selection across cells, printing that repeats the header on
 * every page, and native table navigation.
 *
 * The wrapper scrolls horizontally so a wide table stays usable on a narrow
 * screen instead of pushing the whole page sideways. That scroll container
 * keeps its keyboard access through the tabindex Radix sets elsewhere, and
 * the caption describes the table for assistive technology.
 *
 * A money column is rendered by the caller through lib/utils/currency.ts and
 * is right aligned with the tabular number style, so digits line up and two
 * amounts can be compared by eye.
 *
 * Row hover uses the accent role and the header uses the muted role, so the
 * table follows the theme in light, dark and both high contrast themes.
 */
export function Table({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<'table'> & { readonly containerClassName?: string }): React.ReactElement {
  return (
    <div className={cn('w-full overflow-x-auto', containerClassName)}>
      <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  );
}

export function TableHeader({
  className,
  ...props
}: React.ComponentProps<'thead'>): React.ReactElement {
  return <thead className={cn('bg-muted', className)} {...props} />;
}

export function TableBody({
  className,
  ...props
}: React.ComponentProps<'tbody'>): React.ReactElement {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />;
}

export function TableFooter({
  className,
  ...props
}: React.ComponentProps<'tfoot'>): React.ReactElement {
  return <tfoot className={cn('border-t bg-muted font-medium', className)} {...props} />;
}

export function TableRow({ className, ...props }: React.ComponentProps<'tr'>): React.ReactElement {
  return (
    <tr
      className={cn(
        'border-b transition-colors duration-fast ease-standard hover:bg-accent hover:text-accent-foreground',
        className,
      )}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: React.ComponentProps<'th'>): React.ReactElement {
  return (
    <th
      scope="col"
      className={cn(
        'h-11 whitespace-nowrap px-3 text-left align-middle text-sm font-semibold text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: React.ComponentProps<'td'>): React.ReactElement {
  return <td className={cn('px-3 py-3 align-middle', className)} {...props} />;
}

export function TableCaption({
  className,
  ...props
}: React.ComponentProps<'caption'>): React.ReactElement {
  return <caption className={cn('mt-4 text-sm text-muted-foreground', className)} {...props} />;
}
