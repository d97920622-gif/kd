// path: components/layout/role-frame.tsx
import { t } from '@/lib/i18n';

import { framingFor, type PlatformRole } from './role-framing';

/**
 * RoleFrame: the persistent band above the content that tells the reader where
 * they are, when where they are is not obvious from the page.
 *
 * Two cases earn a band, and both are about acting on other people's data:
 *
 *   - A reader inside platform administration is one click from changing
 *     another business's records. The band says so, and it is the reason a
 *     screenshot of an admin screen is never mistaken for a customer screen.
 *   - A reader whose work is reviewed before it takes effect needs to know
 *     that before they spend effort, not after. The notice is a single line:
 *     who reviews, and what that means.
 *
 * The band is a landmark-free region: `role="status"` is wrong here because
 * nothing changed, and `role="alert"` is worse because nothing is wrong. It is
 * ordinary content at the top of the shell, announced in reading order, which
 * is exactly what a reader who lands in the middle of the page needs.
 *
 * The colours come from the verified contrast pairs only: the platform band is
 * the warning surface with its matching foreground, the notice is text on the
 * canvas. No frame invents a colour, which is what lets it survive the
 * high-contrast themes without a second stylesheet.
 *
 * The band is hidden in print. A printed document is archived and shown to
 * people who did not see the screen it came from, and a line reading "platform
 * administration" on a customer's invoice would be alarming and wrong.
 */
export interface RoleFrameProps {
  readonly role: PlatformRole | null;
}

export function RoleFrame({ role }: RoleFrameProps): React.ReactElement | null {
  const framing = framingFor(role);
  if (framing === null || (framing.bannerTitleKey === null && framing.noticeKey === null)) {
    return null;
  }

  return (
    <div
      data-role="role-frame"
      data-audience={framing.audience}
      className="grid gap-2"
      data-print="hide"
    >
      {framing.bannerTitleKey !== null && framing.bannerMessageKey !== null ? (
        <div className="flex flex-wrap items-baseline gap-2 rounded-md bg-warning px-4 py-3 text-base text-warning-foreground">
          <p className="font-semibold">{t(framing.bannerTitleKey)}</p>
          <p>{t(framing.bannerMessageKey)}</p>
        </div>
      ) : null}

      {framing.noticeKey !== null ? (
        <p className="rounded-md bg-muted px-4 py-3 text-base text-muted-foreground">
          {t(framing.noticeKey)}
        </p>
      ) : null}
    </div>
  );
}
