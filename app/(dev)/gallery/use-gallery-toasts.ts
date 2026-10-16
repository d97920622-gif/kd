// path: app/(dev)/gallery/use-gallery-toasts.ts
'use client';

import { useMemo } from 'react';

import { useToastQueue, type ToastRequest } from '@/lib/hooks/use-toast';
import { t } from '@/lib/i18n';

/**
 * The gallery's toast queue.
 *
 * The queue itself belongs to lib/hooks/use-toast.tsx and is created per
 * surface, which is the whole point of that module: a module level queue would
 * be shared by every request handled by the same server process and would show
 * one tenant's message to another. This hook only gives the four variants
 * catalogue copy, so the gallery demonstrates the primitives without writing
 * an English sentence inside a component.
 */
export interface GalleryToasts {
  readonly toasts: ReturnType<typeof useToastQueue>['toasts'];
  readonly dismiss: (id: string) => void;
  readonly pushInfo: () => void;
  readonly pushSuccess: () => void;
  readonly pushWarning: () => void;
  readonly pushDestructive: () => void;
}

export function useGalleryToasts(): GalleryToasts {
  const queue = useToastQueue();

  return useMemo(() => {
    const title = t('gallery.label_demo_toast_title');
    const description = t('gallery.label_demo_toast_message');
    const push = (request: ToastRequest): void => {
      queue.push(request);
    };

    return {
      toasts: queue.toasts,
      dismiss: queue.dismiss,
      pushInfo: () => push({ title, description }),
      pushSuccess: () => push({ title, description, variant: 'success' }),
      pushWarning: () => push({ title, description, variant: 'warning' }),
      pushDestructive: () =>
        push({
          title: t('common.state_error_title'),
          description: t('common.state_error_message'),
          variant: 'destructive',
        }),
    };
  }, [queue]);
}
