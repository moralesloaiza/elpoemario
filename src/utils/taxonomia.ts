// Single source of truth for content taxonomy.
// Must stay in sync with public/admin/config.yml select widgets.

export const TIPOS = [
  'soneto', 'silva', 'romance', 'decima', 'redondilla', 'cuarteta', 'cuarteto',
  'terceto', 'octava-real', 'lira', 'oda', 'elegia', 'egloga', 'himno', 'balada',
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
  'paz', 'arte', 'poesia-misma', 'silencio', 'identidad',
] as const;

export const MOTIVOS = [
  'amada', 'amado', 'yo-lirico', 'dios-figura', 'la-muerte-personificada',
  'luna', 'sol', 'mar-figura', 'rio', 'montana', 'jardin', 'rosa', 'ruisenor',
  'reloj', 'espejo', 'ventana', 'puerta', 'camino', 'barco', 'estrella',
  'ceniza', 'lagrima', 'sangre', 'fuego', 'sombra', 'espada', 'libro', 'lira',
  'sepulcro', 'ruinas',
] as const;

export type Tipo = typeof TIPOS[number];
export type Movimiento = typeof MOVIMIENTOS[number];
export type Tema = typeof TEMAS[number];
export type Motivo = typeof MOTIVOS[number];