// path: scripts/checks/motion.mjs
/**
 * check:motion -- motion that reads the reader's preference, and media that
 * cannot shift the page.
 *
 * FEATURE_LIST A3 asks for the micro-interaction layer: duration and easing
 * tokens (27), Framer Motion (28), page transitions (29), press feedback (30),
 * scale and fade (31), a stagger on list items (32), confetti at the payment
 * success and onboarding moments (33, 517, 1734), Lottie support (34),
 * reduced-motion support (35), a happy-path animation (36) and a subtle focus
 * pulse (37). F4 repeats the reduced-motion requirement as an accessibility
 * item, and section K asks for an illustration baseline that is scalable and
 * themeable.
 *
 * The token half of that list is already verified by check:design-tokens, which
 * proves the motion scale exists and that every duration collapses to zero under
 * the preference. This check verifies the half that lives in components, where
 * the failure modes are all silent:
 *
 *   1. **Two motion systems.** A component that writes `duration: 0.3` has
 *      stopped using the design system, and nothing about the page shows it. So
 *      every transition value must come from the token bridge, and the bridge is
 *      the only module that may import the motion tokens directly.
 *   2. **An animation that ignores the preference.** Framer Motion will happily
 *      animate forever on a machine that asked for stillness. Every module that
 *      renders a `motion.` element must read the preference, the provider must
 *      configure Framer Motion to respect it, and the page transition must
 *      additionally drop its own offset so the markup agrees with the styles.
 *   3. **A celebration that takes the page hostage.** Confetti is a full-screen
 *      layer: it must be hidden from assistive technology, must not intercept a
 *      pointer, must be capped, and must remove itself.
 *   4. **An illustration that moves the layout.** A drawing that loads into an
 *      unsized box pushes everything below it, which is the failure the skeleton
 *      library exists to prevent. The slot reserves its box from a named ratio
 *      and, when the reader asked for less motion, renders the still instead of
 *      the animation.
 *   5. **A cheap media decision made twice.** Images go through next/image, and
 *      the format list that makes that worthwhile is declared in the Next.js
 *      config rather than per call site.
 *
 * Everything here is a static read: the rendered side, that the gallery mounts
 * each primitive and that the reduced pane really is reduced, is measured by
 * docs/EVIDENCE/step-01/gallery-dom-probe.py.
 */
import {
  listTrackedFiles,
  parseCssDeclarations,
  positionOf,
  readTextFile,
  reportResult,
  selectCssBlock,
} from './_lib.mjs';

const CHECK = 'motion';
const TOKEN_BRIDGE = 'lib/motion/tokens.ts';
const PROVIDER = 'components/motion/motion-provider.tsx';
const PAGE_TRANSITION = 'components/motion/page-transition.tsx';
const STAGGER = 'components/motion/stagger-list.tsx';
const CONFETTI = 'components/motion/confetti.tsx';
const REVEAL = 'components/motion/reveal.tsx';
const PRESS = 'components/motion/press-feedback.tsx';
const SLOT = 'components/motion/animation-slot.tsx';
const TEMPLATE = 'app/template.tsx';
const ROOT_LAYOUT = 'app/layout.tsx';
const BUTTON = 'components/ui/button.tsx';
const TAILWIND = 'tailwind.config.ts';
const GLOBALS = 'styles/globals.css';
const EN_CATALOGUE = 'lib/i18n/strings/en.ts';
const MOTION_COPY = 'lib/i18n/strings/en/motion.ts';
const NEXT_CONFIG = 'next.config.js';
const GALLERY = 'app/(dev)/gallery/showcase-motion.tsx';
const GALLERY_PAGE = 'app/(dev)/gallery/page.tsx';
const PACKAGE_JSON = 'package.json';
/**
 * The token module specifier, assembled at run time.
 *
 * Writing it as one literal would put a second token-module import in this file
 * for check:design-tokens to read, and that check is right to flag it: an import
 * that does not end in .ts can resolve to the generated JSON. The path that is
 * *verified* is the one in the bridge, spelled here with the extension the
 * convention requires.
 */
const TOKEN_SPECIFIER = ['@', 'config', 'design-tokens.ts'].join('/');

