import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * Web + Tauri frontend build for the launcher.
 *
 * `@hanzo/gui` is a Tamagui fork: on web it renders through `react-native-web`,
 * so the ONE alias below (react-native → react-native-web) plus the `GUI_TARGET`
 * define is the entire "make Gui run in the browser" story. No optimizing
 * compiler (runtime Gui) — the exact pattern the console app ships.
 *
 * The `dist/` this produces is loaded directly by the Tauri window
 * (`src-tauri/tauri.conf.json` → frontendDist: ../dist), so desktop and web are
 * byte-for-byte the same bundle.
 */
export default defineConfig({
  clearScreen: false,
  plugins: [react()],
  define: {
    'process.env.GUI_TARGET': JSON.stringify('web'),
    'process.env.TAMAGUI_TARGET': JSON.stringify('web'),
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
  resolve: {
    alias: {
      'react-native': 'react-native-web',
    },
    extensions: ['.web.tsx', '.web.ts', '.web.jsx', '.web.js', '.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
    dedupe: ['react', 'react-dom', 'react-native-web', '@hanzogui/core', '@hanzo/gui'],
  },
  optimizeDeps: {
    esbuildOptions: {
      resolveExtensions: ['.web.js', '.web.ts', '.js', '.ts', '.tsx', '.mjs'],
      loader: { '.js': 'jsx' },
    },
  },
  // Tauri expects a fixed dev port; keep web preview on the same one.
  server: { port: 1420, strictPort: true },
  build: { outDir: 'dist', target: 'es2020', sourcemap: true },
})
