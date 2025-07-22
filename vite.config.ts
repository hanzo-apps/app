import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { readFileSync } from 'fs';

// Read package.json to get version
const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));

// Mobile development support for Tauri v2
const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig({
  root: 'src',
  plugins: [
    react(),
  ],
  
  define: {
    VERSION: JSON.stringify(packageJson.version),
    IS_TAURI: true,
    IS_MACOS: process.platform === 'darwin',
    IS_WINDOWS: process.platform === 'win32',
    IS_LINUX: process.platform === 'linux',
    IS_IOS: false,
    IS_ANDROID: false,
    PLATFORM: JSON.stringify(process.platform),
    POSTHOG_KEY: JSON.stringify(''),
    POSTHOG_HOST: JSON.stringify(''),
  },
  
  // Prevent Vite from obscuring Rust errors
  clearScreen: false,
  
  server: {
    // Tauri expects a fixed port
    port: 5173,
    strictPort: true,
    
    // Mobile development support
    host: host || false,
    
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 5174,
        }
      : undefined,
  },
  
  resolve: {
    alias: {
<<<<<<< HEAD
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@services': path.resolve(__dirname, './src/services'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@types': path.resolve(__dirname, './src/types'),
      'assets': path.resolve(__dirname, './src/assets'),
      'components': path.resolve(__dirname, './src/components'),
      'config': path.resolve(__dirname, './src/config'),
      'lib': path.resolve(__dirname, './src/lib'),
      'stores': path.resolve(__dirname, './src/stores'),
      'store': path.resolve(__dirname, './src/store'),
      'hooks': path.resolve(__dirname, './src/hooks'),
      // React Native Web aliases - must come after other aliases
      'react-native$': 'react-native-web',
      'react-native/Libraries/Components/View/ViewStylePropTypes$': 'react-native-web/dist/exports/View/ViewStylePropTypes',
      'react-native/Libraries/EventEmitter/RCTDeviceEventEmitter$': 'react-native-web/dist/vendor/react-native/NativeEventEmitter/RCTDeviceEventEmitter',
      'react-native/Libraries/vendor/emitter/EventEmitter$': 'react-native-web/dist/vendor/react-native/emitter/EventEmitter',
      'react-native/Libraries/vendor/emitter/EventSubscriptionVendor$': 'react-native-web/dist/vendor/react-native/emitter/EventSubscriptionVendor',
      'react-native/Libraries/EventEmitter/NativeEventEmitter$': 'react-native-web/dist/vendor/react-native/NativeEventEmitter',
      // Shim nativewind for web
      'nativewind': path.resolve(__dirname, './src/lib/nativewind-shim.ts'),
      // Use web version of HanzoNative
      './lib/HanzoNative': path.resolve(__dirname, './src/lib/HanzoNative.web.ts'),
      'lib/HanzoNative': path.resolve(__dirname, './src/lib/HanzoNative.web.ts'),
    },
    extensions: ['.web.js', '.web.jsx', '.web.ts', '.web.tsx', '.js', '.jsx', '.ts', '.tsx'],
  },
  
  optimizeDeps: {
    include: ['react-native-web'],
    exclude: ['react-native', 'nativewind', 'react-native-css-interop'],
    esbuildOptions: {
      resolveExtensions: ['.web.js', '.web.jsx', '.web.ts', '.web.tsx', '.js', '.jsx', '.ts', '.tsx'],
      loader: {
        '.js': 'jsx',
        '.ts': 'tsx',
      },
      jsx: 'automatic',
      jsxDev: true,
=======
      '@': path.resolve(__dirname, './src/ts'),
      '@components': path.resolve(__dirname, './src/ts/components'),
      '@hooks': path.resolve(__dirname, './src/ts/hooks'),
      '@utils': path.resolve(__dirname, './src/ts/utils'),
      '@services': path.resolve(__dirname, './src/ts/services'),
      '@stores': path.resolve(__dirname, './src/ts/stores'),
      '@widgets': path.resolve(__dirname, './src/ts/widgets'),
      '@lib': path.resolve(__dirname, './src/ts/lib'),
>>>>>>> mess
    },
  },
  
  build: {
    // Tauri uses its own protocol
    outDir: 'dist',
    
    // Don't minify for debugging
    minify: process.env.TAURI_ENV_DEBUG ? false : 'esbuild',
    
    // Always produce sourcemaps for better debugging
    sourcemap: true,
    
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    
    rollupOptions: {
      
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['clsx', '@tauri-apps/api'],
          'mobx-vendor': ['mobx', 'mobx-react-lite'],
        },
      },
    },
  },
  
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/ts/test/setup.ts',
  },
  
  // Environment variables exposed to the app
  envPrefix: ['VITE_', 'TAURI_'],
});
