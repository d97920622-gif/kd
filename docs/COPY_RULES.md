// path: docs/COPY_RULES.md

# Copy rules for user-facing text

Status: normative for every string in `lib/i18n/strings/en.ts` and its
namespace files. The brand voice guide (sub-step 1.18) describes tone; this
file defines what a valid string is.

## 1. Where strings live

- One catalogue: `lib/i18n/strings/en.ts`, composed from
  `lib/i18n/strings/en/<namespace>.ts` files.
- No component, page, layout, email template or API route may contain
  literal display text. `npm run check:i18n-strings` fails the build when a
  JSX text node or a display attribute holds a literal string.
- Values that are not display text stay in code: log messages, error codes,
  enum values, CSS class names, `data-*` attributes and keys.

## 2. Key naming

- Shape: `namespace.key` with at most three levels, dot separated.
- Every segment is lower case snake case and matches
  `^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$`.
- Namespaces are nouns: `common`, `errors`, `validation`, and later `auth`,
  `invoices`, `payments` and so on.
- Action keys start with `action_`, state keys with `state_`, label keys with
  `label_`, frame copy keys with `frame_`, confirmation keys with `confirm_`.
- Placeholders are lower case snake case inside braces: `{count}`, `{page}`.
- Plural pairs use the suffix convention: `..._one` and `..._other`, and both
  members must exist.

## 3. Wording

- English, ASCII only. Straight quotes, never curly quotes. Use `$` for the
  currency symbol only through the money formatter, not in copy.
- Sentence case for sentences and labels: "Save changes", not "Save Changes".
- A full sentence ends with a period. A short label, button or column header
  has no trailing period.
- Say what the user should do: "Enter a valid email address." is correct,
  "Invalid input" is not.
- Never blame the user. Describe the condition: "The two passwords do not
  match." not "You typed the wrong password."
- Never expose internal detail: no SQL, no provider names, no stack traces,
  no file paths, no HTTP status codes in user copy.
- Payment partner naming follows Rule 5: "Global Payout Partners" for
  payouts and "Local Payment Methods via Licensed Partners" for collection.
- Money is always USD in copy. Display conversion, when it exists, is labeled
  as a display-only amount.

## 4. Error copy pattern

Every error family carries three strings:

| Suffix           | Purpose                               | Example                                               |
| ---------------- | ------------------------------------- | ----------------------------------------------------- |
| `_frame_title`   | Short heading                         | "This record was changed"                             |
| `_frame_message` | One sentence explaining the condition | "Someone else saved this record after you opened it." |
| `_frame_action`  | What the user does next               | "Reload the record to see the latest values."         |

## 5. Interpolation

- Use placeholders instead of string concatenation, so word order stays in
  the catalogue: `t('common.label_page_of', { page: 2, total: 7 })`.
- The same placeholder may appear more than once in a template.
- Never build a sentence by joining catalogue fragments in a component.

## 6. Changing copy

- Changing the wording of an existing key is allowed only while nothing
  references it. Once a key is in use, add a new key and update the callers;
  the type check then proves no stale reference remains.
- Deleting a key is allowed only inside the step that added it, in the same
  commit, when nothing references it.
- Keys are never renamed to "clean up" naming; the naming rule above applies
  to new keys only.
