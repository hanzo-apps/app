/**
 * What an imported image is FOR — and what that permits.
 *
 * A person links a Pinterest board or a Drive folder for one of two reasons, and
 * the reason changes what the builder is allowed to do with the bytes. Getting
 * this wrong in either direction is the failure this module exists to prevent:
 *
 *   gallery — the images ARE the content. They are downloaded, stored, and
 *             embedded in the app as real <img> sources. The bytes must be kept,
 *             because a link that rots takes the app's gallery with it.
 *
 *   brand   — the images are REFERENCE. They are looked at to derive colors,
 *             themes and concepts for the project's branding guidelines, and
 *             they never appear in the built app. The bytes are kept only so the
 *             person can see what their guidelines were drawn from, and revisit
 *             or remove that reasoning later.
 *
 * The modes are not two labels on one behaviour. `gallery` publishes third-party
 * pixels into a shipped artifact; `brand` reads them and emits words and hex
 * codes. Those have different consequences, so the permission is DATA here and
 * every consumer asks — rather than each call site remembering which case it is
 * in, which is how a reference image ends up shipped in someone's product.
 */

/** The two reasons an image is imported. There is no third. */
export type Mode = "gallery" | "brand";

export const MODES: readonly Mode[] = ["gallery", "brand"] as const;

/** What a mode allows. Read it; do not re-derive it at a call site. */
export type Policy = {
  /** Keep the image bytes. True for both — see `embeds` for the difference. */
  readonly stores: boolean;
  /** May the image be embedded in the BUILT app as content? Only `gallery`. */
  readonly embeds: boolean;
  /** Is the image read to derive colors/themes/concepts? Only `brand`. */
  readonly analyzes: boolean;
  /** One line a person reads before choosing. */
  readonly summary: string;
};

const POLICY: Record<Mode, Policy> = {
  gallery: {
    // Downloaded and kept deliberately: an app whose gallery is hotlinked to
    // pinimg.com or drive.google.com breaks the day the source moves, and it
    // leaks every viewer's request to a third party.
    stores: true,
    embeds: true,
    analyzes: false,
    summary: "Download these images and use them in the app's gallery.",
  },
  brand: {
    // Also stored, for a different reason: the guidelines assert "these colors
    // came from these images", and a claim whose evidence is gone cannot be
    // checked or revised.
    stores: true,
    embeds: false,
    analyzes: true,
    summary:
      "Study these images for colors, themes and concepts, and write branding guidelines. They will not appear in the app.",
  },
};

export const policy = (mode: Mode): Policy => POLICY[mode];

/** Narrow an untrusted value (a request body, a stored row) to a Mode. */
export const isMode = (v: unknown): v is Mode =>
  typeof v === "string" && (MODES as readonly string[]).includes(v);

/**
 * The mode of a value that must have one, refusing anything else.
 *
 * There is deliberately NO default. A missing mode is a caller that never said
 * what the images are for, and guessing picks between publishing someone's
 * pixels and merely looking at them — the one decision this module refuses to
 * make on their behalf.
 */
export function requireMode(v: unknown): Mode {
  if (!isMode(v)) {
    throw new Error(
      `mode must be one of ${MODES.join(" | ")} — say what the images are for`
    );
  }
  return v;
}

/** May this asset be embedded in the built app? The one gate consumers call. */
export const embeddable = (mode: unknown): boolean =>
  isMode(mode) && policy(mode).embeds;
