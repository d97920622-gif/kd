// path: docs/EVIDENCE/step-01/gate-1D.md

# Segment 1D gate evidence

Gate statement, from docs/PLAN/08_SUBSTEP_CHECKLISTS.md:

> Segment gate: production build passes; Lighthouse at least 90 on the
> homepage; dead-link audit clean; `npm run verify` fully green.

Date: 2026-10-17. Branch: `arena/b7780282-kd`.
Sub-steps covered: 1.24 to 1.32 (the whole of segment 1D, and the whole of
step 1).
Evidence rules followed: docs/PLAN/04_DEFINITION_OF_DONE_AND_GATES.md section 4
(command output, reproducible, no screenshots).

Result in one line: three of the four items are proven by the commands below and
the fourth - the browser performance audit - cannot be measured in this
environment; section 2 records why, what stands in for it, and the exact owner
action that closes it.

## How to reproduce

The build and the serving run happen in a copy of the repository outside the
working tree, so the development server that serves the review preview and the
production build never share a `.next` directory:

```sh
cd /home/user/kd
rm -rf /tmp/kd-gate && mkdir -p /tmp/kd-gate
tar -cf - --exclude=./.next --exclude=./node_modules --exclude=./.git \
  --exclude=__pycache__ . | (cd /tmp/kd-gate && tar -xf -)
ln -s /home/user/kd/node_modules /tmp/kd-gate/node_modules

cd /tmp/kd-gate
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3020 npx next build          # item one
NODE_ENV=production NEXT_PUBLIC_APP_URL=http://127.0.0.1:3020 \
  SUPABASE_URL=https://gate.supabase.invalid \
  SUPABASE_ANON_KEY=gate-anon-key-not-a-credential \
  SUPABASE_SERVICE_ROLE_KEY=gate-service-role-key-not-a-credential \
  LOG_LEVEL=info npm run start -- -p 3020 > /tmp/gate-1d-server.log 2>&1 &
```

Then, from `/home/user/kd`, with the development server up on 3000 as well:

```sh
python3 docs/EVIDENCE/step-01/platform-probe.py --base http://127.0.0.1:3020 \
  --environment production --server-log /tmp/gate-1d-server.log
python3 docs/EVIDENCE/step-01/http-hardening-probe.py 3020 production
python3 docs/EVIDENCE/step-01/public-pages-probe.py 3020
python3 docs/EVIDENCE/step-01/platform-probe.py --base http://127.0.0.1:3000 \
  --environment development --server-log /tmp/gate-1d-dev-server.log
python3 docs/EVIDENCE/step-01/http-hardening-probe.py 3000 development
python3 docs/EVIDENCE/step-01/shell-probe.py
python3 docs/EVIDENCE/step-01/gallery-dom-probe.py
node scripts/checks/dead-links.mjs
npm run verify
```

## 1. Item one: the production build passes

`npx next build` in a fresh copy of the tree, exit code 0. The build writes a
symbol in front of each status line and the tool banner carries one too; both are
rendered here as `[ok]` and as plain text, because this repository is ASCII only
and a log excerpt is not worth an exemption. Everything else in the block is the
output character for character:

```
   Next.js 15.5.28

   Creating an optimized production build ...
 [ok] Compiled successfully in 19.9s
   Linting and checking validity of types ...
   Collecting page data ...
 [ok] Generating static pages (8/8)
   Finalizing page optimization ...
   Collecting build traces ...
```

The four artefacts the CI build job asserts are present, with their sizes:

| Artefact                                | Size    |
| --------------------------------------- | ------- |
| `.next/BUILD_ID`                        | 21 B    |
| `.next/server/app/robots.txt.body`      | 120 B   |
| `.next/server/app/sitemap.xml.body`     | 1979 B  |
| `.next/server/app/opengraph-image.body` | 39491 B |

The route table the build prints has 20 rows: the five file routes are
prerendered static content (`/apple-icon.png`, `/icon.png`,
`/opengraph-image`, `/robots.txt`, `/sitemap.xml`), and fifteen routes are
rendered on demand, which is what the per-request nonce in the content security
policy requires: `/`, `/_not-found`, `/about`, `/blog`, `/calculators`,
`/contact`, `/features`, `/gallery`, `/industries`, `/invoice-generator`,
`/offline`, `/pricing`, `/privacy`, `/shells`, `/shortcuts`, `/terms`.

Three further facts from the same build:

- **No deprecated configuration.** The build log contains zero `dynamicIO`
  diagnostics, which is the assertion the CI build job makes after the build.
