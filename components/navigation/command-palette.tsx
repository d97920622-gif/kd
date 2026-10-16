// path: components/navigation/command-palette.tsx
'use client';

import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useState } from 'react';

import { MAIN_CONTENT_ID } from '@/components/layout/main-content';
import type { PlatformRole } from '@/components/layout/role-framing';
import { CommandList } from '@/components/navigation/command-list';
import { commandRows, type CommandRow } from '@/components/navigation/command-rows';
import { useNavigation } from '@/components/navigation/use-navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { KeyChord } from '@/components/ui/kbd';
import { COMMAND_IDS, commandForAction, entryCommandTarget } from '@/config/commands';
import { type NavAudience } from '@/config/nav-map';
import { t, tPlural } from '@/lib/i18n';
import { ariaKeyshortcuts, isTypingTarget, matchesChord } from '@/lib/utils/key-chord';

/**
 * The command palette: one keystroke to anywhere the reader can go, and to
 * everything they can do from where they are.
 *
 * It is the third surface over the navigation map (MASTER_PROMPT, navigation
 * integrity: the palette is the map's third reader, after the rail and the
 * trail), and it obeys the same rule as the other two: it renders what the map
 * offers *this* reader. A page the reader is not offered is not merely hidden -
 * it is absent from the list, because the palette builds its page rows from
 * `navigationFor(audience, role)` and never from the raw map.
 *
 * WHY NOTHING IN THIS FILE KNOWS A PATH
 *
 * The page rows carry the map's href, the action rows carry an action id, and
 * the registry carries the chords. This component owns only the state a dialog
 * needs - open, query, active row - and the two behaviours that cannot be data:
 * navigating to a row's destination, and running a row's action. That is what
 * makes the palette the same in every frame: the workspace frame hands it the
 * workspace audience and the reader's role, the public page hands it the public
 * audience and no role, and the component itself never asks who is reading.
 *
 * FOCUS, WHICH IS THE WHOLE POINT
 *
 *   - Opening moves focus into the search field, and the field keeps it.
 *     Arrow keys move `aria-activedescendant`, not focus, so the reader's
 *     typing is never interrupted by moving down the list.
 *   - Closing returns focus to the trigger, which is what Radix does for a
 *     controlled dialog and what a reader who opened the palette with the
 *     keyboard expects. The one exception is the command that deliberately
 *     moves focus somewhere else: skipping to the main content moves focus to
 *     the landmark, after the dialog has closed, on the next frame.
 *   - The trigger is a real button with a visible name, `aria-haspopup`, and
 *     `aria-keyshortcuts` built from the same chord the listener matches. The
 *     keycaps beside it are decorative; assistive technology reads the
 *     attribute.
 *
 * THE TWO GLOBAL CHORDS
 *
 * `mod+k` toggles the palette anywhere, including from inside a field, because
 * a reader who is typing and wants to go somewhere else should not have to
 * leave the field first. `?` opens the shortcuts reference page only when the
 * reader is not typing in a field, because a question mark belongs to the
 * sentence first. Both chords come from `config/commands.ts`; neither is
 * spelled here.
 */
export interface CommandPaletteProps {
  /** The part of the product this frame is: what the page rows come from. */
  readonly audience: NavAudience;
  /** The reader's role, resolved by the server frame. Null means no session. */
  readonly role: PlatformRole | null;
  readonly triggerClassName?: string;
}

