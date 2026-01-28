import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Plugin to rewrite /credits to /credits.html in dev
    {
      name: 'rewrite-credits',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === '/credits') {
            req.url = '/credits.html';
          }
          next();
        });
      },
    },
  ],
  root: path.resolve(process.cwd()),
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    host: true,        // listen on LAN
    port: 5174,        // fixed port
    strictPort: true,  // fail if port is taken
    proxy: {
      '/api': {
        // Use environment variable for proxy target, fallback to localhost
        // Set VITE_API_PROXY_TARGET in .env.local for custom backend URL
        target: process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying request:', req.method, req.url, '->', proxyReq.path);
          });
        },
      },
    },
  },
});
