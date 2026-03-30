import { defineConfig } from 'astro/config';

import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  site: 'https://tuesday.paulrojas.quest',
  output: "hybrid",
  adapter: cloudflare()
});