"use client";
import { YStack, XStack, SizableText, H1, Paragraph } from '@hanzo/ui';
import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useUser } from "@/hooks/useUser";
import { Project } from "@/types";
import { redirect } from "next/navigation";
import { ProjectCard } from "./project-card";
import { LoadProject } from "./load-project";

export function MyProjects({
  projects: initialProjects,
}: {
  projects: Project[];
}) {
  // All hooks must be called unconditionally before any conditional returns
  const { user } = useUser();
  const [projects, setProjects] = useState<Project[]>(initialProjects || []);

  // Conditional redirect after all hooks are called
  if (!user) {
    redirect("/");
  }
  return (
    <>
      <YStack maxWidth="86rem" paddingVertical="$8" paddingHorizontal="$4" alignSelf="center">
        <XStack alignItems="center" justifyContent="space-between" gap="$4" $lg={{ flexDirection: "column" }}>
          <YStack>
            <H1 fontSize="$10" fontWeight="500" color="$color">
              <SizableText textTransform="capitalize">{user.fullname || user.name || 'Your'}</SizableText>&apos;s
              Hanzo Projects
            </H1>
            <Paragraph color="$color11" fontSize="$4" marginTop="$1" maxWidth={576}>
              Create, manage, and explore your Hanzo projects.
            </Paragraph>
          </YStack>
          <LoadProject
            fullXsBtn
            onSuccess={(project: Project) => {
              setProjects((prev) => [...prev, project]);
            }}
  />
        </XStack>
        <YStack marginTop="$6" gap="$6">
          <Link
            href="/new"
          ><XStack backgroundColor="$background" borderRadius="$6" height="$18" alignItems="center" justifyContent="center" gap="$2" borderWidth={1} borderColor="$borderColor">
            <Plus size={20} />
            <SizableText color="$color11">Create Project</SizableText>
          </XStack></Link>
          {projects.map((project: Project) => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </YStack>
      </YStack>
    </>
  );
}
