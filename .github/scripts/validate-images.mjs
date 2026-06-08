// Valida que toda referencia de imagen en el contenido apunte a un archivo existente.
// Cubre: poemas (campo 'ilustracion') y autores (campo 'imagen').
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
];

let hasError = false;
let checked = 0;

for (const { glob, field } of TARGETS) {
  const files = execSync(`git ls-files "${glob}"`, { encoding: 'utf8' })
    .split('\n')
    .map((f) => f.trim())
    .filter(Boolean);

  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    const match = text.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) continue;
    const frontmatter = match[1];

    const line = frontmatter.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'));
    if (!line) continue;

    const raw = line[1].trim().replace(/^["']|["']$/g, '');
    if (!raw) continue;
    checked++;

    // Resolucion de ruta:
    //  - '/algo'  -> relativo a la raiz del repo
    //  - 'algo'   -> relativo a la carpeta del .md (convencion image() de Poemario)
    const target = raw.startsWith('/')
      ? join(process.cwd(), raw.replace(/^\//, ''))
      : resolve(dirname(file), raw);

    if (!existsSync(target)) {
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
