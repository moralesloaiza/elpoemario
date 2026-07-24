// Sitewide constants. Used by Header, Footer, JSON-LD, BaseHead-equivalent
// invocations, and the home hero. Single source of truth for the public
// identity strings y para los pocos valores de encuadre compartidos.

export const SITE_TITLE = 'El Poemario';
export const SITE_DESCRIPTION =
  'Antología digital de poesía en español. Sonetos, silvas, romances y verso libre, con ilustración Art Déco nocturna.';

// Spotify show for the home "El Poemario en voz alta" podcast card. Fixed
// site identity (like the footer), not per-entry content. Linked externally,
// not embedded: a show embed is heavy and clashes with the sober home.
export const SPOTIFY_SHOW_URL = 'https://open.spotify.com/show/033mtWcyHN6Z3STTh0xL0m';

// Foco vertical por defecto de los RETRATOS de autor cuando hacen de hero, en %
// desde el borde superior. Distinto del default del componente (8, pensado para
// las ilustraciones de poemas y entradas): en un retrato la cabeza está más
// centrada y admite recortar algo más por arriba. Vive aquí porque hay dos
// sitios que renderizan un retrato a toda sangre —la ficha del autor y la
// portada, cuando el destacado es un autor— y deben coincidir.
export const FOCO_RETRATO = 15;