import { defineConfig } from 'astro/config';

import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  site: 'https://tuesday.paulrojas.quest',
  output: "hybrid",
  adapter: cloudflare(),
  image: {
    service: { entrypoint: 'astro/assets/services/noop' }
  },
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          quietDeps: true,
          // Silencing specific deprecations that are frequent in older Bootstrap/Sass combos
          silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'if-function']
        }
      }
    }
  }
});