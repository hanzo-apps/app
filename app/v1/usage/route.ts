import { NextResponse, type NextRequest } from "next/server";

import { session } from "@/lib/iam";
import { listProjects } from "@/lib/db/projects";
import { buildUsage } from "@/lib/usage";

/**
 * Account usage — honest by construction.
 *
 * There is no user-facing consumption-metering endpoint yet (the platform
 * collects per-app CPU/memory/storage/egress into `appUsageMetrics`, but it is
 * billing-internal). So the only figure we report is the user's REAL project
 * count from the Hanzo Base data plane; everything else is flagged
 * not-yet-metered. No random numbers, no invented caps.
 */
export async function GET(request: NextRequest) {
  const user = await session(request);
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let projectCount = 0;
  try {
    const projects = await listProjects(user.token, user.sub);
    projectCount = projects.length;
  } catch {
    // Base unreachable — report zero rather than fabricate.
    projectCount = 0;
  }

  return NextResponse.json({ usage: buildUsage(projectCount) });
}
