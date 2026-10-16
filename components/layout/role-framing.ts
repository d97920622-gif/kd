// path: components/layout/role-framing.ts
/**
 * What each role sees around the content, described once.
 *
 * The platform has six roles and no client role (MASTER_PROMPT, role model).
 * Five of them sign in: the platform's own staff at three levels of authority
 * (super admin, CEO, admin staff) and a tenant's people at two (the owner and
 * the owner's staff). The sixth audience, the tenant's client, never signs in
 * at all: a client reaches one document through a tokenized link, which is why
 * the client portal is framed as a document rather than as a workspace.
 *
 * This module answers one question and only one: *what frame does the reader
 * get around the page*. It answers it as data, so the answer can be read,
 * diffed and verified instead of being argued about in three layout files.
 *
 * What this module must never become:
 *
 *   - **It is not authorization.** Nothing here decides whether a reader may
 *     do something. Zero Trust puts that decision on the server, on every
 *     request, against the session (sub-step 3.4 and later). A frame is what
 *     the reader sees; a permission is what the reader may do, and confusing
 *     the two is how a hidden menu item becomes a vulnerability. The shells
 *     render a frame and no access logic, and there is deliberately no helper
 *     here that answers "can this role do X".
 *   - **It is not the session.** The role comes from outside, resolved by
 *     whoever owns the session. In step 1 that resolver is the documented seam
 *     in session-role.ts, which answers a preview role in development and
 *     nothing at all outside it. Step 3 replaces the seam's body with the real
 *     session read; this table does not change when it does.
 *   - **It is not navigation.** Which links a role sees is config/nav-map.ts
 *     (sub-step 1.22). This table says whether a shell has navigation at all
 *     and what it is called, because a client portal with a workspace sidebar
 *     would be a different product, not a filtered menu.
 *
 * The copy is referenced by catalogue key rather than by sentence, and the key
 * type is the catalogue's own key union, so a frame that names a string nobody
 * wrote fails the type check rather than rendering a blank banner.
 */
import { type EnglishStringKey } from '@/lib/i18n';

/**
 * Every role the framing table knows, in the order the role model lists them.
 *
 * The identifiers are the authentication vocabulary, not display text, so they
 * stay in code and in data attributes. `lib/auth/roles.ts` (step 4) becomes the
 * authority for the session-side role set; when it lands, this list is replaced
 * by an import from it and scripts/checks/layout-shells.mjs verifies that the
 * two agree rather than trusting that they do.
 */
export const PLATFORM_ROLES = [
  'super_admin',
  'ceo',
  'admin_staff',
  'owner',
  'staff',
  'client',
] as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[number];

/**
 * The three kinds of reader the platform has, which is what shells are built
 * for: the platform's own staff, a tenant's workspace, and a client holding a
 * link to one document.
 */
export const ROLE_AUDIENCES = ['platform', 'tenant', 'client'] as const;

export type RoleAudience = (typeof ROLE_AUDIENCES)[number];

/** A role's frame: where the reader is, what they are told, what they get. */
export interface RoleFraming {
  readonly role: PlatformRole;
  readonly audience: RoleAudience;
  /**
   * Persistent banner above the content, for a reader who is inside a surface
   * that acts on other people's data. Null when the reader is where the
   * interface assumes they are, which is the tenant's own workspace.
   */
  readonly bannerTitleKey: EnglishStringKey | null;
  readonly bannerMessageKey: EnglishStringKey | null;
  /**
   * One-line notice about approval, for the roles whose actions are reviewed
   * before they take effect. The notice states the workflow, not the
   * authority of the reader: a claim about who may do what belongs to the
   * permission matrix, in the place that enforces it.
   */
  readonly noticeKey: EnglishStringKey | null;
  /**
   * Whether the shell offers navigation at all. False for the client portal,
   * where the reader is on a document and a menu would be a way off it.
   */
  readonly hasNavigation: boolean;
  /** Accessible name of the navigation landmark, when there is one. */
  readonly navigationLabelKey: EnglishStringKey | null;
}

const PLATFORM_BANNER_TITLE: EnglishStringKey = 'shells.label_platform_banner';
const PLATFORM_BANNER_MESSAGE: EnglishStringKey = 'shells.label_platform_banner_message';

