// path: components/ui/icon-button.tsx
'use client';

import { Button, type ButtonProps } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { t, type EnglishStringKey } from '@/lib/i18n';
import { cn } from '@/lib/utils/cn';

/**
 * IconButton: a button whose label is a name, not a word on screen.
 *
 * The accessibility rule is one line - every icon button has an `aria-label` -
 * and the reason it is broken so often is that the label is the one thing a
 * sighted developer cannot see missing. So the label is a required prop here
 * rather than an optional attribute: an icon button that does not name itself
 * does not compile, and the naming comes from the catalogue because every other
 * user-facing word in the product does.
 *
 * Two decisions worth stating:
 *
 *   - **`label` is the accessible name; `tooltip` is the sighted hint.** They
 *     are usually the same word, so passing `label` alone gives a control that
 *     announces itself and shows the same text on hover and on focus. A caller
 *     that needs a longer hint - "Remove this line, it cannot be undone" -
 *     passes `tooltip` and keeps the name short.
 *   - **The icon is hidden from assistive technology.** The drawing is
 *     decoration; the name is the information. An exposed icon adds nothing a
 *     screen reader can use and doubles the length of every control list.
 *
 * The touch target is the button's own: `size="icon"` is the 44 pixel square
 * the design system mandates, so an icon control is never the small one.
 */
export interface IconButtonProps extends Omit<ButtonProps, 'children' | 'size' | 'aria-label'> {
  /** Catalogue key of the accessible name. Required: this is the whole point. */
  readonly labelKey: EnglishStringKey;
  /** The drawing. Decoration only; the name above is what is announced. */
  readonly icon: React.ReactNode;
  /** Catalogue key of a longer hint, when the name is not enough. */
  readonly tooltipKey?: EnglishStringKey;
}

export function IconButton({
  labelKey,
  tooltipKey,
  icon,
  className,
  ...props
}: IconButtonProps): React.ReactElement {
  const label = t(labelKey);
  const button = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      data-icon-button="true"
      className={cn('rounded-md', className)}
      {...props}
    >
      <span aria-hidden="true" className="flex items-center justify-center">
        {icon}
      </span>
    </Button>
  );

  if (tooltipKey === undefined) {
    return button;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent>{t(tooltipKey)}</TooltipContent>
    </Tooltip>
  );
}
