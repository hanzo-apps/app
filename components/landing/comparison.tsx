// Why Hanzo — the competitive-advantage matrix.
//
// A single conversion centerpiece: ten buyer criteria across Hanzo and the
// alternatives (site builders + AI coding tools). Hanzo is row one, elevated,
// with a clean sweep of green — the rest speckle amber/red. The visual pattern
// IS the argument.
//
// One data source (`ROWS`), two layouts so it reads well on every screen:
//   • lg+  → a scannable table (traffic-light dots carry tone; full phrasing
//            rides in a title tooltip to keep columns tight).
//   • <lg  → stacked cards. Hanzo is fully expanded (its ten advantages are the
//            pitch); each competitor is a collapsed <details> you can open.
//
// Tone → color follows the site's semantic rule (green = advantage, amber =
// caveat, red = weakness); "—" = not applicable to that tool.

import Reveal from "./reveal";

type Tone = "good" | "mid" | "bad" | "na";
interface Cell {
  t: Tone;
  v: string; // short verdict, shown everywhere
  d?: string; // detail, shown in the tooltip + mobile cards
}
interface Row {
  name: string;
  note?: string; // sub-label under the name (e.g. category)
  hanzo?: boolean;
  cells: Cell[];
}

// Column criteria — concise header, full phrasing in `full` (tooltip + a11y).
const COLS: { short: string; full: string }[] = [
  { short: "Hidden costs", full: "Hidden costs" },
  { short: "Lock-in", full: "Vendor lock-in" },
  { short: "Performance", full: "Performance — bloated / slow?" },
  { short: "Customization", full: "Customization limits" },
  { short: "AI accuracy", full: "AI accuracy / reliability" },
  { short: "Scales up", full: "Scales to complex projects" },
  { short: "Security", full: "Security risk" },
  { short: "Maintenance", full: "Maintenance burden" },
  { short: "AI context", full: "Context limits — AI / large projects" },
  { short: "Design", full: "Design quality / output" },
];

// Cell constructors keep the data table below readable.
const g = (v: string, d?: string): Cell => ({ t: "good", v, d });
const m = (v: string, d?: string): Cell => ({ t: "mid", v, d });
const b = (v: string, d?: string): Cell => ({ t: "bad", v, d });
const n = (d?: string): Cell => ({ t: "na", v: "—", d });

