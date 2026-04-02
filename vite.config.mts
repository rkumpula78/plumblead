import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cloudflare } from '@cloudflare/vite-plugin';

const RAILWAY_URL = 'https://plumblead-production.up.railway.app';

export default defineConfig({
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
});
