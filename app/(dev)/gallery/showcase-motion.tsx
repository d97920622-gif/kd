// path: app/(dev)/gallery/showcase-motion.tsx
'use client';

import { useState } from 'react';

import { AnimationSlot } from '@/components/motion/animation-slot';
import { Confetti } from '@/components/motion/confetti';
import { MotionProvider } from '@/components/motion/motion-provider';
import { PressFeedback } from '@/components/motion/press-feedback';
import { Reveal } from '@/components/motion/reveal';
import { StaggerList } from '@/components/motion/stagger-list';
import { LiveRegion } from '@/components/shared/live-region';
import { StateIllustration } from '@/components/shared/state-illustration';
import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n';

/**
 * The motion layer, rendered in the gallery so every animation is reviewed in
 * all four themes like every other component.
 *
 * The gallery's rule is that it shows primitives, never a product screen. Motion
 * is the hardest case for that rule, because an animation is only visible while
 * it runs and a still image of one proves nothing. So each animation here is
 * *runnable*: a control starts it, and the things that matter are all in the
 * markup a reviewer can inspect -
 *
 *   - every animated element carries `data-motion` and `data-motion-reduced`, so
 *     the reduced decision is readable from the DOM rather than from a debugger;
 *   - the celebration removes its own layer and reports that it did, through the
 *     live region this page already has;
 *   - the second pane pins the motion preference to `reduce`, which is how a
 *     reviewer on a machine that has never set the preference can still check
 *     that the reduced path is real rather than a claim in a comment.
 *
 * Nothing here is a page's animation. The specimens use catalogue copy and an
 * obvious specimen list, and the shapes are drawn from the semantic surface
 * roles, so a theme change repaints them with the rest of the page.
 */
export function ShowcaseMotion(): React.ReactElement {
  const [revealCount, setRevealCount] = useState(0);
  const [staggerRun, setStaggerRun] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const [announcement, setAnnouncement] = useState<string | null>(null);

  const staggerRows = [
    t('gallery.label_demo_stagger_one'),
    t('gallery.label_demo_stagger_two'),
    t('gallery.label_demo_stagger_three'),
    t('gallery.label_demo_stagger_four'),
    t('gallery.label_demo_stagger_five'),
    t('gallery.label_demo_stagger_six'),
    t('gallery.label_demo_stagger_seven'),
  ];

  return (
    <section aria-labelledby="gallery-motion-heading" className="grid gap-4">
      <h3 id="gallery-motion-heading" className="text-xl font-semibold">
        {t('gallery.label_section_motion')}
      </h3>
      <p className="max-w-sheet text-base text-muted-foreground">
        {t('gallery.label_motion_note')}
      </p>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="grid gap-2">
          <PressFeedback>
            <Button type="button" variant="outline">
              {t('gallery.label_demo_press')}
            </Button>
          </PressFeedback>
          <p className="max-w-sheet text-sm text-muted-foreground">
            {t('gallery.label_demo_press_note')}
          </p>
        </div>

        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRevealCount((value) => value + 1);
              }}
            >
              {t('gallery.label_demo_reveal')}
            </Button>
            {revealCount > 0 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setRevealCount((value) => value + 1);
                }}
              >
                {t('gallery.label_demo_reveal_replace')}
              </Button>
            ) : null}
          </div>
          {revealCount > 0 ? (
            // The key is the identity of the result, not of the panel: swapping
            // the key is what makes a second save look like a second arrival
            // instead of the same panel quietly sitting there.
            <Reveal key={revealCount} className="rounded-lg border border-border bg-card p-4">
              <p className="text-base font-medium">{t('gallery.label_demo_reveal_title')}</p>
              <p className="text-sm text-muted-foreground">{t('gallery.label_demo_reveal_body')}</p>
            </Reveal>
          ) : null}
        </div>
      </div>

      <div className="grid gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setStaggerRun((value) => value + 1);
            }}
          >
            {t('gallery.label_demo_stagger_replay')}
          </Button>
          <p className="max-w-sheet text-sm text-muted-foreground">
            {t('gallery.label_demo_stagger_note')}
          </p>
        </div>
        <StaggerList key={staggerRun}>
          {staggerRows.map((row) => (
            <div key={row} className="rounded-md border border-border bg-card px-4 py-2 text-sm">
              {row}
            </div>
          ))}
        </StaggerList>
      </div>

      <div className="grid gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={() => {
              setCelebrating(true);
            }}
            disabled={celebrating}
          >
            {t('gallery.label_demo_celebrate')}
          </Button>
          <LiveRegion message={announcement} />
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-base font-semibold">{t('motion.label_celebration_title')}</p>
          <p className="max-w-sheet text-sm text-muted-foreground">
            {t('motion.label_celebration_description')}
          </p>
        </div>
        {celebrating ? (
          <Confetti
            pieces={24}
            seconds={3}
            onDone={() => {
              setCelebrating(false);
              setAnnouncement(t('gallery.label_demo_celebrated'));
            }}
          />
        ) : null}
      </div>

      <div className="grid gap-2">
        <p className="text-base font-medium">{t('gallery.label_demo_animation_title')}</p>
        <p className="max-w-sheet text-sm text-muted-foreground">
          {t('gallery.label_demo_animation_note')}
        </p>
        <AnimationSlot
          ratio="wide"
          label={t('gallery.label_demo_animation_title')}
          still={<StateIllustration kind="empty" />}
        >
          <StaggerList as="div" className="w-sheet grid-cols-3 gap-2 p-4">
            {[0, 1, 2].map((block) => (
              <div key={block} className="h-16 rounded-md bg-primary/20" />
            ))}
          </StaggerList>
        </AnimationSlot>
        <p className="text-sm text-muted-foreground">{t('motion.label_animation_still_note')}</p>
      </div>

      <MotionProvider force="reduce">
        <div
          data-motion-pane="reduced"
          className="grid gap-3 rounded-lg border border-dashed border-border bg-muted p-4"
        >
          <p className="text-base font-medium">{t('gallery.label_motion_reduced_pane')}</p>
          <p className="max-w-sheet text-sm text-muted-foreground">
            {t('gallery.label_motion_reduced_note')}
          </p>
          <Reveal className="rounded-md border border-border bg-card px-4 py-2 text-sm">
            {t('gallery.label_demo_reveal_title')}
          </Reveal>
          <StaggerList as="div" className="grid-cols-3 gap-2">
            {[0, 1, 2].map((row) => (
              <div key={row} className="rounded-md border border-border bg-card px-3 py-2 text-sm">
                {t('gallery.label_demo_value_notes')}
              </div>
            ))}
          </StaggerList>
          <AnimationSlot ratio="square" width="tooltip" still={<StateIllustration kind="empty" />}>
            <StaggerList as="div" className="grid-cols-2 gap-2 p-2">
              {[0, 1].map((block) => (
                <div key={block} className="h-8 rounded-sm bg-accent/40" />
              ))}
            </StaggerList>
          </AnimationSlot>
          <Confetti seconds={1} />
        </div>
      </MotionProvider>
    </section>
  );
}
