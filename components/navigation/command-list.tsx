// path: components/navigation/command-list.tsx
import { KeyChord } from '@/components/ui/kbd';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils/cn';

/**
 * The palette's results, as a listbox.
 *
 * This is the palette's body split out from the palette's dialog, and the split
 * is deliberate: the dialog is a portal, so it does not exist in a server
 * response and cannot be measured there, while the list is markup and can. The
 * development specimen renders this component directly, which is how the
 * rendered evidence for sub-step 1.23 checks the roles, the ids and the labels
 * without a browser.
 *
 * The interaction model is the ARIA combobox one, and it is worth stating
 * because it is the part that is usually wrong:
 *
 *   - **Focus stays in the input.** The reader types in the field; the field
 *     owns `role="combobox"`, `aria-expanded`, `aria-controls` and
 *     `aria-activedescendant`, and moving down the list moves that attribute
 *     rather than the focus. A palette that moves focus into the list loses the
 *     reader's typing on the first arrow key.
 *   - **The options are not focusable.** No tabindex, no buttons: an option is
 *     a row in a listbox, and the only way it is chosen is through the input
 *     that points at it. This is also what keeps Tab inside the dialog.
 *   - **The current page is marked, and it is not a claim.** An option that
 *     leads to the page the reader is already on carries `aria-current="page"`,
 *     derived from the resolution the rail uses - never written as a literal,
 *     which would claim it on every page.
 *   - **The group heading names the group.** Each group of options is a
 *     `role="group"` labelled by its visible heading, so a screen reader
 *     announces "Pages, Invoices" rather than reading the heading as one more
 *     option.
 */
export interface CommandListRow {
  /** Stable id, derived from the map entry or the registry row. */
  readonly id: string;
  readonly label: string;
  readonly group: string;
  /** The chord that runs this row, or null when it is search-only. */
  readonly chord: string | null;
  readonly current: boolean;
  readonly description?: string;
}

export interface CommandListProps {
  readonly rows: readonly CommandListRow[];
  /** Id of the row the input's `aria-activedescendant` points at. */
  readonly activeId: string | null;
  readonly listboxId: string;
  readonly optionIdPrefix: string;
  /** Rendered in place of the list when nothing matches. */
  readonly emptyLabel: string;
  readonly className?: string;
  /** Called when a row becomes the active one, by pointer or by keyboard. */
  readonly onActivate?: (id: string) => void;
  /** Called when a row is chosen. */
  readonly onSelect?: (id: string) => void;
}

interface CommandGroup {
  readonly name: string;
  readonly rows: readonly CommandListRow[];
}

/** Consecutive rows of one group, in the order the caller ranked them. */
function groupRows(rows: readonly CommandListRow[]): readonly CommandGroup[] {
  const groups: CommandGroup[] = [];
  for (const row of rows) {
    const last = groups[groups.length - 1];
    if (last !== undefined && last.name === row.group) {
      groups[groups.length - 1] = { name: last.name, rows: [...last.rows, row] };
      continue;
    }
    groups.push({ name: row.group, rows: [row] });
  }
  return groups;
}

export function CommandList({
  rows,
  activeId,
  listboxId,
  optionIdPrefix,
  emptyLabel,
  className,
  onActivate,
  onSelect,
}: CommandListProps): React.ReactElement {
  if (rows.length === 0) {
    return <p className={cn('px-3 py-6 text-sm text-muted-foreground', className)}>{emptyLabel}</p>;
  }

  return (
    <div
      role="listbox"
      id={listboxId}
      aria-label={t('commands.label_palette_title')}
      data-command-listbox={listboxId}
      className={cn('grid gap-1', className)}
    >
      {groupRows(rows).map((group) => {
        const headingId = `${optionIdPrefix}-group-${group.name.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}`;
        return (
          <div key={group.name} role="group" aria-labelledby={headingId} className="grid gap-1">
            {/* A visual heading, not a heading element: inside a listbox the
                only permitted children are groups and options, so the group is
                named by aria-labelledby instead of by a heading role. */}
            <span
              id={headingId}
              className="px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              {group.name}
            </span>
            {group.rows.map((row) => {
              const active = row.id === activeId;
              return (
                <div
                  key={row.id}
                  id={`${optionIdPrefix}-${row.id}`}
                  role="option"
                  aria-selected={active}
                  aria-current={row.current ? 'page' : undefined}
                  data-command={row.id}
                  onClick={onSelect === undefined ? undefined : () => onSelect(row.id)}
                  onMouseMove={onActivate === undefined ? undefined : () => onActivate(row.id)}
                  className={cn(
                    'flex min-h-touch cursor-default items-center gap-3 rounded-md px-3 text-base',
                    active ? 'bg-accent text-accent-foreground' : 'text-foreground',
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{row.label}</span>
                  {row.current ? (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {t('commands.label_palette_current')}
                    </span>
                  ) : null}
                  {row.chord === null ? null : (
                    <span className="shrink-0">
                      <KeyChord chord={row.chord} />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
