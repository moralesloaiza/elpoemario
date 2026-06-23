// JSON-LD helpers for El Poemario.
//
// Pure functions: they take in collection entries and return plain
// objects ready for <JsonLd data={...} />. No Astro imports beyond
// type imports, so they remain testable in isolation.
//
// Builders added incrementally per PR:
//   - PR 2: PUBLISHER, absoluteUrl, buildWebSiteJsonLd, buildBreadcrumbJsonLd
//   - PR 3: buildPoemaJsonLd + taxonomiaToKeywords + spotifyToCanonical
//   - PR 4: buildAutorJsonLd

import type { CollectionEntry } from 'astro:content';
import {
  TIPOS_DISPLAY,
  MOVIMIENTOS_DISPLAY,
  TEMAS_DISPLAY,
  MOTIVOS_DISPLAY,
} from './taxonomia';

// Canonical origin. Hard-coded (not imported from consts.ts) to keep
// these helpers free of cross-module dependencies. If the domain ever
// changes, update here and grep for the literal in the codebase.
const SITE_ORIGIN = 'https://elpoemario.com';

// Publisher entity. Emitted inline (not by reference) on the home
// WebSite, and on every Poem, so the JSON-LD block is self-contained.
// Logo must live in /public/ (not /src/assets/) so the URL is stable
// across builds — crawlers cache it.
//
// /logo.svg is the circular Art Déco publisher mark (ink-on-ivory),
// 1000×1000 with explicit width/height. Served from /public/.
export const PUBLISHER = {
  '@type': 'Organization',
  '@id': `${SITE_ORIGIN}/#publisher`,
  name: 'El Poemario',
  url: SITE_ORIGIN,
  logo: `${SITE_ORIGIN}/logo.svg`,
} as const;

// Resolve an absolute URL from a path using the configured site URL.
export function absoluteUrl(path: string, site: URL): string {
  return new URL(path, site).href;
}

// Spotify embed URL → canonical resource URL.
// open.spotify.com/embed/episode/<id> → open.spotify.com/episode/<id>.
// Also handles /embed/track/ and regional prefixes like /embed/intl-es/.
export function spotifyToCanonical(url: string): string {
  return url.replace('/embed/', '/');
}

// Flatten taxonomy into a comma-separated keywords string for SEO.
// Uses the display labels (Spanish, accented) rather than slugs, which
// match how crawlers and LLM agents will index the corpus.
export function taxonomiaToKeywords(
  tipo: string,
  movimiento: string | undefined,
  temas: readonly string[],
  motivos: readonly string[],
): string | undefined {
  const labels: string[] = [];

  const tipoLabel = TIPOS_DISPLAY[tipo as keyof typeof TIPOS_DISPLAY];
  if (tipoLabel) labels.push(tipoLabel);

  if (movimiento) {
    const movLabel = MOVIMIENTOS_DISPLAY[movimiento as keyof typeof MOVIMIENTOS_DISPLAY];
    if (movLabel) labels.push(movLabel);
  }

  for (const t of temas) {
    const label = TEMAS_DISPLAY[t as keyof typeof TEMAS_DISPLAY];
    if (label) labels.push(label);
  }
  for (const m of motivos) {
    const label = MOTIVOS_DISPLAY[m as keyof typeof MOTIVOS_DISPLAY];
    if (label) labels.push(label);
  }

  return labels.length > 0 ? labels.join(', ') : undefined;
}

// Minimal Person reference for embedding as `author` of a Poem.
// The canonical Person (with biography, dates, sameAs) lives at the
// author's own page (built in PR 4); search engines unify entities by
// matching @id.
function personReference(autor: CollectionEntry<'autores'>, site: URL) {
  const autorUrl = absoluteUrl(`/autores/${autor.id}/`, site);
  return {
    '@type': 'Person',
    '@id': `${autorUrl}#person`,
    name: autor.data.nombre,
    url: autorUrl,
  };
}

// Build the `editor` field from the curator metadata. When the curator
// signs under a pseudonym and the real name is recorded, the real name
// is exposed as `alternateName` per schema.org conventions.
function buildEditor(
  curador: string,
  esSeudonimo: boolean,
  nombreReal: string | undefined,
) {
  const editor: Record<string, unknown> = {
    '@type': 'Person',
    name: curador,
  };
  if (esSeudonimo && nombreReal) editor.alternateName = nombreReal;
  return editor;
}

