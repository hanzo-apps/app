"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useRef, useEffect } from "react";
import classNames from "classnames";
import { toast } from "sonner";
import { useLocalStorage, useUpdateEffect } from "react-use";
import { ArrowUp, ChevronDown, Crosshair } from "lucide-react";
import { FaStopCircle } from "react-icons/fa";

import ProModal from "@/components/pro-modal";
import { Button } from "@hanzo/ui";
import { MODELS } from "@/lib/providers";
import { HtmlHistory, Page, Project } from "@/types";
// import { InviteFriends } from "@/components/invite-friends";
import { Settings } from "@/components/editor/ask-ai/settings";
import { LoginModal } from "@/components/login-modal";
import { ReImagine } from "@/components/editor/ask-ai/re-imagine";
import Loading from "@/components/loading";
import { Checkbox } from "@hanzo/ui";
import { Tooltip, TooltipTrigger } from "@hanzo/ui";
import { TooltipContent } from "@radix-ui/react-tooltip";
import { SelectedHtmlElement } from "./selected-html-element";
import { FollowUpTooltip } from "./follow-up-tooltip";
import { isTheSameHtml } from "@/lib/compare-html-diff";
import { useCallAi } from "@/hooks/useCallAi";
import { SelectedFiles } from "./selected-files";
import { Uploader } from "./uploader";

