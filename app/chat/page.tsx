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
  Button,
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
  // SSR-stable default (closed); opens on mount at lg+ — reading matchMedia in
  // the initializer would render server/client differently and break hydration.
  const [railOpen, setRailOpen] = useState(false);
  useEffect(() => {
    if (window.matchMedia('(min-width:1024px)').matches) setRailOpen(true);
  }, []);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Keep the selected model valid once the live zen list lands.
  useEffect(() => {
    if (models.length && !models.some((m) => m.value === model)) setModel(models[0].value);
  }, [models, model]);

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
    api<{ messages: Message[] }>(`/v1/chat/conversations/${encodeURIComponent(id)}`)
      .then((b) => setMessages(b.messages))
      .catch(() => setNotice('Could not load this conversation.'));
    if (typeof window !== 'undefined' && !window.matchMedia('(min-width:1024px)').matches) {
      setRailOpen(false);
    }
  }, []);

  const newChat = useCallback(() => {
    abortRef.current?.abort();
    setActiveId(null);
    setMessages([]);
    setNotice(null);
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

  /** Stream a completion for `history` and append the assistant turn. */
  const complete = useCallback(
    async (history: Message[], convId: string | null) => {
      setStreaming(true);
      setNotice(null);
      setMessages([...history, { role: 'assistant', content: '', model, streaming: true }]);

      const controller = new AbortController();
      abortRef.current = controller;
      let text = '';
      const paint = (streamingNow: boolean, error = false) =>
        setMessages([
          ...history,
          { role: 'assistant', content: text, model, streaming: streamingNow, error },
        ]);

      try {
        const res = await fetch('/v1/chat/completions', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: history.map(({ role, content }) => ({ role, content })),
          }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          const body = await res.json().catch(() => ({}) as { message?: string });
          if (res.status === 401) {
            setSignedOut(true);
            setMessages(history);
          } else {
            text = '';
            setNotice(
              res.status === 402
                ? body.message || "You're out of credits."
                : body.message || 'The model is unavailable right now.',
            );
            setMessages(history);
          }
          return;
        }
        await readSseDeltas(res.body, (delta) => {
          text += delta;
          paint(true);
        });
        paint(false);
        if (convId && text) persist(convId, { role: 'assistant', content: text, model });
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          // Stopped by the user — keep the partial turn, honestly persisted.
          paint(false);
          if (convId && text) persist(convId, { role: 'assistant', content: text, model });
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
                <Paragraph paddingHorizontal="$3" paddingVertical="$2" fontSize="$1" color="$color11">No conversations yet.</Paragraph>
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
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger
                width={160} minWidth={0} backgroundColor="$background" borderColor="$borderColor"
                data-testid="model-picker"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(models.length ? models : [{ value: CHAT_DEFAULT, label: 'Zen 5' }]).map((m) => (
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
              {!messages.length && !signedOut && (
                <YStack alignItems="center" justifyContent="center" paddingVertical={96}>
                  <H1 fontSize="$8" fontWeight="500" color="$color" textAlign="center">What can I help with?</H1>
                  <Paragraph marginTop="$2" maxWidth={384} fontSize="$3" color="$color11" textAlign="center">
                    Ask anything — answers stream from your Zen models and every chat is saved
                    to your account.
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
                          <SizableText fontSize="$1" color="$color11">{m.model}</SizableText>
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
                  minHeight={48} maxHeight={200} className="resize-none" paddingRight="$8" backgroundColor="$background" borderColor="$borderColor" color="$color" placeholderTextColor="$color11"
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
      </XStack>
    </AppShell>
  );
}
