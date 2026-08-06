'use client';

import { YStack, XStack, H3, SizableText, Paragraph, H1 } from '@hanzo/ui';
import { panel } from "@/lib/chrome";
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  RefreshCw,
  Plus,
  FolderOpen,
  Globe,
  Sparkles,
  BookOpen,
  AlertTriangle,
  ExternalLink,
  Newspaper,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { DiscordIcon } from '@/components/ui/discord-icon';
import { Button } from '@hanzo/ui';
import Link from 'next/link';
import { vfs } from '@/lib/vfs';
import { templateService } from '@/lib/vfs/template-service';
import { skillsService } from '@/lib/vfs/skills';
import { fetchProjects, type Project as CloudProject } from '@/lib/api/projects';
import { VERSION } from '@/lib/version';

const isServerMode = process.env.NEXT_PUBLIC_SERVER_MODE === 'true';

// A project row on the dashboard, normalized from either the org-scoped cloud
// store (source of truth) or the local IndexedDB VFS (unsynced drafts).
interface RecentProject {
  id: string;
  name: string;
  description: string | null;
  updatedAt: string; // ISO 8601
}

interface DashboardData {
  system: {
    version: string;
    nodeVersion: string;
    uptime: number;
    memoryUsed: number;
    memoryTotal: number;
  };
  content: {
    projects: number;
    templates: number;
    skills: number;
    totalFiles: number;
  };
  hosting: {
    publishedDeployments: number;
    deploymentsWithDb: number;
    storageUsed: number;
  };
  traffic: {
    requestsLastHour: number;
    requestsLastDay: number;
    errorCount: number;
    topDeployments: Array<{ deploymentId: string; deploymentName: string; count: number }>;
    recentErrors: Array<{ deploymentId: string; path: string; statusCode: number; timestamp: string }>;
  };
  whatsNew: {
    version: string;
    title: string;
    highlights: string[];
  };
  recentProjects: RecentProject[];
  recentDeployments: Array<{
    id: string;
    name: string;
    slug: string;
    enabled: boolean;
    publishedAt: string | null;
    updatedAt: string;
  }>;
}

// Browser mode data (subset of server mode)
interface BrowserDashboardData {
  content: {
    projects: number;
    templates: number;
    skills: number;
  };
  whatsNew: {
    version: string;
    title: string;
    highlights: string[];
  } | null;
  recentProjects: RecentProject[];
}

/** Merge the org-scoped cloud projects (source of truth) over the local VFS
 *  drafts, deduped by id/slug — a cloud record always wins, so its status and
 *  liveUrl stay authoritative. Returns the full list, newest first. */
