import { getEntry } from 'astro:content';

// Fetch a fixed-page entry by slug. Throws if the .md is missing so the
// build fails loudly (same contract as the `destacado` singleton) rather
// than silently rendering a page with no title/subtitle.
export async function getPagina(slug: string) {
  const pagina = await getEntry('paginas', slug);
  if (!pagina) {
    throw new Error(
      `[paginas] Falta src/content/paginas/${slug}.md. ` +
        `Esta plantilla depende de ese archivo para sus textos fijos.`,
    );
  }
  return pagina;
}