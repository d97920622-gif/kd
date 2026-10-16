// path: scripts/checks/nav-map.mjs
/**
 * check:nav-map -- the navigation map is the single source, and it is complete.
 *
 * MASTER_PROMPT, navigation integrity, states six things. Four of them are
 * properties of one file, and one file cannot check itself:
 *
 *   1. **One centralised map.** This check reads the map by name and fails if a
 *      component writes an internal destination of its own, because the second
 *      place a link lives is the place that goes stale.
 *   2. **Every route registered.** The direction nobody checks by hand: a route
 *      that exists but appears in no block is a page the navigation forgot, and
 *      it is invisible in review because every file it touches looks right.
 *      Development-only routes are held to the same rule, in the development
 *      block, so registering a route is never optional.
 *   3. **Menus filtered by role.** Every role list must name real roles of the
 *      role model, and the filter itself may exist only in the map: a component
 *      that filters by role is a second permission opinion, and it is the kind
 *      that drifts silently from the first.
 *   4. **Breadcrumbs from the map.** The generator is part of the map module,
 *      and the trail's current item is the one without a destination - checked
 *      here as source structure, and measured in the rendered page by
 *      docs/EVIDENCE/step-01/shell-probe.py.
 *
 * The dead-link side of the contract is not duplicated here:
 * `scripts/checks/dead-links.mjs` reads this file as a link source, so every
 * href the map publishes has to resolve to a real route. This check owns the
 * other direction and the structure.
 *
 * Everything here is a static read of the source, so it runs in a fresh clone
 * with no browser.
 */
import ts from 'typescript';

import { listTrackedFiles, positionOf, reportResult, readTextFile } from './_lib.mjs';

const CHECK = 'nav-map';
const NAV_MAP = 'config/nav-map.ts';
const ROLE_FRAMING = 'components/layout/role-framing.ts';
const USE_NAVIGATION = 'components/navigation/use-navigation.ts';
const SHELL_NAVIGATION = 'components/navigation/shell-navigation.tsx';
const WIRED_LAYOUTS = ['app/(dashboard)/layout.tsx', 'app/(admin)/layout.tsx'];
const EXPECTED_AUDIENCE_BY_LAYOUT = {
  'app/(dashboard)/layout.tsx': 'workspace',
  'app/(admin)/layout.tsx': 'platform',
};
const ROUTE_GROUP_PATTERN = /\([^)]*\)/g;
const DEV_GROUP = '(dev)';
const MAX_PRIMARY_CAP = 5;
/** The map's query functions, which take an audience as their first argument. */
const NAV_QUERY_FUNCTIONS = [
  'navigationFor',
  'activeHrefFor',
  'breadcrumbsFor',
  'liveEntriesFor',
  'plannedEntriesFor',
];

const COMMANDS = 'config/commands.ts';
const COMMAND_PALETTE = 'components/navigation/command-palette.tsx';
const COMMAND_LIST = 'components/navigation/command-list.tsx';
const KEY_CHORD = 'lib/utils/key-chord.ts';
const SHORTCUTS_PAGE = 'app/(public)/shortcuts/page.tsx';
const CHECK_FILE = 'scripts/checks/nav-map.mjs';
const MODIFIER_TOKEN = 'mod';

const findings = [];

function finding(file, message) {
  findings.push({ file, line: 1, column: 1, message });
}

function read(file) {
  return readTextFile(file);
}

function requireFile(file, message) {
  const text = read(file);
  if (text === null) {
    finding(file, message);
    return null;
  }
  return text;
}