- **One warning, named rather than implied.** Node prints
  `[MODULE_TYPELESS_PACKAGE_JSON]` for `config/design-tokens.ts` while it loads
  the token module, because the file is ESM and the manifest declares no
  `"type": "module"`. It is a loader performance note from Node during the
  token export, not a Next.js warning, and adding a module type to the manifest
  would change how the whole repository is resolved; it is recorded here so the
  next reader does not have to rediscover it.
- **The bundle is small.** First Load JS shared by all routes is 102 kB, the
  compiled stylesheet is 35,589 bytes, the middleware is 34.6 kB, and the whole
  `.next` directory is 199 MB (build cache included).

Every public route answers 200 from the served build, checked one by one:
`/`, `/features`, `/pricing`, `/about`, `/contact`, `/industries`,
`/calculators`, `/invoice-generator`, `/terms`, `/privacy`, `/blog`, `/offline`.
The two development-only surfaces exist as routes and refuse to render outside
development: the platform probe reads `404` from `/gallery`.

## 2. Item two: the browser performance audit, and what stands in for it

The gate asks for Lighthouse at least 90 on the homepage. **The audit cannot be
run in this environment, and this section records that as a measurement rather
than as an excuse.** Three checks, each reproducible:

```
$ for b in chromium chromium-browser google-chrome google-chrome-stable \
    chrome headless_shell; do command -v $b || echo "$b: absent"; done
chromium: absent
chromium-browser: absent
google-chrome: absent
google-chrome-stable: absent
chrome: absent
headless_shell: absent

$ curl -s -o /dev/null -w '%{http_code}\n' https://objects.githubusercontent.com/
000                                  # GitHub release assets are unreachable

$ for lib in libnss3.so libatk-1.0.so.0 libgbm.so.1 libxkbcommon.so.0 \
    libasound.so.2 libcups.so.2 libcairo.so.2 libpango-1.0.so.0; do ...; done
all absent from the image, and the image has no package-manager network
```

So: no browser binary exists; a browser cannot be fetched from a GitHub release
because release assets are not reachable from this sandbox; and the
npm-installable Chromium builds that CI systems use would fail to launch
because the shared libraries a Chromium needs (`libnss3`, `libatk`,
`libgbm`, `libxkbcommon`, `libasound`, `libcups`, `libcairo`, `libpango`) are
not in the image and cannot be installed without a package repository.

What is measured instead, on the served production build of the homepage. These
describe the same page the audit would score, and none of them is a Lighthouse
score:

| Measurement                                              | Value                                                                                                                                                                                                |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Document, identity encoding                              | 61,455 bytes                                                                                                                                                                                         |
| Document, gzip (how it is served)                        | about 15.8 kB, `Content-Encoding: gzip`; the exact size moves by a few dozen bytes between responses because the per-request nonce is different every time (six responses measured 15,744 to 15,818) |
| Time to first byte, five requests                        | 33.9, 14.9, 14.1, 16.6, 13.2 ms; median 14.9 ms                                                                                                                                                      |
| Requests the document names                              | 24 scripts, 1 stylesheet, 1 preload, which is 25 distinct URLs because the preload names a script the document also loads                                                                            |
| Transfer total, gzip, document plus every distinct asset | about 298 kB over 26 requests (298,109 on the run recorded here)                                                                                                                                     |
| The 24 scripts, uncompressed                             | 855,915 bytes, which is the number the public-pages probe reports as script bytes as served                                                                                                          |
| Image elements                                           | 0, and 0 images without a declared size                                                                                                                                                              |
| Script elements in the document                          | 42, all 42 carrying the nonce (24 with `src`, 18 inline)                                                                                                                                             |
| Absolute origins named in the document                   | one, the deployment's own                                                                                                                                                                            |
| Static asset caching                                     | `public, max-age=31536000, immutable`                                                                                                                                                                |
| Server readiness after boot                              | 373 ms                                                                                                                                                                                               |

The numbers above are properties of this build, measured on the served production
output. The compressed sizes are the only ones that move between responses: every
response carries a fresh nonce, so the gzip stream differs by a few dozen bytes
and the transfer total by a few hundred. They are recorded as about-values with
the measured range rather than as exact constants, because a number that changes
every request is not a constant and a document that prints one invites the next
reader to think it was miscopied.

The evidence file for step 1's gate keeps this item open rather than closed, and
the owner action is one command against the deployed preview:

```sh
npx lighthouse https://<deployed-origin>/ --output html --output-path lighthouse-home.html
```

The four category scores from that report belong in this section, and the
handoff file lists the item in its known-risks table until they are.

