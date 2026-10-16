// path: lib/i18n/strings/en/commands.ts
/**
 * Copy for the command surface: the palette, the shortcuts reference page and
 * the command registry's own labels.
 *
 * Why this is a namespace of its own. The copy here is read by three surfaces
 * that share nothing else - the palette dialog, the reference page and the
 * action rows the registry declares - and it is not chrome, not a module name
 * and not a form label. Filing it under a surface would make the other two
 * import a surface's strings, which is how a catalogue starts to describe
 * components instead of the product.
 *
 * Two rules from the copy guide shape what is written here:
 *
 *   - A key says what the reader sees, not what the code calls it: the palette's
 *     empty state is a sentence, not `palette_empty_state`.
 *   - Nothing here names a key the reader presses as a glyph. The chords are
 *     rendered from the registry as keycaps, so this file never spells Control
 *     or Command itself; the one sentence that explains the modifier is a
 *     sentence, and it says both names because the reader may be on either.
 *
 * Append protocol: add, never rename or remove. A copy change is a new key.
 */
export const commands = {
  label_group_global: 'Global',
  label_group_pages: 'Pages',

  label_action_open_palette: 'Open the command palette',
  label_action_focus_main: 'Skip to the main content',

  label_palette_title: 'Commands',
  label_palette_description: 'Search the pages this build serves and the commands it can run.',
  label_palette_trigger: 'Search',
  label_palette_input: 'Search pages and commands',
  label_palette_hint: 'Type to filter, Up and Down to move, Enter to open, Escape to close.',
  label_palette_empty: 'Nothing matches that search. Try a shorter word.',
  label_palette_current: 'You are here',
  label_palette_scope: 'Offered to you',

  label_shortcuts_title: 'Keyboard shortcuts',
  label_shortcuts_description:
    'Every key that does something in this product, what it does, and where it works.',
  label_shortcuts_intro:
    'The same list the command palette searches. Global shortcuts work anywhere in the product, and a shortcut that opens a page is listed with the page it opens.',
  label_shortcuts_column_keys: 'Keys',
  label_shortcuts_column_action: 'Action',
  label_shortcuts_column_scope: 'Group',
  label_shortcuts_modifier_note:
    'The Ctrl key in a chord is Control on Windows and Linux, and Command on macOS.',
  label_shortcuts_pages_note:
    'A page listed here is offered to the reader the page is for. The palette searches the same list the rail renders, so the two cannot disagree about what exists.',
  label_shortcuts_empty: 'No shortcut is registered yet for this reader.',
} as const;
