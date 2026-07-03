/**
 * Hanzo GUI config for the launcher case study.
 *
 * ONE config, every target. `@hanzo/gui` is a Tamagui fork: the same
 * `createGui(defaultConfig)` drives web (react-native-web), desktop (the web
 * build wrapped by Tauri) and native iOS/Android (Metro + Expo). The v5 default
 * config sets `onlyShorthandStyleProps`, so the launcher UI uses Gui shorthand
 * props (p/px/gap/items/rounded/bg/...) — identical on every platform.
 *
 * Runtime-only: no optimizing compiler. `GuiProvider` injects the CSS at
 * runtime on web and Gui renders natively on device. (The `@hanzogui/*-plugin`
 * build-time optimizers are an optimization, not a requirement — and their npm
 * `hanzogui-loader` dep is currently unpublished, so consumers stay on runtime.)
 */
import { defaultConfig } from '@hanzogui/config/v5'
import { createGui } from '@hanzo/gui'

export const config = createGui(defaultConfig)

export default config

export type Conf = typeof config

declare module '@hanzo/gui' {
  interface TypeOverride {
    groupNames(): 'a'
  }
  interface GuiCustomConfig extends Conf {}
}
