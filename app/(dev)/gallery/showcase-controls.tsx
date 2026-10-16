// path: app/(dev)/gallery/showcase-controls.tsx
'use client';

import { MoreHorizontal, Plus, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { t } from '@/lib/i18n';

/**
 * The control primitives from sub-step 1.15, in every state a person can put
 * them in: a plain row, a row with a disabled control, a row with a validation
 * message, and a row with an icon-only control that carries an accessible
 * name.
 *
 * The section is a client component because a select, a radio group and a
 * switch keep state. Nothing here is styled for the gallery: the same classes
 * the platform uses are rendered, so a token that is missing shows up as a
 * control that looks the same in all four themes.
 */
export function ShowcaseControls(): React.ReactElement {
  return (
    <section aria-labelledby="gallery-controls-heading" className="grid gap-4">
      <h3 id="gallery-controls-heading" className="text-xl font-semibold">
        {t('gallery.label_section_form_controls')}
      </h3>

      <div className="grid gap-2">
        <Label htmlFor="gallery-search">{t('gallery.label_demo_search')}</Label>
        <Input
          id="gallery-search"
          type="search"
          defaultValue={t('gallery.label_demo_value_email')}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="gallery-email-invalid">{t('gallery.label_demo_invalid_email')}</Label>
        <Input
          id="gallery-email-invalid"
          aria-invalid={true}
          aria-describedby="gallery-email-invalid-error"
          defaultValue={t('gallery.label_demo_value_email_invalid')}
        />
        <p id="gallery-email-invalid-error" role="alert" className="text-sm text-destructive">
          {t('validation.invalid_email')}
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="gallery-notes">{t('gallery.label_demo_notes')}</Label>
        <Textarea id="gallery-notes" defaultValue={t('gallery.label_demo_value_notes')} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="gallery-plan">{t('gallery.label_demo_plan')}</Label>
        <Select defaultValue="growth">
          <SelectTrigger id="gallery-plan" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="starter">{t('gallery.label_demo_plan_starter')}</SelectItem>
            <SelectItem value="growth">{t('gallery.label_demo_plan_growth')}</SelectItem>
            <SelectItem value="scale">{t('gallery.label_demo_plan_scale')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="gallery-new-client" defaultChecked={true} />
        <Label htmlFor="gallery-new-client">{t('gallery.label_demo_new_client')}</Label>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="gallery-disabled" disabled={true} />
        <Label htmlFor="gallery-disabled" className="opacity-60">
          {t('gallery.label_demo_email_hint')}
        </Label>
      </div>

      <div className="grid gap-2">
        <p id="gallery-method-heading" className="text-sm font-medium">
          {t('gallery.label_demo_payment_method')}
        </p>
        <RadioGroup
          defaultValue="transfer"
          aria-labelledby="gallery-method-heading"
          className="grid gap-2"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="card" id="gallery-method-card" />
            <Label htmlFor="gallery-method-card">{t('gallery.label_demo_method_card')}</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="transfer" id="gallery-method-transfer" />
            <Label htmlFor="gallery-method-transfer">
              {t('gallery.label_demo_method_transfer')}
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex items-center gap-2">
        <Switch id="gallery-newsletter" defaultChecked={true} />
        <Label htmlFor="gallery-newsletter">{t('gallery.label_demo_newsletter')}</Label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="default">{t('common.action_save')}</Button>
        <Button variant="secondary">{t('common.action_cancel')}</Button>
        <Button variant="outline">{t('common.action_retry')}</Button>
        <Button variant="ghost">{t('common.action_refresh')}</Button>
        <Button variant="link">{t('common.action_learn_more')}</Button>
        <Button variant="destructive">{t('common.action_delete')}</Button>
        <Button variant="default" disabled={true}>
          {t('common.action_apply')}
        </Button>
        <Button variant="default" size="icon" aria-label={t('common.action_add')}>
          <Plus aria-hidden="true" />
        </Button>
        <Button variant="outline" size="icon" aria-label={t('common.action_search')}>
          <Search aria-hidden="true" />
        </Button>
        <Button variant="ghost" size="icon" aria-label={t('common.label_more_options')}>
          <MoreHorizontal aria-hidden="true" />
        </Button>
        <Button variant="default" size="sm">
          {t('common.action_filter')}
        </Button>
        <Button variant="default" size="lg">
          {t('common.action_continue')}
        </Button>
      </div>
    </section>
  );
}