export function CommandPalette({
  audience,
  role,
  triggerClassName,
}: CommandPaletteProps): React.ReactElement {
  const router = useRouter();
  const optionIdPrefix = useId();
  const listboxId = `${optionIdPrefix}-listbox`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  const { sections, activeHref } = useNavigation(audience, role);

  const ranked = useMemo(
    () => commandRows(sections, activeHref, query),
    [sections, activeHref, query],
  );
  const activeRowId = ranked.find((row) => row.id === activeId)?.id ?? ranked[0]?.id ?? null;
  const activeRow = ranked.find((row) => row.id === activeRowId);

  const openPaletteChord = commandForAction('open-command-palette')?.chord;
  const shortcutsTarget = entryCommandTarget(COMMAND_IDS.openShortcuts);

  function moveActive(step: number): void {
    if (ranked.length === 0) {
      return;
    }
    const index = ranked.findIndex((row) => row.id === activeRowId);
    const next = ranked[(index + step + ranked.length) % ranked.length];
    setActiveId(next.id);
  }

  function focusMainContent(): void {
    window.requestAnimationFrame(() => {
      const landmark = document.getElementById(MAIN_CONTENT_ID);
      if (landmark !== null) {
        landmark.focus();
      }
    });
  }

  function runRow(row: CommandRow): void {
    if (row.kind === 'entry') {
      if (row.href !== undefined) {
        setOpen(false);
        router.push(row.href);
      }
      return;
    }
    if (row.action === 'focus-main-content') {
      setOpen(false);
      focusMainContent();
    }
  }

  function handleOpenChange(next: boolean): void {
    setOpen(next);
    if (next) {
      setQuery('');
      setActiveId(null);
    }
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.defaultPrevented) {
        return;
      }
      if (openPaletteChord !== undefined && matchesChord(event, openPaletteChord)) {
        event.preventDefault();
        setOpen((current) => !current);
        return;
      }
      if (shortcutsTarget === null) {
        return;
      }
      // A symbol chord is only a shortcut outside a field: `?` is a question
      // mark before it is navigation.
      if (isTypingTarget(event.target) || event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }
      if (!matchesChord(event, shortcutsTarget.chord)) {
        return;
      }
      const href = sections
        .flatMap((section) => section.entries)
        .find((entry) => entry.id === shortcutsTarget.entryId)?.href;
      if (href !== undefined) {
        event.preventDefault();
        router.push(href);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [openPaletteChord, shortcutsTarget, sections, router]);

  const hasRows = ranked.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button
        type="button"
        variant="outline"
        data-layout="command-palette-trigger"
        aria-haspopup="dialog"
        {...(openPaletteChord === undefined
          ? {}
          : { 'aria-keyshortcuts': ariaKeyshortcuts(openPaletteChord) })}
        className={triggerClassName}
        onClick={() => {
          handleOpenChange(true);
        }}
      >
        <Search aria-hidden="true" />
        {t('commands.label_palette_trigger')}
        {openPaletteChord === undefined ? null : (
          <KeyChord chord={openPaletteChord} className="ml-1 hidden lg:inline-flex" />
        )}
      </Button>

      <DialogContent data-layout="command-palette" className="max-w-dialog gap-3 p-4">
        <DialogTitle className="sr-only">{t('commands.label_palette_title')}</DialogTitle>
        <DialogDescription className="sr-only">
          {t('commands.label_palette_description')}
        </DialogDescription>

        <input
          type="text"
          role="combobox"
          aria-label={t('commands.label_palette_input')}
          aria-expanded={hasRows}
          aria-controls={hasRows ? listboxId : undefined}
          aria-activedescendant={
            hasRows && activeRowId !== null ? `${optionIdPrefix}-${activeRowId}` : undefined
          }
          aria-autocomplete="list"
          placeholder={t('commands.label_palette_input')}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveId(null);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              moveActive(1);
              return;
            }
            if (event.key === 'ArrowUp') {
              event.preventDefault();
              moveActive(-1);
              return;
            }
            if (event.key === 'Enter' && activeRow !== undefined) {
              event.preventDefault();
              runRow(activeRow);
            }
          }}
          className="min-h-touch w-full rounded-md border border-input bg-background px-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />

        <CommandList
          rows={ranked}
          activeId={activeRowId}
          listboxId={listboxId}
          optionIdPrefix={optionIdPrefix}
          emptyLabel={t('commands.label_palette_empty')}
          onActivate={setActiveId}
          onSelect={(id) => {
            const row = ranked.find((candidate) => candidate.id === id);
            if (row !== undefined) {
              runRow(row);
            }
          }}
        />

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
          <p>{t('commands.label_palette_hint')}</p>
          <p role="status" aria-live="polite">
            {tPlural('common.results_count', ranked.length)}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
