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
  // Entferne server config - wird für SSR ignoriert
  vite: {
    server: {
      hmr: {
        port: 4000,
        host: '0.0.0.0'
      }
    }
  }
});