import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    // Dev-only. Production must reverse-proxy /api on the same origin
    // (TLS-terminated) — the backend listens cleartext on :5000 here and
    // is not safe to expose directly to a browser.
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Split the bundle so the main chunk stays under Vite's 500 kB warning
    // threshold. The `vendor` chunks cache across deploys (node_modules);
    // `react-vendor` is the React + react-dom + react-router split, used
    // widely across the app. `tiptap` is isolated so its ~330 kB doesn't
    // bloat the routes that don't render the editor.
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'radix-vendor': [
            '@radix-ui/react-checkbox',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-alert-dialog',
          ],
          'editor-vendor': ['lucide-react'],
          'tiptap': [
            '@tiptap/react',
            '@tiptap/starter-kit',
            '@tiptap/extension-link',
            // @tiptap/pm has no main entry, so it can't be listed
            // explicitly here — but it's pulled into the same chunk
            // via the @tiptap/react import graph. Verified: 104.96 kB
            // gzipped for the tiptap chunk (well under the 200 kB per-
            // chunk budget).
          ],
        },
      },
    },
  },
});
