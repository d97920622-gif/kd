// path: docs/ADR/ADR-0004-environment-contract.md

# ADR-0004 -- The environment contract and the server-only boundary

- Status: Accepted
- Date: 2026-10-17
- Step: 1 (decided in sub-steps 1.4 and 1.30, recorded in sub-step 1.32)
- Supersedes: none
- Superseded by: none

## Context

MASTER_PROMPT layer 3 requires that a server never starts with an incomplete
configuration, that server-only keys never reach a browser, and that a log line
never carries a secret value. FEATURE_LIST item 3199 is the same rule from the
feature register's side: server-only environment variables must be enforced.

Three facts about this platform make the rule harder than an `if` statement in a
config file. The database and its keys belong to a provider whose client is
imported in server code only, so a single accidental import from a client
component would ship the key to a device. Next.js inlines every `NEXT_PUBLIC_*`
variable into the bundle at build time, so the difference between a public and a
private variable is a naming decision made once and never revisited. And the
production build does not have the runtime secrets and must not need them: a
build that fails because a database credential is absent cannot be run in CI,
while a _server_ that starts without one is a server whose first query fails in
front of a customer.

## Decision

**One schema is the contract.** `lib/env/validate-env.ts` declares
`ENV_SOURCE_KEYS` - every variable the platform reads, in documentation order -
and validates them with one Zod schema: `NODE_ENV` and `LOG_LEVEL` as enums,
`NEXT_PUBLIC_APP_URL` as a URL, the Supabase URL as a URL and the two keys as
strings of a minimum length. A default exists only where the default is safe
(the local origin, the log level); presence is required only where a runtime
cannot work without it (`PRODUCTION_REQUIRED_KEYS`).

**Fail fast, fail closed, and say nothing a reader should not know.** `getEnv()`
parses once and memoizes. The Node half of `instrumentation.ts` calls it inside
`registerService`, so an invalid configuration ends the process with
`process.exit(1)` and one structured line on the way up - "startup refused: the
environment is invalid" with the failing key named and the value withheld. A
deployment that is misconfigured never answers a request, and the log it leaves
behind is safe to paste into a ticket.

**The build-phase exception is one line, named.** `isProductionBuildPhase()`
checks `NEXT_PHASE === 'phase-production-build'` and the schema's superRefine
returns early inside it. That is the entire exception: a production build compiles
without runtime secrets, and a production _server boot_ still refuses without
them. It is written down here because an exception that nobody names becomes a
permanent hole; the check reads the same constant.

**Two tiers, and one of them is a boundary.** `NEXT_PUBLIC_APP_URL` is the only
variable a browser may receive, and it is public on purpose: it is the origin the
metadata, the sitemap and the canonical tags are resolved against.
`SECRET_ENV_KEYS` lists the two Supabase keys, and the boundary is enforced in
three places: a client component may not import `@/lib/env` at all, no file under
`app/` or `components/` may read `process.env.SUPABASE_*`, and the structured
logger redacts the values it was given (`collectSecretValues`, sub-step 1.8).

**Values never appear in a message.** Validation failures describe the key and
the rule, never the value; `maskValue()` returns `(unset)` or two characters and
asterisks; the report a failed boot leaves behind carries field names only. The
1.31 workflow follows the same rule from the other side: it sets non-credential
placeholders for the three Supabase variables and refuses any secret reference,
so the gate can boot the contract without holding a credential.

**`.env.example` is the template a deployment is created from.** Every variable is
documented there with its format and its purpose, `.env` itself is gitignored,
and `check:secrets` refuses a credential that ever reaches a tracked file.

## Consequences

- Adding a variable is a three-place diff - the schema, `.env.example`, and the
  sub-step's record - and the CI job refuses an environment key the schema does
  not declare, so a variable cannot arrive through a workflow alone.
- A production deployment that is missing one key fails to boot rather than
  degrading quietly. That is the intended failure mode: an error at deploy time
  is visible to one person, and a silent degradation is visible to customers.
- The build in CI needs placeholders for the two keys, which is evidence about
  the contract: the build reads the schema, not the secrets.
- The logger's redaction depends on the same list. A secret that is not in
  `SECRET_ENV_KEYS` is a secret that may reach a log line, which is why the list
  is the first thing a later step extends when it adds a credential.

## Alternatives considered

- **Read `process.env` where it is needed.** Fewest files, no schema, and no way
  to answer "is this deployment complete" before the first query. Rejected.
- **Validate lazily at first use.** A misconfigured server would serve pages and
  fail on the one route that touches the database, which is the hardest failure
  to attribute. Rejected in favour of the boot refusal.
- **A separate validation per runtime** (build, server, edge). Three schemas
  drift; middleware runs in the Edge runtime and needs no secret, which is why
  `middleware.ts` reads nothing from `process.env` except the runtime check in
  `instrumentation.ts`'s counterpart.
- **Require the secrets during the build too.** It makes a CI run impossible
  without a credential and turns a compile error into a build-time secret
  distribution problem. Rejected.
- **A hosted secrets manager at this step.** Step 2 delivers the encrypted key
  vault for tenant data keys, and the deployment environment holds platform
  credentials; a third mechanism in step 1 would be a system with no user.
  Deferred, not rejected.

## Verification

- `npm run env:validate` runs in the floor with development defaults and reports
  a missing secret as `(unset)` rather than printing a value.
- The boot refusal was measured: `next start` with the three Supabase variables
  unset exits 1 and writes one structured record naming the environment, the log
  level, the Node version and the site, with no key name and no value
  (`docs/EVIDENCE/step-01/platform-probe.py` reads that record from the server
  log and refuses a record that carries a secret).
- `check:platform-plumbing` verifies the two server-only keys are refused in
  `app/` and `components/`, that a client component does not import the
  environment module, and that the schema declares the keys the rule protects.
- The CI build job boots a production server with non-credential placeholders and
  the probes read it, so the contract is exercised on a machine that holds no
  real secret.
