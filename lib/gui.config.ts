// The @hanzo/gui (Tamagui) v5 config the cloud <UsagePanel> renders against.
// `createGui` with the shared v5 default enables the shorthand style props
// (bg/p/items/rounded/…) and tokens the panel uses. Scoped to the usage view via
// <GuiProvider> — this app's own UI stays @hanzo/ui (Radix + Tailwind).
import { defaultConfig } from '@hanzogui/config/v5'
import { createGui } from '@hanzo/gui'

export const config = createGui(defaultConfig)

export default config
