# Banca de pruebas de El Taller

Herramientas para medir el motor de métrica y rima de [/taller](../../src/pages/taller.astro)
sin abrir el navegador. Solo Node, sin dependencias.

```bash
npm run taller:test     # pruebas del detector de formas (falla con salida ≠ 0)
npm run taller:medir    # acierto contra las etiquetas del corpus, por tipo
npm run taller:diag -- silva            # por qué ve lo que ve, tipo a tipo
npm run taller:diag -- --stats silva    # estadísticos que separan familias
npm run taller:diag -- --estrofas oda-a-la-vida   # estrofa a estrofa
```

## Cómo funciona

`harness.mjs` ejecuta **el motor real** (`src/components/tallerMetrico.client.js`)
dentro de un contexto `vm` con un DOM mínimo. El motor es un IIFE que no exporta
nada, así que el arnés le inyecta una sola línea antes del `render()` final para
publicar sus funciones internas. Se mide el código que se publica, no una copia.

Si alguna vez falla con «no encuentro el `render();` final», es que se reorganizó
el cierre del IIFE: hay que actualizar el punto de inyección en `harness.mjs`.

## Al cambiar el motor

1. `npm run taller:test` — las pruebas fijan tanto lo que debe reconocer como lo
   que **no** debe nombrar. Los negativos importan igual que los positivos.
2. `npm run taller:medir` — anota la cifra de antes y la de después. Un cambio
   que sube el acierto global pero mete falsos positivos es un mal cambio.
3. Si toca mover un umbral, mírate los datos con `taller:diag` primero.

## Dos avisos

- **La etiqueta del corpus no es la verdad.** Hay poemas mal clasificados
  (alejandrinos etiquetados como soneto, cuartetas como silva). Un fallo puede
  ser del corpus, no del motor: compruébalo antes de tocar nada.
- **Los géneros temáticos quedan fuera de alcance** (oda, elegía, balada, glosa,
  himno, letrilla, villancico, prosa poética, polimétrico). No son deducibles de
  la métrica y el motor no los afirma, por decisión de diseño.
