/**
 * Project Base backend — /api/projects/[id]/base
 *
 * GET   → status: whether Base is configured + which collections exist.
 * POST  → provision: create the project's collections in Base from its SQL
 *         schema (DDL in the request body, as held by the Schema editor).
 *
 * Turns "enable backend" into a real, persistent, IAM-native data layer for a
 * generated app.
 */

import { NextRequest, NextResponse } from "next/server";
import { baseClientForRequest } from "@/lib/base/server";
import { isBaseConfigured } from "@/lib/base";
import { provisionBaseFromDDL } from "@/lib/base/provision";
import { logger } from "@/lib/utils";

export async function GET(): Promise<NextResponse> {
  if (!isBaseConfigured()) {
    return NextResponse.json({ configured: false, collections: [] });
  }
  const client = await baseClientForRequest();
  if (!client) {
    return NextResponse.json({ configured: true, authenticated: false, collections: [] }, { status: 401 });
  }
  try {
    const list = await client.send<{ items: Array<{ id: string; name: string; type: string }> }>(
      "/v1/collections",
      { method: "GET", query: { perPage: "200" } },
    );
    const collections = (list.items ?? [])
      .filter((c) => c.type === "base")
      .map((c) => ({ id: c.id, name: c.name }));
    return NextResponse.json({ configured: true, authenticated: true, collections });
  } catch (err) {
    logger.error("[Project Base] status error:", err);
    return NextResponse.json(
      { configured: true, authenticated: true, collections: [], error: "Failed to read Base" },
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
    return NextResponse.json({ ok: result.failed.length === 0, ...result });
  } catch (err) {
    logger.error("[Project Base] provision error:", err);
    return NextResponse.json({ error: "Provisioning failed." }, { status: 502 });
  }
}
