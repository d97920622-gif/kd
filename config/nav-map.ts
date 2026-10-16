// path: config/nav-map.ts
/**
 * The navigation map: the single source of every destination the product
 * offers, and the only place a navigation target is written down.
 *
 * MASTER_PROMPT, navigation integrity: one centralised map, every route
 * registered in it, breadcrumbs generated from it, menus filtered by role, and
 * zero dead links as a build-time audit. This file is the first half of that
 * sentence; `scripts/checks/nav-map.mjs` and `scripts/checks/dead-links.mjs`
 * are the second half, and they read this file rather than a copy of it.
 *
 * FOUR DECISIONS, EACH OF WHICH IS A RULE SOMEWHERE ELSE
 *
 * 1. **An entry has no destination until its page exists.** A planned entry
 *    carries a label and no href at all; a live entry carries an href and no
 *    planned flag. The pair is mutually exclusive in the type system, so this
 *    map cannot express "a link to a page nobody has built" - which is the one
 *    mistake a navigation file makes that no reviewer notices, because the
 *    entry looks like every other entry. `docs/PLAN/02` states the matching
 *    product rule: a nav entry exists when the page exists.
 *
 *    The consequence is deliberate: the workspace, platform, client and public
 *    blocks are entirely planned today, because step 1 has not built a single
 *    product page. They are not commented-out code and not filler: they are the
 *    product's structure, named, typed and filtered, waiting for the pages that
 *    later steps add - at which point the entry moves from `NavPlannedEntry` to
 *    `NavLiveEntry` and the dead-link audit starts verifying it. Nothing else
 *    about the entry changes.
 *
 * 2. **Audience is not permission.** A block names the part of the product it
 *    belongs to (public site, workspace, platform administration, client
 *    portal, and the specimen surfaces of this build). A role list on an entry
 *    says which of the six roles the module is *for*. It is not an
 *    authorization decision: step 4 owns the permission matrix, and a menu is
 *    not a gate. Filtering here decides what a reader is *offered*; the record
 *    load decides what they may *see*, and the two are allowed to differ,
 *    because a navigation that only showed what is guaranteed to be permitted
 *    would need the whole permission model to answer a rendering question.
 *
 * 3. **The specimen surfaces are registered like any other route.** This build
 *    has exactly two routes, both development-only, and "every route is
 *    registered" applies to them too: they are what the dead-link audit has to
 *    verify today, and the navigation has to have something true to render
 *    before the first product page exists. They live in their own audience, so
 *    a workspace or platform surface never asks for them and cannot receive
 *    them by accident.
 *
 * 4. **Appending is the protocol.** `docs/PLAN/03` section 3 makes this file an
 *    append target: a later step adds the entries of the modules it delivers,
 *    inside the block that matches the audience, and flips its own planned
 *    entries to live. Entries are never reordered and never renamed - an id is
 *    stable because a saved view, a breadcrumb and a command palette all
 *    ultimately key off it.
 */
import { FileText, PanelLeft, type LucideIcon } from 'lucide-react';
import { createElement } from 'react';

import type { BreadcrumbItem } from '@/components/layout/breadcrumbs';
import type { NavEntryInput, NavSectionInput } from '@/components/layout/nav-items';
import type { PlatformRole } from '@/components/layout/role-framing';
import type { EnglishStringKey } from '@/lib/i18n';

/**
 * The five audiences. Four of them are parts of the product; the fifth is the
 * specimen surface, which exists in this build only and is asked for by exactly
 * one page - the development-only layout specimen.
 */
export const NAV_AUDIENCES = ['public', 'workspace', 'platform', 'client', 'development'] as const;
export type NavAudience = (typeof NAV_AUDIENCES)[number];

/**
 * An entry whose page exists: it has a destination, and the dead-link audit
 * verifies that destination against the route inventory.
 */
export interface NavLiveEntry {
  readonly id: string;
  readonly labelKey: EnglishStringKey;
  readonly href: string;
  /** Which of the six roles this module is for. Empty means no session needed. */
  readonly roles: readonly PlatformRole[];
  readonly descriptionKey?: EnglishStringKey;
  /** Offered in the mobile bottom bar, which carries at most five (step 1.21). */
  readonly primary?: boolean;
  /** The entry above this one in the hierarchy, for the trail generator. */
  readonly parentId?: string;
  readonly icon?: React.ReactNode;
  readonly planned?: false;
}

