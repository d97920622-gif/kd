// path: components/layout/shell-slots.tsx
import { t, type EnglishStringKey } from '@/lib/i18n';
import { cn } from '@/lib/utils/cn';

/**
 * The attachment points a shell offers for the chrome that arrives in
 * sub-step 1.21: a top bar, a sidebar, a footer and a mobile bottom bar.
 *
 * Why slots instead of rendering the chrome here. The chrome is not built yet,
 * and the two wrong ways to wait for it are both expensive: rendering an empty
 * `<nav>` now leaves a landmark with nothing in it, which a screen reader
 * announces as an empty navigation region, and a labelled placeholder box is
 * the kind of scaffolding that survives into production because it looks
 * intentional. A slot is neither: the shell asks for a node, and when no node
 * is given there is no element, no landmark and no empty region.
 *
 * Each slot renders the element its role requires, and only when it is filled:
 *
 *   - the top bar is a `header`, because it is the banner of the page;
 *   - the sidebar and the bottom bar are `nav` landmarks, each with its own
 *     accessible name, because two navigations on one page with the same name
 *     are indistinguishable in a screen reader's landmark list;
 *   - the footer is a `footer`, which is where a reader looks for the legal
 *     links and the version.
 *
 * The slot containers carry no spacing of their own: the shell owns the
 * layout, the slot owns the content, and a component that arrives with margins
 * baked in is a component that cannot be reused anywhere else.
 */
export interface ShellSlotsProps {
  /**
   * Whether this frame may paint navigation at all.
   *
   * The shells pass what the framing table says for the reader's role, and an
   * unresolved reader passes false. It is not an access rule - navigation is
   * not permission - but a frame must not offer a menu to a reader it cannot
   * name: the links would lead to routes that refuse the request, which reads
   * as a broken product rather than as a session that ended. Failing closed in
   * the frame costs nothing and removes a whole class of confusing screens.
   */
  readonly navigation?: boolean;
  readonly topBar?: React.ReactNode;
  readonly sidebar?: React.ReactNode;
  readonly footer?: React.ReactNode;
  readonly bottomBar?: React.ReactNode;
  /** Accessible name of the sidebar landmark, from the catalogue. */
  readonly sidebarLabelKey?: EnglishStringKey;
  /** Accessible name of the bottom bar landmark, from the catalogue. */
  readonly bottomBarLabelKey?: EnglishStringKey;
  readonly className?: string;
}

export function ShellTopBar({
  children,
}: {
  readonly children: React.ReactNode;
}): React.ReactElement {
  return <header className="w-full">{children}</header>;
}

export function ShellSidebar({
  children,
  labelKey,
}: {
  readonly children: React.ReactNode;
  readonly labelKey: EnglishStringKey;
}): React.ReactElement {
  return (
    <nav aria-label={t(labelKey)} className="w-full md:w-auto">
      {children}
    </nav>
  );
}

export function ShellBottomBar({
  children,
  labelKey,
}: {
  readonly children: React.ReactNode;
  readonly labelKey: EnglishStringKey;
}): React.ReactElement {
  return (
    <nav aria-label={t(labelKey)} className="w-full">
      {children}
    </nav>
  );
}

export function ShellFooter({
  children,
}: {
  readonly children: React.ReactNode;
}): React.ReactElement {
  return <footer className="w-full">{children}</footer>;
}

/**
 * The four slots in the order they surround the content.
 *
 * Exported as a component rather than repeated in each shell for one reason:
 * three shells that each assemble the same four slots in their own way is
 * three places for the order to drift, and the order is exactly what the next
 * sub-step has to be able to trust. A shell passes the slots it has and this
 * component places them around the content.
 */
export function ShellSlots({
  navigation = false,
  topBar,
  sidebar,
  footer,
  bottomBar,
  sidebarLabelKey,
  bottomBarLabelKey,
  children,
  className,
}: ShellSlotsProps & { readonly children: React.ReactNode }): React.ReactElement {
  // A slot that is handed a node but not allowed to render it is dropped
  // silently and on purpose: the alternative is a shell that throws because a
  // caller passed more than the frame allows, which turns a presentation rule
  // into a runtime failure on a page whose only real problem is a session that
  // ended.
  const showSidebar = navigation && sidebar !== undefined;
  const showBottomBar = navigation && bottomBar !== undefined;

  return (
    <div className={cn('flex min-h-dvh flex-col', className)}>
      {topBar === undefined ? null : <ShellTopBar>{topBar}</ShellTopBar>}
      <div className="flex flex-1 flex-col md:flex-row">
        {showSidebar ? (
          <ShellSidebar labelKey={sidebarLabelKey ?? 'shells.label_nav_workspace'}>
            {sidebar}
          </ShellSidebar>
        ) : null}
        {children}
      </div>
      {footer === undefined ? null : <ShellFooter>{footer}</ShellFooter>}
      {showBottomBar ? (
        <ShellBottomBar labelKey={bottomBarLabelKey ?? 'shells.label_nav_workspace'}>
          {bottomBar}
        </ShellBottomBar>
      ) : null}
    </div>
  );
}
