// Pruebas del detector de formas de El Taller. Sin dependencias: `npm run taller:test`.
//
// Cubre las formas laxas (silva/madrigal, lira multiestrofa, verso libre), sus
// NEGATIVOS —tan importantes como los positivos: el motor debe callar antes que
// nombrar mal— y una regresión de las formas fijas que ya funcionaban.
// Los textos son de dominio público; los largos se leen del propio corpus.
import { cargarMotor, detectarForma, leerCorpus } from './harness.mjs';

const TM = cargarMotor();
const corpus = leerCorpus();
const texto = (f) => {
  const p = corpus.find((x) => x.file === f);
  if (!p) throw new Error(`falta en el corpus: ${f} (¿se renombró o se despublicó?)`);
  return p.cuerpo;
};
const forma = (txt) => detectarForma(TM, txt).forma;
const estrofa = (versos) => TM.groupStanzas(versos.split('\n').map(TM.analyzeLine))[0];

let ok = 0;
let fallan = 0;
const t = (nombre, real, esperado) => {
  const bien = typeof esperado === 'function' ? esperado(real) : real === esperado;
  if (bien) {
    ok++;
    console.log(`  ✓ ${nombre}`);
  } else {
    fallan++;
    console.log(`  ✗ ${nombre}\n      esperado: ${esperado}\n      obtenido: ${real}`);
  }
};

console.log('\n— LIRA —');
t('liras de Fray Luis → N × lira', forma(texto('oda-a-la-vida-retirada.md')), (r) => /× lira$/.test(r));
t('liras trenzadas → N × lira', forma(texto('liras-trenzadas.md')), (r) => /× lira$/.test(r));
t('lira exacta 7-11-7-7-11 aBabB', TM.classifyStanza(estrofa(
  'En una noche oscura,\n' +
  'con ansias, en amores inflamada,\n' +
  '¡oh dichosa ventura!,\n' +
  'salí sin ser notada\n' +
  'estando ya mi casa sosegada.')), 'Lira');
// El esquema manda sobre el conteo: con aBabB se admite ±1 en una medida.
t('lira con una medida a ±1', TM.classifyStanza(estrofa(
  '¡Qué descansada vida\n' +
  'la del que huye del mundanal ruïdo\n' +
  'y sigue la escondida\n' +
  'senda por donde han ido\n' +
  'los pocos sabios que en el mundo han sido!')), 'Lira');
t('quintilla octosílaba NO es lira', TM.classifyStanza(estrofa(
  'Ya se acerca la mañana,\n' +
  'ya se despierta la aurora,\n' +
  'ya se asoma a la ventana,\n' +
  'ya la casa se desgrana,\n' +
  'ya no queda ni una hora.')), (r) => r !== 'Lira');

console.log('\n— SILVA / MADRIGAL —');
t('silva de Palma (14 v.)', forma(texto('la-poesia.md')), 'Silva');
t('silva de Olmedo (29 v.)', forma(texto('a-eliza.md')), 'Silva');
t('silva de Machado (30 v.)', forma(texto('a-un-olmo-seco.md')), 'Silva');
t('silva larga de Bello (373 v.)', forma(texto('la-agricultura-de-la-zona-tórrida.md')), 'Silva');
t('madrigal de Cetina (8 v.)', forma(texto('a-unos-ojos.md')), (r) => /^Madrigal/.test(r));

console.log('\n— SILVA: NEGATIVOS —');
// Mezclan 7 y 11 pero son estróficas y uniformes: cuartetas, no silvas.
t('rima LIII de Bécquer NO es silva', forma(texto('volveran-las-oscuras-golondrinas.md')), (r) => !/[Ss]ilva/.test(r));
t('romance en cuartetas NO es silva', forma(texto('explicando-una-tarde-anatomia.md')), (r) => !/[Ss]ilva/.test(r));
// Sin mezcla no hay silva: ni endecasílabos solos ni octosílabos.
t('endecasílabos solos NO son silva', forma(texto('epistola-de-jovino-a-sus-amigos-de-salamanca.md')), (r) => !/[Ss]ilva/.test(r));
t('octosílabos NO son silva', forma(texto('amor-de-madre-3.md')), (r) => !/[Ss]ilva/.test(r));

console.log('\n— VERSO LIBRE —');
t('sin metro ni rima (21 v.)', forma(texto('en-los-ojos-abiertos-de-los-muertos.md')), 'Verso libre');
t('sin metro ni rima (46 v.)', forma(texto('sin-dragones.md')), 'Verso libre');
// Con rima abundante el motor prefiere callar: suele ser una forma que no supo
// leer, no un poema sin rima.
t('con rima abundante NO se afirma verso libre', forma(texto('los-hijos-infinitos.md')), (r) => r !== 'Verso libre');

console.log('\n— REGRESIÓN —');
t('soneto de Góngora', forma(
  'Mientras por competir con tu cabello,\n' +
  'oro bruñido al sol relumbra en vano;\n' +
  'mientras con menosprecio en medio el llano\n' +
  'mira tu blanca frente el lilio bello;\n\n' +
  'mientras a cada labio, por cogello,\n' +
  'siguen más ojos que al clavel temprano;\n' +
  'y mientras triunfa con desdén lozano\n' +
  'del luciente cristal tu gentil cuello;\n\n' +
  'goza cuello, cabello, labio y frente,\n' +
  'antes que lo que fue en tu edad dorada\n' +
  'oro, lilio, clavel, cristal luciente,\n\n' +
  'no sólo en plata o vïola troncada\n' +
  'se vuelva, mas tú y ello juntamente\n' +
  'en tierra, en humo, en polvo, en sombra, en nada.'), 'Soneto');
t('redondilla de Sor Juana', forma(
  'Hombres necios que acusáis\n' +
  'a la mujer sin razón,\n' +
  'sin ver que sois la ocasión\n' +
  'de lo mismo que culpáis:'), 'Redondilla');
t('romance con asonancia', forma(
  'Que por mayo era, por mayo,\n' +
  'cuando hace la calor,\n' +
  'cuando los trigos encañan\n' +
  'y están los campos en flor,\n' +
  'cuando canta la calandria\n' +
  'y responde el ruiseñor.'), (r) => /^Romance|^Copla/.test(r));

console.log(`\n${ok} pasan, ${fallan} fallan\n`);
process.exit(fallan ? 1 : 0);
