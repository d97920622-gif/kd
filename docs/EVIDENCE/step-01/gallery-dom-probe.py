# path: docs/EVIDENCE/step-01/gallery-dom-probe.py
"""Segment gate evidence for 1B, part two: the rendered page.

This file is evidence, not part of the product and not a test (Rule 4: the
project ships no test files). Run it by hand while the development server is
up, and record the output in docs/EVIDENCE/step-01/gate-1B.md.

    npx next dev -H 0.0.0.0 -p 3000
    python3 docs/EVIDENCE/step-01/gallery-dom-probe.py

It answers four questions about the component gallery:

1. Does the page render, and does it render all five theme scopes?
2. Does every scope contain the complete component inventory, and the same
   one as every other scope? A component that hides itself in one theme
   (missing token, hardcoded colour that only matches light) is the defect the
   gate exists to catch, so an inventory that differs between scopes fails.
3. Does every interactive control have an accessible name, and is every form
   control associated with a label? This is checked against the rendered DOM
   rather than against the source, because a name can be lost at composition
   time just as easily as it can be omitted while writing a component.
4. Does the stylesheet the browser actually loads contain the five pinned
   theme scope rules? Those rules live in @layer base, which Tailwind tree
   shakes by class name, so "the page has the scope class" is not the same
   question as "the scope applies".
"""
import html
import re
import sys
import urllib.request
from html.parser import HTMLParser

BASE_URL = 'http://127.0.0.1:3000'
PAGE_URL = f'{BASE_URL}/gallery'
SCOPES = [
    'theme-light',
    'theme-dark',
    'theme-hc-light',
    'theme-hc-dark',
    'theme-reduced-motion',
]

# marker -> the primitive or behaviour it proves. The same set must appear in
# every scope block.
MARKERS = {
    'role="checkbox"': 'checkbox, including the disabled and validated rows',
    'role="switch"': 'switch',
    'role="radio"': 'radio group',
    'role="combobox"': 'select',
    '<textarea': 'textarea',
    'type="email"': 'email input',
    '<label': 'labels wired to controls',
    'role="tablist"': 'tabs list',
    'role="tab"': 'tabs triggers',
    '<table': 'table',
    '<caption': 'table caption',
    'animate-pulse': 'skeleton',
    'rounded-full': 'badge and circular skeleton',
    '<fieldset': 'form wrapper locks its controls while submitting',
    'type="submit"': 'submit button',
    'aria-invalid="true"': 'invalid control state',
    'role="alert"': 'error messages and the error summary',
    'aria-live="polite"': 'live regions for errors and the pending status',
    'aria-busy': 'busy state on the submit button',
    'sr-only': 'the visually hidden status region',
    'Open a dialog': 'dialog trigger',
    'Open a side panel': 'sheet trigger',
    'Open a popover': 'popover trigger',
    'Open a menu': 'menu trigger',
    'Amounts are stored in USD.': 'tooltip trigger',
    'role="region"': 'toast viewport live region',
}

# scope class -> a declaration the stylesheet must carry for it
SCOPE_DECLARATIONS = {
    'theme-light': '--background: 0 0% 100%',
    'theme-dark': '--background: 222.2 84% 4.9%',
    'theme-hc-light': '--border: 0 0% 30%',
    'theme-hc-dark': '--foreground: 0 0% 100%',
    'theme-reduced-motion': '--duration-fast: 0ms',
}

CONTROL_TAGS = {'input', 'textarea', 'select'}

# Roles whose element must carry an accessible name. A control with one of
# these roles and no name is announced as a bare "button" or "combobox", which
# is unusable with a screen reader.
NAMED_ROLES = {'checkbox', 'combobox', 'radio', 'switch', 'textbox'}


def fetch(url: str) -> str:
    with urllib.request.urlopen(url, timeout=60) as response:
        if response.status != 200:
            raise SystemExit(f'GET {url} returned {response.status}')
        return response.read().decode('utf-8')


