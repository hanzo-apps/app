/**
 * The one gui config.
 *
 * `createGui()` registers the token and media tables in module-global state; it
 * runs once, here, and `GuiProvider` hands the same object down.
 *
 * NON-OBVIOUS: `patches/@hanzo__ui@8.0.70.patch` rewrites this config's SPACE
 * scale to `calc(Npx * var(--density,1))` strings so the Appearance density knob
 * actually moves the chrome (no-op at density=1). It lives as a pnpm patch only
 * because the @hanzo/ui 8.x source is unshippable from here (#113) — upstream it
 * into @hanzo/ui/gui-config.ts when that unblocks, then drop the patch.
 */
export { config as default } from '@hanzo/ui/gui-config'
