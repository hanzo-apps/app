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

import { XStack, SizableText, YStack, H1, Paragraph, Anchor, H2 } from '@hanzo/gui';
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
  Rocket,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { HanzoLogo } from "@/components/HanzoLogo";
import {
  fetchProject,
  updateProject,
  deleteProject,
  listDeployments,
  liveUrlOf,
  builderLink,
  FRAMEWORKS,
  type Project,
  type Deployment,
} from "@/lib/api/projects";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, toast, Button, Label } from '@hanzo/ui';
import { statusOf } from "@/lib/project-status";
import { relativeTime } from "@/lib/projects-view";
import { currentOrg, setCurrentOrg } from "@/lib/org-scope";

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
      <XStack minHeight="100%" alignItems="center" justifyContent="center" backgroundColor="$background">
        <HanzoLogo size={40} color="var(--foreground)" className="skeleton" />
      </XStack>
    );
  }

  if (!project) {
    return (
      <AppShell currentView="all-projects">
        <SizableText flex={1} alignItems="center" justifyContent="center" backgroundColor="$background" paddingHorizontal="$5" textAlign="center" display="flex" flexDirection="row">
          <YStack maxWidth={384}>
            <H1 fontSize="$6" fontWeight="500" color="$color">Project not found</H1>
            <Paragraph marginTop="$2" fontSize="$3" color="$color11">
              <SizableText fontFamily="$mono">{org}/{slug}</SizableText> isn’t available to your account.
            </Paragraph>
            <Link href="/projects"><SizableText marginTop="$4" borderRadius="$10" backgroundColor="$color12" paddingHorizontal="$4.5" paddingVertical="$2.5" fontSize="$3" fontWeight="500" color="$background" hoverStyle={{ backgroundColor: "$color12" }}>
              Back to projects
            </SizableText></Link>
          </YStack>
        </SizableText>
      </AppShell>
    );
  }

  const st = statusOf(project.status);
  const live = liveUrlOf(project);
  const dirty = name.trim() !== (project.name || "") || framework !== (project.framework || "static");

  return (
    <AppShell currentView="all-projects">
      <YStack flex={1} backgroundColor="$background" overflow="scroll">
        <YStack alignSelf="center" maxWidth={768} paddingHorizontal="$4" paddingVertical="$6" $sm={{ paddingHorizontal: "$5" }} $lg={{ paddingVertical: "$7" }}>
          {/* Header */}
          <XStack marginBottom="$6" flexWrap="wrap" alignItems="center" justifyContent="space-between" gap="$4">
            <YStack minWidth={0}>
              <Link
                href="/projects"
              ><SizableText marginBottom="$2" alignItems="center" gap="$1.5" fontSize="$1" color="$color11" hoverStyle={{ color: "$color" }}>
                <ArrowLeft size={14} /> Projects
              </SizableText></Link>
              <XStack alignItems="center" gap="$3">
                <H1 numberOfLines={1} fontSize="$8" fontWeight="500" letterSpacing={-0.4} color="$color">
                  {project.name}
                </H1>
                <SizableText alignItems="center" gap="$1" fontSize={11} textTransform="uppercase" letterSpacing={0.4} color={st.text}>
                  <Circle size={6} />
                  {st.label}
                </SizableText>
              </XStack>
              <Paragraph marginTop="$1" fontFamily="$mono" fontSize="$1" color="$color11">{org}/{slug}</Paragraph>
            </YStack>
            <Link
              href={builderLink(slug, org)}
            ><SizableText alignItems="center" gap="$2" borderRadius="$10" borderWidth={1} borderColor="$borderColor" paddingHorizontal="$4" paddingVertical="$2" fontSize="$3" color="$color" hoverStyle={{ borderColor: "$color", color: "$color" }}>
              <Pencil size={14} /> Open in builder
            </SizableText></Link>
          </XStack>

          <YStack rowGap="$4.5">
            {/* General */}
            <Section icon={Pencil} title="General">
              <Field label="Project name">
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label="Framework">
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
              </Field>
              <XStack justifyContent="flex-end" paddingTop="$1">
                <Button
                  type="button"
                  onClick={save}
                  disabled={!dirty || saving}
                  alignItems="center" gap="$2" borderRadius="$10" backgroundColor="$color12" paddingHorizontal="$4.5" paddingVertical="$2" hoverStyle={{ backgroundColor: "$color12" }} disabledStyle={{ cursor: "not-allowed", backgroundColor: "$color3" }}
                >
                  {saving && <Loader2 size={14} />}
                  Save changes
                </Button>
              </XStack>
            </Section>

            {/* Domains */}
            <Section icon={Globe} title="Domain">
              <XStack flexWrap="wrap" alignItems="center" justifyContent="space-between" gap="$3">
                <YStack minWidth={0}>
                  <Paragraph fontSize="$3" color="$color">Live URL</Paragraph>
                  {live ? (
                    <Anchor href={live} target="_blank" rel="noopener noreferrer" marginTop="$0.5" alignItems="center" gap="$1.5" fontFamily="$mono" fontSize="$1" color="$green8" hoverStyle={{ color: "$green8" }}>
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
            </Section>

            {/* Source (Git) */}
            <Section icon={GitBranch} title="Source repository">
              <Paragraph fontSize="$3" color="$color11">
                Every published app is versioned in Hanzo Git (S3-backed). Its source is committed and pushed on each publish.
              </Paragraph>
              <XStack marginTop="$3" alignItems="center" gap="$2" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" paddingHorizontal="$3" paddingVertical="$2">
                <GitBranch size={14} color="$color11" />
                <SizableText minWidth={0} flex={1} numberOfLines={1} fontFamily="$mono" fontSize="$1" color="$color">
                  https://git.hanzo.ai/{org}/{slug}.git
                </SizableText>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard?.writeText(`https://git.hanzo.ai/${org}/${slug}.git`);
                    toast.success("Clone URL copied.");
                  }}
                  flexShrink={0} borderRadius="$2" paddingHorizontal="$2" paddingVertical="$1"
                >
                  <SizableText fontSize="$1" color="$color11">Copy</SizableText>
                </Button>
              </XStack>
            </Section>

            {/* Deployments — the ONE serve (S3 → <slug>.hanzo.app) */}
            <Section icon={Rocket} title="Deployments">
              <Paragraph fontSize="$3" color="$color11">
                Publishing deploys your site to Hanzo Cloud — live at{" "}
                <SizableText fontFamily="$mono" color="$color">{slug}.hanzo.app</SizableText> — and
                commits the source to Hanzo Git. Each publish is a new versioned deployment.
              </Paragraph>
              <DeploymentStatus slug={slug} />
            </Section>

            {/* Integrations */}
            <Section icon={Plug} title="Integrations & connections">
              <Paragraph fontSize="$3" color="$color11">
                Connect data sources, auth providers, and third-party services your app uses.
              </Paragraph>
              <Link
                href="/connectors"
              ><SizableText marginTop="$3" alignItems="center" gap="$1.5" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$3.5" paddingVertical="$2" fontSize="$3" color="$color" hoverStyle={{ borderColor: "$color", color: "$color" }}>
                <Plug size={14} /> Manage connectors
              </SizableText></Link>
            </Section>

            {/* Base backend */}
            <Section icon={Database} title="Base backend">
              <Paragraph fontSize="$3" color="$color11">
                This app’s data plane — forms, records, and realtime run on its own Hanzo Base. It is provisioned on publish when the Base option is enabled.
              </Paragraph>
              <Link
                href={builderLink(slug, org)}
              ><SizableText marginTop="$3" alignItems="center" gap="$1.5" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$3.5" paddingVertical="$2" fontSize="$3" color="$color" hoverStyle={{ borderColor: "$color", color: "$color" }}>
                <Database size={14} /> Open data & schema in builder
              </SizableText></Link>
            </Section>

            {/* Danger */}
            <Section icon={Trash2} title="Danger zone" danger>
              <XStack flexWrap="wrap" alignItems="center" justifyContent="space-between" gap="$3">
                <Paragraph fontSize="$3" color="$color11">
                  Delete this project and its live site. This cannot be undone.
                </Paragraph>
                <Button
                  type="button"
                  onClick={remove}
                  backgroundColor="transparent" borderRadius="$10" borderWidth={1} borderColor="$red9" paddingHorizontal="$4" paddingVertical="$2" hoverStyle={{ borderColor: "$red9", backgroundColor: "$red9" }}
                >
                  <SizableText display="flex" flexDirection="row" alignItems="center" gap="$1.5" color="$red8">
                    <Trash2 size={14} /> Delete project
                  </SizableText>
                </Button>
              </XStack>
            </Section>
          </YStack>
        </YStack>
      </YStack>
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
    <YStack
      borderRadius="$8" borderWidth={1} padding="$4.5" {...{ borderColor: danger ? "$red9" : "$borderColor", backgroundColor: danger ? "$red9" : "$color3" }}
    >
      <XStack marginBottom="$4" alignItems="center" gap="$2">
        <Icon size={16} color={danger ? "rgba(248,113,113,0.7)" : "var(--muted-foreground)"} />
        <H2 fontSize="$3" fontWeight="500" color="$color">{title}</H2>
      </XStack>
      <YStack rowGap="$3">{children}</YStack>
    </YStack>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Label>
      <SizableText marginBottom="$1.5" fontSize="$1" color="$color11">{label}</SizableText>
      {children}
    </Label>
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
      <SizableText marginTop="$3" alignItems="center" gap="$2" fontSize="$1" color="$color11" display="flex" flexDirection="row">
        <Loader2 size={14} /> Loading deploy history…
      </SizableText>
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
        <SizableText alignItems="center" gap="$1.5" fontSize="$1" color={c.text}>
          <Circle size={8} />
          {c.label}
        </SizableText>
        {d.version > 0 && <SizableText fontFamily="$mono" fontSize={11} color="$color11">v{d.version}</SizableText>}
        {when && <SizableText fontSize={11} color="$color11">{when}</SizableText>}
      </XStack>
      <Anchor
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
