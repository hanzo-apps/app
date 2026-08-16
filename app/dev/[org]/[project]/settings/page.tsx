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

import { H2, Paragraph, SizableText, Spinner, XStack, YStack } from '@hanzo/ui';
// `Anchor` is not on @hanzo/ui's barrel yet — the dts build drops it, the
// same way it drops the GuiElement type. Tracked; everything else in this
// file comes from @hanzo/ui.
import { Anchor } from '@hanzo/gui';
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Globe,
  Plug,
  Database,
  Circle,
  ExternalLink,
  Pencil,
  Trash2,
  GitBranch,
  ListChecks,
  Rocket,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { accent } from "@/lib/chrome";
import { LoadingScreen } from "@/components/ui/loading-screen";
import {
  fetchProject,
  updateProject,
  deleteProject,
  listDeployments,
  liveUrlOf,
  builderLink,
  issuesLink,
  FRAMEWORKS,
  type Project,
  type Deployment,
} from "@/lib/api/projects";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, toast, Button } from '@hanzo/ui';
import { CopyButton, FieldRow, Fieldset } from '@hanzo/ui/product';
import { statusOf } from "@/lib/project-status";
import { relativeTime } from "@/lib/projects-view";
import { currentOrg, setCurrentOrg } from "@/lib/org-scope";

/** The legend glyph's colour — quiet by default, the danger tone in that one
 *  group. `Fieldset` takes the icon as a node, so the colour is stated here. */
