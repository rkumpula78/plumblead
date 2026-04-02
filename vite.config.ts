import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Production backend: https://plumblead-production.up.railway.app
// Set VITE_API_URL in Cloudflare Pages environment variables
// Local dev: Vite proxies /api/* to localhost:3000

export default defineConfig({
  plugins: [react()],
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
    // Bakes the API URL into the frontend bundle at build time
    // Falls back to empty string (relative URLs) if not set
    'import.meta.env.VITE_API_URL': JSON.stringify(
      process.env.VITE_API_URL || ''
    ),
  },
});
