"use client";

/**
 * /agents — the console's agent registry, backed by the canonical Hanzo Cloud
 * `/v1/agents` surface (via the same-origin BFF at app/v1/agents/*). No mock
 * data: the page shows exactly what the caller's org has, an honest empty
 * state when there are none, and real errors when the service is unreachable.
 * Running an agent POSTs to `/v1/agents/:name/run` and surfaces the real,
 * recorded run output (or the recorded upstream failure).
 */

import { YStack, XStack, SizableText, Paragraph } from '@hanzo/gui';
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  Play,
  RefreshCw,
  Terminal,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  ChevronDown,
  Search,
  Cpu,
  Code2,
  Bot,
  Plus,
} from "lucide-react";
import { toast, Button, Input, Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Textarea } from '@hanzo/ui';
import { HanzoLogo } from "@/components/HanzoLogo";
import { AppShell } from "@/components/app-shell";
import Link from "next/link";

// The canonical cloud agentView shape (cloud/clients/agents/agents.go).
interface Agent {
  id: string;
  name: string;
  model: string;
  description?: string;
  tools: string[];
  status: string;
  runs: number;
  createdAt: string;
  updatedAt: string;
}

// The canonical cloud runView shape returned by POST /v1/agents/:name/run.
interface RunResult {
  id: string;
  status: string; // "ok" | "error"
  model: string;
  input: string;
  output?: string;
  error?: string;
  durationMs: number;
  createdAt: string;
}

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; agents: Agent[] }
  | { kind: "unauthenticated" }
  | { kind: "error"; message: string };

function statusColor(status: string) {
  switch (status) {
    case "ready":
      return "text-green-500";
    case "running":
      return "text-blue-500";
    case "error":
      return "text-red-500";
    default:
      return "text-muted-foreground";
  }
}

function statusIcon(status: string) {
  switch (status) {
    case "ready":
      return <CheckCircle2 size={16} />;
    case "running":
      return <Loader2 size={16} />;
    case "error":
      return <XCircle size={16} />;
    default:
      return <AlertCircle size={16} />;
  }
}

