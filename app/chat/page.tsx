'use client';

/**
 * /chat — the chat mode of the one webapp (chat | dev | work).
 *
 * hanzo.chat's product, ported: real streaming completions via the app's
 * /v1/chat/completions relay (the gateway debits the caller's own hk- key),
 * conversations persisted in cloud /v1/agents/sessions via the
 * /v1/chat/conversations BFF (NOT a local store), zen-only model picker,
 * markdown rendering, stop + regenerate. No simulated responses — a signed-out
 * visitor gets an honest sign-in prompt.
 *
 * When the paid route cannot serve — an overdrawn balance or every paid
 * provider refusing — the turn is offered on Enso Free rather than dropped.
 * Free shares data, so it is served only after the reader agrees to that once
 * (@hanzo/ai owns the predicate, the words and the consent record; this page
 * renders them).
 */
import { XStack, YStack, Paragraph, SizableText, H1 } from '@hanzo/ui';
import { sends } from '@hanzo/ui/chat';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  MessageCircle,
  PanelLeft,
  Plus,
  RefreshCw,
  Search,
  Square,
} from 'lucide-react';

import {
  FREE_MODEL,
  FREE_MODEL_LABEL,
  dataCollected,
  freeCopy,
  grantConsent,
  hasConsent,
  isFree,
  paidUnavailable,
  servedByFallback,
} from '@hanzo/ai';
// `Anchor` is not on @hanzo/ui's barrel yet — the dts build drops it.
import { Anchor } from '@hanzo/gui';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@hanzo/ui';
import { AppShell } from '@/components/app-shell';
import { accent } from '@/lib/chrome';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { DEFAULT_MODEL } from '@/lib/providers';
import { useModels } from '@/lib/hooks/use-models';
import { readSseDeltas } from '@/lib/chat/sse';

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  streaming?: boolean;
  error?: boolean;
}

/**
 * Chat offers the HOUSE families only, by direction — the picker never shows a
 * third-party id (claude-*, gpt-*), whatever the gateway resells.
 *
 * Both house families count. This read `^zen` alone, and the gateway carries no
 * zen id at all, so the filter emptied the picker and the hardcoded `zen5`
 * default answered 403 — the chat page could not send a message. Enso is the
 * house frontier family and is what the gateway actually serves; zen stays in
 * the pattern so the ladder reappears here the moment it is served again.
 */
const houseOnly = (models: { value: string; label: string }[]) =>
  models.filter((m) => /^(zen|enso)/i.test(m.value));

// The default is DEFAULT_MODEL — stated ONCE, in lib/providers.ts. A second
// literal here is how this page came to name a model nothing serves.
const CHAT_DEFAULT = DEFAULT_MODEL;

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'same-origin',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  });
  if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status });
  return res.json() as Promise<T>;
}

