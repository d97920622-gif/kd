// path: lib/utils/key-chord.ts
/**
 * Key chords: one spelling, one matcher, one label.
 *
 * A shortcut is written down once, as a string, and read in three places: the
 * listener that decides whether the reader pressed it, the keycap elements that
 * show it, and the `aria-keyshortcuts` attribute that tells assistive
 * technology which chord reaches a control. Those three must agree, and the way
 * they stop agreeing is a second spelling of the same chord. So a chord has one
 * canonical form here - lowercase tokens joined by `+`, with the modifier
 * written as `mod` - and every reader of it goes through this module.
 *
 * **Why `mod` and not `ctrl`.** The plan asks for Cmd+K on macOS and Ctrl+K
 * everywhere else (MASTER_PROMPT, navigation integrity). Writing `ctrl+k` would
 * bind the wrong key on half the machines the product runs on, and writing two
 * entries would let one of them rot. `mod` means "the platform's command
 * modifier": Control on Windows and Linux, Command on macOS. The label shown to
 * the reader is deliberately ASCII and neutral - `Ctrl` - because the
 * alternative is sniffing the platform in the browser, which produces a
 * different first paint on the server and the client, and a hydration mismatch
 * to fix a word.
 *
 * **Why matching is not a string compare.** Two rules, both from how browsers
 * report keys:
 *
 *   - A letter chord is matched on the letter plus exactly the modifiers it
 *     declares, so Ctrl+Shift+K is not Ctrl+K. `event.key` for Ctrl+K is `k`,
 *     and for Ctrl+Shift+K it is `K`, so the letter is compared case-folded and
 *     the shift state is compared separately.
 *   - A symbol chord is matched on the character the reader typed, because the
 *     character already carries its modifier: `?` is Shift+/ on most layouts,
 *     and a chord that demanded Shift as well would depend on the keyboard
 *     layout to work.
 *
 * Nothing here is money, dates or text: it is a chord, and it is the only
 * place the product spells one.
 */

/** The modifier token that means Control on this platform and Command on macOS. */
export const MODIFIER_TOKEN = 'mod';
/** Every modifier token a chord may declare. */
export const MODIFIER_TOKENS = [MODIFIER_TOKEN, 'shift', 'alt'] as const;
export type ChordModifier = (typeof MODIFIER_TOKENS)[number];
export const CHORD_SEPARATOR = '+';

/** A chord split into the modifiers it declares and the key it ends with. */
export interface ParsedChord {
  readonly modifiers: readonly ChordModifier[];
  readonly key: string;
}

/**
 * Split a chord into its parts. The key is always the last token, so
 * `mod+shift+k` declares two modifiers and the key `k`.
 */
export function parseChord(chord: string): ParsedChord {
  const tokens = chord
    .split(CHORD_SEPARATOR)
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token !== '');
  const key = tokens.length === 0 ? '' : tokens[tokens.length - 1];
  const modifiers = tokens
    .slice(0, -1)
    .filter((token): token is ChordModifier => isModifierToken(token));
  return { modifiers, key };
}

function isModifierToken(token: string): token is ChordModifier {
  return (MODIFIER_TOKENS as readonly string[]).includes(token);
}

/** The canonical spelling of a chord, which is what the registry stores. */
export function canonicalChord(chord: string): string {
  const { modifiers, key } = parseChord(chord);
  return [...modifiers, key].join(CHORD_SEPARATOR);
}

/**
 * Whether a keyboard event is this chord.
 *
 * The modifier comparison is exact in both directions: a chord that declares
 * Control is not pressed when Control is up, and a chord that does not declare
 * Control is not pressed when Control is down. That second half is what keeps a
 * shortcut from firing in the middle of a browser shortcut the reader meant.
 */
export function matchesChord(event: KeyboardEvent, chord: string): boolean {
  const { modifiers, key } = parseChord(chord);
  if (key === '') {
    return false;
  }
  const mod = modifiers.includes(MODIFIER_TOKEN);
  const alt = modifiers.includes('alt');
  const shift = modifiers.includes('shift');
  if (mod !== (event.ctrlKey || event.metaKey)) {
    return false;
  }
  if (alt !== event.altKey) {
    return false;
  }
  const isLetter = /^[a-z]$/.test(key);
  if (isLetter && shift !== event.shiftKey) {
    return false;
  }
  return event.key.toLowerCase() === key;
}

/**
 * The labels a reader sees for a chord, one per keycap: `mod+k` becomes `Ctrl`
 * and `K`. Each token gets its own cap because a reader reads the chord as
 * separate keys pressed together, which is also how `aria-keyshortcuts` spells
 * it.
 */
export function chordLabels(chord: string): readonly string[] {
  const { modifiers, key } = parseChord(chord);
  return [...modifiers.map((modifier) => labelForToken(modifier)), labelForKey(key)];
}

function labelForToken(token: ChordModifier): string {
  switch (token) {
    case MODIFIER_TOKEN:
      return 'Ctrl';
    case 'shift':
      return 'Shift';
    case 'alt':
      return 'Alt';
  }
}

function labelForKey(key: string): string {
  switch (key) {
    case 'escape':
      return 'Esc';
    case 'enter':
      return 'Enter';
    case 'arrowup':
      return 'Up';
    case 'arrowdown':
      return 'Down';
    case ' ':
    case 'space':
      return 'Space';
    default:
      return key.length === 1 ? key.toUpperCase() : key;
  }
}

/**
 * The chord as `aria-keyshortcuts` wants it: DOM key names, one string per
 * platform spelling of the same chord. `mod+k` is two chords to assistive
 * technology, because Control+K and Meta+K are two different keys.
 */
export function ariaKeyshortcuts(chord: string): string {
  const { modifiers, key } = parseChord(chord);
  const name = domKeyName(key);
  return modifiers.includes(MODIFIER_TOKEN) ? `Control+${name} Meta+${name}` : name;
}

function domKeyName(key: string): string {
  const named: Record<string, string> = {
    escape: 'Escape',
    enter: 'Enter',
    arrowup: 'ArrowUp',
    arrowdown: 'ArrowDown',
    ' ': 'Space',
  };
  return named[key] ?? (key.length === 1 ? key : key.toUpperCase());
}

/**
 * Whether a key press belongs to a field the reader is typing in.
 *
 * A shortcut that ignores this rule takes a character away from the reader in
 * the middle of a sentence: `?` is a question mark before it is a shortcut. The
 * check is on the element that has focus, and it covers the three native
 * controls that accept text plus anything that declares itself editable.
 */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (target === null || !(target instanceof HTMLElement)) {
    return false;
  }
  if (target.isContentEditable) {
    return true;
  }
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}
