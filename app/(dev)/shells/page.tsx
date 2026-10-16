// path: app/(dev)/shells/page.tsx
import { FileText, PanelLeft, Wallet } from 'lucide-react';
import { notFound } from 'next/navigation';

import { AdminShell } from '@/components/layout/admin-shell';
import { AuthShell } from '@/components/layout/auth-shell';
import { BottomNavigation } from '@/components/layout/bottom-navigation';
import { Breadcrumbs, type BreadcrumbItem } from '@/components/layout/breadcrumbs';
import { ClientPortalShell } from '@/components/layout/client-portal-shell';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { MobileDrawer } from '@/components/layout/mobile-drawer';
import { type NavEntryInput, type NavSectionInput } from '@/components/layout/nav-items';
import { OfflineBanner } from '@/components/layout/offline-banner';
import { PublicShell } from '@/components/layout/public-shell';
import { AUDIENCE_ROLES } from '@/components/layout/role-framing';
import { ShellTopBar } from '@/components/layout/shell-slots';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { SiteFooter } from '@/components/layout/site-footer';
import { StickyActionBar } from '@/components/layout/sticky-action-bar';
import { TopBar } from '@/components/layout/top-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { isDevelopment } from '@/lib/env/validate-env';
import { t } from '@/lib/i18n';
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
                    sections={SPECIMEN_NAV_SECTIONS}
                    activeHref={SPECIMEN_ACTIVE_HREF}
                    header={<SpecimenIdentity />}
                  />
                }
                trailing={<Badge variant="secondary">{t('shells.label_status_paid')}</Badge>}
              >
                <Breadcrumbs items={SPECIMEN_BREADCRUMBS} />
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
              sections={SPECIMEN_NAV_SECTIONS}
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
            <BottomNavigation entries={SPECIMEN_NAV_ENTRIES} activeHref={SPECIMEN_ACTIVE_HREF} />
          </div>
        </div>

        <div className="grid gap-2">
          <h3 className="text-base font-medium text-muted-foreground">
            {t('shells.label_nav_specimen_footer')}
          </h3>
          <div className="border border-border bg-background">
            <SiteFooter links={SPECIMEN_NAV_ENTRIES} activeHref={SPECIMEN_ACTIVE_HREF} />
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
 * The path this specimen is being read at.
 *
 * Every navigation surface on the page is given the same active href, so a
 * probe can assert the property that matters across all of them at once: one
 * entry claims the current page, and the surfaces agree about which one.
 */
const SPECIMEN_ACTIVE_HREF = '/shells';

/**
 * The entries the surfaces share.
 *
 * Two real entries and one reserved entry, which is the whole set of routes
 * this build has: the homepage arrives with the public pages in segment 1D, and
 * check:dead-links is the reason an entry here cannot point at it early. Every
 * navigation entry on this page is a link the build can actually serve.
 *
 * The reserved entry is what makes the specimen worth rendering: it must appear
 * nowhere, and if a surface ever renders the list it was given instead of the
 * list it resolved, the word "Payouts" turns up in a menu and the probe fails.
 * Its href is a route that exists, so a leak would be a navigation defect and
 * not a broken link - the two failures stay distinguishable.
 */
const SPECIMEN_NAV_ENTRIES: readonly NavEntryInput[] = [
  {
    id: 'specimen-layouts',
    href: '/shells',
    labelKey: 'shells.label_nav_specimen_layouts',
    icon: <PanelLeft aria-hidden="true" className="size-5" />,
  },
  {
    id: 'specimen-gallery',
    href: '/gallery',
    labelKey: 'shells.label_nav_specimen_gallery',
    icon: <FileText aria-hidden="true" className="size-5" />,
  },
  {
    id: 'specimen-payouts',
    href: '/gallery',
    labelKey: 'shells.label_nav_specimen_payouts',
    icon: <Wallet aria-hidden="true" className="size-5" />,
    reserved: true,
  },
];

const SPECIMEN_NAV_SECTIONS: readonly NavSectionInput[] = [
  {
    id: 'specimen-workspace',
    labelKey: 'shells.label_nav_workspace',
    entries: SPECIMEN_NAV_ENTRIES,
  },
];

/**
 * The trail: a parent, the section and the page the reader is on.
 *
 * The trail starts at the gallery rather than at a home link, because there is
 * no homepage in this build yet and a breadcrumb that points at a route nobody
 * serves is a dead link with a friendly face. When segment 1D adds the public
 * root, the first step becomes the home entry in `common.label_navigation_home`.
 */
const SPECIMEN_BREADCRUMBS: readonly BreadcrumbItem[] = [
  { id: 'specimen-crumb-parent', labelKey: 'shells.label_nav_specimen_gallery', href: '/gallery' },
  { id: 'specimen-crumb-section', labelKey: 'shells.label_nav_specimen_layouts', href: '/shells' },
  { id: 'specimen-crumb-current', labelKey: 'shells.label_document_title' },
];

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
