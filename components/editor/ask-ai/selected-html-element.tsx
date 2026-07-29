'use client';

import { XStack, Paragraph } from '@hanzo/gui';
import { Code, XCircle } from "lucide-react";

import { Collapsible, CollapsibleTrigger } from '@hanzo/ui';
import { htmlTagToText } from "@/lib/html-tag-to-text";

export const SelectedHtmlElement = ({
  element,
  isAiWorking = false,
  onDelete,
}: {
  element: HTMLElement | null;
  isAiWorking: boolean;
  onDelete?: () => void;
}) => {
  if (!element) return null;

  const tagName = element.tagName.toLowerCase();
  return (
    <Collapsible
      borderWidth={1} borderColor="$borderColor" borderRadius="$6" padding="$1.5" paddingRight="$3" maxWidth="max-content" {...{ cursor: isAiWorking ? "not-allowed" : !isAiWorking ? "pointer" : "pointer", opacity: isAiWorking ? 0.5 : undefined }}
      disabled={isAiWorking}
      onClick={() => {
        if (!isAiWorking && onDelete) {
          onDelete();
        }
      }}
    >
      <CollapsibleTrigger alignItems="center" justifyContent="flex-start" gap="$2" cursor="pointer">
        <XStack borderRadius="$5" backgroundColor="$color3" width="$5" height="$5" alignItems="center" justifyContent="center">
          <Code size={14} color="$color11" />
        </XStack>
        <Paragraph fontSize="$3" fontWeight="500" color="$color11">
          {element.textContent?.trim().split(/\s+/)[0]} {htmlTagToText(tagName)}
        </Paragraph>
        <XCircle size={16} color="$color11" />
      </CollapsibleTrigger>
      {/* <CollapsibleContent className="border-t border-border pt-2 mt-2">
        <div className="text-xs text-muted-foreground">
          <p>
            <span className="font-medium">ID:</span> {element.id || "No ID"}
          </p>
          <p>
            <span className="font-medium">Classes:</span>{" "}
            {element.className || "No classes"}
          </p>
        </div>
      </CollapsibleContent> */}
    </Collapsible>
  );
};
