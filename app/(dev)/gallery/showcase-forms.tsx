// path: app/(dev)/gallery/showcase-forms.tsx
import { FormErrorSummary } from '@/components/shared/form-error-summary';
import { FormField } from '@/components/shared/form-field';
import { SubmitButton } from '@/components/shared/submit-button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { fieldIdFor } from '@/lib/forms/field-id';
import { t } from '@/lib/i18n';

import { DemoForm } from './demo-form';

/**
 * The form primitives from sub-step 1.17, each one shown in the state it has
 * to survive:
 *
 *   - a field with a hint, a required field, and a field that failed
 *     validation with its message attached by aria-describedby and announced
 *     by a live region;
 *   - the submit button idle and the same button while a submission runs,
 *     where it is disabled, marked busy and showing its pending label;
 *   - the error summary with the three kinds of entry a form can produce.
 *
 * This file is a server component on purpose. Every primitive it renders is
 * either a plain element or a client component that takes only serialisable
 * props, which is the shape the platform needs: a page can render a complete
 * form shell without turning the whole route into a client bundle.
 *
 * Below the static states sits the live form (`demo-form.tsx`), which walks
 * through idle, invalid, submitting and submitted against the real wrapper.
 */
export function ShowcaseForms(): React.ReactElement {
  const emailId = fieldIdFor('email');
  const amountId = fieldIdFor('amount');

  return (
    <section aria-labelledby="gallery-forms-heading" className="grid gap-6">
      <h3 id="gallery-forms-heading" className="text-xl font-semibold">
        {t('gallery.label_section_form_primitives')}
      </h3>

      <div className="grid gap-4">
        <FormField
          label={t('gallery.label_demo_email')}
          description={t('gallery.label_demo_email_hint')}
          required={true}
          fieldId={emailId}
        >
          <Input type="email" defaultValue={t('gallery.label_demo_value_email')} />
        </FormField>

        <FormField
          label={t('gallery.label_demo_email')}
          description={t('gallery.label_demo_email_hint')}
          error={t('validation.invalid_email')}
          required={true}
          fieldId="gallery-invalid-email"
        >
          <Input type="email" defaultValue={t('gallery.label_demo_value_email_invalid')} />
        </FormField>

        <FormField
          label={t('gallery.label_demo_amount')}
          description={t('gallery.label_demo_amount_hint')}
          error={t('validation.money_must_be_positive')}
          required={true}
          fieldId={amountId}
        >
          <Input inputMode="decimal" defaultValue="0.0000" />
        </FormField>

        <FormField
          label={t('gallery.label_demo_notes')}
          description={t('gallery.label_demo_notes_hint')}
        >
          <Textarea defaultValue={t('gallery.label_demo_value_notes')} />
        </FormField>
      </div>

      <div className="flex flex-wrap items-start gap-4">
        <SubmitButton
          label={t('common.action_save')}
          pendingLabel={t('common.state_saving')}
          isSubmitting={false}
        />
        <SubmitButton
          label={t('common.action_save')}
          pendingLabel={t('common.state_saving')}
          isSubmitting={true}
        />
      </div>

      <FormErrorSummary
        items={[
          {
            fieldId: emailId,
            label: t('gallery.label_demo_email'),
            message: t('validation.invalid_email'),
          },
          {
            fieldId: amountId,
            label: t('gallery.label_demo_amount'),
            message: t('validation.money_must_be_positive'),
          },
          {
            fieldId: fieldIdFor('terms'),
            label: t('gallery.label_demo_terms'),
            message: t('validation.terms_not_accepted'),
          },
        ]}
      />

      <DemoForm />
    </section>
  );
}
