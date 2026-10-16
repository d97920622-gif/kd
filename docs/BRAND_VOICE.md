// path: docs/BRAND_VOICE.md

# Brand voice guide

Status: normative for tone. `docs/COPY_RULES.md` defines what a valid string
is; this file defines how a valid string sounds. When the two seem to differ,
the copy rules win on form and this file wins on wording.

## 1. Who is being written to

The platform is used by people who are responsible for other people's money:
the owner of a small business, the bookkeeper who runs their invoicing, the
office manager who chases a payment, the accountant who reconciles the month.
They are competent, busy and often interrupted. They are not reading for
pleasure, they are reading to decide what to do next.

Three consequences follow, and they explain almost every rule below:

1. **The reader is short of time.** Lead with the fact, then the consequence,
   then the action. Never lead with the system's own state.
2. **The reader is accountable.** A number shown wrongly is a real problem for
   a real person. Precision is a matter of respect, not of style.
3. **The reader did not choose to read this.** An error message, a failed
   payment, an expired card: the reader arrives in the middle of a task. The
   copy owes them the shortest path back to the task.

## 2. Voice

Four words describe the voice. They are ordered: an earlier word outranks a
later one when two of them pull in different directions.

- **Plain.** Say the thing. "The invoice was not sent." beats "An issue was
  encountered during transmission."
- **Precise.** Name the record, the amount, the date, the field. "This
  estimate was already converted to an invoice." beats "This action is not
  allowed."
- **Calm.** Money brings enough urgency on its own. The interface never adds
  alarm, never uses exclamation marks, never scolds.
- **Respectful.** The reader is the professional, the platform is the tool.
  No surprise, no jargon about our internals, no speaking down.

### 2.1 Tone by context

| Context                   | Tone                                                         | Example                                                                    |
| ------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------- |
| First run, empty state    | Direct, useful, one action                                   | "No clients yet. Add your first client to send an invoice."                |
| Everyday action           | Neutral, confirmatory, brief                                 | "Invoice saved."                                                           |
| Waiting or background     | Sober, no reassurance about what we cannot promise           | "Sending the invoice. You can leave this page."                            |
| Validation error          | Specific, instructional, never blaming                       | "Enter the amount as digits, for example 1250.00."                         |
| System error              | Plain, non-technical, one recovery path                      | "The invoice could not be saved. Your changes are still on this page."     |
| Conflict or lock          | Explain who did what, then how to continue                   | "Someone else saved this record after you opened it."                      |
| Destructive confirmation  | Consequence first, irreversible facts named                  | "Deleting this estimate cannot be undone. Its line items are deleted too." |
| Payment and payout        | Factual, no celebration, no urgency, partner naming as ruled | "The payout is scheduled for 12 March."                                    |
| Success after money moves | Understated, one line, no confetti                           | "Payment recorded against invoice INV-1042."                               |
| Marketing and pricing     | Concrete capability, no superlatives, no promises of outcome | "Send an invoice, track what is paid, chase what is not."                  |
| Legal and consent         | Plain language, never a claim the product does not keep      | "We keep records for the period the tax rules require."                    |
| Email and notification    | The subject states the event; the body states the action     | Subject: "Invoice INV-1042 is overdue"                                     |

## 3. Words

### 3.1 Words this product uses

These are terms of art here. Use them consistently, including for the same
concept across the interface, the emails and the exports.

