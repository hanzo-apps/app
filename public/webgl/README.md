# WebGL build artifacts — CI drop contract

The games player (`components/games/game-player.tsx`) embeds a sandboxed iframe
pointing at `/webgl/<id>/index.html`, where `<id>` is the catalog id from
`data/games-catalog.ts`. Whatever self-contained loader lives there is what plays.

In-browser play is driven by two explicit sets in the manifest (a game merely
having `webgl` in `targets` does NOT mean an artifact is hosted):

- `hostedWebglBuilds` — ids with a build hosted under `/webgl/<id>/`. `isPlayable`
  gates the Play button on membership here.
- `placeholderWebglBuilds` — of those, the ones still served by the placeholder
  harness (a live WebGL canvas that verifies the player, sandbox, and controls)
  rather than a real engine export.

Today `unity-red-runner` is the single hosted title, and it is a placeholder.

## What CI must drop

Replace `public/webgl/<id>/` with the engine's own WebGL export. Keep the entry
file named `index.html` — that is the only fixed contract; the engine owns the rest.

### Unity (WebGL build) — e.g. `unity-red-runner`, `unity-chop-chop`, `unity-boss-room`

```
public/webgl/<id>/
  index.html            # Unity WebGL template entry
  Build/
    <id>.loader.js
    <id>.data
    <id>.framework.js
    <id>.wasm
  TemplateData/         # template css/images
```

Use the **Minimal** WebGL template, compression **Disabled** (or **Gzip** with the
matching `Content-Encoding` at the edge) and **Decompression Fallback** ON so the
files serve from static hosting without server config. The player iframe grants
`allow-scripts allow-same-origin` so `.wasm` streaming and data reads work.

## Producing the builds

There is no Unity editor or engine-build CI path in this repo today, so no real
engine export is committed — only the placeholder harness. A build job must:

1. Check out the title's `fork` (or `upstream`) from `data/games-catalog.ts`.
2. Run Unity's headless WebGL export (`-batchmode -buildTarget WebGL`) on a runner
   with the pinned `engineVersion` editor.
3. Publish the export tree above to `public/webgl/<id>/`.
4. Add the id to `hostedWebglBuilds`; once it is a real export, remove it from
   `placeholderWebglBuilds`.

Until then the id stays in `placeholderWebglBuilds` — the player and e2e run green
against the placeholder canvas.
