"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ElementInfo } from "../preview/bridge";
import { locate } from "@/lib/source-locate";
import { YStack, XStack, SizableText, Paragraph } from '@hanzo/ui';
// `GuiElement` is a TYPE, and @hanzo/ui's dts build drops a two-hop
// type-only re-export, so it is not on the barrel yet. A type is erased at
// build and cannot create a second runtime, so this does not reintroduce
// the two-copies problem the rest of this migration exists to prevent.
import type { GuiElement } from '@hanzo/gui';
import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast, Button, DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, Tooltip, TooltipTrigger, TooltipContent, Textarea } from '@hanzo/ui';
import { sends } from '@hanzo/ui/chat';
import { useLocalStorage } from "react-use";
import { ArrowUp, Bell, ChevronDown, CircleStop, History as HistoryGlyph, ImagePlus, Images, MousePointerClick, Paintbrush, Plug, Plus, Settings as SettingsGlyph, Sparkles, Wrench, X } from "lucide-react";

import ProModal from "@/components/pro-modal";
import { useUsageLimit } from "@/components/usage/usage-limit";
import { useModels } from "@/lib/hooks/use-models";
import { useRoutingDefaults } from "@/lib/hooks/use-routing-defaults";
import { AUTO_MODEL, isDeadModelId, isSmartRouting, resolveSmartRouting } from "@/lib/providers";
import { accent, selected } from "@/lib/chrome";
import { canAsk, dismiss, enable, notifySettled } from "@/lib/notify";
import { HtmlHistory, Page, Project } from "@/types";
// import { InviteFriends } from "@/components/invite-friends";
import { Settings } from "@/components/editor/ask-ai/settings";
import { LoginModal } from "@/components/login-modal";
import { ReImagine } from "@/components/editor/ask-ai/re-imagine";
import { imageFilesFrom, uploadProjectImages } from "@/lib/upload-project-images";
import { claim } from "@/lib/attach";
import { space } from "@/lib/dev/draft";
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
import { sentence } from "./sentence";
import { ChatThread, type ThreadMessage } from "./chat-thread";
import { codeTurn } from "./code-turn";
import type { Runtime } from "@/lib/agent/sandbox";
import { isConversational } from "./intent";
import { Voice, useVoice, speech } from "@hanzo/voice";

// The builder's ear and voice, lent the caller's IAM session by the app's own
// `/v1/audio/*` proxy — so the browser never carries a gateway token.
//
// Measured 2026-07-26: the gateway resolves /v1/audio/* through IAM and does not
// yet accept a hanzo.id bearer with `aud: hanzo-app` (401 — the same 401 that
// makes /v1/models fall back to its offline ladder; it is not audio-specific).
// Hanzo's ear and voice are tried first and the browser takes over from the
// refusal, costing the first turn of a conversation rather than the whole one.
// The refusal is not silent: it lands on `voice.refusal` and in the mic's label,
// so a 401 stops reading as a working key. This upgrades itself the day the
// gateway accepts that audience.
// The models are named because @hanzo/voice defaults to OpenAI's spellings
// (whisper-1, tts-1) and this platform serves its own: `whisper` transcribes and
// `kokoro` speaks, both in the catalog at /v1/models. The defaults resolve to
// nothing here, so leaving them would fail on the model name even after the
// audience above is accepted — two blockers wearing one 4xx.
const HANZO_SPEECH = speech({
  baseUrl: "",
  ear: "whisper",
  voice: { model: "kokoro" },
});

// Fix mode composes this short, human intent preamble in front of the user's
// text (empty text is fine when references are attached). The reference images
// ride the UNCHANGED follow-up `files` path — Fix adds no new API surface.
const FIX_PREAMBLE =
  "Fix the current design to match the attached reference. Change only what differs from the reference; keep what already matches.";


