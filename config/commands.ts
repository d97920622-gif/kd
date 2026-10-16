// path: config/commands.ts
/**
 * The command registry: every action the product can run, and the chord that
 * runs it.
 *
 * The map (`config/nav-map.ts`) answers "where can the reader go". This file
 * answers "what can the reader do", and the two are deliberately separate:
 * a destination is a page that exists, while a command is an action that may
 * exist without one - focusing the main landmark has no page of its own.
 *
 * THREE DECISIONS
 *
 * 1. **A command that navigates names a map entry, never a path.** The entry
 *    carries the destination, the label and the role list, so a command that
 *    wrote its own href would be the second place a route lives - and the
 *    second place is the one that goes stale. `kind: 'entry'` rows exist only to
 *    attach a chord to an entry, which is why they carry no label of their own:
 *    the label the reader sees is the entry's, whether the palette or the rail
 *    draws it.
 *
 * 2. **An action is a closed set.** `COMMAND_ACTIONS` is the list of things the
 *    product can do in place, and a command row can only name one of them. The
 *    alternative - a command carrying a callback - is a registry that can only
 *    be read by the module that renders it, and the shortcuts reference page
 *    has to read it too.
 *
 * 3. **A chord is declared once, in canonical form.** `mod+k`, not `cmd+k` and
 *    not `ctrl+k`: `lib/utils/key-chord.ts` owns what a chord means and how it
 *    is matched, and this file only says which chord belongs to which command.
 *    Two commands may not declare the same chord, and the check fails the build
 *    when they do, because the second handler is the one that never runs and
 *    nobody notices which one it was.
 *
 * APPEND PROTOCOL. This file is an append target, like the map: a later step
 * adds its own rows inside the reserved block at the end, never reorders the
 * existing ones and never renames an id, because a chord, a saved view and a
 * documentation page all end up keyed by these ids.
 */
import type { PlatformRole } from '@/components/layout/role-framing';
import { liveEntriesFor, NAV_MAP, type NavAudience } from '@/config/nav-map';
import type { EnglishStringKey } from '@/lib/i18n';

/**
 * Everything the product can do without leaving the page it is on.
 *
 * The list is closed on purpose: an action that is not here cannot be run by
 * the palette, the palette does not need to know which component implements it,
 * and the shortcuts page can describe it without importing one. Adding a row is
 * a deliberate, reviewable change to the product's command surface.
 */
export const COMMAND_ACTIONS = ['open-command-palette', 'focus-main-content'] as const;
export type CommandActionId = (typeof COMMAND_ACTIONS)[number];

/**
 * The ids the product's own code refers to by name.
 *
 * A caller that needs "the command that opens the palette" asks for it here
 * rather than spelling `palette.open`, so an id is written once - in the
 * registry - and the one place that has to change when a row is renamed is the
 * row itself. The union is closed for the same reason: a typo is a compile
 * error, not a command that silently disappears from the palette.
 */
export const COMMAND_IDS = {
  openPalette: 'palette.open',
  focusMain: 'main.focus',
  openShortcuts: 'shortcuts.open',
} as const;
export type CommandId = (typeof COMMAND_IDS)[keyof typeof COMMAND_IDS];

/** A command that attaches a chord to a destination the map already declares. */
export interface EntryCommand {
  readonly id: string;
  readonly kind: 'entry';
  /** The map entry this chord reaches. The entry owns the label and the path. */
  readonly entryId: string;
  readonly chord: string;
}

/** A command that runs an action in place. */
export interface ActionCommand {
  readonly id: string;
  readonly kind: 'action';
  readonly action: CommandActionId;
  /** The command's own label: an action has no entry to borrow one from. */
  readonly labelKey: EnglishStringKey;
  /** Heading it is listed under, in the palette and on the shortcuts page. */
  readonly groupKey: EnglishStringKey;
  /** The chord that runs it, or absent when it is only reachable by search. */
  readonly chord?: string;
}

export type CommandDefinition = EntryCommand | ActionCommand;

