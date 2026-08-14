/**
 * Project Base backend — /api/projects/[id]/base
 *
 * GET   → status: whether Base is configured, which collections exist, and
 *         which functions this project has in the registry.
 * POST  → provision: create the project's collections in Base from its SQL
 *         schema (DDL in the request body, as held by the Schema editor).
 *
 * Turns "enable backend" into a real, persistent, IAM-native data layer for a
 * generated app. Base is ONE backend with two tiers, so ONE status answers for
 * both: the tier that STORES (collections) and the tier that RUNS (functions —
 * deployed on publish by /v1/provision, see lib/base/functions.ts). Functions
 * are read from the registry itself, so this reports what exists, never what
 * was intended.
 */

import { NextRequest, NextResponse } from "next/server";
import { baseClientForRequest } from "@/lib/base/server";
import { isBaseConfigured } from "@/lib/base";
import { provisionBaseFromDDL } from "@/lib/base/provision";
import { cloudBase, resolveScope } from "@/lib/org/server";
import { logger } from "@/lib/utils";

/**
 * This project's functions, as the registry has them. The registry groups by
 * `namespace`; a read that cannot be made returns nothing rather than guessing,
 * because "no functions" and "could not ask" must not look alike to the caller —
 * hence the null.
 */
async function projectFunctions(
  req: NextRequest,
  project: string,
): Promise<Array<{ name: string; runtime: string; endpoint: string }> | null> {
  const scope = await resolveScope(req);
  if (!scope) return null;
  try {
    const res = await fetch(`${cloudBase()}/v1/functions`, {
      headers: {
        Authorization: `Bearer ${scope.token}`,
        Accept: "application/json",
        ...(scope.crossOrg ? { "X-Org-Id": scope.org } : {}),
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = (await res.json()) as
      | { functions?: Array<Record<string, unknown>> }
      | Array<Record<string, unknown>>;
    const items = Array.isArray(body) ? body : (body.functions ?? []);
    return items
      .filter((f) => f.namespace === project)
      .map((f) => ({
        name: String(f.name ?? ""),
        runtime: String(f.environment ?? f.runtime ?? ""),
        endpoint: String(f.endpoint ?? ""),
      }));
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const functions = await projectFunctions(request, id);

  if (!isBaseConfigured()) {
    return NextResponse.json({ configured: false, collections: [], functions });
  }
  const client = await baseClientForRequest();
  if (!client) {
    return NextResponse.json(
      { configured: true, authenticated: false, collections: [], functions },
      { status: 401 },
    );
  }
  try {
    const list = await client.send<{ items: Array<{ id: string; name: string; type: string }> }>(
      "/v1/collections",
      { method: "GET", query: { perPage: "200" } },
    );
    const collections = (list.items ?? [])
      .filter((c) => c.type === "base")
      .map((c) => ({ id: c.id, name: c.name }));
    return NextResponse.json({ configured: true, authenticated: true, collections, functions });
  } catch (err) {
    logger.error("[Project Base] status error:", err);
    return NextResponse.json(
      { configured: true, authenticated: true, collections: [], functions, error: "Failed to read Base" },
      { status: 502 },
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isBaseConfigured()) {
    return NextResponse.json({ error: "Base backend is not configured for this deployment." }, { status: 503 });
  }
  const client = await baseClientForRequest();
  if (!client) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let ddl = "";
  try {
    const body = await request.json();
    ddl = typeof body?.schema === "string" ? body.schema : "";
  } catch {
    return NextResponse.json({ error: 'Expected JSON body with a "schema" (SQL DDL) field.' }, { status: 400 });
  }

  if (!ddl.trim()) {
    return NextResponse.json({ error: "No schema provided. Define tables before provisioning a backend." }, { status: 400 });
  }

  try {
    const result = await provisionBaseFromDDL(client, ddl);
    // A refusal is not a partial result: nothing was provisioned and retrying
    // with this credential never will. Answering 200 {ok:false, failed:[]} said
    // "we tried and nothing went wrong", which is how this read as working.
    if (result.refused) {
      return NextResponse.json({ ok: false, error: result.refused, ...result }, { status: 403 });
    }
    return NextResponse.json({ ok: result.failed.length === 0, ...result });
  } catch (err) {
    logger.error("[Project Base] provision error:", err);
    return NextResponse.json({ error: "Provisioning failed." }, { status: 502 });
  }
}
