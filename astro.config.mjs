import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind()],
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  server: {
    port: 4000,
    host: '0.0.0.0'
  },
  // Wichtig für Reverse-Proxy (Dokploy)
  vite: {
    server: {
      hmr: {
        port: 4000
      }
    }
  }
});