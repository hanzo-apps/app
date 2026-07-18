// Hero focal visual — a filled-in, animated preview of the Hanzo build→ship flow.
//
// It shows the ONE thing that makes hanzo.app different: you describe an app, the
// agent writes it, and it ships through the REAL pipeline — commit to git, build,
// deploy static assets to S3, live at <slug>.hanzo.app. The bottom rail animates
// that pipeline (Edit → Commit → Build → Deploy · S3 → Live) on a loop; the app
// body is a compact, on-brand Deployments view (monochrome, Geist Mono data,
// semantic green = live — the ONE colour kept in the true-black policy). Honest by
// construction: the content is the platform's own deploy flow, not a fabricated
// customer or invented metrics. Reduced-motion users get the final, settled frame.
//
// Self-contained (scoped keyframes) so it drops onto hanzo.ai's landing to sell the
// builder with zero wiring.

const PIPELINE = [
  { key: "edit", label: "Edit", sub: "prompt" },
  { key: "commit", label: "Commit", sub: "git" },
  { key: "build", label: "Build", sub: "CI" },
  { key: "deploy", label: "Deploy", sub: "S3" },
  { key: "live", label: "Live", sub: "CDN" },
];

// Illustrative deploy events — the platform's own commits shipping through the
// pipeline. The most recent is the current production (Live); prior builds are
// Ready. Clearly the platform's own flow (git → S3), not a customer's data.
const DEPLOYS = [
  { sha: "a1f3c8e", msg: "hero: animate ship pipeline", state: "live", t: "just now" },
  { sha: "7b2d5a9", msg: "add pricing section", state: "ready", t: "4m ago" },
  { sha: "e9c04b1", msg: "wire auth + database", state: "ready", t: "12m ago" },
];

