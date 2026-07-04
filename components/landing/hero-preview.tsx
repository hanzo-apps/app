// Hero focal visual — an honest, schematic browser frame showing the shape of a
// generated app running LIVE on Hanzo Cloud. Deliberately a wireframe (neutral
// blocks, no invented brand, no fake data or metrics): it communicates "a real
// running app with a real URL, DB, auth and AI wired in" without fabricating a
// customer. The one green dot is a semantic Live indicator (green = live/online
// is intentionally preserved in the monochrome policy).

const navItems = ["Dashboard", "Customers", "Analytics", "Settings"];
const wiredIn = ["Database", "Auth", "AI", "Storage"];

// Neutral skeleton bar.
function Bar({ w, h = "h-2.5", o = "bg-white/10" }: { w: string; h?: string; o?: string }) {
  return <div className={`${w} ${h} ${o} rounded`} />;
}

export default function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-4xl">
      {/* Soft floor glow to seat the frame. */}
      <div className="pointer-events-none absolute -inset-x-8 -bottom-10 top-8 -z-10 rounded-[2rem] bg-white/[0.04] blur-2xl" />

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl shadow-black/60 ring-1 ring-white/[0.02]">
        {/* Browser chrome */}
        <div className="flex items-center gap-3 border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-white/10" />
            <span className="h-3 w-3 rounded-full bg-white/10" />
            <span className="h-3 w-3 rounded-full bg-white/10" />
          </div>
          <div className="mx-auto flex w-full max-w-xs items-center gap-2 rounded-lg border border-white/[0.06] bg-black/40 px-3 py-1.5">
            <svg viewBox="0 0 24 24" className="h-3 w-3 text-white/30" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
              <rect x="4" y="10" width="16" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 1 1 8 0v3" />
            </svg>
            <span className="truncate font-mono text-[11px] text-white/50">your-app.hanzo.app</span>
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
            </span>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.15em] text-white/40 sm:inline">
              Live
            </span>
          </div>
        </div>

        {/* App body (schematic) */}
        <div className="flex h-[300px] md:h-[360px]">
          {/* Sidebar */}
          <aside className="hidden w-44 shrink-0 flex-col gap-1 border-r border-white/[0.06] bg-black/30 p-4 sm:flex">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-white/80" />
              <Bar w="w-16" h="h-2.5" o="bg-white/25" />
            </div>
            {navItems.map((n, i) => (
              <div
                key={n}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-2 ${i === 0 ? "bg-white/[0.06]" : ""}`}
              >
                <div className={`h-3.5 w-3.5 rounded ${i === 0 ? "bg-white/60" : "bg-white/15"}`} />
                <Bar w="w-16" o={i === 0 ? "bg-white/40" : "bg-white/12"} />
              </div>
            ))}
            <div className="mt-auto flex items-center gap-2 rounded-lg border border-white/[0.06] px-2.5 py-2">
              <div className="h-5 w-5 rounded-full bg-white/15" />
              <Bar w="w-14" o="bg-white/12" />
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1 overflow-hidden p-5 md:p-6">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <Bar w="w-32" h="h-3.5" o="bg-white/25" />
              <div className="flex items-center gap-2">
                <div className="h-7 w-20 rounded-lg bg-white/80" />
                <div className="h-7 w-7 rounded-full bg-white/12" />
              </div>
            </div>

            {/* Stat tiles */}
            <div className="mt-5 grid grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                  <Bar w="w-12" h="h-2" o="bg-white/12" />
                  <Bar w="w-16" h="h-4" o="bg-white/25" />
                  <div className="mt-2 h-8 rounded bg-gradient-to-t from-white/[0.03] to-white/[0.08]" />
                </div>
              ))}
            </div>

            {/* Table skeleton */}
            <div className="mt-4 rounded-xl border border-white/[0.06]">
              <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-2.5">
                <Bar w="w-24" h="h-2" o="bg-white/15" />
                <Bar w="w-16" h="h-2" o="bg-white/10" />
                <Bar w="w-20" h="h-2" o="bg-white/10" />
                <Bar w="w-12 ml-auto" h="h-2" o="bg-white/10" />
              </div>
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="h-5 w-5 rounded-full bg-white/10" />
                  <Bar w="w-24" o="bg-white/10" />
                  <Bar w="w-16" o="bg-white/[0.07]" />
                  <div className="ml-auto h-4 w-14 rounded-full bg-white/[0.06]" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wired-in strip */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
            Wired in
          </span>
          {wiredIn.map((w) => (
            <span key={w} className="flex items-center gap-1.5 font-mono text-[11px] text-white/50">
              <svg viewBox="0 0 24 24" className="h-3 w-3 text-white/45" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {w}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
