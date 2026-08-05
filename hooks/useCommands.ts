'use client';

/**
 * useCommands — every operation the cloud answers, for the ⌘K bar's Run group.
 *
 * The list is not written down anywhere in this app, and that is the whole point.
 * `GET /v1/commands` is a projection of the cloud's one route table — the same
 * registry that produces the REST routes, the OpenAPI document, the MCP tools and
 * the `hanzo` CLI — so a route registered this morning is a ⌘K command this
 * afternoon with nothing edited here.
 *
 * ONE fetch per browser session, module-cached and in-flight-deduped, the same
 * shape hooks/useProjects uses: the header's palette and the AppShell's palette
 * both mount, and they must cost one request, not two. The catalog is immutable
 * for a cloud release so there is nothing to invalidate.
 *
 * A FAILURE IS NOT AN ERROR HERE. The endpoint ships with the next cloud release;
 * until it lands, and any time the catalog is unreachable, this answers with an
 * empty list and the bar simply has no Run group. Its own commands — the projects
 * and the navigation — are unaffected. Interrupting somebody who pressed ⌘K to
 * jump to a project with a toast about a catalog they did not ask for would be
 * strictly worse than the group being absent.
 */

import { useEffect, useState } from 'react';
import type { Op } from '@hanzo/ui/product';

/**
 * One command as the cloud serves it.
 *
 * The field names are Go's because the payload IS `zip.Command`, marshalled —
 * the registry's own type, not a wire shape this app or the cloud invented for
 * it. A hand-picked subset would be the second definition the whole design
 * exists to avoid.
 */
export interface Command {
  Service: string;
  Name: string;
  OperationID: string;
  Summary: string;
  Description: string;
  Method: string;
  /** The route in the router's `:name` form, e.g. /v1/projects/:id */
  Path: string;
  /** Path parameters, in path order. They address the resource. */
  Args: Array<{ Name: string; Help: string }> | null;
  /** Everything else the operation takes. */
  Flags: Array<{
    Name: string;
    Field: string;
    Type: string;
    Help: string;
    Required: boolean;
  }> | null;
}

/** The command's own spelling, `service operation` — what a CLI would type. */
export const spell = (c: Command): string => `${c.Service} ${c.Name}`;

/**
 * What the operation still needs before it can run: its path parameters, then
 * its required flags. Empty means it is runnable as it stands.
 */
export const missing = (c: Command): string[] => [
  ...(c.Args ?? []).map((a) => a.Name),
  ...(c.Flags ?? []).filter((f) => f.Required).map((f) => f.Name),
];

/** The bar's view of a command. `method` is what makes the safety rule work. */
const asOp = (c: Command): Op => ({
  id: c.OperationID,
  group: c.Service,
  label: c.Name,
  hint: c.Summary,
  method: c.Method,
});

export interface Catalog {
  ops: Op[];
  /** The full command behind a row, for running it. */
  find: (id: string) => Command | undefined;
}

const EMPTY: Catalog = { ops: [], find: () => undefined };

let cache: Catalog | null = null;
let inflight: Promise<Catalog> | null = null;

async function load(): Promise<Catalog> {
  const res = await fetch('/v1/commands', { headers: { Accept: 'application/json' } });
  if (!res.ok) return EMPTY;
  const list = (await res.json()) as Command[];
  if (!Array.isArray(list)) return EMPTY;
  const by = new Map(list.map((c) => [c.OperationID, c]));
  return { ops: list.map(asOp), find: (id) => by.get(id) };
}

export function useCommands(): Catalog {
  const [catalog, setCatalog] = useState<Catalog>(cache ?? EMPTY);

  useEffect(() => {
    if (cache) return;
    let live = true;
    inflight ??= load().catch(() => EMPTY);
    inflight.then((got) => {
      cache = got;
      inflight = null;
      if (live) setCatalog(got);
    });
    return () => {
      live = false;
    };
  }, []);

  return catalog;
}
