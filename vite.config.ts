import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import path from 'path';

// Mobile development support
const host = process.env.TAURI_DEV_HOST;

// Custom plugin to handle nativewind JSX in .js files
const nativewindJsxPlugin = () => {
  return {
    name: 'nativewind-jsx-transform',
    transform(code, id) {
      // Only process nativewind and react-native-css-interop files
      if (id.includes('nativewind') || id.includes('react-native-css-interop')) {
        // Check if the file contains JSX syntax
        if (code.includes('<') && code.includes('>')) {
          // Transform the code to handle JSX
          return {
            code: code,
            map: null,
          };
        }
      }
      return null;
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    nativewindJsxPlugin(),
    viteCommonjs({
      skipPreBuild: true,
    }),
    react({
      // Include .js files for JSX processing
      include: ['**/*.jsx', '**/*.tsx', '**/*.js', '**/*.ts'],
    }),
  ],
  
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
    },
  },
  
  build: {
    // Tauri uses its own protocol
    outDir: 'dist',
    
    // Don't minify for debugging
    minify: process.env.TAURI_ENV_DEBUG ? false : 'esbuild',
    
    // Produce sourcemaps for debugging
    sourcemap: process.env.TAURI_ENV_DEBUG ? true : false,
    
    commonjsOptions: {
      transformMixedEsModules: true,
      exclude: ['react-native'],
    },
    
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      external: ['react-native'],
    },
  },
  
  // Environment variables exposed to the app
  envPrefix: ['VITE_', 'TAURI_'],
});