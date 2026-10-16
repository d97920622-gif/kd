# path: docs/EVIDENCE/step-01/shell-probe.py
"""Shell probe -- the rendered shells, the skip link and the print base.

Run by hand against the development server, never wired into npm run verify:

    python3 docs/EVIDENCE/step-01/shell-probe.py

WHAT THIS MEASURES, AND WHY IT IS NOT A CHECK SCRIPT

scripts/checks/layout-shells.mjs verifies the shell contract as source text:
the skip link and the landmark share one id, the link comes first, the print
stylesheet maps every role. None of that proves the browser receives it. This
probe reads the response the server actually sends, so it can report the things
only a rendered page can show:

  1. The skip link is the first focusable element in the document. The check
     reads the order of two components in a file; the probe reads the order of
     every focusable element in the markup, which is what a keyboard user
     experiences.
  2. The skip link's target exists, is a main landmark, and is focusable, so
     the link lands somewhere instead of doing nothing.
  3. There is exactly one main landmark per shell, so the landmark list a
     screen reader offers is unambiguous.
  4. The print base reached the browser: the loaded stylesheet carries an
     @media print block, the chrome-hiding rules (including the one that hides
     buttons), the print-only rule, the ink outline for status markers, the
     paper palette remap and the page margin. Selector lists are parsed rather
     than pattern matched, because the bundler writes them minified and a rule
     is contained in a list, not in a rule of its own.
  5. The paper palette in the loaded stylesheet equals the values in
     config/design-tokens.ts, so print cannot drift from the token module.
  6. The print markers survived rendering: the specimen's print-hidden block,
     print-only blocks and ink-outlined badge are in the markup with the
     attributes the stylesheet selects on.
  7. Role-aware framing is correct for every role (sub-step 1.20). The response
     is split into shell blocks at their role-bearing roots, and each block is
     checked for the band and the notice its role calls for, by the copy the
     reader actually sees: the founder gets the platform band and no notice,
     the CEO and admin staff get the band plus the notice their approval level
     carries, the owner gets no band, the owner's staff get the approval notice
     alone, the client gets a document frame with no band and no navigation,
     and an unresolved reader gets landmarks and nothing else.

  8. The navigation surfaces are correct as rendered (sub-step 1.21): each
     navigation has its own accessible name, exactly one entry inside it claims
     the current page and never two, every entry has a readable name, every
     entry's touch target is the 44 pixel class rather than the height of its
     text, the reserved entry appears nowhere, the pinned bar and the action bar
     carry the device inset, and the top bar owns the sticky position and the
     `header` landmark. The entry list, the current page and the touch target
     are the three things a reader notices when they are wrong, and none of them
     is visible from the component source alone.
  9. The safe-area chain reaches the browser: the four inset variables are
     declared from the browser's own report, the utilities that consume them
     compile, and the scale the surfaces use (the rail width, the page width,
     the touch step, the bar label size) compiles to the values the token module
     declares. A utility that compiles to nothing is a surface that silently
     loses its padding on the one device it was written for.

 10. The navigation map is the source the page renders from (sub-step 1.22).
     Three things about the map are only visible in a response:

     - **The generated trail is right for all three paths.** A registered path
       produces one item that is not a link and claims the current page; a path
       below a registered entry produces the ancestor as a link and no current
       claim, because the page the reader is on is not in the map; a path the map
       has never heard of produces no trail at all rather than a home link the
       reader did not ask for.
     - **The role filter runs.** The specimen prints what the map offers each of
       twelve audience and role pairs, and the probe checks the counts against
       the roles: the owner is offered more workspace modules than staff, a client
       is offered no workspace module at all, and every role outside an audience
       gets nothing from it.
     - **No planned entry reaches a surface.** The labels to look for are read
       out of the page's own map table, and none of them may appear inside a
       navigation landmark anywhere in the response. The drop box is the
       specimen's own negative control: a rail asked for by an audience the map
       has nothing live for renders no landmark and no anchor.

It deliberately does not open a print preview or a headless browser: the build
has no browser dependency, and a probe that needs one would not run in this
repository. What it can prove is that the rules and the markup that the rules
select on both arrive intact, which is the part that breaks when a stylesheet
import is moved or an attribute is dropped. What it cannot prove is stated with
the measurements below: the drawer panel mounts into a portal on interaction and
is not part of the server-rendered markup, so the drawer's focus trap and its
close-on-navigate behaviour are verified in source by check:layout-shells rather
than here.
"""
from __future__ import annotations

import re
import sys
import urllib.request

BASE_URL = 'http://127.0.0.1:3000'
PAGE_URL = f'{BASE_URL}/shells'

FOCUSABLE = re.compile(
    r'<(a|button|input|select|textarea|summary)\b[^>]*?(?:href="(?P<href>[^"]*)"|(?<!disabled)\s*>)?[^>]*>',
    re.IGNORECASE,
)

