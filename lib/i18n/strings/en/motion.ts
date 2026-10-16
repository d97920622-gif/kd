// path: lib/i18n/strings/en/motion.ts
/**
 * Copy for motion and media surfaces.
 *
 * Small on purpose. Motion in this product has no words of its own - a
 * transition does not speak and confetti is hidden from assistive technology -
 * so the only strings here belong to the two places a *person* needs telling
 * something: the celebration that a milestone happened, and the note that says
 * the celebration is off when the reader has asked for less motion. Those two
 * sentences exist because the promise of reduced motion is "the same
 * information, less movement": the milestone must be announced in words when the
 * paper does not fall.
 *
 * Append protocol: add, never rename or remove.
 */
export const motion = {
  label_celebration_title: 'That step is complete',
  label_celebration_description:
    'The work you finished is saved, and the next step is waiting whenever you are ready.',
  label_celebration_reduced:
    'The celebration is switched off because this device asks for less motion. Nothing else changes: your work is saved.',
  label_animation_still_note: 'A still drawing of the animation beside it.',
} as const;
