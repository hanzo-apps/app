'use client';

import type { ElementInfo } from "../preview/bridge";
import { XStack, Paragraph } from '@hanzo/ui';
import { Code, XCircle } from "lucide-react";

import { Collapsible, CollapsibleTrigger } from '@hanzo/ui';
import { htmlTagToText } from "@/lib/html-tag-to-text";

export const SelectedHtmlElement = ({
  element,
  isAiWorking = false,
  onDelete,
}: {
  element: ElementInfo | null;
  isAiWorking: boolean;
  onDelete?: () => void;
}) => {
  if (!element) return null;

  const tagName = element.tagName;
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
      {/* The row is an XStack, not the trigger's own props.
        *
        * CollapsibleTrigger ACCEPTS alignItems/justifyContent/gap — they type-check
        * and they are even applied — but it does not lay out as a row, so with the
        * three children directly inside it they stacked: a 150x190 tower of icon
        * over label over close button where a one-line pill belongs. alignItems
        * on a column cross-axis centres them horizontally, which is why it looked
        * deliberate rather than broken.
        *
        * These are gui primitives, not DOM elements: a prop that reads like a flex
        * attribute may be honoured on an axis you did not intend. State the
        * direction with the primitive that owns it. */}
      <CollapsibleTrigger cursor="pointer">
        <XStack flexDirection="row" alignItems="center" justifyContent="flex-start" gap="$2">
          <XStack borderRadius="$5" backgroundColor="$color3" width="$5" height="$5" alignItems="center" justifyContent="center">
            <Code size={14} />
          </XStack>
          <Paragraph fontSize="$3" fontWeight="500" color="$color11" numberOfLines={1}>
            {element.text?.trim().split(/\s+/)[0]} {htmlTagToText(tagName)}
          </Paragraph>
          <XCircle size={16} />
        </XStack>
      </CollapsibleTrigger>
          </Collapsible>
  );
};
