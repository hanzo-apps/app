'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Badge, Button } from '@hanzo/ui';
import {
  Gamepad2,
  Play,
  Sparkles,
  ArrowUpRight,
  ArrowLeft,
  Wand2,
  Github,
  Monitor,
  Smartphone,
  Globe,
  Check,
} from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import {
  getGame,
  studioHref,
  builderHref,
  isPlayable,
  type BuildTarget,
} from '@/data/games-catalog';

const TARGET_ICON: Record<BuildTarget, typeof Globe> = {
  webgl: Globe,
  windows: Monitor,
  mac: Monitor,
  linux: Monitor,
  android: Smartphone,
  ios: Smartphone,
};

function upstreamUrl(upstream: string): string {
  return /^https?:\/\//.test(upstream) ? upstream : `https://github.com/${upstream}`;
}

export default function GameDetail() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const game = getGame(params.id);
  const [ask, setAsk] = useState('');

  if (!game) {
    return (
      <AppShell currentView="games">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-black text-white">
          <p className="text-lg text-neutral-400">Game not found.</p>
          <Link href="/games" className="text-white underline">
            Back to games
          </Link>
        </div>
      </AppShell>
    );
  }

  const playable = isPlayable(game);
  const webglCapable = game.targets.includes('webgl');
  const submitAsk = () => {
    if (!ask.trim()) return;
    router.push(builderHref(game, ask.trim()));
  };

  return (
    <AppShell currentView="games">
      <div className="flex-1 overflow-y-auto bg-black text-white">
        <div className="container mx-auto max-w-5xl px-6 py-8">
          <Link
            href="/games"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Games
          </Link>

          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Gamepad2 className="h-5 w-5 text-neutral-400" />
                <span className="text-sm font-medium">
                  {game.engine[0].toUpperCase() + game.engine.slice(1)} {game.engineVersion}
                </span>
                <Badge variant="secondary">{game.genre}</Badge>
              </div>
              <h1 className="text-3xl font-medium">{game.name}</h1>
              <p className="mt-2 max-w-2xl text-neutral-400">{game.description}</p>
            </div>
            {playable && (
              <Button
                className="gap-2 bg-white text-black hover:bg-neutral-200"
                onClick={() => router.push(`/games/${game.id}/play`)}
                data-testid="play-button"
              >
                <Play className="h-4 w-4 fill-black" />
                Play
              </Button>
            )}
          </div>

          {/* Spec grid */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Spec label="Targets">
              <div className="flex flex-wrap items-center gap-2 text-neutral-200">
                {game.targets.map((t) => {
                  const Icon = TARGET_ICON[t];
                  return (
                    <span key={t} className="inline-flex items-center gap-1 text-sm">
                      <Icon className="h-4 w-4" />
                      {t}
                    </span>
                  );
                })}
              </div>
            </Spec>
            <Spec label="License">
              <span className="text-sm text-neutral-200">{game.license}</span>
            </Spec>
            <Spec label="Build status">
              <span className="inline-flex items-center gap-1.5 text-sm text-neutral-200">
                {game.buildable && <Check className="h-4 w-4 text-white" />}
                {playable
                  ? 'WebGL build (placeholder)'
                  : webglCapable
                    ? 'WebGL-capable — build not hosted'
                    : game.buildable
                      ? 'Desktop build'
                      : 'Not buildable'}
              </span>
            </Spec>
            <Spec label="Upstream">
              <a
                href={upstreamUrl(game.upstream)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-neutral-200 hover:text-white"
              >
                <Github className="h-4 w-4" />
                {game.upstream}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </Spec>
            <Spec label="Hanzo fork">
              {game.fork ? (
                <a
                  href={`https://github.com/${game.fork}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-xs text-neutral-300 hover:text-white"
                >
                  {game.fork}
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              ) : (
                <span className="text-xs text-neutral-500">
                  Reference only — {game.forkReason ?? 'license forbids redistribution'}
                </span>
              )}
            </Spec>
            <Spec label="License terms">
              <span className="text-xs text-neutral-400">{game.licenseRestrictions}</span>
            </Spec>
          </div>

          {/* No in-browser build — honest note, no fake play / pixel-stream button */}
          {!playable && (
            <p className="mt-6 rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-400">
              {webglCapable ? (
                <>
                  {game.name} builds to WebGL, but no artifact is hosted yet. A CI job drops the
                  build under <code className="text-neutral-300">/webgl/{game.id}/</code> (see the
                  artifact contract) to enable in-browser play.
                </>
              ) : (
                <>
                  {game.name} targets {game.targets.join(', ')} — no in-browser build.
                  Pixel-streaming preview is a render-node feature and is not enabled here.
                </>
              )}
            </p>
          )}

          {/* Generative hook — studio pipeline */}
          <section className="mt-10 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-white" />
              <h2 className="text-lg font-medium">Generate assets</h2>
            </div>
            <p className="mb-4 text-sm text-neutral-400">
              Open this title in the Hanzo studio pipeline to regenerate its assets.
            </p>
            {game.assetSlots.length > 0 ? (
              <div className="mb-5 flex flex-wrap gap-2">
                {game.assetSlots.map((slot) => (
                  <span
                    key={slot}
                    className="rounded-full border border-neutral-700 bg-neutral-800/50 px-3 py-1 text-xs capitalize text-neutral-200"
                  >
                    {slot}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mb-5 text-xs text-neutral-500">
                Asset slots are defined in a later catalog pass; studio infers them for now.
              </p>
            )}
            <a href={studioHref(game)} target="_blank" rel="noopener noreferrer">
              <Button className="gap-2 bg-gradient-to-r from-neutral-700 to-neutral-900 hover:from-neutral-900 hover:to-neutral-700">
                <Wand2 className="h-4 w-4" />
                Generate assets in Studio
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </a>
          </section>

          {/* Builder hook — natural-language prompt with the game repo as context */}
          <section className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6">
            <div className="mb-4 flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-white" />
              <h2 className="text-lg font-medium">Build with AI</h2>
            </div>
            <p className="mb-4 text-sm text-neutral-400">
              Describe a change and open it in the builder with{' '}
              <code className="text-neutral-300">{game.name}</code> as repo context — the same
              gateway-wired flow the editor uses.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <textarea
                value={ask}
                onChange={(e) => setAsk(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitAsk();
                }}
                placeholder="e.g. add a second enemy type and a score multiplier…"
                rows={2}
                data-testid="builder-prompt"
                className="flex-1 resize-none rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
              />
              <Button
                className="gap-2 self-end bg-gradient-to-r from-neutral-700 to-neutral-900 hover:from-neutral-900 hover:to-neutral-700"
                onClick={submitAsk}
                disabled={!ask.trim()}
              >
                <Sparkles className="h-4 w-4" />
                Open in builder
              </Button>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function Spec({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
      <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-neutral-500">
        {label}
      </p>
      {children}
    </div>
  );
}
