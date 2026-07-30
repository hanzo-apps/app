import type { ProjectRuntime } from '@/lib/vfs/types';

export interface RuntimeConfig {
  id: ProjectRuntime;
  label: string;
  description: string;
  previewMode: 'visual' | 'terminal';
  bundled: boolean;
  jsxImportSource?: string;
  sfcExtension?: string;
  compilerCdnUrl?: string;
  sourceExtensions: string[];
  badge: { label: string; color: string };
  starterTemplateId: string;
}

export const RUNTIME_CONFIGS: RuntimeConfig[] = [
  {
    id: 'static',
    label: 'Static Website',
    description: 'HTML, CSS, JavaScript with Handlebars templating',
    previewMode: 'visual',
    bundled: false,
    sourceExtensions: [],
    badge: { label: 'Static', color: 'gray' },
    starterTemplateId: 'blank',
  },
  {
    id: 'react',
    label: 'React + TypeScript',
    description: 'Component-based app with auto-bundling',
    previewMode: 'visual',
    bundled: true,
    jsxImportSource: 'react',
    sourceExtensions: ['.tsx', '.ts', '.jsx'],
    badge: { label: 'React', color: 'sky' },
    starterTemplateId: 'react-starter',
  },
  {
    id: 'preact',
    label: 'Preact + TypeScript',
    description: 'Lightweight React alternative with signals',
    previewMode: 'visual',
    bundled: true,
    jsxImportSource: 'preact',
    sourceExtensions: ['.tsx', '.ts', '.jsx'],
    badge: { label: 'Preact', color: 'purple' },
    starterTemplateId: 'preact-starter',
  },
  {
    id: 'svelte',
    label: 'Svelte',
    description: 'Compile-time reactive framework',
    previewMode: 'visual',
    bundled: true,
    sfcExtension: '.svelte',
    compilerCdnUrl: 'https://esm.sh/svelte@5/compiler',
    sourceExtensions: ['.svelte', '.ts'],
    badge: { label: 'Svelte', color: 'orange' },
    starterTemplateId: 'svelte-starter',
  },
  {
    id: 'vue',
    label: 'Vue',
    description: 'Progressive framework with SFC support',
    previewMode: 'visual',
    bundled: true,
    sfcExtension: '.vue',
    compilerCdnUrl: 'https://esm.sh/@vue/compiler-sfc@3',
    sourceExtensions: ['.vue', '.ts'],
    badge: { label: 'Vue', color: 'green' },
    starterTemplateId: 'vue-starter',
  },
];

const configMap = new Map(RUNTIME_CONFIGS.map(c => [c.id, c]));

export function getRuntimeConfig(id: ProjectRuntime): RuntimeConfig {
  return configMap.get(id) ?? configMap.get('static')!;
}

export function getProjectRuntimes(): { value: ProjectRuntime; label: string; description: string }[] {
  return RUNTIME_CONFIGS.map(c => ({ value: c.id, label: c.label, description: c.description }));
}

export function isRuntimeBundled(runtime: ProjectRuntime): boolean {
  return getRuntimeConfig(runtime).bundled;
}

/** Badge tones are gui prop bundles — translucent tone-on-surface, so ONE
 *  value set reads correctly on both themes (no dark: fork to fall out of a
 *  build). */
export type BadgeTone = { backgroundColor: string; color: string; borderColor: string };
const BADGE_TONES: Record<string, BadgeTone> = {
  gray:   { backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', borderColor: 'var(--border)' },
  sky:    { backgroundColor: 'rgba(14,165,233,0.15)', color: '#0ea5e9', borderColor: 'rgba(14,165,233,0.3)' },
  purple: { backgroundColor: 'rgba(168,85,247,0.15)', color: '#a855f7', borderColor: 'rgba(168,85,247,0.3)' },
  orange: { backgroundColor: 'rgba(249,115,22,0.15)', color: '#f97316', borderColor: 'rgba(249,115,22,0.3)' },
  green:  { backgroundColor: 'rgba(34,197,94,0.15)', color: '#22c55e', borderColor: 'rgba(34,197,94,0.3)' },
};

export function getRuntimeBadge(runtime: ProjectRuntime): { label: string; tone: BadgeTone } {
  const cfg = getRuntimeConfig(runtime);
  return {
    label: cfg.badge.label,
    tone: BADGE_TONES[cfg.badge.color] || BADGE_TONES.gray,
  };
}
