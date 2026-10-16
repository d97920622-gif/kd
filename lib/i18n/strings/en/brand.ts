// path: lib/i18n/strings/en/brand.ts
/**
 * Brand identity strings: the platform name and the one-sentence description
 * used in document metadata, the sign-in screens and transactional email
 * footers.
 *
 * The brand asset files (logo variants, icon pack, social image) arrive in
 * sub-step 1.18 and add their own keys here; the voice guide in the same
 * sub-step describes how the description below may be extended, never
 * replaced, because a rename would change the name customers already know.
 *
 * Later steps append keys through the append protocol: add, never rename.
 */
export const brand = {
  name: 'KD SOLUTION IT',
  description: 'Invoicing, payments and client management for growing businesses.',
} as const;
