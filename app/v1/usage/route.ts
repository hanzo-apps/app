import { NextResponse, type NextRequest } from "next/server";

import { session } from "@/lib/iam";
import { cloudBase } from "@/lib/org/server";
import { buildUsage } from "@/lib/usage";

/**
 * Account usage — honest by construction.
 *
 * There is no user-facing consumption-metering endpoint yet (the platform
 * collects per-app CPU/memory/storage/egress into `appUsageMetrics`, but it is
 * billing-internal). So the only figure reported is the REAL project count —
 * and it counts the plane the product shows: the ORG's projects on cloud
 * `/v1/projects`, the same rows the dashboard lists. It used to count the
 * per-user Base `projects` collection (prompt rows written lazily by
 * per-project features), which answered 0 against a dashboard showing 44 —
 * a number nobody could reconcile. Everything else stays flagged
 * not-yet-metered. No invented caps.
 */
export async function GET(request: NextRequest) {
  const user = await session(request);
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let projectCount = 0;
  try {
    const res = await fetch(`${cloudBase()}/v1/projects`, {
      headers: { Authorization: `Bearer ${user.token}` },
      cache: "no-store",
    });
    if (res.ok) {
      const rows = (await res.json()) as unknown;
      if (Array.isArray(rows)) projectCount = rows.length;
      else if (Array.isArray((rows as { projects?: unknown[] })?.projects)) {
        projectCount = (rows as { projects: unknown[] }).projects.length;
      }
    }
  } catch {
    // Cloud unreachable — report zero rather than fabricate.
    projectCount = 0;
  }

  return NextResponse.json({ usage: buildUsage(projectCount) });
}
