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
    if (c === "y" && w.length > 1 && isV(w[w.length - 2].toLowerCase())) return true;
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
  const syllBtn = document.getElementById("syllBtn");
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

  function buildVerseHTML(a, li) {
    let html = "";
    for (let i = 0; i < a.words.length; i++) {
      html += esc(a.words[i].text);
      if (i < a.words.length - 1) {
        const gap = a.raw.substring(a.words[i].end, a.words[i + 1].start);
        if (a.sinalefa[i]) {
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

    // metro dominante (moda) sobre el conteo natural
    const domMeter = active.length ? mode(active.map(a => a.metric)) : null;
    const best = domMeter != null ? active.filter(a => a.metric === domMeter).length : 0;
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
    setText("s-lines", String(active.length));
    document.getElementById("s-lines-sub").textContent = active.length ? "analizados" : " ";

    if (domMeter != null) {
      setText("s-meter", cap(verseName(domMeter)));
      const pct = Math.round((best / active.length) * 100);
      document.getElementById("s-meter-sub").textContent =
        (domMeter <= 8 ? "arte menor" : "arte mayor") + " · " + pct + "% de los versos";
    } else { setText("s-meter", "—"); document.getElementById("s-meter-sub").textContent = " "; }

    const schemeStr = chosen.letters.map(l => l.mayor ? l.letter : l.letter.toLowerCase()).join("");
    setText("s-scheme", schemeStr || "—");
    document.getElementById("s-scheme-sub").textContent =
      chosen.matched ? ("rima " + rhymeType) : (active.length ? "sin rima detectada" : " ");

    // ---- forma: se detecta sobre una vista AJUSTADA por licencias (si el poema es regular) ----
    const adjView = analyzed.map(a => {
      if (!a) return null;
      const fit = regular ? fitToMeter(a, domMeter) : { metric: a.metric, license: null };
      return Object.assign({}, a, { metric: fit.metric });
    });
    const forma = active.length ? detectForm(adjView.filter(Boolean), groupStanzas(adjView)) : "—";
    const formaSlug = formaToSlug(forma);
    const sForm = document.getElementById("s-form");
    if (formaSlug) sForm.innerHTML = '<a class="tm-forma-link" href="/tipos/' + formaSlug + '/">' + esc(forma) + '</a>';
    else sForm.textContent = forma;

    // ---- manuscript ----
    if (!active.length) {
      output.innerHTML = '<div class="empty-note">Escribe algo a la izquierda y el análisis aparecerá aquí, verso a verso.</div>';
      return;
    }

    let html = "";
    analyzed.forEach((a, idx) => {
      if (!a) {
        if (idx > 0 && analyzed[idx - 1]) html += '<div class="stanza-gap"></div>';
        return;
      }
      const broken = brokenCount(a);
      const dispM = a.metric + broken;                     // dialefas del usuario suman +1 cada una
      const off = domMeter != null && dispM !== domMeter;
      const ll = lineLetters[idx];
      const letterHTML = ll && ll.letter !== "–"
        ? '<div class="rhyme-letter set" data-key="' + ll.key + '">' + (ll.mayor ? ll.letter : ll.letter.toLowerCase()) + '</div>'
        : '<div class="rhyme-letter">·</div>';

      let flag = "";
      if (off) {
        const diff = dispM - domMeter;
        if (diff === 1 && a.hasHiato) flag = 'funde un hiato (<b>sinéresis</b>) para ' + domMeter;
        else if (diff === -1 && a.sinCount > broken) flag = 'corta una sinalefa (clic en <b>‿</b>) para ' + domMeter;
        else if (diff === -1 && a.hasDiphthong) flag = 'abre un diptongo (<b>diéresis</b>) para ' + domMeter;
        else flag = 'se aparta del metro (' + domMeter + ')';
        flag = '<span class="flag">△ mide <b>' + dispM + '</b> — ' + flag + '</span>';
      } else if (broken > 0) {
        flag = '<span class="flag ok">✓ ' + domMeter + ' aplicando dialefa</span>';
      }

      let syllLine = "";
      if (showSyll) {
        const parts = a.words.map(w => w.sylls.join("·"));
        let joined = "";
        for (let i = 0; i < parts.length; i++) {
          joined += parts[i];
          if (i < parts.length - 1) joined += (a.sinalefa[i] && !manualBreaks.has(lineKey(a) + "|" + i)) ? "‿" : " ";
        }
        syllLine = '<span class="syllas">' + esc(joined) + '</span>';
      }

      html += '<div class="verse-row ' + (off ? "off" : "") + (broken > 0 && !off ? " fitted" : "") + '" data-key="' + (ll && ll.key ? ll.key : "") + '">' +
                '<div class="gutter">' + dispM + '</div>' +
                '<div class="verse-text">' + buildVerseHTML(a, idx) + flag + syllLine + '</div>' +
                letterHTML +
              '</div>';
    });
    output.innerHTML = html;

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

    const set = new Set(m);
    if ([...set].every(x => x === 7 || x === 11) && set.size > 1) return n <= 12 ? "Madrigal / silva breve" : "Silva";
    if (new Set(m).size > n * 0.5) return "Verso libre";
    return n + " versos · forma libre";
  }

  const setText = (id, t) => { document.getElementById(id).textContent = t; };
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const cssEsc = s => (window.CSS && CSS.escape) ? CSS.escape(s) : s.replace(/["\\]/g, "\\$&");

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
