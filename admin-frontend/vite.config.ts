import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const ADMIN_KEY = process.env.VITE_ADMIN_API_KEY || process.env.OMNITRIX_ADMIN_API_KEY || '';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '127.0.0.1',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, _req, _res) => {
            proxyReq.setHeader('X-Admin-API-Key', ADMIN_KEY);
          });
        }
      }
    }
  }
});