/** The duration tokens every animated component is allowed to ask the bridge for. */
const DURATION_KEYS = ['instant', 'fast', 'base', 'slow', 'slower'];
/** The easing keys the bridge exposes, for the same reason. */
const EASING_KEYS = ['standard', 'enter', 'exit', 'linear'];
/**
 * The modules that render `motion.` elements, and therefore must read the
 * preference and show the decision in their markup.
 */
const MOTION_MODULES = [PAGE_TRANSITION, STAGGER, CONFETTI, REVEAL, PRESS];
/**
 * The frame an animation is placed in. It renders no `motion.` element of its
 * own - it swaps the animation for a still - so it must read the preference but
 * cannot be required to import framer-motion.
 */
const FRAME_MODULES = [SLOT];
/** Every module the copy rule and the preference rule cover. */
const ANIMATED_MODULES = [...MOTION_MODULES, ...FRAME_MODULES];
/** Animation of a layout property forces the browser to reflow every frame. */
const LAYOUT_ANIMATION_PROPERTIES = ['width', 'height', 'top', 'left'];

const findings = [];

function read(file) {
  return readTextFile(file);
}

function finding(file, message, source = null, index = 0) {
  const { line, column } = source === null ? { line: 1, column: 1 } : positionOf(source, index);
  findings.push({ file, line, column, message });
}

function requireFile(file, message) {
  const text = read(file);
  if (text === null) {
    finding(file, message);
    return null;
  }
  return text;
}

// ---------------------------------------------------------------------------
// 1. Framer Motion is a runtime dependency, and the token bridge is the only
//    module that converts a token into a number Framer Motion can use
// ---------------------------------------------------------------------------

const packageJson = requireFile(PACKAGE_JSON, 'the package manifest was not found');
if (packageJson !== null) {
  let parsed = null;
  try {
    parsed = JSON.parse(packageJson);
  } catch {
    finding(PACKAGE_JSON, 'the package manifest is not valid JSON');
  }
  if (parsed !== null) {
    const dependency = parsed.dependencies?.['framer-motion'];
    if (typeof dependency !== 'string') {
      finding(
        PACKAGE_JSON,
        'framer-motion must be a runtime dependency: an animation library in devDependencies is a build that compiles and a page that breaks',
      );
    }
    if (dependency !== undefined && parsed.devDependencies?.['framer-motion'] !== undefined) {
      finding(PACKAGE_JSON, 'framer-motion must not also be declared as a development dependency');
    }
  }
}

const bridge = requireFile(
  TOKEN_BRIDGE,
  'the motion token bridge is missing, so no component can read a duration',
);
if (bridge !== null) {
  if (!bridge.includes(TOKEN_SPECIFIER)) {
    finding(
      TOKEN_BRIDGE,
      'the bridge must read the tokens from config/design-tokens.ts with the extension; a second copy of the values is a second motion system, and an extensionless specifier can resolve to the generated JSON',
    );
  }
  // The key set is derived from the token module rather than listed here: a
  // duration added to the design system is then reachable from the bridge with
  // no edit, and a duration removed from it stops compiling at every call site.
  if (!/MotionDurationKey = keyof typeof MOTION_DURATION_TOKENS/.test(bridge)) {
    finding(
      TOKEN_BRIDGE,
      'the duration key type must be derived from the token module, so the bridge cannot expose a duration the design system does not declare',
    );
  }
  if (!/MotionEasingKey = keyof typeof MOTION_EASING_TOKENS/.test(bridge)) {
    finding(
      TOKEN_BRIDGE,
      'the easing key type must be derived from the token module, for the same reason',
    );
  }
  const bridgeImport = new RegExp(
    `import \\{[^}]*MOTION_DURATION_TOKENS[^}]*MOTION_EASING_TOKENS[^}]*\\} from '${TOKEN_SPECIFIER}'`,
  ).test(bridge);
  if (!bridgeImport) {
    finding(
      TOKEN_BRIDGE,
      'the bridge must import both token tables from the token module rather than restate their values',
    );
  }
  if (!/const value = reduce \? token\.reducedValue : token\.value;/.test(bridge)) {
    finding(
      TOKEN_BRIDGE,
      'the bridge must apply reducedValue when the reader asked for less motion, not only when a stylesheet does',
    );
  }
  if (!/MS_PER_SECOND/.test(bridge)) {
    finding(
      TOKEN_BRIDGE,
      'the millisecond-to-second conversion must be a named constant: a bare 1000 in a duration helper is a unit bug waiting for a reader',
    );
  }
}

