"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { YStack, XStack, SizableText, Paragraph, type GuiElement } from '@hanzo/gui';
import { useState, useMemo, useRef, useEffect } from "react";
import { toast, Button, DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger, Tooltip, TooltipTrigger, TooltipContent, Textarea } from '@hanzo/ui';
import { useLocalStorage } from "react-use";
import { ArrowUp, CircleStop, ImagePlus, MoreHorizontal, X } from "lucide-react";

import ProModal from "@/components/pro-modal";
import { useUsageLimit } from "@/components/usage/usage-limit";
import { useModels } from "@/lib/hooks/use-models";
import { useRoutingDefaults } from "@/lib/hooks/use-routing-defaults";
import { AUTO_MODEL, isDeadModelId, isSmartRouting, resolveSmartRouting } from "@/lib/providers";
import { HtmlHistory, Page, Project } from "@/types";
// import { InviteFriends } from "@/components/invite-friends";
import { Settings } from "@/components/editor/ask-ai/settings";
import { LoginModal } from "@/components/login-modal";
import { ReImagine } from "@/components/editor/ask-ai/re-imagine";
import { imageFilesFrom, uploadProjectImages } from "@/lib/upload-project-images";
import {
  addReferenceImages,
  mergeReferenceImages,
  referenceImagesKey,
} from "@/lib/reference-images";
import Loading from "@/components/loading";
import { SelectedHtmlElement } from "./selected-html-element";
import { isTheSameHtml } from "@/lib/compare-html-diff";
import { useCallAi } from "@/hooks/useCallAi";
import { sendRewardSignal, getLastGenerationRequestId } from "@/lib/reward-signal";
import { SelectedFiles } from "./selected-files";
import { Uploader } from "./uploader";
import { offer } from "./mic";
import { sentence } from "./sentence";
import { ChatThread, type ThreadMessage } from "./chat-thread";
import { isConversational } from "./intent";
import { useVoice, speech } from "@hanzo/voice";

// The builder's ear and voice, lent the caller's IAM session by the app's own
// `/v1/audio/*` proxy — so the browser never carries a gateway token.
//
// Measured 2026-07-26: the gateway resolves /v1/audio/* through IAM and does not
// yet accept a hanzo.id bearer with `aud: hanzo-app` (401 — the same 401 that
// makes /v1/models fall back to its offline ladder; it is not audio-specific).
// That costs the platform VOICE, not the conversation: the browser's own
// recogniser still gives a live transcript and its own voice reads the reply,
// and this upgrades itself the day the gateway accepts that audience.
const HANZO_SPEECH = speech({ baseUrl: "" });

// Fix mode composes this short, human intent preamble in front of the user's
// text (empty text is fine when references are attached). The reference images
// ride the UNCHANGED follow-up `files` path — Fix adds no new API surface.
const FIX_PREAMBLE =
  "Fix the current design to match the attached reference. Change only what differs from the reference; keep what already matches.";