export const COMMANDS: readonly CommandDefinition[] = [
  // -------------------------------------------------------------------------
  // Global. Sub-step 1.23.
  // -------------------------------------------------------------------------
  {
    id: 'palette.open',
    kind: 'action',
    action: 'open-command-palette',
    labelKey: 'commands.label_action_open_palette',
    groupKey: 'commands.label_group_global',
    chord: 'mod+k',
  },
  {
    id: 'main.focus',
    kind: 'action',
    action: 'focus-main-content',
    labelKey: 'commands.label_action_focus_main',
    groupKey: 'commands.label_group_global',
  },
  {
    id: 'shortcuts.open',
    kind: 'entry',
    entryId: 'shortcuts',
    chord: '?',
  },

  // -------------------------------------------------------------------------
  // Reserved: session and account (step 3). Signing out, switching tenant,
  // opening the account menu - commands whose action ids arrive with the
  // session, because an action that cannot be run is not a command.
  // Add rows here.
  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------
  // Reserved: quick actions (steps 5 to 13). Creating an invoice, adding a
  // client, recording a payment, running a report. Each row names an action
  // added to COMMAND_ACTIONS in the step that implements it, and the map entry
  // its page is registered under.
  // Add rows here.
  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------
  // Reserved: record search (steps 5 and 6). The palette's third source, which
  // searches records rather than commands. It is a source, not a command row:
  // it lands here as an action that opens the search, and the source itself
  // belongs to the service layer of the step that owns the records.
  // Add rows here.
  // -------------------------------------------------------------------------
];

/** One row of the shortcuts reference page: a label, a chord and its group. */
export interface ShortcutRow {
  readonly id: string;
  readonly labelKey: EnglishStringKey;
  readonly groupKey: EnglishStringKey;
  readonly chord: string;
  /** Where the row's command leads, when it leads anywhere. */
  readonly href?: string;
}

/**
 * The command with this id, or undefined. The lookup is by id rather than by
 * position so that appending a row never changes what an existing caller gets.
 */
export function commandById(id: string): CommandDefinition | undefined {
  return COMMANDS.find((command) => command.id === id);
}

/** The map entry a command reaches, when it reaches one. */
export function entryCommandTarget(
  id: string,
): { readonly entryId: string; readonly chord: string } | null {
  const command = commandById(id);
  return command !== undefined && command.kind === 'entry'
    ? { entryId: command.entryId, chord: command.chord }
    : null;
}

/** The command bound to an action, in registry order, or undefined. */
export function commandForAction(action: CommandActionId): ActionCommand | undefined {
  return COMMANDS.find(
    (command): command is ActionCommand => command.kind === 'action' && command.action === action,
  );
}

/** The chord that reaches a map entry, or null when nothing reaches it. */
export function chordForEntry(entryId: string): string | null {
  const command = COMMANDS.find(
    (candidate): candidate is EntryCommand =>
      candidate.kind === 'entry' && candidate.entryId === entryId,
  );
  return command === undefined ? null : command.chord;
}

/** Every command that carries a chord, in registry order. */
export function chordsInOrder(): readonly { readonly id: string; readonly chord: string }[] {
  return COMMANDS.filter(
    (command): command is CommandDefinition & { readonly chord: string } =>
      command.chord !== undefined,
  ).map((command) => ({ id: command.id, chord: command.chord }));
}

/**
 * The heading an entry is listed under, which is the heading of the block that
 * declares it. The registry reads the map's structure rather than keeping its
 * own copy of which page sits under which heading.
 */
function blockLabelKeyFor(entryId: string): EnglishStringKey | null {
  for (const block of NAV_MAP) {
    if (block.entries.some((entry) => entry.id === entryId)) {
      return block.labelKey;
    }
  }
  return null;
}

/**
 * The rows the shortcuts reference page lists for one reader.
 *
 * Two sources, joined here so the page renders one list:
 *
 *   - an entry command becomes a row only when the map offers that entry to
 *     this reader, so the page never documents a shortcut to a page the reader
 *     cannot open;
 *   - an action command is always a row, because an action needs no
 *     destination.
 *
 * The label of an entry row comes from the map entry, which is what keeps the
 * page and the rail calling a page by the same name.
 */
export function shortcutRows(
  audience: NavAudience,
  role: PlatformRole | null,
): readonly ShortcutRow[] {
  const entries = liveEntriesFor(audience, role);
  const rows: ShortcutRow[] = [];
  for (const command of COMMANDS) {
    if (command.chord === undefined) {
      continue;
    }
    if (command.kind === 'action') {
      rows.push({
        id: command.id,
        labelKey: command.labelKey,
        groupKey: command.groupKey,
        chord: command.chord,
      });
      continue;
    }
    const entry = entries.find((candidate) => candidate.id === command.entryId);
    if (entry === undefined) {
      continue;
    }
    rows.push({
      id: command.id,
      labelKey: entry.labelKey,
      groupKey: blockLabelKeyFor(entry.id) ?? 'nav.label_section_resources',
      chord: command.chord,
      href: entry.href,
    });
  }
  return rows;
}
