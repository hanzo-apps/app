"use client";

import { LoadingScreen } from "@/components/ui/loading-screen";
/**
 * /projects — the "All projects" view, in the SAME app shell as the dashboard.
 *
 * Previously this lived in the (public) marketing group and rendered the
 * marketing nav (no sidebar) — inconsistent chrome vs /dashboard. Now it wraps
 * the org-scoped ProjectList in <AppShell> so the sidebar/header/account chrome
 * is identical across every app view (dashboard, projects, starred, …). One
 * shell, one look, everywhere.
 */

import { YStack, H1 } from '@hanzo/gui';
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useUser } from "@/hooks/useUser";
import { AppShell } from "@/components/app-shell";
import { ProjectList } from "@/components/project-manager/ProjectList";

export default function ProjectsPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login?redirect=/projects");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <LoadingScreen>{loading ? "Loading your projects…" : "Redirecting to login…"}</LoadingScreen>
    );
  }

  return (
    <AppShell currentView="all-projects">
      <YStack flex={1} backgroundColor="$background" overflow="scroll">
        <YStack alignSelf="center" maxWidth={1152} paddingHorizontal="$4" paddingVertical="$6" $sm={{ paddingHorizontal: "$5" }} $lg={{ paddingVertical: "$7" }}>
          <H1 marginBottom="$5" fontSize="$8" fontWeight="500" letterSpacing={-0.4} color="$color">
            Projects
          </H1>
          {/* Sidebar already renders the org switcher — suppress the duplicate in
              the list toolbar so there's one org control, not two. */}
          <ProjectList showOrgSwitcher={false} />
        </YStack>
      </YStack>
    </AppShell>
  );
}