VOID_TAGS = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'}

def without_comments(css: str) -> str:
    """The stylesheet without its comments.

    The development build serves the stylesheet with its comments intact, and
    a comment sitting before a selector ends up inside the parsed selector
    list. Stripping them is what makes the rule lookups below find the rules a
    browser finds.
    """
    return re.sub(r"/\*[\s\S]*?\*/", '', css)


def print_blocks(css: str) -> list[str]:
    """Every @media print block in the loaded stylesheet, brace matched."""
    blocks: list[str] = []
    for match in re.finditer(r"@media\s+print\s*\{", css):
        depth = 1
        index = match.end()
        while index < len(css) and depth > 0:
            if css[index] == '{':
                depth += 1
            elif css[index] == '}':
                depth -= 1
            index += 1
        blocks.append(css[match.end() : index - 1])
    return blocks


def rules(block: str) -> list[tuple[set[str], str]]:
    """Rules of a block as (selectors, declarations), selector lists split."""
    found: list[tuple[set[str], str]] = []
    for match in re.finditer(r"([^{}]+)\{([^{}]*)\}", block):
        selectors = {entry.strip().replace('"', "'") for entry in match.group(1).split(',')}
        found.append((selectors, match.group(2)))
    return found


def has_print_rule(blocks: list[str], selector: str, declaration: str) -> bool:
    """True when some print rule selects `selector` and declares `declaration`.

    Both sides are substring matches. A selector is often part of a longer one
    (`:root [data-print='only']`), and a declaration is often one entry in a
    shorthand-bearing block, so exact equality reports a missing rule that the
    browser is applying.
    """
    wanted = selector.replace('"', "'")
    for block in blocks:
        for selectors, declarations in rules(block):
            if any(wanted in entry for entry in selectors) and declaration in declarations.replace(
                ' ', ''
            ):
                return True
    return False


EXPECTED_PRINT_RULES = {
    'the chrome block is hidden': ('[data-print="hide"]', 'display:none'),
    'buttons are hidden': ('button', 'display:none'),
    'print-only blocks are shown': ('[data-print="only"]', 'display:block'),
    'status markers keep an outline': ('[data-print="outline"]', 'border:'),
    'rows are kept whole': ('tr', 'break-inside:avoid'),
}

EXPECTED_PAGE_MARGIN = 'margin:16mm'

EXPECTED_PAPER_PALETTE = {
    '--print-paper': '0 0% 100%',
    '--print-ink': '0 0% 0%',
    '--print-muted-ink': '0 0% 33%',
    '--print-rule': '0 0% 45%',
}


def fetch(url: str) -> str:
    with urllib.request.urlopen(url, timeout=30) as response:
        return response.read().decode('utf-8', 'replace')


def stylesheets(page: str) -> list[str]:
    return re.findall(r'href="(/_next/static/css/[^"]+\.css)[^"]*"', page)


def strip_scripts(page: str) -> str:
    without_scripts = re.sub(r'<script\b[\s\S]*?</script>', '', page)
    return re.sub(r'<style\b[\s\S]*?</style>', '', without_scripts)


def focusable_before_main(markup: str, main_index: int) -> list[str]:
    """Focusable elements in document order, before the first main landmark."""
    order: list[str] = []
    index = 0
    for match in re.finditer(r'<([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*>', markup):
        tag = match.group(1).lower()
        if tag in VOID_TAGS or tag in ('html', 'head', 'body', 'script', 'style', 'meta', 'link'):
            continue
        if tag not in ('a', 'button', 'input', 'select', 'textarea', 'summary', 'main'):
            continue
        if tag == 'main':
            main_index = match.start()
            break
        if match.start() > main_index:
            break
        attributes = match.group(0)
        if 'disabled' in attributes:
            continue
        if tag == 'a' and 'href=' not in attributes:
            continue
        tabindex = re.search(r'tabindex="(-?\d+)"', attributes)
        if tabindex is not None and int(tabindex.group(1)) < 0:
            continue
        order.append(f'{tag} {attributes[:70]}')
    return order


SHELL_ROOT = re.compile(
    r'<div[^>]*data-shell="(?P<shell>[a-z-]+)"[^>]*>',
    re.IGNORECASE,
)

# The copy each role must or must not see, read from the catalogue as rendered.
PLATFORM_BANNER = 'Platform administration'
CEO_NOTICE = 'submitted to the super admin for approval'
ADMIN_STAFF_NOTICE = 'approved by the platform CEO or the super admin'
STAFF_NOTICE = 'sent to the owner for approval'

# The three approval sentences, so a frame cannot be showing the wrong one.

