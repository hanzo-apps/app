"use client";

/**
 * References — the gallery of imported images and the guidelines drawn from them.
 *
 * One panel, because the two halves are one thought: you look at the images you
 * imported, and at what the model claimed about them, and you remove whichever
 * is wrong. Splitting them would mean deleting a concept in one place and
 * hunting for its source in another.
 *
 * EVERYTHING IS REMOVABLE, and each removal says what else it will take:
 *   - an image goes, and with it anything only that image vouched for
 *   - a colour/theme/concept goes on its own, leaving its images alone
 *
 * The mode is chosen BEFORE the link is read and is shown in the person's own
 * terms, because it decides whether their pictures become the app's content or
 * only reference for its look.
 *
 * The chrome is gui props, like the rest of this app. Two things are not props
 * and cannot be: the tile grid (an element laying out its OWN children) and the
 * remove control that appears on the tile you point at (a child styled by its
 * PARENT's state). Both are selectors, so both live in assets/globals.css under
 * `.ref-grid`.
 */
import { useCallback, useEffect, useState } from "react";
import { Images, Palette, Trash2, X } from "lucide-react";
import { H3, Paragraph, SizableText, XStack, YStack } from "@hanzo/gui";
import { Button, Input, Label } from "@hanzo/ui";

import Loading from "@/components/loading";
import type { Mode } from "@/lib/source/mode";
import type { Brand, Field } from "@/lib/source/brand";

type Asset = {
  id: string;
  name: string;
  kind: string;
  mode: Mode;
  url: string;
  origin: string;
};

const MODE_LABEL: Record<Mode, { title: string; help: string }> = {
  gallery: {
    title: "Use in the app",
    help: "Download these images and put them in the app's gallery.",
  },
  brand: {
    title: "Use as inspiration",
    help: "Study them for colors, themes and concepts. They won't appear in the app.",
  },
};

