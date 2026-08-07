// Motor de escansión de El Taller. Generado a partir del prototipo validado.
// Vanilla JS, sin dependencias; opera sobre el DOM del componente TallerMetrico.astro.
(function () {
  "use strict";

  /* ============================================================
     MOTOR DE ESCANSIÓN — español, 100% reglas, sin diccionario
     ============================================================ */

  const OPEN = "aeoáéóàèò";
  const CLOSED = "iuü";
  const CLOSED_ACC = "íúï";       // ï = diéresis: fuerza hiato (vïola, ruïdo)
  const ACCENTED = "áéíóúàèìòù";  // acento tónico (la ï NO cuenta como tónica)
  const VOWELS = OPEN + CLOSED + CLOSED_ACC + "ìù";

  const isV = c => VOWELS.indexOf(c) !== -1;
  const isOpen = c => OPEN.indexOf(c) !== -1;
  const isClosedAcc = c => CLOSED_ACC.indexOf(c) !== -1;
  const isAcc = c => ACCENTED.indexOf(c) !== -1;

  const stripAcc = c => ({ "á":"a","é":"e","í":"i","ó":"o","ú":"u","à":"a","è":"e","ì":"i","ò":"o","ù":"u","ü":"u","ï":"i" }[c] || c);

  const ONSET_CLUSTER = new Set([
    "pr","br","tr","dr","cr","gr","fr","kr",
    "pl","bl","cl","gl","fl","kl","tl"
  ]);

  // 'y' actúa como vocal si NO va seguida de vocal (rey, muy) o es sola.
  function normalizeY(word) {
    // devuelve string donde 'y'-vocal se marca como 'i' para el silabeo interno
    let out = "";
    for (let i = 0; i < word.length; i++) {
      const c = word[i];
      if (c === "y" || c === "Y") {
        const next = word[i + 1];
        if (!next || !isV(next.toLowerCase())) out += "i"; // vocal
        else out += "y"; // consonante
      } else out += c;
    }
    return out;
  }

  // Silabeo de UNA palabra (solo letras). Devuelve array de sílabas (índices).
  function syllabify(rawWord) {
    const word = normalizeY(rawWord.toLowerCase());
    const n = word.length;
    if (!n) return [rawWord];

    // 1. tokenizar en unidades (dígrafos ch/ll/rr = 1 consonante)
    const units = []; // {t:'V'|'C', s:startIdx, e:endIdx}
    for (let i = 0; i < n; i++) {
      const two = word.substr(i, 2);
      if (two === "ch" || two === "ll" || two === "rr") {
        units.push({ t: "C", s: i, e: i + 2 }); i++;
      } else {
        units.push({ t: isV(word[i]) ? "V" : "C", s: i, e: i + 1 });
      }
    }

    // 2. agrupar vocales en núcleos (diptongo/hiato) por regla par a par
    // marca en cada unidad V a qué núcleo pertenece
    const nuclei = []; // array de arrays de unit-index
    for (let u = 0; u < units.length; u++) {
      if (units[u].t !== "V") continue;
      const prev = nuclei.length ? nuclei[nuclei.length - 1] : null;
      if (prev && prev[prev.length - 1] === u - 1 && units[u - 1].t === "V") {
        const a = word[units[u - 1].s], b = word[units[u].s];
        const hiato = isClosedAcc(a) || isClosedAcc(b) || (isOpen(a) && isOpen(b));
        if (hiato) nuclei.push([u]); else prev.push(u);
      } else {
        nuclei.push([u]);
      }
    }

    if (nuclei.length <= 1) return [rawWord]; // monosílabo (o sin vocales)

    // 3. construir fronteras de sílaba distribuyendo consonantes entre núcleos
    const bounds = []; // índice de unidad donde empieza cada sílaba
    bounds.push(0);
    for (let k = 0; k < nuclei.length - 1; k++) {
      const endNuc = nuclei[k][nuclei[k].length - 1];
      const startNext = nuclei[k + 1][0];
      const cons = [];
      for (let u = endNuc + 1; u < startNext; u++) cons.push(u);
      const m = cons.length;
      let splitAt; // primera unidad de la sílaba siguiente
      if (m === 0) splitAt = startNext;
      else if (m === 1) splitAt = cons[0];
      else {
        const c1 = word.substr(units[cons[m - 2]].s, 1);
        const c2 = word.substr(units[cons[m - 1]].s, 1);
        const lastTwoCluster = ONSET_CLUSTER.has(c1 + c2);
        if (m === 2) splitAt = lastTwoCluster ? cons[0] : cons[1];
        else splitAt = lastTwoCluster ? cons[m - 2] : cons[m - 1];
      }
      bounds.push(splitAt);
    }

    // 4. materializar sílabas desde el rawWord (mismas posiciones)
    const sylls = [];
    for (let b = 0; b < bounds.length; b++) {
      const startUnit = bounds[b];
      const endUnit = (b + 1 < bounds.length) ? bounds[b + 1] : units.length;
      const startChar = units[startUnit].s;
      const endChar = (endUnit < units.length) ? units[endUnit].s : n;
      sylls.push(rawWord.substring(startChar, endChar));
    }
    return sylls;
  }

  // índice de sílaba tónica
  function tonicIndex(sylls) {
    for (let i = 0; i < sylls.length; i++) {
      for (const ch of sylls[i].toLowerCase()) if (isAcc(ch)) return i;
    }
    const nS = sylls.length;
    if (nS <= 1) return 0;
    const w = sylls.join("").toLowerCase();
    const last = w[w.length - 1];
    const llana = "aeiouáéíóú".indexOf(last) !== -1 || last === "n" || last === "s";
    return llana ? nS - 2 : nS - 1;
  }

  // ajuste por acento final para el conteo métrico
  function finalStressAdj(sylls) {
    const posFromEnd = (sylls.length - 1) - tonicIndex(sylls);
    return 1 - posFromEnd; // aguda +1, llana 0, esdrújula −1
  }

  const endsVowel = w => {
    const c = w[w.length - 1]?.toLowerCase();
    if (!c) return false;
    if (isV(c)) return true;
    // La «y» final vale como vocal (semivocal /i/) para la sinalefa en dos casos:
    // la conjunción «y» sola (y‿a, y‿en, y‿hasta) y la «y» tras vocal en diptongo
    // decreciente (hay, muy, rey, hoy, buey). NO cuando es inicial de palabra (ya,
    // yo, yedra), que es consonante /ʝ/ y no se detecta aquí porque endsVowel mira
    // la última letra, no la primera.
    if (c === "y" && (w.length === 1 || isV(w[w.length - 2].toLowerCase()))) return true;
    return false;
  };
  const startsVowel = w => {
    const lw = w.toLowerCase();
    if (isV(lw[0])) return true;
    if (lw[0] === "h" && lw.length > 1 && isV(lw[1])) return true;
    if (lw === "y") return true;
    return false;
  };

  // vocal nuclear de una sílaba (tónica del diptongo / abierta / débil)
  function nucleusVowel(syll) {
    const s = syll.toLowerCase();
    for (const ch of s) if (isAcc(ch)) return stripAcc(ch);
    for (const ch of s) if ("aeo".indexOf(ch) !== -1) return ch;
    let last = "";
    for (const ch of s) { if ("iuüï".indexOf(ch) !== -1) last = stripAcc(ch); else if (ch === "y") last = "i"; }
    return last;
  }
  // posición de la vocal nuclear dentro de la sílaba
  function nucleusPos(syll) {
    const s = syll.toLowerCase();
    for (let i = 0; i < s.length; i++) if (isAcc(s[i])) return i;
    for (let i = 0; i < s.length; i++) if ("aeo".indexOf(s[i]) !== -1) return i;
    let last = -1;
    for (let i = 0; i < s.length; i++) if ("iuüï".indexOf(s[i]) !== -1 || s[i] === "y") last = i;
    return last >= 0 ? last : 0;
  }

  // clave de rima (consonante y asonante). Empieza en la vocal NUCLEAR de la tónica.
  function rhymeKeys(word) {
    const sylls = syllabify(word);
    const t = tonicIndex(sylls);
    const tonicSyll = sylls[t].toLowerCase();
    const tailStr = tonicSyll.slice(nucleusPos(tonicSyll)) + sylls.slice(t + 1).join("").toLowerCase();

    // consonante: todos los sonidos desde la vocal tónica, normalizados
    let out = "";
    for (let i = 0; i < tailStr.length; i++) {
      let c = tailStr[i];
      const nx = tailStr[i + 1] || "";
      if (c === "h") continue;
      else if (c === "v") c = "b";
      else if (c === "z") c = "s";
      else if (c === "c") c = ("eiéí".indexOf(nx) !== -1) ? "s" : "k";
      else if (c === "q") c = "k";
      else if (c === "u" && (tailStr[i - 1] === "q" || tailStr[i - 1] === "g") && "eiéí".indexOf(nx) !== -1) continue; // u muda
      else if (c === "g") c = ("eiéí".indexOf(nx) !== -1) ? "j" : "g";
      else if (c === "l" && nx === "l") { c = "y"; i++; }
      else if (c === "y") c = (i === tailStr.length - 1 || !isV(nx)) ? "i" : "y";
      else c = stripAcc(c);
      out += c;
    }

    // asonante: vocal tónica + vocal final (esdrújulas saltan la central)
    const ason = (t === sylls.length - 1)
      ? nucleusVowel(sylls[t])
      : nucleusVowel(sylls[t]) + nucleusVowel(sylls[sylls.length - 1]);
    return { cons: out, ason };
  }

  const VERSE_NAMES = {
    1:"monosílabo",2:"bisílabo",3:"trisílabo",4:"tetrasílabo",5:"pentasílabo",
    6:"hexasílabo",7:"heptasílabo",8:"octosílabo",9:"eneasílabo",10:"decasílabo",
    11:"endecasílabo",12:"dodecasílabo",13:"tridecasílabo",14:"alejandrino"
  };
  const verseName = m => VERSE_NAMES[m] || (m + " sílabas");

  // candidato a SINÉRESIS: hiato interno (dos vocales en sílabas contiguas de una palabra)
  function wordHasHiato(sylls) {
    for (let i = 0; i < sylls.length - 1; i++) {
      const a = sylls[i].toLowerCase(), b = sylls[i + 1].toLowerCase();
      if (isV(a[a.length - 1]) && isV(b[0])) return true;
    }
    return false;
  }
  // candidato a DIÉRESIS: diptongo (dos vocales juntas dentro de una sílaba)
  function wordHasDiphthong(sylls) {
    for (const s of sylls) { const ls = s.toLowerCase(); for (let i = 0; i < ls.length - 1; i++) if (isV(ls[i]) && isV(ls[i + 1])) return true; }
    return false;
  }
  // ajuste al metro dominante con una licencia, SOLO si existe candidato real
  function fitToMeter(line, target) {
    const d = target - line.metric;
    if (d === 0) return { metric: line.metric, license: null };
    if (d === 1) {
      if (line.sinCount > 0) return { metric: target, license: "dialefa" };
      if (line.hasDiphthong) return { metric: target, license: "diéresis" };
    } else if (d === -1) {
      if (line.hasHiato) return { metric: target, license: "sinéresis" };
    }
    return { metric: line.metric, license: null };
  }

  // Parte un verso en dos hemistiquios buscando la cesura del alejandrino: la
  // frontera de palabra que deja 7 sílabas en cada mitad. Aplica las dos reglas
  // de la cesura: (1) la sinalefa NO la cruza —hiato obligado en la pausa, por
  // eso no se descuenta la sinalefa que caería justo en el corte— y (2) cada
  // hemistiquio cuenta su propio acento final, así que un primer hemistiquio
  // agudo suma +1 igual que un verso agudo. Devuelve el mejor corte (k = índice
  // de la última palabra del primer hemistiquio) con sus medidas m1/m2, o null
  // si el verso tiene menos de dos palabras.
  function hemistichSplit(a) {
    const W = a.words;
    if (W.length < 2) return null;
    let best = null;
    for (let k = 0; k < W.length - 1; k++) {
      let nat1 = 0; for (let i = 0; i <= k; i++) nat1 += W[i].sylls.length;
      let sin1 = 0; for (let i = 0; i < k; i++) if (a.sinalefa[i]) sin1++;
      const m1 = nat1 - sin1 + finalStressAdj(W[k].sylls);

      let nat2 = 0; for (let i = k + 1; i < W.length; i++) nat2 += W[i].sylls.length;
      let sin2 = 0; for (let i = k + 1; i < W.length - 1; i++) if (a.sinalefa[i]) sin2++;
      const m2 = nat2 - sin2 + finalStressAdj(W[W.length - 1].sylls);

      // coste = distancia a 7 + 7; desempata el 1.er hemistiquio exacto y luego
      // el corte más centrado.
      const cost = Math.abs(m1 - 7) + Math.abs(m2 - 7);
      const skew = Math.abs(m1 - 7);
      const mid = Math.abs((k + 1) - W.length / 2);
      if (!best || cost < best.cost ||
          (cost === best.cost && skew < best.skew) ||
          (cost === best.cost && skew === best.skew && mid < best.mid)) {
        best = { k, m1, m2, cost, skew, mid };
      }
    }
    return { k: best.k, m1: best.m1, m2: best.m2, isAlej: best.m1 === 7 && best.m2 === 7 };
  }

  const WORD_RE = /[A-Za-zÁÉÍÓÚÜÏÑáéíóúüïñÀÈÌÒÙàèìòù'’]+/g;

  // analiza una línea (verso). devuelve estructura o null si vacía
  function analyzeLine(raw0) {
    const raw = raw0.normalize("NFC");
    const matches = [...raw.matchAll(WORD_RE)];
    if (!matches.length) return null;
    const words = matches.map(m => ({ text: m[0], start: m.index, end: m.index + m[0].length }));

    let natural = 0;
    words.forEach(w => { w.sylls = syllabify(w.text); natural += w.sylls.length; });

    // sinalefas entre palabras adyacentes
    const sinalefa = new Array(words.length - 1).fill(false);
    let sinCount = 0;
    for (let k = 0; k < words.length - 1; k++) {
      if (endsVowel(words[k].text) && startsVowel(words[k + 1].text)) {
        sinalefa[k] = true; sinCount++;
      }
    }

    const last = words[words.length - 1];
    const adj = finalStressAdj(last.sylls);
    const metric = natural - sinCount + adj;
    const hasHiato = words.some(w => wordHasHiato(w.sylls));
    const hasDiphthong = words.some(w => wordHasDiphthong(w.sylls));

    return { raw, words, sinalefa, metric, natural, sinCount, adj, hasHiato, hasDiphthong, keys: rhymeKeys(last.text) };
  }

  /* ============================================================
     RENDER
     ============================================================ */

  const editor = document.getElementById("editor");
  const output = document.getElementById("output");
  const guia = document.getElementById("tm-guia");
  const syllBtn = document.getElementById("syllBtn");
  const legendCesura = document.getElementById("tm-leyenda-cesura");
  const rimasBtn = document.getElementById("rimasBtn");
  const rimasPanel = document.getElementById("rimasPanel");
  const rimasTarget = document.getElementById("rimasTarget");
  const rimasCons = document.getElementById("rimasCons");
  const rimasAson = document.getElementById("rimasAson");
  let showSyll = false;

  // Slugs de forma con ficha en /tipos/<slug>/ (inyectados por el componente).
  const rootEl = document.querySelector(".taller-metrico");
  const VALID_TIPOS = new Set(((rootEl && rootEl.getAttribute("data-tipos")) || "").split(",").filter(Boolean));

  // Nombre de forma detectada -> slug de /tipos/. Devuelve null si no hay ficha
  // (forma libre, o forma sin poemas publicados de ese tipo).
  function formaToSlug(display) {
    if (!display || display === "—") return null;
    let s = display.toLowerCase();
    const mult = s.match(/^\d+\s*×\s*(.+)$/); if (mult) s = mult[1];   // "3 × redondilla" -> redondilla
    s = s.split("(")[0].split("·")[0].split("/")[0];                    // quita "(asonante…)", "· forma libre", "/ silva breve"
    s = s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().replace(/\s+/g, "-");
    if (!s || s.indexOf("forma-libre") !== -1) return null;
    return VALID_TIPOS.has(s) ? s : null;
  }

  function esc(s) { return s.replace(/[&<>]/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;" }[m])); }

  // Las notas de verso se escriben con *énfasis* y se convierten a <b> solo en
  // pantalla; el informe exportado conserva el texto pelado.
  const destacar = s => s.replace(/\*([^*]+)\*/g, "<b>$1</b>");

  // Nota de licencia de un verso que no cuadra con el metro dominante.
  // `ui` es lo que se pinta; `txt` es la variante para el informe en texto, que
  // evita hablar de clics porque en un archivo no significan nada.
  function notaVerso(a, dispM, domMeter, broken) {
    if (domMeter == null) return null;
    if (dispM === domMeter) {
      if (!broken) return null;
      const t = "✓ " + domMeter + " aplicando dialefa";
      return { ok: true, ui: t, txt: t };
    }
    const diff = dispM - domMeter;
    let ui, txt;
    if (diff === 1 && a.hasHiato) ui = txt = "funde un hiato (*sinéresis*) para " + domMeter;
    else if (diff === -1 && a.sinCount > broken) {
      ui = "corta una sinalefa (clic en *‿*) para " + domMeter;
      txt = "corta una sinalefa (*dialefa*) para " + domMeter;
    }
    else if (diff === -1 && a.hasDiphthong) ui = txt = "abre un diptongo (*diéresis*) para " + domMeter;
    else ui = txt = "se aparta del metro (" + domMeter + ")";
    const cab = "△ mide *" + dispM + "* — ";
    return { ok: false, ui: cab + ui, txt: cab + txt };
  }

  // Nota de un verso en un poema de alejandrinos: comprueba el 7 + 7. Calla
  // cuando ambos hemistiquios miden 7 (verso correcto); si no, dice cuánto mide
  // cada mitad para que el poeta sepa dónde ajustar la cesura.
  function notaHemistiquio(m1, m2) {
    if (m1 === 7 && m2 === 7) return null;
    const t = "△ hemistiquios *" + m1 + "* + *" + m2 + "* — el alejandrino pide 7 + 7";
    return { ok: false, ui: t, txt: t };
  }

  // ---- estado de licencias manuales (dialefa: sinalefas que el usuario corta) ----
  const manualBreaks = new Set();
  let lastAnalyzed = [];
  const lineKey = a => a.raw.trim();
  function brokenCount(a) {
    let n = 0;
    for (let i = 0; i < a.sinalefa.length; i++) if (a.sinalefa[i] && manualBreaks.has(lineKey(a) + "|" + i)) n++;
    return n;
  }
  const groupStanzas = arr => {
    const st = []; let c = [];
    arr.forEach(a => { if (a) c.push(a); else if (c.length) { st.push(c); c = []; } });
    if (c.length) st.push(c);
    return st;
  };

  function buildVerseHTML(a, li, caesuraK) {
    let html = "";
    for (let i = 0; i < a.words.length; i++) {
      html += esc(a.words[i].text);
      if (i < a.words.length - 1) {
        const gap = a.raw.substring(a.words[i].end, a.words[i + 1].start);
        if (caesuraK != null && i === caesuraK) {
          // La cesura impone hiato: rompe cualquier sinalefa en la pausa. Se
          // pinta ‖ (conservando la puntuación del original) y no admite clic.
          html += esc(gap.replace(/\s+$/, "")) +
            ' <span class="caesura" title="Cesura del alejandrino — la sinalefa no la cruza (hiato)">‖</span> ';
        } else if (a.sinalefa[i]) {
          const broken = manualBreaks.has(lineKey(a) + "|" + i);
          html += esc(gap.replace(/\s/, "")) +
            '<button class="tie' + (broken ? ' broken' : '') + '" data-id="' + li + '_' + i + '" type="button" ' +
            'title="' + (broken ? 'Sinalefa cortada (dialefa) — clic para unir' : 'Sinalefa — clic para cortarla (dialefa, +1 sílaba)') + '">' +
            (broken ? '|' : '‿') + '</button>';
        } else {
          html += esc(gap);
        }
      }
    }
    return html;
  }

  function render() {
    const text = editor.value;
    const rawLines = text.split("\n");

    // primera pasada: analizar
    const analyzed = rawLines.map(analyzeLine);
    lastAnalyzed = analyzed;
    const active = analyzed.filter(Boolean);

    // ---- hemistiquios: ¿poema en alejandrinos (7 + 7)? ----
    // Cada verso busca su cesura; el poema es alejandrino si al menos la mitad
    // de los versos parten limpios en dos hemistiquios de 7. La detección es
    // independiente del metro de bloque, así que reconoce alejandrinos aunque el
    // primer hemistiquio agudo haga que el verso «entero» mida 13.
    active.forEach(a => { a.hemi = hemistichSplit(a); });
    const alejandrino = active.length >= 2 &&
      active.filter(a => a.hemi && a.hemi.isAlej).length / active.length >= 0.5;
    if (legendCesura) legendCesura.hidden = !alejandrino;

    // medida efectiva del verso: en alejandrinos, la suma de los dos
    // hemistiquios (que ya cuenta la cesura); en el resto, la medida de bloque.
    const lineMetric = a => (alejandrino && a.hemi) ? a.hemi.m1 + a.hemi.m2 : a.metric;

    // metro dominante (moda) sobre el conteo natural; en alejandrinos, 14 fijo.
    const domMeter = active.length ? (alejandrino ? 14 : mode(active.map(a => a.metric))) : null;
    const best = domMeter != null ? active.filter(a => lineMetric(a) === domMeter).length : 0;
    const regular = active.length ? best / active.length >= 0.5 : false;

    // esquema de rima: elegir consonante vs asonante por nº de coincidencias
    function lettering(kind) {
      const seen = {}; const counts = {};
      active.forEach(a => { const k = a.keys[kind]; counts[k] = (counts[k] || 0) + 1; });
      let matched = 0; const letters = []; let next = 0;
      const order = {};
      active.forEach(a => {
        const k = a.keys[kind];
        if (counts[k] >= 2) {
          if (!(k in order)) order[k] = next++;
          const base = order[k];
          const letter = String.fromCharCode(65 + (base % 26));
          letters.push({ letter, mayor: a.metric >= 9, key: k });
          matched++;
        } else {
          letters.push({ letter: "–", mayor: a.metric >= 9, key: null });
        }
      });
      return { letters, matched };
    }
    const consL = lettering("cons");
    const asonL = lettering("ason");
    const chosen = asonL.matched > consL.matched ? asonL : consL;
    const rhymeType = (asonL.matched > consL.matched) ? "asonante" : "consonante";

    // mapear letras a las líneas activas
    let ai = 0;
    const lineLetters = analyzed.map(a => a ? chosen.letters[ai++] : null);

    // ---- summary ----
    // Sin versos, los chips muestran una invitación en itálica (is-empty) en vez
    // de un «—» que se confunde con un campo roto o una carga fallida.
    const vacio = !active.length;
    setChip("s-lines", vacio ? "0" : String(active.length), vacio);
    document.getElementById("s-lines-sub").textContent = active.length ? "analizados" : " ";

    if (domMeter != null) {
      setChip("s-meter", cap(verseName(domMeter)), false);
      const pct = Math.round((best / active.length) * 100);
      const clase = domMeter <= 8 ? "arte menor" : "arte mayor";
      document.getElementById("s-meter-sub").textContent =
        clase + (alejandrino ? " · cesura 7 + 7" : "") + " · " + pct + "% de los versos";
    } else { setChip("s-meter", vacio ? "por medir" : "—", vacio); document.getElementById("s-meter-sub").textContent = " "; }

    const schemeStr = chosen.letters.map(l => l.mayor ? l.letter : l.letter.toLowerCase()).join("");
    setChip("s-scheme", schemeStr || (vacio ? "por medir" : "—"), vacio && !schemeStr);
    document.getElementById("s-scheme-sub").textContent =
      chosen.matched ? ("rima " + rhymeType) : (active.length ? "sin rima detectada" : " ");

    // Sin poema no hay silabas que ver ni rimas que buscar: se atenuan.
    syllBtn.disabled = vacio;
    rimasBtn.disabled = vacio;

    // ---- forma: se detecta sobre una vista AJUSTADA por licencias (si el poema es regular) ----
    const adjView = analyzed.map(a => {
      if (!a) return null;
      if (alejandrino && a.hemi) return Object.assign({}, a, { metric: a.hemi.m1 + a.hemi.m2 });
      const fit = regular ? fitToMeter(a, domMeter) : { metric: a.metric, license: null };
      return Object.assign({}, a, { metric: fit.metric });
    });
    const forma = active.length ? detectForm(adjView.filter(Boolean), groupStanzas(adjView)) : "—";
    const formaSlug = formaToSlug(forma);
    const sForm = document.getElementById("s-form");
    if (formaSlug) { sForm.innerHTML = '<a class="tm-forma-link" href="/tipos/' + formaSlug + '/">' + esc(forma) + '</a>'; sForm.classList.remove("is-empty"); }
    else { sForm.textContent = vacio ? "por estimar" : forma; sForm.classList.toggle("is-empty", vacio); }

    // ---- manuscript ----
    if (!active.length) {
      output.innerHTML = '<div class="empty-note">Escribe algo a la izquierda y el análisis aparecerá aquí, verso a verso.</div>';
      informe = null;
      sincronizarCompartir();
      return;
    }

    // Se acumula en paralelo al HTML para que «descargar» y «enviar» exporten
    // exactamente lo que el lector tiene delante, dialefas incluidas.
    const filas = [];

    let html = "";
    analyzed.forEach((a, idx) => {
      if (!a) {
        if (idx > 0 && analyzed[idx - 1]) { html += '<div class="stanza-gap"></div>'; filas.push(null); }
        return;
      }
      const broken = brokenCount(a);
      let dispM, nota, caesuraK = null, caesuraFits = false;
      if (alejandrino && a.hemi) {
        // reparte las dialefas manuales entre los dos hemistiquios para que el
        // aviso 7 + 7 cuadre con la cifra total del margen.
        let b1 = 0;
        for (let i = 0; i < a.hemi.k; i++)
          if (a.sinalefa[i] && manualBreaks.has(lineKey(a) + "|" + i)) b1++;
        const m1 = a.hemi.m1 + b1, m2 = a.hemi.m2 + (broken - b1);
        dispM = m1 + m2;
        caesuraK = a.hemi.k;
        caesuraFits = !!a.sinalefa[a.hemi.k];   // la cesura rescató una sinalefa
        nota = notaHemistiquio(m1, m2);
      } else {
        dispM = a.metric + broken;              // dialefas del usuario suman +1 cada una
        nota = notaVerso(a, dispM, domMeter, broken);
      }
      const off = domMeter != null && dispM !== domMeter;
      const fitted = !off && (alejandrino ? caesuraFits : broken > 0);
      const ll = lineLetters[idx];
      const letra = ll && ll.letter !== "–" ? (ll.mayor ? ll.letter : ll.letter.toLowerCase()) : "·";
      const letterHTML = ll && ll.letter !== "–"
        ? '<div class="rhyme-letter set" data-key="' + ll.key + '">' + letra + '</div>'
        : '<div class="rhyme-letter">·</div>';

      const flag = nota
        ? '<span class="flag' + (nota.ok ? " ok" : "") + '">' + destacar(esc(nota.ui)) + '</span>'
        : "";
      filas.push({ texto: a.raw.trim(), medida: dispM, letra, nota: nota ? nota.txt.replace(/\*/g, "") : "" });

      let syllLine = "";
      if (showSyll) {
        const parts = a.words.map(w => w.sylls.join("·"));
        let joined = "";
        for (let i = 0; i < parts.length; i++) {
          joined += parts[i];
          if (i < parts.length - 1) {
            if (caesuraK != null && i === caesuraK) joined += " ‖ ";
            else joined += (a.sinalefa[i] && !manualBreaks.has(lineKey(a) + "|" + i)) ? "‿" : " ";
          }
        }
        syllLine = '<span class="syllas">' + esc(joined) + '</span>';
      }

      html += '<div class="verse-row ' + (off ? "off" : "") + (fitted ? " fitted" : "") + '" data-key="' + (ll && ll.key ? ll.key : "") + '">' +
                '<div class="gutter">' + dispM + '</div>' +
                '<div class="verse-text">' + buildVerseHTML(a, idx, caesuraK) + flag + syllLine + '</div>' +
                letterHTML +
              '</div>';
    });
    output.innerHTML = html;

    // El resumen ya está escrito en el DOM: se relee de ahí en vez de rehacerlo.
    const sub = id => document.getElementById(id).textContent.trim();
    informe = {
      metro: sub("s-meter"), metroSub: sub("s-meter-sub"),
      esquema: sub("s-scheme"), esquemaSub: sub("s-scheme-sub"),
      versos: active.length, forma: sub("s-form"),
      filas,
    };
    sincronizarCompartir();

    // clic en una ligadura ‿ → cortar/unir esa sinalefa (dialefa)
    output.querySelectorAll(".tie").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const [li, b] = btn.getAttribute("data-id").split("_").map(Number);
        const a = lastAnalyzed[li]; if (!a) return;
        const k = lineKey(a) + "|" + b;
        if (manualBreaks.has(k)) manualBreaks.delete(k); else manualBreaks.add(k);
        render();
      });
    });

    // resaltar versos que riman al pasar el ratón
    output.querySelectorAll(".verse-row[data-key]").forEach(row => {
      const key = row.getAttribute("data-key");
      if (!key) return;
      row.addEventListener("mouseenter", () => {
        output.querySelectorAll('.verse-row[data-key="' + cssEsc(key) + '"]').forEach(r => r.classList.add("rhyme-hi"));
      });
      row.addEventListener("mouseleave", () => {
        output.querySelectorAll(".verse-row").forEach(r => r.classList.remove("rhyme-hi"));
      });
    });
  }

  /* ============================================================
     DETECTOR DE FORMAS — empareja contra el catálogo de El Poemario
     ============================================================ */
  function mode(arr) { const f = {}; let b = -1, r = arr[0]; for (const x of arr) { f[x] = (f[x] || 0) + 1; if (f[x] > b) { b = f[x]; r = x; } } return r; }
  function eqArr(a, b) { return a.length === b.length && a.every((x, i) => x === b[i]); }
  function schemeOf(lines, kind) { const o = {}; let n = 0, s = ""; for (const a of lines) { const k = a.keys[kind]; if (!(k in o)) o[k] = n++; s += String.fromCharCode(97 + (o[k] % 26)); } return s; }
  const asonLabel = a => a.keys.ason.split("").join("-");
  // ¿las medidas siguen un patrón admitiendo ruido? `tol` = desvío máximo por
  // posición, `maxOff` = cuántas posiciones pueden desviarse. Sirve para formas
  // cuyo rasgo definitorio es el esquema de rima, no el conteo exacto.
  function nearPattern(m, pat, tol, maxOff) {
    if (m.length !== pat.length) return false;
    let off = 0;
    for (let i = 0; i < m.length; i++) {
      const d = Math.abs(m[i] - pat[i]);
      if (d > tol) return false;
      if (d > 0) off++;
    }
    return off <= maxOff;
  }
  // proporción de versos cuya rima consonante se repite en el poema
  function rhymeShare(L) {
    const c = {};
    L.forEach(a => { c[a.keys.cons] = (c[a.keys.cons] || 0) + 1; });
    return L.filter(a => c[a.keys.cons] >= 2).length / L.length;
  }

  // clasifica UNA estrofa por (nº de versos, medidas, esquema consonante)
  function classifyStanza(L) {
    const n = L.length;
    const m = L.map(a => a.metric);
    const dom = mode(m);
    const frac = x => L.filter(a => a.metric === x).length / n;
    const cons = schemeOf(L, "cons");
    const mayor = dom >= 9;
    if (n === 2 && /^(.)\1$/.test(cons)) return "Pareado";
    if (n === 3) { if (eqArr(m, [5, 7, 5])) return "Haiku"; if (frac(11) >= 0.7) return "Terceto"; }
    if (n === 4) {
      if (eqArr(m, [7, 5, 7, 5])) return "Seguidilla";
      const regular = frac(dom) >= 0.6;
      if (regular && mayor) { if (cons === "abba") return "Cuarteto"; if (cons === "abab") return "Serventesio"; }
      if (regular && !mayor) { if (cons === "abba") return "Redondilla"; if (cons === "abab") return "Cuarteta"; }
    }
    if (n === 5) {
      if (eqArr(m, [7, 11, 7, 7, 11]) && cons === "ababb") return "Lira";
      if (eqArr(m, [5, 7, 5, 7, 7])) return "Tanka";
      // Lira laxa: el rasgo definitorio es el esquema aBabB, no el conteo. Con
      // el esquema exacto se admite ±1 en UNA medida (ruido de conteo o licencia
      // del poeta). Sin esa tolerancia, una estrofa suelta tumbaba el poema
      // entero: en las liras de Fray Luis solo 10 de 17 estrofas casaban.
      if (cons === "ababb" && nearPattern(m, [7, 11, 7, 7, 11], 1, 1)) return "Lira";
      if (frac(11) >= 0.75) return "Quinteto";
      if (frac(8) >= 0.75) return "Quintilla";
    }
    if (n === 6) return mayor ? "Sexteto" : "Sextilla";
    if (n === 8 && frac(11) >= 0.75 && cons === "abababcc") return "Octava real";
    if (n === 10 && frac(8) >= 0.75 && cons === "abbaaccddc") return "Décima";
    return null;
  }

  // familia del romance: asonancia en los pares, impares sueltos
  function romanceKind(active, frac) {
    if (active.length < 4) return null;
    const pares = active.filter((_, i) => i % 2 === 1);
    const impares = active.filter((_, i) => i % 2 === 0);
    if (pares.length < 2) return null;
    if (new Set(pares.map(a => a.keys.ason)).size !== 1) return null;
    if (impares.length > 1 && new Set(impares.map(a => a.keys.cons)).size === 1) return null;
    const lab = asonLabel(pares[0]);
    if (active.length === 4 && frac(8) >= 0.7) return "Copla (asonante " + lab + ")";
    if (frac(8) >= 0.7) return "Romance (asonante " + lab + ")";
    if (frac(11) >= 0.7) return "Romance heroico (asonante " + lab + ")";
    if (frac(7) >= 0.7) return "Endecha (asonante " + lab + ")";
    if (frac(6) >= 0.7 || frac(5) >= 0.7) return "Romancillo (asonante " + lab + ")";
    return null;
  }

  function detectForm(active, stanzas) {
    const n = active.length;
    if (!n) return "—";
    const m = active.map(a => a.metric);
    const frac = x => active.filter(a => a.metric === x).length / n;

    if (n === 14 && frac(11) >= 0.7 && schemeOf(active.slice(0, 8), "cons") === "abbaabba") return "Soneto";
    const rom = romanceKind(active, frac);
    if (rom) return rom;

    if (stanzas.length > 1) {
      // voto de mayoría: tamaño de estrofa dominante + forma dominante entre ellas
      const sizeCount = {}; stanzas.forEach(s => sizeCount[s.length] = (sizeCount[s.length] || 0) + 1);
      const domSize = +Object.keys(sizeCount).sort((a, b) => sizeCount[b] - sizeCount[a])[0];
      const sameSize = stanzas.filter(s => s.length === domSize);
      if (domSize >= 2 && sameSize.length >= Math.ceil(stanzas.length * 0.6)) {
        const forms = sameSize.map(classifyStanza).filter(Boolean);
        if (forms.length) {
          const fc = {}; forms.forEach(f => fc[f] = (fc[f] || 0) + 1);
          const top = Object.keys(fc).sort((a, b) => fc[b] - fc[a])[0];
          if (fc[top] >= Math.ceil(sameSize.length * 0.6)) return stanzas.length + " × " + top.toLowerCase();
        }
      }
    }

    const one = classifyStanza(active);
    if (one) return one;

    // SILVA / MADRIGAL: mezcla libre de endecasílabos y heptasílabos con rima
    // consonante sin esquema fijo (y aun con versos sueltos). Se mide por
    // proporción, no por pureza: exigir que TODOS los versos midieran 7 u 11
    // hacía que un solo verso mal contado tumbara la forma (1 de 12 silvas del
    // corpus se reconocía). Los umbrales separan sin solapamiento las silvas
    // reales (≥83% en {7,11}, ≥10% de la medida minoritaria) del verso libre,
    // que como mucho llega al 77% y siempre con minoritaria 0%.
    // La silva NO es estrófica: fluye en tiradas desiguales. Un poema partido en
    // estrofas pequeñas y todas del mismo tamaño es otra cosa (p. ej. la rima
    // LIII de Bécquer son cuartetas 11-11-11-7, no una silva), así que se
    // excluye antes de mirar las medidas: preferimos no dar forma a darla mal.
    const uniforme = stanzas.length >= 3 &&
      stanzas[0].length <= 8 && stanzas.every(s => s.length === stanzas[0].length);
    const en711 = m.filter(x => x === 7 || x === 11).length;
    const minoritaria = Math.min(m.filter(x => x === 7).length, m.filter(x => x === 11).length);
    if (!uniforme && en711 / n >= 0.8 && minoritaria >= 2 && minoritaria / n >= 0.08 && rhymeShare(active) >= 0.3)
      return n <= 12 ? "Madrigal / silva breve" : "Silva";
    // VERSO LIBRE: se afirma por AUSENCIA —ni metro dominante ni rima que ate
    // los versos—, no por variedad de medidas. La condición antigua (más
    // medidas distintas que la mitad de los versos) es inalcanzable en poemas
    // largos: 100 versos habrían necesitado >50 medidas distintas, así que casi
    // todos caían al rótulo neutro. Se conserva porque sí sirve en poemas
    // breves. El umbral de rima es deliberadamente bajo (30%): con más rima que
    // eso preferimos callar, porque suele ser una forma que el motor no supo
    // leer y no un poema sin rima.
    const domFrac = active.filter(a => a.metric === mode(m)).length / n;
    if (new Set(m).size > n * 0.5 || (domFrac < 0.5 && rhymeShare(active) < 0.3))
      return "Verso libre";
    return n + " versos · forma libre";
  }

  const setText = (id, t) => { document.getElementById(id).textContent = t; };
  // Como setText, pero marca el chip como vacio (placeholder en italica).
  const setChip = (id, t, empty) => {
    const el = document.getElementById(id);
    el.textContent = t;
    el.classList.toggle("is-empty", !!empty);
  };
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const cssEsc = s => (window.CSS && CSS.escape) ? CSS.escape(s) : s.replace(/["\\]/g, "\\$&");

  /* ============================================================
     GUARDAR Y ENVIAR — el sitio es estático, así que el informe se arma en el
     navegador: descarga como .txt o se abre en el cliente de correo del
     lector (mailto), igual que el formulario de correspondencia.
     ============================================================ */

  const CC = "contacto@elpoemario.com";
  const BOM = String.fromCharCode(0xFEFF);  // el Bloc de notas de Windows lo necesita
  const REGLA = "─".repeat(58);

  // Instantánea del último render; null mientras el editor esté vacío.
  let informe = null;

  const elDescargar = document.getElementById("tm-descargar");
  const elCorreoAbrir = document.getElementById("tm-correo-abrir");
  const elCorreo = document.getElementById("tm-correo");
  const elPara = document.getElementById("tm-para");
  const elNota = document.getElementById("tm-nota");
  const elCopiar = document.getElementById("tm-copiar");
  const elAviso = document.getElementById("tm-feedback");

  function sincronizarCompartir() {
    if (!elDescargar) return;
    const hay = !!informe;
    elDescargar.disabled = !hay;
    elCorreoAbrir.disabled = !hay;
    if (!hay) {
      elCorreo.hidden = true;
      elCorreoAbrir.setAttribute("aria-expanded", "false");
      elAviso.textContent = "";
    }
  }

  function primerVerso() {
    const f = informe && informe.filas.find(Boolean);
    return f ? f.texto : "";
  }

  function construirInforme() {
    if (!informe) return "";
    const fecha = new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
    const L = [
      "EL TALLER · EL POEMARIO",
      "Escansión de un poema · " + fecha,
      "",
      "Metro dominante: " + informe.metro + (informe.metroSub ? " (" + informe.metroSub + ")" : ""),
      "Esquema de rima: " + informe.esquema + (informe.esquemaSub ? " (" + informe.esquemaSub + ")" : ""),
      "Versos: " + informe.versos,
      "Forma (aprox.): " + informe.forma,
      "",
      REGLA,
    ];
    informe.filas.forEach(f => {
      if (!f) { L.push(""); return; }
      L.push(String(f.medida).padStart(2, " ") + "  " + f.letra + "  " + f.texto);
      if (f.nota) L.push("       " + f.nota);
    });
    L.push(REGLA, "",
      "Medido en El Taller de El Poemario · https://elpoemario.com/taller/",
      "La escansión es orientativa: la sinéresis, la diéresis y la dialefa",
      "son licencias del oído del poeta.");
    return L.join("\n");
  }

  function nombreArchivo() {
    const slug = primerVerso().toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").slice(0, 40).replace(/^-+|-+$/g, "");
    return "escansion" + (slug ? "-" + slug : "") + ".txt";
  }

  function avisar(msg) { if (elAviso) elAviso.textContent = msg || ""; }

  async function copiarTexto(texto) {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch (err) {
      return false;
    }
  }

  if (elDescargar) {
    elDescargar.addEventListener("click", () => {
      if (!informe) return;
      const blob = new Blob([BOM + construirInforme()], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nombreArchivo();
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      avisar("Descargado como «" + a.download + "».");
    });

    elCorreoAbrir.addEventListener("click", () => {
      const abierto = !elCorreo.hidden;
      elCorreo.hidden = abierto;
      elCorreoAbrir.setAttribute("aria-expanded", String(!abierto));
      avisar("");
      if (!abierto) elPara.focus();
    });

    elCorreo.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!informe) return;
      if (!elCorreo.checkValidity()) { elCorreo.reportValidity(); return; }

      const nota = elNota.value.trim();
      const analisis = construirInforme();
      const verso = primerVerso();
      const asunto = "[El Poemario · El Taller] " +
        (verso ? "«" + (verso.length > 60 ? verso.slice(0, 57) + "…" : verso) + "»" : "Escansión de un poema");

      const enlace = "mailto:" + encodeURIComponent(elPara.value.trim()) +
        "?cc=" + encodeURIComponent(CC) +
        "&subject=" + encodeURIComponent(asunto) +
        "&body=" + encodeURIComponent((nota ? nota + "\n\n" : "") + analisis);

      // Cada cliente de correo recorta los mailto largos por su cuenta y sin
      // avisar, así que en vez de adivinar el límite se deja siempre una copia
      // del análisis en el portapapeles: si el correo se abre a medias, basta
      // con pegarlo. Si el portapapeles falla, el correo sale igual.
      const copiado = await copiarTexto(analisis);
      avisar(copiado
        ? "Abriendo tu cliente de correo. Por si acaso llegara recortado, el análisis quedó copiado en el portapapeles."
        : "Abriendo tu cliente de correo…");
      window.location.href = enlace;
    });

    elCopiar.addEventListener("click", async () => {
      if (!informe) return;
      const nota = elNota.value.trim();
      const ok = await copiarTexto((nota ? nota + "\n\n" : "") + construirInforme());
      avisar(ok
        ? "Análisis copiado. Pégalo donde quieras guardarlo."
        : "No pude copiar automáticamente. Usa «Descargar el análisis».");
    });
  }

  /* ============================================================
     BANCO DE RIMAS — sugiere palabras del diccionario que riman con la última
     del verso donde está el cursor. El índice es estático (public/taller/rimas/),
     repartido por terminación asonante; se descarga solo el shard necesario
     (1–11 KB) y se cachea. Las claves las calcula el mismo rhymeKeys de arriba,
     así que las sugerencias casan con la rima que detecta la escansión.
     ============================================================ */
  const RIMAS_BASE = "/taller/rimas/";
  const MOSTRAR_RIMAS = 40;           // tope por columna
  let rimasManifestP = null;          // promesa del manifest (dedupe en vuelo)
  const rimasCache = new Map();       // ason -> Promise<shard | null>
  let rimasOpen = false;
  let rimasSeq = 0;                   // descarta respuestas asíncronas obsoletas

  // Se cachean las PROMESAS, no los resultados: si dos búsquedas piden el mismo
  // archivo antes de que llegue, comparten un solo fetch en vez de duplicarlo.
  function rimasCargarManifest() {
    if (!rimasManifestP) {
      rimasManifestP = fetch(RIMAS_BASE + "manifest.json")
        .then(r => (r.ok ? r.json() : { shards: [] }))
        .then(j => new Set(j.shards))
        .catch(() => new Set());
    }
    return rimasManifestP;
  }
  function rimasCargarShard(ason) {
    if (!rimasCache.has(ason)) {
      rimasCache.set(ason, fetch(RIMAS_BASE + ason + ".json")
        .then(r => (r.ok ? r.json() : null))
        .catch(() => null));
    }
    return rimasCache.get(ason);
  }

  // última palabra del verso donde está el caret; si no, la última del texto
  function palabraDelCaret() {
    const val = editor.value;
    let pos = editor.selectionStart; if (pos == null) pos = val.length;
    const ini = val.lastIndexOf("\n", pos - 1) + 1;
    let fin = val.indexOf("\n", pos); if (fin === -1) fin = val.length;
    const enLinea = val.slice(ini, fin).match(WORD_RE);
    if (enLinea && enLinea.length) return enLinea[enLinea.length - 1];
    const todo = val.match(WORD_RE);
    return todo && todo.length ? todo[todo.length - 1] : null;
  }

  function pintarChips(cont, palabras, corpus) {
    cont.innerHTML = palabras.length
      ? palabras.map(x => '<span class="tm-chip-rima' + ((corpus && corpus.has(x)) ? " is-corpus" : "") + '">' + esc(x) + "</span>").join("")
      : '<span class="tm-rimas-empty">—</span>';
  }

  async function actualizarRimas() {
    if (!rimasOpen) return;
    const seq = ++rimasSeq;
    const w = palabraDelCaret();
    if (!w) {
      rimasTarget.textContent = "· escribe un verso";
      pintarChips(rimasCons, []); pintarChips(rimasAson, []);
      return;
    }
    const wl = w.normalize("NFC").toLowerCase();
    rimasTarget.textContent = "· para «" + w + "»";
    let k; try { k = rhymeKeys(wl); } catch { k = null; }
    const manifest = await rimasCargarManifest();
    if (seq !== rimasSeq) return;                 // llegó otra petición: aborta
    if (!k || !manifest.has(k.ason)) {
      pintarChips(rimasCons, []); pintarChips(rimasAson, []);
      return;
    }
    const shard = await rimasCargarShard(k.ason);
    if (seq !== rimasSeq) return;
    const corpusSet = new Set(shard && shard.p ? shard.p : []);
    const consAll = (shard && shard.c[k.cons]) ? shard.c[k.cons] : [];
    const consSet = new Set(consAll);
    const cons = consAll.filter(x => x !== wl).slice(0, MOSTRAR_RIMAS);
    const ason = (shard && shard.a ? shard.a : []).filter(x => x !== wl && !consSet.has(x)).slice(0, MOSTRAR_RIMAS);
    pintarChips(rimasCons, cons, corpusSet);
    pintarChips(rimasAson, ason, corpusSet);
  }

  if (rimasBtn) {
    rimasBtn.addEventListener("click", () => {
      rimasOpen = !rimasOpen;
      rimasPanel.hidden = !rimasOpen;
      rimasBtn.setAttribute("aria-expanded", String(rimasOpen));
      rimasBtn.classList.toggle("on", rimasOpen);
      rimasBtn.textContent = rimasOpen ? "Ocultar rimas" : "Buscar rimas";
      if (rimasOpen) actualizarRimas();
    });
    const alMover = () => { if (rimasOpen) actualizarRimas(); };
    editor.addEventListener("keyup", alMover);
    editor.addEventListener("click", alMover);
    document.addEventListener("selectionchange", () => {
      if (rimasOpen && document.activeElement === editor) actualizarRimas();
    });
  }

  /* ---- guía plegable «Cómo leer la escansión» (§8) ----
     Arranca abierta en la primera visita; se pliega sola en cuanto el lector
     escribe o pega su primer verso; el estado se recuerda en localStorage. Si el
     almacenamiento no está disponible, se comporta como una primera visita. La
     franja de leyenda es aparte y nunca se toca. */
  if (guia) {
    const GUIA_KEY = "taller:guia";
    // El editor viene con un poema de muestra: eso NO cuenta como «empezar a
    // trabajar». Solo el primer `input` real del lector arma el auto-plegado, y
    // solo si el lector no ha tocado la guía a mano en esta carga.
    let autoFoldArmed = true;

    try {
      const saved = localStorage.getItem(GUIA_KEY);
      if (saved === "closed") guia.open = false;
      else if (saved === "open") guia.open = true;
      // sin valor guardado → se deja el `open` por defecto (primera visita)
    } catch { /* almacenamiento no disponible → primera visita, no es un fallo */ }

    // Un clic/teclado sobre el resumen es interacción manual: desarma el
    // auto-plegado para no cerrar lo que el lector acaba de abrir a propósito.
    const summary = guia.querySelector("summary");
    if (summary) summary.addEventListener("click", () => { autoFoldArmed = false; });

    // Persiste cada cambio de estado (manual o automático).
    guia.addEventListener("toggle", () => {
      try { localStorage.setItem(GUIA_KEY, guia.open ? "open" : "closed"); } catch { /* sin persistencia */ }
    });

    editor.addEventListener("input", () => {
      if (autoFoldArmed) {
        autoFoldArmed = false;
        if (guia.open) guia.open = false;   // dispara `toggle` → persiste «closed»
      }
    });
  }

  /* ---- eventos ---- */
  editor.addEventListener("input", render);
  syllBtn.addEventListener("click", () => {
    showSyll = !showSyll;
    syllBtn.classList.toggle("on", showSyll);
    syllBtn.textContent = showSyll ? "Ocultar sílabas" : "Ver sílabas";
    render();
  });

  // muestra de ejemplo: soneto de Góngora (dominio público) — ABBA ABBA CDCDCD
  editor.value =
"Mientras por competir con tu cabello,\n" +
"oro bruñido al sol relumbra en vano;\n" +
"mientras con menosprecio en medio el llano\n" +
"mira tu blanca frente el lilio bello;\n" +
"\n" +
"mientras a cada labio, por cogello,\n" +
"siguen más ojos que al clavel temprano;\n" +
"y mientras triunfa con desdén lozano\n" +
"del luciente cristal tu gentil cuello;\n" +
"\n" +
"goza cuello, cabello, labio y frente,\n" +
"antes que lo que fue en tu edad dorada\n" +
"oro, lilio, clavel, cristal luciente,\n" +
"\n" +
"no sólo en plata o vïola troncada\n" +
"se vuelva, mas tú y ello juntamente\n" +
"en tierra, en humo, en polvo, en sombra, en nada.\n";

  render();
})();
