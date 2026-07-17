// Normaliza el nombre de las imagenes de contenido segun el slug de la entrada
// a la que pertenecen, y reescribe la referencia del frontmatter en el mismo paso.
//
// Regla: <prefijo>-<slug-sin-tildes>.<ext>
//   poemas   (campo 'ilustracion') -> poema-<slug>.png
//   autores  (campo 'imagen')      -> autor-<slug>.png
//   entradas (campo 'ilustracion') -> entrada-<slug>.png
//
// Es idempotente: si el nombre ya cumple la regla, no toca nada. Pensado para
// correr en CI tras un merge a main (una imagen recien subida por Decap llega
// con nombre 'chatgpt-...' y aqui queda rebautizada), pero tambien sirve en local
// via `npm run normalize:media`.
//
// Sustituir la imagen de una entrada que ya cumplia la regla es un caso soportado:
// Decap sube la nueva con su nombre ('chatgpt-...') y reapunta el frontmatter, pero
// NO borra la vieja, que queda en uploads ocupando el nombre destino. Si ese destino
// ya no lo referencia ninguna entrada, es huerfano del propio reemplazo y se borra
// antes de renombrar. Si lo referencia alguien, es un conflicto real y se omite.
//
// Guardas de seguridad (ante cualquiera, se OMITE ese caso y se avisa, sin abortar):
//   - imagen referenciada por mas de una entrada (renombrarla romperia la otra)
//   - dos entradas que resolverian al mismo nombre destino (colision)
//   - el nombre destino ya existe en disco Y lo referencia otra entrada
//   - el fichero origen no existe (lo caza validate-images.mjs; aqui solo se ignora)
import { readFileSync, writeFileSync, existsSync, renameSync, unlinkSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname, resolve, basename, extname } from 'node:path';

// Cada coleccion declara su campo de imagen y el prefijo del nombre.
const TARGETS = [
  { glob: 'src/content/poemas/*.md', field: 'ilustracion', prefix: 'poema' },
  { glob: 'src/content/autores/*.md', field: 'imagen', prefix: 'autor' },
  { glob: 'src/content/entradas/*.md', field: 'ilustracion', prefix: 'entrada' },
];

// Quita tildes/diacriticos (o -> o, n con tilde -> n) via descomposicion Unicode,
// pasa a minusculas y deja solo [a-z0-9-]. Los slugs ya vienen limpios; esto es
// una red de seguridad para nombres de fichero validos en URL.
function normalizeSlug(slug) {
  return slug
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function gitFiles(glob) {
  // core.quotePath=false: evita que git escape tildes/n como octales \303\263
  // (necesario para 'entradas', unica coleccion con nombres de archivo no-ASCII).
  return execSync(`git -c core.quotePath=false ls-files "${glob}"`, { encoding: 'utf8' })
    .split('\n')
    .map((f) => f.trim())
    .filter(Boolean);
}

// --- Fase 1: recolectar el plan (sin tocar disco) ---
const plan = []; // { md, field, raw, oldPath, newName, newRaw, newPath, huerfano }
const refCount = new Map(); // oldPath absoluto -> nº de entradas que lo referencian
const warnings = [];

for (const { glob, field, prefix } of TARGETS) {
  for (const md of gitFiles(glob)) {
    const text = readFileSync(md, 'utf8');
    const fm = text.match(/^﻿?---\r?\n([\s\S]*?)\r?\n---/);
    if (!fm) continue;

    const line = fm[1].match(new RegExp(`^${field}:\\s*(.+)$`, 'm'));
    if (!line) continue;

    const raw = line[1].trim().replace(/^["']|["']$/g, '');
    if (!raw) continue;

    // Resolucion de ruta identica a validate-images.mjs:
    //  '/algo' -> relativo a la raiz; 'algo' -> relativo a la carpeta del .md.
    const oldPath = raw.startsWith('/')
      ? join(process.cwd(), raw.replace(/^\//, ''))
      : resolve(dirname(md), raw);

    refCount.set(oldPath, (refCount.get(oldPath) || 0) + 1);

    const ext = extname(raw).toLowerCase() || '.png';
    const slug = normalizeSlug(basename(md, extname(md)));
    const newName = `${prefix}-${slug}${ext}`;

    if (basename(raw) === newName) continue; // ya cumple la regla

    // Reemplaza solo el nombre de fichero dentro de la ruta, preservando el prefijo relativo.
    const newRaw = raw.replace(/[^/]+$/, newName);
    plan.push({ md, field, raw, oldPath, newName, newRaw, newPath: resolve(dirname(oldPath), newName) });
  }
}

// --- Fase 2: validar el plan ---
const byTarget = new Map(); // newPath -> [items]
for (const item of plan) {
  if (!byTarget.has(item.newPath)) byTarget.set(item.newPath, []);
  byTarget.get(item.newPath).push(item);
}

const safe = [];
for (const item of plan) {
  if (!existsSync(item.oldPath)) {
    warnings.push(`OMITIDO ${item.md}: origen inexistente (${item.raw}) -> lo reporta validate-images`);
    continue;
  }
  if (refCount.get(item.oldPath) > 1) {
    warnings.push(`OMITIDO ${item.md}: la imagen ${basename(item.raw)} la usan varias entradas; renombrar manual`);
    continue;
  }
  if (byTarget.get(item.newPath).length > 1) {
    warnings.push(`OMITIDO ${item.md}: varias entradas resolverian a ${item.newName}; renombrar manual`);
    continue;
  }
  if (existsSync(item.newPath) && item.newPath !== item.oldPath) {
    // refCount es el censo completo de referencias (se rellena antes de descartar
    // las entradas que ya cumplen la regla), asi que un destino ausente de el no
    // lo usa nadie: es la imagen vieja de esta misma entrada, ya desreferenciada.
    if (refCount.has(item.newPath)) {
      warnings.push(`OMITIDO ${item.md}: ${item.newName} ya existe y lo referencia otra entrada; renombrar manual`);
      continue;
    }
    item.huerfano = true;
  }
  safe.push(item);
}

// --- Fase 3: ejecutar ---
let renamed = 0;
let replaced = 0;
for (const item of safe) {
  if (item.huerfano) {
    unlinkSync(item.newPath);
    replaced++;
  }
  renameSync(item.oldPath, item.newPath);
  const text = readFileSync(item.md, 'utf8');
  writeFileSync(item.md, text.split(item.raw).join(item.newRaw));
  const nota = item.huerfano ? '  [sustituye a la anterior, ya desreferenciada]' : '';
  console.log(`  ${basename(item.raw)}  ->  ${item.newName}  (${item.md})${nota}`);
  renamed++;
}

for (const w of warnings) console.warn(`AVISO: ${w}`);

if (renamed === 0) {
  console.log('Nombres de imagen ya normalizados: sin cambios.');
} else {
  const nota = replaced > 0 ? ` (${replaced} sustituye(n) a una imagen anterior, borrada)` : '';
  console.log(`\n${renamed} imagen(es) renombrada(s) y referencia(s) actualizada(s).${nota}`);
}
// Salida 0 siempre: las omisiones son avisos, no fallos. La validacion dura
// (referencias rotas) es responsabilidad de validate-images.mjs.
