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

import { XStack, SizableText, Paragraph, YStack, H1 } from '@hanzo/gui';
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
      <XStack minHeight="100%" alignItems="center" justifyContent="center" backgroundColor="$background">
        <SizableText textAlign="center" display="flex" flexDirection="column">
          <HanzoLogo className="mx-auto mb-4 h-12 w-12 animate-pulse text-foreground" />
          <Paragraph color="$color11">
            {loading ? "Loading your projects…" : "Redirecting to login…"}
          </Paragraph>
        </SizableText>
      </XStack>
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