const ICON = "var(--muted-foreground)";
const DANGER_ICON = "rgba(248,113,113,0.7)";

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
    return <LoadingScreen>Loading project settings…</LoadingScreen>;
  }

  if (!project) {
    return (
      <AppShell currentView="all-projects" title="Project settings">
        <XStack flex={1} alignItems="center" justifyContent="center" backgroundColor="$background" paddingHorizontal="$5">
          <YStack maxWidth={384}>
            <H2 fontSize="$6" fontWeight="500" color="$color">Project not found</H2>
            <Paragraph marginTop="$2" fontSize="$3" color="$color11">
              <SizableText fontFamily="$mono">{org}/{slug}</SizableText> isn’t available to your account.
            </Paragraph>
            <Link href="/projects"><SizableText marginTop="$4" borderRadius="$10" {...accent} paddingHorizontal="$4.5" paddingVertical="$2.5" fontSize="$3" fontWeight="500" color="$color12">
              Back to projects
            </SizableText></Link>
          </YStack>
        </XStack>
      </AppShell>
    );
  }

  const st = statusOf(project.status);
  const live = liveUrlOf(project);
  const dirty = name.trim() !== (project.name || "") || framework !== (project.framework || "static");

  return (
    <AppShell
      currentView="all-projects"
      title={project.name}
      subtitle={`${org}/${slug}`}
      actions={
        <>
          <XStack alignItems="center" gap="$1">
            <Circle size={6} color={st.text} />
            <SizableText fontSize="$1" letterSpacing={0.4} color={st.text}>{st.label}</SizableText>
          </XStack>
          <Link href={issuesLink(slug, org)}>
            <Button variant="outline" gap="$2">
              <ListChecks size={14} />
              Issues
            </Button>
          </Link>
          <Link href={builderLink(slug, org)}>
            <Button variant="outline" gap="$2">
              <Pencil size={14} />
              Open in builder
            </Button>
          </Link>
        </>
      }
    >
          <YStack rowGap="$4.5">
            {/* General */}
            <Fieldset icon={<Pencil size={16} color={ICON} />} title="General">
              <FieldRow label="Project name">
                {/* The field emits text, not a change event — the DOM spelling
                    never fires on @hanzo/ui Input, so this rename box was inert. */}
                <Input value={name} onChangeText={setName} />
              </FieldRow>
              <FieldRow label="Framework">
                <Select value={framework} onValueChange={setFramework}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FRAMEWORKS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldRow>
              <XStack justifyContent="flex-end" paddingTop="$1">
                <Button
                  type="button"
                  onClick={save}
                  disabled={!dirty || saving}
                  alignItems="center" gap="$2" borderRadius="$10" {...accent} paddingHorizontal="$4.5" paddingVertical="$2" disabledStyle={{ cursor: "not-allowed", backgroundColor: "$color3" }}
                >
                  {saving && <Spinner size={14} />}
                  Save changes
                </Button>
              </XStack>
            </Fieldset>

            {/* Domains */}
            <Fieldset icon={<Globe size={16} color={ICON} />} title="Domain">
              <XStack flexWrap="wrap" alignItems="center" justifyContent="space-between" gap="$3">
                <YStack minWidth={0}>
                  <Paragraph fontSize="$3" color="$color">Live URL</Paragraph>
                  {live ? (
                    <Anchor href={live} target="_blank" rel="noopener noreferrer" marginTop="$0.5" display="inline-flex" alignItems="center" gap="$1.5" fontFamily="$mono" fontSize="$1" color="$green8" hoverStyle={{ color: "$green8" }}>
                      {live.replace(/^https?:\/\//, "")}
                      <ExternalLink size={12} />
                    </Anchor>
                  ) : (
                    <Paragraph marginTop="$0.5" fontSize="$1" color="$color11">Not published yet — publish from the builder to get a live URL.</Paragraph>
                  )}
                </YStack>
              </XStack>
              <Paragraph marginTop="$3" borderTopWidth={1} borderColor="$borderColor" paddingTop="$3" fontSize="$1" color="$color11">
                Custom domains are coming to project settings. For now every published app is served at{" "}
                <SizableText fontFamily="$mono" color="$color11">{slug}.hanzo.app</SizableText>.
              </Paragraph>
            </Fieldset>

            {/* Source (Git) */}
            <Fieldset icon={<GitBranch size={16} color={ICON} />} title="Source repository">
              <Paragraph fontSize="$3" color="$color11">
                Every published app is versioned in Hanzo Git (S3-backed). Its source is committed and pushed on each publish.
              </Paragraph>
              <XStack marginTop="$3" alignItems="center" gap="$2" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" paddingHorizontal="$3" paddingVertical="$2">
                <GitBranch size={14} />
                <SizableText minWidth={0} flex={1} numberOfLines={1} fontFamily="$mono" fontSize="$1" color="$color">
                  https://git.hanzo.ai/{org}/{slug}.git
                </SizableText>
                <CopyButton
                  value={`https://git.hanzo.ai/${org}/${slug}.git`}
                  label="Copy clone URL"
                  size={22}
                  id="clone-url"
                />
              </XStack>
            </Fieldset>

            {/* Deployments — the ONE serve (S3 → <slug>.hanzo.app) */}
            <Fieldset icon={<Rocket size={16} color={ICON} />} title="Deployments">
              <Paragraph fontSize="$3" color="$color11">
                Publishing deploys your site to Hanzo Cloud — live at{" "}
                <SizableText fontFamily="$mono" color="$color">{slug}.hanzo.app</SizableText> — and
                commits the source to Hanzo Git. Each publish is a new versioned deployment.
              </Paragraph>
              <DeploymentStatus slug={slug} />
            </Fieldset>

            {/* Integrations */}
            <Fieldset icon={<Plug size={16} color={ICON} />} title="Integrations & connections">
              <Paragraph fontSize="$3" color="$color11">
                Connect data sources, auth providers, and third-party services your app uses.
              </Paragraph>
              <Link
                href="/connectors"
              ><XStack marginTop="$3" alignItems="center" gap="$1.5" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$3.5" paddingVertical="$2" hoverStyle={{ borderColor: "$color" }}>
                <Plug size={14} />
                <SizableText fontSize="$3" color="$color">Manage connectors</SizableText>
              </XStack></Link>
            </Fieldset>

            {/* Base backend */}
            <Fieldset icon={<Database size={16} color={ICON} />} title="Base backend">
              <Paragraph fontSize="$3" color="$color11">
                This app’s data plane — forms, records, and realtime run on its own Hanzo Base. It is provisioned on publish when the Base option is enabled.
              </Paragraph>
              <Link
                href={builderLink(slug, org)}
              ><XStack marginTop="$3" alignItems="center" gap="$1.5" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$3.5" paddingVertical="$2" hoverStyle={{ borderColor: "$color" }}>
                <Database size={14} />
                <SizableText fontSize="$3" color="$color">Open data & schema in builder</SizableText>
              </XStack></Link>
            </Fieldset>

            {/* Danger */}
            <Fieldset icon={<Trash2 size={16} color={DANGER_ICON} />} title="Danger zone" danger>
              <XStack flexWrap="wrap" alignItems="center" justifyContent="space-between" gap="$3">
                <Paragraph fontSize="$3" color="$color11">
                  Delete this project and its live site. This cannot be undone.
                </Paragraph>
                <Button
                  variant="outline"
                  type="button"
                  onClick={remove}
                  backgroundColor="transparent" borderRadius="$10" borderWidth={1} borderColor="$red9" paddingHorizontal="$4" paddingVertical="$2" hoverStyle={{ borderColor: "$red9", backgroundColor: "$red9" }}
                >
                  <XStack alignItems="center" gap="$1.5">
                    <Trash2 size={14} />
                    <SizableText color="$red8">Delete project</SizableText>
                  </XStack>
                </Button>
              </XStack>
            </Fieldset>
          </YStack>
    </AppShell>
  );
}

/**
 * The app's deploy history — read from the SAME projects store the site serves
 * from (listDeployments). ONE serve: every publish deploys to S3 and goes live at
 * <slug>.hanzo.app; this shows the latest deployment's status + version + time.
 * The full history + logs live in the console (console.hanzo.ai).
 */
function DeploymentStatus({ slug }: { slug: string }) {
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "none" }
    | { kind: "error" }
    | { kind: "active"; d: Deployment }
  >({ kind: "loading" });

  useEffect(() => {
    let alive = true;
    listDeployments(slug)
      .then((ds) => {
        if (!alive) return;
        setState(ds.length ? { kind: "active", d: ds[0] } : { kind: "none" });
      })
      .catch(() => {
        if (alive) setState({ kind: "error" });
      });
    return () => {
      alive = false;
    };
  }, [slug]);

  if (state.kind === "loading") {
    return (
      <XStack marginTop="$3" alignItems="center" gap="$2">
        <Spinner size={14} />
        <SizableText fontSize="$1" color="$color11">Loading deploy history…</SizableText>
      </XStack>
    );
  }

  if (state.kind === "none") {
    return (
      <Paragraph marginTop="$3" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" paddingHorizontal="$3" paddingVertical="$2.5" fontSize="$1" color="$color11">
        Not deployed yet. Publish from the builder to go live at{" "}
        <SizableText fontFamily="$mono" color="$color11">{slug}.hanzo.app</SizableText>.
      </Paragraph>
    );
  }

  if (state.kind === "error") {
    return <Paragraph marginTop="$3" fontSize="$1" color="$color11">Couldn’t load deploy history.</Paragraph>;
  }

  const d = state.d;
  const c = deployStatusStyle(d.status);
  const when = d.updatedAt ? relativeTime(new Date(d.updatedAt * 1000).toISOString()) : null;
  return (
    <XStack marginTop="$3" flexWrap="wrap" alignItems="center" justifyContent="space-between" gap="$3" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" paddingHorizontal="$3" paddingVertical="$2.5">
      <XStack flexWrap="wrap" alignItems="center" columnGap="$3" rowGap="$1">
        <XStack alignItems="center" gap="$1.5">
          <Circle size={8} color={c.text} />
          <SizableText fontSize="$1" color={c.text}>{c.label}</SizableText>
        </XStack>
        {d.version > 0 && <SizableText fontFamily="$mono" fontSize="$1" color="$color11">v{d.version}</SizableText>}
        {when && <SizableText fontSize="$1" color="$color11">{when}</SizableText>}
      </XStack>
      <Anchor display="inline-flex"
        href="https://console.hanzo.ai"
        target="_blank"
        rel="noopener noreferrer"
        alignItems="center" gap="$1.5" fontSize="$1" color="$color11" hoverStyle={{ color: "$color" }}
      >
        History in console <ExternalLink size={12} />
      </Anchor>
    </XStack>
  );
}

/** Projects deploy status → dot + label: green = live, amber = in-flight, red = error. */
function deployStatusStyle(status: string): {
  dot: string;
  text: string;
  label: string;
  pulse: boolean;
} {
  switch (status) {
    case "live":
      return { dot: "#22c55e", text: "#4ade80", label: "Live", pulse: false };
    case "error":
      return { dot: "#ef4444", text: "#f87171", label: "Failed", pulse: false };
    case "queued":
    case "building":
    case "uploading":
      return {
        dot: "#f59e0b",
        text: "#fbbf24",
        label: status.charAt(0).toUpperCase() + status.slice(1),
        pulse: true,
      };
    default:
      return {
        dot: "var(--muted-foreground)",
        text: "var(--muted-foreground)",
        label: status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown",
        pulse: false,
      };
  }
}
