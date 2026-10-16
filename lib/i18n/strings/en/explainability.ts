// path: lib/i18n/strings/en/explainability.ts
/**
 * Copy for the explainability messages, and the reasons they explain.
 *
 * A14.3 asks for one thing above the money and delivery surfaces: an
 * explanation of the outcome - why a payment failed or is held, what happens
 * next, and when the reader should expect to see the result. That is a copy
 * problem before it is a component problem, because the component can only be
 * as honest as its sentences.
 *
 * The reasons live in this file with their copy, not in the component, because
 * the reason and its words are one fact: a reason with no sentence is a panel
 * that renders an empty space exactly when a reader is worried about money.
 * Four sentences per reason, in a fixed shape:
 *
 *   - `headline_*` names the outcome in one line, in the reader's terms.
 *   - `explanation_*` says why it happened, including what did *not* happen
 *     ("nothing was charged"), because an unexplained failure is read as a
 *     charge.
 *   - `next_*` says what happens next and what, if anything, the reader must
 *     do. An outcome that requires nothing from the reader says so.
 *   - `expected_*` gives a time the platform can stand behind. Every sentence
 *     is written with its uncertainty in it ("usually", "within two business
 *     days") rather than as a promise a bank can break on our behalf.
 *
 * The list is closed on purpose. A later step supplies context values - an
 * amount, a reference, an instant - and never invents a reason: a processor's
 * raw reason code is mapped onto one of these reasons by the step that owns
 * the processor (steps 5, 8, 10, 11, 12), so an unfamiliar code surfaces as
 * `unknown_outcome` with the reference attached, which is a sentence support
 * can act on. Known banks, processors and card brands are never named here.
 *
 * Append protocol: add, never rename or remove. A copy change is a new key.
 */

/** Every reason the product can explain. The union is derived from this list. */
export const explainabilityReasons = [
  'payment_declined',
  'payment_held',
  'payment_pending',
  'refund_pending',
  'payout_delayed',
  'invoice_overdue',
  'delivery_failed',
  'delivery_retry',
  'unknown_outcome',
] as const;

export const explainability = {
  // -------------------------------------------------------------------------
  // Labels. The panel's own furniture, used by every reason.
  // -------------------------------------------------------------------------
  label_next: 'What happens next',
  label_expected_by: 'Expected by {time}.',
  label_reference: 'Reference',
  label_support: 'Ask support about this',
  label_title: 'What happened',

  // -------------------------------------------------------------------------
  // A payment that was refused.
  // -------------------------------------------------------------------------
  headline_payment_declined: 'This payment was declined',
  explanation_payment_declined:
    'The payment method was refused before any money moved. Nothing was charged, and the invoice is still unpaid rather than paid and reversed.',
  next_payment_declined:
    'The payer can try this invoice again with the same method or another one. The invoice stays open until it is paid.',
  expected_payment_declined:
    'The invoice remains payable until its due date, and reminders follow the schedule on the invoice.',

  // -------------------------------------------------------------------------
  // A payment that was authorised and is being held while it is reviewed.
  // -------------------------------------------------------------------------
  headline_payment_held: 'This payment is on hold',
  explanation_payment_held:
    'The payment was authorised and the funds are held while the account is reviewed. Held money is never counted as available to spend, and it is shown separately for exactly that reason.',
  next_payment_held:
    'The hold is reviewed automatically and released when it clears or when its period ends. Nothing is needed from you to make that happen.',
  expected_payment_held: 'Holds are usually reviewed within one business day.',

  // -------------------------------------------------------------------------
  // A payment that is clearing.
  // -------------------------------------------------------------------------
  headline_payment_pending: 'This payment is on its way',
  explanation_payment_pending:
    'The payment was approved and is clearing. Until it clears, the amount is shown as pending and is not part of the available balance.',
  next_payment_pending:
    'When it clears, the invoice updates itself and the receipt is issued. Nothing is needed from you or from the payer.',
  expected_payment_pending: 'Clearing usually takes one to three business days.',

  // -------------------------------------------------------------------------
  // A refund that has been issued.
  // -------------------------------------------------------------------------
  headline_refund_pending: 'This refund is on its way',
  explanation_refund_pending:
    "The refund was issued to the original method. The time it takes to appear on a statement is decided by the payer's bank, not by this platform, so the money can be on its way while the statement still shows nothing.",
  next_refund_pending:
    'The refund settles on its own and the payer is notified when it does. If it has not appeared after the period below, support can trace it with the reference.',
  expected_refund_pending: 'Refunds usually appear within five to ten business days.',

  // -------------------------------------------------------------------------
  // A payout that is waiting for its settlement window.
  // -------------------------------------------------------------------------
  headline_payout_delayed: 'This payout is delayed',
  explanation_payout_delayed:
    'The payout is approved and waiting for the next settlement window. The money is still in the account pipeline, held to available, rather than lost or refunded.',
  next_payout_delayed:
    'The payout leaves on the next scheduled date, and the payout list shows the schedule, the status and every attempt with its outcome.',
  expected_payout_delayed: 'Payouts leave within two business days of approval.',

  // -------------------------------------------------------------------------
  // A client invoice whose due date has passed.
  // -------------------------------------------------------------------------
  headline_invoice_overdue: 'This invoice is overdue',
  explanation_invoice_overdue:
    'The due date has passed and no payment has arrived. The invoice is still open and still collectable, and no late fee is applied by this platform unless you configured one.',
  next_invoice_overdue:
    'The reminder schedule continues until the invoice is paid or written off, and you can pause or stop it on the invoice itself.',
  expected_invoice_overdue: 'The next reminder goes out on the next business day.',

  // -------------------------------------------------------------------------
  // A document that did not reach its inbox.
  // -------------------------------------------------------------------------
  headline_delivery_failed: 'This email was not delivered',
  explanation_delivery_failed:
    'The receiving server refused the message, so the document did not reach the inbox. The document itself is unchanged and can still be opened, printed and downloaded from here.',
  next_delivery_failed:
    'Each refusal is recorded in the delivery log with its reason, and the address is flagged for review rather than retried forever.',
  expected_delivery_failed:
    'Retries continue for twenty-four hours, after which the delivery log holds every attempt.',

  // -------------------------------------------------------------------------
  // A document that is being retried.
  // -------------------------------------------------------------------------
  headline_delivery_retry: 'This email is being retried',
  explanation_delivery_retry:
    'The first attempt did not complete, which is usually a temporary answer from the receiving server. Nothing is lost, and the same message is sent again.',
  next_delivery_retry:
    'The delivery log records every attempt with its reason, so the history is visible rather than guessed at.',
  expected_delivery_retry: 'The next attempt is within thirty minutes.',

  // -------------------------------------------------------------------------
  // Anything the platform cannot classify yet. This is the honest fallback:
  // it names the reference and hands the reader to support instead of
  // inventing a reason for a sentence nobody can back.
  // -------------------------------------------------------------------------
  headline_unknown_outcome: 'We cannot explain this outcome yet',
  explanation_unknown_outcome:
    'The platform has the record of what happened and not yet the reason for it. The reference below identifies that exact record, and support can trace it.',
  next_unknown_outcome:
    'Quote the reference when you contact support, and the reason appears here once it is recorded.',
  expected_unknown_outcome: 'No time can be given for this outcome until the reason is recorded.',
} as const;
