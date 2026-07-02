// Server-side Hanzo Commerce STOREFRONT client — the per-org binding.
//
// This is the seam described in universe/docs/architecture/hanzo-app-cloud-integration.md:
// a built hanzo.app project *becomes a store* by binding to its org's commerce
// catalog/cart/checkout/orders. The builder never re-implements commerce — it
// only relays the org's identity to the ONE commerce backend, per-org.
//
// Reads the real catalog from commerce (commerce.hanzo.ai) directly from the
// server-side BFF (the gateway only proxies /v1/billing/* today — see §2.3 of
// the doc). When the gateway learns to proxy /v1/{store,cart,checkout,order},
// only HANZO_COMMERCE_STORE_URL changes; this contract is identical.
//
// Auth (doc §5): the storefront read path needs a token with `Published`
// permission. Two real ways, in preference order:
//   (a) forward the signed-in merchant's IAM token (their own server relays it)
//   (b) a per-org storefront `Published` key, minted once, kept in KMS and
//       injected as HANZO_COMMERCE_STOREFRONT_TOKEN for public/logged-out
//       browsing.
// Checkout (POST /v1/checkout/sessions) is PUBLIC — org travels in the body,
// no token — and returns a real Square-hosted checkout URL.
//
// No secret lives here beyond the KMS-injected storefront token; Square creds
// never leave commerce.

const COMMERCE_STORE_URL = (
  process.env.HANZO_COMMERCE_STORE_URL || "https://commerce.hanzo.ai"
).replace(/\/+$/, "");

/** Per-org storefront `Published` key (KMS-injected). Empty when unset. */
const STOREFRONT_TOKEN = process.env.HANZO_COMMERCE_STOREFRONT_TOKEN || "";

// ---------------------------------------------------------------------------
// Public storefront shapes (normalized from commerce's Listing/Order models).
// ---------------------------------------------------------------------------

export interface StoreProduct {
  /** Listing key within the store (the catalog address). */
  key: string;
  productId?: string;
  slug?: string;
  variantId?: string;
  sku?: string;
  name: string;
  headline?: string;
  description?: string;
  /** Primary image URL, if any. */
  image?: string;
  images: string[];
  /** Price in the store currency's minor units (cents). */
  priceCents: number;
  /** Optional strike-through / list price (cents). */
  listPriceCents?: number;
  currency: string;
  available: boolean;
}

export interface StoreCartLine {
  productId?: string;
  productSlug?: string;
  variantSku?: string;
  quantity: number;
}

export interface StoreCart {
  id: string;
  lines: StoreCartLine[];
  raw: unknown;
}

export interface CheckoutSession {
  checkoutUrl: string;
  sessionId: string;
}

// Raw commerce Listing (subset we consume). Fields are pointers server-side and
// serialize to nullable JSON — hence the loose typing here.
interface RawMedia {
  url?: string;
  src?: string;
  href?: string;
}
interface RawListing {
  productId?: string;
  slug?: string;
  variantId?: string;
  sku?: string;
  currency?: string;
  name?: string | null;
  headline?: string | null;
  description?: string | null;
  headerImage?: RawMedia | null;
  media?: RawMedia[] | null;
  price?: number | null;
  listPrice?: number | null;
  available?: boolean | null;
  hidden?: boolean | null;
}

// ---------------------------------------------------------------------------
// Binding — one commerce, scoped to one org per call.
// ---------------------------------------------------------------------------

export interface StoreBinding {
  /** IAM `owner` slug the store belongs to (org == tenant). */
  org: string;
  /** Commerce store within the org (default "default"). */
  storeId: string;
  /** Store currency (ISO 4217), used for checkout. */
  currency: string;
  /**
   * Bearer to authenticate catalog/cart reads: the merchant's forwarded IAM
   * token (path a) or the per-org storefront `Published` key (path b). Empty
   * for unauthenticated public reads with no storefront key configured.
   */
  token?: string;
}

