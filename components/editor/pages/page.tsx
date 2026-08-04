'use client';

import { SizableText } from '@hanzo/gui';
import { XIcon } from "lucide-react";

import { Button } from '@hanzo/ui';
import { Page } from "@/types";

export function ListPagesItem({
  page,
  currentPage,
  onSelectPage,
  onDeletePage,
  index,
}: {
  page: Page;
  currentPage: string;
  onSelectPage: (path: string, newPath?: string) => void;
  onDeletePage: (path: string) => void;
  index: number;
}) {
  return (
    <SizableText
      key={index}
      paddingLeft="$5" paddingVertical="$3" cursor="pointer" fontSize="$3" alignItems="center" justifyContent="center" gap="$1" group whiteSpace="nowrap" borderRightWidth={1} borderColor="$borderColor" display="flex" flexDirection="row" hoverStyle={{ backgroundColor: "$background" }} {...{ backgroundColor: currentPage === page.path ? "$background" : undefined, color: currentPage === page.path ? "$color" : "$color11", paddingRight: index === 0 ? "$5" : "$1" }}
      onClick={() => onSelectPage(page.path)}
    >
            {page.path}
      {index > 0 && (
        <Button
          size="icon"
          variant="ghost"
          opacity={0} $group-hover={{ opacity: 1 }}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            if (
              window.confirm(
                "Are you sure you want to delete this page? This action cannot be undone."
              )
            ) {
              onDeletePage(page.path);
            }
          }}
        >
          <XIcon size={12} />
        </Button>
      )}
    </SizableText>
  );
}
