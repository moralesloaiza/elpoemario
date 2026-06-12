// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import pagefind from 'astro-pagefind';
import remarkBreaks from 'remark-breaks';
import rehypeExternalLinks from 'rehype-external-links';

// https://astro.build/config
export default defineConfig({
  site: 'https://elpoemario.com',
  trailingSlash: 'always',
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
    // Global: every external http(s) link in any markdown body (poemas,
    // entradas, curator notes, fixed pages) opens in a new tab. Internal
    // and mailto links are untouched.
    rehypePlugins: [
      [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }],
    ],
  },
});