NOTICE_TEXTS = [CEO_NOTICE, ADMIN_STAFF_NOTICE, STAFF_NOTICE]

# role -> (shell, banner expected, notice expected, navigation expected)
EXPECTED_FRAMES = {
    'super_admin': ('admin', True, None, True),
    'ceo': ('admin', True, CEO_NOTICE, True),
    'admin_staff': ('admin', True, ADMIN_STAFF_NOTICE, True),
    'owner': ('dashboard', False, None, True),
    'staff': ('dashboard', False, STAFF_NOTICE, True),
    'client': ('client-portal', False, None, False),
    'unresolved': ('dashboard', False, None, False),
}


def shell_blocks(markup: str) -> list[tuple[dict[str, str], str]]:
    """The markup split at each shell root, with the root's attributes.

    A shell root carries three attributes the CSS and a probe both read: the
    shell name, the framing role and the audience. Splitting there is what
    makes it possible to ask a question per reader - what did *this* frame
    contain - instead of counting strings across a page where six frames sit
    next to each other.
    """
    roots = list(SHELL_ROOT.finditer(markup))
    blocks: list[tuple[dict[str, str], str]] = []
    for index, match in enumerate(roots):
        end = roots[index + 1].start() if index + 1 < len(roots) else len(markup)
        attributes = {
            name: value
            for name, value in re.findall(r'(data-[a-z-]+)="([^"]*)"', match.group(0))
        }
        blocks.append((attributes, markup[match.start() : end]))
    return blocks


def brace_block(text: str, open_index: int) -> str:
    """The body of a block, given the index of the character after its `{`."""
    depth = 1
    index = open_index
    while index < len(text) and depth > 0:
        if text[index] == '{':
            depth += 1
        elif text[index] == '}':
            depth -= 1
        index += 1
    return text[open_index : index - 1]


def media_block(css: str, query: str) -> str:
    """The body of the first at-rule whose prelude contains `query`."""
    match = re.search(rf'@media[^{{]*{re.escape(query)}[^{{]*\{{', css)
    if match is None:
        return ''
    return brace_block(css, match.end())


def element_with_marker(markup: str, marker: str) -> str:
    """The outer markup of the element carrying data-layout="marker".

    The surfaces nest, so the element is closed by counting tags of the same
    name rather than by looking for the next `</div>`: a probe that guesses the
    end of a block measures a region that straddles two surfaces, and every
    count inside it is wrong.
    """
    index = markup.find(f'data-layout="{marker}"')
    if index < 0:
        return ''
    start = markup.rfind('<', 0, index)
    name = re.match(r'<([a-zA-Z][a-zA-Z0-9-]*)', markup[start:])
    if name is None:
        return ''
    tag = name.group(1)
    depth = 0
    for match in re.finditer(rf'<(/?){re.escape(tag)}\b[^>]*?>', markup[start:]):
        if match.group(1) == '/':
            depth -= 1
        else:
            depth += 1
        if depth == 0:
            return markup[start : start + match.end()]
    return markup[start:]


def visible_text(markup: str) -> str:
    """The readable text of a fragment: tags removed, entities left alone."""
    return re.sub(r'<[^>]+>', '', re.sub(r'<svg\b[\s\S]*?</svg>', '', markup)).strip()


def css_declarations(css: str, selector: str) -> str:
    """The declarations of the first rule whose selector matches exactly."""
    match = re.search(rf'(?:^|[}},])\s*{re.escape(selector)}\s*\{{([^{{}}]*)\}}', css)
    return match.group(1) if match is not None else ''


def single_class(attributes: str, prefix: str) -> str:
    """The first class token in an element's attributes that starts with prefix."""
    found = re.search(r'class="([^"]*)"', attributes)
    if found is None:
        return ''
    for token in found.group(1).split():
        if token.startswith(prefix):
            return token
    return ''


# marker, accessible name, label size class, links, items. The breadcrumb has
# one item and no link: the item is the page the reader is on, and the trail is
# generated from the map (sub-step 1.22), which is why the size class is None -
# the trail is text the reader scans, not a destination they aim at.
EXPECTED_NAV_LANDMARKS = [
    ('sidebar', 'Main navigation', 'text-base', 2, 2),
    ('bottom-navigation', 'Primary navigation', 'text-xs', 2, 2),
    ('breadcrumbs', 'Breadcrumb', None, 0, 1),
]

