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