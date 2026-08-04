"use client";

/**
 * FileTree — the editor's file browser (Code view, left rail).
 *
 * A vertical, IDE-style list of the project's files (the editor's `pages` — each
 * a real file the project ships to S3). Replaces the old horizontal page-tab
 * strip so a user can SEE and navigate every file, add a new one, and
 * rename/delete inline — the "where are my files" gap. Selecting a file loads it
 * into the code editor on the right.
 *
 * Honest scope: this lists the files the editor holds. A single-file app shows
 * one file (that is genuinely all it has); a multi-page app shows them all.
 */

import { Button, Input } from '@hanzo/ui';
import { YStack, XStack, SizableText, Paragraph } from '@hanzo/gui';
import { useState } from "react";
import { FileCode2, Plus, Trash2, Check, X, Pencil } from "lucide-react";
import { Page } from "@/types";
export function FileTree({
  pages,
  currentPage,
  onSelectPage,
  onNewPage,
  onDeletePage,
}: {
  pages: Page[];
  currentPage: string;
  onSelectPage: (path: string, newPath?: string) => void;
  onNewPage: () => void;
  onDeletePage: (path: string) => void;
}) {
  const [renaming, setRenaming] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const startRename = (path: string) => {
    setRenaming(path);
    setDraft(path);
  };
  const commitRename = (path: string) => {
    const next = draft.trim();
    if (next && next !== path) onSelectPage(path, next);
    setRenaming(null);
  };

  return (
    <YStack height="100%" width="$19" flexShrink={0} borderRightWidth={1} borderColor="$borderColor" backgroundColor="$background">
      <XStack alignItems="center" justifyContent="space-between" paddingHorizontal="$3" paddingVertical="$2.5">
        <SizableText fontFamily="$mono" fontSize={10} textTransform="uppercase" letterSpacing={2.24} color="$color11">
          Files
        </SizableText>
        <Button
          type="button"
          onClick={onNewPage}
          title="New file"
          height="$4.5" width="$4.5" alignItems="center" justifyContent="center" borderRadius="$2" {...{ color: "$color11" }} hoverStyle={{ backgroundColor: "$color3" }} focusVisibleStyle={{ outlineWidth: 0 }}
        >
          <Plus size={14} />
        </Button>
      </XStack>

      <YStack minHeight={0} flex={1} paddingHorizontal="$1.5" paddingBottom="$2" overflow="scroll">
        {pages.map((page) => {
          const active = page.path === currentPage;
          const isRenaming = renaming === page.path;
          return (
            <XStack
              key={page.path}
              group alignItems="center" gap="$1.5" borderRadius="$3" paddingHorizontal="$2" paddingVertical="$1.5" backgroundColor={active ? "$color3" : undefined} hoverStyle={active ? undefined : { backgroundColor: "white" }}
            >
              <FileCode2 size={14} color="$color11" />
              {isRenaming ? (
                <Input
                  autoFocus
                  value={draft}
                  onChangeText={(value) => setDraft(value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename(page.path);
                    if (e.key === "Escape") setRenaming(null);
                  }}
                  onBlur={() => commitRename(page.path)}
                  minWidth={0} flex={1} borderRadius="$2" backgroundColor="$background" paddingHorizontal="$1" paddingVertical="$0.5" fontFamily="$mono" fontSize={12} color="$color" outlineWidth={0}
  />
              ) : (
                <Button
                  type="button"
                  onClick={() => onSelectPage(page.path)}
                  minWidth={0} flex={1}
                  title={page.path}
                >
                  <SizableText flex={1} minWidth={0} numberOfLines={1} textAlign="left" fontFamily="$mono" fontSize={13} color={active ? "$color" : "$color11"} $group-hover={{ color: "$color" }}>{page.path}</SizableText>
                </Button>
              )}

              {isRenaming ? (
                <Button
                  type="button"
                  onClick={() => commitRename(page.path)}
                  flexShrink={0} {...{ color: "$color11" }}
                >
                  <Check size={12} />
                </Button>
              ) : (
                <XStack flexShrink={0} alignItems="center" gap="$0.5" opacity={0} $group-hover={{ opacity: 1 }}>
                  <Button
                    type="button"
                    onClick={() => startRename(page.path)}
                    title="Rename"
                    {...{ color: "$color11" }}
                  >
                    <Pencil size={12} />
                  </Button>
                  {pages.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => onDeletePage(page.path)}
                      title="Delete"
                      {...{ color: "$color11" }}
                    >
                      <Trash2 size={12} />
                    </Button>
                  )}
                </XStack>
              )}
            </XStack>
          );
        })}
        {pages.length === 0 && (
          <YStack alignItems="center" gap="$2" paddingHorizontal="$3" paddingVertical="$6">
            <X size={16} color="$color11" />
            <Paragraph fontSize={11} color="$color11">No files yet.</Paragraph>
          </YStack>
        )}
      </YStack>
    </YStack>
  );
}