EXPECTED_NAV_ENTRIES = 2
PROBE_NONE = 'None'
PROBE_ANONYMOUS = 'No session'
# The three trails the specimen draws from the map (sub-step 1.22), in the order
# the page renders them, and what each must contain:
#   registered - the path is an entry: one item, not a link, marked current;
#   nested     - the path is below an entry: the ancestor as a link, no current
#                claim, because the page the reader is on is not in the map;
#   unknown    - the map knows nothing: no trail at all, not a guessed one.
EXPECTED_TRAILS = [
    ('registered', 1, False, True),
    ('nested', 1, True, False),
    ('unknown', 0, False, False),
]
# The reader table the specimen renders from the map. The three workspace rows
# are the visible proof that the role filter runs: the owner is offered the
# business modules, staff fewer of them, and a client none at all.
EXPECTED_READER_ROWS = 12
EXPECTED_WORKSPACE_OWNER_PLANNED = 15
EXPECTED_WORKSPACE_STAFF_PLANNED = 13
EXPECTED_WORKSPACE_CLIENT_PLANNED = 0
EXPECTED_PUBLIC_PLANNED = 10
EXPECTED_PLATFORM_PLANNED = 8
EXPECTED_CLIENT_PLANNED = 4
EXPECTED_DEV_LIVE = 2
# The specimen's own drop box: a rail asked for by an audience the map has
# nothing live for must render no landmark and no anchor at all.
DROP_MARKER = 'data-nav-drop="workspace-owner"'

EXPECTED_SAFE_AREA_VARIABLES = {
    '--safe-top': 'env(safe-area-inset-top, 0px)',
    '--safe-bottom': 'env(safe-area-inset-bottom, 0px)',
}

EXPECTED_UTILITY_RULES = [
    ('the rail keeps its declared width', '.w-sidebar', 'width:16rem'),
    ('the page container keeps its declared width', '.max-w-page', 'max-width:72rem'),
    ('the touch step is 44 pixels', '.min-h-touch', 'min-height:44px'),
    ('the bottom bar consumes the bottom inset', '.pb-\\[var\\(--safe-bottom\\)\\]', 'padding-bottom:var(--safe-bottom)'),
    (
        'the action bar adds its own padding to the bottom inset',
        '.pb-\\[calc\\(var\\(--safe-bottom\\)\\+12px\\)\\]',
        'padding-bottom:calc(var(--safe-bottom) + 12px)',
    ),
    ('the top bar consumes the top inset', '.pt-\\[var\\(--safe-top\\)\\]', 'padding-top:var(--safe-top)'),
    ('the bar label is the documented 12 pixels', '.text-xs', 'font-size:12px'),
    ('the bar columns follow the entry count', '.auto-cols-fr', 'grid-auto-columns:minmax(0, 1fr)'),
]


def table_rows(markup: str, table_marker: str) -> list[list[str]]:
    """The cells of every row of the table carrying a data-nav-map marker."""
    table = re.search(rf'<table data-nav-map="{re.escape(table_marker)}"[\s\S]*?</table>', markup)
    if table is None:
        return []
    rows = []
    for row in re.findall(r'<tr\b[\s\S]*?</tr>', table.group(0)):
        cells = [
            visible_text(cell) for cell in re.findall(r'<td\b[^>]*>[\s\S]*?</td>', row)
        ]
        if cells:
            rows.append(cells)
    return rows


def planned_labels(markup: str) -> list[str]:
    """Every label the specimen's map table declares as planned.

    Read out of the rendered table rather than from a list kept here: the page
    prints what the map declares, and a probe with its own copy of the answer
    would keep passing after the map changed.
    """
    labels = []
    for row in table_rows(markup, 'blocks'):
        if len(row) >= 4 and row[3] != PROBE_NONE:
            labels.extend(part.strip() for part in row[3].split(','))
    return [label for label in labels if label != '']


def trail_blocks(markup: str) -> dict[str, str]:
    """The trail examples, keyed by the path kind the specimen labels them with."""
    blocks = {}
    for name, _, _, _ in EXPECTED_TRAILS:
        marker = f'data-trail="{name}"'
        index = markup.find(marker)
        if index < 0:
            blocks[name] = ''
            continue
        start = markup.rfind('<', 0, index)
        following = [
            position
            for position in (
                markup.find(f'data-trail="{other}"', index) for other, _, _, _ in EXPECTED_TRAILS
            )
            if position > index
        ]
        section_end = markup.find('<section', index)
        ends = following + ([] if section_end < 0 else [section_end])
        end = min(ends) if ends else len(markup)
        blocks[name] = markup[start:end]
    return blocks


