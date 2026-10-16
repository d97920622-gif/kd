// path: app/(dev)/gallery/showcase-usability.tsx
'use client';

import { useCallback, useId, useMemo, useRef, useState } from 'react';
import { z } from 'zod';

import { ExplainabilityMessage } from '@/components/shared/explainability-message';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAutosave } from '@/lib/hooks/use-autosave';
import { useOptimisticRecord } from '@/lib/hooks/use-optimistic-record';
import { useSavedViews } from '@/lib/hooks/use-saved-views';
import { useUndoToast } from '@/lib/hooks/use-undo';
import { t } from '@/lib/i18n';

/**
 * The usability primitives, running in the gallery (sub-step 1.27).
 *
 * The rule the gallery follows is that it shows primitives and their states
 * rather than product screens, and this section is where that rule earns its
 * keep: four specimens below run the *real* hooks against *real* browser
 * storage, with specimen copy and specimen records. Nothing here would change
 * if a product page rendered the same hooks, which is what makes the section
 * evidence instead of an illustration.
 *
 * Each specimen answers a question a reviewer would otherwise take on trust:
 *
 *   1. **Saved views** - do the values a caller declares persist, and does the
 *      sentence say where they are kept? The filter line is two values of a
 *      shape a real list would pass in, and the view is written to this
 *      browser's storage under a key that names this reader and this list.
 *   2. **Undo** - is the removal really deferred? The row disappears at once,
 *      the toast offers the window, and the request runs when the window
 *      closes. The pending count shows that the change is provably not sent.
 *   3. **Autosave** - is the draft kept, and does the indicator distinguish a
 *      draft in this browser from a change on the server? Reload the page and
 *      the specimen offers the draft back rather than applying it.
 *   4. **Optimistic updates** - does a failed request take back exactly one
 *      change? The switch below makes the next request fail, so the rollback is
 *      visible without a network.
 *
 * The three explainability panels at the end are the same component with
 * different context values: a held payment, a failed delivery, and an outcome
 * with no reason recorded yet. The last one is the honest case - the panel a
 * payload produces when the platform cannot classify what happened - and it is
 * rendered here on purpose, because a fallback nobody has looked at is a
 * fallback that renders an empty box.
 */

/** The filter keys this specimen allows a saved view to persist. */
const SAVED_VIEW_KEYS: readonly string[] = ['status', 'period'];

/** The filter values the specimen is "holding" when a view is saved. */
const SPECIMEN_FILTERS: Readonly<Record<string, string>> = {
  status: 'draft',
  period: 'this month',
};

interface SampleRow {
  readonly id: string;
  readonly labelKey:
    'gallery.label_demo_row_one' | 'gallery.label_demo_row_two' | 'gallery.label_demo_row_three';
}

const SAMPLE_ROWS: readonly SampleRow[] = [
  { id: 'row-1', labelKey: 'gallery.label_demo_row_one' },
  { id: 'row-2', labelKey: 'gallery.label_demo_row_two' },
  { id: 'row-3', labelKey: 'gallery.label_demo_row_three' },
];

/** The draft shape the autosave specimen keeps. Validated on the way back in. */
const NOTE_SCHEMA = z.object({ note: z.string().max(500) });

interface RecordValue {
  readonly name: string;
}

/** The specimen record starts with this name; the reader renames it below. */
const RECORD_START: RecordValue = { name: t('gallery.label_demo_record_name') };

