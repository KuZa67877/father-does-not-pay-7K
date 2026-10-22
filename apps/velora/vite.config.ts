import react from '@vitejs/plugin-react';
import { compressedAssets } from '@dle/config/compressed-assets';
import { preloadMockWorker } from '@dle/config/mock-preload';
import { inlineEntryStyles } from '@dle/config/inline-styles';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), compressedAssets(), preloadMockWorker(), inlineEntryStyles()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  envDir: '../..',
  server: { port: 5174 },
  preview: { port: 4174 },
  build: {
    assetsInlineLimit: 0,
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
  test: {
    name: 'velora',
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
  },
});
