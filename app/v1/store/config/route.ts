// GET/POST /v1/store/config — a project's "become a store" switch.
//
// upsertStoreConfig has existed (documented, admin-gated by Base/IAM on the
// write) with NO caller, so nothing could ever create the Base row that binds a
// project to an org. Without that row every storefront call answers 409
// store_not_configured and checkout can never reach a payment page. This is the
// one route that writes it.
//
// The binding holds NO secrets — Square creds stay in commerce/KMS, so this is
// safe to read back to an authenticated owner.
//
// org is NOT free-form client input: it is the caller's effective org, and a
// body that names a different one is refused unless the caller is a superadmin.
// Otherwise anyone could bind their project to someone else's tenant and take
// checkout through that org's Square account.
import { NextRequest, NextResponse } from "next/server";
import { resolveOrgIdentity, effectiveOrg } from "@/lib/org/server";
import {
  getStoreConfig,
  upsertStoreConfig,
  DEFAULT_SUBSYSTEMS,
  type StoreConfig,
  type StoreMode,
} from "@/lib/store-config";

export const dynamic = "force-dynamic";

const MODES: readonly StoreMode[] = ["ecommerce", "b2c", "b2b"];

const unauthorized = () =>
  NextResponse.json({ error: "unauthorized" }, { status: 401 });

export async function GET(req: NextRequest) {
  const spaceId = req.nextUrl.searchParams.get("space_id");
  if (!spaceId) {
    return NextResponse.json(
      { error: "space_id_required", message: "space_id is required" },
      { status: 400 },
    );
  }
  const id = await resolveOrgIdentity(req, { validate: true });
  if (!id) return unauthorized();

  // id.token IS the raw IAM bearer, resolved from THIS request. Do not reach for
  // an ambient headers() lookup as a second source — one request, one token.
  const config = await getStoreConfig(id.token, spaceId);
  if (!config) {
    return NextResponse.json(
      { error: "store_not_configured", message: "This project is not bound to a store." },
      { status: 404 },
    );
  }
  // Read is org-scoped too: a row for another tenant is not this caller's to see.
  const org = effectiveOrg(req, id);
  if (config.org !== org && !id.isSuperAdmin) return unauthorized();
  return NextResponse.json(config);
}

export async function POST(req: NextRequest) {
  const id = await resolveOrgIdentity(req, { validate: true });
  if (!id) return unauthorized();

  let body: {
    space_id?: string;
    org?: string;
    mode?: string;
    store_id?: string;
    currency?: string;
    domain?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const spaceId = (body.space_id || "").trim();
  if (!spaceId) {
    return NextResponse.json(
      { error: "space_id_required", message: "space_id is required" },
      { status: 400 },
    );
  }

  const org = effectiveOrg(req, id);
  const requested = (body.org || "").trim();
  if (requested && requested !== org && !id.isSuperAdmin) {
    return NextResponse.json(
      {
        error: "org_forbidden",
        message: "org must be your own org — a store binds to the caller's tenant.",
      },
      { status: 403 },
    );
  }
  const boundOrg = requested && id.isSuperAdmin ? requested : org;
  if (!boundOrg) {
    return NextResponse.json(
      { error: "no_org", message: "no org resolved for the caller" },
      { status: 400 },
    );
  }

  const mode = (body.mode || "ecommerce") as StoreMode;
  if (!MODES.includes(mode)) {
    return NextResponse.json(
      { error: "invalid_mode", message: `mode must be one of ${MODES.join(", ")}` },
      { status: 400 },
    );
  }

  const config: StoreConfig = {
    space_id: spaceId,
    org: boundOrg,
    mode,
    subsystems: DEFAULT_SUBSYSTEMS,
    storefront: {
      store_id: (body.store_id || "default").trim(),
      currency: (body.currency || "USD").trim().toUpperCase(),
      domain: body.domain?.trim() || undefined,
    },
  };

  try {
    const saved = await upsertStoreConfig(id.token, config);
    return NextResponse.json(saved);
  } catch (e) {
    // Base/IAM enforces admin-of-org on the write; surface its refusal honestly
    // rather than reporting a success the row does not reflect.
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: "write_failed", message }, { status: 502 });
  }
}
