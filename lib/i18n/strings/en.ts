// path: lib/i18n/strings/en.ts
/**
 * The English string catalogue. This is the single source of every
 * user-facing string in the platform (Rule 1): no component, page, email
 * template or API message may contain literal display text.
 *
 * Structure: one file per namespace under lib/i18n/strings/en/, aggregated
 * here. Splitting keeps every file inside the 500 line limit while this file
 * stays the one import surface for application code.
 *
 * Append protocol (docs/PLAN/03_FILE_OWNERSHIP_MATRIX.md section 3): a later
 * step adds a namespace by creating
 * lib/i18n/strings/en/<namespace>.ts and appending one import and one entry
 * below. Existing namespaces and existing keys are never renamed or removed;
 * a copy change is a new key, so a stale reference fails the type check
 * instead of silently showing different text.
 *
 * Copy rules for every string: docs/COPY_RULES.md.
 */
import { brand } from './en/brand';
import { commands } from './en/commands';
import { common } from './en/common';
import { errors } from './en/errors';
import { forms } from './en/forms';
import { gallery } from './en/gallery';
import { motion } from './en/motion';
import { nav } from './en/nav';
import { security } from './en/security';
import { shells } from './en/shells';
import { states } from './en/states';
import { ui } from './en/ui';
import { validation } from './en/validation';

export const en = {
  brand,
  commands,
  common,
  errors,
  forms,
  gallery,
  motion,
  nav,
  security,
  shells,
  states,
  ui,
  validation,
} as const;

/** Shape of the English catalogue, used to derive the key union. */
export type EnglishCatalogue = typeof en;

export {
  brand,
  commands,
  common,
  errors,
  forms,
  gallery,
  motion,
  nav,
  shells,
  states,
  ui,
  validation,
};
