// path: lib/security/sanitizer.ts
/**
 * The sanitizer: the one function in this product allowed to decide what a
 * string of markup means.
 *
 * STEP 01 layer 2 of MASTER_PROMPT names the constructs every piece of rich
 * text that reaches this product must lose - `<script>`, `<iframe>`, `<object>`,
 * `<embed>`, `<applet>`, JavaScript event handlers, the `javascript:`, `data:`
 * and `vbscript:` URI schemes, CSS `expression()`, `url()` and `@import`
 * injection, and the `<script>` that can hide inside SVG and MathML. A blocklist
 * that removes those shapes is the *second* best answer: it has to be right
 * about every spelling of every construct, and it is wrong the day a new element
 * arrives.
 *
 * The first best answer is an allowlist, and that is what this module is. A
 * parsed document is walked once; every element that is not on the allowed list
 * is removed with its contents, every attribute that is not on the allowed list
 * is removed, and every URL is checked against a scheme list before it is kept.
 * A construct that no one has thought of yet is therefore removed by default,
 * and the list of things that survive is small enough to read in one screen.
 *
 * Four implementation decisions worth stating:
 *
 *   1. **Parsing is inert.** `DOMParser` builds a document that never runs a
 *      script and never fetches a resource - unlike assigning markup to
 *      `innerHTML` of a live element, which does both. The sanitized tree is
 *      then serialized back to a string, and the string is handed to the
 *      Trusted Types policy in `lib/security/trusted-types.ts`, which is the
 *      only way markup reaches a sink in this application.
 *   2. **Nothing is repaired, everything is dropped.** When an element is not
 *      allowed, its entire subtree goes. Unwrapping a `<script>` into its text
 *      would put the script's source on the page as visible text; unwrapping an
 *      `<iframe>` would leave whatever it wrapped. Dropping is the answer that
 *      is correct for both.
 *   3. **The scheme test reads the whole attribute value.** A URL is checked
 *      after removing the characters a browser ignores inside a scheme - tab,
 *      newline, carriage return and leading control characters - because
 *      `java\tscript:` is a scheme the blocklist spelling misses and the
 *      allowlist spelling does not. Relative URLs stay: they cannot leave this
 *      origin.
 *   4. **No style can survive, in any spelling.** The `style` attribute and the
 *      `<style>` element are both refused, which is a stronger rule than
 *      scrubbing `expression(`, `@import` and `url(` out of a declaration -
 *      there is nothing left to scrub. The stylesheet of this product is built
 *      from design tokens, so no content ever needs to bring its own.
 *
 * The sanitizer runs in a browser, because parsing needs a parser. Rich text
 * that arrives on the server is validated by Zod and rendered as text, and the
 * step that ingests user-authored rich text (the editor in step 5) is where
 * server-side sanitization gets its own answer.
 */
import { t } from '@/lib/i18n';

/** Elements kept, with the attributes each one may carry. */
export const SAFE_ELEMENTS: Readonly<Record<string, readonly string[]>> = {
  p: [],
  br: [],
  strong: [],
  em: [],
  b: [],
  i: [],
  u: [],
  s: [],
  code: [],
  pre: [],
  blockquote: [],
  ul: [],
  ol: [],
  li: [],
  h2: [],
  h3: [],
  h4: [],
  hr: [],
  span: [],
  a: ['href', 'title'],
  table: [],
  thead: [],
  tbody: [],
  tr: [],
  th: ['colspan', 'rowspan'],
  td: ['colspan', 'rowspan'],
};

/**
 * Elements removed with everything inside them, listed for the reviewer rather
 * than for the code: the allowlist above is what actually decides. Every entry
 * here is either a script carrier, a frame, an embed, a form control, a
 * document-level declaration or a namespace that has its own script element
 * (SVG and MathML).
 */
export const FORBIDDEN_ELEMENTS: readonly string[] = [
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'applet',
  'form',
  'input',
  'button',
  'select',
  'textarea',
  'link',
  'meta',
  'base',
  'template',
  'noscript',
  'frame',
  'frameset',
  'svg',
  'math',
  'canvas',
  'audio',
  'video',
  'source',
  'track',
];

/**
 * Every attribute whose name starts with this is an event handler and is
 * refused. It is a prefix rule rather than a list because the list of handlers
 * grows every year and the prefix does not.
 */
export const FORBIDDEN_ATTRIBUTE_PREFIX = 'on';

/**
 * The URI schemes allowed in a kept URL. Anything else - `javascript:`,
 * `data:`, `vbscript:`, `file:`, `blob:` - is refused, and a URL without a
 * scheme at all is relative and therefore stays on this origin.
 */
