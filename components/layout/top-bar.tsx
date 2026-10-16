// path: components/layout/top-bar.tsx
import { LogoMark } from '@/components/branding/logo-mark';
import { t, type EnglishStringKey } from '@/lib/i18n';
import { cn } from '@/lib/utils/cn';

/**
 * TopBar: the bar across the top of a workspace or a platform surface.
 *
 * It carries four things and refuses to carry a fifth. Leading: the control
 * that opens the drawer on a phone, or the workspace's own mark on a desktop.
 * Middle: where the reader is, which on a nested screen is the breadcrumb trail
 * rather than a second navigation. Trailing: the actions a reader reaches for
 * from anywhere - search, notifications, the account menu - as a slot, because
 * those controls belong to the steps that build them (the command palette is
 * sub-step 1.23, the account menu arrives with the session in step 3).
 *
 * What it refuses to carry is a second copy of the navigation. A top bar with
 * module links beside a rail with the same links is two answers to one
 * question, and the reader has to check both to be sure they agree.
 *
 * **Positioning is owned by the shell, not by this component.** The sticky
 * behaviour and the z-index belong to `ShellTopBar` in shell-slots.tsx, which
 * also declares the `header` landmark. Splitting it the other way - a sticky
 * `header` inside a non-sticky wrapper - is the mistake that makes a bar scroll
 * away: a sticky child stops sticking at the bottom edge of its parent, so the
 * parent has to be the sticky element.
 *
 * The brand mark links home. On a workspace screen "home" is the workspace
 * root, on a platform screen it is the platform root, and both are the same
 * gesture for the reader. When no `homeHref` is given the mark is a plain
 * mark rather than a link to nowhere.
 */
export interface TopBarProps {
  /** Leading control: the drawer trigger on a phone. Hidden from `md` up. */
  readonly leading?: React.ReactNode;
  /** Where the reader is: a breadcrumb trail, a page title, or both. */
  readonly children?: React.ReactNode;
  /** Trailing controls: search, notifications, the account menu. */
  readonly trailing?: React.ReactNode;
  /** Where the mark goes. Omitted when there is nowhere to go yet. */
  readonly homeHref?: string;
  /** Accessible name of the home link, when the mark is one. */
  readonly homeLabelKey?: EnglishStringKey;
  readonly className?: string;
}

export function TopBar({
  leading,
  children,
  trailing,
  homeHref,
  homeLabelKey = 'shells.label_brand_home',
  className,
}: TopBarProps): React.ReactElement {
  const mark = <LogoMark size={32} variant="glyph" />;

  return (
    <div
      data-layout="topbar"
      className={cn('flex min-h-touch w-full items-center gap-3 px-4 py-2', className)}
    >
      {leading === undefined ? null : (
        <div className="flex shrink-0 items-center md:hidden">{leading}</div>
      )}

      <div className="flex min-w-0 shrink-0 items-center gap-3">
        {homeHref === undefined ? (
          <span className="flex size-8 items-center justify-center text-primary">{mark}</span>
        ) : (
          <a
            href={homeHref}
            aria-label={t(homeLabelKey)}
            className="flex min-h-touch min-w-touch items-center justify-center gap-2 rounded-md px-1 text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span className="flex size-8 items-center justify-center text-primary">{mark}</span>
            <span className="hidden lg:inline">{t('brand.name')}</span>
          </a>
        )}
      </div>

      <div className="flex min-w-0 flex-1 items-center">{children}</div>

      {trailing === undefined ? null : (
        <div className="flex shrink-0 items-center gap-2">{trailing}</div>
      )}
    </div>
  );
}
