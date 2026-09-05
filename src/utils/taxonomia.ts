// Single source of truth for content taxonomy.
// Must stay in sync with public/admin/config.yml select widgets.
//
// To add a new slug:
//   1. Add it to the corresponding array.
//   2. Add its display label to the *_DISPLAY map below.
//   3. Sync public/admin/config.yml (Decap select widget).

// ── Slug arrays ─────────────────────────────────────────────────────────────

export const TIPOS = [
  'soneto', 'silva', 'madrigal', 'romance', 'romance-heroico', 'romancillo',
  'endecha', 'decima', 'redondilla', 'cuarteta', 'cuarteto', 'cuarteto-lira',
  'serventesio', 'quintilla', 'sextilla', 'terceto', 'pareado', 'quinteto',
  'sexteto', 'octava-real',
  'lira', 'oda', 'elegia', 'egloga', 'himno', 'balada', 'glosa',
  'copla', 'seguidilla', 'letrilla', 'villancico', 'serranilla', 'haiku', 'tanka',
  'polimetrico', 'verso-libre', 'prosa-poetica',
] as const;

export const MOVIMIENTOS = [
  'medieval', 'siglo-de-oro', 'barroco', 'neoclasicismo', 'romanticismo',
  'realismo', 'modernismo', 'posmodernismo', 'generacion-98', 'vanguardia',
  'generacion-27', 'posguerra', 'contemporaneo', 'popular-tradicional',
] as const;

export const TEMAS = [
  'amor', 'desamor', 'muerte', 'tiempo', 'naturaleza', 'mar', 'noche', 'dios',
  'soledad', 'memoria', 'infancia', 'patria', 'exilio', 'libertad', 'justicia',
  'belleza', 'fe', 'duda', 'melancolia', 'alegria', 'esperanza', 'dolor',
  'trabajo', 'amistad', 'sueno', 'vejez', 'juventud', 'ciudad', 'viaje', 'guerra',
  'paz', 'arte', 'poesia-misma', 'silencio', 'identidad', 'deseo', 'ausencia',
  'humor', 'humor-negro', 'virtud',
] as const;

export const MOTIVOS = [
  'amada', 'amado', 'yo-lirico', 'dios-figura', 'la-muerte-personificada',
  'luna', 'sol', 'mar-figura', 'rio', 'montana', 'jardin', 'rosa', 'ruisenor',
  'reloj', 'espejo', 'ventana', 'puerta', 'camino', 'barco', 'estrella',
  'ceniza', 'lagrima', 'sangre', 'fuego', 'sombra', 'espada', 'libro', 'lira',
  'sepulcro', 'ruinas', 'ojo', 'noche', 'caballo', 'ciudad', 'palma', 'condor',
  'muneca', 'cruz',
] as const;

// Author country. Stored verbatim in `autores.nacionalidad` (proper noun, with
// accents). The /nacionalidades/<slug>/ URL slug is derived in templates (PR 3).
export const NACIONALIDADES = [
  'España', 'Venezuela', 'Colombia', 'México', 'Cuba', 'Argentina',
  'Uruguay', 'Perú', 'Chile', 'Ecuador', 'Siria', 'Puerto Rico', 'Nicaragua',
  'Panamá',
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
  'madrigal': 'Madrigal',
  'romance': 'Romance',
  'romance-heroico': 'Romance heroico',
  'romancillo': 'Romancillo',
  'endecha': 'Endecha',
  'decima': 'Décima',
  'redondilla': 'Redondilla',
  'cuarteta': 'Cuarteta',
  'cuarteto': 'Cuarteto',
  'cuarteto-lira': 'Cuarteto-lira',
  'serventesio': 'Serventesio',
  'quintilla': 'Quintilla',
  'sextilla': 'Sextilla',
  'terceto': 'Terceto',
  'pareado': 'Pareado',
  'quinteto': 'Quinteto',
  'sexteto': 'Sexteto',
  'octava-real': 'Octava real',
  'lira': 'Lira',
  'oda': 'Oda',
  'elegia': 'Elegía',
  'egloga': 'Égloga',
  'himno': 'Himno',
  'balada': 'Balada',
  'glosa': 'Glosa',
  'copla': 'Copla',
  'seguidilla': 'Seguidilla',
  'letrilla': 'Letrilla',
  'villancico': 'Villancico',
  'serranilla': 'Serranilla',
  'haiku': 'Haiku',
  'tanka': 'Tanka',
  'polimetrico': 'Polimétrico',
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
  'posmodernismo': 'Posmodernismo',
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
  'humor': 'Humor',
  'humor-negro': 'Humor negro',
  'virtud': 'Virtud',
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
  'ojo': 'Ojo',
  'noche': 'Noche',
  'caballo': 'Caballo',
  'ciudad': 'Ciudad',
  'palma': 'Palma',
  'condor': 'Cóndor',
  'muneca': 'Muñeca',
  'cruz': 'Cruz',
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
  'Ecuador': 'ecuatorianos',
  'Siria': 'sirios',
  'Puerto Rico': 'puertorriqueños',
  'Nicaragua': 'nicaragüenses',
  'Panamá': 'panameños',
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

// ── Slug + century helpers (author grouping, PR 3) ──────────────────────────

export const URL_SIGLOS = '/siglos';

// "No birth year" bucket on /siglos/. Catches authors with absent `nacimiento`
// AND the sentinel `nacimiento: 0` (e.g. flora-delmis).
export const SIGLO_SIN_FECHA_SLUG = 'sin-fecha';
export const SIGLO_SIN_FECHA_LABEL = 'Sin fecha / Tradición anónima';

// Country name → URL slug. Strips diacritics, lowercases, spaces → hyphen.
// 'España' → 'espana', 'Puerto Rico' → 'puerto-rico'. Inverse is rebuilt in
// templates by mapping over NACIONALIDADES (no reverse table stored).
export function paisASlug(pais: Nacionalidad): string {
  return pais
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-');
}

// Strict century from a birth year: 1801–1900 → 19, 1901–2000 → 20.
// `Math.ceil` enforces the convention (1900 is XIX, not XX). Returns null for
// falsy/invalid years (0, undefined, null), which map to the "sin fecha" group.
export function sigloDeNacimiento(nacimiento?: number | null): number | null {
  if (!nacimiento || nacimiento < 1) return null;
  return Math.ceil(nacimiento / 100);
}

// Integer → uppercase Roman numeral (standard subtractive algorithm). Used for
// century labels/slugs: intARomano(19) → 'XIX'; slug is the lowercase form.
export function intARomano(n: number): string {
  const tabla: Array<[number, string]> = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let resto = n;
  let out = '';
  for (const [valor, simbolo] of tabla) {
    while (resto >= valor) {
      out += simbolo;
      resto -= valor;
    }
  }
  return out;
}