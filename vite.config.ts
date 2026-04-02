import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Note: @cloudflare/vite-plugin loaded via vite.config.mts
// This file provides a fallback config for non-Cloudflare contexts

const RAILWAY_URL = 'https://plumblead-production.up.railway.app';

export default defineConfig(async () => {
  // Dynamically import the ESM-only cloudflare plugin
  const { cloudflare } = await import('@cloudflare/vite-plugin');
  return {
    plugins: [
      react(),
      cloudflare(),
    ],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
    },
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(
        process.env.NODE_ENV === 'production' ? RAILWAY_URL : ''
      ),
    },
  };
});
