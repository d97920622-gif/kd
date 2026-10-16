#!/usr/bin/env python3
# path: docs/EVIDENCE/step-01/public-pages-probe.py
"""Sub-step 1.28 evidence: the four public pages, read off a running server.

This file is evidence, not part of the product. It is run by hand when the
sub-step is closed, its output is recorded in docs/handoffs/CHAT_01_PROGRESS.md,
and it is deliberately NOT wired into `npm run verify`: the project ships no test
files (Rule 4), and a probe that only runs with a server up does not belong in
the commit gate. `scripts/checks/public-site.mjs` is the static half that does.

Two things are measured here that the static check cannot see:

  1. **The rendered page.** A heading order, a marker, a price and a footer link
     are facts about the response a reader receives, not about the source that
     produced it. The claim vocabulary is checked a second time here, over the
     HTML, with its own word list: if the two implementations disagree, the
     disagreement is itself the finding.
  2. **What the page costs to open.** The production Lighthouse run is a step
     gate (`docs/PLAN/04`) and needs a browser, which this environment does not
     have. What can be measured without one is measured instead: the scripts the
     homepage ships, their bytes, whether the copy is in the server response
     rather than waiting for JavaScript, and whether any image can shift the
     layout. The numbers are printed rather than merely asserted, so a later
     step can compare them against the same run.

Usage: python3 docs/EVIDENCE/step-01/public-pages-probe.py [port]
"""
import re
import sys
import urllib.error
import urllib.request

BASE_PORT = '3000'
REPO = '/home/user/kd'

# The pages, the namespace that holds their copy, and the marker each carries.
PAGES = [
    ('/', 'home'),
    ('/features', 'features'),
    ('/pricing', 'pricing'),
    ('/about', 'about'),
]

# The plan slugs and the figures the pricing page must publish, read from the
# catalogue at run time. The slugs are FEATURE_LIST item 698; the figures are
# whatever the catalogue says, because a probe that hard-codes a price is a
# probe that fails when the price changes for a good reason.
PUBLISHED_PLANS = ['free', 'starter', 'pro']
AGREED_PLAN = 'enterprise'

# Links the footer must carry on every page: the live public destinations of
# sub-step 1.28 plus the keyboard reference from 1.23.
FOOTER_LINKS = ['href="/features"', 'href="/pricing"', 'href="/about"', 'href="/shortcuts"']

# Words that would turn a sentence into a claim this build cannot evidence.
# The list is the same refusal as scripts/checks/public-site.mjs, written again
# here on purpose.
CLAIM_WORDS = [
    'trusted by',
    'our customers',
    'testimonial',
    'industry-leading',
    'world-class',
    'best-in-class',
    'guarantee',
    'uptime',
    'award-winning',
    'certified',
    'soc 2',
    'iso 27001',
    'hipaa',
    'millions of businesses',
    'available now',
    'launch date',
]


def fetch(path, port):
    url = f'http://127.0.0.1:{port}{path}'
    try:
        with urllib.request.urlopen(url, timeout=30) as response:
            return response.status, response.read().decode('utf-8', 'replace')
    except urllib.error.HTTPError as error:
        return error.code, ''
    except Exception as error:  # noqa: BLE001 - the probe reports, it does not raise
        return 0, f'<unreachable: {error}>'


def catalogue_value(namespace, key):
    """The literal value of one catalogue key, as the page renders it."""
    path = f'{REPO}/lib/i18n/strings/en/{namespace}.ts'
    with open(path, encoding='utf-8') as handle:
        text = handle.read()
    match = re.search(rf"^  {re.escape(key)}:\s*\n?\s*'([^'\n]*)'", text, re.M)
    return None if match is None else match.group(1)


def strip_node_markers(html):
    """Drop the comment markers React writes between two adjacent text nodes.

    `<p>$<!-- -->12</p>` is one sentence to a reader and three nodes in the
    markup, so a probe that matches a price against the response has to remove
    the markers or it will keep reporting a missing figure that renders
    correctly. The removal is applied only where node boundaries matter; the
    claim vocabulary is scanned over the raw response, because a claim inside a
    comment would still be a claim someone wrote.
    """
    return re.sub(r'<!--.*?-->', '', html, flags=re.S)


