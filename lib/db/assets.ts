import { baseAs } from "@/lib/base";
import type { Mode } from "@/lib/source/mode";
import type { Brand } from "@/lib/source/brand";
import { empty } from "@/lib/source/brand";

/**
 * Imported reference images and the branding guidelines derived from them,
 * stored in Hanzo Base beside project metadata (lib/db/projects.ts) — same data
 * plane, same per-user scoping, no second store.
 *
 * Two collections, because they have different lifetimes: an asset is a thing a
 * person added and can remove one at a time, while `brand` is ONE derived
 * document per project that is rewritten whenever an asset lands or leaves.
 */

/** One imported image. `mode` is why it is here, and decides what may be done with it. */
export type Asset = {
  id: string;
  user_id: string;
  space_id: string;
  /** Where it came from: "drive" | "pinterest". */
  kind: string;
  /** The source's own id for it, so a re-import updates instead of duplicating. */
  external: string;
  name: string;
  mode: Mode;
  /** Durable URL of the stored bytes. Empty until the bytes land. */
  url: string;
  /** The link the person pasted, kept so the gallery can say where this came from. */
  origin: string;
  created: string;
};

export type BrandRow = {
  id: string;
  user_id: string;
  space_id: string;
  brand: Brand;
  created: string;
  updated: string;
};

const lit = (s: string) => s.replace(/'/g, "\\'");
const scope = (userId: string, spaceId: string) =>
  `user_id='${lit(userId)}' && space_id='${lit(spaceId)}'`;

export async function listAssets(
  token: string,
  userId: string,
  spaceId: string
): Promise<Asset[]> {
  const res = await baseAs(token)
    .collection("assets")
    .getList<Asset>(1, 200, { filter: scope(userId, spaceId), sort: "-created" });
  return res.items;
}

/**
 * Add an image, or update the one already imported from the same source item.
 *
 * Keyed on (space, external) so re-importing a folder after adding two photos
 * yields two new assets rather than a second copy of everything — and so a
 * person's chosen MODE for an image survives a re-import.
 */
export async function upsertAsset(
  token: string,
  input: Omit<Asset, "id" | "created">
): Promise<Asset> {
  const db = baseAs(token);
  const filter = `${scope(input.user_id, input.space_id)} && external='${lit(input.external)}'`;
  try {
    const found = await db.collection("assets").getFirstListItem<Asset>(filter);
    return await db.collection("assets").update<Asset>(found.id, input);
  } catch {
    return db.collection("assets").create<Asset>(input);
  }
}

/** Remove one image. Returns it, so the caller can forget its brand contribution. */
export async function removeAsset(
  token: string,
  userId: string,
  spaceId: string,
  id: string
): Promise<Asset | null> {
  const db = baseAs(token);
  try {
    // Read-then-delete, scoped: an id alone would let one user delete another's
    // row, and the caller needs the asset to prune the guidelines it fed.
    const found = await db
      .collection("assets")
      .getFirstListItem<Asset>(`${scope(userId, spaceId)} && id='${lit(id)}'`);
    await db.collection("assets").delete(found.id);
    return found;
  } catch {
    return null;
  }
}

export async function getBrand(
  token: string,
  userId: string,
  spaceId: string
): Promise<Brand> {
  try {
    const row = await baseAs(token)
      .collection("brand")
      .getFirstListItem<BrandRow>(scope(userId, spaceId));
    return row.brand ?? empty();
  } catch {
    return empty();
  }
}

/** Write the derived guidelines for a project, creating the row on first use. */
export async function putBrand(
  token: string,
  userId: string,
  spaceId: string,
  brand: Brand
): Promise<Brand> {
  const db = baseAs(token);
  try {
    const row = await db.collection("brand").getFirstListItem<BrandRow>(scope(userId, spaceId));
    await db.collection("brand").update<BrandRow>(row.id, { brand });
  } catch {
    await db
      .collection("brand")
      .create<BrandRow>({ user_id: userId, space_id: spaceId, brand });
  }
  return brand;
}