/**
 * An entry whose page does not exist yet. It has no href field, so there is
 * nothing for a renderer, a router or an audit to follow, and the only thing a
 * surface can do with it is drop it - which every surface does by construction,
 * because it is filtered out before a surface is ever called.
 */
export interface NavPlannedEntry {
  readonly id: string;
  readonly labelKey: EnglishStringKey;
  readonly roles: readonly PlatformRole[];
  readonly descriptionKey?: EnglishStringKey;
  readonly primary?: boolean;
  readonly parentId?: string;
  readonly planned: true;
}

export type NavEntrySource = NavLiveEntry | NavPlannedEntry;

/** A section of the map: one heading, an audience, and the entries under it. */
export interface NavBlock {
  readonly id: string;
  readonly audience: NavAudience;
  readonly labelKey: EnglishStringKey;
  readonly entries: readonly NavEntrySource[];
}

/**
 * An icon element, built without JSX.
 *
 * This file is `config/nav-map.ts` and stays a `.ts` module: the plan names it
 * by that exact path, `scripts/checks/dead-links.mjs` reads it as a link
 * source, and the navigation surfaces take elements rather than component
 * types so that the icon set stays one lookup (Lucide). `createElement` is the
 * cost of that decision and it is paid once, here.
 */
function navIcon(Icon: LucideIcon): React.ReactNode {
  return createElement(Icon, { className: 'size-5' });
}

const TENANT_ROLES: readonly PlatformRole[] = ['owner', 'staff'];
const PLATFORM_ROLES: readonly PlatformRole[] = ['super_admin', 'ceo', 'admin_staff'];
/** Modules the owner runs the business with, which staff do not administer. */
const OWNER_ROLES: readonly PlatformRole[] = ['owner'];
const CLIENT_ROLES: readonly PlatformRole[] = ['client'];
/** Public pages are reachable without a session, so no role gates them. */
const PUBLIC_ROLES: readonly PlatformRole[] = [];

