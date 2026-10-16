// path: app/(dev)/layout.tsx
import { notFound } from 'next/navigation';

import { isDevelopment } from '@/lib/env/validate-env';

/**
 * Shell for the development-only surfaces, of which there is one: the
 * component gallery.
 *
 * The guard is the point of this file. The gallery renders every component,
 * including the internal and experimental ones a customer should never see,
 * and it is a development tool rather than a product surface. Outside the
 * development environment the route answers 404, so a production deployment
 * cannot be read as a component inventory and the page cannot be mistaken for
 * an unfinished feature.
 *
 * The layout itself is deliberately thin: the gallery page owns its own
 * spacing, and the real product layouts (public, auth, dashboard, admin,
 * client portal) arrive in sub-steps 1.19 and 1.20.
 */
export default function DevelopmentLayout({
  children,
}: {
  readonly children: React.ReactNode;
}): React.ReactElement {
  if (!isDevelopment()) {
    notFound();
  }

  return <div className="min-h-screen bg-background text-foreground">{children}</div>;
}