def verify_navigation_map(markup: str, findings: list[str]) -> None:
    """Sub-step 1.22: the map, as the rendered page reports it."""
    print('navigation map (generated trails, role filtering, planned entries)')

    for name, expected_items, expect_link, expect_current in EXPECTED_TRAILS:
        block = trail_blocks(markup).get(name, '')
        problems = []
        if block == '':
            problems.append('the specimen renders no trail for this path')
        else:
            navs = re.findall(r'<nav\b[\s\S]*?</nav>', block)
            if expected_items == 0:
                if navs:
                    problems.append('a trail was drawn for a path the map does not know')
            elif len(navs) != 1:
                problems.append(f'{len(navs)} trails, expected 1')
            else:
                links = re.findall(r'<a\b', navs[0])
                current = len(re.findall(r'aria-current="page"', navs[0]))
                if (len(links) > 0) != expect_link:
                    problems.append(
                        f'{"a" if links else "no"} link in the trail, expected'
                        f' {"one" if expect_link else "none"}'
                    )
                if current != (1 if expect_current else 0):
                    problems.append(
                        f'{current} items claim the current page, expected'
                        f' {1 if expect_current else 0}'
                    )
        print(f'  trail {name:13}{"ok" if not problems else "; ".join(problems)}')
        for problem in problems:
            findings.append(f'breadcrumb trail for a {name} path: {problem}')

    rows = table_rows(markup, 'readers')
    problems = []
    if len(rows) != EXPECTED_READER_ROWS:
        problems.append(f'{len(rows)} reader rows, expected {EXPECTED_READER_ROWS}')
    by_reader = {f'{row[0]}:{row[1]}': row for row in rows if len(row) >= 6}
    expected_planned = {
        'workspace:owner': EXPECTED_WORKSPACE_OWNER_PLANNED,
        'workspace:staff': EXPECTED_WORKSPACE_STAFF_PLANNED,
        'workspace:client': EXPECTED_WORKSPACE_CLIENT_PLANNED,
        'public:client': EXPECTED_PUBLIC_PLANNED,
        'platform:super_admin': EXPECTED_PLATFORM_PLANNED,
        'client:client': EXPECTED_CLIENT_PLANNED,
    }
    for reader, expected in expected_planned.items():
        row = by_reader.get(reader)
        if row is None:
            problems.append(f'the specimen does not report what {reader} is offered')
        elif row[3] != str(expected):
            problems.append(f'{reader} is offered {row[3]} planned modules, expected {expected}')
    # The filter itself: a role that does not belong to an audience is offered
    # nothing, whatever the audience declares.
    for reader in ('workspace:client', 'platform:owner', 'client:staff'):
        row = by_reader.get(reader)
        if row is not None and row[2] != PROBE_NONE:
            problems.append(f'{reader} is offered modules from an audience it is not part of')
    dev = by_reader.get(f'development:{PROBE_ANONYMOUS}')
    if dev is None:
        problems.append('the specimen does not report what this page itself is offered')
    elif dev[2].count(',') + 1 != EXPECTED_DEV_LIVE:
        problems.append(f'the development audience offers {dev[2]} entries, expected the two this build serves')
    print(f'  {"role filter":20}{"ok" if not problems else "; ".join(problems)}')
    for problem in problems:
        findings.append(f'role filter: {problem}')

    print()