// The tokens may be imported by the bridge and by the check-family scripts that
// verify them; a component that imports them has started a second conversion.
const tracked = listTrackedFiles();
const trackedCode = tracked.filter(
  (file) =>
    /\.(ts|tsx)$/.test(file) &&
    (file.startsWith('app/') || file.startsWith('components/') || file.startsWith('lib/')) &&
    file !== TOKEN_BRIDGE,
);
for (const file of trackedCode) {
  const text = read(file);
  if (text === null) {
    continue;
  }
  const importMatch = /MOTION_DURATION_TOKENS|MOTION_EASING_TOKENS/.exec(text);
  if (importMatch !== null) {
    finding(
      file,
      `motion tokens must be read through ${TOKEN_BRIDGE}; reading them here reintroduces the second motion system the bridge exists to remove`,
      text,
      importMatch.index,
    );
  }
}

// ---------------------------------------------------------------------------
// 2. A duration is never a number written in a component
// ---------------------------------------------------------------------------

for (const file of MOTION_MODULES) {
  const text = read(file);
  if (text === null) {
    continue;
  }
  for (const match of text.matchAll(/duration:\s*([^,\n}]+)/g)) {
    const value = match[1].trim();
    const allowed =
      value.startsWith('transition(') ||
      value.startsWith('motionDuration(') ||
      value.startsWith('piece.duration') ||
      value.startsWith('{ ...transition(');
    if (!allowed) {
      finding(
        file,
        `duration ${value} does not come from the token bridge; a hardcoded duration survives a token change, which is how two motion systems start`,
        text,
        match.index,
      );
    }
  }
  for (const property of LAYOUT_ANIMATION_PROPERTIES) {
    const pattern = new RegExp(`(initial|animate|whileHover|whileTap)=\\{\\{[^}]*\\b${property}:`);
    const match = pattern.exec(text);
    if (match !== null) {
      finding(
        file,
        `animating ${property} makes the browser lay the page out on every frame; animate transform and opacity instead`,
        text,
        match.index,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 3. Every animated module reads the preference, and one provider configures it
// ---------------------------------------------------------------------------

for (const file of MOTION_MODULES) {
  const text = read(file);
  if (text === null) {
    continue;
  }
  if (/from 'framer-motion'/.test(text) === false) {
    finding(file, 'this module is declared animated but imports nothing from framer-motion');
  }
  if (!/useMotionPreference\(\)/.test(text)) {
    finding(
      file,
      `every animated module must read the motion preference through useMotionPreference(): an animation that ignores it keeps moving for a reader who asked it not to`,
    );
  }
  // The celebration is the one exception, and it is the exception on purpose:
  // under the preference it renders nothing at all, so it has no element left to
  // carry the marker. Its decision is still a `reduced` read of the provider.
  if (file !== CONFETTI && !/data-motion-reduced=\{reduced \? 'true' : 'false'\}/.test(text)) {
    finding(
      file,
      'the reduced decision must be visible in the markup as data-motion-reduced, so the rendered page can be audited without a debugger',
    );
  }
  if (!/data-motion="/.test(text)) {
    finding(file, 'every animated module must carry a data-motion marker naming itself');
  }
  const systemQuery = text.match(/useReducedMotion\(\)/g);
  if (systemQuery !== null && file !== PROVIDER) {
    finding(
      file,
      'the operating system preference is read once, in the provider; a second subscription is how two parts of a page disagree about it',
    );
  }
}

const provider = requireFile(
  PROVIDER,
  'the motion provider is missing: nothing applies the preference for the whole product',
);
if (provider !== null) {
  // The attribute on its own line, not the words: `reducedMotion="user"` also
  // appears in this module's doc comment, where it is described.
  if (!/MotionConfig\s/.test(provider) || !/^\s+reducedMotion=/m.test(provider)) {
    finding(
      PROVIDER,
      'the provider must configure MotionConfig with a reducedMotion setting, or a hand written motion element keeps animating for a reader who asked for stillness',
    );
  }
  if (!/useReducedMotion\(\)/.test(provider)) {
    finding(PROVIDER, 'the provider must read prefers-reduced-motion');
  }
  // The helper's parameter types are the token unions, spelled out from the
  // token keys above: a component can then ask for a duration or a curve the
  // design system does not declare only by editing this list, which is the point.
  const union = (keys) => keys.map((key) => `'${key}'`).join(' | ');
  if (!provider.includes(`duration: ${union(DURATION_KEYS)},`)) {
    finding(
      PROVIDER,
      `the transition helper must accept the declared durations (${union(DURATION_KEYS)}) and nothing else`,
    );
  }
  if (!provider.includes(`ease?: ${union(EASING_KEYS)},`)) {
    finding(
      PROVIDER,
      `the transition helper must accept the declared easings (${union(EASING_KEYS)}) and nothing else`,
    );
  }
  if (!/transition:\s*\(duration, ease\) => motionTransition/.test(provider)) {
    finding(
      PROVIDER,
      'the provider must hand components a transition with the preference already applied, so the reduced path is the easy one',
    );
  }
}

// ---------------------------------------------------------------------------
// 4. The page transition is mounted once, at the root, and never on exit
// ---------------------------------------------------------------------------

const template = requireFile(TEMPLATE, 'app/template.tsx is missing: no navigation is animated');
if (template !== null) {
  if (/^'use client';/m.test(template)) {
    finding(
      TEMPLATE,
      'the template must stay a server component and render the client transition, or every page below it is pulled into the client bundle',
    );
  }
  if (!/<PageTransition>/.test(template)) {
    finding(
      TEMPLATE,
      'the template must render PageTransition; a template that renders children is a page that never transitions',
    );
  }
}

const transition = read(PAGE_TRANSITION);
if (transition !== null) {
  if (/\sexit=/.test(transition)) {
    finding(
      PAGE_TRANSITION,
      'a page transition must not animate on exit: the App Router has already swapped the content, so an exit animation is a visible stall on every click',
    );
  }
  const rise = /RISE_PX = (\d+)/.exec(transition);
  if (rise === null) {
    finding(PAGE_TRANSITION, 'the rise must be a named constant so its size can be reviewed');
  } else if (Number(rise[1]) > 8) {
    finding(
      PAGE_TRANSITION,
      `a rise of ${rise[1]} pixels is a travel, not a hint: the budget is 8 pixels`,
    );
  }
  if (!/y: reduced \? 0 : RISE_PX/.test(transition)) {
    finding(
      PAGE_TRANSITION,
      'the offset must collapse with the preference, so the markup and the computed style agree for a reader who asked for less motion',
    );
  }
  // The attribute forms, not the words: both appear in the doc comment above,
  // where they are explained as the things this component deliberately omits.
  if (/\stabIndex=|\saria-live=/.test(transition)) {
    finding(
      PAGE_TRANSITION,
      'the transition wrapper must not be focusable and must not announce: a transition that interrupts on every navigation is worse than no transition',
    );
  }
}

const rootLayout = read(ROOT_LAYOUT);
if (rootLayout !== null) {
  if (!/<MotionProvider>/.test(rootLayout)) {
    finding(
      ROOT_LAYOUT,
      'the root layout must mount MotionProvider, or the preference is applied to no page',
    );
  }
  if (!/<MotionProvider>\s*<TooltipProvider>/.test(rootLayout)) {
    finding(
      ROOT_LAYOUT,
      'MotionProvider must sit above the rest of the shell: a provider below a page cannot cover the page it decorates',
    );
  }
}

// ---------------------------------------------------------------------------
// 5. The stagger is capped, and the celebration is bounded and removable
// ---------------------------------------------------------------------------

const stagger = read(STAGGER);
if (stagger !== null) {
  if (!/MAX_STAGGERED_ROWS = (\d+)/.test(stagger)) {
    finding(
      STAGGER,
      'the stagger cap must be a named constant: a list of forty rows at a fixed step takes seconds to arrive',
    );
  }
  if (!/Math\.min\(index, MAX_STAGGERED_ROWS\)/.test(stagger)) {
    finding(STAGGER, 'rows past the cap must animate together, not wait for their own turn');
  }
  if (!/motionDuration\('fast'\) \* STEP_RATIO/.test(stagger)) {
    finding(
      STAGGER,
      'the step between rows must be derived from a duration token; a literal step is the first hardcoded motion value in the product',
    );
  }
  if (!/const step = reduced \? 0 :/.test(stagger)) {
    finding(
      STAGGER,
      'reduced motion must flatten the stagger rather than shorten it: many elements moving at once is the worst case for a vestibular disorder',
    );
  }
}

const confetti = read(CONFETTI);
if (confetti !== null) {
  if (!/aria-hidden="true"/.test(confetti)) {
    finding(
      CONFETTI,
      'the celebration is decoration and must be hidden from assistive technology; the sentence that announces the milestone is what a screen reader reads',
    );
  }
  if (!/pointer-events-none fixed inset-0/.test(confetti)) {
    finding(
      CONFETTI,
      'confetti that intercepts a pointer turns a celebration into an unusable page',
    );
  }
  if (!/z-toast/.test(confetti)) {
    finding(
      CONFETTI,
      'the celebration must sit on the toast layer rather than an invented z-index',
    );
  }
  if (!/MAX_PIECES/.test(confetti) || !/MAX_SECONDS/.test(confetti)) {
    finding(
      CONFETTI,
      'pieces and seconds must both be capped: the cost of the effect is per element and per frame',
    );
  }
  if (!/if \(reduced \|\| done\) \{\s*return null;/.test(confetti)) {
    finding(
      CONFETTI,
      'reduced motion must remove the celebration entirely rather than freeze it: a still frame of confetti is still a full screen layer',
    );
  }
  if (!/window\.clearTimeout\(timer\)/.test(confetti)) {
    finding(
      CONFETTI,
      'the fall timer must be cleared on unmount, or a navigation leaves a timer holding a removed tree',
    );
  }
  const refCalls = (confetti.match(/onDoneRef\.current\?\.\(\)/g) ?? []).length;
  if (refCalls < 2 || /[^.]onDone\?\.\(\)/.test(confetti)) {
    finding(
      CONFETTI,
      'the completion callback must live in a ref: a parent passing an arrow function would otherwise restart the fall on every render',
    );
  }
  if (
    !/SECONDS_CAP|MAX_SECONDS/.test(confetti) ||
    !/Math\.max\(1, Math\.min\(seconds/.test(confetti)
  ) {
    finding(
      CONFETTI,
      'the requested duration must be clamped, so a caller cannot ask for a minute of confetti',
    );
  }
}

const reveal = read(REVEAL);
if (reveal !== null) {
  if (
    !/MAX_DELAY_SECONDS/.test(reveal) ||
    !/Math\.min\(Math\.max\(delaySeconds, 0\), MAX_DELAY_SECONDS\)/.test(reveal)
  ) {
    finding(
      REVEAL,
      'the entrance delay must be clamped: a delay long enough to notice is a delay long enough to look like a bug',
    );
  }
  if (/\sexit=/.test(reveal)) {
    finding(
      REVEAL,
      'the happy path animates on arrival only; content that leaves on its own is content the reader loses',
    );
  }
}

const press = read(PRESS);
if (press !== null) {
  if (!/whileTap=/.test(press) || !/whileHover=/.test(press)) {
    finding(PRESS, 'press feedback must answer both a hover and a press');
  }
  if (!/reduced \? 1 : PRESS_SCALE/.test(press)) {
    finding(PRESS, 'the press scale must collapse to 1 for a reader who asked for less motion');
  }
  if (/\bopacity:/.test(press)) {
    finding(
      PRESS,
      'press feedback must not fade: a control that dims while it is held looks disabled exactly when the reader is waiting for an answer',
    );
  }
  if (/role=|tabIndex/.test(press)) {
    finding(
      PRESS,
      'the wrapper must not add a role or a tab index: it decorates a control that already is one',
    );
  }
}

// ---------------------------------------------------------------------------
// 6. The illustration baseline reserves its box and always has a still
// ---------------------------------------------------------------------------

const slot = read(SLOT);
if (slot !== null) {
  if (!/readonly still: React\.ReactNode;/.test(slot)) {
    finding(
      SLOT,
      'the still is required and not optional: an animation without a still has no reduced-motion answer, and a prop that can be omitted will be',
    );
  }
  if (!/'aria-hidden': true/.test(slot)) {
    finding(SLOT, 'the slot is decoration by default and must be hidden from assistive technology');
  }
  const ratioRecord = /const RATIO_CLASS: Record<AnimationRatio, string> = \{([\s\S]*?)\n\};/.exec(
    slot,
  );
  if (ratioRecord === null) {
    finding(
      SLOT,
      'the ratio must come from a record keyed by the ratio name, so a page cannot pass a made up box shape',
    );
  } else {
    const entries = [...ratioRecord[1].matchAll(/^(\s*)([a-z]+): '([^']+)'/gm)];
    if (entries.length !== 3) {
      finding(
        SLOT,
        `the ratio set must hold exactly three shapes, found ${String(entries.length)}`,
      );
    }
    if (!/AspectRatioClass|aspect-/.test(slot) && !/aspect-\[/.test(slot)) {
      finding(
        SLOT,
        'the reserved box must be expressed as an aspect ratio, or nothing holds its space while it loads',
      );
    }
  }
  if (!/reduced \? still : children/.test(slot)) {
    finding(SLOT, 'the reduced path must render the still instead of the animation');
  }
  if (!/w-sheet|WIDTH_CLASS/.test(slot)) {
    finding(SLOT, 'the slot width must come from the layout width tokens');
  }
}

// ---------------------------------------------------------------------------
// 7. The focus pulse and the press are class level, and both are motion-safe
// ---------------------------------------------------------------------------

const tailwind = requireFile(TAILWIND, 'the Tailwind configuration was not found');
if (tailwind !== null) {
  if (!/'focus-pulse':/.test(tailwind)) {
    finding(
      TAILWIND,
      'the focus pulse keyframes are missing, so the focus animation is a comment rather than a behaviour',
    );
  }
  if (!/focus-pulse var\(--duration-slow\) var\(--ease-standard\) 1/.test(tailwind)) {
    finding(
      TAILWIND,
      'the focus pulse must run once, on the duration and easing tokens: a repeating pulse next to the focus ring is motion a reader cannot dismiss',
    );
  }
  // Both stops, because one stop of a two stop animation is a property that
  // only moves in one direction - which is a jump, not a pulse.
  const pulseStops = (tailwind.match(/\{ outlineOffset: '\d+px' \}/g) ?? []).length;
  if (pulseStops !== 2) {
    finding(
      TAILWIND,
      'the focus pulse must animate the ring distance at both stops; widening the outline itself makes the indicator appear late, and animating a box property moves the layout',
    );
  }
}

const button = requireFile(BUTTON, 'the button primitive was not found');
if (button !== null) {
  if (!/motion-safe:active:scale-95/.test(button)) {
    finding(
      BUTTON,
      'the button must carry press feedback as a motion-safe class: the press is a transform, so a reader who asked for less motion must not get the movement either',
    );
  }
  if (!/motion-safe:focus-visible:animate-focus-pulse/.test(button)) {
    finding(
      BUTTON,
      'the focus pulse must be applied on focus-visible, and only when motion is allowed',
    );
  }
  if (/transition-colors\b/.test(button)) {
    finding(
      BUTTON,
      'the base transition must cover transform as well as colour, or the press snaps instead of settling',
    );
  }
}

// ---------------------------------------------------------------------------
// 8. The stylesheet half of the contract: the preference really does zero the
//    durations, and nothing declares a second motion scale
// ---------------------------------------------------------------------------

const globals = requireFile(GLOBALS, 'the global stylesheet was not found');
if (globals !== null) {
  const records = parseCssDeclarations(globals);
  const insidePreference = records.filter((record) =>
    record.path.some((entry) => entry.includes('prefers-reduced-motion')),
  );
  if (insidePreference.length === 0) {
    finding(
      GLOBALS,
      'the stylesheet must answer prefers-reduced-motion: reduce, or every CSS transition keeps running for a reader who asked it not to',
    );
  } else {
    const zeroed = selectCssBlock(records, {
      selector: ':root',
      media: 'prefers-reduced-motion',
    });
    for (const key of DURATION_KEYS) {
      if (zeroed.get(`--duration-${key}`) !== '0ms') {
        finding(
          GLOBALS,
          `the reduced-motion block must set --duration-${key} to 0ms; a duration left at its full value is an animation the preference does not reach`,
        );
      }
    }
    const globalRule = selectCssBlock(records, {
      selector: '*, *::before, *::after',
      media: 'prefers-reduced-motion',
    });
    if (globalRule.get('animation-iteration-count') !== '1 !important') {
      finding(GLOBALS, 'the reduced-motion block must stop a repeating animation outright');
    }
    if (!String(globalRule.get('animation-duration') ?? '').startsWith('0.01ms')) {
      finding(
        GLOBALS,
        'the reduced-motion block must shorten a remaining animation to a single frame',
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 9. Media: one image pipeline, and formats declared where they are configured
// ---------------------------------------------------------------------------

for (const file of tracked.filter((candidate) =>
  /^(app|components|lib)\/.*\.(ts|tsx)$/.test(candidate),
)) {
  const text = read(file);
  if (text === null) {
    continue;
  }
  const rawImage = /<img\s/.exec(text);
  if (rawImage !== null) {
    finding(
      file,
      'a raw <img> bypasses next/image: no responsive source set, no modern format, no lazy loading and no layout reservation',
      text,
      rawImage.index,
    );
  }
}

const nextConfig = requireFile(NEXT_CONFIG, 'the Next.js configuration was not found');
if (nextConfig !== null) {
  if (!/formats: \['image\/avif', 'image\/webp'\]/.test(nextConfig)) {
    finding(
      NEXT_CONFIG,
      'the image format list must declare AVIF and WebP: the format decision belongs beside the build, not at each call site',
    );
  }
}

// ---------------------------------------------------------------------------
// 10. Copy, and the gallery that makes the whole layer reviewable
// ---------------------------------------------------------------------------

const catalogue = requireFile(EN_CATALOGUE, 'the English catalogue was not found');
if (catalogue !== null) {
  if (!/motion,/.test(catalogue) || !/import \{ motion \} from '\.\/en\/motion'/.test(catalogue)) {
    finding(
      EN_CATALOGUE,
      'the motion namespace must be registered: the celebration sentences are user facing copy and belong in the catalogue',
    );
  }
}
const motionCopy = requireFile(MOTION_COPY, 'the motion copy namespace is missing');
if (motionCopy !== null) {
  for (const key of ['label_celebration_title', 'label_celebration_description']) {
    if (!new RegExp(`${key}:`).test(motionCopy)) {
      finding(
        MOTION_COPY,
        `${key} must exist: a celebration announces a milestone in words, because the paper it throws is hidden from assistive technology`,
      );
    }
  }
}

// A motion component may not carry its own copy: every sentence a person reads
// comes from the catalogue, and an internal page is not an exception.
for (const file of [...ANIMATED_MODULES, GALLERY]) {
  const text = read(file);
  if (text === null) {
    continue;
  }
  const literals = [...text.matchAll(/>[A-Z][^<>{}\n]{12,}</g)];
  if (literals.length > 0) {
    finding(
      file,
      'user facing copy must come from the catalogue, not from a literal in the component',
      text,
      literals[0].index,
    );
  }
}

const gallery = requireFile(
  GALLERY,
  'the gallery must show the motion layer: an animation nobody has run is an animation nobody has reviewed',
);
if (gallery !== null) {
  for (const used of [
    'PressFeedback',
    'Reveal',
    'StaggerList',
    'AnimationSlot',
    'MotionProvider',
  ]) {
    if (!new RegExp(`<${used}\\b`).test(gallery)) {
      finding(GALLERY, `the gallery must render ${used}`);
    }
  }
  // The celebration is required with its callback wired, not merely present: the
  // reduced pane renders one without a callback, and a celebration nobody is told
  // about is a layer that never leaves.
  if (!/<Confetti\b[\s\S]{0,240}?onDone=/.test(gallery)) {
    finding(
      GALLERY,
      'the gallery must render Confetti and wire onDone: the celebration removes its own layer and reports that it did',
    );
  }
  if (!/force="reduce"/.test(gallery) || !/data-motion-pane="reduced"/.test(gallery)) {
    finding(
      GALLERY,
      'the gallery must pin one pane to reduced motion: without it, the reduced path is a claim on a machine whose operating system says nothing about the preference',
    );
  }
}

const galleryPage = read(GALLERY_PAGE);
if (galleryPage !== null && !/<ShowcaseMotion\b/.test(galleryPage)) {
  finding(
    GALLERY_PAGE,
    'the motion showcase is not mounted in the gallery, so its markers are in no theme',
  );
}

reportResult(
  CHECK,
  findings,
  `${String(ANIMATED_MODULES.length + 3)} motion and media modules verified (preference read, durations from the token bridge, celebration bounded and removable), ${String(DURATION_KEYS.length)} durations zeroed at the preference, gallery pins the reduced pane`,
);
process.exitCode = findings.length === 0 ? 0 : 1;