/** Whether a storefront-read token is available (path a or path b). */
export function hasStorefrontAuth(binding: StoreBinding): boolean {
  return Boolean(binding.token || STOREFRONT_TOKEN);
}

function readAuthToken(binding: StoreBinding): string {
  return binding.token || STOREFRONT_TOKEN;
}

async function commerceFetch<T>(
  path: string,
  init: RequestInit & { org: string; token?: string },
): Promise<T> {
  const { org, token, ...rest } = init;
  const headers = new Headers(rest.headers);
  headers.set("Accept", "application/json");
  if (!headers.has("Content-Type") && rest.body) {
    headers.set("Content-Type", "application/json");
  }
  // Deterministic org scoping (doc §2.2): X-Org-Id pins the tenant; a bearer
  // whose `owner` claim already scopes the org also works. We send both.
  if (org) headers.set("X-Org-Id", org);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${COMMERCE_STORE_URL}${path}`, {
    ...rest,
    headers,
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok) {
    let message = text;
    try {
      const j = JSON.parse(text);
      message = j?.error?.message || j?.error || j?.msg || text;
    } catch {
      /* non-JSON error body */
    }
    throw new CommerceError(res.status, message || res.statusText);
  }
  return (text ? JSON.parse(text) : {}) as T;
}

export class CommerceError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "CommerceError";
  }
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

function mediaUrl(m?: RawMedia | null): string | undefined {
  if (!m) return undefined;
  return m.url || m.src || m.href || undefined;
}

function normalizeListing(key: string, l: RawListing, currency: string): StoreProduct {
  const images = [
    mediaUrl(l.headerImage),
    ...((l.media || []).map(mediaUrl)),
  ].filter((u): u is string => Boolean(u));
  return {
    key,
    productId: l.productId || undefined,
    slug: l.slug || undefined,
    variantId: l.variantId || undefined,
    sku: l.sku || undefined,
    name: l.name || key,
    headline: l.headline || undefined,
    description: l.description || undefined,
    image: images[0],
    images,
    priceCents: typeof l.price === "number" ? l.price : 0,
    listPriceCents: typeof l.listPrice === "number" ? l.listPrice : undefined,
    currency: (l.currency || currency || "USD").toUpperCase(),
    available: l.available !== false && l.hidden !== true,
  };
}

/**
 * List the org's real catalog for a store. Returns [] honestly when the
 * catalog is empty (never a fixture). Throws CommerceError on auth/other
 * failures so callers can map 401 → "connect a storefront key", etc.
 */
export async function listProducts(binding: StoreBinding): Promise<StoreProduct[]> {
  // GET /v1/store/{storeid}/listing → map[key]Listing
  const listings = await commerceFetch<Record<string, RawListing>>(
    `/v1/store/${encodeURIComponent(binding.storeId)}/listing`,
    { org: binding.org, token: readAuthToken(binding), method: "GET" },
  );
  return Object.entries(listings || {})
    .map(([key, l]) => normalizeListing(key, l, binding.currency))
    .filter((p) => !p.hidden);
}

/** Fetch one product listing by key. Returns null when not found. */
export async function getProduct(
  binding: StoreBinding,
  key: string,
): Promise<StoreProduct | null> {
  try {
    const l = await commerceFetch<RawListing>(
      `/v1/store/${encodeURIComponent(binding.storeId)}/listing/${encodeURIComponent(key)}`,
      { org: binding.org, token: readAuthToken(binding), method: "GET" },
    );
    return normalizeListing(key, l, binding.currency);
  } catch (e) {
    if (e instanceof CommerceError && e.status === 404) return null;
    throw e;
  }
}

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------

interface RawCart {
  id?: string;
  Id?: string;
  storeId?: string;
  items?: Array<{ productId?: string; slug?: string; sku?: string; quantity?: number }>;
}

function normalizeCart(raw: RawCart): StoreCart {
  const id = raw.id || raw.Id || "";
  const lines: StoreCartLine[] = (raw.items || []).map((it) => ({
    productId: it.productId,
    productSlug: it.slug,
    variantSku: it.sku,
    quantity: it.quantity || 0,
  }));
  return { id, lines, raw };
}

/** Create a cart in the org's store. */
export async function createCart(binding: StoreBinding): Promise<StoreCart> {
  const raw = await commerceFetch<RawCart>(`/v1/cart`, {
    org: binding.org,
    token: readAuthToken(binding),
    method: "POST",
    body: JSON.stringify({ storeId: binding.storeId }),
  });
  return normalizeCart(raw);
}

/** Read a cart by id. */
export async function getCart(
  binding: StoreBinding,
  cartId: string,
): Promise<StoreCart | null> {
  try {
    const raw = await commerceFetch<RawCart>(
      `/v1/cart/${encodeURIComponent(cartId)}`,
      { org: binding.org, token: readAuthToken(binding), method: "GET" },
    );
    return normalizeCart(raw);
  } catch (e) {
    if (e instanceof CommerceError && e.status === 404) return null;
    throw e;
  }
}

/** Set (add/replace) one line item's quantity in the cart. */
export async function setCartItem(
  binding: StoreBinding,
  cartId: string,
  line: StoreCartLine,
): Promise<StoreCart> {
  const raw = await commerceFetch<RawCart>(
    `/v1/cart/${encodeURIComponent(cartId)}/set`,
    {
      org: binding.org,
      token: readAuthToken(binding),
      method: "POST",
      body: JSON.stringify({
        quantity: line.quantity,
        productId: line.productId,
        productSlug: line.productSlug,
        variantSku: line.variantSku,
      }),
    },
  );
  return normalizeCart(raw);
}

// ---------------------------------------------------------------------------
// Checkout — public, org in body, returns a real Square-hosted URL.
// ---------------------------------------------------------------------------

export interface CheckoutItem {
  /** Catalog references — commerce prices these from the org's listing. */
  productId?: string;
  productSlug?: string;
  variantSku?: string;
  name?: string;
  quantity: number;
}

export interface CheckoutInput {
  org: string;
  currency: string;
  items: CheckoutItem[];
  successUrl: string;
  cancelUrl: string;
  customer?: { fullName?: string; email?: string };
}

/**
 * Create a hosted checkout session. Public endpoint: org travels in the body,
 * commerce resolves the org's Square creds from KMS and returns a real hosted
 * checkout URL (sandbox when the org is in test mode). No money is captured
 * here — the shopper completes payment on the hosted page.
 */
export async function createCheckoutSession(
  input: CheckoutInput,
): Promise<CheckoutSession> {
  const body = {
    org: input.org,
    currency: input.currency || "USD",
    successUrl: input.successUrl,
    cancelUrl: input.cancelUrl,
    customer: input.customer
      ? {
          fullName: input.customer.fullName || "",
          email: input.customer.email || "",
          address: "",
          city: "",
          zip: "",
        }
      : undefined,
    items: input.items.map((it) => ({
      id: it.productId || it.productSlug || it.variantSku || "",
      productId: it.productId,
      productSlug: it.productSlug,
      variantSku: it.variantSku,
      name: it.name,
      quantity: it.quantity,
    })),
  };
  return commerceFetch<CheckoutSession>(`/v1/checkout/sessions`, {
    org: input.org,
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

/** Read one order by id (per-org). Returns null when not found. */
export async function getOrder(
  binding: StoreBinding,
  orderId: string,
): Promise<unknown | null> {
  try {
    return await commerceFetch<unknown>(
      `/v1/order/${encodeURIComponent(orderId)}`,
      { org: binding.org, token: readAuthToken(binding), method: "GET" },
    );
  } catch (e) {
    if (e instanceof CommerceError && e.status === 404) return null;
    throw e;
  }
}

export { COMMERCE_STORE_URL };