def heading_levels(html):
    return [int(level) for level in re.findall(r'<h([1-6])[\s>]', html)]


def price_block(html, slug):
    """The markup of one plan card's figure, from its marker to the next tag."""
    start = html.find(f'data-plan-figure="{slug}"')
    if start < 0:
        return ''
    return html[start : start + 240]


def page_scripts(html):
    return re.findall(r'<script[^>]+src="([^"]+)"', html)


def main():
    port = sys.argv[1] if len(sys.argv) > 1 else BASE_PORT
    findings = []

    print(f'base url: http://127.0.0.1:{port}')
    print()

    # ------------------------------------------------------------------ pages
    for path, namespace in PAGES:
        status, html = fetch(path, port)
        title = catalogue_value(namespace, 'meta_title')
        description = catalogue_value(namespace, 'meta_description')
        print(f'{path} ({namespace})')
        print(f'  status: {status}   bytes: {len(html)}')

        if status != 200:
            findings.append(f'{path}: status {status}, not 200')
            print('  RESULT: the page did not answer')
            print()
            continue

        rendered_title = re.search(r'<title>([^<]*)</title>', html)
        rendered_title_text = rendered_title.group(1) if rendered_title else ''
        print(f'  title: {rendered_title_text!r}')
        if title is None or title not in rendered_title_text:
            findings.append(f'{path}: the title is not the catalogue title ({title!r})')

        rendered_description = re.search(r'<meta name="description" content="([^"]*)"', html)
        rendered_description_text = rendered_description.group(1) if rendered_description else ''
        if description is None or rendered_description_text != description:
            findings.append(
                f'{path}: the meta description is not the catalogue description '
                f'({rendered_description_text[:60]!r})'
            )
        print(f'  meta description: {"catalogue" if rendered_description_text == description else "MISMATCH"}')

        marker = f'data-public-page="{namespace}"'
        print(f'  page marker: {html.count(marker)}')
        if html.count(marker) != 1:
            findings.append(f'{path}: {marker} appears {html.count(marker)} times, not once')

        levels = heading_levels(html)
        h1_count = levels.count(1)
        skips = [levels[index] for index in range(1, len(levels)) if levels[index] > levels[index - 1] + 1]
        print(f'  headings: h1 {h1_count}, levels {levels[:8]}{"..." if len(levels) > 8 else ""}')
        if h1_count != 1:
            findings.append(f'{path}: {h1_count} h1 headings, not one')
        if skips:
            findings.append(f'{path}: a heading level is skipped ({skips[0]})')

        footer = html.count('data-layout="site-footer"')
        home_link = 'href="/"' in html
        missing_links = [link for link in FOOTER_LINKS if link not in html]
        print(
            f'  footer: {footer}   brand links home: {"yes" if home_link else "NO"}   '
            f'links missing: {len(missing_links)}'
        )
        if footer != 1:
            findings.append(f'{path}: the footer appears {footer} times, not once')
        if not home_link:
            findings.append(f'{path}: the brand does not link home')
        for link in missing_links:
            findings.append(f'{path}: the footer omitted {link}')

        claims = [word for word in CLAIM_WORDS if word in html.lower()]
        print(f'  claim vocabulary in the response: {len(claims)}')
        for word in claims:
            findings.append(f'{path}: the rendered page contains {word!r}')
        print()

    # --------------------------------------------------------------- homepage
    status, home = fetch('/', port)
    if status == 200:
        print('homepage sections, read from the response:')
        for section in ['hero', 'capabilities', 'how', 'trust', 'pricing-preview', 'cta']:
            marker = f'data-public-section="{section}"'
            count = home.count(marker)
            print(f'  {section:18} {count}')
            if count != 1:
                findings.append(f'the homepage section {section} appears {count} times, not once')
        cards = len(re.findall(r'data-capability="', home))
        steps = len(re.findall(r'data-step="', home))
        trust = len(re.findall(r'data-trust="', home))
        tiers = len(re.findall(r'data-preview-tier="', home))
        print(f'  capability cards: {cards}   steps: {steps}   trust points: {trust}   tiers: {tiers}')
        if (cards, steps, trust, tiers) != (6, 3, 4, 3):
            findings.append(
                f'the homepage rendered {cards} capabilities, {steps} steps, {trust} trust points and '
                f'{tiers} preview tiers; the page declares 6, 3, 4 and 3'
            )
        hero_copy = catalogue_value('home', 'label_hero_title')
        rendered_without_script = hero_copy is not None and hero_copy in home
        print(f'  hero copy in the server response (no JavaScript needed): {"yes" if rendered_without_script else "NO"}')
        if not rendered_without_script:
            findings.append('the homepage hero copy is not in the server response')

        scripts = page_scripts(home)
        total_bytes = 0
        for source in scripts:
            _, body = fetch(source if source.startswith('/') else f'/{source}', port)
            total_bytes += len(body.encode('utf-8'))
        images = re.findall(r'<img\b[^>]*>', home)
        unsized = [tag for tag in images if 'width=' not in tag or 'height=' not in tag]
        print()
        print('what the homepage costs to open (the Lighthouse run is a step gate, this is the part that fits here):')
        print(f'  script requests: {len(scripts)}   script bytes as served: {total_bytes}')
        print(f'  images: {len(images)}   images without a declared size: {len(unsized)}')
        print(f'  html bytes: {len(home.encode("utf-8"))}')
        if unsized:
            findings.append(f'{len(unsized)} image(s) on the homepage declare no width and height, which is a layout shift')
        print()

    # ---------------------------------------------------------------- pricing
    status, pricing_raw = fetch('/pricing', port)
    pricing = strip_node_markers(pricing_raw)
    if status == 200:
        print('pricing page, read from the response:')
        for slug in PUBLISHED_PLANS + [AGREED_PLAN]:
            card = pricing.count(f'data-plan="{slug}"')
            block = price_block(pricing, slug)
            figure = re.search(r'>([^<>]{1,40})</p>', block)
            figure_text = figure.group(1).strip() if figure else ''
            print(f'  {slug:11} cards {card}   figure {figure_text!r}')
            if card != 1:
                findings.append(f'the pricing page renders {card} {slug} cards, not one')
            if slug == AGREED_PLAN:
                if '$' in figure_text:
                    findings.append('the enterprise card publishes a figure it does not have')
                agreed = catalogue_value('pricing', 'label_enterprise_price')
                if agreed is not None and agreed not in figure_text:
                    findings.append('the enterprise card does not state that its price is agreed')
            else:
                monthly = catalogue_value('pricing', f'tier_{slug}_price_monthly')
                if monthly is None or f'${monthly}' not in figure_text:
                    findings.append(f'the {slug} card does not render the catalogue figure ({monthly!r})')
                yearly = catalogue_value('pricing', f'tier_{slug}_price_yearly')
                annual_marker = f'data-plan-annual-figure="{slug}"'
                if annual_marker not in pricing:
                    findings.append(f'the {slug} card publishes no annual figure')
                elif yearly is not None and f'${yearly}' not in pricing[pricing.find(annual_marker) :][:240]:
                    findings.append(f'the {slug} annual figure does not render the catalogue value ({yearly!r})')
        claims = [word for word in CLAIM_WORDS if word in pricing_raw.lower()]
        for word in claims:
            findings.append(f'the rendered pricing page contains {word!r}')
        plans = len(re.findall(r'data-plan="', pricing))
        print(f'  plan cards: {plans}')
        if plans != 4:
            findings.append(f'the pricing page renders {plans} plan cards, not the four plans')
        print()

    print(f'findings: {len(findings)}')
    for finding in findings:
        print(f'  FAIL {finding}')
    ok = not findings
    print('RESULT:', 'PASS' if ok else 'FAIL')
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
