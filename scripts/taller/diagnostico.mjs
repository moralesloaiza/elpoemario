// Por qué el motor ve lo que ve. Tres vistas, para no cambiar umbrales a ciegas:
//
//   npm run taller:diag -- silva romance        histograma de medidas y estrofas
//   npm run taller:diag -- --stats verso-libre  estadísticos que separan familias
//   npm run taller:diag -- --estrofas oda-a-la  estrofa a estrofa de un archivo
import { cargarMotor, detectarForma, leerCorpus } from './harness.mjs';

const TM = cargarMotor();
const corpus = leerCorpus();
const args = process.argv.slice(2);
const modo = args.find((a) => a.startsWith('--')) || '--medidas';
const objetivos = args.filter((a) => !a.startsWith('--'));

if (!objetivos.length) {
  console.log('Indica uno o más tipos (o un prefijo de archivo con --estrofas).');
  process.exit(1);
}

// Estadísticos de un poema. `rima` = proporción de versos cuya rima consonante
// se repite; es lo que separa una silva (rima abundante) del verso libre.
function estadisticos(p) {
  const activos = p.cuerpo.split('\n').map(TM.analyzeLine).filter(Boolean);
  const m = activos.map((a) => a.metric);
  const n = m.length;
  const dom = TM.mode(m);
  const n7 = m.filter((x) => x === 7).length;
  const n11 = m.filter((x) => x === 11).length;
  const cnt = {};
  activos.forEach((a) => (cnt[a.keys.cons] = (cnt[a.keys.cons] || 0) + 1));
  return {
    n, dom,
    domFrac: m.filter((x) => x === dom).length / n,
    en711: (n7 + n11) / n,
    minorFrac: Math.min(n7, n11) / n,
    rima: activos.filter((a) => cnt[a.keys.cons] >= 2).length / n,
  };
}

const f = (x) => (x * 100).toFixed(0).padStart(3) + '%';

if (modo === '--estrofas') {
  for (const p of corpus.filter((x) => objetivos.some((o) => x.file.startsWith(o)))) {
    const analizados = p.cuerpo.split('\n').map(TM.analyzeLine);
    const activos = analizados.filter(Boolean);
    const dom = TM.mode(activos.map((a) => a.metric));
    const regular = activos.filter((a) => a.metric === dom).length / activos.length >= 0.5;
    const ajustados = analizados.map((a) =>
      a ? { ...a, metric: (regular ? TM.fitToMeter(a, dom) : { metric: a.metric }).metric } : null);
    const estrofas = TM.groupStanzas(ajustados);
    console.log(`\n=== ${p.file} · ${estrofas.length} estrofas · dom=${dom} · regular=${regular}`);
    estrofas.forEach((s, i) => {
      console.log(
        `  ${String(i + 1).padStart(2)} m=${JSON.stringify(s.map((a) => a.metric)).padEnd(24)}` +
        ` cons=${TM.schemeOf(s, 'cons').padEnd(8)} ason=${TM.schemeOf(s, 'ason').padEnd(8)}` +
        ` ${TM.classifyStanza(s) || '—'}`,
      );
    });
  }
} else if (modo === '--stats') {
  for (const tipo of objetivos) {
    console.log(`\n===== ${tipo}`);
    console.log('   n    dom domFrac  {7,11}  minor   rima   archivo');
    for (const p of corpus.filter((x) => x.tipo === tipo)) {
      const s = estadisticos(p);
      console.log(
        `${String(s.n).padStart(4)} ${String(s.dom).padStart(6)} ${f(s.domFrac)} ${f(s.en711)}` +
        ` ${f(s.minorFrac)} ${f(s.rima)}   ${p.file}`,
      );
    }
  }
} else {
  for (const p of corpus.filter((x) => objetivos.includes(x.tipo))) {
    const analizados = p.cuerpo.split('\n').map(TM.analyzeLine);
    const activos = analizados.filter(Boolean);
    const m = activos.map((a) => a.metric);
    const hist = {};
    m.forEach((x) => (hist[x] = (hist[x] || 0) + 1));
    const tam = {};
    TM.groupStanzas(analizados).forEach((s) => (tam[s.length] = (tam[s.length] || 0) + 1));
    const s = estadisticos(p);
    console.log(
      `\n${p.tipo.toUpperCase()} ${p.file} (${m.length} versos) → ${detectarForma(TM, p.cuerpo).forma}` +
      `\n   medidas: ${Object.entries(hist).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${k}:${v}`).join(' ')}` +
      `   dom=${s.dom} (${f(s.domFrac)})` +
      `\n   en {7,11}: ${f(s.en711)}   minoritaria: ${f(s.minorFrac)}   rima: ${f(s.rima)}` +
      `\n   estrofas: ${JSON.stringify(tam)}`,
    );
  }
}
