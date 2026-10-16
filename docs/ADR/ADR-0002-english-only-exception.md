// path: docs/ADR/ADR-0002-english-only-exception.md

# ADR-0002 -- English only, with one documented exemption

- Status: Accepted
- Date: 2026-10-17
- Step: 1 (decided in sub-step 1.5, recorded in sub-step 1.32)
- Supersedes: none
- Superseded by: none

## Context

Rule 1 of MASTER_PROMPT is absolute: interface language English only, and zero
non-ASCII script in UI text, code comments, variable and function names, seed
data, enum values, email templates, error messages, file names and folder names.
The rule also prescribes its own enforcement: a lint guard in CI, a pre-commit
hook at `scripts/check-english-only.sh`, every user-facing string centralized in
`lib/i18n/strings/en.ts`, and a strict `no-restricted-syntax` ESLint rule for
non-ASCII patterns (lines 27 to 36).

There is one document in the repository that contradicts the rule by existing:
`FEATURE_LIST.md`. It is the owner's specification - 3,950 features in eleven
parts - and it was written in Bengali. It is the reason the build exists, it is
the file every sub-step is traced back to, and it cannot be translated without
forking the specification: a translated copy would drift, and the owner's own
words are the authority for what a feature means.

So the rule as literally written ("zero non-ASCII script anywhere") is not
satisfiable, and the honest choice is not to weaken the rule but to name the one
document that is outside it - in the check that enforces it, in the README, and
in this record. An exemption that lives only in someone's memory is the kind that
becomes a second and third exemption later.

## Decision

**One exemption, named in one place.** `scripts/checks/english-only.mjs` holds
`EXEMPT_FILES = ['FEATURE_LIST.md']`. Every other tracked text file is scanned
byte by byte for characters above 0x7F, findings are reported as
`path:line:column` with a count per file, and the check's own summary line
prints the number of exemptions - so "one documented exemption" is a fact a
reviewer reads on every `npm run verify`, not a claim in a document.

**Two independent implementations, because they see different things.** The
check reads every tracked file: TypeScript, TSX, markdown, JSON, YAML, CSS,
shell, SQL when it arrives, and the handoffs. The ESLint rule set in
`.eslintrc.json` adds `no-restricted-syntax` selectors for non-ASCII in string
literals, template literals, JSX text and identifiers, which fail at author time
inside an editor and cannot be satisfied by an avoid-a-comment trick. Neither
implementation can hide a character from the other.

**The mandated hook path stays.** `scripts/check-english-only.sh` exists because
MASTER_PROMPT names it. It is a two-line delegate to the Node check, not a second
implementation, so there is one scanner, one report format and one exit-code
contract (the 1.5 decision).

**Interface copy is separated from code.** Everything a reader sees lives in
`lib/i18n/strings/en/` and is read through `t()`; a literal string in JSX or in a
display attribute fails `check:i18n-strings`. This is what makes the language rule
a property of one directory rather than of a thousand files, and it is the
mechanism that keeps the rule cheap to obey (the catalogue itself is ADR-0003).

**What the rule governs, and what it does not.** It governs the repository: code,
comments, copy, configuration, documentation, file names and commit messages.
It does not govern data. A client's name, an address, a product description or a
note typed into the application is data, it is not in this repository, and it is
never refused for containing a script this rule would refuse in a source file.

## Consequences

- The specification keeps the owner's language and stays the traceability source
  every handoff cites; nothing in the build depends on it being translated.
- A second exemption is a visible diff in one constant, and the summary line
  changes from "1 documented exemption" to "2". That is the intended cost of
  adding one.
- Authors of new copy cannot reach for a convenient non-ASCII character - not an
  en dash, not a curly quote, not a rupee sign. The catalogue carries ASCII and
  the type scale carries the meaning; `check:no-coming-soon` and the writing
  rules in `docs/COPY_RULES.md` cover the rest.
- A future business need for a non-ASCII label rendered by the application - a
  legal entity name in the tenant's own script on an invoice, for example - has
  exactly one route: it comes from the tenant's data, which is where such a name
  belongs. A non-ASCII _interface_ string would require superseding this record
  with the owner's decision, which is the point of writing it down.
- Reviewers of the specification corpus read Bengali and ASCII in the same
  repository. The README's exemption section states which rules exempt which
  files, so a reader is never surprised by the one document that differs.

## Alternatives considered

- **Exempt nothing and translate `FEATURE_LIST.md`.** Forks the specification,
  loses the owner's words, and creates a document that must be kept in step with
  a file that changes when the owner says so. Rejected.
- **Exempt the whole governance corpus** (the specification, `MASTER_PROMPT.md`,
  `docs/PLAN/**`, the handoffs) from the check. The plan and the handoffs are
  written by the build and are ASCII; exempting them would hide exactly the files
  a build step writes. Rejected in favour of one named file.
- **Enforce with the pre-commit hook only.** A hook is optional on a contributor
  machine and does not run in a fresh clone that is never committed to. The check
  runs in `npm run verify` and in CI as well.
- **Enforce with ESLint only.** ESLint reads source files. The rule has to cover
  markdown, JSON, YAML, CSS and SQL, which is where a stray non-ASCII character
  is most likely to arrive by paste. Rejected.
- **Allow non-ASCII in comments but not in code.** Harder to state, harder to
  check, and it does not solve the specification. Rejected.

## Verification

- `npm run check:english-only` PASS prints the scanned file count and
  `1 documented exemption`; the same line appears in every `npm run verify` run
  and in the CI job's log.
- The check's own control (sub-step 1.5) mutates a file with a non-ASCII
  character and asserts the finding, and adds a second exempt file and asserts
  the summary changes.
- `.eslintrc.json` carries the four `no-restricted-syntax` selectors; `npm run
lint` fails on a non-ASCII literal in any TypeScript or JavaScript file, and
  that is part of the floor as well.
- `check:i18n-strings` refuses a literal string in JSX and in display attributes,
  which is the mechanism that keeps copy in the ASCII catalogue.
