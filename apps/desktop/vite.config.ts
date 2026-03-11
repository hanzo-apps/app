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
    INSIGHTS_KEY: JSON.stringify(''),
    INSIGHTS_HOST: JSON.stringify(''),
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
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@services': path.resolve(__dirname, './src/services'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@types': path.resolve(__dirname, './src/types'),
      '@widgets': path.resolve(__dirname, './src/widgets'),
      '@lib': path.resolve(__dirname, './src/lib'),
      'assets': path.resolve(__dirname, './src/assets'),
      'components': path.resolve(__dirname, './src/components'),
      'config': path.resolve(__dirname, './src/config'),
      'lib': path.resolve(__dirname, './src/lib'),
      'stores': path.resolve(__dirname, './src/stores'),
      'store': path.resolve(__dirname, './src/store'),
      'hooks': path.resolve(__dirname, './src/hooks'),
      // Use web version of HanzoNative
      './lib/HanzoNative': path.resolve(__dirname, './src/lib/HanzoNative.web.ts'),
      'lib/HanzoNative': path.resolve(__dirname, './src/lib/HanzoNative.web.ts'),
    },
    extensions: ['.web.js', '.web.jsx', '.web.ts', '.web.tsx', '.js', '.jsx', '.ts', '.tsx'],
  },
  
  optimizeDeps: {
    exclude: ['@tauri-apps/api', '@tauri-apps/plugin-*'],
    esbuildOptions: {
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
    outDir: '../dist',
    
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
    setupFiles: './src/test/setup.ts',
  },
  
  // Environment variables exposed to the app
  envPrefix: ['VITE_', 'TAURI_'],
});