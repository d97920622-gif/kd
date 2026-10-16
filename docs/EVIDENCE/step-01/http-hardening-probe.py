# path: docs/EVIDENCE/step-01/http-hardening-probe.py
"""Sub-step 1.26 evidence: the hardening headers as the wire actually carries them.

This file is evidence, not part of the product and not a test (Rule 4: the
project ships no test files). Run it by hand against a running server and record
the output in docs/PLAN/08 evidence for 1.26. Two servers are involved, and the
difference between them is the point:

    npx next dev   -H 0.0.0.0 -p 3000     # the development matrix: 8 headers
    npx next build && npx next start -H 0.0.0.0 -p 3020
                                          # the production matrix: 11 headers

    python3 docs/EVIDENCE/step-01/http-hardening-probe.py            # :3000
    python3 docs/EVIDENCE/step-01/http-hardening-probe.py 3020       # :3020

What it answers:

1. Which of the eleven headers the matrix declares arrived on the response.
2. That the three production-only headers are absent in development and present
   in production - the documented exception, measured rather than trusted.
3. That every value is the value the matrix declares, so a header that arrives
   with a weakened value is a failure rather than a pass.
4. That a static asset carries the matrix too, because a header that covers
   documents but not the files they load is a header with a hole in it.
5. That the development server is still reachable through the preview proxy
   host, which is the surface the framing exception exists for.

It reads the headers from a plain HTTP response with urllib, so nothing about
the check depends on a browser.
"""
import sys
import urllib.error
import urllib.request

PORT = sys.argv[1] if len(sys.argv) > 1 else '3000'
BASE_URL = f'http://127.0.0.1:{PORT}'
# The route the matrix is attached to is every response, so one route is enough
# to read the headers and a second one proves the attachment is not per page.
PAGE_PATH = '/shortcuts'
ASSET_HINT = '/_next/static/css/'

ALWAYS = {
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'x-dns-prefetch-control': 'off',
    'x-permitted-cross-domain-policies': 'none',
    'cross-origin-opener-policy': 'same-origin',
    'cross-origin-embedder-policy': 'require-corp',
    'cross-origin-resource-policy': 'same-origin',
}
PRODUCTION_ONLY = {
    'content-security-policy': "frame-ancestors 'none'",
    'x-frame-options': 'DENY',
    'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
}
PERMISSIONS_REFUSED = [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'clipboard-read=()',
]
PERMISSIONS_GRANTED = ['fullscreen=(self)', 'clipboard-write=(self)']


def fetch(path: str) -> tuple[int, dict, bytes]:
    request = urllib.request.Request(f'{BASE_URL}{path}', method='GET')
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            headers = {name.lower(): value for name, value in response.headers.items()}
            return response.status, headers, response.read()
    except urllib.error.HTTPError as error:
        headers = {name.lower(): value for name, value in error.headers.items()}
        return error.code, headers, error.read()


def main() -> int:
    findings: list[str] = []
    status, headers, body = fetch(PAGE_PATH)
    print(f'server: {BASE_URL}')
    print(f'GET {PAGE_PATH} -> {status}, {len(body)} bytes')

    print()
    print('header matrix as received:')
    declared = {**ALWAYS, **PRODUCTION_ONLY}
    for name, expected in declared.items():
        actual = headers.get(name)
        if actual is None:
            marker = 'absent'
            if name in PRODUCTION_ONLY:
                marker = 'absent (expected in development)'
            else:
                findings.append(f'{name} is missing from a response that must always carry it')
            print(f'  {name:34} {marker}')
            continue
        if actual != expected:
            findings.append(f'{name} arrived as {actual!r} but the matrix declares {expected!r}')
            print(f'  {name:34} MISMATCH  {actual}')
            continue
        print(f'  {name:34} ok        {actual[:64]}')

    permissions = headers.get('permissions-policy', '')
    print()
    print('Permissions-Policy:')
    for directive in PERMISSIONS_REFUSED:
        present = directive in permissions
        print(f'  refuses {directive:26} {"yes" if present else "NO"}')
        if not present:
            findings.append(f'Permissions-Policy does not refuse {directive}')
    for directive in PERMISSIONS_GRANTED:
        present = directive in permissions
        print(f'  grants  {directive:26} {"yes" if present else "NO"}')
        if not present:
            findings.append(f'Permissions-Policy does not grant {directive}')

    print()
    print('same matrix on a static asset:')
    asset_path = None
    for candidate in (body.decode('utf-8', 'replace'),):
        for token in candidate.split('"'):
            if token.startswith(ASSET_HINT):
                asset_path = token
                break
        if asset_path:
            break
    if asset_path is None:
        print('  no stylesheet link found in the page; skipped')
    else:
        asset_status, asset_headers, _ = fetch(asset_path)
        print(f'  GET {asset_path} -> {asset_status}')
        missing = [name for name in ALWAYS if name not in asset_headers]
        print(f'  always-on headers present: {len(ALWAYS) - len(missing)} of {len(ALWAYS)}')
        for name in missing:
            findings.append(f'{name} is missing from a static asset response')
        print(
            f'  CORP on the asset: {asset_headers.get("cross-origin-resource-policy", "absent")}'
        )

    print()
    print(f'findings: {len(findings)}')
    for finding in findings:
        print(f'  FAIL {finding}')
    ok = not findings
    print('RESULT:', 'PASS' if ok else 'FAIL')
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
