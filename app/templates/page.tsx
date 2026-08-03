'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/layout/header';
import SiteFooter from '@/components/landing/site-footer';
import { TemplatesView } from '@/components/views/templates-view';
import { builderLink } from '@/lib/api/projects';

/**
 * /templates — browse the starters and launch one. PUBLIC.
 *
 * Public because browsing is how someone decides Hanzo is worth an account, and
 * a starter gallery behind a login is a locked shop window. It wears the site
 * chrome (Header + SiteFooter) rather than `AppShell` for the same reason
 * /community does: the signed-in sidebar — Dashboard, Connectors, Settings — is
 * meaningless to a visitor who has none of it, and mounting it is precisely what
 * makes a route protected (middleware + tests/unit/protected-routes).
 *
 * Launching still requires an account, and that is the right seam: a card forks
 * into the builder at /dev, which bounces through /login and returns to the same
 * place. Browse freely, sign in at the moment you actually need to.
 */
export default function TemplatesPage() {
  const router = useRouter();
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">
        <TemplatesView
          onProjectSelect={(project) => router.push(builderLink(project.id))}
          onNavigate={(view) => router.push(view.startsWith('/') ? view : `/${view}`)}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
