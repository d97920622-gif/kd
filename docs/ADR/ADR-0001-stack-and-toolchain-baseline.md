// path: docs/ADR/ADR-0001-stack-and-toolchain-baseline.md

# ADR-0001 -- Stack and toolchain baseline

- Status: Accepted
- Date: 2026-10-17
- Step: 1 (decided in sub-steps 1.1 to 1.3, recorded in sub-step 1.32)
- Supersedes: none
- Superseded by: none

## Context

MASTER_PROMPT fixes the stack before any code exists: "Next.js 14+ (App Router,
Server Components, Server Actions)", "TypeScript 5+ (strict mode, no `any`
types)", "Tailwind CSS 3+ with custom design tokens" (lines 97 to 99), and the
repository structure it mandates names `next.config.js`, `tailwind.config.ts`,
`postcss.config.js`, `components.json`, `.eslintrc.json` and `.prettierrc`
(lines 630 to 638). Everything else - which exact majors, which linter mode,
which package manager, which Node line - is left to the build.

That freedom is the risk. Every one of those choices becomes an assumption that
forty later sub-steps compile against, and a stack decision made quietly in the
first hour is the hardest kind to revisit: by the time it hurts, thousands of
lines depend on it. The plan therefore asks for a toolchain baseline as sub-step
1.1 and a gate around it, and this record writes down what was chosen and why.

Three constraints shaped the choice. The build sandbox has no network beyond the
package registry, so a tool that downloads a binary at install time is a tool
that may not install. The plan's per-step gates must be runnable by one command
in a fresh clone, which rules out anything that needs a service, a browser or a
container to answer "does this repository hold together". And the mandated file
names have to keep working: an `.eslintrc.json` that is silently ignored because
the chosen ESLint implements flat configuration only would leave every rule in
it unenforced.

## Decision

**Next.js 15.5 on React 19, App Router only.** No pages router, no client-side
data layer. Server Components are the default; a file becomes a client component
only by saying `'use client'`, which is a decision a reviewer can see in the
diff. Server Actions are reserved for mutations that step 3 and later write.

**TypeScript 5.9 in strict mode.** `strict`, `noImplicitAny`,
`strictNullChecks`, `noUnusedLocals`, `noUnusedParameters`,
`noImplicitOverride`, `noFallthroughCasesInSwitch`,
`forceConsistentCasingInFileNames` and `isolatedModules` are on, `any` is an
ESLint error (`check:any-types` refuses it statically as well), and the compiler
is a gate: `npm run typecheck` is one of the first entries of the verification
floor and `next.config.js` fails the build on a type error.

**Tailwind CSS 3.4 with the configuration-file pipeline.** `tailwind.config.ts`,
`postcss.config.js` and `components.json` are the mandated files, and 3.4 is the
line that keeps them authoritative. The configuration does not hold the design
values, though: it takes the spacing, radius, shadow, z-index, typography,
colour and motion scales from `config/design-tokens.ts` by identifier (ADR-0003),
so a palette change is one module and the JSON export design tooling reads is
generated from it.

**ESLint 8 in eslintrc mode, Prettier 3 with the Tailwind plugin.** The two
mandated configuration files are the ones the tools actually read: ESLint 8.57
loads `.eslintrc.json`, and `eslint-config-prettier` keeps the linter out of
formatting. The rule set is the interesting part of the decision, not the
version: `no-explicit-any` and `no-console` as errors, a `no-restricted-syntax`
block that refuses non-ASCII string literals, template elements, JSX text and
identifiers (the linter half of the English-only rule, ADR-0002), `import/order`
with the repository's group order, React, Next and a forbidden-import rule that
keeps the environment module out of client components. Prettier owns the shape of
every file: 100 columns, single quotes, trailing commas, and the promoted
`prettier-plugin-tailwindcss` for `className` lists.

**Node.js 22 with npm 10 and `npm ci` from the lockfile.** The `engines` field
requires 22 or newer, the CI job pins major 22, and the check that reads both
fails when they disagree. Installation is `npm ci` everywhere; `npm install` is
refused in the workflow, because the difference between the two is whether the
runner resolves the versions the lockfile recorded or the ranges the manifest
allows.

**Git hooks and one aggregate gate.** Husky installs `pre-commit`, which runs
lint-staged and then `npm run verify`, and `commit-msg`, which enforces
`<type>(step-NN/S.S): <imperative summary>` and a subject limit. `npm run verify`
is the single definition of "the repository holds together": one runner, one
report format, one exit code, and the same command in the hook, in the pull
request and in CI (ADR-0007).

## Consequences

- A new dependency is a reviewed decision rather than an installation. The
  dependency set stayed small on purpose: no state manager, no HTTP client, no
  icon package beyond one set, no CSS-in-JS runtime, and no test runner (Rule 4
  forbids that one outright).
- Every file in the repository is formatted by one tool with one configuration,
  which is why `format:check` can be a gate instead of a suggestion.
- The toolchain is pinned by `package-lock.json` and by `engines`, so a fresh
  clone builds the same tree the gate measured. The cost is that a major upgrade
  is a deliberate sub-step with its own evidence, not a background update.
- ESLint 8 is a deliberate choice against ESLint 9, whose flat configuration
  would have made the mandated `.eslintrc.json` dead weight. When the repository
  moves, it moves the file and the rules together.
- React 19 and Next 15 are majors, so some third-party documentation on the
  internet describes the previous ones. The pinned versions in `package.json`
  are the authority.

## Alternatives considered

- **Next.js 14.** The mandated floor is "14+". 15 was available, is the version
  the App Router is developed against, and needed no workaround; choosing 14
  would have meant adopting it knowingly as legacy.
- **Tailwind CSS 4 (CSS-first configuration).** Faster and newer, and it would
  have deleted `tailwind.config.ts` - a file MASTER_PROMPT names. The mandated
  structure wins over the newer pipeline.
- **ESLint 9 with flat configuration.** The rule set would have been easier to
  type-check, and `.eslintrc.json` would have been ignored. Not acceptable.
- **Biome as a linter and formatter.** One tool instead of two, and no
  `.eslintrc.json`. Rejected for the same reason, plus the Next.js plugin set.
- **pnpm or yarn.** Faster installs and stricter resolution; neither is named by
  the specification, and npm ships with the Node version the plan assumes.
- **No Git hooks, CI only.** A defect that the hook catches never reaches a
  commit; catching it on the runner costs a push, a queue and a review comment.
  The hook stays, and CI runs the identical command for the case where a
  contributor has not installed it.

## Verification

- `package.json` pins every dependency and declares `engines.node`; the
  `check:governance` rule compares that major with the one the workflow pins.
- `npm run verify` runs the compiler, the linter, the formatter check, the
  environment validation, the token export and the rule checks in one command
  and exits non-zero on the first failure; `.husky/pre-commit` calls exactly
  that command, and `.github/workflows/ci.yml` calls it in the `verify` job.
- `next.config.js` fails the production build on a lint or type error, so the
  build is not a way around the gate.
- `check:any-types` and the `no-explicit-any` ESLint rule are two independent
  refusals of the same thing; the ESLint rules for non-ASCII literals are the
  static half of `check:english-only`.
- CI runs the build with the pinned Node major and the probes against the built
  server, so the baseline is measured on a machine that is not this one.
