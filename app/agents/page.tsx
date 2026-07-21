"use client";

/**
 * /agents — the console's agent registry, backed by the canonical Hanzo Cloud
 * `/v1/agents` surface (via the same-origin BFF at app/v1/agents/*). No mock
 * data: the page shows exactly what the caller's org has, an honest empty
 * state when there are none, and real errors when the service is unreachable.
 * Running an agent POSTs to `/v1/agents/:name/run` and surfaces the real,
 * recorded run output (or the recorded upstream failure).
 */

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
import { toast } from "sonner";
import { Button } from "@hanzo/ui";
import { Input } from "@hanzo/ui";
import { Badge } from "@hanzo/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@hanzo/ui";
import { HanzoLogo } from "@/components/HanzoLogo";
import { AppShell } from "@/components/app-shell";
import { cn } from "@/lib/utils";
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
      return "text-neutral-400";
  }
}

function statusIcon(status: string) {
  switch (status) {
    case "ready":
      return <CheckCircle2 className="w-4 h-4" />;
    case "running":
      return <Loader2 className="w-4 h-4 animate-spin" />;
    case "error":
      return <XCircle className="w-4 h-4" />;
    default:
      return <AlertCircle className="w-4 h-4" />;
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
    <div className="flex-1 overflow-y-auto bg-black">
      {/* Header */}
      <header className="border-b border-neutral-800 px-4 py-4 sm:px-6">
        <div className="container mx-auto">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/" className="flex items-center gap-2">
                <HanzoLogo className="w-8 h-8 text-purple-500" />
                <span className="text-xl font-medium text-white">Agents</span>
              </Link>
              {state.kind === "ready" && (
                <Badge variant="outline" className="gap-1">
                  <Activity className="w-3 h-3" />
                  {stats.total} {stats.total === 1 ? "agent" : "agents"}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:w-auto">
              <Link href="/dev">
                <Button variant="outline" className="w-full gap-2 lg:w-auto">
                  <Code2 className="w-4 h-4" />
                  Dev
                </Button>
              </Link>
              {state.kind === "ready" && (
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    setForm({
                      name: "",
                      model: agents[0]?.model || "zen5",
                      instructions: "",
                    });
                    setCreating(true);
                  }}
                >
                  <Plus className="w-4 h-4" />
                  New Agent
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={load}
                disabled={state.kind === "loading"}
                className="gap-2"
              >
                <RefreshCw
                  className={cn(
                    "w-4 h-4",
                    state.kind === "loading" && "animate-spin"
                  )}
                />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 sm:px-6">
        {/* Loading */}
        {state.kind === "loading" && (
          <div className="flex flex-col items-center justify-center py-24 text-neutral-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p>Loading agents…</p>
          </div>
        )}

        {/* Unauthenticated */}
        {state.kind === "unauthenticated" && (
          <Card className="bg-neutral-900 border-neutral-800 mx-auto max-w-lg mt-12">
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10">
                <Bot className="w-6 h-6 text-purple-400" />
              </div>
              <CardTitle className="text-white">Sign in to view agents</CardTitle>
              <CardDescription>
                Your agents are scoped to your organization. Sign in to see and
                run them.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Link href="/">
                <Button className="gap-2">Sign in</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {state.kind === "error" && (
          <Card className="bg-red-950/20 border-red-900/50 mx-auto max-w-lg mt-12">
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <CardTitle className="text-white">
                Couldn&apos;t load agents
              </CardTitle>
              <CardDescription className="text-red-300">
                {state.message}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button variant="outline" onClick={load} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Try again
              </Button>
            </CardContent>
          </Card>
        )}

        {state.kind === "ready" && (
          <>
            {/* Create agent — name + model + instructions */}
            {creating && (
              <Card className="bg-neutral-900 border-neutral-800 mb-6">
                <CardHeader>
                  <CardTitle className="text-base text-white">
                    New agent
                  </CardTitle>
                  <CardDescription>
                    A model plus instructions. It appears below to run on
                    command.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <Input
                    placeholder="Name (e.g. release-notes)"
                    className="bg-neutral-950 border-neutral-800"
                    value={form.name}
                    disabled={submitting}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                  />
                  <Input
                    placeholder="Model (e.g. zen5)"
                    className="bg-neutral-950 border-neutral-800"
                    value={form.model}
                    disabled={submitting}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setForm((f) => ({ ...f, model: e.target.value }))
                    }
                  />
                  <textarea
                    placeholder="Instructions — the agent's system prompt (optional)"
                    className="min-h-24 rounded-md border border-neutral-800 bg-neutral-950 p-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none"
                    value={form.instructions}
                    disabled={submitting}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setForm((f) => ({ ...f, instructions: e.target.value }))
                    }
                  />
                  <div className="flex gap-2">
                    <Button
                      className="gap-2"
                      disabled={submitting}
                      onClick={createAgent}
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
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
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats — responsive: 2 cols on phones, 4 on larger */}
            <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-4 sm:gap-4">
              {[
                { label: "Total", value: stats.total, tone: "text-white" },
                { label: "Ready", value: stats.ready, tone: "text-green-400" },
                { label: "Runs", value: stats.runs, tone: "text-white" },
                { label: "Models", value: stats.models, tone: "text-white" },
              ].map((s) => (
                <Card key={s.label} className="bg-neutral-900 border-neutral-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-neutral-400">
                      {s.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={cn("text-2xl font-medium", s.tone)}>{s.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Search */}
            {agents.length > 0 && (
              <div className="relative mb-6 w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <Input
                  placeholder="Search agents…"
                  className="pl-10 bg-neutral-900 border-neutral-800"
                  value={search}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearch(e.target.value)
                  }
                />
              </div>
            )}

            {/* Empty — no agents at all */}
            {agents.length === 0 && (
              <Card className="bg-neutral-900 border-neutral-800 mx-auto max-w-lg mt-12">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10">
                    <Bot className="w-6 h-6 text-purple-400" />
                  </div>
                  <CardTitle className="text-white">
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
              <p className="py-12 text-center text-neutral-500">
                No agents match “{search}”.
              </p>
            )}

            {/* Agent grid — 1 col on phones, 2 on tablets, 3 on desktop */}
            {filtered.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((agent) => {
                  const isOpen = expanded === agent.name;
                  const result = results[agent.name];
                  const isRunning = !!running[agent.name];
                  return (
                    <Card
                      key={agent.id}
                      className="bg-neutral-900 border-neutral-800 flex flex-col"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 space-y-1">
                            <CardTitle className="text-base text-white truncate">
                              {agent.name}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-1 text-xs">
                              <Terminal className="w-3 h-3 shrink-0" />
                              <span className="truncate">{agent.model}</span>
                            </CardDescription>
                          </div>
                          <div
                            className={cn(
                              "flex items-center gap-1 shrink-0",
                              statusColor(agent.status)
                            )}
                          >
                            {statusIcon(agent.status)}
                            <span className="text-xs font-medium capitalize">
                              {agent.status}
                            </span>
                          </div>
                        </div>
                        {agent.description && (
                          <p className="mt-2 text-sm text-neutral-400 line-clamp-2">
                            {agent.description}
                          </p>
                        )}
                      </CardHeader>

                      <CardContent className="flex flex-1 flex-col gap-3 pt-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                          <span className="flex items-center gap-1">
                            <Cpu className="w-3 h-3" />
                            {agent.runs} {agent.runs === 1 ? "run" : "runs"}
                          </span>
                          {agent.tools.length > 0 && (
                            <span className="flex flex-wrap gap-1">
                              {agent.tools.slice(0, 3).map((t) => (
                                <Badge
                                  key={t}
                                  variant="outline"
                                  className="text-[10px] py-0"
                                >
                                  {t}
                                </Badge>
                              ))}
                              {agent.tools.length > 3 && (
                                <span className="text-neutral-600">
                                  +{agent.tools.length - 3}
                                </span>
                              )}
                            </span>
                          )}
                        </div>

                        {/* Run input + action */}
                        <div className="mt-auto flex flex-col gap-2 lg:flex-row">
                          <Input
                            placeholder="Message this agent…"
                            className="bg-neutral-950 border-neutral-800 text-sm"
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
                            className="gap-2 shrink-0"
                            disabled={isRunning}
                            onClick={() => runAgent(agent.name)}
                          >
                            {isRunning ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                            Run
                          </Button>
                        </div>

                        {/* View / collapse the latest run output */}
                        {result && (
                          <div>
                            <button
                              onClick={() =>
                                setExpanded(isOpen ? null : agent.name)
                              }
                              className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-200"
                            >
                              {isOpen ? (
                                <ChevronDown className="w-3 h-3" />
                              ) : (
                                <ChevronRight className="w-3 h-3" />
                              )}
                              Latest run
                              <span
                                className={cn(
                                  "ml-1",
                                  statusColor(
                                    result.status === "ok" ? "ready" : "error"
                                  )
                                )}
                              >
                                ({result.status}, {result.durationMs}ms)
                              </span>
                            </button>
                            {isOpen && (
                              <div className="mt-2 rounded bg-neutral-950 p-3">
                                {result.status === "ok" ? (
                                  <pre className="whitespace-pre-wrap break-words text-xs text-neutral-300 max-h-64 overflow-y-auto">
                                    {result.output || "(empty response)"}
                                  </pre>
                                ) : (
                                  <pre className="whitespace-pre-wrap break-words text-xs text-red-400 max-h-64 overflow-y-auto">
                                    {result.error || "Run failed"}
                                  </pre>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </AppShell>
  );
}
