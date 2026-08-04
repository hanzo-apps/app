// Regenerate app/gui.css — the full @hanzo/gui atomic sheet as a static asset.
// Run after changing lib/gui.ts:  node scripts/gen-gui-css.mjs
// GuiProvider renders with disableInjectCSS, so this file is the ONE source of
// gui styles; without it every HTML document carried the sheet inline (350KB,
// uncacheable, re-sent on every navigation).
import { execSync } from 'node:child_process'
import { writeFileSync, rmSync } from 'node:fs'
execSync('npx esbuild lib/gui.ts --bundle --format=esm --platform=node --external:react --external:react-dom --external:react-native --alias:react-native=react-native-web --outfile=.guicfg.gen.mjs --log-level=error', { stdio: 'inherit' })
const { default: config } = await import(new URL('../.guicfg.gen.mjs', import.meta.url))
writeFileSync(new URL('../app/gui.css', import.meta.url), config.getCSS())
rmSync(new URL('../.guicfg.gen.mjs', import.meta.url))
console.log('app/gui.css regenerated')
