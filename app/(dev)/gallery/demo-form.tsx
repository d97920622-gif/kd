// path: app/(dev)/gallery/demo-form.tsx
'use client';

import { z } from 'zod';

import { FormField } from '@/components/shared/form-field';
import { FormWrapper, type FormFrame, type FormSubmission } from '@/components/shared/form-wrapper';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { fieldIdFor } from '@/lib/forms/field-id';
import {
  acceptanceField,
  emailField,
  moneyField,
  optionalTextField,
  singleChoiceField,
  textField,
} from '@/lib/forms/form-field-options';
import { type FormFieldDescriptor } from '@/lib/forms/use-mapped-form-errors';
import { useZodForm } from '@/lib/hooks/use-zod-form';
import { t } from '@/lib/i18n';

/**
 * A live form on the real wrapper: idle, invalid, submitting and submitted.
 *
 * The demonstration is honest about what it is. There is no API route behind
 * it yet (the first endpoints arrive with the application shell), so the
 * submission is answered here, in the browser, by a function that returns the
 * two response shapes the platform defines: a success envelope with a fresh
 * one-time token, and a failure envelope with a field detail and a form level
 * detail. The failure path is reachable on purpose, so the frame, the field
 * message and the form level list can be reviewed in all four themes.
 *
 * Everything else is the real thing: the schema is built from the shared field
 * rules, the values go through the wrapper, the token is spent and rotated,
 * the fields are wired by FormField and the summary takes focus when the
 * browser refuses the entries. Change a field rule in
 * lib/forms/form-field-options.ts and this form changes with it.
 */
const PLAN_VALUES = ['starter', 'growth', 'scale'] as const;

const demoFormSchema = z.object({
  name: textField({ minLength: 2, maxLength: 120 }),
  email: emailField(),
  amount: moneyField({ positive: true }),
  notes: optionalTextField({ maxLength: 500 }),
  plan: singleChoiceField(PLAN_VALUES),
  terms: acceptanceField(),
  failNext: z.boolean(),
});

const DEMO_CSRF_TOKEN = 'gallery-demo-token-000001';

/** Delay before the answer, so the submitting state is visible. */
const DEMO_ANSWER_DELAY_MS = 700;

export function DemoForm(): React.ReactElement {
  const form = useZodForm(demoFormSchema, {
    defaultValues: {
      name: '',
      email: '',
      amount: '',
      notes: '',
      plan: 'growth',
      terms: false,
      failNext: false,
    },
  });

  const fields: readonly FormFieldDescriptor[] = [
    { path: 'name', fieldId: fieldIdFor('name'), label: t('gallery.label_demo_name') },
    { path: 'email', fieldId: fieldIdFor('email'), label: t('gallery.label_demo_email') },
    { path: 'amount', fieldId: fieldIdFor('amount'), label: t('gallery.label_demo_amount') },
    { path: 'notes', fieldId: fieldIdFor('notes'), label: t('gallery.label_demo_notes') },
    { path: 'plan', fieldId: fieldIdFor('plan'), label: t('gallery.label_demo_plan') },
    { path: 'terms', fieldId: fieldIdFor('terms'), label: t('gallery.label_demo_terms') },
  ];

  const failNext = form.watch('failNext') === true;

  const conflictFrame = (): FormFrame => ({
    title: t('errors.conflict_frame_title'),
    message: t('errors.conflict_frame_message'),
    action: t('errors.conflict_frame_action'),
  });

  return (
    <FormWrapper
      form={form}
      fields={fields}
      csrfToken={DEMO_CSRF_TOKEN}
      submitLabel={t('common.action_save')}
      pendingLabel={t('common.state_saving')}
      frameForCode={(code) => (code === 'conflict' ? conflictFrame() : null)}
      onSubmit={async ({ values }: FormSubmission): Promise<unknown> => {
        await new Promise((resolve) => {
          setTimeout(resolve, DEMO_ANSWER_DELAY_MS);
        });
        if (values.failNext === true) {
          return {
            error: {
              code: 'conflict',
              message: t('errors.conflict_frame_message'),
              details: [
                {
                  path: 'amount',
                  code: 'money_positive',
                  message: t('validation.money_must_be_positive'),
                },
                { code: 'rate_limited', message: t('errors.rate_limited_frame_message') },
              ],
              correlation_id: 'gallery-demo-correlation-0001',
            },
          };
        }
        return {
          data: { csrf_token: `gallery-demo-token-${String(Date.now())}` },
          meta: { correlation_id: 'gallery-demo-correlation-0001' },
        };
      }}
    >
      <FormField label={t('gallery.label_demo_name')} required={true} fieldId={fieldIdFor('name')}>
        <Input autoComplete="name" {...form.register('name')} />
      </FormField>

      <FormField
        label={t('gallery.label_demo_email')}
        description={t('gallery.label_demo_email_hint')}
        required={true}
        fieldId={fieldIdFor('email')}
      >
        <Input type="email" autoComplete="email" {...form.register('email')} />
      </FormField>

      <FormField
        label={t('gallery.label_demo_amount')}
        description={t('gallery.label_demo_amount_hint')}
        required={true}
        fieldId={fieldIdFor('amount')}
      >
        <Input inputMode="decimal" autoComplete="off" {...form.register('amount')} />
      </FormField>

      {/* The render-prop shape: the id, the described-by reference and the
          invalid flag belong on the trigger, which is the element with the
          combobox role. Handing them to Select itself would drop them, because
          Radix Select is a context provider rather than an element. */}
      <FormField label={t('gallery.label_demo_plan')} required={true} fieldId={fieldIdFor('plan')}>
        {(fieldProps) => (
          <Select
            value={String(form.watch('plan') ?? 'growth')}
            onValueChange={(value) => {
              form.setValue('plan', value, { shouldDirty: true });
            }}
          >
            <SelectTrigger className="w-full" {...fieldProps}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="starter">{t('gallery.label_demo_plan_starter')}</SelectItem>
              <SelectItem value="growth">{t('gallery.label_demo_plan_growth')}</SelectItem>
              <SelectItem value="scale">{t('gallery.label_demo_plan_scale')}</SelectItem>
            </SelectContent>
          </Select>
        )}
      </FormField>

      <FormField
        label={t('gallery.label_demo_notes')}
        description={t('gallery.label_demo_notes_hint')}
      >
        <Textarea rows={3} {...form.register('notes')} />
      </FormField>

      <FormField
        label={t('gallery.label_demo_terms')}
        required={true}
        fieldId={fieldIdFor('terms')}
      >
        <Checkbox
          onCheckedChange={(checked) => {
            form.setValue('terms', checked, { shouldDirty: true, shouldValidate: true });
          }}
        />
      </FormField>

      <FormField label={t('gallery.label_demo_fail_next')}>
        <Checkbox
          checked={failNext}
          onCheckedChange={(checked) => {
            form.setValue('failNext', checked === true, { shouldDirty: true });
          }}
        />
      </FormField>
    </FormWrapper>
  );
}
