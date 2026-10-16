// path: components/layout/auth-shell.tsx
import { LogoMark } from '@/components/branding/logo-mark';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils/cn';

import { MainContent } from './main-content';
import { SkipLink } from './skip-link';

/**
 * AuthShell: the frame the sign-in, sign-up and account-recovery pages share.
 *
 * These pages are the worst possible place for noise. The reader is either
 * arriving for the first time, or locked out of an account, and in both cases
 * every link that is not the form is a way to lose them. So the shell offers
 * exactly three things: the brand mark so they know which product they are
 * looking at, one panel for the form, and nothing else. No navigation, no
 * marketing footer, no cookie banner competing with the fields.
 *
 * The panel is centred on a tall screen and stacked from the top on a short
 * one, which matters most on a phone with the keyboard open: a vertically
 * centred form inside a small viewport pushes its first field under the
 * keyboard, so the layout uses viewport-safe height and lets the panel scroll
 * rather than centring it absolutely.
 *
 * The panel width comes from the layout width scale (max-w-dialog, 32rem),
 * not from a one-off value: a sign-in form is the same measure as a dialog,
 * and the scale exists so that two surfaces built a month apart agree.
 *
 * The mark above the panel is decorative here. The page's own heading names
 * the action ("Sign in"), and a screen reader announcing the product name
 * again before it would be noise, so the mark carries no accessible name.
 *
 * The skip link is still first, even though the chrome is minimal: the panel
 * can be preceded by a help link and a language switch on some auth screens,
 * and the contract should not change when they appear.
 */
export interface AuthShellProps {
  readonly children: React.ReactNode;
  /** Layout classes for the panel itself. */
  readonly panelClassName?: string;
}

export function AuthShell({ children, panelClassName }: AuthShellProps): React.ReactElement {
  return (
    <div className="print-flow flex min-h-dvh flex-col bg-background text-foreground">
      <SkipLink />
      <MainContent className="flex w-full flex-col items-center justify-start gap-section px-gutter py-section sm:justify-center">
        <LogoMark size={48} variant="glyph" className="text-primary" />
        <div
          className={cn(
            'w-full max-w-dialog rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm',
            panelClassName,
          )}
        >
          {children}
        </div>
        <p className="max-w-dialog text-center text-sm text-muted-foreground">
          {t('brand.description')}
        </p>
      </MainContent>
    </div>
  );
}