export default function AgentsPage() {
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  // Per-agent transient run I/O, keyed by agent name.
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [running, setRunning] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, RunResult>>({});
  // Create-agent form (name + model + instructions).
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", model: "", instructions: "" });

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const res = await fetch("/v1/agents", { cache: "no-store" });
      if (res.status === 401) {
        setState({ kind: "unauthenticated" });
        return;
      }
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setState({
          kind: "error",
          message: data?.message || `Failed to load agents (${res.status}).`,
        });
        return;
      }
      setState({ kind: "ready", agents: data.agents as Agent[] });
    } catch {
      setState({
        kind: "error",
        message: "Unable to reach the agents service.",
      });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runAgent = useCallback(
    async (name: string) => {
      const input = (inputs[name] || "").trim();
      setRunning((r) => ({ ...r, [name]: true }));
      try {
        const res = await fetch(`/v1/agents/${encodeURIComponent(name)}/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input }),
        });
        if (res.status === 401) {
          setState({ kind: "unauthenticated" });
          return;
        }
        const run = (await res.json().catch(() => null)) as RunResult | null;
        if (run && (run.status === "ok" || run.status === "error")) {
          setResults((m) => ({ ...m, [name]: run }));
          setExpanded(name);
          if (run.status === "ok") {
            toast.success(`${name} ran in ${run.durationMs}ms`);
          } else {
            toast.error(run.error || `${name} failed`);
          }
        } else {
          const message =
            (run as { message?: string } | null)?.message ||
            `Run failed (${res.status}).`;
          toast.error(message);
        }
      } catch {
        toast.error("Unable to reach the agents service.");
      } finally {
        setRunning((r) => ({ ...r, [name]: false }));
      }
    },
    [inputs]
  );

  const createAgent = useCallback(async () => {
    const name = form.name.trim();
    const model = form.model.trim();
    if (!name || !model) {
      toast.error("Name and model are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/v1/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, model, instructions: form.instructions }),
      });
      if (res.status === 401) {
        setState({ kind: "unauthenticated" });
        return;
      }
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok) {
        toast.success(`Created ${name}`);
        setCreating(false);
        setForm({ name: "", model: "", instructions: "" });
        load();
      } else {
        toast.error(data?.message || `Failed to create agent (${res.status}).`);
      }
    } catch {
      toast.error("Unable to reach the agents service.");
    } finally {
      setSubmitting(false);
    }
  }, [form, load]);

  const agents = state.kind === "ready" ? state.agents : [];
  const filtered = agents.filter((a) => {
    const q = search.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      a.model.toLowerCase().includes(q) ||
      (a.description || "").toLowerCase().includes(q)
    );
  });

  const stats = {
    total: agents.length,
    ready: agents.filter((a) => a.status === "ready").length,
    runs: agents.reduce((n, a) => n + (a.runs || 0), 0),
    models: new Set(agents.map((a) => a.model)).size,
  };

  return (
    <AppShell currentView="agents">
    <YStack flex={1} backgroundColor="$background" overflow="scroll">
      {/* Header */}
      <YStack borderBottomWidth={1} borderColor="$borderColor" paddingHorizontal="$4" paddingVertical="$4" $sm={{ paddingHorizontal: "$5" }}>
        <YStack width="100%" maxWidth={1280} alignSelf="center">
          <YStack gap="$4" $sm={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <XStack flexWrap="wrap" alignItems="center" gap="$3">
              <Link href="/"><XStack alignItems="center" gap="$2">
                <HanzoLogo className="w-8 h-8 text-purple-500" />
                <SizableText fontSize="$7" fontWeight="500" color="$color">Agents</SizableText>
              </XStack></Link>
              {state.kind === "ready" && (
                <Badge variant="outline" gap="$1">
                  <Activity size={12} />
                  {stats.total} {stats.total === 1 ? "agent" : "agents"}
                </Badge>
              )}
            </XStack>

            <YStack gap="$2" $lg={{ width: "auto" }}>
              <Link href="/dev">
                <Button variant="outline" width="100%" gap="$2" $lg={{ width: "auto" }}>
                  <Code2 size={16} />
                  Dev
                </Button>
              </Link>
              {state.kind === "ready" && (
                <Button
                  size="sm"
                  gap="$2"
                  onClick={() => {
                    setForm({
                      name: "",
                      model: agents[0]?.model || "zen5",
                      instructions: "",
                    });
                    setCreating(true);
                  }}
                >
                  <Plus size={16} />
                  New Agent
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={load}
                disabled={state.kind === "loading"}
                gap="$2"
              >
                <RefreshCw
                  size={16}
  />
                Refresh
              </Button>
            </YStack>
          </YStack>
        </YStack>
      </YStack>

      <YStack width="100%" maxWidth={1280} alignSelf="center" paddingHorizontal="$4" paddingVertical="$5" $sm={{ paddingHorizontal: "$5" }}>
        {/* Loading */}
        {state.kind === "loading" && (
          <SizableText flexDirection="column" alignItems="center" justifyContent="center" paddingVertical="$12" color="$color11" display="flex">
            <Loader2 size={32} />
            <p>Loading agents…</p>
          </SizableText>
        )}

        {/* Unauthenticated */}
        {state.kind === "unauthenticated" && (
          <Card backgroundColor="$background" borderColor="$borderColor" alignSelf="center" maxWidth={512} marginTop="$8">
            <CardHeader textAlign="center">
              <XStack alignSelf="center" marginBottom="$2" height="$8" width="$8" alignItems="center" justifyContent="center" borderRadius="$10" backgroundColor="$purple9">
                <Bot size={24} color="$purple8" />
              </XStack>
              <CardTitle color="$color">Sign in to view agents</CardTitle>
              <CardDescription>
                Your agents are scoped to your organization. Sign in to see and
                run them.
              </CardDescription>
            </CardHeader>
            <CardContent justifyContent="center">
              <Link href="/">
                <Button gap="$2">Sign in</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {state.kind === "error" && (
          <Card backgroundColor="$red12" borderColor="$red12" alignSelf="center" maxWidth={512} marginTop="$8">
            <CardHeader textAlign="center">
              <XStack alignSelf="center" marginBottom="$2" height="$8" width="$8" alignItems="center" justifyContent="center" borderRadius="$10" backgroundColor="$red9">
                <AlertCircle size={24} color="$red8" />
              </XStack>
              <CardTitle color="$color">
                Couldn&apos;t load agents
              </CardTitle>
              <CardDescription color="$red4">
                {state.message}
              </CardDescription>
            </CardHeader>
            <CardContent justifyContent="center">
              <Button variant="outline" onClick={load} gap="$2">
                <RefreshCw size={16} />
                Try again
              </Button>
            </CardContent>
          </Card>
        )}

        {state.kind === "ready" && (
          <>
            {/* Create agent — name + model + instructions */}
            {creating && (
              <Card backgroundColor="$background" borderColor="$borderColor" marginBottom="$5">
                <CardHeader>
                  <CardTitle fontSize="$4" color="$color">
                    New agent
                  </CardTitle>
                  <CardDescription>
                    A model plus instructions. It appears below to run on
                    command.
                  </CardDescription>
                </CardHeader>
                <CardContent flexDirection="column" gap="$3">
                  <Input
                    placeholder="Name (e.g. release-notes)"
                    backgroundColor="$background" borderColor="$borderColor"
                    value={form.name}
                    disabled={submitting}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
  />
                  <Input
                    placeholder="Model (e.g. zen5)"
                    backgroundColor="$background" borderColor="$borderColor"
                    value={form.model}
                    disabled={submitting}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setForm((f) => ({ ...f, model: e.target.value }))
                    }
  />
                  <Textarea
                    placeholder="Instructions — the agent's system prompt (optional)"
                    minHeight="$12" borderRadius="$3" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" padding="$3" fontSize="$3" color="$color" placeholderTextColor="$color11" focusStyle={{ outlineWidth: 0 }}
                    value={form.instructions}
                    disabled={submitting}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setForm((f) => ({ ...f, instructions: e.target.value }))
                    }
  />
                  <XStack gap="$2">
                    <Button
                      gap="$2"
                      disabled={submitting}
                      onClick={createAgent}
                    >
                      {submitting ? (
                        <Loader2 size={16} />
                      ) : (
                        <Plus size={16} />
                      )}
                      Create
                    </Button>
                    <Button
                      variant="outline"
                      disabled={submitting}
                      onClick={() => setCreating(false)}
                    >
                      Cancel
                    </Button>
                  </XStack>
                </CardContent>
              </Card>
            )}

            {/* Stats — responsive: 2 cols on phones, 4 on larger */}
            <YStack gap="$3" marginBottom="$5" $sm={{ gap: "$4" }}>
              {[
                { label: "Total", value: stats.total, tone: "text-foreground" },
                { label: "Ready", value: stats.ready, tone: "text-green-400" },
                { label: "Runs", value: stats.runs, tone: "text-foreground" },
                { label: "Models", value: stats.models, tone: "text-foreground" },
              ].map((s) => (
                <Card key={s.label} backgroundColor="$background" borderColor="$borderColor">
                  <CardHeader paddingBottom="$2">
                    <CardTitle fontSize="$3" color="$color11">
                      {s.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Paragraph fontSize="$8" fontWeight="500" className={`${s.tone}`}>{s.value}</Paragraph>
                  </CardContent>
                </Card>
              ))}
            </YStack>

            {/* Search */}
            {agents.length > 0 && (
              <YStack position="relative" marginBottom="$5" width="100%" maxWidth={448}>
                <Search size={16} color="$color11" />
                <Input
                  placeholder="Search agents…"
                  paddingLeft="$7" backgroundColor="$background" borderColor="$borderColor"
                  value={search}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearch(e.target.value)
                  }
  />
              </YStack>
            )}

            {/* Empty — no agents at all */}
            {agents.length === 0 && (
              <Card backgroundColor="$background" borderColor="$borderColor" alignSelf="center" maxWidth={512} marginTop="$8">
                <CardHeader textAlign="center">
                  <XStack alignSelf="center" marginBottom="$2" height="$8" width="$8" alignItems="center" justifyContent="center" borderRadius="$10" backgroundColor="$purple9">
                    <Bot size={24} color="$purple8" />
                  </XStack>
                  <CardTitle color="$color">
                    Create your first agent
                  </CardTitle>
                  <CardDescription>
                    An agent is a model plus instructions and tools. Once you
                    create one, it shows up here to run on command.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            {/* No search matches */}
            {agents.length > 0 && filtered.length === 0 && (
              <Paragraph paddingVertical="$8" textAlign="center" color="$color11">
                No agents match “{search}”.
              </Paragraph>
            )}

            {/* Agent grid — 1 col on phones, 2 on tablets, 3 on desktop */}
            {filtered.length > 0 && (
              <YStack gap="$4">
                {filtered.map((agent) => {
                  const isOpen = expanded === agent.name;
                  const result = results[agent.name];
                  const isRunning = !!running[agent.name];
                  return (
                    <Card
                      key={agent.id}
                      backgroundColor="$background" borderColor="$borderColor" flexDirection="column"
                    >
                      <CardHeader paddingBottom="$3">
                        <XStack alignItems="flex-start" justifyContent="space-between" gap="$2">
                          <YStack minWidth={0} rowGap="$1">
                            <CardTitle fontSize="$4" color="$color" ellipse numberOfLines={1}>
                              {agent.name}
                            </CardTitle>
                            <CardDescription alignItems="center" gap="$1" fontSize="$1">
                              <Terminal size={12} />
                              <SizableText numberOfLines={1}>{agent.model}</SizableText>
                            </CardDescription>
                          </YStack>
                          <XStack
                            alignItems="center" gap="$1" flexShrink={0} className={`${statusColor(agent.status)}`}
                          >
                            {statusIcon(agent.status)}
                            <SizableText fontSize="$1" fontWeight="500" textTransform="capitalize">
                              {agent.status}
                            </SizableText>
                          </XStack>
                        </XStack>
                        {agent.description && (
                          <Paragraph marginTop="$2" fontSize="$3" color="$color11" numberOfLines={2}>
                            {agent.description}
                          </Paragraph>
                        )}
                      </CardHeader>

                      <CardContent flex={1} flexDirection="column" gap="$3" paddingTop="$0">
                        <SizableText flexWrap="wrap" alignItems="center" gap="$2" fontSize="$1" color="$color11" display="flex" flexDirection="row">
                          <SizableText alignItems="center" gap="$1">
                            <Cpu size={12} />
                            {agent.runs} {agent.runs === 1 ? "run" : "runs"}
                          </SizableText>
                          {agent.tools.length > 0 && (
                            <SizableText flexWrap="wrap" gap="$1">
                              {agent.tools.slice(0, 3).map((t) => (
                                <Badge
                                  key={t}
                                  variant="outline"
                                  fontSize={10} paddingVertical="$0"
                                >
                                  {t}
                                </Badge>
                              ))}
                              {agent.tools.length > 3 && (
                                <SizableText color="$color11">
                                  +{agent.tools.length - 3}
                                </SizableText>
                              )}
                            </SizableText>
                          )}
                        </SizableText>

                        {/* Run input + action */}
                        <YStack marginTop="auto" gap="$2" $lg={{ flexDirection: "row" }}>
                          <Input
                            placeholder="Message this agent…"
                            backgroundColor="$background" borderColor="$borderColor" fontSize="$3"
                            value={inputs[agent.name] || ""}
                            disabled={isRunning}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) =>
                              setInputs((m) => ({
                                ...m,
                                [agent.name]: e.target.value,
                              }))
                            }
                            onKeyDown={(
                              e: React.KeyboardEvent<HTMLInputElement>
                            ) => {
                              if (e.key === "Enter" && !isRunning)
                                runAgent(agent.name);
                            }}
  />
                          <Button
                            size="sm"
                            gap="$2" flexShrink={0}
                            disabled={isRunning}
                            onClick={() => runAgent(agent.name)}
                          >
                            {isRunning ? (
                              <Loader2 size={16} />
                            ) : (
                              <Play size={16} />
                            )}
                            Run
                          </Button>
                        </YStack>

                        {/* View / collapse the latest run output */}
                        {result && (
                          <div>
                            <Button
                              onClick={() =>
                                setExpanded(isOpen ? null : agent.name)
                              }
                              alignItems="center" gap="$1" fontSize="$1" color="$color11" hoverStyle={{ color: "$color" }}
                            >
                              {isOpen ? (
                                <ChevronDown size={12} />
                              ) : (
                                <ChevronRight size={12} />
                              )}
                              Latest run
                              <SizableText
                                marginLeft="$1" className={`${statusColor(
                                    result.status === "ok" ? "ready" : "error"
                                  )}`}
                              >
                                ({result.status}, {result.durationMs}ms)
                              </SizableText>
                            </Button>
                            {isOpen && (
                              <YStack marginTop="$2" borderRadius="$2" backgroundColor="$background" padding="$3">
                                {result.status === "ok" ? (
                                  <SizableText whiteSpace="pre" wordBreak="break-word" fontSize="$1" color="$color11" maxHeight={256} overflow="scroll" fontFamily="$mono">
                                    {result.output || "(empty response)"}
                                  </SizableText>
                                ) : (
                                  <SizableText whiteSpace="pre" wordBreak="break-word" fontSize="$1" color="$red8" maxHeight={256} overflow="scroll" fontFamily="$mono">
                                    {result.error || "Run failed"}
                                  </SizableText>
                                )}
                              </YStack>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </YStack>
            )}
          </>
        )}
      </YStack>
    </YStack>
    </AppShell>
  );
}
