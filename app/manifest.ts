import type { MetadataRoute } from "next";

// PWA manifest — lets hanzo.app install as an app and gives it a real identity
// (name, monochrome Hanzo icons, true-black theme) instead of a bare browser tab.
// Icons resolve to the Next file-convention routes (app/icon.svg, app/apple-icon.png)
// and, for the two installer sizes an OS masks and scales, to public/.
//
// The mark is ONE set of bytes across the estate, rendered from the vector by
// hanzo.ai/scripts/gen-favicons.mjs. A tab is where a reader recognizes us, so
// two hosts drawing two generations of the same H is the one drift that shows.
//
// The installer sizes are listed TWICE, once per purpose. The manifest spec
// makes `purpose` a space-separated set, so one entry can say "any maskable";
// Next types it as a single value (`'any' | 'maskable' | 'monochrome'`), and
// the string form is a type error that stops the release before it builds. Two
// entries naming the same src say the same thing to a user agent — it picks by
// purpose — and say it in the shape the type accepts. Collapsing them back is
// the edit that reopens the hole.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hanzo — describe an app and it gets built",
    short_name: "Hanzo",
    description:
      "Describe an app in plain words. Hanzo writes it, runs it, and puts it on a URL.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon.png", type: "image/png", sizes: "180x180" },
      { src: "/icon-192.png", type: "image/png", sizes: "192x192", purpose: "any" },
      { src: "/icon-192.png", type: "image/png", sizes: "192x192", purpose: "maskable" },
      { src: "/icon-512.png", type: "image/png", sizes: "512x512", purpose: "any" },
      { src: "/icon-512.png", type: "image/png", sizes: "512x512", purpose: "maskable" },
    ],
  };
}
