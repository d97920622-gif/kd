// path: app/(dev)/gallery/showcase-data.tsx
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { t } from '@/lib/i18n';
import { formatMoney, sumMoney } from '@/lib/utils/currency';

/**
 * The data display primitive from sub-step 1.16: the table.
 *
 * The table is the component most likely to break a layout, so the gallery
 * renders the shape the platform actually uses: a caption that says what the
 * rows are, a header row with scoped column heads, an amount column that is
 * formatted by the money utility rather than by a string template, and a
 * footer with a total. The amounts come from the money layer as decimal
 * strings and reach the screen through `formatMoney`, so the gallery follows
 * the same rule as every invoice screen: no JavaScript number ever holds an
 * amount, and the currency symbol is never typed by hand.
 */
const ROWS: readonly {
  readonly reference: string;
  readonly clientKey: 'gallery.label_demo_client_one' | 'gallery.label_demo_client_two';
  readonly amount: string;
  readonly statusKey: 'gallery.label_demo_status_sent' | 'gallery.label_demo_status_paid';
}[] = [
  {
    reference: 'INV-000001',
    clientKey: 'gallery.label_demo_client_one',
    amount: '1250.0000',
    statusKey: 'gallery.label_demo_status_sent',
  },
  {
    reference: 'INV-000002',
    clientKey: 'gallery.label_demo_client_two',
    amount: '480.5000',
    statusKey: 'gallery.label_demo_status_paid',
  },
  {
    reference: 'INV-000003',
    clientKey: 'gallery.label_demo_client_one',
    amount: '99.9900',
    statusKey: 'gallery.label_demo_status_sent',
  },
];

export function ShowcaseData(): React.ReactElement {
  const total = sumMoney(ROWS.map((row) => row.amount));

  return (
    <section aria-labelledby="gallery-data-heading" className="grid gap-4">
      <h3 id="gallery-data-heading" className="text-xl font-semibold">
        {t('gallery.label_section_data')}
      </h3>

      <Table>
        <TableCaption>{t('gallery.label_demo_table_caption')}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">{t('gallery.label_demo_table_reference')}</TableHead>
            <TableHead scope="col">{t('gallery.label_demo_table_client')}</TableHead>
            <TableHead scope="col">{t('gallery.label_demo_table_amount')}</TableHead>
            <TableHead scope="col">{t('gallery.label_demo_table_status')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ROWS.map((row) => (
            <TableRow key={row.reference}>
              <TableCell>{row.reference}</TableCell>
              <TableCell>{t(row.clientKey)}</TableCell>
              <TableCell>{formatMoney(row.amount)}</TableCell>
              <TableCell>{t(row.statusKey)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2}>{t('common.label_status')}</TableCell>
            <TableCell>{formatMoney(total)}</TableCell>
            <TableCell>{t('common.amount_display_note')}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </section>
  );
}
