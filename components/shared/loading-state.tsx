// path: components/shared/loading-state.tsx
import { Skeleton, SkeletonText } from '@/components/ui/skeleton';
import { t, type EnglishStringKey } from '@/lib/i18n';
import { cn } from '@/lib/utils/cn';

/**
 * LoadingState: the shape of a page that has not arrived yet, in the four
 * shapes the product's pages actually have.
 *
 * The skeleton library in `components/ui/skeleton.tsx` draws shapes; this
 * component knows the *layouts* the product loads in, so a page does not
 * re-invent a spinner-with-three-bars four times. The four layouts are the four
 * things a page can be: a table of records, a list of rows, a form, and a
 * summary of figures.
 *
 * Three rules the component encodes, all of them about the moment after the
 * data lands:
 *
 *   1. **The skeleton matches the content.** Every block is the height and the
 *      width of the element it replaces, using the same token classes, so
 *      nothing shifts when the real content arrives. A skeleton that is the
 *      wrong shape is worse than no skeleton: the page jumps exactly when the
 *      reader has started to aim at something.
 *   2. **The live region says what is loading.** One `role="status"` region with
 *      a sentence from the catalogue - "Loading the table. Rows appear in a
 *      moment." - announces itself once, and the shapes below it are
 *      `aria-hidden` (every `Skeleton` already is), so a screen reader hears one
 *      sentence instead of a hundred decorative boxes.
 *   3. **The count follows the data, not the screen.** `rows` defaults to five,
 *      which is what fits above the fold on a phone, and a caller that knows how
 *      many rows to expect passes the number it knows.
 *
 * The component is deliberately server-safe: it renders markup and reads the
 * catalogue, and `next/navigation`'s `loading.tsx` convention renders it during
 * a server render with no client JavaScript involved.
 */
export type LoadingLayout = 'table' | 'list' | 'form' | 'card';

export interface LoadingStateProps {
  readonly layout: LoadingLayout;
  readonly rows?: number;
  /** Catalogue key of the announcement; each layout has a default. */
  readonly labelKey?: EnglishStringKey;
  readonly className?: string;
}

const DEFAULT_LABEL_KEY: Record<LoadingLayout, EnglishStringKey> = {
  table: 'states.label_loading_table',
  list: 'states.label_loading_list',
  form: 'states.label_loading_form',
  card: 'states.label_loading_card',
};

function TableLoading({ rows }: { readonly rows: number }): React.ReactElement {
  return (
    <div className="grid gap-3">
      <div className="flex gap-4">
        {[0, 1, 2, 3].map((cell) => (
          <Skeleton key={cell} shape="line" className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, row) => row).map((row) => (
        <div key={row} className="flex gap-4">
          {[0, 1, 2, 3].map((cell) => (
            <Skeleton key={cell} shape="line" className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

function ListLoading({ rows }: { readonly rows: number }): React.ReactElement {
  return (
    <div className="grid gap-4">
      {Array.from({ length: rows }, (_, row) => row).map((row) => (
        <div key={row} className="flex items-center gap-4">
          <Skeleton shape="circle" className="size-11" />
          <div className="grid flex-1 gap-2">
            <Skeleton shape="line" className="w-2/5" />
            <Skeleton shape="line" className="w-3/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

function FormLoading(): React.ReactElement {
  return (
    <div className="grid gap-6">
      {[0, 1, 2].map((field) => (
        <div key={field} className="grid gap-2">
          <Skeleton shape="line" className="w-24" />
          <Skeleton shape="block" className="h-11 w-full" />
        </div>
      ))}
      <Skeleton shape="block" className="w-40 h-11" />
    </div>
  );
}

function CardLoading({ rows }: { readonly rows: number }): React.ReactElement {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: rows }, (_, card) => card).map((card) => (
        <div key={card} className="grid gap-3 rounded-lg border border-border bg-card p-6">
          <Skeleton shape="line" className="w-20" />
          <Skeleton shape="line" className="w-32 h-8" />
          <SkeletonText lines={2} />
        </div>
      ))}
    </div>
  );
}

export function LoadingState({
  layout,
  rows = 5,
  labelKey,
  className,
}: LoadingStateProps): React.ReactElement {
  const safeRows = Math.max(1, Math.min(rows, 20));
  return (
    <div
      role="status"
      aria-live="polite"
      data-loading={layout}
      className={cn('grid gap-4', className)}
    >
      <p className="sr-only">{t(labelKey ?? DEFAULT_LABEL_KEY[layout])}</p>
      {layout === 'table' ? <TableLoading rows={safeRows} /> : null}
      {layout === 'list' ? <ListLoading rows={safeRows} /> : null}
      {layout === 'form' ? <FormLoading /> : null}
      {layout === 'card' ? <CardLoading rows={safeRows} /> : null}
    </div>
  );
}