const ROWS: Row[] = [
  {
    name: "Hanzo",
    hanzo: true,
    cells: [
      g("None", "No hidden fees"),
      g("Open source", "You own your code"),
      g("Fast", "Optimized output"),
      g("Unlimited", "Full-code, no ceilings"),
      g("Best", "Highest accuracy"),
      g("Built to scale", "Complex projects welcome"),
      g("Secure", "Privacy-first, self-hosted option"),
      g("Low", "Minimal upkeep"),
      g("1M+ tokens", "1M+ token context window"),
      g("Production-ready", "Slick, modern output"),
    ],
  },
  {
    name: "Wix",
    note: "Site builder",
    cells: [
      b("Yes", "Limited features require upgrades"),
      b("Yes", "Cannot export the site"),
      b("Slow", "Bloated code"),
      b("Limited", "Drag-and-drop constraints"),
      n(),
      b("Slow", "Restrictive for large stores/sites"),
      m("Low–moderate", "Platform managed but a black box"),
      m("Medium", "Platform updates + manual mobile fixes"),
      n(),
      m("Basic", "Templates look similar"),
    ],
  },
  {
    name: "Shopify",
    note: "Site builder",
    cells: [
      b("High", "Apps + transaction fees"),
      b("Yes", "Locked into the ecosystem"),
      m("Medium", "Can be slow with apps"),
      b("Limited", "Checkout + design restrictions"),
      n(),
      b("Medium–slow", "Expensive to scale"),
      m("Low–moderate", "SaaS security but app risks"),
      m("Medium", "App updates + app management"),
      n(),
      m("Basic", "Themes feel similar"),
    ],
  },
  {
    name: "Squarespace",
    note: "Site builder",
    cells: [
      b("Medium–high", "Upgrades for advanced features"),
      b("Yes", "Locked into the platform"),
      m("Medium", "Block-based overhead"),
      b("Limited", "Block editor + 1-level nav"),
      n(),
      b("Medium–slow", "Not ideal for large inventories/sites"),
      m("Low–moderate", "Platform managed"),
      m("Medium", "Platform updates + manual fixes"),
      n(),
      m("Basic", "Block templates feel similar"),
    ],
  },
  {
    name: "WordPress",
    note: "Site builder",
    cells: [
      b("High", "Plugins, themes, hosting, dev time"),
      g("No", "Fully exportable"),
      b("Slow", "Plugin bloat, security scans"),
      g("Unlimited", "Open source"),
      n(),
      b("Medium–slow", "Becomes complex at scale"),
      b("High", "Plugin vulnerabilities common"),
      b("High", "Plugins, updates, backups, fixes"),
      n(),
      m("Varies", "Depends on theme / dev skill"),
    ],
  },
  {
    name: "Supabase",
    note: "Backend",
    cells: [
      b("Medium–high", "Pay-as-you-grow"),
      g("No", "Data exportable"),
      m("Medium", "Depends on architecture"),
      g("High", "Flexible backend"),
      n(),
      m("Medium", "SQL + infra complexity"),
      b("High", "Misconfigurable permissions"),
      b("Medium–high", "RLS rules, schema changes, scaling"),
      n(),
      n("Backend only"),
    ],
  },
  {
    name: "Cursor",
    note: "AI coding tool",
    cells: [
      b("High", "Usage-based compute costs"),
      g("No", "Can use other editors"),
      b("Slow", "Heavy CPU, RAM, background indexing"),
      m("Medium", "Not a design tool"),
      m("Medium", "Hallucinates, creates bugs"),
      b("Medium–slow", "Needs heavy review at scale"),
      b("Medium–high", "Can generate vulnerable code"),
      b("High", "Debugging + cleanup time"),
      b("Low–medium", "Less context on big codebases"),
      b("Low", "UI code lacks polish"),
    ],
  },
  {
    name: "Codeium",
    note: "AI coding tool",
    cells: [
      m("Medium", "Limited free tier, paid for scale"),
      g("No", "Works in many editors"),
      b("Slow", "Suggestions + background tasks"),
      m("Medium", "Not a design tool"),
      b("Low–medium", "Duplicates, broken code, overwrite risk"),
      b("Medium–slow", "Struggles with large projects"),
      b("High", "Can generate insecure code"),
      b("High", "Fix redundant code, debug issues"),
      b("Low", "Small context window"),
      b("Low", "Generic code patterns"),
    ],
  },
  {
    name: "Claude",
    note: "AI assistant",
    cells: [
      m("Medium", "Usage limits + paid plans"),
      g("No"),
      m("Medium", "Depends on output + integrations"),
      b("Low–medium", "Web design limitations"),
      m("Medium", "Can hallucinate / be generic"),
      b("Medium–slow", "Web dev tools are basic"),
      m("Low–moderate", "Secure, but integrations add risk"),
      m("Medium", "Iterations + manual fixes"),
      m("Medium", "Loses detail in long projects"),
      b("Low–medium", "Cookie-cutter designs"),
    ],
  },
  {
    name: "ChatGPT",
    note: "AI assistant",
    cells: [
      g("Low", "Free tier available"),
      g("No"),
      m("Medium", "Not real-time, can be slow"),
      b("Low", "Not built for web design"),
      b("Low–medium", "Hallucinates, generic answers"),
      b("Slow", "Not built for large project execution"),
      m("Medium", "Privacy concerns with data input"),
      m("Low–medium", "Occasional verifications"),
      b("Low–medium", "Context degrades in long chats"),
      b("Low–medium", "Generic text responses"),
    ],
  },
  {
    name: "Antigravity",
    note: "AI coding tool",
    cells: [
      b("High", "Usage lockouts, paid tiers"),
      b("Yes", "Agents + IDE split + vendor lock-in"),
      b("Slow", "High memory usage, background tasks"),
      m("Medium", "Limited marketplace compatibility"),
      m("Medium", "Hallucinates, needs review"),
      b("Medium–slow", "Complicated workflow"),
      m("Medium", "Cloud-based agent risks"),
      b("High", "Quotas, context resets, formatting changes"),
      b("Low–medium", "Less context on big projects"),
      n("Developer tool, not a design tool"),
    ],
  },
  {
    name: "Tab Editor",
    note: "Visual editor",
    cells: [
      m("Medium", "Upgrades for features"),
      b("Yes", "Cannot export clean code"),
      b("Slow", "Bloated generated code"),
      b("Low–medium", "Grid constraints, not fully flexible"),
      n(),
      b("Medium–slow", "Mobile + complex layouts are hard"),
      m("Low–moderate", "Platform managed"),
      m("Medium", "Manual mobile fixes, tweaks"),
      n(),
      b("Low–medium", "Grid limits creativity"),
    ],
  },
];

