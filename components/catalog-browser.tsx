"use client";

// The cross-org catalog browser — everything the fleet has built, in one place:
// hanzo, lux and zoo repos plus every site this platform is serving. ONE component
// over ONE surface (/v1/catalog); search and browse are the same request, so the
// rail below is not a second code path, it is the facet counts the API already
// returned.
//
// Filtering is SERVER-side, not client-side like the templates gallery: that
// gallery browses a curated catalog of a few dozen embedded entries, this one
// browses hundreds of live rows across orgs, and the counts have to come from the
// corpus rather than from the page. Same true-black monochrome as the landing.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, GitFork, Search, Star } from "lucide-react";
import {
  buckets,
  ORIGIN_LABELS,
  searchCatalog,
  type CatalogEntry,
  type CatalogFacets,
  type CatalogOrigin,
} from "@/lib/catalog";
import { OFFICIAL_LABEL } from "@/lib/template-authors";

const ALL = "";

/** The brand rail is ordered, not count-sorted: these are our orgs, in our order. */
const ORG_ORDER = ["hanzo", "lux", "zoo", "zen"];

/** Same rule for the lane rail — our four nouns, in the order a person meets them. */
const ORIGIN_ORDER: CatalogOrigin[] = ["template", "community", "third-party", "product"];

function Pill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "border border-border bg-muted text-muted-foreground hover:border-foreground/30 hover:text-foreground"
      }`}
    >
      {label}
      {count !== undefined && (
        <span className="ml-1.5 font-mono text-[10px] opacity-60">{count}</span>
      )}
    </button>
  );
}

// Card has TWO destinations, which is why the whole thing is not one <a>: the
// title takes you to the thing (the demo if it is live, else the repo) and the
// footer takes you to its SOURCE. A live demo you cannot get from to the code is
// a screenshot. The title link stretches over the card so the card still reads as
// one target; the source link sits above it so it wins its own clicks.
function Card({
  e,
  showOrigin,
  onParent,
}: {
  e: CatalogEntry;
  /** Off inside a pinned lane: repeating the lane on every card says nothing. */
  showOrigin: boolean;
  /** Narrow the lane to one lineage. Absent ⇒ the parent is text, not a filter. */
  onParent?: (parent: string) => void;
}) {
  const href = e.url || e.repo;
  return (
    <div className="group relative flex flex-col gap-2 rounded-2xl border border-border bg-muted p-4 transition-all duration-200 hover:-translate-y-1 hover:border-foreground/30 sm:p-5">
      <div className="flex items-center gap-2">
        <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          {e.org}
        </span>
        {/* The lane, on the card, because "what IS this" is the question the flat
            list could not answer: a curated starter, a stranger's remix and a
            bought UI kit all rendered identically here. */}
        {showOrigin && e.origin && (
          <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            {ORIGIN_LABELS[e.origin] ?? e.origin}
          </span>
        )}
        {e.archetype && (
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
            {e.archetype}
          </span>
        )}
        {/* Provenance, never decoration: a row only this org can see says so. */}
        {e.scope === "org" && (
          <span className="rounded-full border border-foreground/20 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground/70">
            private
          </span>
        )}
        {/* Authorship, and it only ever appears when it was EARNED: the API sets
            official from a marker no tenant can raise. The same label the
            template gallery uses, so a reader meets one word, not two. */}
        {e.official && (
          <span className="rounded-full border border-foreground/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground">
            {OFFICIAL_LABEL}
          </span>
        )}
      </div>

      <h3 className="flex items-start gap-1.5 text-[15px] font-medium leading-snug tracking-tight text-foreground">
        <a href={href} target="_blank" rel="noreferrer" className="after:absolute after:inset-0">
          <span className="line-clamp-1">{e.title || e.name}</span>
        </a>
        <ArrowUpRight
          className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
          strokeWidth={1.6}
        />
      </h3>

      <p className="line-clamp-2 min-h-[2.5rem] text-[13px] leading-relaxed text-muted-foreground">
        {e.description || (e.url ? e.url.replace(/^https?:\/\//, "") : "")}
      </p>

      {/* Lineage, and it is the whole reason a community lane is browsable rather
          than a pile: what this was forked FROM, and who built it. The parent is
          a filter, so "everything built from folio" is one click, not a search. */}
      {e.template && (
        <p className="text-[11px] leading-relaxed text-muted-foreground/80">
          Forked from{" "}
          {onParent ? (
            <button
              onClick={() => onParent(e.template!)}
              className="relative z-10 underline underline-offset-4 hover:text-foreground"
            >
              {e.template}
            </button>
          ) : (
            <span className="text-foreground/80">{e.template}</span>
          )}{" "}
          · by {e.org}
        </p>
      )}

      {/* The credit line. It sits ABOVE the fold of the footer rather than in it,
          because "this is somebody else's work" is not a stat next to the star
          count — it is the first thing a reader needs in order to read the rest
          of the card correctly. */}
      {e.upstream && (
        <p className="text-[11px] leading-relaxed text-muted-foreground/80">
          Third-party work, shown with credit: {e.upstream}
          {e.license ? ` · ${e.license}` : ""}
        </p>
      )}

      <div className="mt-auto flex items-center gap-3 pt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
        {e.language && <span>{e.language}</span>}
        {!!e.stars && (
          <span className="inline-flex items-center gap-1">
            <Star className="h-3 w-3" strokeWidth={1.6} />
            {e.stars}
          </span>
        )}
        {e.forkable && (
          <span className="inline-flex items-center gap-1">
            <GitFork className="h-3 w-3" strokeWidth={1.6} />
            forkable
          </span>
        )}
        {e.url && e.kind === "site" && <span>live</span>}
        {/* The trace out of a demo. z-10 puts it above the title's stretched
            hit area, so clicking "source" goes to the source. */}
        {e.repo && e.repo !== href && (
          <a
            href={e.repo}
            target="_blank"
            rel="noreferrer"
            className="relative z-10 underline-offset-4 hover:text-foreground hover:underline"
          >
            source
          </a>
        )}
      </div>
    </div>
  );
}

/**
 * One browser, three mounts. `origin` PINS a lane, which is what makes
 * /templates and /community two views of the one corpus instead of two catalogs
 * that drift apart: same component, same request, same rows — only the lane and
 * the words around it differ. Unpinned (/catalog) it browses everything and the
 * lane becomes a rail.
 */
export function CatalogBrowser({
  origin = ALL,
  title = "Catalog",
  blurb,
}: {
  origin?: string;
  title?: string;
  blurb?: React.ReactNode;
} = {}) {
  const [q, setQ] = useState("");
  const [org, setOrg] = useState(ALL);
  const [kind, setKind] = useState(ALL);
  const [archetype, setArchetype] = useState(ALL);
  const [language, setLanguage] = useState(ALL);
  const [lane, setLane] = useState(ALL);
  const [parent, setParent] = useState(ALL);
  const [forkable, setForkable] = useState(ALL);
  const [official, setOfficial] = useState(ALL);
  // A pinned lane is not a filter the visitor chose, so it is not one they can
  // clear: /community browses community, full stop.
  const pinned = origin !== ALL;

  const [rows, setRows] = useState<CatalogEntry[]>([]);
  const [facets, setFacets] = useState<CatalogFacets>({});
  const [total, setTotal] = useState(0);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  // One in-flight request: a keystroke aborts the previous one rather than racing
  // it, so the rendered page is always the answer to the CURRENT query.
  const inflight = useRef<AbortController | null>(null);
  const load = useCallback(async () => {
    inflight.current?.abort();
    const ac = new AbortController();
    inflight.current = ac;
    setLoading(true);
    try {
      const r = await searchCatalog(
        { q, org, kind, archetype, language, template: parent, forkable, official,
          origin: pinned ? origin : lane },
        ac.signal,
      );
      setRows(r.data ?? []);
      setFacets(r.facets ?? {});
      setTotal(r.total ?? 0);
      setErr("");
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setErr((e as Error).message);
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, [q, org, kind, archetype, language, parent, forkable, official, lane, origin, pinned]);

  useEffect(() => {
    const t = setTimeout(load, q ? 200 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  const orgs = useMemo(() => {
    const counts = facets.org ?? {};
    const known = ORG_ORDER.filter((o) => counts[o]);
    const rest = Object.keys(counts).filter((o) => !ORG_ORDER.includes(o)).sort();
    return [...known, ...rest].map((o) => [o, counts[o]] as [string, number]);
  }, [facets]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
        {title}
      </h1>
      <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
        {blurb ?? (
          <>
            Every project, app and site across Hanzo, Lux and Zoo — searchable in
            one place, and filed by what each one IS: our starters, what people
            built on them, somebody else&rsquo;s work shown with credit, and our
            own software. Entries we built ourselves carry a {OFFICIAL_LABEL}{" "}
            badge. Sign in to see your own projects here too.
          </>
        )}
      </p>

      <div className="relative mt-6">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          strokeWidth={1.6}
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search across every org…"
          className="w-full rounded-full border border-border bg-muted py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/30"
        />
      </div>

      {/* The lane rail comes FIRST, because it is the question that has to be
          answered before any of the others mean anything. It is absent inside a
          pinned lane, where it could only ever say "yes, still here". */}
      {!pinned && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Pill label="Everything" active={lane === ALL} onClick={() => setLane(ALL)} />
          {ORIGIN_ORDER.filter((o) => facets.origin?.[o]).map((o) => (
            <Pill
              key={o}
              label={ORIGIN_LABELS[o]}
              count={facets.origin?.[o]}
              active={lane === o}
              onClick={() => setLane(lane === o ? ALL : o)}
            />
          ))}
        </div>
      )}

      {/* Lineage as a rail: the parents this lane's apps were built from, biggest
          family first. This is what turns "a pile of forks" into something a
          person can read. */}
      {buckets(facets, "template").length > 1 && (
        <div className="mt-2 flex flex-wrap gap-2">
          <Pill label="Any parent" active={parent === ALL} onClick={() => setParent(ALL)} />
          {buckets(facets, "template")
            .slice(0, 10)
            .map(([tmpl, n]) => (
              <Pill
                key={tmpl}
                label={`from ${tmpl}`}
                count={n}
                active={parent === tmpl}
                onClick={() => setParent(parent === tmpl ? ALL : tmpl)}
              />
            ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Pill label="All orgs" active={org === ALL} onClick={() => setOrg(ALL)} />
        {orgs.map(([o, n]) => (
          <Pill key={o} label={o} count={n} active={org === o} onClick={() => setOrg(o)} />
        ))}
        <span className="mx-1 self-center text-border">|</span>
        {buckets(facets, "kind").map(([k, n]) => (
          <Pill
            key={k}
            label={k}
            count={n}
            active={kind === k}
            onClick={() => setKind(kind === k ? ALL : k)}
          />
        ))}
        {/* forkable is a rail, not a toggle: the server counts both sides, so
            "what can I NOT fork" is as clickable as "what can I". */}
        {buckets(facets, "forkable").map(([f, n]) => (
          <Pill
            key={f}
            label={f === "true" ? "forkable" : "not forkable"}
            count={n}
            active={forkable === f}
            onClick={() => setForkable(forkable === f ? ALL : f)}
          />
        ))}
        {/* Authorship is a rail for the same reason: once a reader knows the
            catalog carries other people's work, "show me what is NOT ours" is
            the next question, and it has to be as clickable as the first. */}
        {buckets(facets, "official").map(([f, n]) => (
          <Pill
            key={f}
            label={f === "true" ? OFFICIAL_LABEL : "third-party"}
            count={n}
            active={official === f}
            onClick={() => setOfficial(official === f ? ALL : f)}
          />
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <Pill label="Any kind" active={archetype === ALL} onClick={() => setArchetype(ALL)} />
        {buckets(facets, "archetype").map(([a, n]) => (
          <Pill
            key={a}
            label={a}
            count={n}
            active={archetype === a}
            onClick={() => setArchetype(a)}
          />
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <Pill label="Any language" active={language === ALL} onClick={() => setLanguage(ALL)} />
        {buckets(facets, "language")
          .slice(0, 12)
          .map(([l, n]) => (
            <Pill
              key={l}
              label={l}
              count={n}
              active={language === l}
              onClick={() => setLanguage(l)}
            />
          ))}
      </div>

      <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
        {err ? `error: ${err}` : loading ? "searching…" : `${total} results`}
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((e) => (
          <Card key={`${e.scope}:${e.id}`} e={e} showOrigin={!pinned} onParent={setParent} />
        ))}
      </div>

      {!loading && !err && rows.length === 0 && (
        <p className="mt-10 text-sm text-muted-foreground">
          Nothing matches that yet.
        </p>
      )}
    </div>
  );
}
