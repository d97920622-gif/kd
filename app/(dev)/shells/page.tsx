// path: app/(dev)/shells/page.tsx
import { notFound } from 'next/navigation';

import { AdminShell } from '@/components/layout/admin-shell';
import { AuthShell } from '@/components/layout/auth-shell';
import { ClientPortalShell } from '@/components/layout/client-portal-shell';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PublicShell } from '@/components/layout/public-shell';
import { AUDIENCE_ROLES } from '@/components/layout/role-framing';
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
