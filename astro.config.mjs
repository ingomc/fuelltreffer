import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import svelte from '@astrojs/svelte';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), svelte()],
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  // HTML-Kompression aktivieren (Standard seit Astro v3)
  compressHTML: true,
  // Server-Konfiguration für Performance-Header
  server: {
    headers: {
      'Vary': 'Accept-Encoding',
      'Cache-Control': 'public, max-age=3600'
    }
  },
  vite: {
    server: {
      hmr: {
        port: 4000,
        host: '0.0.0.0'
      }
    }
  }
});