| Use                 | For                              | Not                                          |
| ------------------- | -------------------------------- | -------------------------------------------- |
| client              | the business the tenant invoices | customer, account                            |
| invoice, estimate   | the two documents, never "bill"  | bill, quote                                  |
| line item           | one row on a document            | entry, article                               |
| payment             | money received                   | transaction, receipt                         |
| payout              | money sent out to the tenant     | withdrawal, transfer                         |
| credit note         | the reversing document           | refund note                                  |
| record              | a row the user can edit          | entity, object                               |
| retainer, recurring | a repeating arrangement          | subscription (for the tenant's client), plan |
| workspace           | the tenant's own space           | organisation unit                            |

### 3.2 Words this product avoids

- **Superlatives and hype.** Effortless, seamless, powerful, revolutionary,
  world class, best in class, cutting edge, game changing, next generation.
  A reader who has been promised "effortless" once has no reason to believe
  the next sentence either.
- **Unquantified claims.** "Save time", "grow revenue faster", "reduce your costs".
  Say what the product does; let the reader judge.
- **Fake urgency.** Hurry, act now, do not miss out, last chance. Urgency
  belongs to a real deadline the reader owns, such as a due date on an
  invoice.
- **Technical furniture.** Endpoint, payload, token, cache, daemon, 500,
  stack trace, SQL, provider name. The reader's problem is not our plumbing.
- **Blame.** You forgot, you failed, invalid input, wrong password. Describe
  the state and the fix.
- **Modal abuse.** Should, would, could, might, may. Say what happens.
- **Latinate padding.** Utilise, facilitate, leverage, commence, terminate.
  Use, help, start, end, cancel.
- **Humour about money.** A joke lands badly on a screen where a payment
  failed. Warmth is a tone, not a punchline.

### 3.3 Partner naming

Two names are fixed by the specification and are never replaced by a brand
name: **Global Payout Partners** for payouts, and **Local Payment Methods via
Licensed Partners** for collection. No other payment brand name appears in any
string, comment, seed or document. `npm run check:forbidden-brands` enforces
this mechanically, so a mistake fails the build rather than reaching a reader.

## 4. Money, numbers, dates and names

- Currency is USD and it is stated as USD. No copy implies a conversion rate,
  a local currency amount, or a display-only figure that a reader could mistake
  for the settled amount.
- An amount is written with the money formatter, never assembled by hand:
  two decimals, a thousands separator, the minus sign before the symbol, and
  no locale guessing from the reader's device.
- A zero amount is written as zero, not hidden, when it is the answer to the
  reader's question ("Outstanding: $0.00" on a fully paid invoice).
- A date is written in full when it decides something: "12 March 2026", not
  "12/03". Relative time is allowed only where precision does not matter
  ("Saved a moment ago"), and never for a deadline, a due date or a payment.
- A person is written as their name as recorded, not "user", not "you" in an
  audit trail.
- An identifier is written as it appears in the product and is never
  abbreviated: INV-1042, not 1042.

## 5. Sentence shapes

- **Announce, then act.** "Invoice saved. Send it now?" is one message and one
  question; "Invoice saved. You can send it now or edit it later." is two
  facts and no question. Pick the one the screen actually supports.
- **Active voice, present tense.** "The estimate was converted by another
  user" is passive and vague; "Priya converted this estimate" is neither.
- **Second person for the reader, first person plural only when the platform
  itself acts.** "We could not reach the payment service" is honest about who
  failed; "You entered an amount the service rejected" is not.
- **One sentence per idea.** If a message needs "and" twice, it is two
  messages.
- **Numbers before nouns.** "3 invoices are overdue" reads faster than
  "Overdue invoices: 3".
- **Lists for parallel options, prose for connected reasoning.** Never a list
  of one.

## 6. Long-form and short-form

The same voice carries into every surface, at a different length:

- **Interface copy.** Shortest possible. A button says what it does: "Send
  invoice", not "Submit".
- **Empty states.** One sentence of state, one of action, one control. If a
  reader must know a rule to get started (a required field, a limit), it
  belongs here rather than in a tooltip they will never open.
- **Documentation and help.** Explain the rule, then the exception, then an
  example a reader can recognise as their own situation.
- **Emails.** The subject states the event. The first line states the action.
  The body carries the facts. Nothing is sold in a transactional email.
- **Error frames.** Heading, condition, action, in that order, in the three
  keys `docs/COPY_RULES.md` requires.
- **Legal and consent.** Plain sentences, no defined terms invented for
  convenience, no promise the platform does not keep.

## 7. Accessibility of wording

- A control is named by what it does, on its own, without relying on the
  paragraph above it. A screen reader announces "Send invoice" and the reader
  knows what will happen.
- An icon-only control has an accessible name that is a sentence fragment, not
  a symbol: "Open the client menu", not "menu", not "plus".
- A status message stands alone: "Invoice INV-1042 sent to Priya Raman", not
  "Sent".
- Instructions never depend on position, colour or shape: "the field below the
  amount", "the red row", and "the round button" are all unreadable to someone
  using a screen reader or a monochrome printout.
- Error copy repeats the field label, because a summary read aloud without the
  label is useless.

## 8. Review checklist

Before copy leaves a branch, it can answer yes to all of these:

1. Does the first sentence contain the fact the reader came for?
2. Is the action unambiguous, and does it name its object?
3. Is every number formatted by the money or date formatter rather than by
   hand?
4. Is every claim something the product actually does, today?
5. Would the reader understand this with no knowledge of the business, the
   code, or the industry?
6. Is it as short as it can be without losing precision?
7. Would this sentence still be defensible if the reader were a paying
   accountant reading it during month end?
