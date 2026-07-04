"use client";

// ONE responsive, accessible, category-grouped grid for the /apps catalog.
// A section is fully described by the entries it renders: each card derives its
// link and verb from the entry's `action` (ACTION_URL / ACTION_LABEL), so there
// is no per-card wiring. Reused for both the Install and Connect sections.

import { ArrowUpRight, type LucideIcon } from "lucide-react";
import Reveal from "@/components/landing/reveal";
import {
  ACTION_LABEL,
  ACTION_URL,
  groupByCategory,
  type AppEntry,
} from "@/data/app-catalog";

function AppCard({ app }: { app: AppEntry }) {
  const Icon = app.icon;
  const href = ACTION_URL[app.action];
  const label = ACTION_LABEL[app.action];
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} ${app.name}`}
      className="group flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
    >
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
          <Icon className="h-5 w-5 text-white" aria-hidden />
        </span>
        <h4 className="text-base font-medium text-white">{app.name}</h4>
      </div>
      <p className="mb-5 text-sm leading-relaxed text-white/50">{app.blurb}</p>
      <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-white/70 transition-colors group-hover:text-white">
        {label}
        <ArrowUpRight className="h-4 w-4" aria-hidden />
      </span>
    </a>
  );
}

interface AppCatalogSectionProps {
  /** Anchor target so the hero can deep-link to the section. */
  id: string;
  /** Short label in the eyebrow pill (e.g. "Install"). */
  eyebrow: string;
  title: string;
  subtitle: string;
  /** Icon shown in the eyebrow pill. */
  Icon: LucideIcon;
  entries: AppEntry[];
}

export default function AppCatalogSection({
  id,
  eyebrow,
  title,
  subtitle,
  Icon,
  entries,
}: AppCatalogSectionProps) {
  const groups = groupByCategory(entries);
  return (
    <section
      id={id}
      className="scroll-mt-20 border-t border-white/[0.06] px-4 py-20 md:px-8 md:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal className="mb-12 max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
            <Icon className="h-3.5 w-3.5 text-white/70" aria-hidden />
            <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/55">
              {eyebrow}
            </span>
          </div>
          <h2 className="text-3xl font-medium tracking-tight text-white md:text-4xl">
            {title}
          </h2>
          <p className="mt-3 text-base text-white/55 md:text-lg">{subtitle}</p>
        </Reveal>

        <div className="space-y-12">
          {groups.map((group) => (
            <Reveal key={group.category}>
              <h3 className="mb-5 font-mono text-[11px] uppercase tracking-[0.15em] text-white/40">
                {group.category}
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.apps.map((app) => (
                  <AppCard key={app.name} app={app} />
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
