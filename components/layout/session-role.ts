// path: components/layout/session-role.ts
/**
 * The one place a layout asks who the reader is.
 *
 * A route-group layout has to hand the shell a role, and the role comes from a
 * session that step 1 does not have: authentication is step 3 (`lib/auth/*`),
 * and the session read that will answer this question lands there. Writing
 * that read now would mean inventing it twice - once here as a stub and once
 * in the module that owns it - and the second version is the one that would
 * have to be trusted.
 *
 * So this module is a seam, and it is deliberately the only one. Every group
 * layout calls `resolveFramingRole` and passes the answer to its shell. When
 * step 3 arrives, the body of this function becomes the session read and no
 * shell, no layout and no specimen changes.
 *
 * What the seam does until then, and why:
 *
 *   - **In development it answers the preview role for the group.** The
 *     shells need to be renderable, and the specimen page renders every role
 *     explicitly, so the preview role is what makes the three groups usable
 *     while the product is being built. It is the lowest-privilege role of its
 *     audience: the tenant preview is the owner's staff, not the owner, and the
 *     platform preview is admin staff, not the founder. A preview that
 *     flatters the developer is a preview that hides what most readers see.
 *   - **Outside development it answers null**, which the shells render as an
 *     unknown reader: landmarks, skip link and content region, no navigation,
 *     no banner, no notice. Nothing is granted by default, and a page that
 *     somehow renders without a session renders empty rather than privileged.
 *
 * What the seam is not: an access decision. It reads a role; it does not say
 * whether that role may do anything. The server checks the session on every
 * request (Zero Trust), route handlers check permissions against the matrix,
 * and a layout that returned the wrong role would render the wrong frame
 * around a page whose data the reader was still not allowed to load.
 */
import { isDevelopment } from '@/lib/env/validate-env';

import { type PlatformRole } from './role-framing';

/** The route groups that need a role to frame their content. */
export const FRAMING_GROUPS = ['dashboard', 'admin'] as const;

export type FramingGroup = (typeof FRAMING_GROUPS)[number];

/**
 * The role each group is previewed as in development.
 *
 * Both are the lowest-privilege role of their audience on purpose. A preview
 * that runs as the owner or the founder would show the developer the frame
 * almost nobody sees, and the difference between frames is exactly what these
 * shells are for.
 */
export const DEVELOPMENT_PREVIEW_ROLE: Record<FramingGroup, PlatformRole> = {
  dashboard: 'staff',
  admin: 'admin_staff',
};

/**
 * The framing role for a group, or null when the reader is not established.
 *
 * Step 3 replaces the body of this function with the session read. Until then
 * it answers the development preview role inside development and nothing at
 * all outside it.
 */
export function resolveFramingRole(group: FramingGroup): PlatformRole | null {
  return isDevelopment() ? DEVELOPMENT_PREVIEW_ROLE[group] : null;
}
