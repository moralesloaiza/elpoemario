// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import pagefind from 'astro-pagefind';
import remarkBreaks from 'remark-breaks';

// https://astro.build/config
export default defineConfig({
  site: 'https://elpoemario.com',
  integrations: [
    sitemap({
      // /buscar/ es una SERP (resultados de búsqueda), no contenido
      // indexable. Se excluye del sitemap para evitar que Google la
      // rastree como página de contenido.
      filter: (page) => !page.endsWith('/buscar/'),
    }),
    pagefind(),
  ],
  markdown: {
    remarkPlugins: [remarkBreaks],
  },
});