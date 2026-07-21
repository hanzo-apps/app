"use client";

/**
 * /projects — the "All projects" view, in the SAME app shell as the dashboard.
 *
 * Previously this lived in the (public) marketing group and rendered the
 * marketing nav (no sidebar) — inconsistent chrome vs /dashboard. Now it wraps
 * the org-scoped ProjectList in <AppShell> so the sidebar/header/account chrome
 * is identical across every app view (dashboard, projects, starred, …). One
 * shell, one look, everywhere.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useUser } from "@/hooks/useUser";
import { AppShell } from "@/components/app-shell";
import { HanzoLogo } from "@/components/HanzoLogo";
import { ProjectList } from "@/components/project-manager/ProjectList";

export default function ProjectsPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login?redirect=/projects");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <HanzoLogo className="mx-auto mb-4 h-12 w-12 animate-pulse text-foreground" />
          <p className="text-muted-foreground">
            {loading ? "Loading your projects…" : "Redirecting to login…"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <AppShell currentView="all-projects">
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
          <h1 className="mb-6 text-2xl font-medium tracking-tight text-foreground">
            Projects
          </h1>
          {/* Sidebar already renders the org switcher — suppress the duplicate in
              the list toolbar so there's one org control, not two. */}
          <ProjectList showOrgSwitcher={false} />
        </div>
      </div>
    </AppShell>
  );
}
