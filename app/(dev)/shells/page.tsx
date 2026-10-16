// path: app/(dev)/shells/page.tsx
import { notFound } from 'next/navigation';

import { AdminShell } from '@/components/layout/admin-shell';
import { AuthShell } from '@/components/layout/auth-shell';
import { BottomNavigation } from '@/components/layout/bottom-navigation';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { ClientPortalShell } from '@/components/layout/client-portal-shell';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { MobileDrawer } from '@/components/layout/mobile-drawer';
import { type NavEntryInput } from '@/components/layout/nav-items';
import { OfflineBanner } from '@/components/layout/offline-banner';
import { PublicShell } from '@/components/layout/public-shell';
import { AUDIENCE_ROLES, type PlatformRole } from '@/components/layout/role-framing';
import { ShellTopBar } from '@/components/layout/shell-slots';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { SiteFooter } from '@/components/layout/site-footer';
import { StickyActionBar } from '@/components/layout/sticky-action-bar';
import { TopBar } from '@/components/layout/top-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  activeHrefFor,
  breadcrumbsFor,
  NAV_MAP,
  navigationFor,
  plannedEntriesFor,
  publishedHrefs,
  type NavAudience,
} from '@/config/nav-map';
import { isDevelopment } from '@/lib/env/validate-env';
import { t, type EnglishStringKey } from '@/lib/i18n';
import { formatMoney } from '@/lib/utils/currency';

/**
 * The layout specimen: each route-group shell, rendered with a document
 * inside it, before the pages that will live in those shells exist.
 *
 * The component gallery proves a component in isolation. This page proves the
 * opposite thing: that a shell holding real content produces the structure the
 * accessibility contract and the print rules depend on. Four of those are
 * only observable together with content:
 *
 *   - the skip link is the first focusable element, and its target is
 *     focusable, so Tab then Enter lands in the document rather than in the
 *     chrome;
 *   - the main landmark exists exactly once per shell, so the landmark list a
 *     screen reader offers is unambiguous;
 *   - the chrome block marked `data-print="hide"` disappears on paper while
 *     the block marked `data-print="only"` appears, which is the print base
 *     doing its job rather than a rule sitting unused in a stylesheet;
 *   - a badge marked `data-print="outline"` keeps a visible outline, because a
 *     status shown only as a coloured fill prints as blank paper.
 *
 * The role-aware shells are rendered once per role rather than once, because
 * the whole point of a frame is that two readers of the same product see
 * different things around it: the owner sees a workspace with no band, the
 * owner's staff see the same workspace with the approval notice, the three
 * platform roles see the platform band and the notice their level carries, the
 * client sees a document with no navigation at all, and an unresolved reader
 * sees the frame stripped to its landmarks. A specimen that rendered one role
 * would prove that one frame renders, which is not a fact anybody doubted.
 *
 * The navigation surfaces are a second kind of evidence (sub-step 1.21). They
 * are rendered here because half of what they owe the reader is only visible in
 * a rendered document: one current page per navigation and never two, a label
 * on every entry, no reserved entry leaking into a menu, a named landmark for
 * each navigation so a screen reader's landmark list is not four identically
 * named regions, and links whose touch target is 44 pixels rather than the
 * height of their text. The rail, the drawer, the bottom bar, the trail, the
 * footer and the action bar take their entries as props - the navigation map
 * arrives in sub-step 1.22 - so the specimen supplies entries for the three
 * routes this build has, plus one reserved entry whose absence is the point.
 *
 * The top bar's mark is a plain mark rather than a home link, because the home
 * route does not exist until segment 1D: `TopBar` takes the link form only when
 * it is given somewhere to go, and a link to the homepage of a build without a
 * homepage is a dead link the audit would catch.
 *
 * The specimen content is a small invoice, because that is the document this
 * platform prints most and the one where a printing mistake costs the most.
 * It carries no product behaviour: no data fetching, no form, no action that
 * does anything. It is the smallest document that exercises headings, a
 * paragraph, a link, a control, a status badge and a table with a total. The
 * amounts go through the money formatter rather than being written into the
 * markup, because a page that shows a currency amount by hand is the first
 * step towards displaying one that no formatter would produce.
 *
 * One honest caveat about this page: each shell renders its own `main`
 * landmark, so the document holds several, and a page is only allowed one. The
 * specimen is a component showcase rather than a page - the same way the
 * gallery renders six copies of a component that a page renders once - and the
 * rule that matters is the one check:layout-shells enforces on real routes: no
 * page under a layout group may declare a second landmark of its own.
 *
 * The route is development only, guarded in both places for the same reason
 * the gallery is: the layout guard covers the group, and the guard here stops
 * the page body from being rendered and serialized into a production 404.
 * There is no metadata export, so a production response carries no trace that
 * this route exists.
 */
