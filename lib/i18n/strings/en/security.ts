// path: lib/i18n/strings/en/security.ts
/**
 * Copy for the security primitives.
 *
 * Small on purpose, and every string in it is shown in a situation where the
 * product has removed something rather than done something. The rule behind the
 * wording: when the product refuses to render a piece of markup, an image or a
 * preview, the reader is told what it refused and why, in a sentence they can
 * act on. A refusal that renders as nothing is indistinguishable from a bug, and
 * the reader's next move - "the page is broken" - is the wrong one.
 *
 * The two long strings are the gallery's explanations. They belong in the
 * catalogue for the same reason the components' sentences do: a security
 * surface that a reviewer cannot read is a security surface nobody reviews, and
 * the gallery is the only page in this build where the header matrix and the
 * sanitizer are visible at all.
 *
 * Append protocol: add, never rename or remove.
 */
export const security = {
  label_removed_link: 'Link removed:',
  label_sanitizer_title: 'Untrusted markup, after sanitizing',
  label_sanitizer_description:
    'The same hostile string rendered twice: once through the sanitizer, and once as text. The first loses everything outside the allowed set and marks what it removed; the second is what the product does by default, because a value that is not meant to be markup should never be parsed as markup at all.',
  label_sanitizer_input: 'Input, as it arrived',
  label_sanitizer_output: 'After the sanitizer',
  label_sanitizer_text_mode: 'Rendered as text, which needs no sanitizer',
  label_hardening_title: 'Response hardening in force on this page',
  label_hardening_description:
    'Read from the browser rather than from the configuration: a header that is declared but not sent is a header that does not exist, and the only honest place to check is the response the browser actually received.',
  label_hardening_count: 'Sent with this response:',
  label_hardening_unavailable:
    'The response headers are not visible from here. This page was rendered on the server, or the browser withheld them, so review them with the hardening probe in docs/EVIDENCE/step-01/http-hardening-probe.py against a running server.',
  label_hardening_pending: 'Not sent in this environment by design',
  label_hardening_unknown: 'Not readable from here',
  label_trusted_types_title: 'Trusted Types',
  label_trusted_types_supported:
    'This browser implements Trusted Types and the product policy is declared, so a string cannot reach an injection sink: only the sanitized output of the named policy can.',
  label_trusted_types_unsupported:
    'This browser does not implement Trusted Types, so the enforcement is the sanitizer alone. The policy is still declared where the API exists, and the check fails the build if the policy is removed.',
  label_clearsite_title: 'Clearing cached data on sign out',
  label_clearsite_sent:
    'A sign out response over TLS carries Clear-Site-Data for cache, cookies and storage, so the next person at this device cannot read the previous session out of a disk cache.',
  label_clearsite_withheld:
    'The Clear-Site-Data header is withheld on a plain HTTP origin because browsers ignore it there. Sending it anyway would leave a reviewer believing a cache was cleared when it was not.',
} as const;