/**
 * The frame per role.
 *
 * The three platform roles share a banner because the distinction between them
 * is authority, which the approval notices carry, not location. The two tenant
 * roles share the workspace with no banner: they are in their own data, and a
 * banner would be noise. The owner gets no notice because the owner is the one
 * who approves; the owner's staff get the notice because their work is
 * reviewed, which is the single most useful sentence to show that reader.
 */
export const ROLE_FRAMING: Record<PlatformRole, RoleFraming> = {
  super_admin: {
    role: 'super_admin',
    audience: 'platform',
    bannerTitleKey: PLATFORM_BANNER_TITLE,
    bannerMessageKey: PLATFORM_BANNER_MESSAGE,
    noticeKey: null,
    hasNavigation: true,
    navigationLabelKey: 'shells.label_nav_platform',
  },
  ceo: {
    role: 'ceo',
    audience: 'platform',
    bannerTitleKey: PLATFORM_BANNER_TITLE,
    bannerMessageKey: PLATFORM_BANNER_MESSAGE,
    noticeKey: 'shells.label_notice_ceo_approval',
    hasNavigation: true,
    navigationLabelKey: 'shells.label_nav_platform',
  },
  admin_staff: {
    role: 'admin_staff',
    audience: 'platform',
    bannerTitleKey: PLATFORM_BANNER_TITLE,
    bannerMessageKey: PLATFORM_BANNER_MESSAGE,
    noticeKey: 'shells.label_notice_admin_staff_approval',
    hasNavigation: true,
    navigationLabelKey: 'shells.label_nav_platform',
  },
  owner: {
    role: 'owner',
    audience: 'tenant',
    bannerTitleKey: null,
    bannerMessageKey: null,
    noticeKey: null,
    hasNavigation: true,
    navigationLabelKey: 'shells.label_nav_workspace',
  },
  staff: {
    role: 'staff',
    audience: 'tenant',
    bannerTitleKey: null,
    bannerMessageKey: null,
    noticeKey: 'shells.label_notice_staff_approval',
    hasNavigation: true,
    navigationLabelKey: 'shells.label_nav_workspace',
  },
  client: {
    role: 'client',
    audience: 'client',
    bannerTitleKey: null,
    bannerMessageKey: null,
    noticeKey: null,
    hasNavigation: false,
    navigationLabelKey: null,
  },
};

/** The roles each audience contains, in the order the role model lists them. */
export const AUDIENCE_ROLES: Record<RoleAudience, readonly PlatformRole[]> = {
  platform: PLATFORM_ROLES.filter((role) => ROLE_FRAMING[role].audience === 'platform'),
  tenant: PLATFORM_ROLES.filter((role) => ROLE_FRAMING[role].audience === 'tenant'),
  client: PLATFORM_ROLES.filter((role) => ROLE_FRAMING[role].audience === 'client'),
};

/**
 * The frame for a role, or the minimal frame when the reader is unknown.
 *
 * An unknown reader gets the frame with no banner, no notice and no
 * navigation: the shell still provides the landmarks, the skip link and the
 * content region, and it makes no claim about who the reader is. There is no
 * fallback to a privileged frame and no default role, because a default role
 * is a privilege escalation with better manners.
 */
export function framingFor(role: PlatformRole | null): RoleFraming | null {
  return role === null ? null : ROLE_FRAMING[role];
}

/**
 * The role, as the data attribute value a shell renders.
 *
 * `unresolved` is spelled out rather than left empty on purpose: a probe, a
 * stylesheet rule or a future debug overlay can match on it, and an empty
 * attribute is the value that gets mistaken for a missing implementation.
 */
export function roleAttribute(role: PlatformRole | null): string {
  return role === null ? 'unresolved' : role;
}

/**
 * The two data attributes every shell puts on its root element.
 *
 * They exist so the rendered frame can be measured instead of assumed: the
 * shell probe reads the role and audience out of the response and checks that
 * each shell produced the frame its role calls for. A frame that renders the
 * wrong band for a role is otherwise invisible - every element is present, the
 * page looks right, and the only wrong thing is the words a reader sees.
 */
export function roleDataAttributes(role: PlatformRole | null): {
  readonly 'data-role': string;
  readonly 'data-audience': string;
} {
  const framing = framingFor(role);
  return {
    'data-role': roleAttribute(role),
    'data-audience': framing === null ? 'unresolved' : framing.audience,
  };
}
