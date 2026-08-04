"use client";

import { Button, Input } from '@hanzo/ui';
import { SizableText, YStack, XStack, H3, Anchor, Paragraph, H1 } from '@hanzo/gui';
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
import { repoImportLink } from "@/lib/api/git";

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
    <Button
      onClick={onClick}
      group
      flexShrink={0} borderRadius="$10" paddingHorizontal="$3.5" paddingVertical="$1.5" {...{ backgroundColor: active ? "$color12" : "$color3", borderWidth: active ? undefined : 1, borderColor: active ? undefined : "$borderColor", hoverStyle: active ? undefined : { borderColor: "$color" } }}
    >
      <SizableText whiteSpace="nowrap" fontSize="$1" fontWeight="500" color={active ? "$background" : "$color11"} $group-hover={active ? undefined : { color: "$color" }}>
        {label}
      </SizableText>
      {count !== undefined && (
        <SizableText marginLeft="$1.5" fontFamily="$mono" fontSize={10} opacity={0.6}>{count}</SizableText>
      )}
    </Button>
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
    <YStack group position="relative" gap="$2" borderRadius="$8" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" padding="$4" hoverStyle={{ y: "-1", borderColor: "$color" }} $sm={{ padding: "$4.5" }}>
      <XStack alignItems="center" gap="$2">
        <SizableText borderRadius="$10" borderWidth={1} borderColor="$borderColor" paddingHorizontal="$2" paddingVertical="$0.5" fontFamily="$mono" fontSize={10} color="$color11">
          {e.org}
        </SizableText>
        {/* The lane, on the card, because "what IS this" is the question the flat
            list could not answer: a curated starter, a stranger's remix and a
            bought UI kit all rendered identically here. */}
        {showOrigin && e.origin && (
          <SizableText borderRadius="$10" borderWidth={1} borderColor="$borderColor" paddingHorizontal="$2" paddingVertical="$0.5" fontFamily="$mono" fontSize={10} color="$color11">
            {ORIGIN_LABELS[e.origin] ?? e.origin}
          </SizableText>
        )}
        {e.archetype && (
          <SizableText fontFamily="$mono" fontSize={10} color="$color11">
            {e.archetype}
          </SizableText>
        )}
        {/* Provenance, never decoration: a row only this org can see says so. */}
        {e.scope === "org" && (
          <SizableText borderRadius="$10" borderWidth={1} borderColor="$color02" paddingHorizontal="$2" paddingVertical="$0.5" fontFamily="$mono" fontSize={10} color="$color">
            private
          </SizableText>
        )}
        {/* Authorship, and it only ever appears when it was EARNED: the API sets
            official from a marker no tenant can raise. The same label the
            template gallery uses, so a reader meets one word, not two. */}
        {e.official && (
          <SizableText borderRadius="$10" borderWidth={1} borderColor="$color02" paddingHorizontal="$2" paddingVertical="$0.5" fontFamily="$mono" fontSize={10} color="$color">
            {OFFICIAL_LABEL}
          </SizableText>
        )}
      </XStack>

      <H3 display="flex" alignItems="flex-start" gap="$1.5" fontSize={15} fontWeight="500" lineHeight="1.375" letterSpacing={-0.4} color="$color">
        <Anchor href={href} target="_blank" rel="noreferrer" className="stretch-link">
          <SizableText numberOfLines={1}>{e.title || e.name}</SizableText>
        </Anchor>
        <ArrowUpRight
          size={16}
          strokeWidth={1.6}
  />
      </H3>

      <Paragraph numberOfLines={2} minHeight="2.5rem" fontSize={13} lineHeight="1.625" color="$color11">
        {e.description || (e.url ? e.url.replace(/^https?:\/\//, "") : "")}
      </Paragraph>

      {/* Lineage, and it is the whole reason a community lane is browsable rather
          than a pile: what this was forked FROM, and who built it. The parent is
          a filter, so "everything built from folio" is one click, not a search. */}
      {e.template && (
        <Paragraph fontSize={11} lineHeight="1.625" color="$color11">
          Forked from{" "}
          {onParent ? (
            <Button
              onClick={() => onParent(e.template!)}
              position="relative" zIndex={10}
            >
              <SizableText textDecorationLine="underline" hoverStyle={{ color: "$color" }}>{e.template}</SizableText>
            </Button>
          ) : (
            <SizableText color="$color">{e.template}</SizableText>
          )}{" "}
          · by {e.org}
        </Paragraph>
      )}

      {/* The credit line. It sits ABOVE the fold of the footer rather than in it,
          because "this is somebody else's work" is not a stat next to the star
          count — it is the first thing a reader needs in order to read the rest
          of the card correctly. */}
      {e.upstream && (
        <Paragraph fontSize={11} lineHeight="1.625" color="$color11">
          Third-party work, shown with credit: {e.upstream}
          {e.license ? ` · ${e.license}` : ""}
        </Paragraph>
      )}

      <XStack marginTop="auto" alignItems="center" gap="$3" paddingTop="$1">
        {e.language && <SizableText fontFamily="$mono" fontSize={10} color="$color11">{e.language}</SizableText>}
        {!!e.stars && (
          <XStack alignItems="center" gap="$1">
            <Star size={12} strokeWidth={1.6} />
            <SizableText fontFamily="$mono" fontSize={10} color="$color11">{e.stars}</SizableText>
          </XStack>
        )}
        {/* Forkable is a DOOR, not an adjective. The card used to print the word
            next to a fork icon and then offer no way to fork anything — 143 of the
            162 community entries advertised a capability the page did not carry.
            It is the same `/dev?repo=` route the templates gallery opens, so this
            is one more entrance to one builder, not a second path. No repo means
            nothing to clone, and a claim with no door behind it is worse than
            silence — so the marker only appears when it is real. */}
        {e.forkable && e.repo && (
          <Anchor
            href={repoImportLink(e.repo)}
            position="relative" zIndex={10} display="inline-flex" alignItems="center" gap="$1" fontFamily="$mono" fontSize={10} color="$color11" hoverStyle={{ color: "$color" }}
          >
            <GitFork size={12} strokeWidth={1.6} />
            fork
          </Anchor>
        )}
        {e.url && e.kind === "site" && <SizableText fontFamily="$mono" fontSize={10} color="$color11">live</SizableText>}
        {/* The trace out of a demo. z-10 puts it above the title's stretched
            hit area, so clicking "source" goes to the source. */}
        {e.repo && e.repo !== href && (
          <Anchor
            href={e.repo}
            target="_blank"
            rel="noreferrer"
            position="relative" zIndex={10} fontFamily="$mono" fontSize={10} color="$color11" hoverStyle={{ color: "$color", textDecorationLine: "underline" }}
          >
            source
          </Anchor>
        )}
      </XStack>
    </YStack>
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
    <YStack alignSelf="center" width="100%" maxWidth={1280} paddingHorizontal="$4" paddingVertical="$7" $sm={{ paddingHorizontal: "$5", paddingVertical: "$9" }}>
      <H1 fontSize="$8" fontWeight="500" letterSpacing={-0.4} color="$color" $sm={{ fontSize: "$10" }} lineHeight="1.1">
        {title}
      </H1>
      <Paragraph marginTop="$2" maxWidth={672} fontSize={14} lineHeight="1.625" color="$color11">
        {blurb ?? (
          <>
            Every project, app and site across Hanzo, Lux and Zoo — searchable in
            one place, and filed by what each one IS: our starters, what people
            built on them, somebody else&rsquo;s work shown with credit, and our
            own software. Entries we built ourselves carry a {OFFICIAL_LABEL}{" "}
            badge. Sign in to see your own projects here too.
          </>
        )}
      </Paragraph>

      <YStack position="relative" marginTop="$5">
        <Search
          size={16}
          strokeWidth={1.6}
  />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search across every org…"
          width="100%" borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingVertical="$2.5" paddingLeft="$7" paddingRight="$4" fontSize="$3" color="$color" outlineWidth={0} placeholderTextColor="$color11" focusStyle={{ borderColor: "$color" }}
  />
      </YStack>

      {/* The lane rail comes FIRST, because it is the question that has to be
          answered before any of the others mean anything. It is absent inside a
          pinned lane, where it could only ever say "yes, still here". */}
      {!pinned && (
        <XStack marginTop="$4" flexWrap="wrap" gap="$2">
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
        </XStack>
      )}

      {/* Lineage as a rail: the parents this lane's apps were built from, biggest
          family first. This is what turns "a pile of forks" into something a
          person can read. */}
      {buckets(facets, "template").length > 1 && (
        <XStack marginTop="$2" flexWrap="wrap" gap="$2">
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
        </XStack>
      )}

      <XStack marginTop="$4" flexWrap="wrap" gap="$2">
        <Pill label="All orgs" active={org === ALL} onClick={() => setOrg(ALL)} />
        {orgs.map(([o, n]) => (
          <Pill key={o} label={o} count={n} active={org === o} onClick={() => setOrg(o)} />
        ))}
        <SizableText marginHorizontal="$1" alignSelf="center" color="$borderColor">|</SizableText>
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
            // NOT "third-party": that is now a LANE with its own count, and one
            // word meaning two different numbers on one screen is worse than the
            // flattening it came from. Authorship's negative is "not ours".
            label={f === "true" ? OFFICIAL_LABEL : "not ours"}
            count={n}
            active={official === f}
            onClick={() => setOfficial(official === f ? ALL : f)}
  />
        ))}
      </XStack>

      <XStack marginTop="$2" flexWrap="wrap" gap="$2">
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
      </XStack>

      <XStack marginTop="$2" flexWrap="wrap" gap="$2">
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
      </XStack>

      <Paragraph marginTop="$5" fontFamily="$mono" fontSize={11} color="$color11">
        {err
          ? "Couldn't load the community feed — check your connection and refresh."
          : loading
            ? "searching…"
            : `${total} results`}
      </Paragraph>

      <YStack marginTop="$4" gap="$4">
        {rows.map((e) => (
          <Card key={`${e.scope}:${e.id}`} e={e} showOrigin={!pinned} onParent={setParent} />
        ))}
      </YStack>

      {!loading && !err && rows.length === 0 && (
        <Paragraph marginTop="$7" fontSize="$3" color="$color11">
          Nothing matches that yet.
        </Paragraph>
      )}
    </YStack>
  );
}
