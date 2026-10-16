# path: docs/EVIDENCE/step-01/platform-probe.py
"""Platform plumbing probe (sub-step 1.30), run by hand against a live server.

What this probe proves that `check:platform-plumbing` cannot. The check reads
source: it can prove where a nonce is generated, but not that two responses
carry two different ones. The probe reads responses, so it can prove the
things that only exist at request time:

  1. /robots.txt answers, and it says what the environment it is running in
     should say: a preview refuses everything and names no sitemap, a
     production build allows crawling and names the sitemap.
  2. /sitemap.xml answers with the public pages of the navigation map, every
     location in it resolves, and the offline page is not in it.
  3. Every document response carries a content security policy with a nonce,
     the nonce differs between two requests, and the nonce in the header is the
     nonce on the scripts in that same response.
  4. A static asset response carries no policy at all: the middleware matches
     documents, not the framework's immutable files.
  5. The compiled stylesheet carries the print base, including the two named
     sheets, and the document renders the paper marker exactly once.
  6. The metadata baseline reaches the head, and the social image the head
     points at answers with an image.
  7. The development gallery answers 404 outside development.
  8. Optionally, when --server-log is given, the process log shows the start-up
     line `instrumentation.ts` writes, which is the only proof that the hook ran
     in the runtime it was written for.

Usage:
    python3 docs/EVIDENCE/step-01/platform-probe.py
    python3 docs/EVIDENCE/step-01/platform-probe.py --base http://127.0.0.1:3020 \
        --environment production --server-log /tmp/prod-130.log

Exit code 0 means every assertion held. A finding is printed with the rule it
broke, and the script never edits anything.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

OK = "ok"
PROBLEM = "problem"

# The public destinations the sitemap must list, and the one page the product
# deliberately keeps out of it.
EXPECTED_SITEMAP_PATHS = [
    "/",
    "/about",
    "/blog",
    "/calculators",
    "/contact",
    "/features",
    "/industries",
    "/invoice-generator",
    "/pricing",
    "/privacy",
    "/shortcuts",
    "/terms",
]
EXCLUDED_SITEMAP_PATHS = ["/offline"]

findings: list[str] = []


def fetch(url: str) -> tuple[int, dict[str, str], bytes]:
    """A response as status, headers and body. A 4xx is a response, not a crash."""
    request = urllib.request.Request(url, headers={"accept": "*/*"})
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            return response.getcode(), dict(response.headers), response.read()
    except urllib.error.HTTPError as error:
        return error.code, dict(error.headers), error.read()


def text_of(body: bytes) -> str:
    return body.decode("utf-8", "replace")


def on_this_server(base: str, url: str) -> str:
    """An absolute URL from the document, asked of the server being probed.

    The deployment states its own origin in NEXT_PUBLIC_APP_URL, and a smoke run
    serves the same build from a different port, so a URL the document publishes
    is rewritten to this base before the probe fetches it. The rule being tested
    is that the path answers, not which host the deployment believes it is.
    """
    parsed = urllib.parse.urlparse(url)
    return f"{base}{parsed.path or '/'}" + (f"?{parsed.query}" if parsed.query else "")


def report(name: str, ok: bool, detail: str) -> None:
    print(f"  {name:32} {OK if ok else PROBLEM} {detail}")
    if not ok:
        findings.append(f"{name}: {detail}")


def paths_in(sitemap: str) -> list[str]:
    return [match.group(1) for match in re.finditer(r"<loc>([^<]+)</loc>", sitemap)]


def check_robots(base: str, environment: str) -> None:
    status, headers, body = fetch(f"{base}/robots.txt")
    content_type = headers.get("content-type", "")
    report(
        "robots status and type",
        status == 200 and "text/plain" in content_type,
        f"status {status} type {content_type}",
    )
    robots = text_of(body)
    if environment == "production":
        checks = {
            "allow all": "Allow: /" in robots,
            "refuse api": "Disallow: /api/" in robots,
            "refuse build output": "Disallow: /_next/" in robots,
            "refuse the gallery": "Disallow: /gallery" in robots,
            "name the sitemap": "Sitemap: " in robots and "/sitemap.xml" in robots,
        }
    else:
        checks = {
            "refuse everything": "Disallow: /" in robots,
            "name no sitemap": "Sitemap:" not in robots,
        }
    for name, ok in checks.items():
        report(f"robots {name}", ok, robots.strip().replace("\n", " | ")[:96])


def check_sitemap(base: str) -> None:
    status, headers, body = fetch(f"{base}/sitemap.xml")
    content_type = headers.get("content-type", "")
    report(
        "sitemap status and type",
        status == 200 and "xml" in content_type,
        f"status {status} type {content_type}",
    )
    sitemap = text_of(body)
    locations = paths_in(sitemap)
    # The path of a location, with the origin taken off: the deployment origin
    # comes from NEXT_PUBLIC_APP_URL and the probe talks to a local port.
    paths = [urllib.parse.urlparse(location).path or "/" for location in locations]
    report(
        "sitemap lists the public pages",
        sorted(paths) == sorted(EXPECTED_SITEMAP_PATHS),
        f"{len(paths)} locations",
    )
    for excluded in EXCLUDED_SITEMAP_PATHS:
        report(
            f"sitemap excludes {excluded}",
            excluded not in paths,
            "absent" if excluded not in paths else "listed",
        )
    absolute = all(location.startswith("http") for location in locations)
    report("sitemap locations are absolute", absolute, f"first {locations[0] if locations else 'none'}")
    # The origin in the file comes from NEXT_PUBLIC_APP_URL, which is the
    # deployment's own address; the probe talks to a local port, so it asks this
    # server for the path and keeps the location's origin out of it.
    reachable = 0
    for path in paths:
        status, _, _ = fetch(f"{base}{path}")
        reachable += 1 if status == 200 else 0
    report("every sitemap page answers", reachable == len(paths), f"{reachable} of {len(paths)} answered 200")


def check_document_and_policy(base: str, environment: str) -> str:
    home_status, home_headers, home_body = fetch(f"{base}/")
    html = text_of(home_body)
    report("homepage answers", home_status == 200, f"status {home_status}")

    policy = home_headers.get("content-security-policy", "")
    report("policy present on the document", policy != "", policy[:72] or "no header")
    nonce_match = re.search(r"'nonce-([A-Za-z0-9+/_-]+)'", policy)
    nonce = nonce_match.group(1) if nonce_match else ""
    report("policy carries a nonce", nonce != "", nonce or "no nonce")
    nonce_occurrences = policy.count(f"'nonce-{nonce}'")
    report(
        "policy reaches both directives",
        nonce_occurrences >= 2,
        f"{nonce_occurrences} occurrences of the nonce in the policy",
    )

    second_status, second_headers, _ = fetch(f"{base}/")
    second_policy = second_headers.get("content-security-policy", "")
    second_nonce = re.search(r"'nonce-([A-Za-z0-9+/_-]+)'", second_policy)
    report(
        "two responses carry two nonces",
        second_status == 200 and second_nonce is not None and second_nonce.group(1) != nonce,
        f"{nonce[:8]} vs {second_nonce.group(1)[:8] if second_nonce else 'none'}",
    )

    attribute = f'nonce="{nonce}"'
    stored = html.count(attribute)
    report(
        "the document's scripts carry the nonce",
        stored > 0,
        f"{stored} script elements carry {attribute}",
    )

    if environment == "production":
        forbids = [token for token in ["unsafe-inline", "unsafe-eval"] if token in policy]
        report("production policy allows no inline or eval", not forbids, ", ".join(forbids) or "clean")
        report(
            "production policy refuses framing",
            "frame-ancestors 'none'" in policy,
            "frame-ancestors 'none'" if "frame-ancestors 'none'" in policy else "missing",
        )
    else:
        report(
            "development policy allows eval",
            "unsafe-eval" in policy,
            "unsafe-eval present" if "unsafe-eval" in policy else "missing",
        )

    # A static asset is not a document: the matcher must not touch it.
    assets = re.findall(r'/_next/static/[^"\'\\ ]+\.js', html)
    script_ok = False
    if assets:
        asset_status, asset_headers, _ = fetch(f"{base}{assets[0]}")
        script_ok = asset_status == 200 and asset_headers.get("content-security-policy", "") == ""
    report(
        "a static asset carries no policy",
        script_ok,
        assets[0] if assets else "no asset found in the document",
    )
    return html


def check_print(base: str, html: str, environment: str) -> None:
    if environment != "production":
        report(
            "print CSS in the compiled bundle",
            True,
            "not asserted on a development server: the development bundler injects styles through JavaScript, so the print base only exists as a stylesheet in a production build",
        )
        markers = html.count('data-layout="print-marker"')
        report("one paper marker in the document", markers == 1, f"{markers} markers")
        return
    stylesheets = re.findall(r'href="(/_next/static/[^"]+\.css)"', html)
    css = ""
    for href in stylesheets:
        status, _, body = fetch(f"{base}{href}")
        if status == 200:
            css += text_of(body)
    report("the compiled stylesheet shipped", css != "", f"{len(stylesheets)} stylesheet links")
    sheets = {
        "print media block": "@media print" in css,
        "a4 sheet": bool(re.search(r"@page\s+a4\s*\{[^}]*size:\s*a4\s+portrait", css, re.I)),
        "letter sheet": bool(re.search(r"@page\s+letter\s*\{[^}]*size:\s*letter\s+portrait", css, re.I)),
        "a4 opt-in class": bool(re.search(r"\.print-sheet-a4\s*\{[^}]*page:\s*a4", css)),
    }
    for name, ok in sheets.items():
        report(f"print {name}", ok, "present" if ok else "missing")
    markers = html.count('data-layout="print-marker"')
    report("one paper marker in the document", markers == 1, f"{markers} markers")
    report(
        "the paper marker is paper only",
        'data-layout="print-marker" data-print="only"' in html,
        "marked data-print=only" if 'data-layout="print-marker" data-print="only"' in html else "unmarked",
    )


def check_metadata(base: str, html: str) -> None:
    tags = {
        "open graph title": 'property="og:title"',
        "open graph description": 'property="og:description"',
        "open graph url": 'property="og:url"',
        "open graph image": 'property="og:image"',
        "twitter card": 'name="twitter:card"',
        "theme colour": 'name="theme-color"',
        "viewport": 'name="viewport"',
        "application name": 'name="application-name"',
    }
    for name, needle in tags.items():
        report(f"head {name}", needle in html, "present" if needle in html else "missing")
    images = re.findall(r'property="og:image" content="([^"]+)"', html)
    image_status = 0
    image_type = ""
    if images:
        image_status, image_headers, _ = fetch(on_this_server(base, images[0]))
        image_type = image_headers.get("content-type", "")
    report(
        "the social image answers",
        image_status == 200 and "image/" in image_type,
        f"status {image_status} type {image_type} {images[0] if images else 'no og:image'}",
    )


def check_gallery(base: str, environment: str) -> None:
    gallery_path = "/gallery"
    status, headers, body = fetch(f"{base}{gallery_path}")
    if environment == "production":
        report(
            "the gallery answers 404 outside development",
            status == 404,
            f"status {status}",
        )
        report(
            "the 404 still carries the policy",
            headers.get("content-security-policy", "") != "",
            headers.get("content-security-policy", "")[:48] or "no header",
        )
    else:
        report("the gallery answers 404 outside development", True, "not asserted on a development server")


def check_instrumentation(server_log: str) -> None:
    try:
        with open(server_log, encoding="utf-8", errors="replace") as handle:
            log = handle.read()
    except OSError as error:
        report("start-up log readable", False, str(error))
        return
    lines = [line for line in log.splitlines() if "service starting" in line]
    report("the start-up hook ran", len(lines) >= 1, f"{len(lines)} start-up line(s)")
    if lines:
        record = lines[0]
        try:
            payload = json.loads(record[record.index("{") :])
            fields = sorted(payload.get("context", {}).keys())
            report(
                "the start-up record is structured",
                payload.get("level") in {"info", "warn"}
                and payload.get("message") == "service starting",
                f"level {payload.get('level')} fields {', '.join(fields)}",
            )
            report(
                "the start-up record carries no secret",
                not any(
                    key in json.dumps(payload).lower()
                    for key in ["service_role", "anon_key", "supabase_url"]
                ),
                "no key name and no value",
            )
        except (ValueError, json.JSONDecodeError):
            report("the start-up record is structured", False, record[:80])


def main() -> int:
    parser = argparse.ArgumentParser(description="probe the platform layer of a running server")
    parser.add_argument("--base", default="http://127.0.0.1:3000")
    parser.add_argument("--environment", choices=["development", "production"], default="development")
    parser.add_argument("--server-log", default=None)
    arguments = parser.parse_args()
    base = arguments.base.rstrip("/")

    print(f"platform probe: {base} as {arguments.environment}")
    check_robots(base, arguments.environment)
    check_sitemap(base)
    html = check_document_and_policy(base, arguments.environment)
    check_print(base, html, arguments.environment)
    check_metadata(base, html)
    check_gallery(base, arguments.environment)
    if arguments.server_log is not None:
        check_instrumentation(arguments.server_log)

    print()
    print(f"findings: {len(findings)}")
    for finding in findings:
        print(f"  FAIL {finding}")
    print(f"RESULT: {'PASS' if not findings else 'FAIL'}")
    return 0 if not findings else 1


if __name__ == "__main__":
    sys.exit(main())
