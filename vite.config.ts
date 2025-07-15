import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Mobile development support
const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
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
    },
  },
  
  build: {
    // Tauri uses its own protocol
    outDir: 'dist',
    
    // Don't minify for debugging
    minify: process.env.TAURI_ENV_DEBUG ? false : 'esbuild',
    
    // Produce sourcemaps for debugging
    sourcemap: process.env.TAURI_ENV_DEBUG ? true : false,
    
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
  },
  
  // Environment variables exposed to the app
  envPrefix: ['VITE_', 'TAURI_'],
});