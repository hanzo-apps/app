# WebGL build artifacts — CI drop contract

The games player (`components/games/game-player.tsx`) embeds a sandboxed iframe
pointing at `/webgl/<id>/index.html`, where `<id>` is the catalog id from
`data/games-catalog.ts`. Whatever self-contained loader lives there is what plays.

A title's `playable` field states the truth about what is here today:

- **`placeholder`** — this directory ships a live WebGL canvas that stands in for
  the real export (so the player, sandbox, and controls are verified) until a CI
  job drops the real build.
- **`web`** — the real export is present and plays.
- **`none`** — no web build exists (e.g. Unreal desktop titles); no directory here.

## What CI must drop

Replace `public/webgl/<id>/` with the engine's own WebGL/HTML5 export. Keep the
entry file named `index.html` — that is the only fixed contract; the engine owns
the rest.

### Godot 4 (HTML5 export) — e.g. `dodge-the-creeps`

```
public/webgl/<id>/
  index.html            # Godot export entry (rename the .html export to index.html)
  <id>.js               # engine loader
  <id>.wasm             # engine binary
  <id>.pck              # packed game data
  <id>.audio.worklet.js # (if audio worklets are enabled)
```

Export with **Head Include** empty and the canvas id left default; the player
iframe grants `allow-scripts allow-same-origin` so `.wasm` streaming and `.pck`
reads work.

### Unity (WebGL build) — e.g. `boss-room`, `chop-chop`

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

Use the **Minimal** WebGL template, compression **Disabled** or **Gzip** with the
matching `Content-Encoding` at the edge, and **Decompression Fallback** ON so the
files serve from static hosting without server config.

## Producing the builds

There is no Unity/Godot editor or engine-build CI path in this repo today, so no
real engine export is committed — only the placeholder harness. A build job must:

1. Check out the title's `upstream` (or Hanzo `fork`) from `data/games-catalog.ts`.
2. Run the engine's headless WebGL/HTML5 export on a runner with the editor.
3. Publish the export tree above to `public/webgl/<id>/`.
4. Flip that title's `playable` to `"web"` in the catalog.

Until then, keep `playable: "placeholder"` — the player and e2e run green against
the placeholder canvas.
