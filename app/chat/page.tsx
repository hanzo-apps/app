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
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  MessageCircle,
  PanelLeft,
  PanelLeftClose,
  Plus,
  RefreshCw,
  Search,
  Square,
} from 'lucide-react';

import { Button, ScrollArea } from '@hanzo/ui';
import { Input, Textarea } from '@/components/control';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/overlay';
import { AppShell } from '@/components/app-shell';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { DEFAULT_MODEL } from '@/lib/providers';
import { useModels } from '@/lib/hooks/use-models';
import { readSseDeltas } from '@/lib/chat/sse';
import { cn } from '@/lib/utils';

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
      <div className="relative flex min-h-0 flex-1">
        {/* Conversation rail — in flow at lg+, overlay drawer below. */}
        <div
          className={cn(
            'absolute inset-y-0 left-0 z-30 flex flex-col border-r border-border bg-card transition-all duration-200 lg:relative lg:z-auto',
            railOpen ? 'w-64' : 'w-0 overflow-hidden',
          )}
          data-testid="chat-rail"
        >
          <div className="border-b border-border p-3">
            <Button
              onClick={newChat}
              className="w-full justify-start gap-2 border border-border bg-card text-foreground hover:bg-muted"
              data-testid="new-chat"
            >
              <Plus className="h-4 w-4" />
              New chat
            </Button>
          </div>
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search chats"
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="space-y-1 p-2" data-testid="conversation-list">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => openConversation(c.id)}
                  className={cn(
                    'flex w-full items-start gap-2 rounded-lg p-2.5 text-left transition-colors',
                    activeId === c.id
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <MessageCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate text-sm">{c.title}</span>
                </button>
              ))}
              {!filtered.length && !signedOut && (
                <p className="px-3 py-2 text-xs text-muted-foreground">No conversations yet.</p>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Thread */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2 border-b border-border p-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRailOpen((o) => !o)}
              aria-label={railOpen ? 'Hide conversations' : 'Show conversations'}
              className="text-muted-foreground hover:text-foreground"
            >
              {railOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </Button>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger
                className="w-[160px] min-w-0 border-border bg-card text-foreground"
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
          </div>

          <ScrollArea className="flex-1">
            <div className="mx-auto max-w-3xl p-4 md:p-6">
              {signedOut && (
                <div
                  className="mb-4 rounded-lg border border-border bg-card p-4 text-sm"
                  data-testid="signin-notice"
                >
                  <p className="text-foreground">Sign in to chat</p>
                  <p className="mt-1 text-muted-foreground">
                    Answers are metered to your own account, so chatting needs a session.
                  </p>
                  <Button asChild size="sm" className="mt-3">
                    <a href="/login?next=/chat">Sign in</a>
                  </Button>
                </div>
              )}
              {notice && (
                <div
                  className="mb-4 rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground"
                  data-testid="chat-notice"
                >
                  {notice}
                </div>
              )}
              {!messages.length && !signedOut && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <h1 className="text-2xl font-medium text-foreground">What can I help with?</h1>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                    Ask anything — answers stream from your Zen models and every chat is saved
                    to your account.
                  </p>
                </div>
              )}
              <div className="space-y-6">
                {messages.map((m, i) =>
                  m.role === 'user' ? (
                    <div key={i} className="flex justify-end" data-testid="message-user">
                      <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-muted px-4 py-2.5 text-sm text-foreground">
                        {m.content}
                      </div>
                    </div>
                  ) : (
                    <div key={i} className="group" data-testid="message-assistant">
                      <div className="flex items-center gap-2 pb-1">
                        <span className="text-sm font-medium text-foreground">Hanzo</span>
                        {m.model && (
                          <span className="text-xs text-muted-foreground">{m.model}</span>
                        )}
                      </div>
                      <MarkdownRenderer content={m.content} compact />
                      {m.streaming && (
                        <span
                          className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-foreground align-text-bottom"
                          data-testid="streaming-cursor"
                        />
                      )}
                      {!m.streaming && i === messages.length - 1 && (
                        <div className="mt-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={regenerate}
                            className="px-2 text-muted-foreground hover:text-foreground"
                            data-testid="regenerate"
                          >
                            <RefreshCw className="mr-1 h-3 w-3" />
                            Regenerate
                          </Button>
                        </div>
                      )}
                    </div>
                  ),
                )}
              </div>
              <div ref={endRef} />
            </div>
          </ScrollArea>

          {/* Composer */}
          <div className="border-t border-border p-3 md:p-4">
            <div className="mx-auto max-w-3xl">
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                  placeholder="Message Hanzo…"
                  rows={1}
                  className="max-h-[200px] min-h-[48px] resize-none pr-12"
                  data-testid="composer"
                />
                {streaming ? (
                  <Button
                    onClick={stop}
                    size="icon"
                    aria-label="Stop generating"
                    className="absolute bottom-2 right-2 bg-primary p-0 text-primary-foreground hover:bg-primary/90"
                    data-testid="stop"
                  >
                    <Square className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => void send()}
                    disabled={!input.trim()}
                    size="icon"
                    aria-label="Send"
                    className="absolute bottom-2 right-2 bg-primary p-0 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    data-testid="send"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {streaming ? 'Generating…' : 'Enter to send, Shift+Enter for a new line'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