export const SAFE_URL_SCHEMES: readonly string[] = ['http', 'https', 'mailto', 'tel'];

/** Characters a browser ignores inside a scheme, removed before the test. */
const SCHEME_NOISE = /[\u0000-\u0020\u007f]+/g;

/** Absolute URL with a scheme, which is the only form that needs the test. */
const ABSOLUTE_URL = /^([a-zA-Z][a-zA-Z0-9+.-]*):/;

/**
 * The text shown in place of a removed element, so a reader who was sent
 * markup containing a script can see that something was taken out rather than
 * silently losing the sentence around it.
 */
export const REMOVED_MARKER = ' [removed] ';
/** The `title` a removed link keeps, so the reader still learns where it went. */
export const REMOVED_LINK_TEXT = t('security.label_removed_link');

/** True when the sanitizer can run: it needs a parser, which needs a browser. */
export function canSanitize(): boolean {
  return typeof window !== 'undefined' && typeof window.DOMParser === 'function';
}

/**
 * A URL is kept when it is relative, when its scheme is on the list, or when it
 * is a fragment. Everything else is refused.
 */
export function isSafeUrl(value: string): boolean {
  const cleaned = value.replace(SCHEME_NOISE, '');
  if (cleaned.length === 0) {
    return false;
  }
  const match = ABSOLUTE_URL.exec(cleaned);
  if (match === null) {
    return true;
  }
  return SAFE_URL_SCHEMES.includes(match[1].toLowerCase());
}

/**
 * Remove everything this product does not render, and return the markup that is
 * left as a string.
 *
 * When no parser is available - during server rendering, or in a runtime
 * without a DOM - the function refuses rather than passing the input through.
 * An unsanitized passthrough is the failure this module exists to prevent, and
 * a caller that needs markup in that environment has to decide what it does
 * about that, not inherit a silent decision from here.
 */
export function sanitizeHtml(dirty: string): string {
  if (!canSanitize()) {
    return '';
  }
  const document = new DOMParser().parseFromString(dirty, 'text/html');
  sanitizeNode(document.body);
  return document.body.innerHTML;
}

/** True when this element survived the allowlist and may keep its attributes. */
function isAllowedElement(element: Element): boolean {
  return Object.prototype.hasOwnProperty.call(SAFE_ELEMENTS, element.tagName.toLowerCase());
}

/** The attributes an allowed element may keep, from the allowlist above. */
function allowedAttributes(element: Element): readonly string[] {
  return SAFE_ELEMENTS[element.tagName.toLowerCase()] ?? [];
}

/**
 * Walk a subtree and strip it in place.
 *
 * The walk collects the elements first and then edits, because removing a node
 * while iterating a live `querySelectorAll` result skips the node that follows
 * it - which is exactly how a sanitizer lets the second script through.
 */
function sanitizeNode(root: Element): void {
  const elements = Array.from(root.querySelectorAll('*'));
  for (const element of elements) {
    if (!element.parentNode) {
      // An ancestor was already removed with this element inside it.
      continue;
    }
    stripElement(element);
  }
}

function stripElement(element: Element): void {
  if (!isAllowedElement(element)) {
    replaceWithMarker(element);
    return;
  }
  stripAttributes(element);
  if (element.tagName.toLowerCase() === 'a') {
    stripUnsafeLink(element);
  }
}

/** Remove an element and its subtree, leaving a visible note that it happened. */
function replaceWithMarker(element: Element): void {
  const parent = element.parentNode;
  if (!parent) {
    return;
  }
  parent.replaceChild(element.ownerDocument.createTextNode(REMOVED_MARKER), element);
}

function stripAttributes(element: Element): void {
  const keep = allowedAttributes(element);
  for (const attribute of Array.from(element.attributes)) {
    const name = attribute.name.toLowerCase();
    const permitted =
      keep.includes(name) && !name.startsWith(FORBIDDEN_ATTRIBUTE_PREFIX) && !name.includes(':');
    if (!permitted) {
      element.removeAttribute(attribute.name);
    }
  }
}

/** A link to somewhere this product does not trust keeps its text, not its URL. */
function stripUnsafeLink(element: Element): void {
  const href = element.getAttribute('href');
  if (href === null) {
    return;
  }
  if (!isSafeUrl(href)) {
    element.removeAttribute('href');
    element.textContent = `${REMOVED_LINK_TEXT} ${element.textContent ?? ''}`.trim();
  }
}