// Input shape matches what Poema.astro receives via Astro.props:
// the entry's `data` flattened, plus `id` injected by the page.
type PoemaInput = CollectionEntry<'poemas'>['data'] & { id: string };

// Build a Poem JSON-LD object for a poema page.
// schema.org/Poem is a CreativeWork subclass specifically intended for
// poetry; prefer it over generic CreativeWork.
export function buildPoemaJsonLd(
  poema: PoemaInput,
  autor: CollectionEntry<'autores'>,
  traductor: CollectionEntry<'autores'> | null,
  site: URL,
): Record<string, unknown> {
  const canonical = absoluteUrl(`/poemas/${poema.id}/`, site);
  const datePublished = poema.fecha.toISOString();
  const dateModified = (poema.fecha_actualizada ?? poema.fecha).toISOString();

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Poem',
    '@id': `${canonical}#poem`,
    name: poema.titulo,
    headline: poema.titulo,
    inLanguage: 'es',
    genre: 'Poesía',
    url: canonical,
    mainEntityOfPage: canonical,
    datePublished,
    dateModified,
    author: personReference(autor, site),
    editor: buildEditor(poema.curador, poema.es_seudonimo, poema.nombre_real),
    publisher: PUBLISHER,
  };

  // Schema.org/CreativeWork.translator — only present when the poema
  // is a translation. Reuses the same #person @id pattern as `author`
  // so crawlers unify the Person entity across pages.
  if (traductor) {
    data.translator = personReference(traductor, site);
  }

  if (poema.resumen) data.description = poema.resumen;;
  if (poema.ilustracion) data.image = absoluteUrl(poema.ilustracion, site);

  const keywords = taxonomiaToKeywords(
    poema.tipo,
    poema.movimiento,
    poema.temas,
    poema.motivos,
  );
  if (keywords) data.keywords = keywords;

  if (poema.spotify_url) {
    data.associatedMedia = {
      '@type': 'AudioObject',
      name: poema.titulo,
      contentUrl: spotifyToCanonical(poema.spotify_url),
      embedUrl: poema.spotify_url,
    };
  }

  return data;
}

// Input shape matches what Autor.astro receives via Astro.props:
// the entry's `data` flattened, plus `id` injected by the page.
type AutorInput = CollectionEntry<'autores'>['data'] & { id: string };

// Build a Person JSON-LD object for an author page. The `@id` uses the
// same `#person` fragment as the inline `author` reference emitted by
// buildPoemaJsonLd, so crawlers unify both entities.
export function buildAutorJsonLd(
  autor: AutorInput,
  site: URL,
): Record<string, unknown> {
  const canonical = absoluteUrl(`/autores/${autor.id}/`, site);

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${canonical}#person`,
    name: autor.nombre,
    url: canonical,
  };

  if (autor.descripcion) data.description = autor.descripcion;
  if (autor.nacionalidad) data.nationality = autor.nacionalidad;
  if (autor.nacimiento) {
    // Schema.org/Person.birthDate accepts xsd:gYear (4-digit year) for
    // year-only precision. No fake 01-01 padding.
    data.birthDate = String(autor.nacimiento);
  }
  if (autor.muerte) {
    data.deathDate = String(autor.muerte);
  }
  if (autor.lugar_nacimiento) {
    data.birthPlace = { '@type': 'Place', name: autor.lugar_nacimiento };
  }
  if (autor.lugar_muerte) {
    data.deathPlace = { '@type': 'Place', name: autor.lugar_muerte };
  }
  if (autor.imagen) data.image = absoluteUrl(autor.imagen, site);
  if (autor.sameAs && autor.sameAs.length > 0) {
    data.sameAs = autor.sameAs;
  }

  return data;
}

// Site-wide WebSite entity. Emitted only on the home page (canonical
// place for the site's identity).
//
// The potentialAction (SearchAction) declares a search endpoint at
// /buscar/?q=... — that page lands in PR 5. Until then the markup
// points to a 404; valid schema.org and consumed by Bing, voice
// assistants, and LLM agents.
export function buildWebSiteJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_ORIGIN}/#website`,
    name: 'El Poemario',
    url: SITE_ORIGIN,
    description: 'Colección de poesía en español.',
    inLanguage: 'es',
    publisher: PUBLISHER,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_ORIGIN}/buscar/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

// Build a BreadcrumbList JSON-LD object from an ordered list of crumbs.
// The last item should be the current page. URLs are emitted for every
// item (Google accepts both omitting and including the leaf URL).
export function buildBreadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
  site: URL,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path, site),
    })),
  };
}