## 3. Item three: the dead-link audit is clean

```
$ node scripts/checks/dead-links.mjs
check:dead-links PASS (15 routes, 58 verified links, 0 dynamic links skipped)
```

Fifteen routes are audited: the thirteen public routes (the homepage, features,
pricing, about, contact, industries, calculators, the invoice generator, terms,
privacy, blog, offline and the 404) plus the two development-only surfaces.
Fifty-eight links are resolved one by one, and no link was skipped as dynamic,
which is the case that would let a broken destination hide behind a template
expression.

## 4. Item four: the verification floor is fully green

```
$ npm run verify
== KD SOLUTION IT verify ==
branch arena/b7780282-kd at 9262354
...
PASS check:governance         check:governance PASS (the ten governance artefacts verified ...)
RESULT: PASS (30 of 30 checks passed)
```

Thirty of thirty entries, exit code 0, on the commit this gate is recorded
against. The floor is unchanged from the command `.github/workflows/ci.yml`
runs in its `verify` job, so this result and the runner's result are the same
claim.

## 5. The probes that support the four items

Nothing here is required by the gate statement; each one is a measurement that
could have failed the segment if it had come back wrong.

| Probe                                         | Environment | Result                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `platform-probe.py`                           | production  | 0 findings: robots with 5 checks, sitemap with 12 locations, 12 of 12 answering 200, the nonce on all 42 script elements of the homepage and on the 2 linked assets beside them, a production policy with no inline and no eval, framing refused, one stylesheet, the print sheets, the head metadata, the social image answering `image/png`, `/gallery` answering 404, and a start-up record carrying no key name and no value |
| `http-hardening-probe.py 3020 production`     | production  | 0 findings: nine header values compared exactly, the content security policy judged by content with the nonce in both directives, Permissions-Policy refusing six features and granting two, the same matrix on a static asset                                                                                                                                                                                                   |
| `public-pages-probe.py 3020`                  | production  | PASS: every public page read out of the response, one `h1` each, the header marking one current page at a time, the pricing figures, the calculator forms, the 404 page                                                                                                                                                                                                                                                          |
| `platform-probe.py --environment development` | development | 0 findings: the development policy differs only where it is meant to (no framing refusal, no HSTS), robots refusing the whole site, the start-up record structured                                                                                                                                                                                                                                                               |
| `http-hardening-probe.py 3000 development`    | development | 0 findings                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `shell-probe.py`                              | development | 0 findings: the shells, the skip link, the navigation map with its three trail cases and its role filter, the command surface, the shortcuts page                                                                                                                                                                                                                                                                                |
| `gallery-dom-probe.py`                        | development | 0 findings: five theme scopes, 61 markers per scope, two page-level markers, every interactive control named                                                                                                                                                                                                                                                                                                                     |

The development runs matter because the review preview is a development
deployment: the gate would be worth little if the checks passed only against the
production build and the surface the owner looks at were the one nobody
measured.

## 6. Defects found and fixed while proving this gate

| Defect                                                                                                                                                                                        | Where it came from                                             | Fix                                                                                        |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| A Python bytecode cache (`shell-probe.cpython-311.pyc`) was tracked in `docs/EVIDENCE/step-01/__pycache__/`                                                                                   | An evidence commit that staged the directory                   | `9262354`: `.gitignore` refuses `__pycache__/` and `*.pyc`, the directory leaves the index |
| `check:layout-shells` and `check:color-contrast` were registered in the verification runner and documented in the README but had no script in `package.json`, so neither could be run by name | The reverse-direction rule added to `check:governance` in 1.32 | `4dfa2b0`: both aliases added, the manifest goes from 38 to 40 scripts                     |

The first one is the reason this gate was worth running rather than assumed: the
repository had been carrying a generated file for several sub-steps and nothing
in the floor objected, because no rule refuses a tracked build artefact.

## 7. The audit after the gate

The owner asked for step 1 to be verified again before the branch is merged, so
the gate was not taken as the end of the work. This section records what a second
pass over the whole of step 1 found, because a verification that finds nothing is
worth less than one that says what it looked at.

**What was re-run, and its result.**

