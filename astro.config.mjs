// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import remarkBreaks from 'remark-breaks';

// https://astro.build/config
export default defineConfig({
  site: 'https://elpoemario.com',
  integrations: [sitemap()],
  markdown: {
    remarkPlugins: [remarkBreaks],
  },
});