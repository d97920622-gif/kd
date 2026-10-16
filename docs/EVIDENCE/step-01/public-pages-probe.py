#!/usr/bin/env python3
# path: docs/EVIDENCE/step-01/public-pages-probe.py
"""Sub-steps 1.28 and 1.29 evidence: the public site, read off a running server.

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
# (path, namespace, page marker, title key, description key).
#
# The keys are named rather than derived, because two pages of this site do not
# follow the `<namespace>.meta_title` shape: the two legal routes share the
# legal namespace and name their keys after themselves, and the keyboard
# reference keeps its copy in the commands namespace, where it was written in
# sub-step 1.23.
PAGES = [
    ('/', 'home', 'home', 'meta_title', 'meta_description'),
    ('/features', 'features', 'features', 'meta_title', 'meta_description'),
    ('/pricing', 'pricing', 'pricing', 'meta_title', 'meta_description'),
    ('/industries', 'industries', 'industries', 'meta_title', 'meta_description'),
    ('/calculators', 'calculators', 'calculators', 'meta_title', 'meta_description'),
    ('/invoice-generator', 'generator', 'generator', 'meta_title', 'meta_description'),
    ('/about', 'about', 'about', 'meta_title', 'meta_description'),
    ('/contact', 'contact', 'contact', 'meta_title', 'meta_description'),
    ('/blog', 'blog', 'blog', 'meta_title', 'meta_description'),
    ('/shortcuts', 'commands', 'shortcuts', 'label_shortcuts_title', 'label_shortcuts_description'),
    ('/terms', 'legal', 'terms', 'terms_meta_title', 'terms_meta_description'),
    ('/privacy', 'legal', 'privacy', 'privacy_meta_title', 'privacy_meta_description'),
    ('/offline', 'offline', 'offline', 'meta_title', 'meta_description'),
]

# The plan slugs and the figures the pricing page must publish, read from the
# catalogue at run time. The slugs are FEATURE_LIST item 698; the figures are
# whatever the catalogue says, because a probe that hard-codes a price is a
# probe that fails when the price changes for a good reason.
PUBLISHED_PLANS = ['free', 'starter', 'pro']
AGREED_PLAN = 'enterprise'

# The public destinations the frame must carry on every page. Sub-step 1.28
# shipped four of them; sub-step 1.29 flipped the other seven plus the offline
# page, so the list is now the whole public site.
FOOTER_HREFS = [
    '/features',
    '/pricing',
    '/industries',
    '/calculators',
    '/invoice-generator',
    '/about',
    '/contact',
    '/blog',
    '/shortcuts',
    '/terms',
    '/privacy',
    '/offline',
]
FOOTER_LINKS = [f'href="{href}"' for href in FOOTER_HREFS]

# The five destinations the header offers, from the navigation map's primary
# flag: the bar is a subset of the footer's list, not a second list, and the
# order is the map's order.
HEADER_HREFS = ['/features', '/pricing', '/industries', '/calculators', '/contact']
HEADER_LINKS = [f'href="{href}"' for href in HEADER_HREFS]

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
    'works offline',
    'available offline',
]


def fetch(path, port):
    url = f'http://127.0.0.1:{port}{path}'
    try:
        with urllib.request.urlopen(url, timeout=30) as response:
            return response.status, response.read().decode('utf-8', 'replace')
    except urllib.error.HTTPError as error:
        # A 404 is a page this site renders, so the body is the finding rather
        # than an error: reading it here is what lets the probe check the 404
        # the reader actually receives.
        return error.code, error.read().decode('utf-8', 'replace')
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


def element_block(html, marker, closing):
    """The markup of one surface, from its marker to its closing tag."""
    start = html.find(marker)
    if start < 0:
        return ''
    end = html.find(closing, start)
    return html[start : end if end > start else len(html)]


def anchor_href(anchor):
    """The destination of one anchor tag, or an empty string when it has none."""
    match = re.search(r'href="([^"]*)"', anchor)
    return match.group(1) if match else ''


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
    for path, namespace, marker_name, title_key, description_key in PAGES:
        status, html = fetch(path, port)
        title = catalogue_value(namespace, title_key)
        description = catalogue_value(namespace, description_key)
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

        marker = f'data-public-page="{marker_name}"'
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
        header = html.count('data-layout="site-header"')
        home_link = 'href="/"' in html
        missing_links = [link for link in FOOTER_LINKS if link not in html]
        missing_header = [link for link in HEADER_LINKS if link not in html]
        print(
            f'  frame: header {header}, footer {footer}   brand links home: '
            f'{"yes" if home_link else "NO"}   links missing: {len(missing_links)} '
            f'(header: {len(missing_header)})'
        )
        if footer != 1:
            findings.append(f'{path}: the footer appears {footer} times, not once')
        if header != 1:
            findings.append(f'{path}: the header appears {header} times, not once')
        if not home_link:
            findings.append(f'{path}: the brand does not link home')
        for link in missing_links:
            findings.append(f'{path}: the footer omitted {link}')
        for link in missing_header:
            findings.append(f'{path}: the header omitted {link}')

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

    # ---------------------------------------------- the tools and the shells
    print('sub-step 1.29: the pages that are a job rather than a description, read from the responses:')

    # ---------------------------------------------------------------- the frame
    # Both surfaces are read from one response, because the thing being checked
    # is that there are two windows onto one map: the header offers the primary
    # destinations and the footer offers every page, and neither of them may
    # carry a link the map does not publish.
    header_label = catalogue_value('shells', 'label_nav_site')
    footer_heading = catalogue_value('shells', 'label_site_pages_heading')
    status, home_html = fetch('/', port)
    if status == 200:
        header_block = element_block(home_html, 'data-layout="site-header"', '</header>')
        footer_block = element_block(home_html, 'data-layout="site-footer"', '</footer>')
        header_anchors = re.findall(r'<a\b[^>]*>', header_block)
        header_hrefs = [anchor_href(anchor) for anchor in header_anchors]
        nav_label = f'aria-label="{header_label}"'
        footer_hrefs = [anchor_href(anchor) for anchor in re.findall(r'<a\b[^>]*>', footer_block)]
        print(
            f'  header landmark name {header_label!r}: '
            f'{"yes" if header_label is not None and nav_label in header_block else "NO"}'
        )
        print(f'  header destinations: {header_hrefs}')
        print(f'  footer destinations: {len(footer_hrefs)}   footer heading rendered: '
              f'{"yes" if footer_heading is not None and footer_heading in footer_block else "NO"}')
        if header_label is None or nav_label not in header_block:
            findings.append(
                'the header navigation does not carry the catalogue landmark name (shells.label_nav_site)'
            )
        if header_hrefs[:1] != ['/']:
            findings.append(f'the brand in the header points at {header_hrefs[:1]}, not at home')
        if header_hrefs[1:] != HEADER_HREFS:
            findings.append(
                f'the header renders {header_hrefs[1:]}, not the primary destinations the map marks ({HEADER_HREFS})'
            )
        if footer_heading is None or footer_heading not in footer_block:
            findings.append('the footer does not print the catalogue heading for its link group')
        missing_footer = [href for href in FOOTER_HREFS if href not in footer_hrefs]
        if missing_footer:
            findings.append(f'the footer omits {missing_footer}')

    print()
    print('the header marks the page a reader is on, one page at a time:')
    for path in HEADER_HREFS:
        status, page_html = fetch(path, port)
        if status != 200:
            findings.append(f'{path}: status {status}, so the current-page mark could not be read')
            continue
        block = element_block(page_html, 'data-layout="site-header"', '</header>')
        marked = [
            anchor_href(anchor)
            for anchor in re.findall(r'<a\b[^>]*>', block)
            if 'aria-current="page"' in anchor
        ]
        print(f'  {path}: aria-current="page" on {marked}')
        if marked != [path]:
            findings.append(
                f'{path}: the header marks {marked} as the current page rather than the page being read'
            )

    status, industries_html = fetch('/industries', port)
    if status == 200:
        slugs = ['freelance', 'agency', 'retail', 'trades', 'services', 'online']
        cards = len(re.findall(r'data-industry="', industries_html))
        titles = [catalogue_value('industries', f'label_{slug}_title') for slug in slugs]
        rendered = [title for title in titles if title is not None and title in industries_html]
        note = catalogue_value('industries', 'label_note_build')
        print(
            f'  industries: {cards} cards, {len(rendered)} of {len(slugs)} titles rendered, '
            f'build note: {"yes" if note is not None and note in industries_html else "NO"}'
        )
        if cards != 6:
            findings.append(f'the industries page renders {cards} cards, not six')
        if len(rendered) != len(slugs):
            findings.append('the industries page does not render every industry title')
        if note is None or note not in industries_html:
            findings.append('the industries page omits the note that says what the build is')

    status, calculators_html = fetch('/calculators', port)
    if status == 200:
        tools = ['markup', 'discount', 'tax']
        forms = {tool: calculators_html.count(f'data-tool="{tool}"') for tool in tools}
        cards = len(re.findall(r'data-tool-card="', calculators_html))
        fields = calculators_html.count('<input')
        decimal_mode = calculators_html.count('inputMode="decimal"') + calculators_html.count(
            'inputmode="decimal"'
        )
        submits = calculators_html.count('type="submit"')
        statuses = calculators_html.count('data-tool-status="idle"')
        rules = [
            catalogue_value('calculators', f'label_rule_{name}')
            for name in ['currency', 'rounding', 'decimal', 'nothing_stored']
        ]
        rendered_rules = [rule for rule in rules if rule is not None and rule in calculators_html]
        # The figures are rendered after a reader submits, which is a browser
        # event: `docs/EVIDENCE/step-01/free-tools-probe.mjs` executes the same
        # arithmetic the page calls, and this line records that the page ships
        # no figure it did not compute.
        stale_figures = calculators_html.count('data-tool-figure=')
        print(
            f'  calculators: {cards} cards, forms {forms}, fields {fields} '
            f'({decimal_mode} decimal keyboards), submits {submits}'
        )
        print(
            f'  calculators: rules rendered {len(rendered_rules)} of 4, '
            f'figures in the initial response: {stale_figures}'
        )
        if cards != 3 or fields != 6 or decimal_mode != 6 or submits != 3 or statuses != 3:
            findings.append(
                'the calculators page does not render three tools of two fields and one submit each'
            )
        if any(count != 1 for count in forms.values()):
            findings.append('a calculator tool is rendered more than once, or not at all')
        if len(rendered_rules) != 4:
            findings.append('the calculators page does not state all four rules it follows')
        if stale_figures != 0:
            findings.append('the calculators page ships a figure before the reader submits anything')

    status, generator_html = fetch('/invoice-generator', port)
    if status == 200:
        controls = {tag: generator_html.count(f'<{tag}') for tag in ['input', 'form', 'textarea', 'select']}
        note = catalogue_value('generator', 'label_note_status')
        print(f'  invoice generator: form controls {controls}')
        if any(controls.values()):
            findings.append('the generator shell renders a form control it cannot store')
        if note is None or note not in generator_html:
            findings.append('the generator page omits the sentence that says the tool is not here yet')

    status, blog_html = fetch('/blog', port)
    if status == 200:
        empty = blog_html.count('data-blog-empty="true"')
        sentence = catalogue_value('blog', 'label_empty_posts')
        print(
            f'  blog: empty marker {empty}, sentence rendered: '
            f'{"yes" if sentence is not None and sentence in blog_html else "NO"}'
        )
        if empty != 1:
            findings.append(f'the blog shell renders {empty} empty markers, not one')
        if sentence is None or sentence not in blog_html:
            findings.append('the blog shell does not say that no post is published yet')
        posts = blog_html.count('data-post="')
        if posts != 0:
            findings.append('the blog shell renders a post it does not have')

    for path, key in [
        ('/contact', 'label_note_address'),
        ('/terms', 'terms_label_note_publish'),
        ('/privacy', 'privacy_label_note_scope'),
        ('/offline', 'label_note_scope'),
    ]:
        status, page_html = fetch(path, port)
        namespace = 'legal' if path in ('/terms', '/privacy') else ('contact' if path == '/contact' else 'offline')
        note = catalogue_value(namespace, key)
        rendered_note = note is not None and note in page_html
        print(f'  {path}: the note that names what the deployment supplies: {"yes" if rendered_note else "NO"}')
        if not rendered_note:
            findings.append(f'{path} does not render {namespace}.{key}')

    # The banner is a client surface: a server render has no connection to
    # report on, so it renders nothing here. That absence is the expected state
    # and it is asserted, because a banner in the server HTML would be a banner
    # claiming the connection is down before anything asked the browser.
    status, offline_html = fetch('/offline', port)
    if status == 200:
        banners = offline_html.count('data-layout="offline-banner"')
        print(f'  offline: banner in the server response: {banners} (expected: none)')
        if banners != 0:
            findings.append('the offline banner rendered on the server, where there is no connection to report')

    # ------------------------------------------------------- an address that does not exist
    missing_path = '/no-page-is-served-here'
    status, missing_html = fetch(missing_path, port)
    search_label = catalogue_value('nav', 'label_site_search_label')
    levels = heading_levels(missing_html)
    print()
    print(f'{missing_path} (the 404 a reader reaches from an old link)')
    marker_count = missing_html.count('data-public-page="not-found"')
    search_count = missing_html.count('data-site-search="true"')
    header_count = missing_html.count('data-layout="site-header"')
    print(
        f'  status: {status}   marker: {marker_count}   h1: {levels.count(1)}   '
        f'search: {search_count}   header: {header_count}'
    )
    if status != 404:
        findings.append(f'{missing_path}: answered {status}, not 404')
    if marker_count != 1:
        findings.append('the 404 page does not carry its marker exactly once')
    if levels.count(1) != 1:
        findings.append(f'the 404 page renders {levels.count(1)} h1 headings, not one')
    if search_count != 1:
        findings.append('the 404 page does not render the site search (FEATURE_LIST item 134)')
    if search_label is None or search_label not in missing_html:
        findings.append('the 404 page does not label its search field')
    if header_count != 1:
        findings.append('the 404 page does not render the public header, so it is not branded')
    if 'href="/"' not in missing_html:
        findings.append('the 404 page offers no link home')
    missing_claims = [word for word in CLAIM_WORDS if word in missing_html.lower()]
    for word in missing_claims:
        findings.append(f'the rendered 404 page contains {word!r}')
    print()


    for finding in findings:
        print(f'  FAIL {finding}')
    ok = not findings
    print('RESULT:', 'PASS' if ok else 'FAIL')
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