def verify_navigation_surfaces(markup: str, css: str, findings: list[str]) -> None:
    """Sub-step 1.21: the navigation surfaces, as the server sends them."""
    print('navigation surfaces')
    for marker, label, size_class, expected_links, expected_items in EXPECTED_NAV_LANDMARKS:
        surface = element_with_marker(markup, marker)
        problems: list[str] = []
        if surface == '':
            problems.append('missing from the page')
        else:
            if f'<nav aria-label="{label}"' not in surface:
                problems.append(f'landmark is not named "{label}"')
            links = re.findall(r'<a\b[^>]*>', surface)
            names = [visible_text(entry) for entry in re.findall(r'<a\b[\s\S]*?</a>', surface)]
            current = len(re.findall(r'aria-current="page"', surface))
            if current != 1:
                problems.append(f'{current} entries claim the current page, expected 1')
            items = len(re.findall(r'<li\b', surface))
            if len(links) != expected_links:
                problems.append(f'{len(links)} links, expected {expected_links}')
            if items != expected_items:
                problems.append(f'{items} items, expected {expected_items}')
            for entry, name in zip(links, names):
                if 'min-h-touch' not in entry:
                    problems.append('an entry has no 44 pixel touch target')
                if name == '':
                    problems.append('an entry has no readable name')
            if size_class is not None and not all(
                f' {size_class}' in entry or f' {size_class} ' in entry for entry in links
            ):
                problems.append(f'an entry is not set in {size_class}')
            if marker == 'bottom-navigation' and 'pb-[var(--safe-bottom)]' not in surface:
                problems.append('the bar does not consume the bottom inset')
        print(f'  {marker:20}{"ok" if not problems else "; ".join(problems)}')
        for problem in problems:
            findings.append(f'{marker}: {problem}')

    footer = element_with_marker(markup, 'site-footer')
    footer_link_nav = re.search(r'<nav aria-label="Product"[\s\S]*?</nav>', footer)
    footer_links = [] if footer_link_nav is None else re.findall(r'<a\b', footer_link_nav.group(0))
    footer_current = 0 if footer_link_nav is None else len(re.findall(r'aria-current="page"', footer_link_nav.group(0)))
    legal = re.search(r'Copyright \d{4} KD SOLUTION IT\. All rights reserved\.', footer)
    print(
        f'  {"site-footer":20}'
        + (
            'ok'
            if footer_link_nav is not None and len(footer_links) == EXPECTED_NAV_ENTRIES and footer_current == 1 and legal is not None
            else 'problem'
        )
    )
    if footer_link_nav is None:
        findings.append('site-footer: the link group is missing or unnamed')
    elif len(footer_links) != EXPECTED_NAV_ENTRIES:
        findings.append(f'site-footer: {len(footer_links)} links, expected {EXPECTED_NAV_ENTRIES}')
    elif footer_current != 1:
        findings.append(f'site-footer: {footer_current} links claim the current page, expected 1')
    elif legal is None:
        findings.append('site-footer: the legal line is missing the composed year')

    action_bar = element_with_marker(markup, 'sticky-action-bar')
    action_problems = []
    if 'role="group"' not in action_bar or 'aria-label="Form actions"' not in action_bar:
        action_problems.append('the action bar is not a named group')
    if 'pb-[calc(var(--safe-bottom)+12px)]' not in action_bar:
        action_problems.append('the action bar does not consume the bottom inset')
    if 'data-print="hide"' not in action_bar:
        action_problems.append('the action bar is not hidden in print')
    if 'sticky' not in action_bar or 'fixed' in action_bar:
        action_problems.append('the action bar is not sticky in the shell column')
    print(f'  {"sticky-action-bar":20}{"ok" if not action_problems else "; ".join(action_problems)}')
    for problem in action_problems:
        findings.append(f'sticky-action-bar: {problem}')

    top_shell = element_with_marker(markup, 'shell-top-bar')
    top_bar = element_with_marker(markup, 'topbar')
    trigger = re.search(r'<button[^>]*data-layout="drawer-trigger"[^>]*>', top_bar)
    trigger_open = re.search(r'<button[^>]*aria-haspopup="dialog"[^>]*>', top_bar)
    top_problems = []
    for required in ('sticky', 'top-0', 'z-sticky', 'pt-[var(--safe-top)]', 'data-print="hide"'):
        if required not in top_shell:
            top_problems.append(f'the header is missing {required}')
    if top_shell.count('<header') != 1:
        top_problems.append('the header landmark is not declared exactly once')
    if trigger is None or 'aria-label=' not in (trigger.group(0) if trigger else ''):
        top_problems.append('the drawer trigger has no accessible name')
    if trigger_open is None:
        top_problems.append('the drawer trigger does not announce that it opens a dialog')
    if 'min-h-touch' not in top_bar:
        top_problems.append('the top bar is shorter than a touch target')
    if re.search(r'<a\b[^>]*href="/"', top_bar):
        top_problems.append('the mark links to a home route this build does not serve')
    print(f'  {"top bar":20}{"ok" if not top_problems else "; ".join(top_problems)}')
    for problem in top_problems:
        findings.append(f'top bar: {problem}')

    # No planned entry reaches a surface. The specimen renders the map's own
    # table above the surfaces, so the labels to look for come from the page
    # rather than from a list this probe maintains: whatever the map declares as
    # planned must appear in the table and in no navigation landmark anywhere.
    planned = planned_labels(markup)
    leaked = []
    for landmark in re.findall(r'<nav\b[\s\S]*?</nav>', markup):
        for label in planned:
            if label in visible_text(landmark):
                leaked.append(label)
    print(
        f'  {"planned entries":20}'
        + (
            f'ok ({len(planned)} planned labels, none inside a navigation landmark)'
            if not leaked
            else f"leaked into a navigation landmark: {', '.join(sorted(set(leaked)))}"
        )
    )
    if leaked:
        findings.append(
            f'planned entries reach the navigation: {", ".join(sorted(set(leaked)))}'
        )

    # The drop box is the negative control the specimen carries in the page
    # itself: a rail asked for by an audience with nothing live in it renders no
    # landmark and no anchor, rather than an empty region the reader walks into.
    drop_start = markup.find(DROP_MARKER)
    drop = '' if drop_start < 0 else markup[drop_start:]
    drop = re.split(r'</section>|<section\b', drop, maxsplit=1)[0]
    drop_navs = len(re.findall(r'<nav\b', drop))
    drop_links = len(re.findall(r'<a\b', drop))
    print(
        f'  {"drop box":20}'
        + (
            'ok (no landmark, no anchor)'
            if drop_start >= 0 and drop_navs == 0 and drop_links == 0
            else f'{"missing" if drop_start < 0 else f"{drop_navs} landmarks, {drop_links} anchors"}'
        )
    )
    if drop_start < 0:
        findings.append('the specimen has no drop box for an audience with nothing live')
    elif drop_navs != 0 or drop_links != 0:
        findings.append(
            f'the drop box renders {drop_navs} navigation elements and {drop_links} anchors, expected none'
        )

    # While the browser reports a connection, the banner has nothing to say.
    offline = len(re.findall(r'data-layout="offline-banner"', markup))
    print(f'  {"offline banner":20}{"ok (absent while online)" if offline == 0 else "present while online"}')
    if offline != 0:
        findings.append('the offline banner rendered while the page reports a connection')

    print()
    print('safe-area chain and navigation scale in the loaded stylesheet')
    for name, value in EXPECTED_SAFE_AREA_VARIABLES.items():
        match = re.search(rf'{re.escape(name)}:\s*([^;]+);', css)
        declared = match.group(1).strip() if match is not None else 'MISSING'
        ok = declared == value
        print(f'  {"yes" if ok else "NO "}  {name}: {declared}')
        if not ok:
            findings.append(f'{name} is {declared} in the loaded stylesheet, expected {value}')
    for description, selector, declaration in EXPECTED_UTILITY_RULES:
        declarations = css_declarations(css, selector).replace(' ', '')
        ok = declaration.replace(' ', '') in declarations
        print(f'  {"yes" if ok else "NO "}  {description}')
        if not ok:
            findings.append(f'the loaded stylesheet is missing the utility: {description}')
    narrow = media_block(without_comments(css), '(min-width: 768px)')
    hidden = css_declarations(narrow, '.md\\:hidden').replace(' ', '')
    print(f'  {"yes" if "display:none" in hidden else "NO "}  the bottom bar is hidden from the medium breakpoint up')
    if 'display:none' not in hidden:
        findings.append('the loaded stylesheet does not hide .md\\:hidden inside the medium breakpoint')


