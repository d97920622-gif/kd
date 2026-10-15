// path: lib/i18n/strings/en/ui.ts
/**
 * Control label namespace: accessible names for parts of a control that have
 * no visible text, and nothing else.
 *
 * The keys here are announced by a screen reader but never shown, which is
 * exactly why they cannot be props with a default: a default would be a
 * hardcoded string inside a component, and the i18n check rejects that.
 * A visible label always comes from a more specific namespace, for example
 * a form field label from validation or a page heading from its own page
 * namespace.
 *
 * Key naming (see docs/COPY_RULES.md): namespace.key, every segment lower
 * case snake case, at most three levels, every leaf a non-empty ASCII string.
 *
 * Later steps append keys to this namespace through the append protocol: add
 * keys, never rename or remove them.
 */
export const ui = {
  scroll_up: 'Scroll up',
  scroll_down: 'Scroll down',
} as const;
