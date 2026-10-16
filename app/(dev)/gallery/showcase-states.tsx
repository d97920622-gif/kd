// path: app/(dev)/gallery/showcase-states.tsx
'use client';

import { AlertTriangle, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { ErrorBoundary } from '@/components/shared/error-boundary';
import { LiveRegion } from '@/components/shared/live-region';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState, StatusState } from '@/components/shared/status-state';
import { SuccessState } from '@/components/shared/success-state';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { useRetry } from '@/lib/hooks/use-retry';
import { t } from '@/lib/i18n';

/**
 * The page-state system and the accessibility primitives, rendered in the
 * gallery so they are measured in every theme like every other component.
 *
 * The gallery's rule is that it shows primitives and their states, never a
 * product screen; this section is the hardest case for that rule, because a
 * state *is* what a page shows. So each state here is rendered with specimen
 * copy from the catalogue and with placeholder figures that are obviously not
 * real - a reference code, a count, a name - and never with a fetch, a route or
 * a record. Nothing in this file would change if a real page rendered the same
 * component.
 *
 * Three behaviours are shown live rather than described, because a state
 * component that has never run is a state component that has never been seen to
 * work:
 *
 *   - **The boundary retries.** "Break this panel" throws inside a child, the
 *     boundary catches it, and the fallback appears with its own reference. The
 *     reset button below the demo clears the caught error through `resetKey`.
 *   - **The backoff counts down.** The error state's retry control is driven by
 *     `useRetry`, so pressing it shows the disabled state, the countdown in the
 *     button and the attempt count - the three things the hook exists to do.
 *   - **The live region announces.** A button pushes a message into the region,
 *     which is the pattern every later step uses for "Saved" and "3 results".
 */
function BrokenPanel(): React.ReactElement {
  throw new Error('Specimen failure raised on purpose inside the gallery.');
}

export function ShowcaseStates(): React.ReactElement {
  const [broken, setBroken] = useState(false);
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const retry = useRetry({
    manualOnly: true,
    onRetry: () => {
      setAnnouncement(t('gallery.label_demo_retry_attempted'));
    },
  });

  return (
    <section aria-labelledby="gallery-states-heading" className="grid gap-4">
      <h3 id="gallery-states-heading" className="text-xl font-semibold">
        {t('gallery.label_section_page_states')}
      </h3>
      <p className="max-w-sheet text-base text-muted-foreground">
        {t('gallery.label_page_states_note')}
      </p>

      <div className="grid gap-4 xl:grid-cols-2">
        <LoadingState layout="table" rows={3} />
        <LoadingState layout="list" rows={3} />
        <LoadingState layout="form" />
        <LoadingState layout="card" rows={3} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <StatusState
          kind="empty"
          titleKey="states.label_empty_first_title"
          descriptionKey="states.label_empty_first_description"
          primaryAction={{ labelKey: 'states.action_empty_first' }}
        />
        <StatusState
          kind="empty"
          titleKey="states.label_empty_filtered_title"
          descriptionKey="states.label_empty_filtered_description"
          primaryAction={{ labelKey: 'states.action_empty_filtered' }}
        />
        <StatusState
          kind="permission"
          titleKey="states.label_empty_permission_title"
          descriptionKey="states.label_empty_permission_description"
          primaryAction={{ labelKey: 'states.action_empty_permission' }}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ErrorState
          reference="ERR-7Q2M4X8B"
          attempts={Math.max(1, retry.attempts + 1)}
          onRetry={retry.retry}
          onReport={() => {
            setAnnouncement(t('states.label_error_report_copied'));
          }}
        />
        <SuccessState
          reference="INV-7Q2M4X8B"
          redirectSeconds={5}
          onComplete={() => {
            setAnnouncement(t('gallery.label_demo_redirect_finished'));
          }}
        >
          <Button type="button" variant="outline">
            {t('shells.label_document_link')}
          </Button>
        </SuccessState>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <IconButton
          labelKey="gallery.label_demo_icon_delete"
          tooltipKey="gallery.label_demo_icon_delete_hint"
          icon={<Trash2 />}
        />
        <IconButton
          labelKey="gallery.label_demo_icon_warn"
          icon={<AlertTriangle />}
          variant="outline"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setAnnouncement(t('gallery.label_demo_announcement'));
          }}
        >
          {t('gallery.label_demo_announce')}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setBroken((value) => !value);
          }}
        >
          {t('gallery.label_demo_break_panel')}
        </Button>
        <LiveRegion message={announcement} />
      </div>

      <ErrorBoundary scope="gallery-demo" resetKey={broken ? 'broken' : 'intact'}>
        {broken ? <BrokenPanel /> : <p className="text-base">{t('gallery.label_demo_panel_ok')}</p>}
      </ErrorBoundary>
    </section>
  );
}
