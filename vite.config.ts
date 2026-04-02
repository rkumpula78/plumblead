import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const RAILWAY_URL = 'https://plumblead-production.up.railway.app';

export default defineConfig({
  plugins: [react()],
  server: {
    // Local dev: proxy /api/* to Express on localhost:3000
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
    // Hardcoded Railway URL baked into the bundle at build time
    // Local dev uses empty string (falls back to Vite proxy above)
    'import.meta.env.VITE_API_URL': JSON.stringify(
      process.env.NODE_ENV === 'production' ? RAILWAY_URL : ''
    ),
  },
});
