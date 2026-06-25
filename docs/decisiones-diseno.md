El Poemario — Registro de decisiones de diseño
Documento interno de decisiones cerradas, con su justificación. No es un plan
abierto: es la fuente de verdad de por qué el sitio es como es. Cada entrada lleva
decisión, razón y estado.
Regla de mantenimiento (obligatoria): toda PR que cierre, cambie o invalide una
decisión actualiza este archivo en la misma PR. Un registro desactualizado miente;
aplica aquí la misma lección que con los títulos de commit.
Origen: sesión de auditoría de junio de 2026 sobre `main`, contrastada contra la
maqueta de rediseño (prototipo visual) y el Documento de Diseño v1.
---
1. Estado del sitio tras auditoría (Fase 0)
La auditoría sobre tarball fresco de `main` reveló que el sitio vivo ya satisface la
mayoría de las mejoras que se habían planeado sobre la maqueta. La maqueta, por ser un
prototipo visual rápido, es menos accesible que el sitio real en varios puntos. Su valor
es la dirección visual (Verdís + pergamino), no su DOM.
Confirmado ya correcto en `main`, sin intervención:
Enlaces de navegación: son `<a href>` reales vía `HeaderLink`. Focusables e indexables.
Jerarquía de encabezados: cada plantilla tiene un `<h1>`; `index.astro` usa
`<h2 aria-labelledby>` y `<h3>`; los antetítulos/eyebrows son `<p>` (correcto: un eyebrow
no es heading). El 404 toma su `<h1>` de contenido, sin numeral decorativo.
Pergamino: toda la lógica (`data-theme`, `elp-theme`, `localStorage`) vive solo en
`Poema.astro`. `Base.astro` no la menciona. Ya scopeado a la página de poema.
Footer: muestra `© {año} El Poemario`, sin atribución del director. La cadena
canónica del v1 no existe en ningún archivo del repo.
---
2. Nomenclatura de tokens (repo manda)
La maqueta usaba abreviaturas (`--oro-tx`, `--oro-sv`, `--muted`). El repo usa nombres
largos y es la fuente de verdad: `--oro`, `--oro-texto`, `--oro-suave`, `--text`,
`--text-soft`, `--text-muted`, `--verse`, `--link`, `--link-hover`, `--accent`. Cualquier
trabajo futuro usa los nombres del repo, no los de la maqueta.
---
3. Sistema de acento: Oro + Marfil + Verdís
Decisión: el sistema de acento es Oro + Marfil + Verdís. Se descartan Lapis y el
oro-como-accent que la maqueta ofrecía a modo de selector; el conmutador de acento de la
maqueta era ayuda de revisión, no UI de producción. El acento queda fijo en Verdís.
Verdís — valores (dependientes de tema):
TokenTemaValorContraste sobre fondo
`--accent`noche (`:root`)`#66a08f`6.09:1 sobre `#161320`
`--accent`pergamino`#356152`5.53:1 sobre `#efe3c8`
El Verdís oscuro de pergamino (`#356152`) está confirmado visualmente.
Mapeo de `--accent` — un solo rol, scopeado al poema ("la otra voz"):
`.prose :global(blockquote)` en `Poema.astro` — `border-left` pasa de `var(--oro)` a
`var(--accent)`. Marca la voz citada/secundaria, distinta del verso del poeta.
Glifo lunar `☾` del conmutador pergamino — color `var(--accent)`. Es la única afordancia
interactiva del poema que no es un enlace.
No usa Verdís (se mantienen en oro): `divisor-rombo`, borde y rótulo de `nota-curador`,
`chips` de taxonomía, y todos los enlaces.
Justificación (a11y + UX):
Restricción: un acento solo se gana su sitio con un rol semántico consistente.
Esparcirlo lo degrada a ruido visual.
No fragmentar la casa: el oro es la identidad estructural compartida entre inicio,
autor y poema. Recolorear divisor o nota-curador rompería esa coherencia entre páginas.
El color no es el único portador de significado (WCAG 1.4.1): el blockquote ya se
distingue por sangrado e itálica; el color es redundante, no único.
Contraste: como borde/no-texto el umbral es 3:1 (pasa de sobra); como texto sería 4.5
(también pasa) en ambos temas.
Salvedad asumida: los `blockquote` son poco frecuentes en verso (aparecen sobre todo en
notas de curador y prosa poética), así que el acento será discreto. Eso es correcto para un
acento: discreto por diseño. Si en el futuro se quiere presencia garantizada, se diseña
primero un elemento dedicado (p. ej. una pull-quote editorial) antes de ampliar el mapeo.
---
4. Paleta pergamino corregida (contraste WCAG)
El modo pergamino tenía tres fallos de contraste y dos valores al límite. Como `--oro` se usa
como texto en `Poema.astro` (no solo como borde), el umbral aplicable es 4.5:1.
Correcciones (solo afectan a `[data-theme='pergamino']`, que solo se renderiza en el poema):
TokenAntesAntes (ratio)DespuésDespués (ratio)
`--oro``#8a6d34`3.82 ✗`#6a5223`5.80 ✓
`--text-muted``#6b5d44`5.04`#615338`5.88 ✓
`--oro-suave``#9c7d3e`3.04 ⚠`#75592b`5.12 ✓
`--oro-texto``#7a5f2c`4.71`#5f4a1f`6.63 ✓
`--link``#7a5f2c`4.71`#5f4a1f`6.63 ✓
`--link-hover``#5c4720`6.94(sin cambio)6.94 ✓
Ratios calculados sobre el fondo pergamino `#efe3c8`. El modo noche pasa AA en todos sus
pares y no se toca.
Jerarquía oro/enlace en pergamino: al subir `--oro` estructural a `#6a5223` (5.80), se
suben también `--oro-texto`/`--link` a `#5f4a1f` (6.63) para que el enlace de texto sea más
prominente que el oro estructural (6.63 > 5.80). Restaura la intención original: el oro
decorativo recede tras el texto de enlace.
---
5. Foco visible (WCAG 2.4.7)
Decisión: añadir indicador de foco de teclado real. El `a:focus-visible` existente solo
cambia color y subrayado, no aporta `outline`, y no cubre `<button>` ni `<input>`.
Implementación: regla global
`:focus-visible { outline: 2px solid var(--oro-texto); outline-offset: 3px; }` cubriendo
`a, button, input, [tabindex]`, conservando el tratamiento de color de enlace existente. El
`outline` usa la variable, así que se adapta a ambos temas.
---
6. Footer sin atribución del director
Decisión: el footer no lleva `· Una colección dirigida por don Alejandro de Morales y Loaiza`. Se queda en `© {año} El Poemario`.
Estado: ya es así en `main` (cambio de código = no-op). El §1 del Documento de Diseño v1
("footer canónico" con atribución) queda obsoleto y debe anotarse como tal en ese
documento externo (no vive en el repo).
---
7. Navegación móvil: sin burger
Decisión: se conserva el nav que se reajusta (`flex-wrap` + reducción de gap). No se
adopta el menú hamburguesa que inventaba la maqueta.
Justificación: el nav actual ya es accesible y sin JS (funciona con teclado y lectores sin
estado que mantener). El burger esconde la navegación (cuesta descubribilidad) y añade
superficie ARIA (focus-trap, `aria-expanded`) que hay que implementar sin errores. Para un
sitio contemplativo de lectura con navegación infrecuente, rinde poco. Comprobado en móvil
real: el reflow funciona con comodidad. Si en el futuro el nav crece y se amontona, el punto
medio preferido al burger es una fila con scroll horizontal o "primarios + Más".
---
8. Trabajo pendiente (PRs)
Cada PR se ejecuta en su propia conversación, empezando por leer este archivo + tarball fresco
de `main`. Un PR = un scope.
PR-A · Tokens de color.
`src/styles/tokens.css`:
`:root`: añadir `--accent: #66a08f;`
`[data-theme='pergamino']`: añadir `--accent: #356152;` y aplicar las correcciones de la
tabla §4 (`--oro`, `--text-muted`, `--oro-suave`, `--oro-texto`, `--link`).
`src/layouts/Poema.astro`:
`.prose :global(blockquote)` `border-left`: `var(--oro)` → `var(--accent)`.
Glifo lunar `☾` del conmutador pergamino: color → `var(--accent)` (confirmar la clase
exacta del glifo en una Fase 0-bis antes de escribir el script).
Cierre: build verde + contrastes AA verificados (ya calculados en §3 y §4).
PR-B · Foco visible. Según §5.
Doc (externo, no repo): anotar como obsoleto el §1 del Documento de Diseño v1.
---
9. Descartado / no-op (confirmado por auditoría)
Burger móvil: descartado (§7).
Jerarquía de encabezados: el sitio ya es correcto, mejor que la maqueta. No-op.
Footer (código): ya limpio. No-op.
---
10. Notas menores detectadas (no bloqueantes)
`Header.astro` tiene un comentario obsoleto ("Nav en Josefin Sans"); Josefin Sans fue
descartada y la meta usa Cinzel. Limpiar cuando se toque el archivo.
El nav vivo incluye "Correspondencia" como item propio (ausente en la maqueta). Divergencia
de arquitectura de información, fuera del alcance de estas PRs.
---
Apéndice — método de verificación de contraste
Ratios calculados con la fórmula WCAG 2.x de luminancia relativa (linealización sRGB,
coeficientes 0.2126 / 0.7152 / 0.0722, `(L_claro + 0.05) / (L_oscuro + 0.05)`). Umbrales:
texto normal 4.5:1, texto grande 3:1, elementos no textuales (bordes, iconos) 3:1.
