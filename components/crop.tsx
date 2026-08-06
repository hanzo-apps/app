"use client";

/**
 * Crop — frame a picked photo into the square the avatar stores.
 *
 * The stage is a fixed square window onto the image; the user pans by dragging
 * and zooms with the slider, and what sits inside the window IS the crop — a
 * circle veil previews exactly what the round avatar will show. The dialog
 * returns a `Region` in source pixels and never encodes: `avatarDataUrl` stays
 * the one road from a file to a stored avatar.
 *
 * Geometry, one invariant: the image always covers the stage. `cover` is the
 * floor scale (the smaller edge fills the window); zoom multiplies it up to
 * 4×; the offset is clamped so no gap can appear on any side. Zooming keeps
 * the point at the window's centre fixed, which is what a hand expects.
 *
 * Hand-rolled on purpose — a pan, a clamp and one multiply are less code than
 * a cropper dependency, and this app's install is not a place to add one.
 */
import { SizableText, XStack, YStack } from "@hanzo/ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@hanzo/ui";

import type { Region } from "@/lib/image";

/** Stage edge in CSS pixels — the square window the user frames inside. */
const STAGE = 280;

/** Zoom ceiling over the covering scale. */
const REACH = 4;

export function Crop({
  file,
  onUse,
  onCancel,
}: {
  /** The picked photo; the dialog is open exactly while one is present. */
  file: File | null;
  onUse: (region: Region) => void;
  onCancel: () => void;
}) {
  const [url, setUrl] = useState("");
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  // t ∈ [0,1] is the slider; the scale multiplies the covering floor by REACH^t.
  const [t, setT] = useState(0);
  const [at, setAt] = useState({ x: 0, y: 0 });
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);

  useEffect(() => {
    if (!file) return;
    const u = URL.createObjectURL(file);
    setUrl(u);
    setSize(null);
    setT(0);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const cover = size ? STAGE / Math.min(size.w, size.h) : 1;
  const scale = cover * Math.pow(REACH, t);

  const clamp = useCallback(
    (x: number, y: number, s: number) => {
      if (!size) return { x, y };
      return {
        x: Math.min(0, Math.max(STAGE - size.w * s, x)),
        y: Math.min(0, Math.max(STAGE - size.h * s, y)),
      };
    },
    [size],
  );

  // The image is measured from the DOM once per pick: naturalWidth honours
  // EXIF orientation the same way the encoder's decode does, so the region
  // framed here is the region kept there.
  const measure = (img: HTMLImageElement) => {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (!w || !h) return;
    setSize({ w, h });
    const s = STAGE / Math.min(w, h);
    setAt({ x: (STAGE - w * s) / 2, y: (STAGE - h * s) / 2 });
  };

  const zoom = (next: number) => {
    // Keep the source point under the window's centre where it is.
    const s2 = cover * Math.pow(REACH, next);
    const cx = (STAGE / 2 - at.x) / scale;
    const cy = (STAGE / 2 - at.y) / scale;
    setT(next);
    setAt(clamp(STAGE / 2 - cx * s2, STAGE / 2 - cy * s2, s2));
  };

  return (
    <Dialog open={!!file} onOpenChange={(open: boolean) => !open && onCancel()}>
      <DialogContent maxWidth={344} borderColor="$borderColor" backgroundColor="$background">
        <DialogHeader>
          <DialogTitle>Frame your photo</DialogTitle>
          <DialogDescription color="$color11">
            Drag to position, zoom to fit — the circle is what your profile shows.
          </DialogDescription>
        </DialogHeader>

        <YStack alignItems="center" gap="$3">
          <div
            style={{
              position: "relative",
              width: STAGE,
              height: STAGE,
              overflow: "hidden",
              borderRadius: 8,
              cursor: "grab",
              touchAction: "none",
              background: "#000",
            }}
            onPointerDown={(e) => {
              (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
              drag.current = { px: e.clientX, py: e.clientY, x: at.x, y: at.y };
            }}
            onPointerMove={(e) => {
              const d = drag.current;
              if (!d) return;
              setAt(clamp(d.x + e.clientX - d.px, d.y + e.clientY - d.py, scale));
            }}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
          >
            {url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt=""
                draggable={false}
                onLoad={(e) => measure(e.currentTarget)}
                style={
                  size
                    ? {
                        position: "absolute",
                        left: at.x,
                        top: at.y,
                        width: size.w * scale,
                        height: size.h * scale,
                        maxWidth: "none",
                        userSelect: "none",
                      }
                    : { position: "absolute", visibility: "hidden" }
                }
              />
            )}
            {/* The circle veil: everything outside what the avatar will show is
                dimmed, nothing is intercepted — the drag goes to the stage. */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
                pointerEvents: "none",
              }}
            />
          </div>

          <XStack alignItems="center" gap="$2.5" width={STAGE}>
            <SizableText fontSize="$1" color="$color11">Zoom</SizableText>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={t}
              onChange={(e) => zoom(Number(e.target.value))}
              aria-label="Zoom"
              style={{ flex: 1, accentColor: "#fff" }}
            />
          </XStack>
        </YStack>

        <XStack justifyContent="flex-end" gap="$2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            borderColor="$borderColor"
            backgroundColor="transparent"
            hoverStyle={{ backgroundColor: "$color3" }}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => {
              if (!size) return;
              onUse({ x: -at.x / scale, y: -at.y / scale, edge: STAGE / scale });
            }}
            disabled={!size}
            backgroundColor="$color5"
            borderWidth={1}
            borderColor="$color6"
            hoverStyle={{ backgroundColor: "$color6" }}
          >
            Use photo
          </Button>
        </XStack>
      </DialogContent>
    </Dialog>
  );
}