export const NAV_MAP: readonly NavBlock[] = [
  // -------------------------------------------------------------------------
  // Public site. Delivered by sub-steps 1.28 and 1.29.
  // -------------------------------------------------------------------------
  {
    id: 'public-product',
    audience: 'public',
    labelKey: 'nav.label_section_product',
    entries: [
      { id: 'features', labelKey: 'nav.label_public_features', roles: PUBLIC_ROLES, planned: true },
      { id: 'pricing', labelKey: 'nav.label_public_pricing', roles: PUBLIC_ROLES, planned: true },
      {
        id: 'industries',
        labelKey: 'nav.label_public_industries',
        roles: PUBLIC_ROLES,
        planned: true,
      },
      {
        id: 'calculators',
        labelKey: 'nav.label_public_calculators',
        roles: PUBLIC_ROLES,
        planned: true,
      },
      {
        id: 'invoice-generator',
        labelKey: 'nav.label_public_invoice_generator',
        roles: PUBLIC_ROLES,
        planned: true,
      },
    ],
  },
  {
    id: 'public-company',
    audience: 'public',
    labelKey: 'nav.label_section_company',
    entries: [
      { id: 'about', labelKey: 'nav.label_public_about', roles: PUBLIC_ROLES, planned: true },
      { id: 'contact', labelKey: 'nav.label_public_contact', roles: PUBLIC_ROLES, planned: true },
      { id: 'blog', labelKey: 'nav.label_public_blog', roles: PUBLIC_ROLES, planned: true },
    ],
  },
  {
    id: 'public-legal',
    audience: 'public',
    labelKey: 'nav.label_section_legal',
    entries: [
      { id: 'terms', labelKey: 'nav.label_public_terms', roles: PUBLIC_ROLES, planned: true },
      { id: 'privacy', labelKey: 'nav.label_public_privacy', roles: PUBLIC_ROLES, planned: true },
    ],
  },

  // -------------------------------------------------------------------------
  // Tenant workspace. Invoicing is step 5, CRM and catalog step 6, payments
  // step 8, checkout and payouts step 10, payroll and accounting step 13,
  // team and settings step 4.
  // -------------------------------------------------------------------------
  {
    id: 'workspace-modules',
    audience: 'workspace',
    labelKey: 'nav.label_section_workspace',
    entries: [
      {
        id: 'dashboard',
        labelKey: 'nav.label_module_dashboard',
        roles: TENANT_ROLES,
        primary: true,
        planned: true,
      },
      {
        id: 'invoices',
        labelKey: 'nav.label_module_invoices',
        roles: TENANT_ROLES,
        primary: true,
        planned: true,
      },
      {
        id: 'estimates',
        labelKey: 'nav.label_module_estimates',
        roles: TENANT_ROLES,
        parentId: 'invoices',
        planned: true,
      },
      {
        id: 'recurring-invoices',
        labelKey: 'nav.label_module_recurring_invoices',
        roles: TENANT_ROLES,
        parentId: 'invoices',
        planned: true,
      },
      {
        id: 'clients',
        labelKey: 'nav.label_module_clients',
        roles: TENANT_ROLES,
        primary: true,
        planned: true,
      },
      {
        id: 'products',
        labelKey: 'nav.label_module_products',
        roles: TENANT_ROLES,
        planned: true,
      },
      {
        id: 'inventory',
        labelKey: 'nav.label_module_inventory',
        roles: TENANT_ROLES,
        parentId: 'products',
        planned: true,
      },
      {
        id: 'payments',
        labelKey: 'nav.label_module_payments',
        roles: TENANT_ROLES,
        primary: true,
        planned: true,
      },
      {
        id: 'payouts',
        labelKey: 'nav.label_module_payouts',
        roles: TENANT_ROLES,
        parentId: 'payments',
        planned: true,
      },
      {
        id: 'expenses',
        labelKey: 'nav.label_module_expenses',
        roles: TENANT_ROLES,
        planned: true,
      },
      {
        id: 'payroll',
        labelKey: 'nav.label_module_payroll',
        roles: TENANT_ROLES,
        planned: true,
      },
      {
        id: 'reports',
        labelKey: 'nav.label_module_reports',
        roles: TENANT_ROLES,
        planned: true,
      },
    ],
  },
  {
    id: 'workspace-account',
    audience: 'workspace',
    labelKey: 'nav.label_section_account',
    entries: [
      { id: 'team', labelKey: 'nav.label_module_team', roles: OWNER_ROLES, planned: true },
      { id: 'security', labelKey: 'nav.label_module_security', roles: OWNER_ROLES, planned: true },
      {
        id: 'settings',
        labelKey: 'nav.label_module_settings',
        roles: TENANT_ROLES,
        primary: true,
        planned: true,
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Platform administration. Roles and permissions are step 4, plan and
  // subscription management step 13, the console itself step 14.
  // -------------------------------------------------------------------------
  {
    id: 'platform-admin',
    audience: 'platform',
    labelKey: 'nav.label_section_platform',
    entries: [
      {
        id: 'tenants',
        labelKey: 'nav.label_module_tenants',
        roles: PLATFORM_ROLES,
        primary: true,
        planned: true,
      },
      {
        id: 'platform-billing',
        labelKey: 'nav.label_module_platform_billing',
        roles: PLATFORM_ROLES,
        primary: true,
        planned: true,
      },
      {
        id: 'plans',
        labelKey: 'nav.label_module_plans',
        roles: PLATFORM_ROLES,
        parentId: 'platform-billing',
        planned: true,
      },
      {
        id: 'approvals',
        labelKey: 'nav.label_module_approvals',
        roles: PLATFORM_ROLES,
        primary: true,
        planned: true,
      },
      {
        id: 'audit-log',
        labelKey: 'nav.label_module_audit_log',
        roles: PLATFORM_ROLES,
        primary: true,
        planned: true,
      },
      {
        id: 'feature-flags',
        labelKey: 'nav.label_module_feature_flags',
        roles: PLATFORM_ROLES,
        planned: true,
      },
      {
        id: 'platform-team',
        labelKey: 'nav.label_module_platform_team',
        roles: PLATFORM_ROLES,
        planned: true,
      },
      {
        id: 'platform-settings',
        labelKey: 'nav.label_module_platform_settings',
        roles: PLATFORM_ROLES,
        planned: true,
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Client portal. Tokenized access, documents and the payment experience are
  // step 11.
  // -------------------------------------------------------------------------
  {
    id: 'client-account',
    audience: 'client',
    labelKey: 'nav.label_section_client_account',
    entries: [
      {
        id: 'client-invoices',
        labelKey: 'nav.label_module_client_invoices',
        roles: CLIENT_ROLES,
        primary: true,
        planned: true,
      },
      {
        id: 'client-payments',
        labelKey: 'nav.label_module_client_payments',
        roles: CLIENT_ROLES,
        primary: true,
        planned: true,
      },
      {
        id: 'client-documents',
        labelKey: 'nav.label_module_client_documents',
        roles: CLIENT_ROLES,
        primary: true,
        planned: true,
      },
      {
        id: 'client-support',
        labelKey: 'nav.label_module_client_support',
        roles: CLIENT_ROLES,
        primary: true,
        planned: true,
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Specimen surfaces. The only routes this build serves. Their names live in
  // the shells namespace, because the specimen pages are what they name.
  // -------------------------------------------------------------------------
  {
    id: 'development-specimens',
    audience: 'development',
    labelKey: 'nav.label_section_specimen',
    entries: [
      {
        id: 'specimen-shells',
        labelKey: 'shells.label_nav_specimen_layouts',
        href: '/shells',
        roles: PUBLIC_ROLES,
        primary: true,
        icon: navIcon(PanelLeft),
      },
      {
        id: 'specimen-gallery',
        labelKey: 'shells.label_nav_specimen_gallery',
        href: '/gallery',
        roles: PUBLIC_ROLES,
        primary: true,
        icon: navIcon(FileText),
      },
    ],
  },
];

/** Live entries of one audience, in map order. */
export function liveEntriesFor(
  audience: NavAudience,
  role: PlatformRole | null,
): readonly NavLiveEntry[] {
  return NAV_MAP.filter((block) => block.audience === audience)
    .flatMap((block) => block.entries)
    .filter((entry): entry is NavLiveEntry => entry.planned !== true)
    .filter((entry) => isVisibleFor(entry.roles, role));
}

/** Planned entries of one audience, in map order. */
export function plannedEntriesFor(
  audience: NavAudience,
  role: PlatformRole | null,
): readonly NavPlannedEntry[] {
  return NAV_MAP.filter((block) => block.audience === audience)
    .flatMap((block) => block.entries)
    .filter((entry): entry is NavPlannedEntry => entry.planned === true)
    .filter((entry) => isVisibleFor(entry.roles, role));
}

/**
 * Whether an entry is offered to a reader.
 *
 * An entry with no roles is public: no session is needed to see the pricing
 * page. An entry with roles needs a role from the list, and a reader with no
 * role gets nothing - the fail-closed direction, because the alternative is
 * offering a menu to a session that has ended.
 */
function isVisibleFor(roles: readonly PlatformRole[], role: PlatformRole | null): boolean {
  if (roles.length === 0) {
    return true;
  }
  return role !== null && roles.includes(role);
}

/** What a shell renders: the rail's sections and the bottom bar's entries. */
export interface NavNavigation {
  readonly sections: readonly NavSectionInput[];
  readonly primary: readonly NavEntryInput[];
}

/**
 * The navigation one reader is offered on one surface.
 *
 * The caller states the audience, because the frame knows what it is: the
 * workspace shell asks for the workspace, the admin shell for the platform.
 * Passing an audience the reader's role does not belong to yields the public
 * entries only, which is the safe direction - an admin page that asked for the
 * wrong audience shows no modules rather than the wrong ones.
 */
export function navigationFor(audience: NavAudience, role: PlatformRole | null): NavNavigation {
  const sections: NavSectionInput[] = [];
  const primary: NavEntryInput[] = [];
  for (const block of NAV_MAP) {
    if (block.audience !== audience) {
      continue;
    }
    const live = block.entries
      .filter((entry): entry is NavLiveEntry => entry.planned !== true)
      .filter((entry) => isVisibleFor(entry.roles, role));
    if (live.length === 0) {
      continue;
    }
    sections.push({
      id: block.id,
      labelKey: block.labelKey,
      entries: live.map(toNavEntryInput),
    });
    for (const entry of live) {
      if (entry.primary === true) {
        primary.push(toNavEntryInput(entry));
      }
    }
  }
  return { sections, primary: primary.slice(0, MAX_PRIMARY_ENTRIES) };
}

/**
 * The bottom bar carries five entries and no more (sub-step 1.21: a sixth
 * column takes every label below the size where it can be read). The cap is
 * applied here rather than in the map, so a block may mark more entries as
 * primary than the bar can hold without silently dropping a destination the
 * reader can reach elsewhere.
 */
export const MAX_PRIMARY_ENTRIES = 5;

function toNavEntryInput(entry: NavLiveEntry): NavEntryInput {
  return {
    id: entry.id,
    href: entry.href,
    labelKey: entry.labelKey,
    icon: entry.icon,
    descriptionKey: entry.descriptionKey,
  };
}

/**
 * The entry a path belongs to, as an href a surface can compare against.
 *
 * An exact match wins. Failing that, the longest registered ancestor wins, but
 * only at a segment boundary: `/invoices/1042` belongs to `/invoices`, while
 * `/invoices-archive` belongs to nothing and must not be highlighted as the
 * invoices module. Sub-step 1.21 left this decision here on purpose - the
 * surfaces compare hrefs exactly, and only the map knows the route set.
 */
export function activeHrefFor(
  path: string,
  audience: NavAudience,
  role: PlatformRole | null,
): string | null {
  const entries = liveEntriesFor(audience, role);
  const normalized = normalizePath(path);
  if (entries.length === 0) {
    return null;
  }
  const exact = entries.find((entry) => entry.href === normalized);
  if (exact !== undefined) {
    return exact.href;
  }
  const ancestors = entries
    .filter((entry) => normalized.startsWith(`${entry.href}/`))
    .sort((left, right) => right.href.length - left.href.length);
  return ancestors.length === 0 ? null : ancestors[0].href;
}

/**
 * The trail for a path, as the breadcrumb component wants it.
 *
 * Two cases, and the difference matters to the page that calls it:
 *
 *   - the path is registered: the trail ends with that entry as the current
 *     page, which is not a link, and the ancestors above it are links;
 *   - the path is below a registered entry (`/invoices/1042`): the trail holds
 *     the registered ancestors as links and *stops*, because this map does not
 *     know the record's name. The page appends its own item, which is the only
 *     layer that knows whether the record exists.
 *
 * A path that matches nothing returns an empty trail rather than a trail of
 * guesses: a breadcrumb that invents a parent sends the reader to a page they
 * did not ask for.
 */
export function breadcrumbsFor(
  path: string,
  audience: NavAudience,
  role: PlatformRole | null,
): readonly BreadcrumbItem[] {
  const active = activeHrefFor(path, audience, role);
  if (active === null) {
    return [];
  }
  const entries = liveEntriesFor(audience, role);
  const trail: NavLiveEntry[] = [];
  let current: NavLiveEntry | undefined = entries.find((entry) => entry.href === active);
  while (current !== undefined) {
    trail.unshift(current);
    const parentId: string | undefined = current.parentId;
    current = parentId === undefined ? undefined : entries.find((entry) => entry.id === parentId);
  }
  const isCurrentPage = normalizePath(path) === active;
  return trail.map((entry, index) =>
    index === trail.length - 1 && isCurrentPage
      ? { id: entry.id, labelKey: entry.labelKey }
      : { id: entry.id, labelKey: entry.labelKey, href: entry.href },
  );
}

/** Every destination the map publishes, for the audit and for the specimen. */
export function publishedHrefs(): readonly string[] {
  return NAV_MAP.flatMap((block) => block.entries)
    .filter((entry): entry is NavLiveEntry => entry.planned !== true)
    .map((entry) => entry.href);
}

function normalizePath(path: string): string {
  const trimmed = path.trim();
  if (trimmed === '' || trimmed === '/') {
    return '/';
  }
  const withoutQuery = trimmed.split(/[?#]/)[0];
  const withoutTrailing = withoutQuery.replace(/\/+$/, '');
  return withoutTrailing.startsWith('/') ? withoutTrailing : `/${withoutTrailing}`;
}
