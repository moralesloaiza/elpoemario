// Single source of truth for content taxonomy.
// Must stay in sync with public/admin/config.yml select widgets.
//
// To add a new slug:
//   1. Add it to the corresponding array.
//   2. Add its display label to the *_DISPLAY map below.
//   3. Sync public/admin/config.yml (Decap select widget).

// ── Slug arrays ─────────────────────────────────────────────────────────────

export const TIPOS = [
  'soneto', 'silva', 'romance', 'decima', 'redondilla', 'cuarteta', 'cuarteto',
  'terceto', 'quinteto', 'sexteto', 'octava-real', 'lira', 'oda', 'elegia',
  'egloga', 'himno', 'balada',
  'copla', 'seguidilla', 'letrilla', 'villancico', 'haiku', 'tanka',
  'verso-libre', 'prosa-poetica',
] as const;

export const MOVIMIENTOS = [
  'medieval', 'siglo-de-oro', 'barroco', 'neoclasicismo', 'romanticismo',
  'realismo', 'modernismo', 'generacion-98', 'vanguardia', 'generacion-27',
  'posguerra', 'contemporaneo', 'popular-tradicional',
] as const;

export const TEMAS = [
  'amor', 'desamor', 'muerte', 'tiempo', 'naturaleza', 'mar', 'noche', 'dios',
  'soledad', 'memoria', 'infancia', 'patria', 'exilio', 'libertad', 'justicia',
  'belleza', 'fe', 'duda', 'melancolia', 'alegria', 'esperanza', 'dolor',
  'trabajo', 'amistad', 'sueno', 'vejez', 'juventud', 'ciudad', 'viaje', 'guerra',
  'paz', 'arte', 'poesia-misma', 'silencio', 'identidad', 'deseo', 'ausencia',
] as const;

export const MOTIVOS = [
  'amada', 'amado', 'yo-lirico', 'dios-figura', 'la-muerte-personificada',
  'luna', 'sol', 'mar-figura', 'rio', 'montana', 'jardin', 'rosa', 'ruisenor',
  'reloj', 'espejo', 'ventana', 'puerta', 'camino', 'barco', 'estrella',
  'ceniza', 'lagrima', 'sangre', 'fuego', 'sombra', 'espada', 'libro', 'lira',
  'sepulcro', 'ruinas',
] as const;

// Author country. Stored verbatim in `autores.nacionalidad` (proper noun, with
// accents). The /nacionalidades/<slug>/ URL slug is derived in templates (PR 3).
export const NACIONALIDADES = [
  'España', 'Venezuela', 'Colombia', 'México', 'Cuba', 'Argentina',
  'Uruguay', 'Perú', 'Chile', 'Siria', 'Puerto Rico', 'Nicaragua',
] as const;

// Original language, for authors who wrote outside Castilian. Optional.
export const LENGUAS = ['catalán', 'árabe'] as const;

// ── Derived types ───────────────────────────────────────────────────────────

export type Tipo = typeof TIPOS[number];
export type Movimiento = typeof MOVIMIENTOS[number];
export type Tema = typeof TEMAS[number];
export type Motivo = typeof MOTIVOS[number];
export type Nacionalidad = typeof NACIONALIDADES[number];
export type Lengua = typeof LENGUAS[number];

// ── Slug → display name maps ────────────────────────────────────────────────

export const TIPOS_DISPLAY: Record<Tipo, string> = {
  'soneto': 'Soneto',
  'silva': 'Silva',
  'romance': 'Romance',
  'decima': 'Décima',
  'redondilla': 'Redondilla',
  'cuarteta': 'Cuarteta',
  'cuarteto': 'Cuarteto',
  'terceto': 'Terceto',
  'quinteto': 'Quinteto',
  'sexteto': 'Sexteto',
  'octava-real': 'Octava real',
  'lira': 'Lira',
  'oda': 'Oda',
  'elegia': 'Elegía',
  'egloga': 'Égloga',
  'himno': 'Himno',
  'balada': 'Balada',
  'copla': 'Copla',
  'seguidilla': 'Seguidilla',
  'letrilla': 'Letrilla',
  'villancico': 'Villancico',
  'haiku': 'Haiku',
  'tanka': 'Tanka',
  'verso-libre': 'Verso libre',
  'prosa-poetica': 'Prosa poética',
};