| Surface            | Command                                                 | Result                                                                                                                                        |
| ------------------ | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Repository state   | `git status`, `git ls-files`, `git log`                 | Tree clean, 342 tracked files, 60 commits, no merge commit, every subject in the conventional format and none over 72 characters or non-ASCII |
| Floor              | `npm run verify`                                        | PASS, 30 of 30                                                                                                                                |
| Production build   | fresh copy, `npx next build`, then `next start -p 3020` | exit 0, 0 deprecated diagnostics, served and probed                                                                                           |
| Production probes  | platform, http hardening, public pages                  | 0 findings, 0 findings, PASS                                                                                                                  |
| Development probes | platform, http hardening, shell, gallery DOM            | 0 findings in all four                                                                                                                        |
| Sub-step coverage  | every SEGMENT table row against `git log`               | all 32 rows name a commit that exists                                                                                                         |
| Routes             | `find app -name page.tsx`                               | 15 pages, all under `(public)` and `(dev)`; no unauthenticated application page outside them                                                  |
| Artefacts          | `git ls-files` for caches, logs, build output, `.env`   | none tracked                                                                                                                                  |
| Environment        | schema against `.env.example`                           | six keys, identical in both directions                                                                                                        |

**What it found, and what was fixed.** Four defects, all in documents rather than
in code, and each one was a number or a noun that had stopped being true:

| Defect                                                                                                                                                                                                                              | Where                                             | Fix                                                                                                                                                                                                                                              |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| The platform probe reported "44 script elements carry the nonce" when the document has 42 script elements and 2 link elements carrying it. The attribute count was right and the noun was wrong                                     | `docs/EVIDENCE/step-01/platform-probe.py`         | The probe now counts script tags and reports them against the script total, and states the linked assets separately: "42 of 42 script elements" and "44 elements (42 scripts and 2 links)"                                                       |
| The gate record repeated the same wrong noun, and its transfer total double-counted the preloaded chunk (345,464 bytes over 27 requests, when the document names 25 distinct URLs)                                                  | this file, section 2                              | 42 script elements, about 298 kB over 26 requests, and the preload named as the one duplicated URL                                                                                                                                               |
| The compressed sizes were printed as constants. They are not: every response carries a fresh nonce, so the gzip stream moves by a few dozen bytes and the transfer total by a few hundred                                           | this file, section 2                              | Recorded as about-values with the measured range, plus a paragraph saying why they move                                                                                                                                                          |
| The step 1 handoff said the repository holds 335 tracked files and `components/ui/` holds 12 primitives, while it holds 342 and 20; the README documented 18 of the 20 primitives and none of the seven state components 1.24 added | `docs/handoffs/CHAT_01_COMPLETED.md`, `README.md` | 342 files, 20 primitives, and two new README tables: IconButton and Kbd in the primitive table, and a state-components table for StatusState, LoadingState, ErrorBoundary, SuccessState, LiveRegion, StateIllustration and ExplainabilityMessage |

Two findings were checked and deliberately left as they are, because each is a
statement about the future rather than a defect: the README still names
`lib/middleware/csrf.ts` as the file sub-step 3.4 will write, and `docs/ADR/`
uses `CHAT_NN_*` as the handoff naming pattern. A defect is a claim that is false
today; a claim that a later step will create a file is a plan.

**What the audit could not settle.** The same item the gate could not: the
Lighthouse score. Everything else that the gate asserts was re-measured rather
than re-read.

## 8. What this gate does not cover

- **The Lighthouse score itself.** Recorded as an open item in section 2 with the
  owner action. It is the only gate item that could not be measured here.
- **The browser-dependent checks the feature list describes** (real-browser
  accessibility and focus behaviour, cross-browser rendering, visual regression).
  There is no browser dependency in this repository by decision: the floor is
  static analysis, and the probes read the served documents. That decision is
  recorded in `docs/ADR/ADR-0005` and re-stated in the 1D risks.
- **Branch protection on `integration`.** The governance probe reports it as not
  configured; the owner enables it with the `ci` check after the merge.
- **Deployment.** `deploy.yml` and `security.yml` belong to step 16.3, and the
  deployment itself (Netlify pointed at `integration`) is the owner's one-time
  setup.

## 9. Gate result

| Gate item                              | Result                                                                                                                       |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Production build passes                | **PASS**: exit 0, four artefacts asserted, 0 deprecated diagnostics, 12 public routes answering 200                          |
| Lighthouse at least 90 on the homepage | **OPEN**: cannot be measured without a browser; the substitute measurements are recorded and the owner action is one command |
| Dead-link audit clean                  | **PASS**: 15 routes, 58 links, 0 skipped                                                                                     |
| `npm run verify` fully green           | **PASS**: 30 of 30 entries, exit 0                                                                                           |

Segment 1D is complete on the three items this environment can measure, and
step 1 is complete with that one item outstanding against the deployed preview.
The status line this chat closes with therefore names the open item rather than
implying a number that was never produced.
