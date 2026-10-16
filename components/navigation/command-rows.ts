// path: components/navigation/command-rows.ts
import { resolveNavSection, type NavSectionInput } from '@/components/layout/nav-items';
import type { CommandListRow } from '@/components/navigation/command-list';
import { COMMANDS, chordForEntry, type CommandActionId } from '@/config/commands';
import { t } from '@/lib/i18n';
import { rankByFuzzyMatch } from '@/lib/utils/fuzzy';

/**
 * The palette's rows, built from the map and the registry and nothing else.
 *
 * This is the join the subtitle asks for and the place it is easiest to get
 * wrong: the palette offers two kinds of row - a page the reader may open, and
 * an action the product can run - and both have to be filtered, labelled and
 * ranked before anything is drawn. Doing it here means the palette renders rows
 * and the development specimen renders the same rows, so the evidence for the
 * command surface measures the code path the product uses rather than a second
 * one written for the evidence.
 *
 * Three rules the function encodes:
 *
 *   - **Pages come from the reader's navigation.** The sections are the ones the
 *     caller resolved for this audience and role, so an entry the reader is not
 *     offered is not merely hidden: it is not in the list to be found by
 *     typing. The palette never sees the raw map.
 *   - **A page's group is the map block's own heading,** because the reader
 *     already met that heading in the rail. An action's group comes from the
 *     registry. The two meet in one list under two headings, which is what a
 *     reader expects: "Pages" beside "Commands".
 *   - **The current page is marked from the resolution, not from a comparison
 *     written here.** `aria-current` is the same answer the rail gives, because
 *     it is literally the same resolved entry.
 *
 * The function is pure and server-safe: no hooks, no browser. That is what lets
 * the specimen render it during a server render and the palette call it from a
 * client component.
 */
export interface CommandRow extends CommandListRow {
  readonly kind: 'entry' | 'action';
  /** Where the row leads, for a page row. */
  readonly href?: string;
  /** What the row runs, for an action row. */
  readonly action?: CommandActionId;
}

/**
 * Rank inside each group rather than across the whole list: a group heading is
 * the only thing separating pages from commands, and a global sort would float
 * a command above the heading of the group it belongs to.
 */
function rankWithinGroups<
  T extends { readonly id: string; readonly label: string; readonly group: string },
>(query: string, rows: readonly T[]): readonly T[] {
  const ranked: T[] = [];
  let group: T[] = [];
  const flush = (): void => {
    if (group.length > 0) {
      ranked.push(
        ...rankByFuzzyMatch(query, group, (row) => `${row.label} ${row.group} ${row.id}`),
      );
      group = [];
    }
  };
  for (const row of rows) {
    const last = group[group.length - 1];
    if (last !== undefined && last.group !== row.group) {
      flush();
    }
    group.push(row);
  }
  flush();
  return ranked;
}

/**
 * Every row this reader can be offered, ranked against the query.
 *
 * The empty query is not a special case: it matches everything with one score,
 * so the palette opens on the full list and the specimen renders the same list
 * without a search term. The match text is the label, the group and the id, so
 * `palette` finds the command by its id as well as by its label - and the
 * reader still sees only the label, because the id never reaches the markup.
 */
export function commandRows(
  sections: readonly NavSectionInput[],
  activeHref: string | null,
  query: string,
  options: { readonly includeActions?: boolean } = {},
): readonly CommandRow[] {
  const rows: CommandRow[] = [];
  for (const section of sections) {
    const resolved = resolveNavSection(section, activeHref);
    for (const entry of resolved.entries) {
      rows.push({
        id: entry.id,
        kind: 'entry',
        label: entry.label,
        description: entry.description,
        group: resolved.label ?? t('commands.label_group_pages'),
        chord: chordForEntry(entry.id),
        current: entry.active,
        href: entry.href,
      });
    }
  }

  if (options.includeActions !== false) {
    for (const command of COMMANDS) {
      if (command.kind !== 'action') {
        continue;
      }
      rows.push({
        id: command.id,
        kind: 'action',
        action: command.action,
        label: t(command.labelKey),
        group: t(command.groupKey),
        chord: command.chord ?? null,
        current: false,
      });
    }
  }

  return rankWithinGroups(query, rows);
}