// Contextual next-step suggestions shown as dismissible chips above the composer,
// matching the reference builder's composer. Honest, app-agnostic starters —
// clicking one sends it as a message in the current mode (Plan discusses it, Build
// executes it). Dynamic, app-state-derived suggestions are a future refinement on
// top of this set.
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
  onToggleHistory,
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
  selectedElement?: ElementInfo | null;
  setSelectedElement: React.Dispatch<React.SetStateAction<ElementInfo | null>>;
  selectedFiles: string[];
  setSelectedFiles: React.Dispatch<React.SetStateAction<string[]>>;
  setPages: React.Dispatch<React.SetStateAction<Page[]>>;
  setCurrentPage: React.Dispatch<React.SetStateAction<string>>;
  /** Toggle the version-history panel — the [+] menu's History entry. */
  onToggleHistory?: () => void;
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
  // The [+] menu's open state — the trigger draws an X while it is up.
  const [plusOpen, setPlusOpen] = useState(false);
  const router = useRouter();
  // The per-project settings page, when this project has an identity.
  // space_id is the `${org}/${slug}` pivot the editor keys everything off.
  const projectSettingsHref = (() => {
    const id = project?.space_id ?? "";
    const cut = id.indexOf("/");
    return cut > 0 ? `/dev/${id.slice(0, cut)}/${id.slice(cut + 1)}/settings` : null;
  })();
  const [providerError, setProviderError] = useState("");
  const [openProModal, setOpenProModal] = useState(false);
  // The ONE "Need more usage?" modal — raised on an out-of-credit (402) signal
  // from a metered generation instead of failing silently.
  const { raise: raiseUsageLimit } = useUsageLimit();
  // Diff-patch (follow-up) updates are now simply the default — the toggle chip
  // + explainer popover were removed (no one toggled it). Always on.
  const [isFollowUp] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  // Whether to offer build notifications. False on the server and until the
  // effect runs, so SSR and the first client paint agree; then the real answer.
  const [askNotify, setAskNotify] = useState(false);
  useEffect(() => {
    setAskNotify(canAsk());
  }, []);
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

  // Composer mode — three acts, one control:
  //   build  generate/patch the app (default): one shot, no tools, the result
  //          lands in this browser's working copy.
  //   code   the agent edits the project's real checkout in a sandbox and can
  //          RUN things — install, build, test. Durable; costs a pod.
  //   plan   a conversational back-and-forth that DOESN'T touch the app.
  // TWO modes: Build does it, Plan discusses it. There was a third — `code`,
  // labelled "Agent" — and it is gone: nobody could say what it was for next to
  // Build, which is the question that killed it.
  //
  // The stored value is read WIDE and narrowed here, because `composer-mode` is
  // localStorage: anyone who last used the third mode still has "code" on disk,
  // and typing the state as two values would not change what is written there.
  // Without this they would come back to a mode with no control to leave it.
  const [storedMode, setMode] = useLocalStorage<"build" | "code" | "plan">("composer-mode", "build");
  const mode: "build" | "plan" = storedMode === "plan" ? "plan" : "build";
  const isPlan = mode === "plan";
  /** Always false now — see the sandbox branch in callAi for why it stays. */
  const isCode = false as boolean;
  // The sandbox this project's runs are landing in — remembered across turns so
  // a second message reuses the warm pod instead of asking for a new one.
  const sandboxRef = useRef<string | undefined>(undefined);
  // THE ISOLATION BOUNDARY this project's sandboxes ask for, persisted per
  // project like the other composer preferences above. Per project because that
  // is the unit of the experiment: pin one project to a microVM and another to
  // gVisor, work in both, and the difference is a thing you felt rather than a
  // number somebody quoted. `""` asks for whatever the fleet runs, which is what
  // a session that is not being measured should keep.
  const [runtime, setRuntime] = useLocalStorage<Runtime>(
    `sandbox-runtime:${project?.space_id ?? "new"}`,
    "",
  );
  // What the last run's sandbox actually got, and cloud's sentence when it got
  // none. Held apart from the request above BECAUSE THEY CAN DIFFER — reading a
  // selection back as if it were an outcome is the one failure this whole path
  // is built to make impossible.
  const [granted, setGranted] = useState<string | undefined>(undefined);
  const [refused, setRefused] = useState<string | undefined>(undefined);

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

  // The suggestion row's right fade is an affordance — it claims there is more
  // to scroll to. Only `.scroll-fade-r[data-more]` masks, so the claim has to
  // be measured: at desktop width the row fits, and an unconditional fade sat
  // on top of the last pill, dimming a live action with nothing behind it.
  const pillsRef = useRef<GuiElement>(null);
  useEffect(() => {
    const el = pillsRef.current as HTMLElement | null;
    if (!el) return;
    const measure = () =>
      el.toggleAttribute("data-more", el.scrollWidth - el.clientWidth - el.scrollLeft > 1);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    el.addEventListener("scroll", measure, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", measure);
    };
  }, [suggestionsDismissed, isAiWorking]);

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
  // affordance, then attach the references to the current prompt. A draft has
  // somewhere to put them too (lib/dev/draft), so this no longer asks anyone to
  // publish before they can show the model a picture.
  const ingestFiles = async (imgs: File[]) => {
    if (imgs.length === 0) return;
    setIsUploading(true);
    const urls = await uploadProjectImages(space(project?.space_id), imgs);
    if (urls.length) attachRefs(urls);
    else toast.error("Couldn't upload image(s). Please try again.");
    setIsUploading(false);
  };

  /**
   * Pictures dropped on the landing composer, ingested once there is a project
   * to hold them.
   *
   * They arrive as Files, not URLs, because uploading needs a space_id and the
   * landing has no project yet — that is exactly why its [+] used to send people
   * here to find an uploader. The composer inlines what it CAN read into the
   * prompt itself and hands the pictures over; this waits for the space and then
   * uses the same ONE upload path a drop uses, so there is still one uploader.
   */
  const [seeded, setSeeded] = useState<File[]>([]);
  useEffect(() => {
    void claim().then((list) => setSeeded(list.filter((a) => a.read === "image").map((a) => a.file)));
  }, []);
  useEffect(() => {
    // Keyed on both, because the read and the project can land in either order.
    if (!seeded.length || !space(project?.space_id)) return;
    const held = seeded;
    setSeeded([]);
    void ingestFiles(held);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seeded, project?.space_id]);

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
      { id: genId(), role: "user", text: userText, images: selectedFiles.length ? [...selectedFiles] : undefined },
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
    // The thread shows the result to whoever is LOOKING; this reaches the tab
    // nobody is. notifySettled itself refuses when the tab is visible or the
    // permission is anything but granted.
    notifySettled(phase === "done", text);
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
      { id: genId(), role: "user", text: userText, images: selectedFiles.length ? [...selectedFiles] : undefined },
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

  // A file mentioned from the version-history panel lands HERE, in the composer.
  // `history/details.tsx` dispatches `hanzo:mention-file` with the path and
  // toasts "Mentioned @path in chat" — but nothing listened, so the click only
  // copied to the clipboard and the toast was a claim nobody kept. Insert
  // `@path` into the prompt (once) and focus, so the mention is really there to
  // ask about. The path is plain text: the model reads "@path" as the file the
  // user means; there is no macro expansion to wait on.
  useEffect(() => {
    const onMention = (e: Event) => {
      const path = (e as CustomEvent<{ path?: string }>).detail?.path;
      if (!path) return;
      const mention = `@${path}`;
      setPrompt((p) => (p.includes(mention) ? p : p ? `${p.trimEnd()} ${mention} ` : `${mention} `));
      textareaRef.current?.focus();
    };
    window.addEventListener("hanzo:mention-file", onMention);
    return () => window.removeEventListener("hanzo:mention-file", onMention);
  }, []);

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

    // Code mode — the agent works in the project's sandbox. A real checkout, a
    // real toolchain, and the commands it runs stream into the console dock as
    // they happen. Checked before the conversational branch because a Code
    // message is never small talk: someone in Code mode asking "does this build"
    // wants it built, not discussed.
    // UNREACHABLE while the composer offers only Build and Plan: `isCode` was
    // the third segment, and removing it closed the only door — nothing else
    // writes "code" (build-composer hands off 'build' | 'plan', and the handoff
    // whitelist no longer admits it). Kept rather than ripped out because the
    // ask was to remove the BUTTON; deleting codeTurn, the sandbox runtime
    // picker and their console wiring is a larger removal that should be a
    // deliberate call, not a side effect of hiding a control.
    if (isCode && !redesignMarkdown && !fixSubmit) {
      const codeId = beginTurn(promptToUse.trim(), false);
      updateAssistant(codeId, { activity: ["Opening the project's sandbox"] });
      setisAiWorking(true);
      const activity: string[] = [];
      let answer = "";
      try {
        const result = await codeTurn({
          prompt: promptToUse.trim(),
          model,
          sandbox: sandboxRef.current,
          runtime,
          files: pages.map((p) => ({ path: p.path, content: p.html })),
          onWhere: ({ durable, sandbox, runtime: got, reason }) => {
            sandboxRef.current = sandbox;
            // WHAT IT GOT, back to the picker. When there is no sandbox there is
            // nothing true to report, so the last answer is cleared rather than
            // left standing beside a run that never had one.
            setGranted(got);
            // The refusal belongs beside the choice only when a choice was made:
            // a scratch run with no project is not the runtime being turned down.
            setRefused(!durable && runtime ? reason : undefined);
            activity.length = 0;
            activity.push(durable ? `Sandbox ${sandbox}` : "In memory — NOT saved");
            updateAssistant(codeId, { activity: [...activity] });
            // The fallback, said where the person is looking. A run that saves
            // nothing must never be indistinguishable from one that saves.
            if (!durable) {
              setMessages((prev) => [
                ...prev,
                { id: genId(), role: "system", text: reason ?? "This run edits memory only — nothing is saved." },
              ]);
            }
          },
          onActivity: (label) => {
            activity.push(label);
            updateAssistant(codeId, { activity: [...activity] });
          },
          onText: (chunk) => {
            answer += chunk;
            updateAssistant(codeId, { text: answer, phase: "building" });
          },
        });
        // ONLY A RUN THAT HAD NOWHERE ELSE TO PUT ITS WORK.
        //
        // A durable run edits a real checkout and commits it to git.hanzo.ai from
        // inside the pod, so there is nothing here to take up — and taking it up
        // was actively wrong: `pages` is the HTML the preview renders and the
        // autosave commits, so a run that touched `App.tsx` and `tsconfig.json`
        // put both into the page set, which committed them a second time as pages
        // and left the preview trying to render TypeScript.
        //
        // A run with no sandbox is the opposite case: the browser is the only
        // copy of what it wrote, and dropping it would lose the turn outright.
        if (!result.durable && result.files.length) {
          onSuccess(
            result.files.map((f) => ({ path: f.path, html: f.content })),
            promptToUse.trim(),
          );
        }
        const summary =
          (result.text.trim() ||
            (result.changed.length
              ? `Changed ${result.changed.join(", ")}`
              : "Nothing to change.")) +
          (result.durable ? "" : "\n\n(Not saved — this run edited memory only.)");
        finishTurn(codeId, result.ok ? "done" : "error", summary);
      } finally {
        setisAiWorking(false);
      }
      return;
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
        ? selectedElement.html
        : "";

      // WHERE it is, not just WHAT it is. Handing the model only the markup
      // makes it search every page for a serialization that may not appear
      // verbatim anywhere — the browser rewrites attribute order and quoting on
      // its way out of the DOM. `locate` answers with a file and a line, or
      // with nothing when no anchor is unique; an undefined location leaves the
      // prompt exactly as it was rather than pointing at a guess.
      const selectedElementAt = selectedElement
        ? locate(
            {
              id: selectedElement.id,
              className: selectedElement.className,
              tagName: selectedElement.tagName,
              html: selectedElement.html,
              text: selectedElement.text,
            },
            pages,
          )
        : undefined;

      const result = await callAiFollowUp(
        effectivePrompt,
        model,
        provider,
        previousPrompts,
        selectedElementHtml,
        selectedFiles,
        selectedElementAt
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
  // goes through, and the reply to read back. The mic renders right here in
  // the action row (Build ⌄ · mic · send), beside the turn it feeds.
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

  // The composer draws its own mic now — Build ⌄ · mic · send, the reference
  // row. It used to OFFER the machine to the console bar through a seam
  // (ask-ai/mic.ts, deleted with this); once the console's rest state became an
  // invisible edge, a mic that lived there was a voice feature nobody could
  // see. The machine and the control are in one component again.

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

  // Restore the persisted composer height once on mount. A saved value means the
  // user had resized it.
  //
  // AFTER the commit, deliberately, and this is the one case where the effect is
  // the answer rather than the smell: the height is read from localStorage, which
  // the server cannot see. Seeding the state during render would make the server
  // send one height and the first client render another — a hydration mismatch on
  // the textarea's inline style. So the first paint agrees with the server, and
  // the saved height lands immediately after it.
  useEffect(() => {
    if (savedComposerH && savedComposerH > 0) {
      manualResizeRef.current = true;
      composerHRef.current = savedComposerH;
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    <YStack ref={rootRef} alignSelf="center" height="100%" minHeight={0} width="100%" maxWidth={600}>
      <ChatThread messages={messages} />
      <YStack marginTop="auto" paddingHorizontal="$2" paddingBottom="calc(0.75rem+env(safe-area-inset-bottom))">
      {/* Stacked Message Queue Cards */}
      {messageQueue.length > 0 && (
        <YStack marginBottom="$4" rowGap="$2">
          <XStack alignItems="center" justifyContent="space-between" marginBottom="$2">
            <SizableText fontSize="$1" color="$color" fontWeight="500">
              Queued Messages ({messageQueue.length})
            </SizableText>
            <Button
              variant="linkMuted"
              onClick={() => setMessageQueue([])}
            >
              <SizableText fontSize="$1">Clear all</SizableText>
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
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Remove from queue"
                    onClick={() => setMessageQueue(prev => prev.filter(m => m.id !== msg.id))}
                  >
                    <X size={14} />
                  </Button>
                </XStack>
                <XStack alignItems="center" gap="$2" marginTop="$2">
                  <SizableText fontSize="$1" color="$color11">
                    {msg.timestamp.toLocaleTimeString()}
                  </SizableText>
                  {index === 0 && (
                    <XStack alignItems="center" gap="$1">
                      <YStack width="$1.5" height="$1.5" backgroundColor="$color5" borderRadius="$10" />
                      <SizableText fontSize="$1" color="$color11">Next in queue</SizableText>
                    </XStack>
                  )}
                  {/* REDIRECT. Queuing waits for a build to finish, which is right
                      when you are adding to it and wrong when you are correcting
                      it — watching a wrong build run to completion before your
                      correction is even read is the whole complaint. This stops
                      the current turn and takes this message next; the queue
                      drains as usual once the abort settles. */}
                  {isAiWorking && (
                    <Button
                      variant="linkMuted"
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
                      <SizableText fontSize="$1">Send now</SizableText>
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
              <XStack
                key={p.name}
                flexShrink={0} alignItems="center" gap="$1.5" borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$3" paddingVertical="$1"
              >
                <SizableText whiteSpace="nowrap" fontSize="$1" color="$color">🔥 {p.name}</SizableText>
                {p.skippable !== false && (
                  <>
                    <Button
                      type="button"
                      variant="linkMuted"
                      onClick={() => skipIntegration(p.name)}
                    >
                      <SizableText fontSize="$1">Skip</SizableText>
                    </Button>
                    <SizableText fontSize="$1" color="$color11">·</SizableText>
                  </>
                )}
                <Button
                  type="button"
                  variant="link"
                  onClick={() => connectIntegration(p)}
                >
                  <SizableText fontWeight="500" fontSize="$1">Connect</SizableText>
                </Button>
              </XStack>
            ))}
          </XStack>
          <Paragraph fontSize="$1" color="$color11">
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
          <XStack ref={pillsRef} flex={1} alignItems="center" gap="$1.5" overflow="scroll" className="no-scrollbar scroll-fade-r">
            {SUGGESTIONS.map((s) => (
              // An XStack wearing role="button", NOT a Button: a Button's size
              // variant floors its height (default 36) and a floor cannot be
              // argued down by a style prop — which is exactly why these chips
              // towered over the composer they decorate. A chip is a hint, and
              // a hint is small. Glass, like the composer it belongs to.
              <XStack
                key={s}
                role="button"
                tabIndex={0}
                onPress={() => runSuggestion(s)}
                className="glass"
                flexShrink={0} alignItems="center" height={26} borderRadius={999} borderWidth={1} borderColor="$color04" backgroundColor="$color2" paddingHorizontal="$2.5" cursor="pointer" hoverStyle={{ backgroundColor: "$color3" }}
              >
                <SizableText whiteSpace="nowrap" fontSize="$1" color="$color11" hoverStyle={{ color: "$color" }}>{s}</SizableText>
              </XStack>
            ))}
          </XStack>
          <Button size="icon"
            type="button"
            aria-label="Dismiss suggestions"
            variant="ghost"
            onClick={() => setSuggestionsDismissed(true)}
            flexShrink={0} borderRadius="$10" padding="$1" hoverStyle={{ backgroundColor: "$color3" }}
          >
            <X size={14} />
          </Button>
        </XStack>
      )}

      {/* Ask ONCE for build notifications, and only while the answer is
          genuinely undecided — lib/notify owns the whole contract (denied is
          a decision; a visible tab never gets one; ✕ is remembered).

          It sits BEHIND the composer and shares its width. Inside the glass it
          was inset by its own margin, so it read as a narrower panel floating
          IN the composer — two stacked boxes with two different edges, and the
          prompt looked like part of the input it was interrupting. Out here it
          is one card the composer overlaps: same width, a lower `zIndex` than
          the composer's 10, and a negative bottom margin so the composer covers
          its lower edge and the two read as a stack rather than a sandwich. The
          extra bottom padding is exactly that overlap, so nothing it says lands
          under the composer. Bottom corners are square because they are never
          seen. */}
      {askNotify && (
        <XStack
          alignItems="center" gap="$2" width="100%" zIndex={0}
          marginBottom={-14} paddingBottom={22}
          paddingTop="$2" paddingLeft="$3" paddingRight="$2"
          borderTopLeftRadius="$4" borderTopRightRadius="$4"
          backgroundColor="$color3" borderWidth={1} borderBottomWidth={0} borderColor="$color04">
            <SizableText color="$color11"><Bell size={14} /></SizableText>
            <SizableText flex={1} minWidth={0} fontSize="$2" color="$color">
              Get notified when a build finishes
            </SizableText>
            <Button
              type="button"
              size="sm"
              {...accent}
              borderRadius={999}
              paddingHorizontal="$3"
              onClick={async () => {
                await enable();
                // Granted or denied, the question is answered either way.
                setAskNotify(false);
              }}
            >
              <SizableText fontSize="$2" fontWeight="500" color="$color12">Enable</SizableText>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              borderRadius={999}
              aria-label="Dismiss"
              onClick={() => {
                dismiss();
                setAskNotify(false);
              }}
            >
              <X size={14} />
            </Button>
        </XStack>
      )}

      {/* THE SAME COMPOSER AS EVERYWHERE ELSE YOU TALK TO HANZO.
          `.hz-composer` is the prism — a 1.5px-padded host carrying the slow
          conic ring (::before) and its blurred halo (::after) — and the panel
          inside it is glass. `/new` (components/build-composer) and hanzo.chat
          both already render exactly this; the builder was the one surface that
          did not, so the place you spend the most time typing was a flat black
          box with a hard hairline while the other two glowed.

          The host draws the edge, so the panel carries NO border of its own: a
          hairline inside the ring is the second edge that made this read heavy.
          Radius is $8 outside / 14 inside, matching build-composer — concentric,
          the inner radius smaller by the host's padding. */}
      <YStack borderRadius="$8" elevation={6} zIndex={10} width="100%" className="hz-composer">
      <YStack
        className="glass"
        position="relative" borderRadius={14} width="100%" group
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Resize grip — drag the input's top edge to grow/shrink it; keyboard
            accessible (↑ taller, ↓ shorter). The hit-area is the whole top
            edge, and the handle is INVISIBLE until that edge itself is hovered
            (or focused) — it used to fade in whenever the pointer was anywhere
            over the composer, so a near-white notch floated over the bubble
            every time you reached for the input. */}
        <Button
          type="button"
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize chat input (Arrow Up to grow, Arrow Down to shrink)"
          variant="ghost"
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
          // style.height, minHeight AND zero padding: the Button size variant
          // floors the box at 36px, pads it, and its height wins over the prop —
          // anything taller is an invisible click-eater over the input's first
          // line (measured: a 30px strip swallowed clicks meant for the text).
          style={{ height: 14 }}
          // `backgroundColor` pinned transparent in BOTH states: the ghost
          // variant paints a hover fill, and on a full-width 14px strip that
          // fill read as a dark bar across the composer's top edge. The grip's
          // whole visible body is the small pill below — the strip is only a
          // hit target, and a hit target has no colour.
          position="absolute" top={-7} left="$4" right="$4" zIndex={20} minHeight={14} paddingVertical={0} cursor="ns-resize" alignItems="center" justifyContent="center" borderRadius="$10" opacity={0} backgroundColor="transparent" hoverStyle={{ opacity: 1, backgroundColor: "transparent" }} focusVisibleStyle={{ opacity: 1, backgroundColor: "transparent" }}
        >
          <SizableText height={2} width="$2.5" borderRadius="$10" backgroundColor="$color6" />
        </Button>
        {isDragging && (
          <XStack position="absolute" top={0} right={0} bottom={0} left={0} zIndex={30} borderRadius="$8" borderWidth={2} borderStyle="dashed" borderColor="$color11" backgroundColor="$background" alignItems="center" justifyContent="center" pointerEvents="none">
            <Paragraph fontSize="$3" color="$color" display="flex" alignItems="center" gap="$2">
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
          {/* ONLY the composer's OWN transient state (an image upload) overlays
              the input. The AI's "working / thinking / building" state does NOT
              live here \u2014 it belongs in the THREAD, where the answer is going to
              appear (the "Generating \u00B7 Applying edits" activity above, plus the
              status bar). Parking it on top of the input hijacked the one box you
              need free to queue a follow-up or steer \u2014 exactly what a coding
              agent should never take from you mid-run. The input stays live and
              inviting the whole time; typing while it works queues (or, with the
              queued row's "Send now", pre-empts) the next turn. */}
          {isUploading && (
            <XStack position="absolute" top="$0" left="$4" right="$8" height="$6" zIndex={10} alignItems="center" pointerEvents="none">
              <XStack alignItems="center" gap="$2">
                <Loading overlay={false} size={12} />
                <Paragraph color="$color11" fontSize="$1">Uploading images\u2026</Paragraph>
              </XStack>
            </XStack>
          )}
          <Textarea
            ref={textareaRef}
            disabled={isUploading}
            // resize:none kills the native corner — its diagonal notches sat in
            // the bubble's rounded corner; the top-edge grip is the ONE resize.
            style={{ height: composerH, maxHeight: "40dvh", resize: "none" }}
            width="100%" backgroundColor="transparent" fontSize="$3" borderWidth={0} outlineWidth={0} color="$color" placeholderTextColor="$color11" padding="$4" overflow="scroll" {...{ paddingTop: selectedElement && !isAiWorking ? "$2.5" : undefined }}
            placeholder={
              isAiWorking
                ? // Live while it works: the composer is never dead time. Type to
                  // queue the next turn, or send to steer — the working state
                  // shows in the thread, not here.
                  messageQueue.length > 0
                  ? `Queue another — ${messageQueue.length} waiting`
                  : "Queue a follow-up, or steer — it runs next"
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
              if (sends(e.key, e.nativeEvent)) {
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
            {/* THE ONE [+] — everything the composer can bring in, one menu.
                Attach, reference, the two working modes, Settings (collapsed
                here from the action row, per the owner), History, and the
                project surfaces. The trigger flips to an X while open. Items
                that act on OTHER popovers click their hidden 1px anchors
                (uploader/settings) so those keep their own placement and
                logic. EVERY item is real — nothing lists a surface that does
                not exist. */}
            <DropdownMenu open={plusOpen} onOpenChange={setPlusOpen} placement="top-start">
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={plusOpen ? "Close menu" : "Add to this build"}
                  aria-expanded={plusOpen}
                  borderRadius={999}
                  {...{ color: modes.length ? selected(true).color : "$color11" }}
                  hoverStyle={{ backgroundColor: "$color3" }}
                >
                  {plusOpen ? <X size={16} /> : <Plus size={16} />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent width={288}>
                <DropdownMenuItem onSelect={() => document.getElementById("composer-attach")?.click()}>
                  <XStack alignItems="center" gap="$2">
                    <ImagePlus size={15} />
                    <SizableText>Attach images</SizableText>
                  </XStack>
                </DropdownMenuItem>
                {isNew && (
                  <DropdownMenuItem onSelect={() => document.getElementById("composer-reimagine")?.click()}>
                    <XStack alignItems="center" gap="$2">
                      <Paintbrush size={15} />
                      <SizableText>Add reference</SizableText>
                    </XStack>
                  </DropdownMenuItem>
                )}
                {!isSameHtml && (
                  <>
                    <DropdownMenuCheckboxItem
                      checked={isEditableModeEnabled}
                      onCheckedChange={(v: boolean) => setIsEditableModeEnabled?.(!!v)}
                    >
                      {/* Same glyph column as every sibling row; the hint
                          indents to the TITLE, not the icon, so the two lines
                          read as one item. */}
                      <YStack gap="$0.5">
                        <XStack alignItems="center" gap="$2">
                          <MousePointerClick size={15} />
                          <SizableText>Select an element</SizableText>
                        </XStack>
                        <SizableText fontSize="$1" color="$color11" paddingLeft={23}>
                          Click something on the page to edit it directly
                        </SizableText>
                      </YStack>
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={isFixMode}
                      onCheckedChange={(v: boolean) => setIsFixMode(!!v)}
                    >
                      <YStack gap="$0.5">
                        <XStack alignItems="center" gap="$2">
                          <Images size={15} />
                          <SizableText>Match a reference</SizableText>
                        </XStack>
                        <SizableText fontSize="$1" color="$color11" paddingLeft={23}>
                          Attach an image; Hanzo changes only what differs
                        </SizableText>
                      </YStack>
                    </DropdownMenuCheckboxItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => document.getElementById("composer-settings")?.click()}>
                  <XStack alignItems="center" gap="$2">
                    <SettingsGlyph size={15} />
                    <SizableText>Settings</SizableText>
                  </XStack>
                </DropdownMenuItem>
                {onToggleHistory && (
                  <DropdownMenuItem onSelect={() => onToggleHistory()}>
                    <XStack alignItems="center" gap="$2">
                      <HistoryGlyph size={15} />
                      <SizableText>History</SizableText>
                    </XStack>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => router.push("/connectors")}>
                  <XStack alignItems="center" gap="$2">
                    <Plug size={15} />
                    <SizableText>Project connectors</SizableText>
                  </XStack>
                </DropdownMenuItem>
                {projectSettingsHref && (
                  <DropdownMenuItem onSelect={() => router.push(projectSettingsHref)}>
                    <XStack alignItems="center" gap="$2">
                      <Wrench size={15} />
                      <SizableText>Project settings</SizableText>
                    </XStack>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onSelect={() => router.push("/skills")}>
                  <XStack alignItems="center" gap="$2">
                    <Sparkles size={15} />
                    <SizableText>Add skill</SizableText>
                  </XStack>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* <InviteFriends /> */}
          </XStack>
          <XStack flexShrink={0} alignItems="center" justifyContent="flex-end" gap="$2">
            {/* Build vs Plan mode — ONE pill naming the current mode, menu on
                press. It was a two-segment switch, which spends bar width
                saying both answers at all times; the reference (and the point)
                is to say the CURRENT one and offer the other on demand. The
                stored value and the two-mode domain are unchanged. */}
            <DropdownMenu placement="top-end">
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  aria-label={`Mode: ${mode}`}
                  title={mode === "plan" ? "Plan: chat about your app without changing it" : "Build: generate and modify your app"}
                  height={26} minHeight={26} alignItems="center" gap="$1" borderRadius={999} backgroundColor="$color3" paddingHorizontal="$2.5" hoverStyle={{ backgroundColor: "$color4" }}
                >
                  <SizableText fontSize="$2" fontWeight="500" textTransform="capitalize" color="$color">{mode}</SizableText>
                  <SizableText color="$color11"><ChevronDown size={12} /></SizableText>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent width={240}>
                {(["build", "plan"] as const).map((m) => (
                  <DropdownMenuCheckboxItem
                    key={m}
                    checked={mode === m}
                    onCheckedChange={() => setMode(m)}
                  >
                    <YStack>
                      <SizableText textTransform="capitalize">{m}</SizableText>
                      <SizableText fontSize="$1" color="$color11">
                        {m === "plan"
                          ? "Chat about your app without changing it"
                          : "Generate and modify your app"}
                      </SizableText>
                    </YStack>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
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
              runtime={runtime ?? ""}
              onRuntimeChange={setRuntime}
              granted={granted}
              refused={refused}
              open={openProvider}
              error={providerError}
              onClose={setOpenProvider}
  />
            <Voice voice={voice} disabled={isAiWorking} className="voice-control" />
            {isAiWorking ? (
              <Button
                size="icon"
                variant="destructive"
                onClick={stopController}
                gap="$1" height={36} minHeight={36} width={36} minWidth={36} borderRadius={999}
              >
                <CircleStop size={16} />
              </Button>
            ) : (
              <Button
                size="icon"
                {...accent}
                height={36} minHeight={36} width={36} minWidth={36} borderWidth={0} borderRadius={999}
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
      </YStack>{/* .hz-composer host */}
      <audio ref={hookAudio} id="audio">
        <source src="/success.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
      </YStack>
    </YStack>
  );
}
