import type { MetadataRoute } from "next";

// PWA manifest — lets hanzo.app install as an app and gives it a real identity
// (name, monochrome Hanzo icons, true-black theme) instead of a bare browser tab.
// Icons resolve to the Next file-convention routes (app/icon.svg, app/apple-icon.png)
// and, for the two installer sizes an OS masks and scales, to public/.
//
// The mark is ONE set of bytes across the estate, rendered from the vector by
// hanzo.ai/scripts/gen-favicons.mjs. A tab is where a reader recognizes us, so
// two hosts drawing two generations of the same H is the one drift that shows.
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
      { src: "/icon-192.png", type: "image/png", sizes: "192x192", purpose: "any maskable" },
      { src: "/icon-512.png", type: "image/png", sizes: "512x512", purpose: "any maskable" },
    ],
  };
}
