// Genera el BANCO DE RIMAS de El Taller: un índice estático que el cliente
// consulta para sugerir palabras con las que rimar.
//
// Fuente: los lemas del diccionario Hunspell `dictionary-es` (con tildes, que
// son imprescindibles para la tónica y por tanto para la rima). Se descartan
// nombres propios, siglas y una pequeña lista de palabras gramaticales.
//
// Las claves de rima las calcula el MOTOR REAL del taller (rhymeKeys, vía el
// harness), así el banco casa exactamente con la rima que detecta la escansión.
//
// Salida: public/taller/rimas/<ason>.json — un archivo por terminación asonante
// (vocal tónica + vocal final; ~31 en total). Cada uno mapea la clave
// CONSONANTE -> lista de palabras, ordenadas «primero las del corpus de El
// Poemario, luego las más cortas». El cliente descarga solo el shard de la
// terminación que busca (1–11 KB) y lo cachea. Un manifest.json lista los
// shards disponibles para no pedir archivos que no existen.
//
// Uso: npm run taller:rimas
import fs from 'node:fs';
import path from 'node:path';
import { cargarMotor, leerCorpus, RAIZ } from './harness.mjs';

const CAP_POR_CONSONANTE = 200;   // tope por rima consonante (sobra para mostrar)
const CAP_ASONANTE = 140;         // tope del fondo asonante ya rankeado del shard
const LARGO_MIN = 3;              // descarta ruido de 2 letras (ob, oc, fo, ro…)
const SALIDA = path.join(RAIZ, 'public/taller/rimas');

// Palabras gramaticales que, por cortas, encabezarían las listas sin aportar
// como rima. No se excluyen sus SONIDOS (otras palabras los cubren), solo estas.
const VACIAS = new Set(
  ('a al ante bajo cabe con contra de del desde durante en entre hacia hasta ' +
   'mediante para por según sin so sobre tras y e o u ni que se lo la el los las ' +
   'un una unos unas mi tu su mis tus sus me te le nos os les ha he has le si no ' +
   'ya oh eh ah').split(' '),
);

const RE_PALABRA = /^[a-záéíóúüïñ]+$/;

function normalizar(w) {
  return w.normalize('NFC').toLowerCase();
}

// Extrae el vocabulario de los poemas publicados para el ranking (boost).
function vocabularioCorpus() {
  const set = new Set();
  for (const p of leerCorpus()) {
    const palabras = p.cuerpo.match(/[A-Za-zÁÉÍÓÚÜÏÑáéíóúüïñ]+/g) || [];
    for (const w of palabras) set.add(normalizar(w));
  }
  return set;
}

// Lee los lemas del .dic de Hunspell, limpios. Descarta la cabecera (número),
// las entradas con mayúscula (nombres propios/siglas), las que no son solo
// letras y las palabras vacías.
function leerLemas() {
  const dic = fs.readFileSync(
    path.join(RAIZ, 'node_modules/dictionary-es/index.dic'),
    'utf8',
  );
  const out = new Set();
  const lineas = dic.split('\n');
  for (let i = 1; i < lineas.length; i++) {
    const bruto = lineas[i].split('/')[0].split('\t')[0].trim();
    if (!bruto || bruto.length < LARGO_MIN) continue;
    if (bruto !== bruto.toLowerCase()) continue;   // nombre propio / sigla
    const w = normalizar(bruto);
    if (!RE_PALABRA.test(w)) continue;
    if (VACIAS.has(w)) continue;
    out.add(w);
  }
  return [...out];
}

function main() {
  const TM = cargarMotor();
  if (!TM.rhymeKeys) throw new Error('El motor no expone rhymeKeys (revisa harness.mjs).');

  const corpus = vocabularioCorpus();
  const lemas = leerLemas();

  // ason -> Map(cons -> [words])
  const shards = new Map();
  let indexados = 0;
  for (const w of lemas) {
    let k;
    try { k = TM.rhymeKeys(w); } catch { continue; }
    if (!k || !k.ason || !k.cons) continue;
    if (!/^[a-z]+$/.test(k.ason)) continue;        // clave de archivo segura
    let m = shards.get(k.ason);
    if (!m) { m = new Map(); shards.set(k.ason, m); }
    let a = m.get(k.cons);
    if (!a) { a = []; m.set(k.cons, a); }
    a.push(w);
    indexados++;
  }

  // ordena y trunca cada cubo consonante: corpus primero, luego más corta, luego alfabética
  const cmp = (a, b) => {
    const ca = corpus.has(a) ? 0 : 1, cb = corpus.has(b) ? 0 : 1;
    if (ca !== cb) return ca - cb;
    if (a.length !== b.length) return a.length - b.length;
    return a < b ? -1 : a > b ? 1 : 0;
  };

  fs.rmSync(SALIDA, { recursive: true, force: true });
  fs.mkdirSync(SALIDA, { recursive: true });

  const manifest = [];
  let totalRaw = 0;
  for (const [ason, m] of [...shards.entries()].sort()) {
    // c: rima consonante exacta -> palabras (cubo por clave).
    // a: fondo asonante del shard, ya rankeado (corpus primero), del que el
    //    cliente resta las consonantes y la propia palabra. Se ordena en build
    //    porque aquí sí se sabe qué palabras están en el corpus.
    const c = {};
    const todas = [];
    for (const [cons, list] of m) {
      list.sort(cmp);
      c[cons] = list.slice(0, CAP_POR_CONSONANTE);
      todas.push(...list);
    }
    todas.sort(cmp);
    const a = todas.slice(0, CAP_ASONANTE);
    const json = JSON.stringify({ c, a });
    fs.writeFileSync(path.join(SALIDA, ason + '.json'), json);
    totalRaw += json.length;
    manifest.push(ason);
  }
  fs.writeFileSync(
    path.join(SALIDA, 'manifest.json'),
    JSON.stringify({ shards: manifest, cap: CAP_POR_CONSONANTE }),
  );

  console.log('Banco de rimas generado en public/taller/rimas/');
  console.log('  lemas del diccionario :', lemas.length);
  console.log('  palabras indexadas    :', indexados);
  console.log('  del corpus (boost)    :', corpus.size);
  console.log('  shards (terminaciones):', manifest.length);
  console.log('  tamaño total (raw)    :', (totalRaw / 1024 | 0) + ' KB');
}

main();
