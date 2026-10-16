// path: lib/forms/field-id.ts
/**
 * Field ids.
 *
 * A form field needs three things to agree: the id on the control, the id the
 * label points at, and the id the error summary links to. Deriving all three
 * from the field path keeps them in agreement by construction, and it keeps
 * the ids readable in the DOM, which is what makes an accessibility audit and
 * a browser automation run possible at all.
 *
 * The format is stable and ASCII: `field-` followed by the lower case path
 * with dots and array brackets replaced by hyphens. `billing.email` becomes
 * `field-billing-email`, `items.0.amount` becomes `field-items-0-amount`.
 *
 * A field that has no path in the form values, or a form that needs more than
 * one control per path, passes its own id to FormField instead; the wrapper
 * only requires that the id is a valid HTML id and that the descriptor list
 * names the same value.
 */
export function fieldIdFor(path: string): string {
  const slug = path
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return slug.length === 0 ? 'field' : `field-${slug}`;
}