export function AskAI({
  isNew,
  project,
  images,
  currentPage,
  previousPrompts,
  onScrollToBottom,
  isAiWorking,
  setisAiWorking,
  isEditableModeEnabled = false,
  pages,
  htmlHistory,
  selectedElement,
  setSelectedElement,
  selectedFiles,
  setSelectedFiles,
  setIsEditableModeEnabled,
  onNewPrompt,
  onSuccess,
  setPages,
  setCurrentPage,
}: {
  project?: Project | null;
  currentPage: Page;
  images?: string[];
  pages: Page[];
  onScrollToBottom: () => void;
  previousPrompts: string[];
  isAiWorking: boolean;
  onNewPrompt: (prompt: string) => void;
  htmlHistory?: HtmlHistory[];
  setisAiWorking: React.Dispatch<React.SetStateAction<boolean>>;
  isNew?: boolean;
  onSuccess: (page: Page[], p: string, n?: number[][]) => void;
  isEditableModeEnabled: boolean;
  setIsEditableModeEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  selectedElement?: HTMLElement | null;
  setSelectedElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
  selectedFiles: string[];
  setSelectedFiles: React.Dispatch<React.SetStateAction<string[]>>;
  setPages: React.Dispatch<React.SetStateAction<Page[]>>;
  setCurrentPage: React.Dispatch<React.SetStateAction<string>>;
}) {
  const refThink = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [provider, setProvider] = useLocalStorage("provider", "auto");
  const [model, setModel] = useLocalStorage("model", MODELS[0].value);
  const [openProvider, setOpenProvider] = useState(false);
  const [providerError, setProviderError] = useState("");
  const [openProModal, setOpenProModal] = useState(false);
  const [openThink, setOpenThink] = useState(false);
  const [isThinking, setIsThinking] = useState(true);
  const [think, setThink] = useState("");
  const [isFollowUp, setIsFollowUp] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<string[]>(images ?? []);

  // Message queue state
  const [messageQueue, setMessageQueue] = useState<Array<{id: string; message: string; timestamp: Date}>>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  const {
    callAiNewProject,
    callAiFollowUp,
    callAiNewPage,
    stopController,
    audio: hookAudio,
  } = useCallAi({
    onNewPrompt,
    onSuccess,
    onScrollToBottom,
    setPages,
    setCurrentPage,
    currentPage,
    pages,
    isAiWorking,
    setisAiWorking,
  });

  const selectedModel = useMemo(() => {
    return MODELS.find((m: { value: string }) => m.value === model);
  }, [model]);

  const callAi = async (redesignMarkdown?: string, queuedPrompt?: string) => {
    // If AI is working, add to queue instead of blocking
    if (isAiWorking && prompt.trim() && !queuedPrompt) {
      const newMessage = {
        id: `msg-${Date.now()}-${Math.random()}`,
        message: prompt,
        timestamp: new Date()
      };
      setMessageQueue(prev => [...prev, newMessage]);
      setPrompt("");
      return;
    }

    // Use queued prompt if provided, otherwise use current prompt
    const promptToUse = queuedPrompt || prompt;

    if (!redesignMarkdown && !promptToUse.trim()) return;

    if (isFollowUp && !redesignMarkdown && !isSameHtml) {
      // Use follow-up function for existing projects
      const selectedElementHtml = selectedElement
        ? selectedElement.outerHTML
        : "";

      const result = await callAiFollowUp(
        promptToUse,
        model,
        provider,
        previousPrompts,
        selectedElementHtml,
        selectedFiles
      );

      if (result?.error) {
        handleError(result.error, result.message);
        return;
      }

      if (result?.success) {
        if (!queuedPrompt) {
          setPrompt("");
        }
      }
    } else if (isFollowUp && pages.length > 1 && isSameHtml) {
      const result = await callAiNewPage(
        promptToUse,
        model,
        provider,
        currentPage.path,
        [
          ...(previousPrompts ?? []),
          ...(htmlHistory?.map((h) => h.prompt) ?? []),
        ]
      );
      if (result?.error) {
        handleError(result.error, result.message);
        return;
      }

      if (result?.success) {
        if (!queuedPrompt) {
          setPrompt("");
        }
      }
    } else {
      const result = await callAiNewProject(
        promptToUse,
        model,
        provider,
        redesignMarkdown,
        handleThink,
        () => {
          setIsThinking(false);
        }
      );

      if (result?.error) {
        handleError(result.error, result.message);
        return;
      }

      if (result?.success) {
        if (!queuedPrompt) {
          setPrompt("");
        }
        if (selectedModel?.isThinker) {
          setModel(MODELS[0].value);
        }
      }
    }
  };

  const handleThink = (think: string) => {
    setThink(think);
    setIsThinking(true);
    setOpenThink(true);
  };

  const handleError = (error: string, message?: string) => {
    switch (error) {
      case "login_required":
        setOpen(true);
        break;
      case "provider_required":
        setOpenProvider(true);
        setProviderError(message || "");
        break;
      case "pro_required":
        setOpenProModal(true);
        break;
      case "api_error":
        toast.error(message || "An error occurred");
        break;
      case "network_error":
        toast.error(message || "Network error occurred");
        break;
      default:
        toast.error("An unexpected error occurred");
    }
  };

  // Process message queue when AI stops working
  useEffect(() => {
    if (!isAiWorking && messageQueue.length > 0 && !isProcessingQueue) {
      setIsProcessingQueue(true);
      const nextMessage = messageQueue[0];
      setMessageQueue(prev => prev.slice(1));

      // Small delay to ensure state updates properly
      setTimeout(() => {
        callAi(undefined, nextMessage.message).finally(() => {
          setIsProcessingQueue(false);
        });
      }, 500);
    }
  }, [isAiWorking, messageQueue, isProcessingQueue]);

  // Handle initial prompt for new projects
  useEffect(() => {
    if (isNew && typeof window !== 'undefined') {
      // Check for initial prompt stored by AppEditor
      const initialPrompt = (window as any).__initialPrompt;
      if (initialPrompt) {
        // Clean up the global variable
        delete (window as any).__initialPrompt;

        // Set the prompt
        setPrompt(initialPrompt);

        // Trigger generation after a short delay to ensure everything is mounted
        const timer = setTimeout(() => {
          // Call the AI directly here instead of relying on another effect
          if (!isAiWorking) {
            callAi();
          }
        }, 500);

        return () => clearTimeout(timer);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew]);

  useUpdateEffect(() => {
    if (refThink.current) {
      refThink.current.scrollTop = refThink.current.scrollHeight;
    }
  }, [think]);

  useUpdateEffect(() => {
    if (!isThinking) {
      setOpenThink(false);
    }
  }, [isThinking]);

  const isSameHtml = useMemo(() => {
    return isTheSameHtml(currentPage.html);
  }, [currentPage.html]);

  return (
    <div className="px-3">
      {/* Stacked Message Queue Cards */}
      {messageQueue.length > 0 && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#fd4444] font-medium">
              Queued Messages ({messageQueue.length})
            </span>
            <button
              onClick={() => setMessageQueue([])}
              className="text-xs text-[#fd4444] hover:text-[#ff6b6b] underline"
            >
              Clear all
            </button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {messageQueue.map((msg, index) => (
              <div
                key={msg.id}
                className="relative bg-neutral-800/50 border border-[#fd4444]/20 rounded-lg p-3 animate-slideIn"
                style={{
                  animationDelay: `${index * 0.05}s`,
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-gray-300 flex-1">{msg.message}</p>
                  <button
                    onClick={() => setMessageQueue(prev => prev.filter(m => m.id !== msg.id))}
                    className="text-gray-500 hover:text-gray-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-500">
                    {msg.timestamp.toLocaleTimeString()}
                  </span>
                  {index === 0 && (
                    <span className="text-xs text-[#fd4444] flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-[#fd4444] rounded-full animate-pulse" />
                      Next in queue
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>

      <div className="relative bg-neutral-800 border border-neutral-700 rounded-2xl ring-[4px] focus-within:ring-neutral-500/30 focus-within:border-neutral-600 ring-transparent z-10 w-full group">
        {think && (
          <div className="w-full border-b border-neutral-700 relative overflow-hidden">
            <header
              className="flex items-center justify-between px-5 py-2.5 group hover:bg-neutral-600/20 transition-colors duration-200 cursor-pointer"
              onClick={() => {
                setOpenThink(!openThink);
              }}
            >
              <p className="text-sm font-medium text-neutral-300 group-hover:text-neutral-200 transition-colors duration-200">
                {isThinking ? "Hanzo is thinking..." : "Hanzo's plan"}
              </p>
              <ChevronDown
                className={classNames(
                  "size-4 text-neutral-400 group-hover:text-neutral-300 transition-all duration-200",
                  {
                    "rotate-180": openThink,
                  }
                )}
              />
            </header>
            <main
              ref={refThink}
              className={classNames(
                "overflow-y-auto transition-all duration-200 ease-in-out",
                {
                  "max-h-[0px]": !openThink,
                  "min-h-[250px] max-h-[250px] border-t border-neutral-700":
                    openThink,
                }
              )}
            >
              <p className="text-[13px] text-neutral-400 whitespace-pre-line px-5 pb-4 pt-3">
                {think}
              </p>
            </main>
          </div>
        )}
        <SelectedFiles
          files={selectedFiles}
          isAiWorking={isAiWorking}
          onDelete={(file) =>
            setSelectedFiles((prev) => prev.filter((f) => f !== file))
          }
        />
        {selectedElement && (
          <div className="px-4 pt-3">
            <SelectedHtmlElement
              element={selectedElement}
              isAiWorking={isAiWorking}
              onDelete={() => setSelectedElement(null)}
            />
          </div>
        )}
        <div className="w-full relative flex items-center justify-between">
          {(isAiWorking || isUploading) && (
            <div className="absolute top-0 left-4 right-12 h-8 z-10 flex items-center justify-between pointer-events-none">
              <div className="flex items-center justify-start gap-2 bg-neutral-800 px-2 py-1 rounded-md">
                <Loading overlay={false} className="!size-3 opacity-50" />
                <p className="text-neutral-400 text-xs">
                  {isUploading ? (
                    "Uploading images..."
                  ) : isAiWorking && !isSameHtml ? (
                    <>
                      AI is working...
                      {messageQueue.length > 0 && (
                        <span className="ml-1 text-[#fd4444]">
                          ({messageQueue.length} queued)
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="inline-flex">
                      {[
                        "H",
                        "a",
                        "n",
                        "z",
                        "o",
                        " ",
                        "i",
                        "s",
                        " ",
                        "T",
                        "h",
                        "i",
                        "n",
                        "k",
                        "i",
                        "n",
                        "g",
                        ".",
                        ".",
                        ".",
                        " ",
                        "W",
                        "a",
                        "i",
                        "t",
                        " ",
                        "a",
                        " ",
                        "m",
                        "o",
                        "m",
                        "e",
                        "n",
                        "t",
                        ".",
                        ".",
                        ".",
                      ].map((char, index) => (
                        <span
                          key={index}
                          className="bg-gradient-to-r from-neutral-100 to-neutral-300 bg-clip-text text-transparent animate-pulse"
                          style={{
                            animationDelay: `${index * 0.1}s`,
                            animationDuration: "1.3s",
                            animationIterationCount: "infinite",
                          }}
                        >
                          {char === " " ? "\u00A0" : char}
                        </span>
                      ))}
                      {messageQueue.length > 0 && (
                        <span className="ml-2 text-[#fd4444]">
                          ({messageQueue.length} queued)
                        </span>
                      )}
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
          <textarea
            disabled={isUploading}
            className={classNames(
              "w-full bg-transparent text-sm outline-none text-white placeholder:text-neutral-400 p-4 resize-none",
              {
                "!pt-2.5": selectedElement && !isAiWorking,
                "opacity-100": isAiWorking && !isUploading,
              }
            )}
            placeholder={
              isAiWorking && messageQueue.length > 0
                ? "Type your message... (will be queued)"
                : selectedElement
                ? `Ask Hanzo about ${selectedElement.tagName.toLowerCase()}...`
                : isFollowUp && (!isSameHtml || pages?.length > 1)
                ? "Ask Hanzo for edits"
                : "Ask Hanzo anything..."
            }
            value={prompt}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                callAi();
              }
            }}
          />
        </div>
        <div className="flex items-center justify-between gap-2 px-4 pb-3 mt-2">
          <div className="flex-1 flex items-center justify-start gap-1.5">
            <Uploader
              pages={pages}
              onLoading={setIsUploading}
              isLoading={isUploading}
              onFiles={setFiles}
              onSelectFile={(file) => {
                if (selectedFiles.includes(file)) {
                  setSelectedFiles((prev) => prev.filter((f) => f !== file));
                } else {
                  setSelectedFiles((prev) => [...prev, file]);
                }
              }}
              files={files}
              selectedFiles={selectedFiles}
              project={project}
            />
            {isNew && <ReImagine onRedesign={(md) => callAi(md)} />}
            {!isSameHtml && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="xs"
                    variant={isEditableModeEnabled ? "default" : "outline"}
                    onClick={() => {
                      setIsEditableModeEnabled?.(!isEditableModeEnabled);
                    }}
                    className={classNames("h-[28px]", {
                      "!text-neutral-400 hover:!text-neutral-200 !border-neutral-600 !hover:!border-neutral-500":
                        !isEditableModeEnabled,
                    })}
                  >
                    <Crosshair className="size-4" />
                    Edit
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  align="start"
                  className="bg-neutral-950 text-xs text-neutral-200 py-1 px-2 rounded-md -translate-y-0.5"
                >
                  Select an element on the page to ask Hanzo edit it
                  directly.
                </TooltipContent>
              </Tooltip>
            )}
            {/* <InviteFriends /> */}
          </div>
          <div className="flex items-center justify-end gap-2">
            <Settings
              provider={provider as string}
              model={model as string}
              onChange={setProvider}
              onModelChange={setModel}
              open={openProvider}
              error={providerError}
              isFollowUp={!isSameHtml && isFollowUp}
              onClose={setOpenProvider}
            />
            {isAiWorking ? (
              <Button
                size="iconXs"
                variant="destructive"
                onClick={stopController}
                className="gap-1"
              >
                <FaStopCircle className="size-4" />
              </Button>
            ) : (
              <Button
                size="iconXs"
                disabled={isUploading || !prompt.trim()}
                onClick={() => callAi()}
                className={messageQueue.length > 0 ? "bg-[#fd4444] hover:bg-[#e03e3e]" : ""}
              >
                <ArrowUp className="size-4" />
              </Button>
            )}
          </div>
        </div>
        <LoginModal open={open} onClose={() => setOpen(false)} pages={pages} />
        <ProModal
          pages={pages}
          open={openProModal}
          onClose={() => setOpenProModal(false)}
        />
        {pages.length === 1 && (
          <div className="border border-sky-500/20 bg-sky-500/40 hover:bg-sky-600 transition-all duration-200 text-sky-500 pl-2 pr-4 py-1.5 text-xs rounded-full absolute top-0 -translate-y-[calc(100%+8px)] left-0 max-w-max flex items-center justify-start gap-2">
            <span className="rounded-full text-[10px] font-semibold bg-white text-neutral-900 px-1.5 py-0.5">
              NEW
            </span>
            <p className="text-sm text-neutral-100">
              Hanzo can now create multiple pages at once. Try it!
            </p>
          </div>
        )}
        {!isSameHtml && (
          <div className="absolute top-0 right-0 -translate-y-[calc(100%+8px)] select-none text-xs text-neutral-400 flex items-center justify-center gap-2 bg-neutral-800 border border-neutral-700 rounded-md p-1 pr-2.5">
            <label
              htmlFor="diff-patch-checkbox"
              className="flex items-center gap-1.5 cursor-pointer"
            >
              <Checkbox
                id="diff-patch-checkbox"
                checked={isFollowUp}
                onCheckedChange={(e: boolean | "indeterminate") => {
                  if (e === true && !isSameHtml && selectedModel?.isThinker) {
                    setModel(MODELS[0].value);
                  }
                  setIsFollowUp(e === true);
                }}
              />
              Diff-Patch Update
            </label>
            <FollowUpTooltip />
          </div>
        )}
      </div>
      <audio ref={hookAudio} id="audio" className="hidden">
        <source src="/success.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}
