import classNames from "classnames";
import { Code, XCircle } from "lucide-react";

import { Collapsible, CollapsibleTrigger } from "@hanzo/ui";
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
      className={classNames(
        "border border-border rounded-xl p-1.5 pr-3 max-w-max hover:brightness-110 transition-all duration-200 ease-in-out !cursor-pointer",
        {
          "!cursor-pointer": !isAiWorking,
          "opacity-50 !cursor-not-allowed": isAiWorking,
        }
      )}
      disabled={isAiWorking}
      onClick={() => {
        if (!isAiWorking && onDelete) {
          onDelete();
        }
      }}
    >
      <CollapsibleTrigger className="flex items-center justify-start gap-2 cursor-pointer">
        <div className="rounded-lg bg-muted size-6 flex items-center justify-center">
          <Code className="text-muted-foreground size-3.5" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          {element.textContent?.trim().split(/\s+/)[0]} {htmlTagToText(tagName)}
        </p>
        <XCircle className="text-muted-foreground size-4" />
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