class AccessibleNameAudit(HTMLParser):
    """Collects the facts needed to judge accessible names in the DOM."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.buttons: list[dict] = []
        self.controls: list[dict] = []
        self.roles: list[dict] = []
        self.labels_for: set[str] = set()
        self.ids: set[str] = set()
        self.button_depth: int | None = None
        self.button_text: list[str] = []
        self.role_depth: int | None = None
        self.role_text: list[str] = []
        self.stack: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.stack.append(tag)
        attributes = {name: (value or '') for name, value in attrs}
        if 'id' in attributes:
            self.ids.add(attributes['id'])
        if tag == 'label' and 'for' in attributes:
            self.labels_for.add(attributes['for'])
        if tag == 'button':
            self.button_depth = len(self.stack)
            self.button_text = []
            self.buttons.append({'attrs': attributes, 'has_svg': False})
        if tag in CONTROL_TAGS and attributes.get('type') != 'hidden':
            self.controls.append({'tag': tag, 'attrs': attributes})
        if attributes.get('role', '') in NAMED_ROLES:
            self.roles.append({'tag': tag, 'attrs': attributes, 'text': ''})
            self.role_depth = len(self.stack)
            self.role_text = []
        if tag == 'svg' and self.button_depth is not None:
            self.buttons[-1]['has_svg'] = True

    def handle_endtag(self, tag: str) -> None:
        if tag == 'button' and self.button_depth is not None:
            text = ' '.join(self.button_text).strip()
            self.buttons[-1]['text'] = html.unescape(text)
            self.button_depth = None
        if tag in {'button', 'input', 'select', 'textarea', 'a', 'div', 'span'} and self.roles:
            if self.role_depth == len(self.stack) and 'text' in self.roles[-1]:
                self.roles[-1]['text'] = html.unescape(' '.join(self.role_text).strip())
                self.role_depth = None
        if self.stack:
            self.stack.pop()

    def handle_data(self, data: str) -> None:
        if self.button_depth is not None:
            self.button_text.append(data)
        if self.role_depth is not None:
            self.role_text.append(data)


def accessible_issues(audit: AccessibleNameAudit) -> list[str]:
    """Names in the rendered DOM, judged the way a screen reader sees them.

    An element is named when it has aria-label, or aria-labelledby pointing at
    an element that exists, or a label whose for attribute matches its id, or
    readable text of its own. A label pointing at an id that no element carries
    is reported on its own, because that is the shape a composite control takes
    when it silently drops the attributes it was handed: the label exists, the
    association does not, and the control ends up unnamed.
    """
    issues = []
    for target in sorted(audit.labels_for):
        if target not in audit.ids:
            issues.append(f'label for="{target}" points at no element: the control is unnamed')

    def named(attrs: dict, text: str) -> bool:
        if attrs.get('aria-label', '').strip():
            return True
        if attrs.get('aria-labelledby', '').strip() in audit.ids:
            return True
        element_id = attrs.get('id', '')
        if element_id and element_id in audit.labels_for:
            return True
        return len(re.findall(r'[A-Za-z]', text)) >= 2

    def hidden(attrs: dict) -> bool:
        # aria-hidden removes the element from the accessibility tree, and
        # tabindex -1 removes it from the tab order; Radix keeps native inputs
        # like that so a value reaches form submission, and those inputs are
        # deliberately anonymous.
        return attrs.get('aria-hidden') == 'true' or attrs.get('tabindex') == '-1'

    for element in audit.roles:
        if hidden(element['attrs']):
            continue
        if named(element['attrs'], element.get('text', '')):
            continue
        issues.append(
            f'{element["tag"]} role={element["attrs"].get("role")} '
            f'id={element["attrs"].get("id", "")!r} has no accessible name'
        )

    for element in audit.controls:
        attrs = element['attrs']
        if hidden(attrs) or attrs.get('role', '') in NAMED_ROLES:
            continue
        if named(attrs, ''):
            continue
        issues.append(f'{element["tag"]} id={attrs.get("id", "")!r} has no label and no aria-label')

    for index, button in enumerate(audit.buttons):
        attrs = button['attrs']
        if hidden(attrs) or attrs.get('role', '') in NAMED_ROLES:
            continue
        if named(attrs, button.get('text', '')):
            continue
        issues.append(
            f'button {index + 1} has no accessible name '
            f'(text={button.get("text", "")!r}, attrs={sorted(attrs)})'
        )
    return issues


def scope_blocks(page: str) -> dict[str, str]:
    positions = []
    for scope in SCOPES:
        index = page.find(f'data-gallery-scope="{scope}"')
        if index < 0:
            raise SystemExit(f'scope {scope} is missing from the rendered page')
        positions.append((scope, index))
    blocks = {}
    for order, (scope, start) in enumerate(positions):
        end = positions[order + 1][1] if order + 1 < len(positions) else len(page)
        blocks[scope] = page[start:end]
    return blocks


def stylesheet_for(page: str) -> str:
    hrefs = re.findall(r'href="(/_next/static/css/[^"]+\.css)[^"]*"', page)
    if not hrefs:
        raise SystemExit('the rendered page links no stylesheet')
    return fetch(f'{BASE_URL}{hrefs[0]}')


def main() -> int:
    page = fetch(PAGE_URL)
    stylesheet = stylesheet_for(page)
    blocks = scope_blocks(page)

    print(f'page size: {len(page)} bytes')
    print(f'stylesheet size: {len(stylesheet)} bytes')
    print(f'scopes found: {len(blocks)}')

    findings: list[str] = []

    print()
    header = f'{"marker":34}' + ''.join(f'{scope.replace("theme-", ""):>16}' for scope in SCOPES)
    print(header)
    inventories = {}
    for scope in SCOPES:
        inventories[scope] = {marker: blocks[scope].count(marker) for marker in MARKERS}
    for marker, description in MARKERS.items():
        row = f'{description[:33]:34}'
        for scope in SCOPES:
            row += f'{inventories[scope][marker]:>16}'
        print(row)
    for scope in SCOPES:
        for marker, count in inventories[scope].items():
            if count == 0:
                findings.append(f'{scope}: {MARKERS[marker]} is missing')
    reference = SCOPES[0]
    for scope in SCOPES[1:]:
        for marker in MARKERS:
            if inventories[scope][marker] != inventories[reference][marker]:
                findings.append(
                    f'{scope}: {MARKERS[marker]} count {inventories[scope][marker]} differs '
                    f'from {reference} ({inventories[reference][marker]})'
                )

    print()
    print('stylesheet scope rules the browser loads:')
    for scope, declaration in SCOPE_DECLARATIONS.items():
        present = f'.{scope}' in stylesheet and declaration in stylesheet
        print(f'  {scope:24} {"yes" if present else "NO"}   {declaration}')
        if not present:
            findings.append(f'the loaded stylesheet has no effective rule for .{scope}')

    print()
    audit = AccessibleNameAudit()
    audit.feed(page)
    issues = accessible_issues(audit)
    print(f'buttons in the page: {len(audit.buttons)}')
    print(f'form controls in the page: {len(audit.controls)}')
    print(f'controls with a semantic role: {len(audit.roles)}')
    print(f'labels with a for attribute: {len(audit.labels_for)}')
    print(f'accessible name issues: {len(issues)}')
    for issue in issues[:20]:
        print(f'  FAIL {issue}')
    findings.extend(issues)

    print()
    print(f'markers checked per scope: {len(MARKERS)}')
    print(f'findings: {len(findings)}')
    for finding in findings:
        print(f'  FAIL {finding}')
    ok = not findings
    print('RESULT:', 'PASS' if ok else 'FAIL')
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