/** Every catalogue key, as `namespace.key`, read out of the string files. */
function catalogueKeys() {
  const keys = new Set();
  for (const file of listTrackedFiles()) {
    if (!file.startsWith('lib/i18n/strings/en/') || !file.endsWith('.ts')) {
      continue;
    }
    const text = read(file);
    if (text === null) {
      continue;
    }
    const namespace = /export const ([a-zA-Z]+) = \{/.exec(text);
    if (namespace === null) {
      continue;
    }
    for (const match of text.matchAll(/^ {2}([a-z0-9_]+):/gm)) {
      keys.add(`${namespace[1]}.${match[1]}`);
    }
  }
  return keys;
}

/** The roles the role model declares, read out of the framing table. */
function mandatedRoles() {
  const text = requireFile(ROLE_FRAMING, 'the role framing table is missing');
  if (text === null) {
    return [];
  }
  const block = /export const PLATFORM_ROLES = \[([\s\S]*?)\] as const;/.exec(text);
  if (block === null) {
    finding(ROLE_FRAMING, 'PLATFORM_ROLES was not found in the framing table');
    return [];
  }
  return [...block[1].matchAll(/'([a-z_]+)'/g)].map((match) => match[1]);
}

/** The route inventory, as the router derives it. */
function routeInventory() {
  return listTrackedFiles()
    .filter((file) => file.startsWith('app/') && file.endsWith('/page.tsx'))
    .map((file) => {
      const withoutApp = file.slice('app/'.length).replace(/\/page\.tsx$/, '');
      const withoutGroups = withoutApp.replace(ROUTE_GROUP_PATTERN, '');
      const collapsed = withoutGroups.replace(/\/+/g, '/').replace(/^\/+|\/+$/g, '');
      return {
        file,
        route: collapsed === '' ? '/' : `/${collapsed}`,
        development: file.includes(DEV_GROUP),
      };
    });
}

// ---------------------------------------------------------------------------
// 1. The module and its public surface
// ---------------------------------------------------------------------------

const map = requireFile(NAV_MAP, 'the navigation map is missing');
const keys = catalogueKeys();
const roles = mandatedRoles();

if (map !== null) {
  for (const name of [
    'NAV_AUDIENCES',
    'NAV_MAP',
    'MAX_PRIMARY_ENTRIES',
    'navigationFor',
    'activeHrefFor',
    'breadcrumbsFor',
  ]) {
    if (!new RegExp(`export (?:const|function|interface|type) ${name}\\b`).test(map)) {
      finding(NAV_MAP, `the map must export ${name}`);
    }
  }

  const audienceBlock = /export const NAV_AUDIENCES = \[([\s\S]*?)\] as const;/.exec(map);
  const audiences =
    audienceBlock === null
      ? []
      : [...audienceBlock[1].matchAll(/'([a-z]+)'/g)].map((match) => match[1]);
  if (audiences.length === 0) {
    finding(NAV_MAP, 'NAV_AUDIENCES declares no audience');
  }

  for (const block of readExportedArray(map, 'NAV_MAP')) {
    if (block.id === null) {
      finding(NAV_MAP, 'a block in NAV_MAP has no id');
      continue;
    }
    if (block.audience === null || !audiences.includes(block.audience)) {
      finding(NAV_MAP, `block ${block.id} declares an audience outside NAV_AUDIENCES`);
    }
    if (block.labelKey === null || !keys.has(block.labelKey)) {
      finding(
        NAV_MAP,
        `block ${block.id} names the catalogue key ${block.labelKey}, which no namespace declares`,
      );
    }
    if (block.entries.length === 0) {
      finding(
        NAV_MAP,
        `block ${block.id} holds no entries; a heading with nothing under it is a heading nobody needs`,
      );
    }
  }

  const blocks = readExportedArray(map, 'NAV_MAP');
  for (const audience of audiences) {
    if (!blocks.some((block) => block.audience === audience)) {
      finding(NAV_MAP, `no block declares the ${audience} audience, which NAV_AUDIENCES promises`);
    }
  }

  // -------------------------------------------------------------------------
  // 2. Entries: ids, labels, destinations, roles
  // -------------------------------------------------------------------------

  const seenIds = new Map();
  const seenHrefs = new Map();
  const primaryPerAudience = new Map();
  const liveHrefs = new Set();

  for (const block of blocks) {
    for (const entry of block.entries) {
      if (entry.id === null) {
        finding(NAV_MAP, `an entry in block ${block.id} has no id`);
        continue;
      }
      if (seenIds.has(entry.id)) {
        finding(
          NAV_MAP,
          `entry id ${entry.id} is declared twice; an id is the key a saved view, a trail and the command palette all use`,
        );
      }
      seenIds.set(entry.id, block.id);

      if (entry.labelKey === null || !keys.has(entry.labelKey)) {
        finding(
          NAV_MAP,
          `entry ${entry.id} names the catalogue key ${entry.labelKey}, which no namespace declares`,
        );
      }

      if (entry.planned) {
        if (entry.href !== null) {
          finding(
            NAV_MAP,
            `planned entry ${entry.id} declares an href; a destination that does not exist yet must not be written down, or it will be rendered, routed and audited as if it did`,
          );
        }
      } else {
        if (entry.href === null) {
          finding(NAV_MAP, `live entry ${entry.id} declares no href`);
        } else {
          if (!entry.href.startsWith('/')) {
            finding(
              NAV_MAP,
              `entry ${entry.id} points at ${entry.href}, which is not an internal path`,
            );
          }
          if (seenHrefs.has(entry.href)) {
            finding(
              NAV_MAP,
              `entry ${entry.id} repeats the destination ${entry.href}, already used by ${seenHrefs.get(entry.href)}`,
            );
          }
          seenHrefs.set(entry.href, entry.id);
          liveHrefs.add(entry.href);
        }
      }

      if (entry.roles !== null) {
        for (const role of entry.roles) {
          if (!roles.includes(role)) {
            finding(
              NAV_MAP,
              `entry ${entry.id} names the role ${role}, which the role model does not define`,
            );
          }
        }
        if (entry.roles.length === 0 && block.audience !== 'public') {
          finding(
            NAV_MAP,
            `entry ${entry.id} in the ${block.audience} audience declares no roles, so it is offered to any reader with no session`,
          );
        }
        if (entry.roles.length > 0 && block.audience === 'public') {
          finding(
            NAV_MAP,
            `entry ${entry.id} is a public page but is gated to ${entry.roles.join(', ')}; a public page that requires a session is not public`,
          );
        }
      }

      if (entry.parentId !== null) {
        const parent = blocks
          .flatMap((candidate) => candidate.entries)
          .find((candidate) => candidate.id === entry.parentId);
        if (parent === undefined) {
          finding(
            NAV_MAP,
            `entry ${entry.id} names the parent ${entry.parentId}, which the map does not declare`,
          );
        }
      }

      if (entry.primary) {
        const count = (primaryPerAudience.get(block.audience) ?? 0) + 1;
        primaryPerAudience.set(block.audience, count);
        if (count > MAX_PRIMARY_CAP) {
          finding(
            NAV_MAP,
            `the ${block.audience} audience marks ${String(count)} entries as primary; the bottom bar carries ${String(MAX_PRIMARY_CAP)}`,
          );
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // 3. Every route registered, in the block that matches how it is served
  // -------------------------------------------------------------------------

  const routes = routeInventory();
  if (routes.length === 0) {
    finding('app', 'the route inventory is empty; this check has nothing to register against');
  }
  for (const route of routes) {
    if (route.development) {
      const block = blocks.find((candidate) => candidate.audience === 'development');
      if (block === undefined || !block.entries.some((entry) => entry.href === route.route)) {
        finding(
          route.file,
          `the development route ${route.route} is not registered in the development block of ${NAV_MAP}`,
        );
      }
    } else if (!liveHrefs.has(route.route)) {
      finding(
        route.file,
        `the route ${route.route} is registered in no block of ${NAV_MAP}; a page nobody can reach from the navigation is a page nobody finds`,
      );
    }
  }

  // -------------------------------------------------------------------------
  // 4. The development audience is asked for by the development group only
  // -------------------------------------------------------------------------

  for (const file of listTrackedFiles()) {
    if (!/^(app|components|lib)\//.test(file) || !/\.(ts|tsx)$/.test(file)) {
      continue;
    }
    const text = read(file);
    if (text === null) {
      continue;
    }
    const withoutComments = stripComments(text);
    for (const call of NAV_QUERY_FUNCTIONS) {
      if (
        new RegExp(`${call}\\(\\s*'development'`).test(withoutComments) &&
        !file.startsWith('app/(dev)/')
      ) {
        finding(
          file,
          `the development audience is asked for outside the development-only route group (${call}); a product surface that rendered the specimen routes would offer its reader a page that answers 404`,
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 5. One source: no component writes a destination, no component filters roles
// ---------------------------------------------------------------------------

const NAVIGATION_CHROME = /^components\/layout\/|^app\/\([a-z-]+\)\/layout\.tsx$/;
for (const file of listTrackedFiles()) {
  if (!/^(app|components)\//.test(file) || !/\.(ts|tsx)$/.test(file)) {
    continue;
  }
  if (!NAVIGATION_CHROME.test(file)) {
    continue;
  }
  const text = read(file);
  if (text === null) {
    continue;
  }
  const withoutComments = stripComments(text);
  for (const match of withoutComments.matchAll(/\bhref=["'{]+\s*['"]?(\/[a-zA-Z0-9\-/[\]]*)/g)) {
    const { line, column } = positionOf(withoutComments, match.index ?? 0);
    findings.push({
      file,
      line,
      column,
      message: `a destination is written into the navigation chrome (${match[1]}); the chrome renders what the map publishes, so the destination belongs in ${NAV_MAP}`,
    });
  }
}

// Role filtering may exist in exactly one place. A component that filters a list
// by role is a second answer to who may be offered what, and the second answer
// is the one that goes stale, because nothing tests it against the first.
for (const file of listTrackedFiles()) {
  if (!/^(app|components|lib)\//.test(file) || !/\.(ts|tsx)$/.test(file)) {
    continue;
  }
  const text = read(file);
  if (text === null) {
    continue;
  }
  if (/\.roles\.includes\(/.test(stripComments(text))) {
    finding(
      file,
      `role filtering belongs to ${NAV_MAP}; a second filter is a second answer to who may be offered what`,
    );
  }
}

/**
 * Comments blanked out, code and strings kept: the rules below are about code
 * and about the literals inside it, and a comment that mentions href must not
 * satisfy or break a rule.
 */
function stripComments(text) {
  const out = text.split('');
  let index = 0;
  while (index < text.length) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '/' && next === '/') {
      let end = text.indexOf('\n', index);
      if (end === -1) {
        end = text.length;
      }
      for (let cursor = index; cursor < end; cursor += 1) {
        out[cursor] = ' ';
      }
      index = end;
      continue;
    }
    if (char === '/' && next === '*') {
      const closing = text.indexOf('*/', index + 2);
      const end = closing === -1 ? text.length : closing + 2;
      for (let cursor = index; cursor < end; cursor += 1) {
        if (text[cursor] !== '\n') {
          out[cursor] = ' ';
        }
      }
      index = end;
      continue;
    }
    index += 1;
  }
  return out.join('');
}

// ---------------------------------------------------------------------------
// 6. The wiring: the frame owns the landmark, the layout asks the map
// ---------------------------------------------------------------------------

const useNavigation = requireFile(USE_NAVIGATION, 'the role filter hook is missing');
if (useNavigation !== null) {
  if (!/^'use client';/m.test(useNavigation)) {
    finding(USE_NAVIGATION, 'the path-aware part of the filter must be a client module');
  }
  if (!/from 'next\/navigation'/.test(useNavigation) || !/usePathname\(/.test(useNavigation)) {
    finding(
      USE_NAVIGATION,
      'the hook must read the current path; the map decides what current means, the router says where the reader is',
    );
  }
  if (!/@\/config\/nav-map/.test(useNavigation)) {
    finding(
      USE_NAVIGATION,
      'the hook must filter the navigation map rather than a list of its own',
    );
  }
}

const shellNavigation = requireFile(SHELL_NAVIGATION, 'the shell navigation wiring is missing');
if (shellNavigation !== null) {
  if (!/^'use client';/m.test(shellNavigation)) {
    finding(SHELL_NAVIGATION, 'the wiring that reads the path must be a client module');
  }
  for (const surface of ['SidebarNav', 'BottomNavigation']) {
    // The element's own opening tag, ended by its self-closing marker. Reading to
    // a fixed distance instead would let one component's attributes satisfy the
    // rule for the other, which is how an audit passes on a page where one of the
    // two surfaces silently lost its landmark mode.
    const element = new RegExp(`<${surface}\\b[\\s\\S]*?/>`).exec(shellNavigation);
    if (element === null || !/ownsLandmark=\{false\}/.test(element[0])) {
      finding(
        SHELL_NAVIGATION,
        `${surface} must be rendered with ownsLandmark={false}: the shell's slot declares the landmark, and two nested navigation regions are one region the reader has to walk into twice`,
      );
    }
  }
}

for (const file of listTrackedFiles()) {
  if (
    !/^(app|components|lib)\//.test(file) ||
    !/\.(ts|tsx)$/.test(file) ||
    file === SHELL_NAVIGATION
  ) {
    continue;
  }
  const text = read(file);
  if (text !== null && /ownsLandmark=\{false\}/.test(text)) {
    finding(
      file,
      `ownsLandmark={false} is only valid where the frame declares the landmark (${SHELL_NAVIGATION}); everywhere else a navigation surface must declare its own`,
    );
  }
}

for (const layout of WIRED_LAYOUTS) {
  const text = requireFile(layout, 'the route-group layout is missing');
  if (text === null) {
    continue;
  }
  for (const required of [
    'navigationFor',
    'ShellNavigationRail',
    'ShellNavigationBar',
    'sections.length > 0',
  ]) {
    if (!text.includes(required)) {
      finding(
        layout,
        `a group whose shell paints navigation must wire the map: ${required} is missing`,
      );
    }
  }
  const audience = EXPECTED_AUDIENCE_BY_LAYOUT[layout];
  if (!text.includes(`'${audience}'`)) {
    finding(layout, `this group must ask the map for the ${audience} audience`);
  }
}

// ---------------------------------------------------------------------------
// 7. The command surface: one registry, one chord spelling, one focus contract
// ---------------------------------------------------------------------------

const mapBlocks = map === null ? [] : readExportedArray(map, 'NAV_MAP');
const registry = requireFile(COMMANDS, 'the command registry is missing');
const commandIds = [];
const commandChords = [];
const actionCommands = [];
const entryCommands = [];

if (registry !== null) {
  for (const name of [
    'COMMANDS',
    'COMMAND_ACTIONS',
    'COMMAND_IDS',
    'commandById',
    'commandForAction',
    'chordForEntry',
    'shortcutRows',
  ]) {
    if (!new RegExp(`export (?:const|function|interface|type) ${name}\\b`).test(registry)) {
      finding(COMMANDS, `the registry must export ${name}`);
    }
  }

  const actionBlock = /export const COMMAND_ACTIONS = \[([\s\S]*?)\] as const;/.exec(registry);
  const actions =
    actionBlock === null ? [] : [...actionBlock[1].matchAll(/'([a-z-]+)'/g)].map((m) => m[1]);
  if (actions.length === 0) {
    finding(COMMANDS, 'COMMAND_ACTIONS declares no action, so no command can run one');
  }

  const declarations = [
    ...registry.matchAll(
      /\{\s*\n\s*id: '([^']+)',\s*\n\s*kind: '(entry|action)'(?<body>[\s\S]*?)\n {2}\},?\n/g,
    ),
  ];
  if (declarations.length === 0) {
    finding(
      COMMANDS,
      'no command row was found; the registry must declare its rows as object literals',
    );
  }
  for (const declaration of declarations) {
    const id = declaration[1];
    const kind = declaration[2];
    const body = declaration.groups.body;
    const chordMatch = /chord: '([^']+)'/.exec(body);
    const chord = chordMatch === null ? null : chordMatch[1];
    if (commandIds.includes(id)) {
      finding(
        COMMANDS,
        `command id ${id} is declared twice; an id is what a chord, a saved view and a documented shortcut are keyed by`,
      );
    }
    commandIds.push(id);
    if (chord === null) {
      continue;
    }
    if (!/^[!-~]+$/.test(chord) || chord !== chord.trim().toLowerCase()) {
      finding(
        COMMANDS,
        `the chord ${chord} of ${id} is not in canonical form; a chord is written lowercase, in one piece, and in exactly one place`,
      );
    }
    if (/(^|\+)(ctrl|cmd|meta|control|command)(\+|$)/.test(chord)) {
      finding(
        COMMANDS,
        `the chord ${chord} of ${id} names a platform modifier; write ${MODIFIER_TOKEN} so one chord is Control on Windows and Linux and Command on macOS`,
      );
    }
    const clash = commandChords.find((existing) => existing.chord === chord);
    if (clash !== undefined) {
      finding(
        COMMANDS,
        `the chord ${chord} is declared by ${clash.id} and again by ${id}; the second handler is the one that never runs`,
      );
    }
    commandChords.push({ id, chord });
    if (kind === 'action') {
      const action = /action: '([a-z-]+)'/.exec(body);
      if (action === null || !actions.includes(action[1])) {
        finding(COMMANDS, `command ${id} names an action outside COMMAND_ACTIONS`);
      } else {
        actionCommands.push({ id, action: action[1] });
      }
    } else {
      const entry = /entryId: '([^']+)'/.exec(body);
      if (entry === null) {
        finding(COMMANDS, `entry command ${id} names no map entry, so nothing says where it leads`);
      } else {
        entryCommands.push({ id, entryId: entry[1], chord });
      }
    }
  }

  for (const command of entryCommands) {
    const block = mapBlocks.find((candidate) =>
      candidate.entries.some((entry) => entry.id === command.entryId),
    );
    if (block === undefined) {
      finding(
        COMMANDS,
        `entry command ${command.id} names ${command.entryId}, which the map does not declare`,
      );
      continue;
    }
    const entry = block.entries.find((candidate) => candidate.id === command.entryId);
    if (entry.planned) {
      finding(
        COMMANDS,
        `entry command ${command.id} reaches the planned entry ${command.entryId}; a shortcut to a page that does not exist yet is a dead key, not a shortcut`,
      );
    }
  }
}

const palette = requireFile(COMMAND_PALETTE, 'the command palette is missing');
const commandList = requireFile(COMMAND_LIST, 'the palette result list is missing');
const keyChord = requireFile(KEY_CHORD, 'the key chord module is missing');
const shortcutsPage = requireFile(SHORTCUTS_PAGE, 'the shortcuts reference page is missing');

if (palette !== null) {
  const code = stripComments(palette);
  if (!/useNavigation\(/.test(code)) {
    finding(
      COMMAND_PALETTE,
      'the palette must take its pages from the role-filtered navigation, not from a list of its own',
    );
  }
  if (/\bNAV_MAP\b/.test(code)) {
    finding(
      COMMAND_PALETTE,
      'the palette must not read the raw map; a reader is offered what the map offers that reader',
    );
  }
  if (!/DialogContent/.test(code)) {
    finding(
      COMMAND_PALETTE,
      'the palette must be one of the product dialogs, so focus is trapped while it is open and returned to the trigger when it closes',
    );
  }
  if (/role="dialog"|aria-modal=/.test(code)) {
    finding(
      COMMAND_PALETTE,
      'the dialog role and the modal state belong to the dialog primitive; declaring them again is a second answer to whether this surface is modal',
    );
  }
  for (const attribute of [
    'aria-haspopup="dialog"',
    'role="combobox"',
    'aria-activedescendant',
    'aria-controls',
    'aria-expanded',
    'aria-autocomplete="list"',
  ]) {
    if (!code.includes(attribute)) {
      finding(
        COMMAND_PALETTE,
        `the palette must declare ${attribute}: the field keeps the focus while the list is navigated through it`,
      );
    }
  }
  if (!/matchesChord\(/.test(code) || !/isTypingTarget\(/.test(code)) {
    finding(
      COMMAND_PALETTE,
      `a global chord must be matched by ${KEY_CHORD} and must stand down inside a field; a shortcut that ignores a text input takes a character away from the reader`,
    );
  }
  for (const command of actionCommands) {
    if (!code.includes(`'${command.action}'`)) {
      finding(
        COMMAND_PALETTE,
        `the action ${command.action} is registered by ${command.id} but nothing runs it`,
      );
    }
  }
}

if (commandList !== null) {
  const code = stripComments(commandList);
  if (!/role="listbox"/.test(code) || !/role="option"/.test(code)) {
    finding(
      COMMAND_LIST,
      'the results are a listbox of options, and the field points at the active one through aria-activedescendant',
    );
  }
  if (/tabIndex/.test(code)) {
    finding(
      COMMAND_LIST,
      'an option must not take focus: moving down the list moves the active descendant, and a focusable row is how a palette loses the reader mid-word',
    );
  }
  if (!/aria-selected/.test(code)) {
    finding(COMMAND_LIST, 'every option must report whether it is the active one');
  }
}

if (keyChord !== null) {
  const code = stripComments(keyChord);
  if (!/const MODIFIER_TOKEN = 'mod'/.test(code)) {
    finding(KEY_CHORD, 'the platform modifier must be spelled once, as mod');
  }
  if (!/\/\^\[a-z\]\$\//.test(code) || !/shift !== event\.shiftKey/.test(code)) {
    finding(
      KEY_CHORD,
      'the shift comparison must be gated on a letter key: a symbol chord is the character the reader typed, and demanding shift as well makes it depend on the keyboard layout',
    );
  }
  if (!/ctrlKey \|\| event\.metaKey/.test(code)) {
    finding(KEY_CHORD, 'one chord must match Control on Windows and Linux and Command on macOS');
  }
}

if (shortcutsPage !== null) {
  const code = stripComments(shortcutsPage);
  if (!/shortcutRows\(/.test(code)) {
    finding(
      SHORTCUTS_PAGE,
      'the reference page must list the registry rows; a second list of shortcuts is a second answer to what the keys are',
    );
  }
  if (!/KeyChord/.test(code)) {
    finding(
      SHORTCUTS_PAGE,
      'a chord on the page must be rendered as keycaps, from the one chord spelling',
    );
  }
}

// The palette has to be mounted by something. A component that nothing renders
// is a feature that does not exist, and the check that reads the map cannot see
// a surface nobody wired.
const paletteHosts = listTrackedFiles().filter((file) => {
  if (!/^app\//.test(file) || !/\.tsx$/.test(file)) {
    return false;
  }
  const text = read(file);
  return text !== null && /<CommandPalette\b/.test(text);
});
if (paletteHosts.length === 0) {
  finding(
    'app',
    `no route renders <CommandPalette>; the palette is only reachable from the frame or the page that mounts it, and sub-step 1.23 owes the keyboard at least one host`,
  );
}

// A chord belongs to the registry, and it is written down nowhere else. The two
// exceptions are the registry itself and the matcher that gives the tokens their
// meaning; every other file that spells one is on its way to being the second
// answer to what the shortcut is.
for (const file of listTrackedFiles()) {
  if (!/^(app|components|config|lib)\//.test(file) || !/\.(ts|tsx)$/.test(file)) {
    continue;
  }
  if (file === COMMANDS || file === KEY_CHORD) {
    continue;
  }
  const text = read(file);
  if (text === null) {
    continue;
  }
  const code = stripComments(text);
  for (const match of code.matchAll(/['"`](?:mod|ctrl|cmd|shift|alt)\+[a-z0-9]/g)) {
    const { line, column } = positionOf(code, match.index ?? 0);
    findings.push({
      file,
      line,
      column,
      message: `a chord is written outside ${COMMANDS}; the second spelling is the one that stops working when one of the two changes`,
    });
  }
}

// Focus moves in a small, documented number of places. A fourth one is a
// decision, not an accident, so it has to be written down here as well.
const FOCUS_MOVERS = [
  COMMAND_PALETTE,
  'components/shared/form-error-summary.tsx',
  'lib/forms/use-mapped-form-errors.ts',
];
for (const file of listTrackedFiles()) {
  if (!/^(app|components|lib)\//.test(file) || !/\.(ts|tsx)$/.test(file)) {
    continue;
  }
  const text = read(file);
  if (text === null) {
    continue;
  }
  if (/\.focus\(\)/.test(stripComments(text)) && !FOCUS_MOVERS.includes(file)) {
    finding(
      file,
      `a fourth place moves focus; if it belongs in the product, say why in the comment here and list it in ${CHECK_FILE}`,
    );
  }
}

reportResult(
  CHECK,
  findings,
  `${NAV_MAP} verified: ${String(mandatedRoles().length)} roles filtered, one audience per surface, no destination outside the map, wiring gated on a non-empty menu, ${String(commandIds.length)} commands on ${String(commandChords.length)} chords`,
);
process.exitCode = findings.length === 0 ? 0 : 1;

/**
 * Read every entry of one exported array of object literals, with the fields
 * this check cares about. The map is data, not code, so the parse is small: each
 * top-level object literal in the array becomes one record, and each field is
 * either a string literal, a boolean, or an array of string literals.
 */
function readExportedArray(text, name) {
  const sourceFile = ts.createSourceFile(
    NAV_MAP,
    text,
    ts.ScriptTarget.ES2022,
    true,
    ts.ScriptKind.TS,
  );
  const records = [];
  const visit = (node) => {
    if (
      ts.isVariableStatement(node) &&
      node.declarationList.declarations.some(
        (declaration) => declaration.name.getText(sourceFile) === name,
      )
    ) {
      const declaration = node.declarationList.declarations[0];
      const initializer = declaration.initializer;
      const array = initializer === undefined ? undefined : unwrapArray(initializer);
      if (array === undefined) {
        finding(NAV_MAP, `${name} is not an array literal`);
      } else {
        for (const element of array.elements) {
          if (!ts.isObjectLiteralExpression(element)) {
            continue;
          }
          records.push(readBlock(sourceFile, element));
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return records;
}

function unwrapArray(node) {
  let current = node;
  while (
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isParenthesizedExpression(current) ||
    ts.isTypeAssertionExpression(current)
  ) {
    current = current.expression;
  }
  return ts.isArrayLiteralExpression(current) ? current : undefined;
}

function readBlock(sourceFile, literal) {
  const block = {
    id: null,
    audience: null,
    labelKey: null,
    entries: [],
  };
  for (const property of literal.properties) {
    if (!ts.isPropertyAssignment(property)) {
      continue;
    }
    const field = property.name.getText(sourceFile);
    const value = property.initializer;
    if (field === 'id' && ts.isStringLiteralLike(value)) {
      block.id = value.text;
    } else if (field === 'audience' && ts.isStringLiteralLike(value)) {
      block.audience = value.text;
    } else if (field === 'labelKey' && ts.isStringLiteralLike(value)) {
      block.labelKey = value.text;
    } else if (field === 'entries' && ts.isArrayLiteralExpression(value)) {
      block.entries = value.elements
        .filter((element) => ts.isObjectLiteralExpression(element))
        .map((element) => readEntry(sourceFile, element));
    }
  }
  return block;
}

function readEntry(sourceFile, literal) {
  const entry = {
    id: null,
    labelKey: null,
    href: null,
    roles: null,
    parentId: null,
    primary: false,
    planned: false,
  };
  for (const property of literal.properties) {
    if (!ts.isPropertyAssignment(property)) {
      continue;
    }
    const field = property.name.getText(sourceFile);
    const value = property.initializer;
    if (field === 'id' && ts.isStringLiteralLike(value)) {
      entry.id = value.text;
    } else if (field === 'labelKey' && ts.isStringLiteralLike(value)) {
      entry.labelKey = value.text;
    } else if (field === 'href' && ts.isStringLiteralLike(value)) {
      entry.href = value.text;
    } else if (field === 'href') {
      entry.href = '<expression>';
    } else if (field === 'parentId' && ts.isStringLiteralLike(value)) {
      entry.parentId = value.text;
    } else if (field === 'primary' && value.kind === ts.SyntaxKind.TrueKeyword) {
      entry.primary = true;
    } else if (field === 'planned' && value.kind === ts.SyntaxKind.TrueKeyword) {
      entry.planned = true;
    } else if (field === 'roles' && ts.isArrayLiteralExpression(value)) {
      entry.roles = value.elements
        .filter((element) => ts.isStringLiteralLike(element))
        .map((element) => element.text);
    }
  }
  return entry;
}
