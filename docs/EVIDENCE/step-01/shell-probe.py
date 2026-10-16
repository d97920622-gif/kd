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

It deliberately does not open a print preview or a headless browser: the build
has no browser dependency, and a probe that needs one would not run in this
repository. What it can prove is that the rules and the markup that the rules
select on both arrive intact, which is the part that breaks when a stylesheet
import is moved or an attribute is dropped.
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
    print(f'findings: {len(findings)}')
    for finding in findings:
        print(f'  FAIL {finding}')
    ok = not findings
    print('RESULT:', 'PASS' if ok else 'FAIL')
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