// Contextual next-step suggestions shown as dismissible chips above the composer
// (Lovable parity). Honest, app-agnostic starters — clicking one sends it as a
// message in the current mode (Plan discusses it, Build executes it). Dynamic,
// app-state-derived suggestions are a future refinement on top of this set.
const SUGGESTIONS = [
  "Review security",
  "Review SEO",
  "Improve accessibility",
  "Make it responsive",
  "Add a contact form",
];

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
  const { models, defaultModel, loading: modelsLoading } = useModels();
  const routingDefaults = useRoutingDefaults();

  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [provider, setProvider] = useLocalStorage("provider", "auto");
  // The persisted `model` is the user OVERRIDE: `AUTO_MODEL` = smart routing on,
  // a concrete id = routing off, unset = follow the org default. A NEW session
  // (unset) opens on the org's server-driven default (`/v1/routing-defaults`) —
  // Auto when the org defaults routing on, else the concrete default model.
  // With no org policy known that is DEFAULT_MODEL — a new session opens on
  // Enso, the rung that picks best, not on the separate `auto` router.
  const [storedModel, setModel] = useLocalStorage<string>("model");
  // A dead id persisted by an older build (e.g. a retired `gpt-*-codex`) is
  // treated as UNSET so we open on smart-routing/default instead of sending an
  // unavailable model — the cause of "The model didn't return a usable page".
  const safeStoredModel =
    storedModel && !isDeadModelId(storedModel) ? storedModel : undefined;
  const smartOn = resolveSmartRouting(
    safeStoredModel == null ? null : isSmartRouting(safeStoredModel),
    routingDefaults
  ).enabled;
  const model = safeStoredModel ?? (smartOn ? AUTO_MODEL : defaultModel);
  const [routedModel, setRoutedModel] = useState<string | null>(null);
  const [openProvider, setOpenProvider] = useState(false);
  const [providerError, setProviderError] = useState("");
  const [openProModal, setOpenProModal] = useState(false);
  // The ONE "Need more usage?" modal — raised on an out-of-credit (402) signal
  // from a metered generation instead of failing silently.
  const { raise: raiseUsageLimit } = useUsageLimit();
  // Diff-patch (follow-up) updates are now simply the default — the toggle chip
  // + explainer popover were removed (no one toggled it). Always on.
  const [isFollowUp] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<string[]>(images ?? []);
  // Fix mode: ONE flag. While on, the generate call is prefixed with a
  // fix-intent preamble and the send guard accepts a references-only submit.
  const [isFixMode, setIsFixMode] = useState(false);

  // The working modes currently on. ONE list: it names the overflow control,
  // drives its accent, and is its aria-label — the states cannot drift apart.
  const modes = useMemo(
    () =>
      [
        isEditableModeEnabled && "Select an element",
        isFixMode && "Match a reference",
      ].filter(Boolean) as string[],
    [isEditableModeEnabled, isFixMode]
  );
  const [isDragging, setIsDragging] = useState(false);

  // Composer mode (Lovable parity): "build" generates/patches the app (default);
  // "plan" is a conversational back-and-forth that DOESN'T touch the app — the
  // model discusses/plans, then the user flips to Build to execute. Persisted.
  const [mode, setMode] = useLocalStorage<"build" | "plan">("composer-mode", "build");
  const isPlan = mode === "plan";

  // Honor the Build/Plan choice handed off from the landing / dashboard composer
  // (localStorage.initialMode). Applied ONCE on mount then cleared, so it seeds the
  // builder without overriding later manual toggles — mirrors the initialPrompt
  // handoff. Before this, choosing "Plan" on the landing was silently dropped.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handoff = localStorage.getItem("initialMode");
    if (handoff === "build" || handoff === "plan") {
      setMode(handoff);
      localStorage.removeItem("initialMode");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Suggestion chips: dismissible per project (persisted). Clicking a chip sends
  // it straight as a message (respecting the mode), without touching the box.
  const [suggestionsDismissed, setSuggestionsDismissed] = useLocalStorage<boolean>(
    `suggestions-dismissed:${project?.space_id ?? "new"}`,
    false
  );

  // Post-remix drop-in: pending integrations the remix handoff (localStorage
  // `remixSetup`) asked us to surface as connect/skip chips above the composer.
  const [remixPending, setRemixPending] = useState<
    Array<{ name: string; connectUrl?: string; skippable?: boolean }>
  >([]);

  // Resizable composer (item 17): the input area's height is user-draggable from
  // a grip on its top edge and auto-grows with content until the user overrides.
  // Persisted per project; clamped to [1 line, 40% of the pane].
  const COMPOSER_MIN_H = 44;
  const [savedComposerH, setSavedComposerH] = useLocalStorage<number>(
    `composer-height:${project?.space_id ?? "new"}`,
    0
  );
  const [composerH, setComposerH] = useState(COMPOSER_MIN_H);
  const composerHRef = useRef(COMPOSER_MIN_H);
  const manualResizeRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const rootRef = useRef<GuiElement>(null);

  const maxComposerH = () => {
    const el = rootRef.current;
    const base =
      el && "clientHeight" in el
        ? el.clientHeight
        : typeof window !== "undefined"
          ? window.innerHeight
          : 800;
    return Math.max(COMPOSER_MIN_H, Math.round(base * 0.4));
  };
  const setComposerHeight = (h: number, persist: boolean) => {
    const clamped = Math.min(maxComposerH(), Math.max(COMPOSER_MIN_H, Math.round(h)));
    composerHRef.current = clamped;
    setComposerH(clamped);
    if (persist) setSavedComposerH(clamped);
  };

  // Per-project reference-image history, persisted like the ask-ai settings
  // (namespaced localStorage). Backs the uploader's "past images" picker so a
  // drop / paste / upload survives a reload before the server list refetches.
  const [history, setHistory] = useLocalStorage<string[]>(
    referenceImagesKey(project?.space_id),
    []
  );

  // ONE way to grow the library: union into the in-session list + persist to the
  // per-project history. Attaching (drop / paste / pick) also selects them.
  const addToLibrary = (urls: string[]) => {
    if (urls.length === 0) return;
    setFiles((prev) => mergeReferenceImages(prev, urls));
    setHistory((prev) => addReferenceImages(prev ?? [], urls));
  };
  const attachRefs = (urls: string[]) => {
    if (urls.length === 0) return;
    addToLibrary(urls);
    setSelectedFiles((prev) => mergeReferenceImages(prev, urls));
  };

  // Drop / paste ingest: reuse the ONE upload path + the "Uploading images..."
  // affordance, then attach the references to the current prompt.
  const ingestFiles = async (imgs: File[]) => {
    if (imgs.length === 0) return;
    if (!project?.space_id) {
      toast.error("Publish your project first to attach reference images.");
      return;
    }
    setIsUploading(true);
    const urls = await uploadProjectImages(project.space_id, imgs);
    if (urls.length) attachRefs(urls);
    else toast.error("Couldn't upload image(s). Please try again.");
    setIsUploading(false);
  };

  const isFileDrag = (e: React.DragEvent) =>
    Array.from(e.dataTransfer?.types ?? []).includes("Files");
  const handleDragOver = (e: React.DragEvent) => {
    if (isFileDrag(e)) e.preventDefault();
  };
  const handleDragEnter = (e: React.DragEvent) => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    // Ignore leave events fired while crossing into a child of the card.
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setIsDragging(false);
    }
  };
  const handleDrop = (e: React.DragEvent) => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    setIsDragging(false);
    void ingestFiles(imageFilesFrom(e.dataTransfer.files));
  };
  const handlePaste = (e: React.ClipboardEvent) => {
    const imgs = imageFilesFrom(e.clipboardData?.files ?? null);
    if (imgs.length === 0) return; // let a normal text paste through
    e.preventDefault();
    void ingestFiles(imgs);
  };

  // Message queue state
  const [messageQueue, setMessageQueue] = useState<Array<{id: string; message: string; timestamp: Date}>>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  // Chat thread — the single source of truth for what's shown ABOVE the
  // composer: the user's submitted bubbles and the assistant's live plan/build
  // turn. Every send appends a user message + an assistant placeholder that the
  // ONE /v1/generate stream mutates through planning → building → done/error.
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const activeAssistantId = useRef<string | null>(null);
  const activeStartedAt = useRef<number>(0);
  // "stream" = a full generation whose pages stream in live (drives the build
  // activity from the `pages` prop); "edit" = a diff-patch follow-up (JSON, no
  // live pages). null between turns.
  const activeTurnKind = useRef<"stream" | "edit" | null>(null);

  const genId = () =>
    `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  const updateAssistant = (id: string | null, patch: Partial<ThreadMessage>) => {
    if (!id) return;
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  // Append the user bubble + a fresh assistant placeholder; return the
  // assistant id so the caller can settle it when the generation finishes.
  const beginTurn = (userText: string, streaming: boolean) => {
    const aid = genId();
    activeAssistantId.current = aid;
    activeStartedAt.current = Date.now();
    activeTurnKind.current = streaming ? "stream" : "edit";
    setMessages((prev) => [
      ...prev,
      { id: genId(), role: "user", text: userText },
      {
        id: aid,
        role: "assistant",
        phase: streaming ? "planning" : "building",
        plan: streaming ? "" : undefined,
        activity: streaming ? [] : ["Applying edits"],
      },
    ]);
    return aid;
  };

  const elapsed = () =>
    Math.max(1, Math.round((Date.now() - activeStartedAt.current) / 1000));

  const finishTurn = (id: string, phase: "done" | "error", text: string) => {
    updateAssistant(id, { phase, text });
    if (activeAssistantId.current === id) {
      activeAssistantId.current = null;
      activeTurnKind.current = null;
    }
  };

  // Plan mode: append the user bubble + a streaming assistant CHAT bubble.
  const beginChatTurn = (userText: string) => {
    const aid = genId();
    activeAssistantId.current = aid;
    activeStartedAt.current = Date.now();
    activeTurnKind.current = "edit"; // not a streaming-pages turn
    setMessages((prev) => [
      ...prev,
      { id: genId(), role: "user", text: userText },
      { id: aid, role: "assistant", kind: "chat", phase: "building", text: "" },
    ]);
    return aid;
  };

  // Map the hook's error codes to one honest, terse thread line. Modals
  // (login/pro/provider) still open via handleError; the thread just never
  // dead-ends on a dangling "building" bubble.
  const errorText = (r: { error?: string; message?: string }) => {
    switch (r.error) {
      case "aborted":
        return "Stopped.";
      case "login_required":
        return "Sign in to continue.";
      case "pro_required":
        return "Upgrade to continue.";
      case "need_credits":
        return "You're out of credits.";
      case "provider_required":
        return r.message || "Choose a provider to continue.";
      default:
        return r.message || "Something went wrong — please try again.";
    }
  };

  const {
    callAiNewProject,
    callAiFollowUp,
    callAiNewPage,
    callAiChat,
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

  // Hydrate the in-session library with the persisted per-project history once
  // on mount (client-only, so no SSR/client mismatch on the server `images`).
  useEffect(() => {
    if (history && history.length) {
      setFiles((prev) => mergeReferenceImages(prev, history));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the persisted selection valid against the live gateway list: if the
  // stored model is no longer served (or a fresh session has none), fall back to
  // the gateway's default. This is the ONE place the selection is reconciled.
  useEffect(() => {
    if (
      !modelsLoading &&
      models.length > 0 &&
      model !== AUTO_MODEL &&
      (!model || !models.some((m) => m.value === model))
    ) {
      setModel(defaultModel);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelsLoading, models, model, defaultModel]);

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

    // Fix mode: a references-only submit is valid, otherwise a non-empty prompt
    // is still required. The mode composes the fix preamble in front of the text.
    const fixSubmit = isFixMode && !redesignMarkdown;
    if (
      !redesignMarkdown &&
      !promptToUse.trim() &&
      !(fixSubmit && selectedFiles.length > 0)
    )
      return;
    const effectivePrompt = fixSubmit
      ? promptToUse.trim()
        ? `${FIX_PREAMBLE}\n\n${promptToUse.trim()}`
        : FIX_PREAMBLE
      : promptToUse;

    // Clear the composer IMMEDIATELY on a fresh (non-queued) submit — the send
    // is now reflected by the thread bubble, not by text lingering in the box
    // (which used to sit under the "AI is working…" pill). Fix is one-shot.
    if (!queuedPrompt) {
      setPrompt("");
      setIsFixMode(false);
    }

    // A conversational turn — NO build. Stream a chat reply into the thread and stop.
    // Plan mode is always conversational; Build mode is too when the message is a
    // plain question/greeting (so "what can you do" answers instead of nuking the
    // app). Re-imagine/fix are build actions; they ignore this.
    if ((isPlan || isConversational(promptToUse)) && !redesignMarkdown && !fixSubmit) {
      const chatId = beginChatTurn(promptToUse.trim());
      const result = await callAiChat(
        promptToUse.trim(),
        model,
        provider,
        previousPrompts,
        (textSoFar) => updateAssistant(chatId, { text: textSoFar, phase: "building" })
      );
      if (result?.error) {
        finishTurn(chatId, "error", errorText(result));
        handleError(result.error, result.message);
        return;
      }
      if (result?.success) {
        if (result.model) setRoutedModel(result.model);
        updateAssistant(chatId, { phase: "done" });
        activeAssistantId.current = null;
        activeTurnKind.current = null;
      }
      return;
    }

    // Pick the generation path (same conditions as before), then append the
    // user bubble + assistant placeholder BEFORE awaiting so the thread reflects
    // the send instantly.
    const useFollowUp = isFollowUp && !redesignMarkdown && !isSameHtml;
    const useNewPage =
      !useFollowUp && isFollowUp && pages.length > 1 && isSameHtml;
    const streaming = !useFollowUp; // newProject + newPage stream pages live
    const displayText = redesignMarkdown
      ? "Re-imagine this design"
      : promptToUse.trim() || "Fix the design to match the reference";
    const assistantId = beginTurn(displayText, streaming);

    if (useFollowUp) {
      // Use follow-up function for existing projects
      const selectedElementHtml = selectedElement
        ? selectedElement.outerHTML
        : "";

      const result = await callAiFollowUp(
        effectivePrompt,
        model,
        provider,
        previousPrompts,
        selectedElementHtml,
        selectedFiles
      );

      if (result?.error) {
        finishTurn(assistantId, "error", errorText(result));
        handleError(result.error, result.message);
        return;
      }

      if (result?.success) {
        if (result.model) setRoutedModel(result.model);
        const n = Array.isArray(result.updatedLines)
          ? result.updatedLines.length
          : 0;
        // Honest count: applyEdits records one entry per SEARCH block that actually
        // matched, so n === 0 means the model's edit didn't match the current page
        // and NOTHING changed. Say so (and prompt a retry) instead of the old phantom
        // "1 edit applied", which lied exactly during the refine step.
        finishTurn(
          assistantId,
          "done",
          n === 0
            ? `No changes applied — the edit didn't match this page. Try rephrasing. · ${elapsed()}s`
            : `${n} edit${n === 1 ? "" : "s"} applied · ${elapsed()}s`
        );
      }
    } else if (useNewPage) {
      const result = await callAiNewPage(
        effectivePrompt,
        model,
        provider,
        currentPage.path,
        [
          ...(previousPrompts ?? []),
          ...(htmlHistory?.map((h) => h.prompt) ?? []),
        ],
        setRoutedModel
      );
      if (result?.error) {
        finishTurn(assistantId, "error", errorText(result));
        handleError(result.error, result.message);
        return;
      }

      if (result?.success) {
        finishTurn(assistantId, "done", `Added a page · ${elapsed()}s`);
      }
    } else {
      // Regenerating a full page: when a prior generation exists, this new full
      // generation replaces it — emit a content-free "regenerate" signal keyed
      // on the OUTGOING generation's id before it is overwritten. First-time
      // generation has no prior id, so this no-ops (never fabricates one).
      sendRewardSignal(getLastGenerationRequestId(), "regenerate");

      const result = await callAiNewProject(
        effectivePrompt,
        model,
        provider,
        redesignMarkdown,
        handleThink,
        () => updateAssistant(assistantId, { phase: "building" }),
        setRoutedModel
      );

      if (result?.error) {
        finishTurn(assistantId, "error", errorText(result));
        handleError(result.error, result.message);
        return;
      }

      if (result?.success) {
        const n = Array.isArray(result.pages) ? result.pages.length : 1;
        finishTurn(
          assistantId,
          "done",
          `Built · ${n} file${n === 1 ? "" : "s"} · ${elapsed()}s`
        );
      }
    }
  };

  // ── the spoken conversation ───────────────────────────────────────────────
  //
  // The composer owns the voice because it owns all three things a conversation
  // needs: the prompt the transcript lands in, the submit path a finished turn
  // goes through, and the reply to read back. The mic itself lives on the
  // console bar and is handed this machine by `mic.ts`.
  //
  // Anything already typed is kept: the transcript is appended to it, and the
  // turn that gets sent is the whole line, exactly as if it had been typed.
  const typed = useRef<string | null>(null);
  const held = useRef(prompt);
  held.current = prompt;
  const join = (heard: string) =>
    typed.current ? `${typed.current} ${heard}` : heard;

  const voice = useVoice({
    speech: HANZO_SPEECH,
    onPartial: (heard) => {
      if (typed.current === null) typed.current = held.current.trim();
      setPrompt(join(heard));
    },
    onUtterance: (said) => {
      const turn = join(said);
      typed.current = null;
      // The EXISTING submit path — voice is a way of typing, not a way of sending.
      callAi(undefined, turn);
    },
  });

  // The console bar draws it.
  useEffect(() => offer(voice), [voice]);

  // Read the settled reply back. `say` is a no-op outside a conversation, so a
  // typed turn stays silent without asking anyone here whether it was spoken.
  const read = useRef<string | null>(null);
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant" || last.phase !== "done") return;
    if (!last.text || read.current === last.id) return;
    read.current = last.id;
    void voice.say(sentence(last.text));
  }, [messages, voice]);

  // Reasoning stream → the active turn's plan card (streamed live, monochrome
  // shimmer while designing). Only callAiNewProject emits <think>.
  const handleThink = (thinkText: string) => {
    updateAssistant(activeAssistantId.current, {
      plan: thinkText,
      phase: "planning",
    });
  };

  // Suggestion chip → send the suggestion as a message in the current mode
  // (never clobbers whatever the user has typed in the composer).
  const runSuggestion = (text: string) => {
    if (isAiWorking) return;
    callAi(undefined, text);
  };

  // Remix integration chips — Connect opens the connector (new tab, so the
  // builder isn't lost); Skip removes the chip and drops an honest system line.
  const connectIntegration = (p: { name: string; connectUrl?: string }) => {
    if (typeof window === "undefined") return;
    window.open(p.connectUrl || "/connectors", "_blank", "noopener,noreferrer");
  };
  const skipIntegration = (name: string) => {
    setRemixPending((prev) => prev.filter((p) => p.name !== name));
    setMessages((prev) => [
      ...prev,
      { id: genId(), role: "system", text: `Skipped connecting ${name}` },
    ]);
  };

  // Composer auto-grow: fit the textarea to its content until the user manually
  // resizes (which pins the height). Clamped to [1 line, 40% of the pane].
  const autoGrowComposer = () => {
    const el = textareaRef.current;
    if (!el || manualResizeRef.current) return;
    el.style.height = "auto";
    setComposerHeight(Math.max(COMPOSER_MIN_H, el.scrollHeight), false);
  };

  // Top-edge drag handle → resize the input area (up = taller). Pointer events
  // cover mouse + touch; the height persists per project on release.
  const onResizePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    manualResizeRef.current = true;
    const startY = e.clientY;
    const startH = composerHRef.current;
    const onMove = (ev: PointerEvent) =>
      setComposerHeight(startH + (startY - ev.clientY), false);
    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      setSavedComposerH(composerHRef.current);
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  };
  const nudgeComposer = (delta: number) => {
    manualResizeRef.current = true;
    setComposerHeight(composerHRef.current + delta, true);
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
      case "need_credits":
        raiseUsageLimit();
        break;
      case "api_error":
        toast.error(message || "An error occurred");
        break;
      case "empty_response":
        toast.error(
          message ||
            "The model replied without a page. Try a different model, or check your credits at pay.hanzo.ai."
        );
        break;
      case "network_error":
        toast.error(message || "Network error occurred");
        break;
      case "aborted":
        // User pressed Stop — silent by design (no stuck spinner, no toast).
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

  // Handle initial prompt (dashboard/landing composer, ?prompt=, or a template
  // seed) for new projects. The seed is AUTO-SUBMITTED straight into the thread
  // — it appears as a fully-submitted user bubble and the composer stays EMPTY.
  // No prefill ever: it is passed EXPLICITLY as the queuedPrompt so callAi's
  // `queuedPrompt || prompt` sends the real seed (setPrompt is async, so relying
  // on the composer state would submit nothing — the old stale-closure bug).
  useEffect(() => {
    if (isNew && typeof window !== 'undefined') {
      const initialPrompt = (window as any).__initialPrompt;
      if (initialPrompt) {
        delete (window as any).__initialPrompt;
        const timer = setTimeout(() => {
          if (!isAiWorking) {
            callAi(undefined, initialPrompt);
          }
        }, 300);

        return () => clearTimeout(timer);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew]);

  // Template/remix EDIT arrival: a GREETING-only seed. The template's real HTML
  // is already loaded into the preview (pages), so we do NOT generate — we post
  // a friendly ASSISTANT greeting and wait for the user to ask for a change.
  // This is the "load + greet, ready to edit" path, distinct from a build-prompt
  // seed (__initialPrompt above), which auto-generates. dev/page stages this
  // BEFORE the editor mounts (behind its splash), so it's set when we read it.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const greeting = (window as any).__assistantGreeting;
    if (!greeting) return;
    delete (window as any).__assistantGreeting;
    setMessages((prev) => [
      ...prev,
      {
        id: genId(),
        role: "assistant",
        kind: "chat",
        phase: "done",
        text: String(greeting),
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Post-remix drop-in: consume the remix handoff (localStorage `remixSetup`,
  // written by the remix/dashboard flow) ONCE on mount — exactly like the
  // initialPrompt contract. Seeds the thread with a first ASSISTANT opener + a
  // provisioned system line, and surfaces the pending integrations as chips.
  // Absent handoff → nothing happens (normal seed flow).
  useEffect(() => {
    if (typeof window === "undefined") return;
    let raw: string | null = null;
    try {
      raw = localStorage.getItem("remixSetup");
      if (raw) localStorage.removeItem("remixSetup");
    } catch {
      /* storage unavailable */
    }
    if (!raw) return;
    try {
      const setup = JSON.parse(raw) as {
        firstMessage?: string;
        pending?: Array<{ name: string; connectUrl?: string; skippable?: boolean }>;
        provisioned?: string[];
      };
      const opener = (setup.firstMessage || "").trim();
      const seeded: ThreadMessage[] = [];
      if (opener)
        seeded.push({
          id: genId(),
          role: "assistant",
          kind: "chat",
          phase: "done",
          text: opener,
        });
      if (Array.isArray(setup.provisioned) && setup.provisioned.length)
        seeded.push({
          id: genId(),
          role: "system",
          text: `Provisioned: ${setup.provisioned.join(", ")}`,
        });
      if (seeded.length) setMessages((prev) => [...prev, ...seeded]);
      if (Array.isArray(setup.pending))
        setRemixPending(setup.pending.filter((p) => p && p.name));
    } catch {
      /* malformed handoff — ignore, never dead-end */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore the persisted composer height once on mount (client-only, so no
  // SSR/client style mismatch). A saved value means the user had resized it.
  useEffect(() => {
    if (savedComposerH && savedComposerH > 0) {
      manualResizeRef.current = true;
      composerHRef.current = savedComposerH;
      setComposerH(savedComposerH);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-grow the composer to fit typed content (until a manual resize pins it).
  useEffect(() => {
    autoGrowComposer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt]);

  /**
   * Is there NOTHING built yet? A property of the PROJECT, not of one page.
   *
   * This asked `isTheSameHtml(currentPage.html)` — whether the SELECTED page
   * still equals the starter document — and that answer chose between editing
   * the project and regenerating it from scratch. In a multi-page build the
   * selected page can be untouched while the rest of the site is finished, so
   * one unedited page meant the whole thing was rebuilt. Every turn. That is
   * the "it keeps starting over" report, and it survived fixing the page
   * LOOKUP because the question itself was scoped wrong.
   *
   * Now: empty only when there is no page that differs from the starter. Any
   * real page anywhere means this project exists and must be EDITED.
   */
  const isSameHtml = useMemo(() => {
    if (!pages.length) return isTheSameHtml(currentPage.html);
    return pages.every((p) => isTheSameHtml(p.html));
  }, [pages, currentPage.html]);

  // Drive the active turn's build phase + live activity from the ONE generation
  // stream: for a streaming turn (newProject/newPage), pages stay untouched
  // while reasoning streams (the hook gates page rendering on <think>), then
  // start updating once real HTML arrives — so `!isSameHtml` is the honest
  // "HTML generation has begun" signal. The plan card settles and the activity
  // list ("Writing index.html…") takes over. No second model call.
  useEffect(() => {
    if (activeTurnKind.current !== "stream") return;
    const id = activeAssistantId.current;
    if (!id || !isAiWorking || isSameHtml) return;
    updateAssistant(id, {
      phase: "building",
      activity: pages.map((p) => `Writing ${p.path}`),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSameHtml, pages, isAiWorking]);

  return (
    // The chat pane is a flex column: the thread scrolls at the top and the
    // composer is pinned at the bottom. With an empty thread (ChatThread returns
    // null) the composer's `mt-auto` keeps it docked exactly as before.
    <YStack ref={rootRef} alignSelf="center" height="100%" minHeight={0} width="100%" maxWidth={672}>
      <ChatThread messages={messages} />
      <YStack marginTop="auto" paddingHorizontal="$3" paddingBottom="calc(0.75rem+env(safe-area-inset-bottom))">
      {/* Stacked Message Queue Cards */}
      {messageQueue.length > 0 && (
        <YStack marginBottom="$4" rowGap="$2">
          <XStack alignItems="center" justifyContent="space-between" marginBottom="$2">
            <SizableText fontSize="$1" color="$color" fontWeight="500">
              Queued Messages ({messageQueue.length})
            </SizableText>
            <Button
              onClick={() => setMessageQueue([])}
            >
              <SizableText fontSize="$1" color="$color11" textDecorationLine="underline">Clear all</SizableText>
            </Button>
          </XStack>
          <YStack rowGap="$2" maxHeight={256} overflow="scroll">
            {messageQueue.map((msg, index) => (
              <YStack
                key={msg.id}
                position="relative" backgroundColor="$color3" borderWidth={1} borderColor="$borderColor" borderRadius="$5" padding="$3"
                style={{
                  animationDelay: `${index * 0.05}s`,
                }}
              >
                <XStack alignItems="flex-start" justifyContent="space-between" gap="$2">
                  <Paragraph fontSize="$3" color="$color11" flex={1}>{msg.message}</Paragraph>
                  <Button
                    onClick={() => setMessageQueue(prev => prev.filter(m => m.id !== msg.id))}
                  >
                    <SizableText color="$color11">
                      <svg width={16} height={16} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </SizableText>
                  </Button>
                </XStack>
                <XStack alignItems="center" gap="$2" marginTop="$2">
                  <SizableText fontSize="$1" color="$color11">
                    {msg.timestamp.toLocaleTimeString()}
                  </SizableText>
                  {index === 0 && (
                    <SizableText fontSize="$1" color="$color11" alignItems="center" gap="$1">
                      <YStack width="$1.5" height="$1.5" backgroundColor="$color" borderRadius="$10" />
                      Next in queue
                    </SizableText>
                  )}
                  {/* REDIRECT. Queuing waits for a build to finish, which is right
                      when you are adding to it and wrong when you are correcting
                      it — watching a wrong build run to completion before your
                      correction is even read is the whole complaint. This stops
                      the current turn and takes this message next; the queue
                      drains as usual once the abort settles. */}
                  {isAiWorking && (
                    <Button
                      onClick={() => {
                        setMessageQueue((prev) => [
                          msg,
                          ...prev.filter((m) => m.id !== msg.id),
                        ]);
                        stopController();
                      }}
                      marginLeft="auto"
                      title="Stop the current build and run this next"
                    >
                      <SizableText fontSize="$1" color="$color11" textDecorationLine="underline">Send now</SizableText>
                    </Button>
                  )}
                </XStack>
              </YStack>
            ))}
          </YStack>
        </YStack>
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

      {/* Post-remix integration chips — one connect/skip row per pending service,
          horizontally scrollable on mobile, with the Plan-mode tip. */}
      {remixPending.length > 0 && (
        <YStack marginBottom="$2" rowGap="$1.5">
          <XStack alignItems="center" gap="$1.5" overflow="scroll" className="no-scrollbar">
            {remixPending.map((p) => (
              <SizableText
                key={p.name}
                flexShrink={0} alignItems="center" gap="$1.5" borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$2.5" paddingVertical="$1" fontSize="$1" display="flex" flexDirection="row"
              >
                <SizableText whiteSpace="nowrap" color="$color">🔥 {p.name}</SizableText>
                {p.skippable !== false && (
                  <>
                    <Button
                      type="button"
                      onClick={() => skipIntegration(p.name)}
                    >
                      <SizableText color="$color11">Skip</SizableText>
                    </Button>
                    <SizableText color="$color11">·</SizableText>
                  </>
                )}
                <Button
                  type="button"
                  onClick={() => connectIntegration(p)}
                >
                  <SizableText fontWeight="500" color="$color" hoverStyle={{ textDecorationLine: "underline" }}>Connect</SizableText>
                </Button>
              </SizableText>
            ))}
          </XStack>
          <Paragraph fontSize={11} color="$color11">
            Tip: switch from Build to Plan mode to brainstorm or debug without
            code changes.
          </Paragraph>
        </YStack>
      )}

      {/* Suggestion chips — dismissible, horizontally scrollable (mobile-safe),
          monochrome. Clicking a chip sends it as a message in the current mode.
          Hidden while the AI is working and once dismissed for this project. */}
      {!suggestionsDismissed && !isAiWorking && (
        <XStack marginBottom="$2" alignItems="center" gap="$1.5">
          <XStack flex={1} alignItems="center" gap="$1.5" overflow="scroll" className="no-scrollbar scroll-fade-r">
            {SUGGESTIONS.map((s) => (
              <Button
                key={s}
                type="button"
                onClick={() => runSuggestion(s)}
                flexShrink={0} borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$3" paddingVertical="$1" hoverStyle={{ borderColor: "$color8", backgroundColor: "$color3" }}
              >
                <SizableText whiteSpace="nowrap" fontSize="$1" color="$color11">{s}</SizableText>
              </Button>
            ))}
          </XStack>
          <Button
            type="button"
            aria-label="Dismiss suggestions"
            onClick={() => setSuggestionsDismissed(true)}
            flexShrink={0} borderRadius="$10" padding="$1" hoverStyle={{ backgroundColor: "$color3" }}
          >
            <X size={14} color="$color11" />
          </Button>
        </XStack>
      )}

      <YStack
        position="relative" backgroundColor="$background" borderWidth={1} borderColor="$borderColor" borderRadius="$6" zIndex={10} width="100%" group focusStyle={{ borderColor: "$color8" }}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Resize grip — drag the input's top edge to grow/shrink it; keyboard
            accessible (↑/↑ taller, ↓ shorter). Replaces the native textarea
            resize corner so it matches the rounded chrome. */}
        <Button
          type="button"
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize chat input (Arrow Up to grow, Arrow Down to shrink)"
          onPointerDown={onResizePointerDown}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp") {
              e.preventDefault();
              nudgeComposer(24);
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              nudgeComposer(-24);
            }
          }}
          position="absolute" top="-1.5" left="50%" zIndex={20} height="$3" width="$7" x="50%" cursor="ns-resize" alignItems="center" justifyContent="center" borderRadius="$10" opacity={0} $group-hover={{ opacity: 1 }} focusVisibleStyle={{ opacity: 1, outlineWidth: 0 }}
        >
          <SizableText height="$0.5" width="$5" borderRadius="$10" backgroundColor="$color11" />
        </Button>
        {isDragging && (
          <XStack position="absolute" top={0} right={0} bottom={0} left={0} zIndex={30} borderRadius="$8" borderWidth={2} borderStyle="dashed" borderColor="$color11" backgroundColor="$background" alignItems="center" justifyContent="center" pointerEvents="none">
            <Paragraph fontSize="$3" color="$color" alignItems="center" gap="$2">
              <ImagePlus size={16} />
              Drop images to attach as references
            </Paragraph>
          </XStack>
        )}
        <SelectedFiles
          files={selectedFiles}
          isAiWorking={isAiWorking}
          onDelete={(file) =>
            setSelectedFiles((prev) => prev.filter((f) => f !== file))
          }
  />
        {selectedElement && (
          <YStack paddingHorizontal="$4" paddingTop="$3">
            <SelectedHtmlElement
              element={selectedElement}
              isAiWorking={isAiWorking}
              onDelete={() => setSelectedElement(null)}
  />
          </YStack>
        )}
        <XStack width="100%" position="relative" alignItems="center" justifyContent="space-between">
          {(isAiWorking || isUploading) && (
            <XStack position="absolute" top="$0" left="$4" right="$8" height="$6" zIndex={10} alignItems="center" justifyContent="space-between" pointerEvents="none">
              <XStack alignItems="center" justifyContent="flex-start" gap="$2">
                <Loading overlay={false} size={12} />
                <Paragraph color="$color11" fontSize="$1">
                  {isUploading ? (
                    "Uploading images..."
                  ) : isAiWorking && !isSameHtml ? (
                    <>
                      AI is working...
                      {messageQueue.length > 0 && (
                        <SizableText marginLeft="$1" color="$color11">
                          ({messageQueue.length} queued)
                        </SizableText>
                      )}
                    </>
                  ) : (
                    <SizableText>
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
                        <SizableText
                          key={index}
                          backgroundClip="text" color="transparent"
                          style={{
                            animationDelay: `${index * 0.1}s`,
                            animationDuration: "1.3s",
                            animationIterationCount: "infinite",
                          }}
                        >
                          {char === " " ? "\u00A0" : char}
                        </SizableText>
                      ))}
                      {messageQueue.length > 0 && (
                        <SizableText marginLeft="$2" color="$color11">
                          ({messageQueue.length} queued)
                        </SizableText>
                      )}
                    </SizableText>
                  )}
                </Paragraph>
              </XStack>
            </XStack>
          )}
          <Textarea
            ref={textareaRef}
            disabled={isUploading}
            style={{ height: composerH, maxHeight: "40dvh" }}
            width="100%" backgroundColor="transparent" fontSize="$3" outlineWidth={0} color="$color" placeholderTextColor="$color11" padding="$4" overflow="scroll" {...{ paddingTop: selectedElement && !isAiWorking ? "$2.5" : undefined, opacity: isAiWorking && !isUploading ? 1 : undefined }}
            placeholder={
              isAiWorking
                ? // Empty while working (unless queueing) so no text sits UNDER
                  // the "AI is working…" pill overlaying the top of the box.
                  messageQueue.length > 0
                  ? "Type your message... (will be queued)"
                  : ""
                : isFixMode
                ? "Attach a reference (drop, paste, or pick), then send — or add a note"
                : isPlan
                ? "Chat about your app — Plan mode won't change it"
                : selectedElement
                ? `Ask Hanzo about ${selectedElement.tagName.toLowerCase()}...`
                : isFollowUp && (!isSameHtml || pages?.length > 1)
                ? "Ask Hanzo for edits"
                : "Ask Hanzo anything..."
            }
            value={prompt}
            onChangeText={(t) => setPrompt(t)}
            onPaste={handlePaste}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                callAi();
              }
            }}
  />
        </XStack>
        <XStack alignItems="center" justifyContent="space-between" gap="$2" paddingHorizontal="$4" paddingBottom="$3" marginTop="$2">
          <XStack minWidth={0} flex={1} alignItems="center" justifyContent="flex-start" gap="$1.5" overflow="scroll" className="no-scrollbar">
            <Uploader
              pages={pages}
              onLoading={setIsUploading}
              isLoading={isUploading}
              onFiles={addToLibrary}
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
            {/* The two working modes, behind ONE control.
                They were two icon-only buttons on the bar — a wrench and a
                crosshair — which is two mysteries the bar had to carry at all
                times to say something each is one word long. In the menu they
                get their names, their state gets a checkmark, and the bar keeps
                one trigger. It accents when either mode is on, so nothing is
                hidden that is currently doing something. */}
            {!isSameHtml && (
              <DropdownMenu placement="top-start">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={
                          modes.length
                            ? `More — ${modes.join(", ")} on`
                            : "More composer modes"
                        }
                        borderRadius="$10"
                      >
                        <MoreHorizontal size={16} color={modes.length > 0 ? "var(--brand-accent)" : "$color11"} />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    {modes.length ? `${modes.join(", ")} on` : "More"}
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuContent width={256}>
                  <DropdownMenuCheckboxItem
                    checked={isEditableModeEnabled}
                    onCheckedChange={(v: boolean) => setIsEditableModeEnabled?.(!!v)}
                  >
                    <YStack>
                      <SizableText>Select an element</SizableText>
                      <SizableText fontSize="$1" color="$color11">
                        Click something on the page to edit it directly
                      </SizableText>
                    </YStack>
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={isFixMode}
                    onCheckedChange={(v: boolean) => setIsFixMode(!!v)}
                  >
                    <YStack>
                      <SizableText>Match a reference</SizableText>
                      <SizableText fontSize="$1" color="$color11">
                        Attach an image; Hanzo changes only what differs
                      </SizableText>
                    </YStack>
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {/* <InviteFriends /> */}
          </XStack>
          <XStack flexShrink={0} alignItems="center" justifyContent="flex-end" gap="$2">
            {/* Build vs Plan mode. Build (default) generates/patches the app;
                Plan is a conversational turn that never modifies it. Persisted. */}
            <SizableText
              role="group"
              aria-label="Composer mode"
              flexShrink={0} alignItems="center" borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" padding="$0.5" fontSize="$1" display="flex" flexDirection="row"
            >
              {(["build", "plan"] as const).map((m) => (
                <Button
                  key={m}
                  type="button"
                  aria-pressed={mode === m}
                  title={
                    m === "plan"
                      ? "Plan: chat about your app without changing it"
                      : "Build: generate and modify your app"
                  }
                  onClick={() => setMode(m)}
                  borderRadius="$10" paddingHorizontal="$2.5" paddingVertical="$1" focusVisibleStyle={{ outlineWidth: 0 }} backgroundColor={mode === m ? "var(--brand-accent)" : undefined}
                >
                  <SizableText fontWeight="500" textTransform="capitalize" color={mode === m ? "var(--brand-accent-fg)" : "$color11"}>{m}</SizableText>
                </Button>
              ))}
            </SizableText>
            {isSmartRouting(model) && routedModel && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <SizableText fontSize="$1" color="$color11" paddingHorizontal="$2" paddingVertical="$1" borderRadius="$3" backgroundColor="$color3" numberOfLines={1} maxWidth="10rem">
                    Routed: {routedModel}
                  </SizableText>
                </TooltipTrigger>
                <TooltipContent>
                  Smart routing sent this request to {routedModel}. You&apos;re
                  billed as what served you.
                </TooltipContent>
              </Tooltip>
            )}
            <Settings
              provider={provider as string}
              model={model as string}
              onChange={setProvider}
              onModelChange={setModel}
              open={openProvider}
              error={providerError}
              onClose={setOpenProvider}
  />
            {isAiWorking ? (
              <Button
                size="icon"
                variant="destructive"
                onClick={stopController}
                gap="$1" borderRadius="$10"
              >
                <CircleStop size={16} />
              </Button>
            ) : (
              <Button
                size="icon"
                borderRadius="$10"
                disabled={
                  isUploading ||
                  (!prompt.trim() &&
                    !(isFixMode && selectedFiles.length > 0))
                }
                onClick={() => callAi()}
              >
                <ArrowUp size={16} />
              </Button>
            )}
          </XStack>
        </XStack>
        <LoginModal open={open} onClose={() => setOpen(false)} pages={pages} />
        <ProModal
          pages={pages}
          open={openProModal}
          onClose={() => setOpenProModal(false)}
  />
      </YStack>
      <audio ref={hookAudio} id="audio">
        <source src="/success.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
      </YStack>
    </YStack>
  );
}
