// path: app/(dev)/gallery/showcase-feedback.tsx
'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton';
import { ToastStack } from '@/lib/hooks/use-toast';
import { t } from '@/lib/i18n';

import { useGalleryToasts } from './use-gallery-toasts';

/**
 * The status primitives from sub-step 1.16: badges, skeletons and toasts.
 *
 * The toast queue is deliberately per surface rather than module level, so a
 * request that pushes a toast cannot leak it into the next request that shares
 * the same server process. The gallery shows the same four variants a feature
 * uses: information, success, warning and destructive, each with a title and a
 * description from the catalogue.
 *
 * The skeletons are shown in all three shapes and as a text block, because a
 * skeleton is judged by whether it looks like the content that is coming: a
 * line, a block, a circle and a paragraph with a narrower last line.
 */
export function ShowcaseFeedback(): React.ReactElement {
  const toasts = useGalleryToasts();

  return (
    <section aria-labelledby="gallery-feedback-heading" className="grid gap-4">
      <h3 id="gallery-feedback-heading" className="text-xl font-semibold">
        {t('gallery.label_section_feedback')}
      </h3>

      <div className="flex flex-wrap items-center gap-2">
        <Badge>{t('gallery.label_demo_status_sent')}</Badge>
        <Badge variant="secondary">{t('gallery.label_demo_status_paid')}</Badge>
        <Badge variant="outline">{t('common.label_status')}</Badge>
        <Badge variant="success">{t('gallery.label_demo_status_paid')}</Badge>
        <Badge variant="warning">{t('validation.money_must_be_positive')}</Badge>
        <Badge variant="destructive">{t('common.state_error_title')}</Badge>
      </div>

      <div className="grid gap-4">
        <Skeleton shape="line" className="w-4/5" />
        <Skeleton shape="block" className="h-16" />
        <div className="flex items-center gap-2">
          <Skeleton shape="circle" className="size-11" />
          <SkeletonText lines={2} className="flex-1" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={() => toasts.pushInfo()}>
          {t('common.action_learn_more')}
        </Button>
        <Button variant="outline" onClick={() => toasts.pushSuccess()}>
          {t('common.action_save')}
        </Button>
        <Button variant="outline" onClick={() => toasts.pushWarning()}>
          {t('common.action_reset')}
        </Button>
        <Button variant="outline" onClick={() => toasts.pushDestructive()}>
          {t('common.action_retry')}
        </Button>
      </div>

      <ToastStack toasts={toasts.toasts} onDismiss={toasts.dismiss} />
    </section>
  );
}
