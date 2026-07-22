// Valida que toda referencia de imagen en el contenido apunte a un archivo existente.
// Cubre dos frentes:
//   1. El campo de imagen del frontmatter: poemas y entradas ('ilustracion'),
//      autores ('imagen').
//   2. Las imagenes embebidas en Markdown '![alt](ruta)', vengan del cuerpo o de
//      un campo de texto como 'nota_curador'. Estas ultimas no las resuelve
//      Astro por su cuenta (ver src/utils/markdown.ts).
// Falla (exit 1) listando cada archivo con imagen faltante.
// Convierte el criptico [ImageNotFound] de Astro/Vite en un mensaje claro
// antes del build, y evita que una referencia huerfana llegue a main.
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname, resolve } from 'node:path';

// Cada coleccion declara su campo de imagen.
const TARGETS = [
  { glob: 'src/content/poemas/*.md', field: 'ilustracion' },
  { glob: 'src/content/autores/*.md', field: 'imagen' },
  { glob: 'src/content/entradas/*.md', field: 'ilustracion' },
];

// Imagen Markdown: '![alt](ruta)', con titulo opcional y ruta entre <> opcional.
const RE_IMG_MD = /!\[[^\]]*\]\(\s*<?([^)"'\s>]+)>?(?:\s+["'][^)]*["'])?\s*\)/g;

let hasError = false;
let checked = 0;

// Resolucion de ruta:
//  - '/algo'  -> relativo a la raiz del repo
//  - 'algo'   -> relativo a la carpeta del .md (convencion image() de Poemario)
function resolverRuta(file, raw) {
  return raw.startsWith('/')
    ? join(process.cwd(), raw.replace(/^\//, ''))
    : resolve(dirname(file), raw);
}

for (const { glob, field } of TARGETS) {
  // core.quotePath=false evita que git escape nombres con tildes/ñ como
  // "archivo" con octales \303\263 en vez de UTF-8 crudo (se manifesto al
  // sumar 'entradas', unica coleccion con nombres de archivo no-ASCII).
  const files = execSync(`git -c core.quotePath=false ls-files "${glob}"`, { encoding: 'utf8' })
    .split('\n')
    .map((f) => f.trim())
    .filter(Boolean);

  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    const match = text.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) continue;
    const frontmatter = match[1];

    // 2. Imagenes embebidas en Markdown, en cualquier punto del archivo.
    //    Se ignoran las remotas (http/data), que no salen de src/assets.
    for (const [, raw] of text.matchAll(RE_IMG_MD)) {
      if (/^(https?:)?\/\/|^data:/.test(raw)) continue;
      checked++;
      if (!existsSync(resolverRuta(file, raw))) {
        hasError = true;
        console.error(`FAIL ${file}`);
        console.error(`     imagen embebida no encontrada: ${raw}`);
      }
    }

    // 1. Campo de imagen del frontmatter.
    const line = frontmatter.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'));
    if (!line) continue;

    const raw = line[1].trim().replace(/^["']|["']$/g, '');
    if (!raw) continue;
    checked++;

    if (!existsSync(resolverRuta(file, raw))) {
      hasError = true;
      console.error(`FAIL ${file}`);
      console.error(`     ${field} no encontrada: ${raw}`);
    }
  }
}

if (hasError) {
  console.error('\nValidacion de imagenes fallida: hay contenido que referencia imagenes inexistentes.');
  process.exit(1);
}

console.log(`${checked} referencia(s) de imagen validadas correctamente.`);
