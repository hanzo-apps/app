import type { MetadataRoute } from "next";

// PWA manifest — lets hanzo.app install as an app and gives it a real identity
// (name, monochrome Hanzo icons, true-black theme) instead of a bare browser tab.
// Icons resolve to the Next file-convention routes (app/icon.svg, app/apple-icon.png).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hanzo — Build with AI",
    short_name: "Hanzo",
    description:
      "Build websites with AI, no code required. Create, deploy, and scale.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon.png", type: "image/png", sizes: "180x180" },
    ],
  };
}