/** A request that takes a moment and then succeeds. */
function resolveAfter(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function SavedViewsSpecimen(): React.ReactElement {
  const nameId = useId();
  const savedViews = useSavedViews({
    ownerId: 'gallery',
    listId: 'gallery-list',
    keys: SAVED_VIEW_KEYS,
  });
  const [name, setName] = useState('');

  return (
    <div
      className="grid gap-3 rounded-md border border-border bg-card p-4"
      data-usability="saved-views"
    >
      <h4 className="text-base font-semibold">{t('usability.saved_views_title')}</h4>
      <p className="text-sm text-muted-foreground">{t('usability.saved_views_description')}</p>
      <p className="text-sm text-muted-foreground">
        {t('gallery.label_usability_saved_views_note')}
      </p>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium">{t('gallery.label_usability_filters')}</span>
        <span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-xs">
          {t('gallery.label_usability_filter_status')}
        </span>
        <span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-xs">
          {t('gallery.label_usability_filter_period')}
        </span>
      </div>

      <div className="grid gap-2 sm:max-w-sm">
        <Label htmlFor={nameId}>{t('usability.saved_views_name_label')}</Label>
        <Input
          id={nameId}
          onChange={(event) => {
            setName(event.target.value);
          }}
          placeholder={t('usability.saved_views_name_placeholder')}
          value={name}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => {
            savedViews.save(name, SPECIMEN_FILTERS);
            setName('');
          }}
          size="sm"
        >
          {t('usability.saved_views_action_save')}
        </Button>
      </div>

      <p className="text-sm" data-usability-status="saved-views">
        {savedViews.message}
      </p>
      <p className="text-sm text-muted-foreground">{savedViews.countLabel}</p>

      <div className="grid gap-2">
        <h5 className="text-sm font-medium">{t('gallery.label_usability_views_header')}</h5>
        {savedViews.views.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('usability.saved_views_empty')}</p>
        ) : (
          <ul className="grid gap-2">
            {savedViews.views.map((view) => (
              <li className="flex flex-wrap items-center gap-2" key={view.id}>
                <span className="text-sm font-medium">{view.name}</span>
                <span className="text-xs text-muted-foreground">
                  {Object.entries(view.filters)
                    .map(([key, value]) => `${key} = ${String(value)}`)
                    .join(', ')}
                </span>
                <Button
                  aria-label={t('usability.saved_views_action_apply', { name: view.name })}
                  onClick={() => {
                    savedViews.apply(view.id);
                  }}
                  size="sm"
                  variant="outline"
                >
                  {t('common.action_apply')}
                </Button>
                <Button
                  aria-label={t('usability.saved_views_action_delete', { name: view.name })}
                  onClick={() => {
                    savedViews.remove(view.id);
                  }}
                  size="sm"
                  variant="ghost"
                >
                  {t('common.action_delete')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-muted-foreground">{t('usability.saved_views_storage_note')}</p>
    </div>
  );
}

function UndoSpecimen(): React.ReactElement {
  const rows = useOptimisticRecord<readonly SampleRow[]>({
    initial: SAMPLE_ROWS,
    request: () => resolveAfter(250),
  });
  const undo = useUndoToast();

  const removeRow = useCallback(
    (row: SampleRow): void => {
      // Show the removal now. The request is not sent from here: the undo
      // window owns that decision, which is what makes the undo a real one.
      const mutation = rows.apply((current) =>
        current.filter((candidate) => candidate.id !== row.id),
      );
      undo.scheduleUndo({
        name: t(row.labelKey),
        commit: () => {
          rows.commit(mutation);
        },
        revert: () => {
          rows.rollback(mutation);
        },
      });
    },
    [rows, undo],
  );

  return (
    <div className="grid gap-3 rounded-md border border-border bg-card p-4" data-usability="undo">
      <h4 className="text-base font-semibold">{t('usability.undo_title')}</h4>
      <p className="text-sm text-muted-foreground">{t('usability.undo_description')}</p>
      <p className="text-sm text-muted-foreground">{t('gallery.label_usability_undo_note')}</p>

      <ul className="grid gap-2">
        {rows.value.map((row) => (
          <li
            className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-border px-3 py-2"
            key={row.id}
          >
            <span className="text-sm">{t(row.labelKey)}</span>
            <Button
              aria-label={`${t('usability.undo_specimen_remove')}: ${t(row.labelKey)}`}
              onClick={() => {
                removeRow(row);
              }}
              size="sm"
              variant="outline"
            >
              {t('common.action_delete')}
            </Button>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={() => {
            rows.reset(SAMPLE_ROWS);
          }}
          size="sm"
          variant="secondary"
        >
          {t('usability.undo_specimen_reset')}
        </Button>
        <span className="text-sm" data-usability-status="undo">
          {undo.message}
        </span>
      </div>

      <p className="text-sm text-muted-foreground">
        {t('usability.undo_pending_other', { count: undo.pending })}
      </p>
      <p className="text-xs text-muted-foreground">{t('usability.undo_oldest_note')}</p>
      <p className="text-xs text-muted-foreground">{t('usability.undo_window_note')}</p>
    </div>
  );
}

function AutosaveSpecimen(): React.ReactElement {
  const noteId = useId();
  const [note, setNote] = useState('');
  const value = useMemo(() => ({ note }), [note]);
  const autosave = useAutosave({
    ownerId: 'gallery',
    listId: 'gallery-drafts',
    recordId: 'gallery-note',
    value,
    schema: NOTE_SCHEMA,
  });

  return (
    <div
      className="grid gap-3 rounded-md border border-border bg-card p-4"
      data-usability="autosave"
    >
      <h4 className="text-base font-semibold">{t('usability.autosave_title')}</h4>
      <p className="text-sm text-muted-foreground">{t('usability.autosave_description')}</p>
      <p className="text-sm text-muted-foreground">{t('gallery.label_usability_autosave_note')}</p>

      <div className="grid gap-2 sm:max-w-md">
        <Label htmlFor={noteId}>{t('usability.autosave_field_label')}</Label>
        <Textarea
          id={noteId}
          onChange={(event) => {
            setNote(event.target.value);
          }}
          placeholder={t('usability.autosave_field_placeholder')}
          value={note}
        />
      </div>

      <p className="text-sm" data-usability-status="autosave">
        {autosave.statusMessage}
      </p>
      {autosave.keptAtLabel === null ? null : (
        <p className="text-xs text-muted-foreground">
          {t('usability.autosave_saved_at', { time: autosave.keptAtLabel })}
        </p>
      )}

      {autosave.recovery === null ? null : (
        <div
          className="grid gap-2 rounded-sm border border-border bg-muted p-3"
          data-usability-draft="recovered"
        >
          <p className="text-sm">{t('usability.autosave_recovered_note')}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                const draft = autosave.recover();
                if (draft !== null) {
                  setNote(draft.note);
                }
              }}
              size="sm"
            >
              {t('usability.autosave_action_recover')}
            </Button>
            <Button
              onClick={() => {
                autosave.discard();
              }}
              size="sm"
              variant="outline"
            >
              {t('usability.autosave_action_discard')}
            </Button>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">{t('usability.autosave_multi_tab_note')}</p>
      <p className="text-xs text-muted-foreground">{t('usability.autosave_size_note')}</p>
    </div>
  );
}

function OptimisticSpecimen(): React.ReactElement {
  const nameId = useId();
  const failNextRef = useRef(false);
  const [failNext, setFailNext] = useState(false);
  const [draftName, setDraftName] = useState('');

  const request = useCallback(async (): Promise<void> => {
    await resolveAfter(300);
    if (failNextRef.current) {
      failNextRef.current = false;
      throw new Error('specimen request refused on purpose');
    }
  }, []);

  const record = useOptimisticRecord<RecordValue>({
    initial: RECORD_START,
    request,
  });

  return (
    <div
      className="grid gap-3 rounded-md border border-border bg-card p-4"
      data-usability="optimistic"
    >
      <h4 className="text-base font-semibold">{t('usability.optimistic_title')}</h4>
      <p className="text-sm text-muted-foreground">{t('usability.optimistic_description')}</p>
      <p className="text-sm text-muted-foreground">
        {t('gallery.label_usability_optimistic_note')}
      </p>

      <p className="text-sm">
        <span className="font-medium">{t('usability.optimistic_field_label')}</span>{' '}
        {record.value.name}
      </p>

      <div className="grid gap-2 sm:max-w-sm">
        <Label htmlFor={nameId}>{t('usability.optimistic_field_label')}</Label>
        <Input
          id={nameId}
          onChange={(event) => {
            setDraftName(event.target.value);
          }}
          value={draftName}
        />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Button
          onClick={() => {
            const mutation = record.apply(() => ({ name: draftName }));
            record.commit(mutation);
          }}
          size="sm"
        >
          {t('usability.optimistic_action_apply')}
        </Button>
        <Button
          onClick={() => {
            record.reset(RECORD_START);
          }}
          size="sm"
          variant="outline"
        >
          {t('usability.optimistic_action_reset')}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <input
          checked={failNext}
          id={`${nameId}-fail`}
          onChange={(event) => {
            failNextRef.current = event.target.checked;
            setFailNext(event.target.checked);
          }}
          type="checkbox"
        />
        <Label htmlFor={`${nameId}-fail`}>{t('usability.optimistic_fail_label')}</Label>
      </div>

      <p className="text-sm" data-usability-status="optimistic">
        {record.message}
      </p>
      <p className="text-sm text-muted-foreground">
        {t('usability.optimistic_pending_other', { count: record.pending })}
      </p>
      <p className="text-xs text-muted-foreground">{t('usability.optimistic_queue_note')}</p>
    </div>
  );
}

function ExplainabilitySpecimens(): React.ReactElement {
  return (
    <div className="grid gap-3" data-usability="explainability">
      <p className="text-sm text-muted-foreground">
        {t('gallery.label_usability_explainability_note')}
      </p>

      <div className="grid gap-1">
        <h5 className="text-sm font-medium">{t('gallery.label_usability_held_note')}</h5>
        <ExplainabilityMessage
          expectedBy={t('gallery.label_usability_held_expected')}
          headingId="gallery-explainability-held"
          reason="payment_held"
          reference={t('gallery.label_usability_held_reference')}
          supportHref="/shortcuts"
        />
      </div>

      <div className="grid gap-1">
        <h5 className="text-sm font-medium">{t('gallery.label_usability_delivery_note')}</h5>
        <ExplainabilityMessage
          headingId="gallery-explainability-delivery"
          headingLevel={4}
          reason="delivery_failed"
          reference="corr_01J8ZQ4C9KDELIVERY"
          supportHref="/shortcuts"
        />
      </div>

      <div className="grid gap-1">
        <h5 className="text-sm font-medium">{t('gallery.label_usability_unknown_note')}</h5>
        {/* The reason a payload would carry when this build cannot classify it. */}
        <ExplainabilityMessage
          headingId="gallery-explainability-unknown"
          headingLevel={4}
          reason="provider_code_9f3"
          reference="corr_01J8ZQ4C9KUNKNOWN"
        />
      </div>
    </div>
  );
}

export function ShowcaseUsability(): React.ReactElement {
  return (
    <section aria-labelledby="gallery-usability-heading" className="grid gap-4">
      <h3 className="text-xl font-semibold" id="gallery-usability-heading">
        {t('gallery.label_section_usability')}
      </h3>
      <p className="text-sm text-muted-foreground">{t('gallery.label_usability_note')}</p>

      <div className="grid gap-4 lg:grid-cols-2">
        <SavedViewsSpecimen />
        <UndoSpecimen />
        <AutosaveSpecimen />
        <OptimisticSpecimen />
      </div>

      <ExplainabilitySpecimens />
    </section>
  );
}
