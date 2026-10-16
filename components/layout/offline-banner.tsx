// path: components/layout/offline-banner.tsx
'use client';

import { WifiOff } from 'lucide-react';
import { useSyncExternalStore } from 'react';

import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils/cn';

/**
 * OfflineBanner: tells the reader the connection dropped before they lose work.
 *
 * A business application is used on a phone, on a train, in a basement stock
 * room. When the connection drops, a form that silently fails to save is the
 * worst outcome in the product: the reader keeps typing, the reader believes
 * the work is saved, and the work is gone. So the browser's own connectivity
 * report is surfaced as soon as it changes - the reader learns the state of the
 * line from the page rather than from a failure three screens later.
 *
 * The browser events are an external store, so the component subscribes to
 * them with `useSyncExternalStore` rather than copying them into state inside
 * an effect. That is not a stylistic preference: it is what makes the first
 * render correct. A state-plus-effect version renders "online" on the server,
 * then renders "online" again on the client's first paint, and only shows the
 * banner one paint later - a visible flash of the wrong answer on every load
 * for a reader who is offline. Reading the store during render means the first
 * client paint already has the right value, and the server snapshot is
 * explicitly "online", because a server render has no connection to report on.
 *
 * Two more decisions:
 *
 *   - **`role="status"` on a live region, not an alert.** The banner is
 *     information, not an emergency: it must be announced politely, without
 *     interrupting what the reader is doing, and it must not steal focus. A
 *     dialog here would be a modal that says "you cannot save" - true, and
 *     hostile.
 *   - **Nothing renders while the connection is up.** A permanent "online"
 *     badge trains the reader to ignore the area where the bad news will
 *     appear.
 *
 * The banner is a sticky, non-fixed band pinned under the top bar: it is part
 * of the shell column, so it never covers the content, and it is hidden in
 * print, where the connection state is meaningless.
 */
function subscribeToConnectivity(onChange: () => void): () => void {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
}

function readOnline(): boolean {
  return navigator.onLine;
}

/** A server render has no connection to report, so it reports the good one. */
function readOnlineOnServer(): boolean {
  return true;
}

export interface OfflineBannerProps {
  readonly className?: string;
}

export function OfflineBanner({ className }: OfflineBannerProps): React.ReactElement | null {
  const online = useSyncExternalStore(subscribeToConnectivity, readOnline, readOnlineOnServer);
  if (online) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      data-layout="offline-banner"
      data-print="hide"
      className={cn(
        'flex items-start gap-3 border-b border-border bg-warning px-gutter py-3 text-warning-foreground',
        className,
      )}
    >
      <WifiOff aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 text-sm">
        <p className="font-medium">{t('shells.label_offline_title')}</p>
        <p className="text-warning-foreground">{t('shells.label_offline_detail')}</p>
      </div>
    </div>
  );
}
