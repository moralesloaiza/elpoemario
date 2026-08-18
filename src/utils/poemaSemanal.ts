// Selección determinista del "poema de la semana".
//
// El sitio es estático (Astro → Cloudflare Pages): el HTML de la portada se
// congela en el build. Esta función NO tiene estado ni aleatoriedad: dada una
// fecha y un pozo de poemas elegibles, devuelve SIEMPRE el mismo poema durante
// los siete días de esa semana. Así todos los visitantes ven el mismo poema, y
// el cambio efectivo lo dispara el rebuild semanal (ver
// .github/workflows/poema-semanal.yml, que hace ping al Deploy Hook de
// Cloudflare cada lunes).
//
// Propiedades de diseño:
//   - Determinista: mismo (pozo, fecha) → mismo poema. Sin Math.random.
//   - Barajado estable: el orden NO es cronológico (para que semanas seguidas no
//     caigan en poemas vecinos), pero es fijo — depende solo del id.
//   - Cíclico: recorre todo el pozo antes de repetir. Con ~180 poemas
//     ilustrados son ~3,5 años de turnos únicos.
//
// El límite de semana cae en lunes 00:00 UTC (la época elegida es un lunes), en
// coherencia con el cron del disparador (lunes 06:00 UTC).

// 2024-01-01 fue lunes. Ancla de la cuenta de semanas (lunes 00:00 UTC).
const EPOCA_UTC = Date.UTC(2024, 0, 1);
const MS_POR_SEMANA = 7 * 24 * 60 * 60 * 1000;

/**
 * Número de semanas completas transcurridas desde la época. Monótono creciente;
 * puede ser negativo para fechas anteriores a 2024 (irrelevante en producción).
 */
export function indiceSemana(ahora: Date): number {
  return Math.floor((ahora.getTime() - EPOCA_UTC) / MS_POR_SEMANA);
}

/**
 * Hash FNV-1a de 32 bits. Estable entre ejecuciones y plataformas: solo depende
 * del texto, sin sembrar con reloj ni aleatoriedad.
 */
function hash(texto: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    // Multiplicación FNV (0x01000193) en aritmética de 32 bits.
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Baraja el pozo de forma determinista, ordenando por el hash del id. El
 * desempate por id garantiza un orden total estable aunque dos hashes colisionen.
 */
export function ordenBarajado<T extends { id: string }>(pozo: readonly T[]): T[] {
  return [...pozo].sort((a, b) => {
    const ha = hash(a.id);
    const hb = hash(b.id);
    if (ha !== hb) return ha - hb;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

/**
 * Devuelve el poema que toca en la semana de `ahora`, o `null` si el pozo está
 * vacío. El índice se normaliza con módulo positivo para tolerar fechas
 * anteriores a la época.
 */
export function poemaDeLaSemana<T extends { id: string }>(
  pozo: readonly T[],
  ahora: Date,
): T | null {
  if (pozo.length === 0) return null;
  const orden = ordenBarajado(pozo);
  const i = ((indiceSemana(ahora) % orden.length) + orden.length) % orden.length;
  return orden[i];
}
