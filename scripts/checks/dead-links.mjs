// path: scripts/checks/dead-links.mjs
/**
 * check:dead-links -- every internal link resolves to a real route.
 *
 * Route inventory: every app/**\/page.tsx file becomes a route. Route groups
 * in parentheses are removed, dynamic segments ([id], [...slug]) become
 * wildcards, and a trailing page index maps to its parent path.
 *
 * Link sources: config/nav-map.ts literals, href attributes in app/ and
 * components/ TypeScript files and router push/replace literals. External
 * URLs, anchors, mailto and tel targets are ignored, and template literals
 * with an interpolated segment are counted but not verified, because they
 * cannot be resolved statically.
 *
 * While the app directory does not exist yet the check reports that there
 * is nothing to verify and passes.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import {
  findMatches,
  listTrackedFiles,
  positionOf,
  readTextFile,
  reportResult,
  REPO_ROOT,
} from './_lib.mjs';

const NAV_MAP = 'config/nav-map.ts';
const ROUTE_GROUP_PATTERN = /\([^)]*\)/g;
const LINK_KEYS = ['href', 'path', 'url', 'to'];

function routeFromPageFile(file) {
  if (file === 'app/page.tsx') {
    return '/';
  }
  const withoutApp = file.slice('app/'.length);
  const withoutPage = withoutApp.replace(/\/page\.tsx$/, '');
  const withoutGroups = withoutPage.replace(ROUTE_GROUP_PATTERN, '');
  const collapsed = withoutGroups.replace(/\/+/g, '/').replace(/^\/+|\/+$/g, '');
  return collapsed === '' ? '/' : `/${collapsed}`;
}

function normalizeRoute(route) {
  const cleaned = route.trim().replace(/\/+$/, '');
  if (cleaned === '') {
    return '/';
  }
  return cleaned;
}

function toSegments(route) {
  return normalizeRoute(route)
    .split('/')
    .filter((segment) => segment.length > 0)
    .map((segment) =>
      segment.startsWith('[') || segment.startsWith(':') ? '*' : segment.toLowerCase(),
    );
}

function matchesRoute(referenceSegments, routeSegments) {
  if (referenceSegments.length !== routeSegments.length) {
    return false;
  }
  return referenceSegments.every(
    (segment, index) =>
      segment === '*' || routeSegments[index] === '*' || segment === routeSegments[index],
  );
}

function collectRoutes(files) {
  const pageFiles = files.filter((file) => file.startsWith('app/') && file.endsWith('/page.tsx'));
  return pageFiles.map((file) => ({ file, route: routeFromPageFile(file) }));
}

function collectLiteralLinks(file, text) {
  const links = [];
  for (const key of LINK_KEYS) {
    const pattern = new RegExp(`\\b${key}\\b\\s*[:=]\\s*["'](\\/[^"'\\n]*)["']`, 'g');
    for (const match of findMatches(text, pattern)) {
      links.push({ value: match.groups[0], index: match.index });
    }
  }
  for (const match of findMatches(text, /\b(?:push|replace)\s*\(\s*["'](\/[^"'\n]*)["']/g)) {
    links.push({ value: match.groups[0], index: match.index });
  }
  return links;
}

function isInternalLink(value) {
  return value.startsWith('/') && !value.startsWith('//');
}

function collectLinkFindings(files, routes) {
  const findings = [];
  let checked = 0;
  let skipped = 0;
  const sources = files.filter(
    (file) =>
      file === NAV_MAP ||
      ((file.startsWith('app/') || file.startsWith('components/')) && /\.(ts|tsx)$/.test(file)),
  );
  for (const file of sources) {
    const text = readTextFile(file);
    if (text === null) {
      continue;
    }
    for (const link of collectLiteralLinks(file, text)) {
      if (!isInternalLink(link.value)) {
        continue;
      }
      if (link.value.includes('${')) {
        skipped += 1;
        continue;
      }
      const referenceSegments = toSegments(link.value);
      const resolved = routes.some((entry) =>
        matchesRoute(referenceSegments, toSegments(entry.route)),
      );
      if (!resolved) {
        const { line, column } = positionOf(text, link.index);
        findings.push({
          file,
          line,
          column,
          message: `internal link "${link.value}" does not match any route`,
        });
      } else {
        checked += 1;
      }
    }
  }
  return { findings, checked, skipped };
}

function main() {
  const files = listTrackedFiles();
  const routes = collectRoutes(files);
  const { findings, checked, skipped } = collectLinkFindings(files, routes);
  if (!existsSync(join(REPO_ROOT, 'app'))) {
    const summary =
      routes.length === 0 && findings.length === 0
        ? 'no routes defined yet; link audit starts when the app directory exists'
        : `${routes.length} routes, ${findings.length} unresolved links`;
    reportResult('dead-links', findings, summary);
    return;
  }
  reportResult(
    'dead-links',
    findings,
    `${routes.length} routes, ${checked} verified links, ${skipped} dynamic links skipped`,
  );
}

main();