const DOT: Record<Tone, string> = {
  good: "bg-emerald-400",
  mid: "bg-amber-400",
  bad: "bg-red-500/70",
  na: "bg-transparent ring-1 ring-inset ring-white/20",
};
const TEXT: Record<Tone, string> = {
  good: "text-white",
  mid: "text-white/75",
  bad: "text-white/55",
  na: "text-white/30",
};

function Dot({ tone }: { tone: Tone }) {
  return (
    <span
      aria-hidden
      className={`inline-block h-[7px] w-[7px] flex-none rounded-full ${DOT[tone]}`}
    />
  );
}

export default function Comparison() {
  return (
    <section className="relative border-t border-white/[0.06] px-4 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
            Why Hanzo
          </p>
          <h2 className="mt-4 text-3xl font-medium tracking-tight md:text-[2.75rem] md:leading-[1.1]">
            One platform beats the whole stack.
          </h2>
          <p className="mt-4 text-base text-white/55 md:text-lg">
            Site builders lock you in. AI coding tools hand you bugs to clean up.
            Hanzo ships production apps you own — fast, secure, and built to
            scale.
          </p>
        </Reveal>

        {/* Legend */}
        <Reveal
          delay={60}
          className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-[11px] text-white/45"
        >
          <span className="inline-flex items-center gap-1.5">
            <Dot tone="good" /> Advantage
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Dot tone="mid" /> Caveat
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Dot tone="bad" /> Weakness
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Dot tone="na" /> N/A
          </span>
        </Reveal>

        {/* ── Desktop / tablet-wide: the matrix ─────────────────── */}
        <Reveal
          delay={80}
          className="mt-10 hidden lg:block"
        >
          <div className="-mx-4 overflow-x-auto px-4">
            <table className="w-full min-w-[960px] border-separate border-spacing-0 text-left">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-black pb-4 pr-4 align-bottom" />
                  {COLS.map((c) => (
                    <th
                      key={c.short}
                      title={c.full}
                      className="px-2.5 pb-4 align-bottom font-mono text-[10px] font-normal uppercase leading-tight tracking-[0.1em] text-white/40"
                    >
                      {c.short}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr
                    key={r.name}
                    className={
                      r.hanzo
                        ? "group"
                        : "group transition-colors hover:bg-white/[0.015]"
                    }
                  >
                    <th
                      scope="row"
                      className={`sticky left-0 z-10 whitespace-nowrap rounded-l-xl py-3 pl-4 pr-5 text-left align-middle font-medium ${
                        r.hanzo
                          ? "bg-white/[0.06] text-white"
                          : "bg-black text-white/80"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {r.name}
                        {r.hanzo && (
                          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-emerald-300">
                            Best
                          </span>
                        )}
                      </span>
                      {r.note && (
                        <span className="mt-0.5 block font-mono text-[10px] font-normal text-white/30">
                          {r.note}
                        </span>
                      )}
                    </th>
                    {r.cells.map((cell, ci) => (
                      <td
                        key={ci}
                        title={cell.d ? `${cell.v} — ${cell.d}` : cell.v}
                        className={`px-2.5 py-3 align-middle ${
                          r.hanzo ? "bg-white/[0.06]" : ""
                        } ${ci === r.cells.length - 1 && r.hanzo ? "rounded-r-xl" : ""}`}
                      >
                        <span className="flex items-center gap-2">
                          <Dot tone={r.hanzo ? "good" : cell.t} />
                          <span
                            className={`text-[13px] leading-tight ${
                              r.hanzo ? "text-white" : TEXT[cell.t]
                            }`}
                          >
                            {cell.v}
                          </span>
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>

        {/* ── Mobile: Hanzo card (full) + collapsible competitors ── */}
        <div className="mt-10 space-y-3 lg:hidden">
          {ROWS.map((r) => {
            const weak = r.cells.filter((c) => c.t === "bad").length;
            if (r.hanzo) {
              return (
                <Reveal
                  key={r.name}
                  className="rounded-2xl border border-emerald-400/25 bg-white/[0.04] p-5"
                >
                  <div className="mb-4 flex items-center gap-2">
                    <h3 className="text-lg font-medium text-white">{r.name}</h3>
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-emerald-300">
                      Best overall
                    </span>
                  </div>
                  <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                    {r.cells.map((cell, ci) => (
                      <div key={ci} className="flex items-start gap-2.5">
                        <span className="mt-1.5">
                          <Dot tone="good" />
                        </span>
                        <div className="min-w-0">
                          <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/40">
                            {COLS[ci].short}
                          </dt>
                          <dd className="text-sm text-white">
                            {cell.v}
                            {cell.d && (
                              <span className="text-white/50"> · {cell.d}</span>
                            )}
                          </dd>
                        </div>
                      </div>
                    ))}
                  </dl>
                </Reveal>
              );
            }
            return (
              <details
                key={r.name}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4">
                  <span className="min-w-0">
                    <span className="text-base font-medium text-white/85">
                      {r.name}
                    </span>
                    {r.note && (
                      <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.1em] text-white/30">
                        {r.note}
                      </span>
                    )}
                  </span>
                  <span className="flex flex-none items-center gap-3">
                    {weak > 0 && (
                      <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-white/40">
                        <Dot tone="bad" />
                        {weak} weak {weak === 1 ? "area" : "areas"}
                      </span>
                    )}
                    <svg
                      className="h-4 w-4 flex-none text-white/40 transition-transform duration-200 group-open:rotate-180"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M4 6l4 4 4-4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </summary>
                <dl className="grid grid-cols-1 gap-x-6 gap-y-3 border-t border-white/[0.06] px-5 py-4 sm:grid-cols-2">
                  {r.cells.map((cell, ci) => (
                    <div key={ci} className="flex items-start gap-2.5">
                      <span className="mt-1.5">
                        <Dot tone={cell.t} />
                      </span>
                      <div className="min-w-0">
                        <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/40">
                          {COLS[ci].short}
                        </dt>
                        <dd className={`text-sm ${TEXT[cell.t]}`}>
                          {cell.v}
                          {cell.d && (
                            <span className="text-white/40"> · {cell.d}</span>
                          )}
                        </dd>
                      </div>
                    </div>
                  ))}
                </dl>
              </details>
            );
          })}
        </div>

        <Reveal
          as="p"
          delay={120}
          className="mt-10 text-center font-mono text-xs text-white/35"
        >
          Every app ships on Hanzo Cloud — database, auth, AI, and storage wired
          in. No lock-in, ever.
        </Reveal>
      </div>
    </section>
  );
}