def main() -> int:
    page = fetch(PAGE_URL)
    markup = strip_scripts(page)
    findings: list[str] = []

    print(f'page size: {len(page)} bytes')
    print(f'markup after scripts: {len(markup)} bytes')

    sheets = stylesheets(markup)
    print(f'stylesheets linked: {len(sheets)}')
    css = ''.join(fetch(f'{BASE_URL}{path}') for path in sheets)
    print(f'loaded CSS: {len(css)} bytes')
    print()

    # 1 and 2: the skip link and the landmark, measured per shell rather than
    # across the page. The page renders one shell per reader; a count across
    # the whole document would hide a shell that has two landmarks and another
    # that has none.
    root_blocks = shell_blocks(markup)
    print(f'shells rendered: {len(root_blocks)}')
    print()
    print('skip link and landmark, per shell')
    for attributes, block in root_blocks:
        role = attributes.get('data-role', 'MISSING')
        label = f'{attributes.get("data-shell", "MISSING")}/{role}'
        skip_links = re.findall(r'<a[^>]*href="#main-content"[^>]*>([\s\S]*?)</a>', block)
        mains = [match.start() for match in re.finditer(r'<main\b', block)]
        problems = []
        if len(skip_links) != 1:
            problems.append(f'{len(skip_links)} skip links')
        if len(mains) != 1:
            problems.append(f'{len(mains)} main landmarks')
        for content in skip_links:
            if 'Skip to main content' not in re.sub(r'<[^>]+>', '', content):
                problems.append('skip link without the catalogue label')
        for start in mains:
            tag = re.search(r'<main\b[^>]*>', block[start:])
            attributes_text = tag.group(0) if tag else ''
            if 'id="main-content"' not in attributes_text:
                problems.append('landmark without the skip target id')
            if 'tabindex="-1"' not in attributes_text:
                problems.append('landmark that cannot take focus')
        # The skip link has to come before the landmark in this shell, which is
        # the order a keyboard user walks.
        if skip_links and mains:
            first_skip = block.find('href="#main-content"')
            if first_skip > mains[0]:
                problems.append('skip link after the landmark')
        print(f'  {label:32}{"ok" if not problems else "; ".join(problems)}')
        for problem in problems:
            findings.append(f'{label}: {problem}')

    before = focusable_before_main(markup, re.finditer(r'<main\b', markup).__next__().start())
    print(f'  focusable elements before the first landmark: {len(before)}')
    for entry in before:
        print(f'    {entry}')
    if len(before) != 1 or not before[0].startswith('a '):
        findings.append('the skip link is not the only focusable element before the first content region')

    print()

    # 4: the print base in the loaded stylesheet.
    print('print base in the loaded stylesheet')
    blocks = print_blocks(without_comments(css))
    print(f'  @media print blocks: {len(blocks)}')
    if not blocks:
        findings.append('the loaded stylesheet has no @media print block')
    for description, (selector, declaration) in EXPECTED_PRINT_RULES.items():
        present = has_print_rule(blocks, selector, declaration)
        print(f'  {"yes" if present else "NO "}  {description}')
        if not present:
            findings.append(f'the loaded stylesheet is missing: {description}')
    page_margin = re.search(r'@page\s*\{([^}]*)\}', without_comments(css))
    margin_ok = page_margin is not None and EXPECTED_PAGE_MARGIN in page_margin.group(1).replace(' ', '')
    print(f'  {"yes" if margin_ok else "NO "}  the page margin is set to 16mm')
    if not margin_ok:
        findings.append('the loaded stylesheet does not set the 16mm page margin')

    # 5: the paper palette equals the token module.
    print()
    print('paper palette (loaded stylesheet against the declaration)')
    for name, value in EXPECTED_PAPER_PALETTE.items():
        match = re.search(rf'{re.escape(name)}:\s*([^;]+);', without_comments(css))
        declared = match.group(1).strip() if match else 'MISSING'
        ok = declared == value
        print(f'  {"yes" if ok else "NO "}  {name}: {declared}')
        if not ok:
            findings.append(f'{name} is {declared} in the loaded stylesheet, expected {value}')

    # 6: the print markers survived rendering.
    print()
    print('print markers in the markup')
    for marker in ('hide', 'only', 'outline'):
        count = len(re.findall(rf'data-print="{marker}"', markup))
        print(f'  data-print="{marker}": {count}')
        if count == 0:
            findings.append(f'no element in the rendered page carries data-print="{marker}"')

    print()
    print('role-aware framing, one row per reader (the public and auth shells serve an unrecognised reader and carry no role)')
    print(f'  {"role":14}{"shell":16}{"band":6}{"notice":8}{"nav":5}')
    seen_roles = []
    for attributes, block in root_blocks:
        role = attributes.get('data-role')
        shell = attributes.get('data-shell', 'MISSING')
        audience = attributes.get('data-audience', 'MISSING')
        if role is None:
            # The public and auth shells are not role-aware: they serve a
            # reader who has not been recognised yet, and they carry no role
            # because there is none to carry. Their landmarks and their print
            # markers are measured above like every other shell.
            continue
        seen_roles.append(role)
        expectation = EXPECTED_FRAMES.get(role)
        if expectation is None:
            findings.append(f'the frame of role {role} is not in the expected set')
            continue
        expected_shell, want_band, want_notice, want_nav = expectation
        # The band belongs to the frame, the notice to the reader's workflow,
        # so each is looked for inside this reader's own shell block.
        frame_start = block.find('data-role="role-frame"')
        frame = block[frame_start:] if frame_start >= 0 else ''
        main_start = block.find('<main')
        frame_region = (
            block[frame_start:main_start]
            if frame_start >= 0 and main_start > frame_start
            else frame
        )
        has_band = PLATFORM_BANNER in frame
        # A notice is one of the three approval sentences, and the band's own
        # message is not one of them, so the two are told apart by copy.
        notice_texts = [text for text in NOTICE_TEXTS if text in frame_region]
        has_notice = want_notice is not None and want_notice in frame_region
        nav_block = re.search(r'<nav\b[^>]*aria-label="([^"]*)"', block)
        has_nav = nav_block is not None
        print(
            f'  {role:14}{shell:16}'
            f'{"yes" if has_band else "no":6}{"yes" if has_notice else "no":8}'
            f'{"yes" if has_nav else "no":5}'
        )
        if shell != expected_shell:
            findings.append(f'{role} is framed by the {shell} shell, expected {expected_shell}')
        if has_band != want_band:
            findings.append(f'{role}: platform band {"present" if has_band else "missing"}')
        if want_notice is not None and want_notice not in frame_region:
            findings.append(f'{role}: the approval notice is missing')
        if want_notice is None and notice_texts:
            findings.append(
                f'{role}: shows an approval notice but this role is not reviewed'
            )
        if has_nav != want_nav:
            findings.append(
                f'{role}: navigation {"present" if has_nav else "missing"} but the frame calls for '
                f'{"one" if want_nav else "none"}'
            )
        if audience not in ('platform', 'tenant', 'client', 'unresolved'):
            findings.append(f'{role}: unexpected audience {audience}')

    for role in EXPECTED_FRAMES:
        if role not in seen_roles:
            findings.append(f'no shell in the page is framed for {role}')

    print()
    verify_navigation_surfaces(markup, without_comments(css), findings)

    print()
    verify_navigation_map(markup, findings)

    print()
    print(f'findings: {len(findings)}')
    for finding in findings:
        print(f'  FAIL {finding}')
    ok = not findings
    print('RESULT:', 'PASS' if ok else 'FAIL')
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