export const MOVIMIENTOS_DISPLAY: Record<Movimiento, string> = {
  'medieval': 'Medieval',
  'siglo-de-oro': 'Siglo de Oro',
  'barroco': 'Barroco',
  'neoclasicismo': 'Neoclasicismo',
  'romanticismo': 'Romanticismo',
  'realismo': 'Realismo',
  'modernismo': 'Modernismo',
  'generacion-98': 'Generación del 98',
  'vanguardia': 'Vanguardia',
  'generacion-27': 'Generación del 27',
  'posguerra': 'Posguerra',
  'contemporaneo': 'Contemporáneo',
  'popular-tradicional': 'Popular y tradicional',
};

export const TEMAS_DISPLAY: Record<Tema, string> = {
  'amor': 'Amor',
  'desamor': 'Desamor',
  'muerte': 'Muerte',
  'tiempo': 'Tiempo',
  'naturaleza': 'Naturaleza',
  'mar': 'Mar',
  'noche': 'Noche',
  'dios': 'Dios',
  'soledad': 'Soledad',
  'memoria': 'Memoria',
  'infancia': 'Infancia',
  'patria': 'Patria',
  'exilio': 'Exilio',
  'libertad': 'Libertad',
  'justicia': 'Justicia',
  'belleza': 'Belleza',
  'fe': 'Fe',
  'duda': 'Duda',
  'melancolia': 'Melancolía',
  'alegria': 'Alegría',
  'esperanza': 'Esperanza',
  'dolor': 'Dolor',
  'trabajo': 'Trabajo',
  'amistad': 'Amistad',
  'sueno': 'Sueño',
  'vejez': 'Vejez',
  'juventud': 'Juventud',
  'ciudad': 'Ciudad',
  'viaje': 'Viaje',
  'guerra': 'Guerra',
  'paz': 'Paz',
  'arte': 'Arte',
  'poesia-misma': 'Poesía misma',
  'silencio': 'Silencio',
  'identidad': 'Identidad',
  'deseo': 'Deseo',
  'ausencia': 'Ausencia',
};

export const MOTIVOS_DISPLAY: Record<Motivo, string> = {
  'amada': 'La amada',
  'amado': 'El amado',
  'yo-lirico': 'Yo lírico',
  'dios-figura': 'Dios',
  'la-muerte-personificada': 'La muerte personificada',
  'luna': 'Luna',
  'sol': 'Sol',
  'mar-figura': 'Mar',
  'rio': 'Río',
  'montana': 'Montaña',
  'jardin': 'Jardín',
  'rosa': 'Rosa',
  'ruisenor': 'Ruiseñor',
  'reloj': 'Reloj',
  'espejo': 'Espejo',
  'ventana': 'Ventana',
  'puerta': 'Puerta',
  'camino': 'Camino',
  'barco': 'Barco',
  'estrella': 'Estrella',
  'ceniza': 'Ceniza',
  'lagrima': 'Lágrima',
  'sangre': 'Sangre',
  'fuego': 'Fuego',
  'sombra': 'Sombra',
  'espada': 'Espada',
  'libro': 'Libro',
  'lira': 'Lira',
  'sepulcro': 'Sepulcro',
  'ruinas': 'Ruinas',
};

// País → gentilicio plural. Section heading on /nacionalidades/ (PR 3).
export const NACIONALIDADES_DISPLAY: Record<Nacionalidad, string> = {
  'España': 'españoles',
  'Venezuela': 'venezolanos',
  'Colombia': 'colombianos',
  'México': 'mexicanos',
  'Cuba': 'cubanos',
  'Argentina': 'argentinos',
  'Uruguay': 'uruguayos',
  'Perú': 'peruanos',
  'Chile': 'chilenos',
  'Siria': 'sirios',
  'Puerto Rico': 'puertorriqueños',
  'Nicaragua': 'nicaragüenses',
};

// Stored value is lowercase; capitalize at sentence/heading start in templates.
export const LENGUAS_DISPLAY: Record<Lengua, string> = {
  'catalán': 'Catalán',
  'árabe': 'Árabe',
};

// ── URL bases for taxonomy index pages ──────────────────────────────────────

export const URL_TIPOS = '/tipos';
export const URL_MOVIMIENTOS = '/movimientos';
export const URL_TEMAS = '/temas';
export const URL_MOTIVOS = '/motivos';
export const URL_NACIONALIDADES = '/nacionalidades';