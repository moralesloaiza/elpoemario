// Carga el motor REAL de El Taller (src/components/tallerMetrico.client.js) en
// Node con un DOM simulado y expone sus funciones internas.
//
// El motor es un IIFE pensado para el navegador: no exporta nada y toca el DOM
// al cargarse. Para medirlo sin duplicarlo, aquí se ejecuta su código tal cual
// dentro de un contexto `vm` con un DOM mínimo, inyectando una única línea que
// publica los internos en `globalThis.__TM__`. Así lo que se mide es el código
// que se publica, no una copia que puede quedar desfasada.
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import vm from 'node:vm';

const AQUI = path.dirname(url.fileURLToPath(import.meta.url));
export const RAIZ = path.resolve(AQUI, '../..');
const MOTOR = path.join(RAIZ, 'src/components/tallerMetrico.client.js');

// Elemento de pantalla: solo necesita tragar lo que el motor le pida.
function elemento(id) {
  return {
    id,
    value: '',
    textContent: '',
    innerHTML: '',
    classList: { toggle() {}, add() {}, remove() {}, contains: () => false },
    getAttribute: () => '',
    setAttribute() {},
    addEventListener() {},
    querySelectorAll: () => [],
  };
}

export function cargarMotor() {
  let codigo = fs.readFileSync(MOTOR, 'utf8');
  const EXPORTA =
    '\n  globalThis.__TM__ = { analyzeLine, detectForm, groupStanzas, fitToMeter, mode, ' +
    'classifyStanza, romanceKind, schemeOf, syllabify, formaToSlug, rhymeShare, nearPattern, ' +
    'hemistichSplit, rhymeKeys };\n';
  const i = codigo.lastIndexOf('  render();');
  if (i === -1) {
    throw new Error(
      'No encuentro el `render();` final de tallerMetrico.client.js. ' +
      'Si se reorganizó el cierre del IIFE, actualiza este punto de inyección.',
    );
  }
  codigo = codigo.slice(0, i) + EXPORTA + codigo.slice(i);

  const els = new Map();
  const document = {
    getElementById: (id) => {
      if (!els.has(id)) els.set(id, elemento(id));
      return els.get(id);
    },
    querySelector: () => ({ getAttribute: () => '' }),
    querySelectorAll: () => [],
    addEventListener() {},
  };
  const ctx = { document, window: { CSS: null }, globalThis: null, console };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(codigo, ctx);
  return ctx.__TM__;
}

// Réplica de la vista ajustada de render(): si el poema es regular, cada verso
// a ±1 del metro dominante se corrige con una licencia cuando existe candidato
// real. detectForm se alimenta de esa vista, no de las medidas crudas.
export function detectarForma(TM, texto) {
  const analizados = texto.split('\n').map(TM.analyzeLine);
  const activos = analizados.filter(Boolean);
  if (!activos.length) return { forma: '—', versos: 0 };

  // Alejandrino: cada verso busca su cesura 7 + 7; si al menos la mitad parten
  // limpios, la forma se detecta sobre una vista con la medida de hemistiquios
  // (14), igual que en render(). hemistichSplit puede faltar en motores viejos.
  activos.forEach((a) => { a.hemi = TM.hemistichSplit ? TM.hemistichSplit(a) : null; });
  const alejandrino =
    activos.length >= 2 &&
    activos.filter((a) => a.hemi && a.hemi.isAlej).length / activos.length >= 0.5;
  const medida = (a) => (alejandrino && a.hemi ? a.hemi.m1 + a.hemi.m2 : a.metric);

  const metroDom = alejandrino ? 14 : TM.mode(activos.map((a) => a.metric));
  const regular = activos.filter((a) => medida(a) === metroDom).length / activos.length >= 0.5;
  const ajustados = analizados.map((a) => {
    if (!a) return null;
    if (alejandrino && a.hemi) return { ...a, metric: a.hemi.m1 + a.hemi.m2 };
    return { ...a, metric: (regular ? TM.fitToMeter(a, metroDom) : { metric: a.metric }).metric };
  });
  return {
    forma: TM.detectForm(ajustados.filter(Boolean), TM.groupStanzas(ajustados)),
    versos: activos.length,
    metroDom,
    regular,
    alejandrino,
  };
}

// Nombre mostrado -> slug del catálogo. Misma normalización que el formaToSlug
// del motor, pero sin filtrar por las fichas existentes: aquí interesa comparar
// contra la etiqueta del poema, exista ficha o no.
export function formaSlug(display) {
  if (!display || display === '—') return null;
  let s = display.toLowerCase();
  const mult = s.match(/^\d+\s*×\s*(.+)$/);
  if (mult) s = mult[1];
  s = s.split('(')[0].split('·')[0].split('/')[0];
  s = s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().replace(/\s+/g, '-');
  if (!s || s.includes('forma-libre')) return null;
  return s;
}

// Lee los poemas publicados. Ojo con dos trampas reales del corpus: algunos
// .md llevan BOM UTF-8 y otros vienen con finales de línea CRLF.
export function leerCorpus() {
  const dir = path.join(RAIZ, 'src/content/poemas');
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      let raw = fs.readFileSync(path.join(dir, f), 'utf8');
      if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
      raw = raw.replace(/\r\n/g, '\n');
      const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      if (!m) return null;
      const fm = m[1];
      const tipo = (fm.match(/^tipo:\s*(.+)$/m) || [])[1]?.trim();
      const titulo = (fm.match(/^titulo:\s*(.+)$/m) || [])[1]?.trim();
      const borrador = /^borrador:\s*true/m.test(fm);
      const cuerpo = m[2].split('\n').map((l) => l.trimEnd()).join('\n').trim();
      return { file: f, tipo, titulo, borrador, cuerpo };
    })
    .filter((p) => p && p.tipo && !p.borrador);
}

// Géneros temáticos (oda, elegía, balada…) y cajones de sastre: el motor no los
// afirma porque no son deducibles de la métrica. Quedan fuera de la medición.
export const FUERA_DE_ALCANCE = new Set([
  'oda', 'elegia', 'balada', 'glosa', 'himno', 'letrilla', 'villancico',
  'prosa-poetica', 'polimetrico', 'egloga',
]);
