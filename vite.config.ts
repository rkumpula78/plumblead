import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const RAILWAY_URL = 'https://plumblead-production.up.railway.app';

export default defineConfig(async () => {
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
      // Always hardcode Railway URL — no conditional, no env var dependency
      'import.meta.env.VITE_API_URL': JSON.stringify(RAILWAY_URL),
    },
  };
});
