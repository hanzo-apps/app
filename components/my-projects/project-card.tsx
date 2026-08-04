'use client';

import { YStack, XStack, Paragraph } from '@hanzo/gui';
import Link from "next/link";
import { formatDistance } from "date-fns";
import { EllipsisVertical, Settings } from "lucide-react";

import { Project } from "@/types";
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@hanzo/ui';

export function ProjectCard({ project }: { project: Project }) {
  return (
    <YStack rowGap="$4" group cursor="pointer">
      <Link
        href={`/projects/${project.space_id}`}
      ><YStack position="relative" backgroundColor="$background" borderRadius="$8" overflow="hidden" height="$18" width="100%" alignItems="center" justifyContent="flex-end" paddingHorizontal="$3" borderWidth={1} borderColor="$borderColor">
        <iframe
          src={`/v1/preview/${project.space_id}`}
          frameBorder="0"
          className="thumb-frame"
        ></iframe>

        <Button
          variant="default"
          width="100%" y="100%" $group-hover={{ y: "$-3" }}
        >
          Open project
        </Button>
      </YStack></Link>
      <XStack alignItems="flex-start" justifyContent="space-between" gap="$3">
        <div>
          <Paragraph color="$color" fontSize="$4" fontWeight="500" numberOfLines={1}>
            {project.space_id}
          </Paragraph>
          <Paragraph fontSize="$3" color="$color11">
            Updated{" "}
            {formatDistance(
              new Date(project._updatedAt || Date.now()),
              new Date(),
              {
                addSuffix: true,
              }
            )}
          </Paragraph>
        </div>
        <DropdownMenu placement="bottom-start">
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <EllipsisVertical size={20} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent width={224}>
            <DropdownMenuGroup>
              <a
                href={`/projects/${project.space_id}/settings`}
              >
                <DropdownMenuItem>
                  <Settings size={16} />
                  Project Settings
                </DropdownMenuItem>
              </a>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </XStack>
    </YStack>
  );
}