export function References({ project }: { project?: string | null }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState<Mode>("brand");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const base = project ? `/v1/me/projects/${project}` : null;

  const load = useCallback(async () => {
    if (!base) return;
    try {
      const r = await fetch(`${base}/assets`, { credentials: "same-origin" });
      const j = await r.json();
      if (j?.ok) {
        setAssets(j.assets ?? []);
        setBrand(j.brand ?? null);
      }
    } catch {
      /* the panel simply stays empty; the import button reports its own errors */
    }
  }, [base]);

  useEffect(() => {
    void load();
  }, [load]);

  /** One call shape for every mutation, so each one reports its own failure. */
  const send = async (path: string, init: RequestInit, label: string) => {
    if (!base) return null;
    setBusy(label);
    setErr(null);
    try {
      const r = await fetch(`${base}${path}`, { credentials: "same-origin", ...init });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) {
        // The server's reason, verbatim — "Connect Google first" is actionable
        // where "failed" is not.
        setErr(j?.error ?? `That didn't work (${r.status}).`);
        return null;
      }
      return j;
    } catch {
      setErr("Could not reach the server.");
      return null;
    } finally {
      setBusy(null);
    }
  };

  /**
   * Download the pixels, a batch at a time.
   *
   * The import records what is there; this keeps the bytes. Both modes need
   * them — a gallery hotlinked to Drive breaks when the link rots, and
   * guidelines whose evidence expired point at nothing. Bounded so a folder of
   * two hundred cannot spin forever, and each landed batch is already saved.
   */
  const land = async () => {
    for (let i = 0; i < 40; i++) {
      const j = await send("/assets/bytes", { method: "POST" }, "land");
      if (!j || !j.remaining) break;
    }
    await load();
  };

  const importLink = async () => {
    const j = await send(
      "/assets",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, mode }),
      },
      "import"
    );
    if (j) {
      setUrl("");
      await load();
      await land();
    }
  };

  const removeAsset = async (a: Asset) => {
    const j = await send(`/assets?id=${encodeURIComponent(a.id)}`, { method: "DELETE" }, a.id);
    if (j) {
      setAssets((xs) => xs.filter((x) => x.id !== a.id));
      if (j.brand) setBrand(j.brand);
    }
  };

  const derive = async () => {
    const j = await send("/brand", { method: "POST" }, "derive");
    if (j?.brand) setBrand(j.brand);
  };

  const dropEntry = async (field: Field, value: string) => {
    const j = await send(
      `/brand?field=${field}&value=${encodeURIComponent(value)}`,
      { method: "DELETE" },
      `${field}:${value}`
    );
    if (j?.brand) setBrand(j.brand);
  };

  if (!project) {
    return (
      <Paragraph padding="$4" fontSize="$3" color="$color11">
        Open a project to add reference images.
      </Paragraph>
    );
  }

  const brandCount = assets.filter((a) => a.mode === "brand").length;

  return (
    <YStack gap="$5" padding="$4">
      {/* Link + mode. The mode is chosen before the link is read. */}
      <YStack gap="$2">
        <Label htmlFor="ref-url" fontSize="$1" fontWeight="600" color="$color11">
          Pinterest board or Google Drive folder
        </Label>
        <Input
          id="ref-url"
          value={url}
          onChangeText={(v: string) => setUrl(v)}
          placeholder="https://drive.google.com/drive/folders/…"
          borderRadius="$3"
          borderWidth={1}
          borderColor="$borderColor"
          backgroundColor="$color3"
          paddingHorizontal="$3"
          paddingVertical="$2"
          fontSize="$3"
          color="$color"
        />
        <YStack gap="$1.5" role="radiogroup" aria-label="What are these images for?">
          {(Object.keys(MODE_LABEL) as Mode[]).map((m) => (
            <Label
              key={m}
              cursor="pointer"
              gap="$2"
              borderRadius="$3"
              borderWidth={1}
              borderColor={mode === m ? "$color12" : "$borderColor"}
              backgroundColor={mode === m ? "$color4" : "transparent"}
              padding="$2"
              fontSize="$3"
              display="flex"
              flexDirection="row"
              alignItems="flex-start"
            >
              <input
                type="radio"
                name="ref-mode"
                value={m}
                checked={mode === m}
                onChange={() => setMode(m)}
                style={{ marginTop: 4 }}
              />
              <YStack>
                <XStack alignItems="center" gap="$1.5">
                  {m === "gallery" ? <Images size={14} /> : <Palette size={14} />}
                  <SizableText fontWeight="500" color="$color">
                    {MODE_LABEL[m].title}
                  </SizableText>
                </XStack>
                <Paragraph fontSize="$1" color="$color11">
                  {MODE_LABEL[m].help}
                </Paragraph>
              </YStack>
            </Label>
          ))}
        </YStack>
        <Button
          disabled={!url || busy === "import"}
          onClick={() => void importLink()}
          gap="$1.5"
          disabledStyle={{ opacity: 0.5 }}
        >
          {busy === "import" || busy === "land" ? <Loading overlay={false} size={14} /> : null}
          {busy === "land" ? "Saving images…" : "Import"}
        </Button>
        {err ? (
          <Paragraph role="alert" fontSize="$1" color="$red9">
            {err}
          </Paragraph>
        ) : null}
      </YStack>

      {/* The gallery. Each tile says which mode it came in under. */}
      {assets.length > 0 ? (
        <YStack gap="$2">
          <H3 fontSize="$1" fontWeight="600" color="$color11">
            {assets.length} image{assets.length === 1 ? "" : "s"}
          </H3>
          <ul className="ref-grid">
            {assets.map((a) => (
              <li key={a.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.url} alt={a.name} />
                <SizableText
                  position="absolute"
                  left="$1"
                  top="$1"
                  borderRadius="$2"
                  backgroundColor="rgba(0,0,0,0.7)"
                  paddingHorizontal="$1"
                  fontSize={10}
                  color="white"
                >
                  {a.mode === "gallery" ? "in app" : "inspiration"}
                </SizableText>
                <Button
                  size="icon-sm"
                  className="ref-remove"
                  aria-label={`Remove ${a.name}`}
                  disabled={busy === a.id}
                  onClick={() => void removeAsset(a)}
                  position="absolute"
                  right="$1"
                  top="$1"
                  borderRadius="$2"
                  backgroundColor="rgba(0,0,0,0.7)"
                >
                  <Trash2 size={12} />
                </Button>
              </li>
            ))}
          </ul>
        </YStack>
      ) : null}

      {/* The guidelines, and the removal of anything wrong in them. */}
      {brandCount > 0 ? (
        <YStack gap="$2">
          <XStack alignItems="center" justifyContent="space-between">
            <H3 fontSize="$1" fontWeight="600" color="$color11">
              Branding guidelines
            </H3>
            <Button
              variant="outline"
              size="sm"
              gap="$1.5"
              disabled={busy === "derive"}
              onClick={() => void derive()}
            >
              {busy === "derive" ? <Loading overlay={false} size={14} /> : null}
              {brand?.updated ? "Re-read images" : "Create from images"}
            </Button>
          </XStack>

          {brand?.colors?.length ? (
            <XStack flexWrap="wrap" gap="$1.5">
              {brand.colors.map((c) => (
                <XStack
                  key={c.hex}
                  alignItems="center"
                  gap="$1"
                  borderRadius="$2"
                  borderWidth={1}
                  borderColor="$borderColor"
                  paddingHorizontal="$1.5"
                  paddingVertical="$1"
                >
                  <YStack
                    width={12}
                    height={12}
                    borderRadius="$1"
                    backgroundColor={c.hex}
                    aria-hidden
                  />
                  <SizableText fontSize="$1" color="$color">
                    {c.name ?? c.hex}
                  </SizableText>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Remove color ${c.name ?? c.hex}`}
                    onClick={() => void dropEntry("colors", c.hex)}
                  >
                    <X size={11} />
                  </Button>
                </XStack>
              ))}
            </XStack>
          ) : null}

          {(["themes", "concepts"] as const).map((field) =>
            brand?.[field]?.length ? (
              <YStack key={field} gap="$1">
                <SizableText
                  fontSize={11}
                 
                  letterSpacing={0.3}
                  color="$color11"
                >
                  {field}
                </SizableText>
                <XStack flexWrap="wrap" gap="$1.5">
                  {brand[field].map((t) => (
                    <XStack
                      key={t.text}
                      alignItems="center"
                      gap="$1"
                      borderRadius="$10"
                      borderWidth={1}
                      borderColor="$borderColor"
                      paddingHorizontal="$2"
                      paddingVertical="$0.5"
                    >
                      <SizableText
                        fontSize="$1"
                        color="$color"
                      >
                        {t.text}
                      </SizableText>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Remove ${field.slice(0, -1)} ${t.text}`}
                        onClick={() => void dropEntry(field, t.text)}
                      >
                        <X size={11} />
                      </Button>
                    </XStack>
                  ))}
                </XStack>
              </YStack>
            ) : null
          )}
        </YStack>
      ) : null}
    </YStack>
  );
}
