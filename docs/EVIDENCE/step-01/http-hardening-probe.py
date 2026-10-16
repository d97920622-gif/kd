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
2. That the production-only headers are absent in development and present in
   production - the documented exception, measured rather than trusted.
3. That every value is the value the matrix declares, so a header that arrives
   with a weakened value is a failure rather than a pass. The composed content
   security policy is the one exception to that comparison: it carries a fresh
   nonce in every response, so it is judged by what it must contain in the
   environment being probed rather than by equality.
4. That a static asset carries the matrix too, because a header that covers
   documents but not the files they load is a header with a hole in it.
5. That the permissions policy refuses by default: the directives the matrix
   refuses are refused, and the two it grants are granted, on the same response.

It reads the headers from a plain HTTP response with urllib, so nothing about
the check depends on a browser.
"""
import sys
import urllib.error
import urllib.request

PORT = sys.argv[1] if len(sys.argv) > 1 else '3000'
# Development listens on 3000 by convention and the built server on 3020, so the
# port decides the expectation and the second argument overrides it when the
# probe is pointed at something else.
ENVIRONMENT = sys.argv[2] if len(sys.argv) > 2 else ('development' if PORT == '3000' else 'production')
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
    'x-frame-options': 'DENY',
    'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
}
# The composed policy, by what each environment must contain.
PRODUCTION_POLICY_MUST = [
    "default-src 'self'",
    "script-src 'self' 'nonce-",
    "'strict-dynamic'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
]
PRODUCTION_POLICY_MUST_NOT = ["'unsafe-eval'", "'unsafe-inline'", 'ws:', 'blob:']
DEVELOPMENT_POLICY_MUST = ["'unsafe-eval'", "'unsafe-inline'", "connect-src 'self' ws: wss:"]
DEVELOPMENT_POLICY_MUST_NOT = ['frame-ancestors', 'upgrade-insecure-requests']
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

    print(f'environment: {ENVIRONMENT}')
    print()
    print('header matrix as received:')
    declared = {**ALWAYS, **PRODUCTION_ONLY}
    for name, expected in declared.items():
        actual = headers.get(name)
        if actual is None:
            if name in PRODUCTION_ONLY and ENVIRONMENT == 'development':
                print(f'  {name:34} absent (expected in development)')
                continue
            findings.append(f'{name} is missing from a response that must carry it')
            print(f'  {name:34} MISSING')
            continue
        if name in PRODUCTION_ONLY and ENVIRONMENT == 'development':
            findings.append(f'{name} arrived on a development response, where the matrix declares it absent')
            print(f'  {name:34} UNEXPECTED  {actual[:64]}')
            continue
        if actual != expected:
            findings.append(f'{name} arrived as {actual!r} but the matrix declares {expected!r}')
            print(f'  {name:34} MISMATCH  {actual}')
            continue
        print(f'  {name:34} ok        {actual[:64]}')

    # The composed policy, which is the one header the nonce middleware sends in
    # both environments: a policy that exists only on the deployed origin is a
    # policy the application has never actually run under.
    policy = headers.get('content-security-policy')
    print()
    print('the composed content security policy:')
    if policy is None:
        print('  absent')
        findings.append(
            'content-security-policy is missing: sub-step 1.30 sets the composed policy on every document'
        )
    else:
        nonce_occurrences = policy.count("'nonce-")
        print(f'  the nonce reaches both directives  {"yes" if nonce_occurrences == 2 else "NO"}')
        print(f'  {policy[:96]}')
        if nonce_occurrences != 2:
            findings.append(
                f"content-security-policy carries the nonce {nonce_occurrences} time(s); it must reach script-src and style-src"
            )
        must, must_not = (
            (PRODUCTION_POLICY_MUST, PRODUCTION_POLICY_MUST_NOT)
            if ENVIRONMENT == 'production'
            else (DEVELOPMENT_POLICY_MUST, DEVELOPMENT_POLICY_MUST_NOT)
        )
        for needle in must:
            if needle not in policy:
                findings.append(f'{ENVIRONMENT} policy does not carry {needle}')
                print(f'  missing {needle}')
        for needle in must_not:
            if needle in policy:
                findings.append(f'{ENVIRONMENT} policy carries {needle}, which it must not')
                print(f'  unexpected {needle}')

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
