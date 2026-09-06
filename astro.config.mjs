import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import svelte from '@astrojs/svelte';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  site: 'https://darts.sc-oberfuellbach.de',
  integrations: [tailwind(), svelte()],
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  // HTML-Kompression aktivieren (Standard seit Astro v3)
  compressHTML: true,
  // Dev pages and modules must reflect edits immediately.
  server: {
    headers: {
      'Vary': 'Accept-Encoding',
      'Cache-Control': 'no-store'
    }
  },
  vite: {
    // Let Astro/Vite infer the HMR host and port from the actual dev server.
    optimizeDeps: {
      // Prebundle these before the first page loads to keep shared runtime imports stable.
      include: ['@stomp/stompjs', 'sockjs-client', 'leaflet'],
      esbuildOptions: {
        // SockJS uses the Node-style name in its browser entry point.
        define: { global: 'globalThis' }
      }
    }
  }
});