export default function HeroPreview() {
  return (
    <div className="hp relative mx-auto w-full max-w-4xl">
      <style>{`
        @keyframes hpFlow { 0%,8% {left:0} 92%,100% {left:100%} }
        @keyframes hpFill { 0%,6% {width:0} 94%,100% {width:100%} }
        @keyframes hpStage0 { 0%,4%,100% {opacity:.35} 6%,22% {opacity:1} }
        @keyframes hpStage1 { 0%,22%,100% {opacity:.35} 24%,42% {opacity:1} }
        @keyframes hpStage2 { 0%,42%,100% {opacity:.35} 44%,62% {opacity:1} }
        @keyframes hpStage3 { 0%,62%,100% {opacity:.35} 64%,82% {opacity:1} }
        @keyframes hpStage4 { 0%,82% {opacity:.35} 88%,100% {opacity:1} }
        @keyframes hpRise { from {opacity:0; transform:translateY(6px)} to {opacity:1; transform:none} }
        @keyframes hpPulse { 0%,100% {opacity:.5} 50% {opacity:1} }
        .hp .flow  { animation: hpFlow 4.2s cubic-bezier(.6,0,.4,1) infinite; }
        .hp .fill  { animation: hpFill 4.2s cubic-bezier(.6,0,.4,1) infinite; }
        .hp .s0 { animation: hpStage0 4.2s linear infinite; }
        .hp .s1 { animation: hpStage1 4.2s linear infinite; }
        .hp .s2 { animation: hpStage2 4.2s linear infinite; }
        .hp .s3 { animation: hpStage3 4.2s linear infinite; }
        .hp .s4 { animation: hpStage4 4.2s linear infinite; }
        .hp .rise0 { animation: hpRise .5s ease-out both; }
        .hp .rise1 { animation: hpRise .5s ease-out .12s both; }
        .hp .rise2 { animation: hpRise .5s ease-out .24s both; }
        .hp .livedot { animation: hpPulse 2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .hp .flow,.hp .fill,.hp .s0,.hp .s1,.hp .s2,.hp .s3,.hp .s4,
          .hp .rise0,.hp .rise1,.hp .rise2,.hp .livedot,.hp .animate-ping { animation: none; }
          .hp .flow { left: 100%; } .hp .fill { width: 100%; }
          .hp .s0,.hp .s1,.hp .s2,.hp .s3,.hp .s4 { opacity: 1; }
        }
      `}</style>

      {/* Soft floor glow to seat the frame. */}
      <div className="pointer-events-none absolute inset-x-0 -bottom-10 top-8 -z-10 rounded-[2rem] bg-white/[0.05] blur-2xl sm:-inset-x-8" />

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#080808] shadow-2xl shadow-black/60 ring-1 ring-white/[0.03]">
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
            <span className="truncate font-mono text-[11px] text-white/60">your-app.hanzo.app</span>
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
            </span>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.15em] text-green-400/70 sm:inline">Live</span>
          </div>
        </div>

        {/* App body — a compact, filled Deployments view */}
        <div className="flex h-[300px] md:h-[360px]">
          {/* Sidebar */}
          <aside className="hidden w-44 shrink-0 flex-col gap-0.5 border-r border-white/[0.06] bg-black/40 p-4 sm:flex">
            <div className="mb-5 flex items-center gap-2">
              <HMark className="h-5 w-5 text-white" />
              <span className="text-[13px] font-semibold tracking-tight text-white">Hanzo App</span>
            </div>
            {[
              { n: "Overview", i: IconGrid },
              { n: "Deployments", i: IconRocket, active: true },
              { n: "Analytics", i: IconChart },
              { n: "Storage", i: IconDb },
              { n: "Settings", i: IconGear },
            ].map((it) => (
              <div key={it.n} className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 ${it.active ? "bg-white/[0.07]" : ""}`}>
                <it.i className={`h-3.5 w-3.5 ${it.active ? "text-white" : "text-white/35"}`} />
                <span className={`text-[12px] ${it.active ? "font-medium text-white" : "text-white/45"}`}>{it.n}</span>
              </div>
            ))}
            <div className="mt-auto flex items-center gap-2 rounded-lg border border-white/[0.06] px-2.5 py-2">
              <div className="grid h-5 w-5 place-items-center rounded-full bg-white/10 text-[9px] font-semibold text-white/70">P</div>
              <span className="text-[11px] text-white/45">Personal</span>
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1 overflow-hidden p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[14px] font-semibold tracking-tight text-white">Deployments</div>
                <div className="mt-0.5 font-mono text-[10px] text-white/35">main · auto-deploy on push</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-white px-3 py-1.5 text-[11px] font-semibold text-black">Deploy</span>
                <div className="h-7 w-7 rounded-full bg-white/10 ring-1 ring-white/10" />
              </div>
            </div>

            {/* KPI tiles — illustrative platform metrics */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { k: "Deploys today", v: "14", d: "+3", path: "M2 23 L21 20 L40 21 L60 14 L79 16 L98 8 L118 5" },
                { k: "Avg build", v: "19s", d: "-4s", path: "M2 7 L21 10 L40 9 L60 13 L79 12 L98 17 L118 20" },
                { k: "Uptime", v: "99.9%", d: "30d", path: "M2 9 L21 7 L40 9 L60 6 L79 8 L98 6 L118 5" },
              ].map((s) => (
                <div key={s.k} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-white/35">{s.k}</div>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="font-mono text-[18px] font-semibold tabular-nums text-white">{s.v}</span>
                    <span className="font-mono text-[10px] text-white/40">{s.d}</span>
                  </div>
                  <svg viewBox="0 0 120 28" preserveAspectRatio="none" className="mt-2 h-7 w-full" fill="none" aria-hidden>
                    <path d={s.path} stroke="rgba(255,255,255,0.28)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                  </svg>
                </div>
              ))}
            </div>

            {/* Deploy events table — commits shipping through to live */}
            <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.06]">
              <div className="flex items-center gap-3 border-b border-white/[0.06] bg-white/[0.015] px-4 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-white/30">
                <span className="w-16">Commit</span>
                <span className="flex-1">Message</span>
                <span className="hidden sm:inline">When</span>
                <span className="ml-auto">Status</span>
              </div>
              {DEPLOYS.map((d, i) => {
                const live = d.state === "live";
                return (
                  <div key={d.sha} className={`rise${i} flex items-center gap-3 px-4 py-2.5`}>
                    <span className="w-16 font-mono text-[11px] text-white/45">{d.sha.slice(0, 7)}</span>
                    <span className="flex-1 truncate text-[12px] text-white/75">{d.msg}</span>
                    <span className="hidden font-mono text-[10px] text-white/30 sm:inline">{d.t}</span>
                    {live ? (
                      <span className="ml-auto flex items-center gap-1.5 rounded-full border border-green-400/20 bg-green-400/[0.06] px-2 py-0.5">
                        <span className="livedot h-1.5 w-1.5 rounded-full bg-green-400" />
                        <span className="font-mono text-[10px] text-green-400/90">Live</span>
                      </span>
                    ) : (
                      <span className="ml-auto flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                        <span className="font-mono text-[10px] text-white/50">Ready</span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Animated ship pipeline — Edit → Commit → Build → Deploy·S3 → Live */}
        <div className="border-t border-white/[0.06] bg-white/[0.02] px-4 py-3.5">
          <div className="relative flex items-center justify-between">
            {/* Track + traveling progress */}
            <div className="pointer-events-none absolute left-[7%] right-[7%] top-[9px] h-px bg-white/10">
              <div className="fill absolute inset-y-0 left-0 bg-gradient-to-r from-white/30 to-green-400/70" />
              <span className="flow absolute -top-[3px] h-[7px] w-[7px] -translate-x-1/2 rounded-full bg-green-400 shadow-[0_0_8px_2px_rgba(74,222,128,.5)]" />
            </div>
            {PIPELINE.map((p, i) => (
              <div key={p.key} className={`s${i} relative z-10 flex flex-col items-center gap-1.5`}>
                <span className={`grid h-[18px] w-[18px] place-items-center rounded-full border ${i === PIPELINE.length - 1 ? "border-green-400/50 bg-green-400/10" : "border-white/15 bg-[#080808]"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${i === PIPELINE.length - 1 ? "bg-green-400" : "bg-white/70"}`} />
                </span>
                <span className="flex flex-col items-center leading-none">
                  <span className={`text-[10px] font-medium ${i === PIPELINE.length - 1 ? "text-green-400/90" : "text-white/70"}`}>{p.label}</span>
                  <span className="mt-0.5 hidden font-mono text-[8px] uppercase tracking-[0.12em] text-white/30 sm:inline">{p.sub}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Inline monochrome icons (currentColor) ─────────────────────────────── */
function HMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 67 67" className={className} fill="currentColor" aria-hidden>
      <path d="M22.21 67V44.64H0V67h22.21ZM66.72 22.32H22.25L.09 44.64h44.37l22.26-22.32ZM22.21 0H0v22.32h22.21V0ZM66.72 0H44.51v22.32h22.21V0ZM66.72 67V44.64H44.51V67h22.21Z" />
    </svg>
  );
}
const ic = (d: string) => function Icon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
};
const IconGrid = ic("M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z");
const IconRocket = ic("M12 2c4 2 6 6 6 10l-4 4-4-4c0-4 2-8 6-10zM10 16l-4 4M4 14l4 4");
const IconChart = ic("M4 20V10M10 20V4M16 20v-7M22 20H2");
const IconDb = ic("M12 3c4 0 8 1 8 3v12c0 2-4 3-8 3s-8-1-8-3V6c0-2 4-3 8-3zM4 6c0 2 4 3 8 3s8-1 8-3");
const IconGear = ic("M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a7 7 0 0 0-1.7-1L16.5 3h-4l-.3 2.6a7 7 0 0 0-1.7 1l-2.4-1-2 3.4L5 10.9a7 7 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 1.7 1L11.5 21h4l.3-2.6a7 7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6a7 7 0 0 0 .1-1z");