export default function ShellsPage(): React.ReactElement {
  if (!isDevelopment()) {
    notFound();
  }

  return (
    <div className="grid gap-8 bg-muted p-4 md:p-8">
      <header className="grid gap-2">
        <h1 className="text-3xl font-semibold">{t('shells.label_title')}</h1>
        <p className="text-base text-muted-foreground">{t('shells.label_description')}</p>
      </header>

      <section aria-labelledby="specimen-public-heading" className="grid gap-4">
        <h2 id="specimen-public-heading" className="text-2xl font-semibold">
          {t('shells.label_section_public')}
        </h2>
        <div className="border border-border">
          <PublicShell>
            <SpecimenDocument />
          </PublicShell>
        </div>
      </section>

      <section aria-labelledby="specimen-auth-heading" className="grid gap-4">
        <h2 id="specimen-auth-heading" className="text-2xl font-semibold">
          {t('shells.label_section_auth')}
        </h2>
        <div className="border border-border">
          <AuthShell>
            <SpecimenDocument compact />
          </AuthShell>
        </div>
      </section>

      <section aria-labelledby="specimen-navigation-heading" className="grid gap-4">
        <h2 id="specimen-navigation-heading" className="text-2xl font-semibold">
          {t('shells.label_section_navigation')}
        </h2>
        <p className="max-w-sheet text-base text-muted-foreground">
          {t('shells.label_nav_specimen_note')}
        </p>

        <div className="grid gap-2">
          <h3 className="text-base font-medium text-muted-foreground">
            {t('shells.label_nav_specimen_top_bar')}
          </h3>
          <div className="border border-border bg-background">
            <ShellTopBar>
              <TopBar
                leading={
                  <MobileDrawer
                    sections={SPECIMEN_NAVIGATION.sections}
                    activeHref={SPECIMEN_ACTIVE_HREF}
                    header={<SpecimenIdentity />}
                  />
                }
                trailing={<Badge variant="secondary">{t('shells.label_status_paid')}</Badge>}
              >
                <Breadcrumbs items={SPECIMEN_REGISTERED_TRAIL} />
              </TopBar>
            </ShellTopBar>
          </div>
        </div>

        <div className="grid gap-2">
          <h3 className="text-base font-medium text-muted-foreground">
            {t('shells.label_nav_specimen_rail')}
          </h3>
          <div className="flex border border-border bg-background">
            <SidebarNav
              sections={SPECIMEN_NAVIGATION.sections}
              activeHref={SPECIMEN_ACTIVE_HREF}
              header={<SpecimenIdentity />}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <h3 className="text-base font-medium text-muted-foreground">
            {t('shells.label_nav_specimen_bottom')}
          </h3>
          <div className="border border-border bg-background p-2">
            <BottomNavigation
              entries={SPECIMEN_NAVIGATION.primary}
              activeHref={SPECIMEN_ACTIVE_HREF}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <h3 className="text-base font-medium text-muted-foreground">
            {t('shells.label_nav_specimen_footer')}
          </h3>
          <div className="border border-border bg-background">
            <SiteFooter links={SPECIMEN_LINKS} activeHref={SPECIMEN_ACTIVE_HREF} />
          </div>
        </div>

        <div className="grid gap-2">
          <h3 className="text-base font-medium text-muted-foreground">
            {t('shells.label_nav_specimen_action_bar')}
          </h3>
          <div className="border border-border bg-background p-4">
            <StickyActionBar
              summary={`${t('shells.label_sticky_summary')}: ${formatMoney('6000')}`}
            >
              <Button type="button" variant="outline">
                {t('shells.label_document_link')}
              </Button>
              <Button type="button">{t('shells.label_document_action')}</Button>
            </StickyActionBar>
          </div>
        </div>

        <div className="grid gap-2" data-nav-drop="workspace-owner">
          <h3 className="text-base font-medium text-muted-foreground">
            {t('shells.label_nav_specimen_planned_drop')}
          </h3>
          <p className="max-w-sheet text-base text-muted-foreground">
            {t('shells.label_nav_map_planned_note')}
          </p>
          <div className="flex border border-border bg-background">
            <SidebarNav
              sections={navigationFor('workspace', 'owner').sections}
              activeHref="/invoices"
              labelKey="shells.label_nav_workspace"
            />
          </div>
        </div>

        <div className="grid gap-2">
          <h3 className="text-base font-medium text-muted-foreground">
            {t('shells.label_nav_specimen_offline')}
          </h3>
          <p className="max-w-sheet text-base text-muted-foreground">
            {t('shells.label_nav_specimen_offline_note')}
          </p>
          <div className="border border-border bg-background p-2">
            <OfflineBanner />
          </div>
        </div>
      </section>

      <section aria-labelledby="specimen-trail-heading" className="grid gap-4">
        <h2 id="specimen-trail-heading" className="text-2xl font-semibold">
          {t('shells.label_nav_specimen_trails_heading')}
        </h2>
        <div className="grid gap-3 border border-border bg-background p-4">
          {SPECIMEN_TRAILS_RESOLVED.map((trail) => (
            <div key={trail.id} className="grid gap-1" data-trail={trail.id}>
              <p className="text-sm text-muted-foreground">{t(trail.labelKey)}</p>
              <Breadcrumbs items={trail.items} labelKey={trail.labelKey} />
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="specimen-nav-map-heading" className="grid gap-4">
        <h2 id="specimen-nav-map-heading" className="text-2xl font-semibold">
          {t('shells.label_section_nav_map')}
        </h2>
        <p className="max-w-sheet text-base text-muted-foreground">
          {t('shells.label_nav_map_note')}
        </p>
        <p className="text-sm text-muted-foreground">
          {t('shells.label_nav_map_published')}: {publishedHrefs().join(', ')}
        </p>

        <h3 className="text-base font-medium text-muted-foreground">
          {t('shells.label_nav_map_readers_heading')}
        </h3>
        <table data-nav-map="readers" className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th scope="col" className="py-2 font-medium">
                {t('shells.label_nav_map_column_audience')}
              </th>
              <th scope="col" className="py-2 font-medium">
                {t('shells.label_nav_map_column_role')}
              </th>
              <th scope="col" className="py-2 font-medium">
                {t('shells.label_nav_map_column_modules')}
              </th>
              <th scope="col" className="py-2 font-medium">
                {t('shells.label_nav_map_column_planned')}
              </th>
              <th scope="col" className="py-2 font-medium">
                {t('shells.label_nav_map_column_primary')}
              </th>
              <th scope="col" className="py-2 font-medium">
                {t('shells.label_nav_map_column_trail')}
              </th>
            </tr>
          </thead>
          <tbody>
            {SPECIMEN_READERS.map((reader) => {
              const navigation = navigationFor(reader.audience, reader.role);
              const offered = navigation.sections
                .flatMap((section) => section.entries)
                .map((entry) => t(entry.labelKey));
              const primary = navigation.primary.map((entry) => t(entry.labelKey));
              const planned = plannedEntriesFor(reader.audience, reader.role).map((entry) =>
                t(entry.labelKey),
              );
              const trail = breadcrumbsFor(SPECIMEN_PATH, reader.audience, reader.role).map(
                (item) => t(item.labelKey),
              );
              return (
                <tr
                  key={`${reader.audience}-${reader.role ?? 'anonymous'}`}
                  data-nav-reader={`${reader.audience}:${reader.role ?? 'anonymous'}`}
                  className="border-b border-border align-top"
                >
                  <td className="py-2">{reader.audience}</td>
                  <td className="py-2">{reader.role ?? t('shells.label_nav_map_anonymous')}</td>
                  <td className="py-2">
                    {offered.length === 0 ? t('shells.label_nav_map_none') : offered.join(', ')}
                  </td>
                  <td className="py-2">{planned.length}</td>
                  <td className="py-2">
                    {primary.length === 0 ? t('shells.label_nav_map_none') : primary.join(', ')}
                  </td>
                  <td className="py-2">
                    {trail.length === 0 ? t('shells.label_nav_map_none') : trail.join(', ')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="max-w-sheet text-base text-muted-foreground">
          {t('shells.label_nav_map_planned_note')}
        </p>

        <h3 className="text-base font-medium text-muted-foreground">
          {t('shells.label_nav_map_blocks_heading')}
        </h3>
        <table data-nav-map="blocks" className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th scope="col" className="py-2 font-medium">
                {t('shells.label_nav_map_column_block')}
              </th>
              <th scope="col" className="py-2 font-medium">
                {t('shells.label_nav_map_column_heading')}
              </th>
              <th scope="col" className="py-2 font-medium">
                {t('shells.label_nav_map_column_live')}
              </th>
              <th scope="col" className="py-2 font-medium">
                {t('shells.label_nav_map_column_planned')}
              </th>
              <th scope="col" className="py-2 font-medium">
                {t('shells.label_nav_map_column_hierarchy')}
              </th>
            </tr>
          </thead>
          <tbody>
            {NAV_MAP.map((block) => {
              const live = block.entries.filter((entry) => entry.planned !== true);
              const planned = block.entries.filter((entry) => entry.planned === true);
              const hierarchy = block.entries
                .filter((entry) => entry.parentId !== undefined)
                .map((entry) => {
                  const parent = block.entries.find((candidate) => candidate.id === entry.parentId);
                  return parent === undefined
                    ? t(entry.labelKey)
                    : `${t(entry.labelKey)} / ${t(parent.labelKey)}`;
                });
              return (
                <tr
                  key={block.id}
                  data-nav-block={block.id}
                  className="border-b border-border align-top"
                >
                  <td className="py-2">{block.id}</td>
                  <td className="py-2">{t(block.labelKey)}</td>
                  <td className="py-2">
                    {live.length === 0
                      ? t('shells.label_nav_map_none')
                      : live.map((entry) => t(entry.labelKey)).join(', ')}
                  </td>
                  <td className="py-2">
                    {planned.length === 0
                      ? t('shells.label_nav_map_none')
                      : planned.map((entry) => t(entry.labelKey)).join(', ')}
                  </td>
                  <td className="py-2">
                    {hierarchy.length === 0 ? t('shells.label_nav_map_none') : hierarchy.join('; ')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section aria-labelledby="specimen-dashboard-heading" className="grid gap-4">
        <h2 id="specimen-dashboard-heading" className="text-2xl font-semibold">
          {t('shells.label_section_dashboard')}
        </h2>
        {AUDIENCE_ROLES.tenant.map((role) => (
          <div key={role} className="grid gap-2">
            <h3 className="text-base font-medium text-muted-foreground">{role}</h3>
            <div className="border border-border">
              <DashboardShell
                role={role}
                sidebar={<SpecimenNavigation />}
                footer={<SpecimenFooter />}
              >
                <SpecimenDocument />
              </DashboardShell>
            </div>
          </div>
        ))}
      </section>

      <section aria-labelledby="specimen-admin-heading" className="grid gap-4">
        <h2 id="specimen-admin-heading" className="text-2xl font-semibold">
          {t('shells.label_section_admin')}
        </h2>
        {AUDIENCE_ROLES.platform.map((role) => (
          <div key={role} className="grid gap-2">
            <h3 className="text-base font-medium text-muted-foreground">{role}</h3>
            <div className="border border-border">
              <AdminShell role={role} sidebar={<SpecimenNavigation />}>
                <SpecimenDocument compact />
              </AdminShell>
            </div>
          </div>
        ))}
      </section>

      <section aria-labelledby="specimen-client-heading" className="grid gap-4">
        <h2 id="specimen-client-heading" className="text-2xl font-semibold">
          {t('shells.label_section_client_portal')}
        </h2>
        <div className="border border-border">
          <ClientPortalShell tenantHeader={<SpecimenFooter />}>
            <SpecimenDocument compact />
          </ClientPortalShell>
        </div>
      </section>

      <section aria-labelledby="specimen-unresolved-heading" className="grid gap-4">
        <h2 id="specimen-unresolved-heading" className="text-2xl font-semibold">
          {t('shells.label_section_unresolved')}
        </h2>
        <div className="border border-border">
          <DashboardShell role={null} sidebar={<SpecimenNavigation />}>
            <SpecimenDocument compact />
          </DashboardShell>
        </div>
      </section>
    </div>
  );
}

/**
 * The specimen reads the navigation map, and it is the only page that asks for
 * the development audience.
 *
 * That audience holds the two routes this build actually serves. Everything else
 * in the map - the workspace modules, the platform console, the client portal,
 * the public site - is planned, because step 1 has not built a product page yet,
 * and a planned entry has no href to render. So the surfaces below show what the
 * map hands them, and the day a product page lands, this page shows that too
 * without a line changing here.
 *
 * The trail examples cover the three cases the generator distinguishes: a
 * registered path, a path below a registered entry, and a path the map has never
 * heard of.
 */
const SPECIMEN_AUDIENCE: NavAudience = 'development';
const SPECIMEN_PATH = '/shells';
const SPECIMEN_NESTED_PATH = '/shells/invoice-editor';
const SPECIMEN_UNKNOWN_PATH = '/not-in-the-map';

/** Every audience against the roles that matter to it, for the filter table. */
const SPECIMEN_READERS: readonly {
  readonly audience: NavAudience;
  readonly role: PlatformRole | null;
}[] = [
  { audience: 'public', role: null },
  { audience: 'public', role: 'client' },
  { audience: 'workspace', role: 'owner' },
  { audience: 'workspace', role: 'staff' },
  { audience: 'workspace', role: 'client' },
  { audience: 'platform', role: 'super_admin' },
  { audience: 'platform', role: 'ceo' },
  { audience: 'platform', role: 'admin_staff' },
  { audience: 'platform', role: 'owner' },
  { audience: 'client', role: 'client' },
  { audience: 'client', role: 'staff' },
  { audience: 'development', role: null },
];

/** The trail examples, each rendered with its own landmark name. */
const SPECIMEN_TRAILS: readonly {
  readonly id: string;
  readonly path: string;
  readonly labelKey: EnglishStringKey;
}[] = [
  {
    id: 'registered',
    path: SPECIMEN_PATH,
    labelKey: 'shells.label_nav_specimen_trail_registered',
  },
  { id: 'nested', path: SPECIMEN_NESTED_PATH, labelKey: 'shells.label_nav_specimen_trail_nested' },
  {
    id: 'unknown',
    path: SPECIMEN_UNKNOWN_PATH,
    labelKey: 'shells.label_nav_specimen_trail_unknown',
  },
];

/**
 * The trail examples: one registered path, one path below a registered entry,
 * one path the map has never heard of. The last two are the interesting ones -
 * a generator that guessed a parent would produce a trail for the second, and a
 * generator that invented a home link would produce one for the third.
 */
const SPECIMEN_TRAILS_RESOLVED = SPECIMEN_TRAILS.map((trail) => ({
  ...trail,
  items: breadcrumbsFor(trail.path, SPECIMEN_AUDIENCE, null),
}));

/** The navigation the map publishes for this page's own audience. */
const SPECIMEN_NAVIGATION = navigationFor(SPECIMEN_AUDIENCE, null);
const SPECIMEN_ACTIVE_HREF = activeHrefFor(SPECIMEN_PATH, SPECIMEN_AUDIENCE, null);
const SPECIMEN_REGISTERED_TRAIL = breadcrumbsFor(SPECIMEN_PATH, SPECIMEN_AUDIENCE, null);
const SPECIMEN_LINKS: readonly NavEntryInput[] = SPECIMEN_NAVIGATION.sections.flatMap(
  (section) => section.entries,
);

/** Workspace identity, as the rail and the drawer carry it. */
function SpecimenIdentity(): React.ReactElement {
  return (
    <span className="text-base font-semibold">{t('shells.label_nav_specimen_drawer_header')}</span>
  );
}

/** The navigation a slot receives in the specimen. It links to nothing. */
function SpecimenNavigation(): React.ReactElement {
  return (
    <ul className="grid gap-2 p-4 text-base">
      <li>{t('shells.label_document_title')}</li>
      <li>{t('shells.label_document_link')}</li>
    </ul>
  );
}

/** The footer a slot receives in the specimen, and the tenant header. */
function SpecimenFooter(): React.ReactElement {
  return <p className="p-4 text-sm text-muted-foreground">{t('shells.label_print_footer')}</p>;
}

/**
 * The document inside a shell: the content every shell has to be able to hold.
 *
 * `compact` drops the table for the auth shell, because an auth panel holds a
 * form rather than a document, and the specimen should not imply otherwise.
 */
function SpecimenDocument({ compact = false }: { readonly compact?: boolean }): React.ReactElement {
  return (
    <article className="grid gap-4 p-6">
      <div data-print="hide" className="rounded-md bg-muted p-4 text-base text-muted-foreground">
        {t('shells.label_chrome_placeholder')}
      </div>

      <div data-print="only" className="text-base font-medium">
        {t('shells.label_print_header')}
      </div>

      <header className="grid gap-1">
        <h3 className="text-xl font-semibold">{t('shells.label_document_title')}</h3>
        <p className="text-base text-muted-foreground">{t('shells.label_document_meta')}</p>
      </header>

      <p className="text-base">{t('shells.label_document_body')}</p>

      <p className="text-sm text-muted-foreground">{t('shells.label_specimen_note')}</p>

      <div className="flex flex-wrap items-center gap-4">
        <Badge data-print="outline">{t('shells.label_status_paid')}</Badge>
        <a href="#specimen-public-heading" className="text-base text-primary underline">
          {t('shells.label_document_link')}
        </a>
        <Button type="button" variant="outline">
          {t('shells.label_document_action')}
        </Button>
      </div>

      {compact ? null : (
        <table className="w-full border-collapse text-base">
          <caption className="sr-only">{t('shells.label_document_title')}</caption>
          <thead>
            <tr className="border-b border-border text-left">
              <th scope="col" className="py-2 font-medium">
                {t('shells.label_column_description')}
              </th>
              <th scope="col" className="py-2 text-right font-medium">
                {t('shells.label_column_amount')}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="py-2">{t('shells.label_row_services')}</td>
              <td className="py-2 text-right">{formatMoney('4200')}</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2">{t('shells.label_row_support')}</td>
              <td className="py-2 text-right">{formatMoney('1800')}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" className="py-2 text-left font-medium">
                {t('shells.label_document_total')}
              </th>
              <td className="py-2 text-right font-semibold">{formatMoney('6000')}</td>
            </tr>
          </tfoot>
        </table>
      )}

      <p data-print="only" className="text-sm">
        {t('shells.label_print_footer')}
      </p>
    </article>
  );
}
