// JSON-LD helpers for El Poemario.
//
// Pure functions: they take in collection entries and return plain
// objects ready for <JsonLd data={...} />. No Astro imports beyond
// type imports, so they remain testable in isolation.
//
// Builders are added incrementally as their consumer pages land:
//   - PR 2 (this one): PUBLISHER, buildWebSiteJsonLd, buildBreadcrumbJsonLd
//   - PR 3: buildPoemaJsonLd  + taxonomiaToKeywords + spotifyToCanonical
//   - PR 4: buildAutorJsonLd

// Canonical origin. Hard-coded (not imported from consts.ts) to keep
// these helpers free of cross-module dependencies. If the domain ever
// changes, update here and grep for the literal in the codebase.
const SITE_ORIGIN = 'https://elpoemario.com';

// Publisher entity. Emitted inline (not by reference) on the home
// WebSite, and later on every Poem, so the JSON-LD block is
// self-contained. Logo must live in /public/ (not /src/assets/) so the
// URL is stable across builds — crawlers cache it.
//
// NOTE: /logo.svg does not exist yet. The JSON-LD is still valid
// markup; the only consequence is a 404 if a crawler resolves the URL.
// Will be supplied when the final Poemario logo is designed (decision
// §13.3 of the design doc).
export const PUBLISHER = {
  '@type': 'Organization',
  '@id': `${SITE_ORIGIN}/#publisher`,
  name: 'El Poemario',
  url: SITE_ORIGIN,
  logo: `${SITE_ORIGIN}/logo.svg`,
} as const;

// Resolve an absolute URL from a path using the configured site URL.
// Kept exported for use by builders in later PRs.
export function absoluteUrl(path: string, site: URL): string {
  return new URL(path, site).href;
}

// Site-wide WebSite entity. Emitted only on the home page (canonical
// place for the site's identity).
//
// The potentialAction (SearchAction) declares a search endpoint at
// /buscar/?q=... — that page will land in PR 5 (Pagefind-backed
// search). Until then the markup points to a 404; this is acceptable
// SEO practice (declarative metadata, not a crawled link).
//
// Google retired the Sitelinks Search Box feature in late 2024, but
// the markup remains valid schema.org and is consumed by Bing, voice
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
//
// Used by inner pages in later PRs. Kept here in PR 2 because it has
// no dependencies and belongs to the same architectural slot.
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