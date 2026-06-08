// Valida la sintaxis de todos los archivos .yml/.yaml del repo.
// Falla (exit 1) en el primer error, informando ruta, linea y columna.
// Pensado para CI: evita que un config.yml malformado (p. ej. Decap)
// llegue a main y rompa el panel sin que ningun check lo detecte.
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { parse } from 'yaml';

// Lista de archivos versionados con extension .yml/.yaml (respeta .gitignore).
const files = execSync('git ls-files "*.yml" "*.yaml"', { encoding: 'utf8' })
	.split('\n')
	.map((f) => f.trim())
	.filter(Boolean);

if (files.length === 0) {
	console.log('No se encontraron archivos YAML que validar.');
	process.exit(0);
}

let hasError = false;

for (const file of files) {
	try {
		parse(readFileSync(file, 'utf8'));
		console.log(`OK   ${file}`);
	} catch (err) {
		hasError = true;
		const pos = err.linePos?.[0];
		const where = pos ? ` (linea ${pos.line}, columna ${pos.col})` : '';
		console.error(`FAIL ${file}${where}`);
		console.error(`     ${err.message.split('\n')[0]}`);
	}
}

if (hasError) {
	console.error('\nValidacion YAML fallida.');
	process.exit(1);
}

console.log(`\n${files.length} archivo(s) YAML validados correctamente.`);