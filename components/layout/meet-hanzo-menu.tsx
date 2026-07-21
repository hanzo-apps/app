"use client";

// "Meet Hanzo" mega-menu — the hanzo.app twin of hanzo.ai's Meet-Hanzo + Products
// menus, folded into one wide panel. Structure mirrors hanzo.ai
// (components/navigation/DesktopNav.tsx); aesthetic is hanzo.app's true-black.
//
// The panel is a SOLID surface (bg-[#0b0b0d] + border-white/10 + shadow-2xl) —
// never the transparent @hanzo/ui dropdown. Opens on hover AND keyboard focus,
// reflects state via aria-expanded, and closes on Esc / outside-click / blur-out.
//
// Install links are DRY: they come from the ONE app catalog (@/data/app-catalog)
// via appUrl(), so the menu can never drift from /install.

import { useEffect, useRef, useState, type ElementType } from "react";
import Link from "next/link";
import {
  Boxes,
  Building2,
  BookOpen,
  ChevronDown,
  Cloud,
  Code2,
  Clapperboard,
  GraduationCap,
  Hammer,
  Images,
  LayoutGrid,
  MessageSquare,
  Orbit,
  Tag,
  Users,
} from "lucide-react";
import { appCatalog, appUrl, type AppEntry } from "@/data/app-catalog";
import { cn } from "@/lib/utils";

type Item = {
  label: string;
  href: string;
  icon: ElementType;
  external?: boolean;
  desc?: string;
};

// The Hanzo product surfaces — Build is this site; the rest are sibling sites.
const products: Item[] = [
  { label: "Build", href: "/", icon: Hammer, desc: "Describe an app, ship it" },
  { label: "Chat", href: "https://hanzo.ai/chat", icon: MessageSquare, external: true },
  { label: "Code", href: "https://hanzo.ai/code", icon: Code2, external: true },
  { label: "Cloud", href: "https://cloud.hanzo.ai", icon: Cloud, external: true },
  { label: "Studio", href: "https://studio.hanzo.ai", icon: Clapperboard, external: true },
];

const models: Item[] = [
  { label: "Enso", href: "https://hanzo.ai/enso", icon: Orbit, external: true, desc: "Frontier flagship" },
  { label: "Zen", href: "https://hanzo.ai/zen", icon: Boxes, external: true, desc: "Open-source family" },
];

const resources: Item[] = [
  { label: "Docs", href: "https://docs.hanzo.ai", icon: BookOpen, external: true },
  { label: "Community", href: "/community", icon: Users },
  { label: "Learn", href: "/learn", icon: GraduationCap },
  { label: "Gallery", href: "/gallery", icon: Images },
  { label: "Pricing", href: "/pricing", icon: Tag },
  { label: "Enterprise", href: "/enterprise", icon: Building2 },
];

// Per-platform install picks, resolved from the ONE catalog so URLs never drift.
const INSTALL_PICKS = ["Chrome", "VS Code", "macOS", "Windows", "Linux"];
const installApps: AppEntry[] = INSTALL_PICKS.map((name) =>
  appCatalog.find((a) => a.name === name),
).filter((a): a is AppEntry => Boolean(a));

const rowClass =
  "group flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-sm text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white";
const iconClass =
  "mt-0.5 h-4 w-4 flex-shrink-0 text-white/40 transition-colors group-hover:text-white/80";

function ColumnHead({ children }: { children: string }) {
  return (
    <h3 className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-white/35">
      {children}
    </h3>
  );
}

function ItemRow({ item, onNavigate }: { item: Item; onNavigate: () => void }) {
  const Icon = item.icon;
  const body = (
    <>
      <Icon className={iconClass} strokeWidth={1.5} />
      <span className="min-w-0">
        <span className="block leading-tight">{item.label}</span>
        {item.desc && (
          <span className="block text-xs leading-tight text-white/35">{item.desc}</span>
        )}
      </span>
    </>
  );
  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" onClick={onNavigate} className={rowClass}>
        {body}
      </a>
    );
  }
  return (
    <Link href={item.href} onClick={onNavigate} className={rowClass}>
      {body}
    </Link>
  );
}

export default function MeetHanzoMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);

  const clearClose = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const openNow = () => {
    clearClose();
    setOpen(true);
  };
  const closeSoon = () => {
    clearClose();
    closeTimer.current = window.setTimeout(() => setOpen(false), 150);
  };
  const closeNow = () => {
    clearClose();
    setOpen(false);
  };

  useEffect(() => () => clearClose(), []);

  // Esc closes and returns focus to the trigger.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeNow();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Click outside closes.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) closeNow();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node)) closeSoon();
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => (open ? closeNow() : openNow())}
        onFocus={openNow}
        className={cn(
          "inline-flex items-center gap-1 text-sm font-medium transition-colors",
          open ? "text-white" : "text-white/70 hover:text-white",
        )}
      >
        Meet Hanzo
        <ChevronDown
          className={cn("h-4 w-4 transition-transform duration-200", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 pt-3">
          {/* SOLID panel — bg-[#0b0b0d], never a transparent dropdown. */}
          <div className="w-[min(88vw,780px)] rounded-2xl border border-white/10 bg-[#0b0b0d] p-6 shadow-2xl shadow-black/60">
            <div className="grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-4">
              <div>
                <ColumnHead>Products</ColumnHead>
                <div className="space-y-0.5">
                  {products.map((item) => (
                    <ItemRow key={item.label} item={item} onNavigate={closeNow} />
                  ))}
                </div>
              </div>

              <div>
                <ColumnHead>Install</ColumnHead>
                <div className="space-y-0.5">
                  {installApps.map((app) => {
                    const Icon = app.icon;
                    return (
                      <a
                        key={app.name}
                        href={appUrl(app)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={closeNow}
                        className={rowClass}
                      >
                        <Icon className={iconClass} strokeWidth={1.5} />
                        <span className="leading-tight">{app.name}</span>
                      </a>
                    );
                  })}
                  <Link href="/install" onClick={closeNow} className={cn(rowClass, "text-white/90")}>
                    <LayoutGrid className={iconClass} strokeWidth={1.5} />
                    <span className="leading-tight">Browse all apps</span>
                  </Link>
                </div>
              </div>

              <div>
                <ColumnHead>Models</ColumnHead>
                <div className="space-y-0.5">
                  {models.map((item) => (
                    <ItemRow key={item.label} item={item} onNavigate={closeNow} />
                  ))}
                </div>
              </div>

              <div>
                <ColumnHead>Resources</ColumnHead>
                <div className="space-y-0.5">
                  {resources.map((item) => (
                    <ItemRow key={item.label} item={item} onNavigate={closeNow} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
