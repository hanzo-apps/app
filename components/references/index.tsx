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
 */
import { useCallback, useEffect, useState } from "react";
import { Images, Loader2, Palette, Trash2, X } from "lucide-react";

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
    return <p className="p-4 text-sm text-neutral-400">Open a project to add reference images.</p>;
  }

  const brandCount = assets.filter((a) => a.mode === "brand").length;

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* Link + mode. The mode is chosen before the link is read. */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-neutral-300" htmlFor="ref-url">
          Pinterest board or Google Drive folder
        </label>
        <input
          id="ref-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://drive.google.com/drive/folders/…"
          className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
        />
        <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="What are these images for?">
          {(Object.keys(MODE_LABEL) as Mode[]).map((m) => (
            <label
              key={m}
              className={`flex cursor-pointer gap-2 rounded-md border p-2 text-sm ${
                mode === m ? "border-white bg-neutral-800" : "border-neutral-700"
              }`}
            >
              <input
                type="radio"
                name="ref-mode"
                value={m}
                checked={mode === m}
                onChange={() => setMode(m)}
                className="mt-1"
              />
              <span>
                <span className="flex items-center gap-1.5 font-medium text-neutral-100">
                  {m === "gallery" ? <Images size={14} /> : <Palette size={14} />}
                  {MODE_LABEL[m].title}
                </span>
                <span className="block text-xs text-neutral-400">{MODE_LABEL[m].help}</span>
              </span>
            </label>
          ))}
        </div>
        <button
          type="button"
          disabled={!url || busy === "import"}
          onClick={() => void importLink()}
          className="flex items-center justify-center gap-1.5 rounded-md bg-white px-3 py-2 text-sm font-medium text-black disabled:opacity-50"
        >
          {busy === "import" ? <Loader2 className="animate-spin" size={14} /> : null} Import
        </button>
        {err ? (
          <p role="alert" className="text-xs text-red-400">
            {err}
          </p>
        ) : null}
      </div>

      {/* The gallery. Each tile says which mode it came in under. */}
      {assets.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold text-neutral-300">
            {assets.length} image{assets.length === 1 ? "" : "s"}
          </h3>
          <ul className="grid grid-cols-3 gap-2">
            {assets.map((a) => (
              <li key={a.id} className="group relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.url}
                  alt={a.name}
                  className="aspect-square w-full rounded-md object-cover"
                />
                <span className="absolute left-1 top-1 rounded bg-black/70 px-1 text-[10px] text-white">
                  {a.mode === "gallery" ? "in app" : "inspiration"}
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${a.name}`}
                  disabled={busy === a.id}
                  onClick={() => void removeAsset(a)}
                  className="absolute right-1 top-1 rounded bg-black/70 p-1 text-white opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  <Trash2 size={12} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* The guidelines, and the removal of anything wrong in them. */}
      {brandCount > 0 ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-neutral-300">Branding guidelines</h3>
            <button
              type="button"
              disabled={busy === "derive"}
              onClick={() => void derive()}
              className="flex items-center gap-1.5 rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-100 disabled:opacity-50"
            >
              {busy === "derive" ? <Loader2 className="animate-spin" size={14} /> : null}
              {brand?.updated ? "Re-read images" : "Create from images"}
            </button>
          </div>

          {brand?.colors?.length ? (
            <ul className="flex flex-wrap gap-1.5">
              {brand.colors.map((c) => (
                <li key={c.hex} className="flex items-center gap-1 rounded border border-neutral-700 px-1.5 py-1">
                  <span className="h-3 w-3 rounded-sm" style={{ background: c.hex }} aria-hidden />
                  <span className="text-xs text-neutral-200">{c.name ?? c.hex}</span>
                  <button
                    type="button"
                    aria-label={`Remove color ${c.name ?? c.hex}`}
                    onClick={() => void dropEntry("colors", c.hex)}
                    className="text-neutral-500 hover:text-white"
                  >
                    <X size={11} />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {(["themes", "concepts"] as const).map((field) =>
            brand?.[field]?.length ? (
              <div key={field} className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wide text-neutral-500">{field}</span>
                <ul className="flex flex-wrap gap-1.5">
                  {brand[field].map((t) => (
                    <li
                      key={t.text}
                      className="flex items-center gap-1 rounded-full border border-neutral-700 px-2 py-0.5"
                      // How many images vouched for it — the difference between a
                      // brand trait and one photo's accident.
                      title={`from ${t.from.length} image${t.from.length === 1 ? "" : "s"}`}
                    >
                      <span className="text-xs text-neutral-200">{t.text}</span>
                      <button
                        type="button"
                        aria-label={`Remove ${field.slice(0, -1)} ${t.text}`}
                        onClick={() => void dropEntry(field, t.text)}
                        className="text-neutral-500 hover:text-white"
                      >
                        <X size={11} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null
          )}
        </div>
      ) : null}
    </div>
  );
}
