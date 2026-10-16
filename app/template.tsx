// path: app/template.tsx
import { PageTransition } from '@/components/motion/page-transition';

/**
 * The one place a navigation is animated.
 *
 * Next.js remounts a `template.tsx` on every navigation under it, which is
 * exactly the lifetime a page transition needs: it enters with the new page and
 * leaves with it. A layout is the wrong place for the same reason - layouts are
 * preserved across navigations so that the chrome around a page does *not*
 * re-animate on every click.
 *
 * The transition is a component rather than a class list here because the
 * reduced-motion decision is the reader's, and only a client component can read
 * it. The module stays a server component: it renders one client boundary and
 * hands it the page, so nothing below it is pulled into the client bundle by
 * being wrapped.
 *
 * There is also a deliberate negative here: the transition does not fade the
 * page *out* on the way to the next route. An exit animation holds the old page
 * on screen until it finishes, which on a slow device reads as a stall on every
 * click - and the App Router has already swapped the content by the time this
 * mounts.
 */
export default function RootTemplate({
  children,
}: {
  readonly children: React.ReactNode;
}): React.ReactElement {
  return <PageTransition>{children}</PageTransition>;
}
