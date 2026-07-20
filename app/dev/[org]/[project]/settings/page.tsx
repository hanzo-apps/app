"use client";

/**
 * /dev/:org/:project/settings — the per-project CONFIG page.
 *
 * Everything you'd configure about a deployed app in ONE place, WITHOUT opening
 * the full /dev builder: name, framework, live status/URL, custom domain,
 * connected integrations, and the app's Base backend. Reached from a project
 * card's "Configure" action. Reads/writes the ONE org-scoped /v1/projects record
 * (the same store console.hanzo.ai uses) so config is consistent everywhere.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Globe,
  Plug,
  Database,
  Circle,
  ExternalLink,
  Pencil,
  Loader2,
  Trash2,
  GitBranch,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { HanzoLogo } from "@/components/HanzoLogo";
import {
  fetchProject,
  updateProject,
  deleteProject,
  liveUrlOf,
  builderLink,
  FRAMEWORKS,
  type Project,
} from "@/lib/api/projects";
import { statusOf } from "@/lib/project-status";
import { currentOrg, setCurrentOrg } from "@/lib/org-scope";
import { toast } from "sonner";

export default function ProjectSettingsPage() {
  const params = useParams<{ org: string; project: string }>();
  const org = decodeURIComponent(params.org || "");
  const slug = decodeURIComponent(params.project || "");
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [framework, setFramework] = useState("static");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (org && currentOrg() !== org) setCurrentOrg(org);
    const p = await fetchProject(slug).catch(() => null);
    setProject(p);
    if (p) {
      setName(p.name || "");
      setFramework(p.framework || "static");
    }
    setLoading(false);
  }, [org, slug]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!project) return;
    setSaving(true);
    try {
      const updated = await updateProject(slug, { name: name.trim(), framework });
      setProject(updated);
      toast.success("Project settings saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!project) return;
    if (!confirm(`Delete "${project.name}"? This also removes the live site. This cannot be undone.`)) return;
    try {
      await deleteProject(slug);
      toast.success("Project deleted.");
      router.push("/projects");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <HanzoLogo className="h-10 w-10 animate-pulse text-white" />
      </div>
    );
  }

  if (!project) {
    return (
      <AppShell currentView="all-projects">
        <div className="flex flex-1 items-center justify-center bg-black px-6 text-center">
          <div className="max-w-sm">
            <h1 className="text-lg font-medium text-white">Project not found</h1>
            <p className="mt-2 text-sm text-white/50">
              <span className="font-mono">{org}/{slug}</span> isn’t available to your account.
            </p>
            <Link href="/projects" className="mt-4 inline-block rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black hover:bg-white/90">
              Back to projects
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const st = statusOf(project.status);
  const live = liveUrlOf(project);
  const dirty = name.trim() !== (project.name || "") || framework !== (project.framework || "static");

  return (
    <AppShell currentView="all-projects">
      <div className="flex-1 overflow-y-auto bg-black">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-10">
          {/* Header */}
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <Link
                href="/projects"
                className="mb-2 inline-flex items-center gap-1.5 text-xs text-white/40 transition-colors hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Projects
              </Link>
              <div className="flex items-center gap-3">
                <h1 className="truncate text-2xl font-medium tracking-tight text-white">
                  {project.name}
                </h1>
                <span className={`inline-flex items-center gap-1 text-[11px] uppercase tracking-wide ${st.text}`}>
                  <Circle className={`h-1.5 w-1.5 ${st.dot.replace("bg-", "fill-")}`} />
                  {st.label}
                </span>
              </div>
              <p className="mt-1 font-mono text-xs text-white/35">{org}/{slug}</p>
            </div>
            <Link
              href={builderLink(slug, org)}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 transition-colors hover:border-white/30 hover:text-white"
            >
              <Pencil className="h-3.5 w-3.5" /> Open in builder
            </Link>
          </div>

          <div className="space-y-5">
            {/* General */}
            <Section icon={Pencil} title="General">
              <Field label="Project name">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                />
              </Field>
              <Field label="Framework">
                <select
                  value={framework}
                  onChange={(e) => setFramework(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                >
                  {FRAMEWORKS.map((f) => (
                    <option key={f.value} value={f.value} className="bg-neutral-900">
                      {f.label}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={save}
                  disabled={!dirty || saving}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-medium text-black transition-all hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/40"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save changes
                </button>
              </div>
            </Section>

            {/* Domains */}
            <Section icon={Globe} title="Domain">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-white/80">Live URL</p>
                  {live ? (
                    <a href={live} target="_blank" rel="noopener noreferrer" className="mt-0.5 inline-flex items-center gap-1.5 font-mono text-xs text-green-400/90 hover:text-green-400">
                      {live.replace(/^https?:\/\//, "")}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <p className="mt-0.5 text-xs text-white/40">Not published yet — publish from the builder to get a live URL.</p>
                  )}
                </div>
              </div>
              <p className="mt-3 border-t border-white/[0.06] pt-3 text-xs text-white/40">
                Custom domains are coming to project settings. For now every published app is served at{" "}
                <span className="font-mono text-white/60">{slug}.hanzo.app</span>.
              </p>
            </Section>

            {/* Source (Git) */}
            <Section icon={GitBranch} title="Source repository">
              <p className="text-sm text-white/55">
                Every published app is versioned in Hanzo Git (S3-backed). Its source is committed and pushed on each publish.
              </p>
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-2">
                <GitBranch className="h-3.5 w-3.5 shrink-0 text-white/40" />
                <code className="min-w-0 flex-1 truncate font-mono text-xs text-white/70">
                  https://git.hanzo.ai/{org}/{slug}.git
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(`https://git.hanzo.ai/${org}/${slug}.git`);
                    toast.success("Clone URL copied.");
                  }}
                  className="shrink-0 rounded px-2 py-1 text-xs text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Copy
                </button>
              </div>
            </Section>

            {/* Integrations */}
            <Section icon={Plug} title="Integrations & connections">
              <p className="text-sm text-white/55">
                Connect data sources, auth providers, and third-party services your app uses.
              </p>
              <Link
                href="/connectors"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2 text-sm text-white/80 transition-colors hover:border-white/20 hover:text-white"
              >
                <Plug className="h-3.5 w-3.5" /> Manage connectors
              </Link>
            </Section>

            {/* Base backend */}
            <Section icon={Database} title="Base backend">
              <p className="text-sm text-white/55">
                This app’s data plane — forms, records, and realtime run on its own Hanzo Base. It is provisioned on publish when the Base option is enabled.
              </p>
              <Link
                href={builderLink(slug, org)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2 text-sm text-white/80 transition-colors hover:border-white/20 hover:text-white"
              >
                <Database className="h-3.5 w-3.5" /> Open data & schema in builder
              </Link>
            </Section>

            {/* Danger */}
            <Section icon={Trash2} title="Danger zone" danger>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-white/55">
                  Delete this project and its live site. This cannot be undone.
                </p>
                <button
                  type="button"
                  onClick={remove}
                  className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 px-4 py-2 text-sm text-red-400 transition-colors hover:border-red-500/50 hover:bg-red-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete project
                </button>
              </div>
            </Section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Section({
  icon: Icon,
  title,
  danger,
  children,
}: {
  icon: React.ElementType;
  title: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl border p-5 ${danger ? "border-red-500/20 bg-red-500/[0.02]" : "border-white/10 bg-white/[0.02]"}`}
    >
      <div className="mb-4 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${danger ? "text-red-400/70" : "text-white/40"}`} />
        <h2 className="text-sm font-medium text-white">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-white/50">{label}</span>
      {children}
    </label>
  );
}
