'use client';

/**
 * /projects — the org-scoped projects dashboard.
 *
 * Reads the ONE shared `/v1/projects` store (the same records console.hanzo.ai
 * shows). Every project belongs to the selected org; a signed-in user with no
 * org is gated into onboarding first (a project is never created org-less).
 */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import Header from '@/components/layout/header';
import { OrgProvider, useOrg } from '@/lib/org/client';
import { OrgGate } from '@/components/org-switcher';
import { ProjectList } from '@/components/project-manager/ProjectList';

function ProjectsInner() {
  const { ctx, loading } = useOrg();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !ctx) router.replace('/login?redirect=/projects');
  }, [loading, ctx, router]);

  if (!loading && !ctx) return null; // redirecting to sign-in

  return (
    <OrgGate>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-bold">Projects</h1>
        <ProjectList />
      </div>
    </OrgGate>
  );
}

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />
      <OrgProvider>
        <ProjectsInner />
      </OrgProvider>
    </div>
  );
}
