// path: app/(public)/shortcuts/page.tsx

import { CommandPalette } from '@/components/navigation/command-palette';
import { KeyChord } from '@/components/ui/kbd';
import { shortcutRows } from '@/config/commands';
import { t } from '@/lib/i18n';
import { brand } from '@/lib/i18n/strings/en/brand';

import type { Metadata } from 'next';

/**
 * The keyboard shortcut reference, on a public page because reading it needs no
 * account.
 *
 * It is the first page the public site serves, and it is deliberately the
 * simplest one that could be: a table, generated from the command registry,
 * with no state and no fetching. Two reasons for that.
 *
 * The page carries `data-public-page="shortcuts"` like every other public page:
 * the rendered probe identifies a page by that marker rather than by its URL, and
 * a page without one can only be checked by the address it happens to be served
 * at.
 *
 * 1. **The list is generated, not written.** Every row comes from
 *    `shortcutRows('public', null)`, which reads the same registry the palette
 *    searches and the same map the navigation renders. A hand-written table of
 *    keys is correct on the day it is typed and wrong on the day a chord
 *    changes, and nothing fails when it goes wrong. This page cannot drift from
 *    the product because it holds no facts of its own.
 *
 * 2. **It is the palette's public host, for now.** The workspace frames get the
 *    palette in their top bar when their pages land; until then this page mounts
 *    it with the public audience and no role, which is exactly what a reader
 *    with no session may open. That is not a stand-in: the public audience is
 *    the one every reader of this page belongs to, and mounting the palette here
 *    is what makes the rendered evidence for sub-step 1.23 possible on a
 *    production build rather than only in development.
 *
 * The page is a server component. The registry is data, the copy is in the
 * catalogue, and the only interactive piece on the page is the palette itself,
 * which brings its own client boundary with it. A page that does not need state
 * does not become a client component to render a table.
 *
 * The route is registered in the public-resources block of the navigation map,
 * as a live entry: the page exists, so the map may publish its href, and the
 * dead-link check verifies that the two agree.
 */
export const metadata: Metadata = {
  title: t('commands.label_shortcuts_title'),
  description: t('commands.label_shortcuts_description'),
};

export default function ShortcutsPage(): React.ReactElement {
  const rows = shortcutRows('public', null);

  return (
    <div
      data-public-page="shortcuts"
      className="mx-auto grid max-w-page gap-8 px-gutter py-section"
    >
      <header className="grid gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          {t('commands.label_shortcuts_title')}
        </h1>
        <p className="max-w-sheet text-base text-muted-foreground">
          {t('commands.label_shortcuts_description')}
        </p>
        <p className="max-w-sheet text-sm text-muted-foreground">
          {t('commands.label_shortcuts_intro')}
        </p>
        <p className="max-w-sheet text-sm text-muted-foreground" data-note="modifier">
          {t('commands.label_shortcuts_modifier_note')}
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <CommandPalette audience="public" role={null} />
        </div>
      </header>

      {rows.length === 0 ? (
        <p className="text-base text-muted-foreground">{t('commands.label_shortcuts_empty')}</p>
      ) : (
        <table className="w-full border-collapse text-left" data-shortcuts="table">
          <caption className="sr-only">{t('commands.label_shortcuts_description')}</caption>
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="py-2 pr-4 text-sm font-semibold">
                {t('commands.label_shortcuts_column_keys')}
              </th>
              <th scope="col" className="py-2 pr-4 text-sm font-semibold">
                {t('commands.label_shortcuts_column_action')}
              </th>
              <th scope="col" className="py-2 text-sm font-semibold">
                {t('commands.label_shortcuts_column_scope')}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border" data-shortcut={row.id}>
                <td className="py-2 pr-4">
                  <KeyChord chord={row.chord} />
                </td>
                <td className="py-2 pr-4 text-base">
                  {row.href === undefined ? (
                    t(row.labelKey)
                  ) : (
                    <a
                      href={row.href}
                      className="flex min-h-touch items-center text-primary underline-offset-2 hover:underline"
                    >
                      {t(row.labelKey)}
                    </a>
                  )}
                </td>
                <td className="py-2 text-sm text-muted-foreground">{t(row.groupKey)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="max-w-sheet text-sm text-muted-foreground">
        {t('commands.label_shortcuts_pages_note')}
      </p>

      <footer className="text-sm text-muted-foreground">
        <p>{t('commands.label_palette_scope')}</p>
        <p>{brand.name}</p>
      </footer>
    </div>
  );
}
