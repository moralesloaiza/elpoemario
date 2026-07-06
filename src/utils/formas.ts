import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { TIPOS } from './taxonomia';

// Build-time guard: every formas/<slug>.md id must belong to the `tipo` enum.
// A stray file (typo, renamed forma) would otherwise render nowhere and fail
// silently; instead we throw so the build breaks loudly. Runs once, memoized.
let asserted = false;
async function assertSlugsAreTipos() {
  if (asserted) return;
  const tipos = new Set<string>(TIPOS);
  const fichas = await getCollection('formas');
  const huerfanas = fichas.filter((f) => !tipos.has(f.id));
  if (huerfanas.length > 0) {
    const ids = huerfanas.map((f) => f.id).join(', ');
    throw new Error(
      `[formas] Ficha(s) cuyo slug no pertenece al enum \`tipo\`: ${ids}. ` +
        `Renombra el archivo a un slug de TIPOS (src/utils/taxonomia.ts) o bórralo.`,
    );
  }
  asserted = true;
}

// Fetch the didactic entry for a forma, or null when no .md exists. Callers
// render the intro block only when this returns a value (conditional render).
export async function getForma(
  slug: string,
): Promise<CollectionEntry<'formas'> | null> {
  await assertSlugsAreTipos();
  const ficha = await getEntry('formas', slug);
  return ficha ?? null;
}
