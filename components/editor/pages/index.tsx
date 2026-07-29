'use client';

import { XStack } from '@hanzo/gui';
import { Page } from "@/types";
import { ListPagesItem } from "./page";

export function ListPages({
  pages,
  currentPage,
  onSelectPage,
  onDeletePage,
}: {
  pages: Array<Page>;
  currentPage: string;
  onSelectPage: (path: string, newPath?: string) => void;
  onNewPage: () => void;
  onDeletePage: (path: string) => void;
}) {
  return (
    <XStack width="100%" alignItems="center" justifyContent="flex-start" backgroundColor="$background" overflow="scroll" flexWrap="nowrap" minHeight={44}>
      {pages.map((page, i) => (
        <ListPagesItem
          key={i}
          page={page}
          currentPage={currentPage}
          onSelectPage={onSelectPage}
          onDeletePage={onDeletePage}
          index={i}
  />
      ))}
    </XStack>
  );
}
