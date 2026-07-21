// Mide el acierto del detector de formas contra las etiquetas `tipo` del
// corpus. Es la cifra que hay que mirar antes y después de tocar el motor.
//
//   npm run taller:medir
//   npm run taller:medir -- --fallos          (lista todos los fallos)
//   npm run taller:medir -- --fallos silva    (solo los de ese tipo)
//
// Aviso: la etiqueta del corpus no es verdad absoluta. Hay poemas mal
// clasificados (alejandrinos etiquetados soneto, cuartetas etiquetadas silva),
// así que un fallo puede ser del corpus y no del motor. Revísalo con
// `npm run taller:diag` antes de cambiar un umbral.
import { cargarMotor, detectarForma, formaSlug, leerCorpus, FUERA_DE_ALCANCE } from './harness.mjs';

const TM = cargarMotor();
const corpus = leerCorpus();

const porTipo = new Map();
const fallos = [];
let aciertos = 0;
let enAlcance = 0;

for (const p of corpus) {
  const { forma } = detectarForma(TM, p.cuerpo);
  const slug = formaSlug(forma);
  const acierta = slug === p.tipo;
  if (!FUERA_DE_ALCANCE.has(p.tipo)) {
    enAlcance++;
    if (acierta) aciertos++;
    else fallos.push({ ...p, forma });
  }
  if (!porTipo.has(p.tipo)) porTipo.set(p.tipo, { n: 0, ok: 0, detectados: {} });
  const t = porTipo.get(p.tipo);
  t.n++;
  if (acierta) t.ok++;
  t.detectados[slug || forma] = (t.detectados[slug || forma] || 0) + 1;
}

const pct = (a, b) => (b ? ((a / b) * 100).toFixed(1) + '%' : '—');
console.log(`\nCORPUS: ${corpus.length} poemas · en alcance: ${enAlcance}`);
console.log(`ACIERTO EN ALCANCE: ${aciertos}/${enAlcance} = ${pct(aciertos, enAlcance)}\n`);
console.log('tipo'.padEnd(16), 'n'.padStart(3), 'ok'.padStart(4), 'acierto'.padStart(8), '  detectados');
for (const [tipo, t] of [...porTipo].filter(([x]) => !FUERA_DE_ALCANCE.has(x)).sort((a, b) => b[1].n - a[1].n)) {
  const det = Object.entries(t.detectados)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}:${v}`)
    .join(' ');
  console.log(tipo.padEnd(16), String(t.n).padStart(3), String(t.ok).padStart(4), pct(t.ok, t.n).padStart(8), ' ', det);
}

const i = process.argv.indexOf('--fallos');
if (i !== -1) {
  const filtro = process.argv[i + 1] && !process.argv[i + 1].startsWith('-') ? process.argv[i + 1] : null;
  console.log(`\n--- FALLOS${filtro ? ` (${filtro})` : ''} ---`);
  for (const f of fallos) {
    if (filtro && f.tipo !== filtro) continue;
    console.log(`${f.tipo.padEnd(16)} → ${String(f.forma).padEnd(34)} ${f.file}`);
  }
}