function mergeProjects(
  cloud: CloudProject[],
  local: Awaited<ReturnType<typeof vfs.listProjects>>,
): RecentProject[] {
  const seen = new Set<string>();
  const merged: RecentProject[] = [];

  for (const p of cloud) {
    seen.add(p.id);
    seen.add(p.slug);
    merged.push({
      id: p.id,
      name: p.name,
      description: p.description || null,
      updatedAt: new Date(p.updatedAt * 1000).toISOString(), // cloud: unix seconds
    });
  }

  for (const p of local) {
    if (seen.has(p.id)) continue; // already represented by a cloud record
    merged.push({
      id: p.id,
      name: p.name,
      description: p.description || null,
      updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
    });
  }

  return merged.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

// Fetch dashboard data for browser mode (IndexedDB + org-scoped cloud store)
async function fetchBrowserModeData(): Promise<BrowserDashboardData> {
  await vfs.init();

  const localProjects = await vfs.listProjects();
  const templates = await templateService.listCustomTemplates();
  const skills = await skillsService.getAllSkills();

  // The org's real projects live in the cloud org store (same-origin
  // /v1/projects, scoped to the signed-in owner). Merge them over any local VFS
  // drafts. Fail soft: if the call fails (offline / signed out / self-hosted),
  // the local list stands alone so the dashboard never crashes.
  let cloudProjects: CloudProject[] = [];
  try {
    cloudProjects = await fetchProjects();
  } catch {
    // Cloud unavailable — fall back to local VFS projects only.
  }
  const projects = mergeProjects(cloudProjects, localProjects);

  // Fetch What's New - version, title, and highlights (matching server mode)
  let whatsNew: BrowserDashboardData['whatsNew'] = null;

  try {
    const response = await fetch('/v1/docs/WHATS_NEW.md');
    if (response.ok) {
      const content = await response.text();
      // Find first version heading: ## v{version} - {title}
      const versionMatch = content.match(/^## v(\d+\.\d+\.\d+)\s*-\s*(.+)$/m);
      if (versionMatch) {
        const version = versionMatch[1];
        const title = versionMatch[2].trim();

        // Get content after the version heading until the next ## or ---
        const versionIndex = content.indexOf(versionMatch[0]);
        const afterVersion = content.substring(versionIndex + versionMatch[0].length);
        const nextSectionMatch = afterVersion.match(/^(?:## |---)/m);
        const sectionContent = nextSectionMatch
          ? afterVersion.substring(0, nextSectionMatch.index)
          : afterVersion;

        // Extract bullet points (lines starting with - or *)
        const bulletRegex = /^[-*]\s+\*\*(.+?)\*\*\s*[-–]?\s*(.*)$/gm;
        const highlights: string[] = [];
        let match;

        while ((match = bulletRegex.exec(sectionContent)) !== null && highlights.length < 4) {
          const boldTitle = match[1].trim();
          const description = match[2]?.trim();
          highlights.push(description ? `${boldTitle} - ${description}` : boldTitle);
        }

        // If no bold bullet points found, try regular bullets
        if (highlights.length === 0) {
          const simpleBulletRegex = /^[-*]\s+(.+)$/gm;
          while ((match = simpleBulletRegex.exec(sectionContent)) !== null && highlights.length < 4) {
            const text = match[1].trim();
            if (!text.match(/^\[.*\]\(.*\)$/)) {
              highlights.push(text.replace(/\*\*/g, ''));
            }
          }
        }

        whatsNew = { version, title, highlights };
      }
    }
  } catch {
    // Use null if fetch fails
  }

  return {
    content: {
      projects: projects.length,
      templates: templates.length,
      skills: skills.length,
    },
    whatsNew,
    recentProjects: projects.slice(0, 3),
  };
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Quick Actions Bar
function QuickActionsBar({
  onStartTour,
  onNavigate,
}: {
  onStartTour: () => void;
  onNavigate?: (view: string) => void;
}) {
  // In browser mode, use onNavigate callback; in server mode, use Link
  const projectsHref = isServerMode ? '/admin/projects?action=create' : '#';
  const projectsListHref = isServerMode ? '/admin/projects' : '#';
  const docsHref = isServerMode ? '/admin/docs' : '#';

  const handleProjectsClick = (e: React.MouseEvent) => {
    if (!isServerMode && onNavigate) {
      e.preventDefault();
      onNavigate('projects');
    }
  };

  const handleDocsClick = (e: React.MouseEvent) => {
    if (!isServerMode && onNavigate) {
      e.preventDefault();
      onNavigate('docs');
    }
  };

  return (
    <YStack {...panel} padding="$4" marginBottom="$5">
      <XStack flexWrap="wrap" gap="$2">
        <Button variant="default" size="sm" asChild gap="$1.5">
          <Link href={projectsHref} onClick={handleProjectsClick}>
            <Plus size={16} />
            New Project
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild gap="$1.5">
          <Link href={projectsListHref} onClick={handleProjectsClick}>
            <FolderOpen size={16} />
            Projects
          </Link>
        </Button>
        {isServerMode && (
          <Button variant="outline" size="sm" asChild gap="$1.5">
            <Link href="/admin/deployments">
              <Globe size={16} />
              Deployments
            </Link>
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onStartTour} gap="$1.5">
          <Sparkles size={16} />
          Guided Tour
        </Button>
        <Button variant="outline" size="sm" asChild gap="$1.5">
          <a href="https://discord.gg/mAJ8Ss4u" target="_blank" rel="noopener noreferrer">
            <DiscordIcon size={16} />
            Discord
          </a>
        </Button>
        <Button variant="outline" size="sm" asChild gap="$1.5">
          <Link href={docsHref} onClick={handleDocsClick}>
            <BookOpen size={16} />
            Docs
          </Link>
        </Button>
      </XStack>
    </YStack>
  );
}

// What's New Card - always visible, links to full changelog
type WhatsNewProps = {
  version: string;
  title: string;
  highlights?: string[];
};

function WhatsNewCard({
  whatsNew,
  onNavigate,
}: {
  whatsNew: WhatsNewProps;
  onNavigate?: (view: string) => void;
}) {
  if (!whatsNew) return null;

  const handleReadAll = (e: React.MouseEvent) => {
    if (!isServerMode && onNavigate) {
      e.preventDefault();
      window.history.pushState({}, '', '/?doc=whats-new');
      onNavigate('docs');
    }
  };

  const docsHref = isServerMode ? '/admin/docs?doc=whats-new' : '#';

  return (
    <YStack {...panel} padding="$4">
      <XStack alignItems="flex-start" justifyContent="space-between" gap="$4" marginBottom="$3">
        <XStack alignItems="center" gap="$2">
          <Newspaper size={16} />
          <H3 fontSize="$3" fontWeight="500" color="$color">
            What&apos;s New in v{whatsNew.version}
          </H3>
        </XStack>
        <Link
          href={docsHref}
          onClick={handleReadAll}
        ><XStack alignItems="center" gap="$1">
          <SizableText fontSize="$1" color="$orange9" hoverStyle={{ color: "$orange8" }}>Read all</SizableText>
          <ExternalLink size={12} />
        </XStack></Link>
      </XStack>
      <Paragraph fontSize="$3" fontWeight="500" color="$color" marginBottom="$2">{whatsNew.title}</Paragraph>
      {whatsNew.highlights && whatsNew.highlights.length > 0 && (
        <YStack rowGap="$1" flex={1}>
          {whatsNew.highlights.map((highlight, i) => (
            <XStack key={i} alignItems="flex-start" gap="$2">
              <SizableText color="$orange9" marginTop="$0.5" fontSize="$1">•</SizableText>
              <SizableText fontSize="$1" color="$color11">{highlight}</SizableText>
            </XStack>
          ))}
        </YStack>
      )}
    </YStack>
  );
}

// Compact System Overview (server mode - full stats)
function CompactOverview({
  data,
  loading,
  onRefresh,
}: {
  data: DashboardData;
  loading: boolean;
  onRefresh: () => void;
}) {
  const stats = [
    { label: 'Version', value: `v${data.system.version}` },
    { label: 'Projects', value: formatNumber(data.content.projects) },
    { label: 'Deployments', value: formatNumber(data.hosting.publishedDeployments) },
    { label: 'Traffic/h', value: formatNumber(data.traffic.requestsLastHour) },
    { label: 'Traffic/d', value: formatNumber(data.traffic.requestsLastDay) },
    { label: 'Errors', value: formatNumber(data.traffic.errorCount), highlight: data.traffic.errorCount > 0 },
    { label: 'Memory', value: formatBytes(data.system.memoryUsed) },
    { label: 'Uptime', value: formatUptime(data.system.uptime) },
  ];

  const half = Math.ceil(stats.length / 2);
  const leftColumn = stats.slice(0, half);
  const rightColumn = stats.slice(half);

  return (
    <YStack {...panel} padding="$4">
      <XStack alignItems="center" justifyContent="space-between" marginBottom="$3">
        <H3 fontSize="$3" fontWeight="500" color="$color11">System Overview</H3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          height={28} paddingHorizontal="$2"
        >
          <RefreshCw size={14} />
        </Button>
      </XStack>
      <YStack columnGap="$5" rowGap="$1.5" flex={1} alignContent="flex-start">
        <YStack rowGap="$1.5">
          {leftColumn.map((stat) => (
            <XStack key={stat.label} alignItems="center" justifyContent="space-between">
              <SizableText fontSize="$1" color="$color11">{stat.label}</SizableText>
              <SizableText fontSize="$3" fontWeight="500" {...{ color: stat.highlight ? "$yellow9" : "$color" }}>
                {stat.value}
              </SizableText>
            </XStack>
          ))}
        </YStack>
        <YStack rowGap="$1.5">
          {rightColumn.map((stat) => (
            <XStack key={stat.label} alignItems="center" justifyContent="space-between">
              <SizableText fontSize="$1" color="$color11">{stat.label}</SizableText>
              <SizableText fontSize="$3" fontWeight="500" {...{ color: stat.highlight ? "$yellow9" : "$color" }}>
                {stat.value}
              </SizableText>
            </XStack>
          ))}
        </YStack>
      </YStack>
    </YStack>
  );
}

// Browser mode Overview (subset of stats)
function BrowserOverview({
  data,
  loading,
  onRefresh,
}: {
  data: BrowserDashboardData;
  loading: boolean;
  onRefresh: () => void;
}) {
  const stats = [
    { label: 'Version', value: `v${VERSION}` },
    { label: 'Projects', value: formatNumber(data.content.projects) },
    { label: 'Templates', value: formatNumber(data.content.templates) },
    { label: 'Skills', value: formatNumber(data.content.skills) },
  ];

  const half = Math.ceil(stats.length / 2);
  const leftColumn = stats.slice(0, half);
  const rightColumn = stats.slice(half);

  return (
    <YStack {...panel} padding="$4">
      <XStack alignItems="center" justifyContent="space-between" marginBottom="$3">
        <H3 fontSize="$3" fontWeight="500" color="$color11">Content Overview</H3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          height={28} paddingHorizontal="$2"
        >
          <RefreshCw size={14} />
        </Button>
      </XStack>
      <YStack columnGap="$5" rowGap="$1.5" flex={1} alignContent="flex-start">
        <YStack rowGap="$1.5">
          {leftColumn.map((stat) => (
            <XStack key={stat.label} alignItems="center" justifyContent="space-between">
              <SizableText fontSize="$1" color="$color11">{stat.label}</SizableText>
              <SizableText fontSize="$3" fontWeight="500" color="$color">{stat.value}</SizableText>
            </XStack>
          ))}
        </YStack>
        <YStack rowGap="$1.5">
          {rightColumn.map((stat) => (
            <XStack key={stat.label} alignItems="center" justifyContent="space-between">
              <SizableText fontSize="$1" color="$color11">{stat.label}</SizableText>
              <SizableText fontSize="$3" fontWeight="500" color="$color">{stat.value}</SizableText>
            </XStack>
          ))}
        </YStack>
      </YStack>
    </YStack>
  );
}

// Recent Projects Card
function RecentProjectsCard({
  projects,
  onNavigate,
  onProjectSelect,
}: {
  projects: RecentProject[];
  onNavigate?: (view: string) => void;
  onProjectSelect?: (projectId: string) => void;
}) {
  const handleViewAll = (e: React.MouseEvent) => {
    if (!isServerMode && onNavigate) {
      e.preventDefault();
      onNavigate('projects');
    }
  };

  const handleProjectClick = (e: React.MouseEvent, projectId: string) => {
    if (!isServerMode && onProjectSelect) {
      e.preventDefault();
      onProjectSelect(projectId);
    }
  };

  const viewAllHref = isServerMode ? '/admin/projects' : '#';

  return (
    <YStack {...panel} padding="$4">
      <XStack alignItems="center" justifyContent="space-between" marginBottom="$3">
        <XStack alignItems="center" gap="$2">
          <FolderOpen size={16} />
          <H3 fontSize="$3" fontWeight="500" color="$color11">Recent Projects</H3>
        </XStack>
        <Link
          href={viewAllHref}
          onClick={handleViewAll}
        ><XStack alignItems="center" gap="$0.5">
          <SizableText fontSize="$1" color="$color11" hoverStyle={{ color: "$color11" }}>View all</SizableText>
          <ChevronRight size={12} />
        </XStack></Link>
      </XStack>
      {projects.length === 0 ? (
        <Paragraph fontSize="$1" color="$color11" textAlign="center" paddingVertical="$2" flex={1} display="flex" alignItems="center" justifyContent="center">
          No projects yet
        </Paragraph>
      ) : (
        <YStack rowGap="$1.5" flex={1}>
          {projects.slice(0, 3).map((project) => (
            <Link
              key={project.id}
              href={isServerMode ? `/admin/projects?open=${project.id}` : '#'}
              onClick={(e) => handleProjectClick(e, project.id)}
            ><XStack alignItems="center" justifyContent="space-between" paddingVertical="$1.5" paddingHorizontal="$2" backgroundColor="$background" borderRadius="$2" hoverStyle={{ backgroundColor: "$color3" }}>
              <SizableText color="$color11" numberOfLines={1} flex={1} marginRight="$2" fontSize="$1">{project.name}</SizableText>
              <XStack flexShrink={0} alignItems="center" gap="$1">
                <Clock size={12} />
                <SizableText color="$color11" fontSize="$1">{formatRelativeTime(project.updatedAt)}</SizableText>
              </XStack>
            </XStack></Link>
          ))}
        </YStack>
      )}
    </YStack>
  );
}

// Recent Deployments Card
function RecentDeploymentsCard({ deployments }: { deployments: DashboardData['recentDeployments'] }) {
  return (
    <YStack {...panel} padding="$4">
      <XStack alignItems="center" justifyContent="space-between" marginBottom="$3">
        <XStack alignItems="center" gap="$2">
          <Globe size={16} />
          <H3 fontSize="$3" fontWeight="500" color="$color11">Recent Deployments</H3>
        </XStack>
        <Link
          href="/admin/deployments"
        ><XStack alignItems="center" gap="$0.5">
          <SizableText fontSize="$1" color="$color11" hoverStyle={{ color: "$color11" }}>View all</SizableText>
          <ChevronRight size={12} />
        </XStack></Link>
      </XStack>
      {deployments.length === 0 ? (
        <Paragraph fontSize="$1" color="$color11" textAlign="center" paddingVertical="$2" flex={1} display="flex" alignItems="center" justifyContent="center">
          No deployments yet
        </Paragraph>
      ) : (
        <YStack rowGap="$1.5" flex={1}>
          {deployments.slice(0, 3).map((deployment) => (
            <Link
              key={deployment.id}
              href={`/admin/deployments?open=${deployment.id}`}
            ><XStack alignItems="center" justifyContent="space-between" paddingVertical="$1.5" paddingHorizontal="$2" backgroundColor="$background" borderRadius="$2" hoverStyle={{ backgroundColor: "$color3" }}>
              <XStack alignItems="center" gap="$2" minWidth={0} flex={1}>
                <SizableText
                  width="$1.5" height="$1.5" borderRadius="$10" flexShrink={0} {...{ backgroundColor: deployment.enabled ? "$green9" : "$color11" }}
  />
                <SizableText color="$color11" numberOfLines={1} fontSize="$1">{deployment.name}</SizableText>
              </XStack>
              <XStack flexShrink={0} alignItems="center" gap="$1">
                <Clock size={12} />
                <SizableText color="$color11" fontSize="$1">{formatRelativeTime(deployment.updatedAt)}</SizableText>
              </XStack>
            </XStack></Link>
          ))}
        </YStack>
      )}
    </YStack>
  );
}

// Compact Top Deployments & Errors
function TrafficLists({ data }: { data: DashboardData }) {
  return (
    <YStack gap="$4">
      {/* Top Deployments */}
      <YStack {...panel} padding="$4">
        <XStack alignItems="center" gap="$2" marginBottom="$3">
          <Globe size={16} />
          <H3 fontSize="$3" fontWeight="500" color="$color11">Top Deployments (24h)</H3>
        </XStack>
        {data.traffic.topDeployments.length === 0 ? (
          <Paragraph fontSize="$1" color="$color11" textAlign="center" paddingVertical="$2" flex={1} display="flex" alignItems="center" justifyContent="center">
            No traffic recorded yet
          </Paragraph>
        ) : (
          <YStack rowGap="$1.5" flex={1}>
            {data.traffic.topDeployments.slice(0, 5).map((deployment, i) => (
              <XStack
                key={deployment.deploymentId}
                alignItems="center" justifyContent="space-between" paddingVertical="$1" paddingHorizontal="$2" backgroundColor="$background" borderRadius="$2"
              >
                <XStack alignItems="center" gap="$2" minWidth={0}>
                  <SizableText color="$color11" width="$4" fontSize="$1">{i + 1}.</SizableText>
                  <SizableText color="$color11" numberOfLines={1} fontSize="$1">{deployment.deploymentName}</SizableText>
                </XStack>
                <SizableText color="$color11" flexShrink={0} fontSize="$1">{formatNumber(deployment.count)}</SizableText>
              </XStack>
            ))}
          </YStack>
        )}
      </YStack>

      {/* Recent Errors */}
      <YStack {...panel} padding="$4">
        <XStack alignItems="center" gap="$2" marginBottom="$3">
          <AlertTriangle size={16} />
          <H3 fontSize="$3" fontWeight="500" color="$color11">Recent Errors</H3>
        </XStack>
        {data.traffic.recentErrors.length === 0 ? (
          <Paragraph fontSize="$1" color="$color11" textAlign="center" paddingVertical="$2" flex={1} display="flex" alignItems="center" justifyContent="center">
            No errors recorded
          </Paragraph>
        ) : (
          <YStack rowGap="$1.5" flex={1}>
            {data.traffic.recentErrors.slice(0, 5).map((error, i) => (
              <XStack
                key={`${error.deploymentId}-${error.path}-${i}`}
                alignItems="center" justifyContent="space-between" paddingVertical="$1" paddingHorizontal="$2" backgroundColor="$background" borderRadius="$2"
              >
                <XStack alignItems="center" gap="$2" minWidth={0}>
                  <SizableText
                    fontFamily="$mono" paddingHorizontal="$1" paddingVertical="$0.5" borderRadius="$2" fontSize={10} {...{ backgroundColor: error.statusCode >= 500 ? "$red9" : "$yellow9", color: error.statusCode >= 500 ? "$red8" : "$yellow8" }}
                  >
                    {error.statusCode}
                  </SizableText>
                  <SizableText color="$color11" numberOfLines={1} maxWidth={140} fontSize="$1">{error.path}</SizableText>
                </XStack>
                <SizableText color="$color11" flexShrink={0} fontSize={10}>
                  {new Date(error.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </SizableText>
              </XStack>
            ))}
          </YStack>
        )}
      </YStack>
    </YStack>
  );
}

interface DashboardViewProps {
  onNavigate?: (view: string) => void;
  onProjectSelect?: (projectId: string) => void;
  onStartTour?: () => void;
}

export function DashboardView({ onNavigate, onProjectSelect, onStartTour }: DashboardViewProps) {
  const router = useRouter();
  // Server mode data
  const [serverData, setServerData] = useState<DashboardData | null>(null);
  // Browser mode data
  const [browserData, setBrowserData] = useState<BrowserDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (isServerMode) {
        // Server mode: fetch from API
        const response = await fetch('/v1/admin/dashboard');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const result = await response.json();
        setServerData(result);
      } else {
        // Browser mode: fetch from IndexedDB
        const result = await fetchBrowserModeData();
        setBrowserData(result);
      }
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStartTour = useCallback(() => {
    if (onStartTour) {
      // Browser mode: use callback
      onStartTour();
    } else {
      // Server mode: use router
      router.push('/admin/projects?tour=start');
    }
  }, [router, onStartTour]);

  const handleProjectSelect = useCallback((projectId: string) => {
    if (!isServerMode && onProjectSelect) {
      onProjectSelect(projectId);
    }
  }, [onProjectSelect]);

  // Loading state
  const hasData = isServerMode ? !!serverData : !!browserData;
  if (loading && !hasData) {
    return (
      <XStack height="100%" alignItems="center" justifyContent="center">
        <YStack>
          <YStack borderRadius="$10" height="$6" width="$6" borderBottomWidth={2} borderColor="$orange9" alignSelf="center"></YStack>
          <Paragraph marginTop="$3" fontSize="$3" color="$color11" textAlign="center">Loading dashboard...</Paragraph>
        </YStack>
      </XStack>
    );
  }

  // Error state
  if (error && !hasData) {
    return (
      <XStack height="100%" alignItems="center" justifyContent="center">
        <YStack alignItems="center">
          <AlertTriangle size={32} />
          <Paragraph color="$color11" fontSize="$3" textAlign="center">{error}</Paragraph>
          <Button variant="outline" size="sm" onClick={fetchData} marginTop="$4">
            Retry
          </Button>
        </YStack>
      </XStack>
    );
  }

  if (!hasData) return null;

  // Server mode render
  if (isServerMode && serverData) {
    const hasWhatsNew = serverData.whatsNew?.highlights?.length > 0;

    return (
      <YStack height="100%" padding="$5" overflow="scroll">
        {/* Header */}
        <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
          <div>
            <H1 fontSize="$7" fontWeight="500" color="$color">Dashboard</H1>
            {lastUpdated && (
              <Paragraph fontSize="$1" color="$color11" marginTop="$0.5">
                Updated {lastUpdated.toLocaleTimeString()}
              </Paragraph>
            )}
          </div>
        </XStack>

        {/* Quick Actions */}
        <QuickActionsBar onStartTour={handleStartTour} />

        {/* Row 1: System Overview + What's New */}
        <YStack gap="$4" marginBottom="$4" className="tile-row">
          <CompactOverview data={serverData} loading={loading} onRefresh={fetchData} />
          {hasWhatsNew && <WhatsNewCard whatsNew={serverData.whatsNew} />}
        </YStack>

        {/* Row 2: Recent Projects + Recent Deployments */}
        <YStack gap="$4" marginBottom="$4" className="tile-row">
          <RecentProjectsCard projects={serverData.recentProjects} />
          <RecentDeploymentsCard deployments={serverData.recentDeployments} />
        </YStack>

        {/* Row 3: Top Deployments + Recent Errors */}
        <YStack className="tile-row-nested">
          <TrafficLists data={serverData} />
        </YStack>
      </YStack>
    );
  }

  // Browser mode render
  if (!isServerMode && browserData) {
    const hasWhatsNew = browserData.whatsNew !== null;

    return (
      <YStack height="100%" padding="$5" overflow="scroll">
        {/* Header */}
        <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
          <div>
            <H1 fontSize="$7" fontWeight="500" color="$color">Dashboard</H1>
            {lastUpdated && (
              <Paragraph fontSize="$1" color="$color11" marginTop="$0.5">
                Updated {lastUpdated.toLocaleTimeString()}
              </Paragraph>
            )}
          </div>
        </XStack>

        {/* Quick Actions */}
        <QuickActionsBar onStartTour={handleStartTour} onNavigate={onNavigate} />

        {/* Row 1: Content Overview + What's New */}
        <YStack gap="$4" marginBottom="$4" className="tile-row">
          <BrowserOverview data={browserData} loading={loading} onRefresh={fetchData} />
          {hasWhatsNew && (
            <WhatsNewCard
              whatsNew={browserData.whatsNew!}
              onNavigate={onNavigate}
  />
          )}
        </YStack>

        {/* Row 2: Recent Projects (no Deployments in browser mode) */}
        <YStack marginBottom="$4">
          <RecentProjectsCard
            projects={browserData.recentProjects}
            onNavigate={onNavigate}
            onProjectSelect={handleProjectSelect}
  />
        </YStack>
      </YStack>
    );
  }

  return null;
}