export default function ChatPage() {
  const { models: allModels } = useModels();
  const models = houseOnly(allModels);
  const [model, setModel] = useState(CHAT_DEFAULT);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [signedOut, setSignedOut] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  // A paid outage takes two shapes and both offer Free: `switch` when the turn
  // was refused and Free would answer it, `keep` when the gateway already
  // answered it on Free. `consenting` is the one-time data-sharing agreement
  // Free is served under.
  const [offer, setOffer] = useState<'switch' | 'keep' | null>(null);
  const [consenting, setConsenting] = useState(false);
  // SSR-stable default (closed); opens on mount at lg+ — reading matchMedia in
  // the initializer would render server/client differently and break hydration.
  const [railOpen, setRailOpen] = useState(false);
  useEffect(() => {
    if (window.matchMedia('(min-width:1024px)').matches) setRailOpen(true);
  }, []);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // The turn the paid route refused, held so Free can replay it verbatim.
  const pendingRef = useRef<{ history: Message[]; convId: string | null } | null>(null);

  // The model this page serves on: a remembered free switch wins, and otherwise
  // a selection the live house list does not carry is corrected onto it. Free
  // is chosen deliberately, so it is never corrected away.
  useEffect(() => {
    if (isFree(model)) return;
    const saved = window.localStorage.getItem('model');
    const stale = models.length > 0 && !models.some((m) => m.value === model);
    const next = saved && isFree(saved) ? saved : stale ? models[0].value : model;
    if (next !== model) setModel(next);
  }, [models, model]);

  /** Select a model. Free is remembered, a paid pick forgets it. */
  const pick = useCallback((id: string) => {
    setModel(id);
    if (isFree(id)) window.localStorage.setItem('model', id);
    else window.localStorage.removeItem('model');
  }, []);

  // Conversation list from cloud (via the BFF). 401 → honest signed-out state.
  useEffect(() => {
    api<{ conversations: Conversation[] }>('/v1/chat/conversations')
      .then((b) => setConversations(b.conversations))
      .catch((err: { status?: number }) => {
        if (err.status === 401) setSignedOut(true);
      });
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }
  }, [input]);

  const openConversation = useCallback((id: string) => {
    setActiveId(id);
    setNotice(null);
    setOffer(null);
    api<{ messages: Message[] }>(`/v1/chat/conversations/${encodeURIComponent(id)}`)
      .then((b) => setMessages(b.messages))
      .catch(() => setNotice('That conversation would not load. Pick it again, or start a new chat.'));
    if (typeof window !== 'undefined' && !window.matchMedia('(min-width:1024px)').matches) {
      setRailOpen(false);
    }
  }, []);

  const newChat = useCallback(() => {
    abortRef.current?.abort();
    setActiveId(null);
    setMessages([]);
    setNotice(null);
    setOffer(null);
  }, []);

  /** Persist one turn to the cloud log; history failures never break the stream. */
  const persist = useCallback((id: string, m: Message) => {
    fetch(`/v1/chat/conversations/${encodeURIComponent(id)}/messages`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: m.role, content: m.content, model: m.model }),
    }).catch(() => {});
  }, []);

  /**
   * Stream a completion for `history` on model `id` and append the assistant
   * turn. `id` is a parameter, not the state read, so a switch can serve the
   * next turn immediately instead of waiting a render for the state to land.
   */
  const complete = useCallback(
    async (history: Message[], convId: string | null, id: string = model) => {
      setStreaming(true);
      setNotice(null);
      setOffer(null);
      pendingRef.current = null;
      setMessages([...history, { role: 'assistant', content: '', model: id, streaming: true }]);

      const controller = new AbortController();
      abortRef.current = controller;
      let text = '';
      // What is answering. The turn is labelled with this, so a reply the
      // gateway moved to another model is not signed with the one asked for.
      let serving = id;
      const paint = (streamingNow: boolean, error = false) =>
        setMessages([
          ...history,
          { role: 'assistant', content: text, model: serving, streaming: streamingNow, error },
        ]);

      try {
        const res = await fetch('/v1/chat/completions', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: id,
            messages: history.map(({ role, content }) => ({ role, content })),
          }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          const body = await res.json().catch(() => ({}) as { message?: string });
          setMessages(history);
          if (res.status === 401) {
            setSignedOut(true);
          } else if (paidUnavailable({ status: res.status, ...body })) {
            // The family has no free route of its own, so the outage is a hard
            // refusal. Keep the turn: a reader who takes Free loses nothing.
            pendingRef.current = { history, convId };
            setOffer('switch');
          } else {
            setNotice(body.message || 'The model did not answer. Send the message again.');
          }
          return;
        }
        serving = (await readSseDeltas(res.body, (delta) => {
          text += delta;
          paint(true);
        })) || id;
        paint(false);
        if (convId && text) persist(convId, { role: 'assistant', content: text, model: serving });
        // The other shape of the outage: a 200 the gateway moved to Free. Said
        // only when the gateway says it — the data-collection header it sets on
        // a data-shared reply, or a served id that is itself a free route. A
        // served id that merely differs is the gateway naming a model
        // canonically, and calling a private turn shared would be a lie. It is
        // also news only to a reader who asked for a paid model.
        const onFree =
          dataCollected(res.headers) ||
          (servedByFallback(id, { model: serving }) && isFree(serving));
        if (onFree && !isFree(id)) setOffer('keep');
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          // Stopped by the user — keep the partial turn, honestly persisted.
          paint(false);
          if (convId && text) persist(convId, { role: 'assistant', content: text, model: serving });
        } else {
          paint(false, true);
          setNotice('The stream was interrupted.');
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [model, persist],
  );

  /** Take the offer: serve on Free, replaying the refused turn if one is held. */
  const goFree = useCallback(() => {
    pick(FREE_MODEL);
    const turn = pendingRef.current;
    pendingRef.current = null;
    if (turn) void complete(turn.history, turn.convId, FREE_MODEL);
    else setOffer(null);
  }, [pick, complete]);

  /** Free is data-shared, so the first switch asks; later ones go straight. */
  const switchFree = useCallback(() => {
    if (hasConsent(window.localStorage)) goFree();
    else setConsenting(true);
  }, [goFree]);

  const send = useCallback(async () => {
    const content = input.trim();
    if (!content || streaming) return;
    setInput('');

    // Lazily create the conversation in cloud on the first turn.
    let convId = activeId;
    if (!convId && !signedOut) {
      try {
        const b = await api<{ conversation: Conversation }>('/v1/chat/conversations', {
          method: 'POST',
          body: JSON.stringify({ title: content.slice(0, 80) }),
        });
        convId = b.conversation.id;
        setActiveId(convId);
        setConversations((prev) => [b.conversation, ...prev]);
      } catch (err) {
        if ((err as { status?: number }).status === 401) setSignedOut(true);
        // Persistence being down doesn't block the answer; convId stays null.
      }
    }

    const userMsg: Message = { role: 'user', content };
    if (convId) persist(convId, userMsg);
    await complete([...messages, userMsg], convId);
  }, [input, streaming, activeId, signedOut, messages, complete, persist]);

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const regenerate = useCallback(() => {
    if (streaming) return;
    // Re-run from the last user turn: drop the trailing assistant message.
    const history = [...messages];
    while (history.length && history[history.length - 1].role === 'assistant') history.pop();
    if (history.length) void complete(history, activeId);
  }, [messages, streaming, activeId, complete]);

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()),
  );

  // What the picker offers: the house families, plus Free while Free is what is
  // serving — so the trigger can name it and a paid model stays one pick away.
  const picker = isFree(model)
    ? [...models, { value: FREE_MODEL, label: FREE_MODEL_LABEL }]
    : models.length
      ? models
      : [{ value: CHAT_DEFAULT, label: 'Zen 5' }];

  return (
    <AppShell currentView="chat">
      <XStack position="relative" flex={1} minHeight={0}>
        {/* Conversation rail — in flow at lg+, overlay drawer below. */}
        <YStack
          position="absolute" top="$0" bottom="$0" left="$0" zIndex={30} backgroundColor="$background" borderRightWidth={1} borderColor="$borderColor" $lg={{ position: "relative", zIndex: 0 }} {...{ width: railOpen ? 256 : 0, overflow: railOpen ? undefined : "hidden" }}
          data-testid="chat-rail"
        >
          <YStack padding="$3" borderBottomWidth={1} borderColor="$borderColor">
            <Button
              onClick={newChat}
              variant="outline"
              width="100%" justifyContent="flex-start" gap="$2" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" hoverStyle={{ backgroundColor: "$color3" }}
              data-testid="new-chat"
            >
              <Plus size={16} />
              New chat
            </Button>
          </YStack>

          <YStack padding="$3">
            <Input
              placeholder="Search chats"
              value={search}
              onChangeText={(v: string) => setSearch(v)}
              startAdornment={<Search size={16} />} backgroundColor="$background" borderColor="$borderColor" color="$color" placeholderTextColor="$color11"
  />
          </YStack>

          <ScrollArea flex={1}>
            <YStack padding="$2" rowGap="$1" data-testid="conversation-list">
              {filtered.map((c) => (
                <Button
                  key={c.id}
                  onClick={() => openConversation(c.id)}
                  variant="ghost"
                  group
                  width="100%" justifyContent="flex-start" alignItems="flex-start" gap="$2" padding="$2.5" borderRadius="$5"
                  backgroundColor={activeId === c.id ? "$color3" : undefined}
                  hoverStyle={{ backgroundColor: "$color3" }}
                >
                  <MessageCircle size={16} />
                  <SizableText flex={1} minWidth={0} fontSize="$3" numberOfLines={1} color={activeId === c.id ? "$color" : "$color11"} $group-hover={{ color: "$color" }}>{c.title}</SizableText>
                </Button>
              ))}
              {!filtered.length && !signedOut && (
                <Paragraph paddingHorizontal="$3" paddingVertical="$2" fontSize="$1" color="$color11">No conversations yet. Every chat you start is saved here.</Paragraph>
              )}
            </YStack>
          </ScrollArea>
        </YStack>

        {/* Thread */}
        <YStack flex={1} minWidth={0}>
          <XStack alignItems="center" gap="$2" borderBottomWidth={1} borderColor="$borderColor" padding="$3">
            {/* ONE glyph for the left panel — `PanelLeft`, open or shut (the
                fleet rule; see components/sidebar). This rail toggle sits ~330px
                from the shell sidebar's own toggle, so while it swapped in
                `PanelLeftClose` the two controls that mean "show/hide the column
                on your left" were two different shapes on screen at once. */}
            <Button size="icon"
              variant="ghost"
              group
              onClick={() => setRailOpen((o) => !o)}
              aria-label={railOpen ? 'Hide conversations' : 'Show conversations'}
              aria-expanded={railOpen}
            >
              <SizableText color="$color11" $group-hover={{ color: "$color" }}>
                <PanelLeft size={16} />
              </SizableText>
            </Button>
            <Select value={model} onValueChange={pick}>
              <SelectTrigger
                width={160} minWidth={0} backgroundColor="$background" borderColor="$borderColor"
                data-testid="model-picker"
              >
                {/* Named from the list itself, so the trigger and the options
                    cannot disagree about what is serving. */}
                <SelectValue>{picker.find((m) => m.value === model)?.label ?? model}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {picker.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </XStack>

          <ScrollArea flex={1}>
            <YStack width="100%" maxWidth={768} alignSelf="center" padding="$4" $md={{ padding: "$6" }}>
              {signedOut && (
                <YStack
                  marginBottom="$4" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" padding="$4"
                  data-testid="signin-notice"
                >
                  <Paragraph fontSize="$3" color="$color">Sign in to chat</Paragraph>
                  <Paragraph marginTop="$1" fontSize="$3" color="$color11">
                    Answers are metered to your own account, so chatting needs a session.
                  </Paragraph>
                  <a href="/login?next=/chat">
                    <Button variant="outline" size="sm" marginTop="$3">Sign in</Button>
                  </a>
                </YStack>
              )}
              {notice && (
                <YStack
                  marginBottom="$4" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" padding="$3"
                  data-testid="chat-notice"
                >
                  <Paragraph fontSize="$3" color="$color11">{notice}</Paragraph>
                </YStack>
              )}
              {offer && (
                <YStack
                  marginBottom="$4" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" padding="$4"
                  data-testid="free-offer"
                >
                  {offer === 'switch' ? (
                    <>
                      <Paragraph fontSize="$3" color="$color">{freeCopy.paidTitle}</Paragraph>
                      <Paragraph marginTop="$1" fontSize="$3" color="$color11">{freeCopy.paidBody}</Paragraph>
                    </>
                  ) : (
                    <Paragraph fontSize="$3" color="$color11">{freeCopy.fallbackBody}</Paragraph>
                  )}
                  <XStack marginTop="$3" gap="$2">
                    {/* Staying on Free is the reader's call, never automatic —
                        it is data-shared, and nobody can opt in for them. */}
                    <Button {...accent} size="sm" onClick={switchFree} data-testid="free-switch">
                      {offer === 'switch' ? freeCopy.switchCta : freeCopy.keepCta}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setOffer(null)} data-testid="free-dismiss">
                      {freeCopy.dismissCta}
                    </Button>
                  </XStack>
                </YStack>
              )}
              {!messages.length && !signedOut && (
                <YStack alignItems="center" justifyContent="center" paddingVertical={96}>
                  <H1 fontSize="$8" fontWeight="500" color="$color" textAlign="center">What can I help with?</H1>
                  <Paragraph marginTop="$2" maxWidth={384} fontSize="$3" color="$color11" textAlign="center">
                    Answers stream in as they are written, and every chat is kept
                    in your account so you can come back to it.
                  </Paragraph>
                </YStack>
              )}
              <YStack rowGap="$5">
                {messages.map((m, i) =>
                  m.role === 'user' ? (
                    <XStack key={i} justifyContent="flex-end" data-testid="message-user">
                      <Paragraph maxWidth="85%" whiteSpace="pre-wrap" borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$4" paddingVertical="$2.5" fontSize="$3" color="$color">
                        {m.content}
                      </Paragraph>
                    </XStack>
                  ) : (
                    <YStack key={i} group data-testid="message-assistant">
                      <XStack alignItems="center" gap="$2" paddingBottom="$1">
                        <SizableText fontSize="$3" fontWeight="500" color="$color">Hanzo</SizableText>
                        {m.model && (
                          <SizableText fontSize="$1" color="$color11">
                            {isFree(m.model) ? FREE_MODEL_LABEL : m.model}
                          </SizableText>
                        )}
                      </XStack>
                      <MarkdownRenderer content={m.content} compact />
                      {m.streaming && (
                        <SizableText
                          width={8} height={16} marginLeft="$0.5" backgroundColor="$color"
                          data-testid="streaming-cursor"
                        />
                      )}
                      {!m.streaming && i === messages.length - 1 && (
                        <XStack marginTop="$2" opacity={0} $group-hover={{ opacity: 1 }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={regenerate}
                            paddingHorizontal="$2"
                            data-testid="regenerate"
                          >
                            <RefreshCw size={12} />
                            <SizableText fontSize="$2" color="$color11">Regenerate</SizableText>
                          </Button>
                        </XStack>
                      )}
                    </YStack>
                  ),
                )}
              </YStack>
              <div ref={endRef} />
            </YStack>
          </ScrollArea>

          {/* Composer */}
          <YStack borderTopWidth={1} borderColor="$borderColor" padding="$3" $md={{ padding: "$4" }}>
            <YStack width="100%" maxWidth={768} alignSelf="center">
              <YStack position="relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChangeText={(t) => setInput(t)}
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (sends(e.key, e.nativeEvent)) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                  placeholder="Message Hanzo…"
                  rows={1}
                  minHeight={48} maxHeight={200} paddingRight="$8" backgroundColor="$background" borderColor="$borderColor" color="$color" placeholderTextColor="$color11"
                  data-testid="composer"
  />
                {streaming ? (
                  <Button size="icon"
                    {...accent}
                    onClick={stop}
                    aria-label="Stop generating"
                    position="absolute" right="$2" bottom="$2" height="$6" width="$6" padding="$0"
                    data-testid="stop"
                  >
                    <Square size={14} />
                  </Button>
                ) : (
                  <Button size="icon"
                    {...accent}
                    onClick={() => void send()}
                    disabled={!input.trim()}
                    aria-label="Send"
                    position="absolute" right="$2" bottom="$2" height="$6" width="$6" padding="$0" disabledStyle={{ opacity: 0.5 }}
                    data-testid="send"
                  >
                    <ArrowUp size={16} />
                  </Button>
                )}
              </YStack>
              <Paragraph marginTop="$2" fontSize="$1" color="$color11">
                {streaming ? 'Generating…' : 'Enter to send, Shift+Enter for a new line'}
              </Paragraph>
            </YStack>
          </YStack>
        </YStack>

        {/* Mounted only while open: @hanzo/ui's Dialog runs useMedia even when
            closed, which throws during prerender (see components/usage). */}
        {consenting && (
          <Dialog open onOpenChange={setConsenting}>
            <DialogContent
              borderColor="$borderColor" backgroundColor="$background" $sm={{ maxWidth: 448 }}
              data-testid="free-consent"
            >
              <DialogHeader>
                <DialogTitle fontSize="$7" fontWeight="500" letterSpacing={-0.4}>{freeCopy.consentTitle}</DialogTitle>
                <DialogDescription color="$color11">{freeCopy.consentBody}</DialogDescription>
              </DialogHeader>
              <YStack gap="$2">
                {freeCopy.consentPoints.map((point) => (
                  <SizableText key={point} fontSize="$1" lineHeight={18} color="$color11">{point}</SizableText>
                ))}
              </YStack>
              {/* The terms live on hanzo.ai and are linked, not copied — this
                  app has no /terms route (see /signup). */}
              <Paragraph fontSize="$1" color="$color11">
                <Anchor
                  href="https://hanzo.ai/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  textDecorationLine="underline"
                >
                  {freeCopy.termsText}
                </Anchor>
              </Paragraph>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConsenting(false)} data-testid="free-cancel">
                  {freeCopy.consentCancelCta}
                </Button>
                <Button
                  {...accent}
                  onClick={() => {
                    grantConsent(window.localStorage);
                    setConsenting(false);
                    goFree();
                  }}
                  data-testid="free-agree"
                >
                  {freeCopy.consentAgreeCta}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </XStack>
    </AppShell>
  );
}
