// Markdown de campos de frontmatter (no del cuerpo de la entrada).
//
// El cuerpo de un .md lo renderiza Astro, que resuelve por su cuenta las
// imagenes relativas. Un campo como `nota_curador` es solo un string del
// frontmatter: lo convierte `marked` en tiempo de build y Astro nunca ve las
// referencias, asi que la ruta que escribe Decap ('../../assets/uploads/x.png')
// llegaria literal al HTML. En el navegador esa ruta se resuelve contra la URL
// de la pagina, no contra el .md, y ademas src/assets no se publica: 404.
//
// Aqui se cierra ese hueco reenviando cada <img> que apunte a assets/uploads
// por el pipeline de imagenes de Astro, igual que hace el helper image() del
// esquema con `ilustracion`.
import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import { marked } from 'marked';

// Ancho maximo util: la nota vive en una columna de prosa, no a sangre.
const ANCHO_MAX = 1024;

// Cargadores perezosos de cada upload. Sin `eager`: solo entran al grafo de
// build las imagenes que una nota referencia de verdad.
const UPLOADS = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/uploads/*.{png,jpg,jpeg,webp,avif,gif}',
);

// La carpeta de uploads es plana, asi que el nombre de fichero basta como
// clave y evita tener que normalizar los distintos prefijos relativos.
const POR_NOMBRE = new Map(
  Object.entries(UPLOADS).map(([ruta, cargar]) => [ruta.split('/').pop()!, cargar]),
);

const RE_IMG = /<img\b([^>]*?)\s*\/?>/g;
const RE_SRC = /\bsrc="([^"]*)"/;

function escaparAtributo(valor: string): string {
  return valor.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

/** Convierte un campo Markdown del frontmatter en HTML con las imagenes resueltas. */
export async function parseMarkdownField(md: string): Promise<string> {
  const html = marked.parse(md, { async: false, breaks: true }) as string;
  return resolverImagenes(html);
}

async function resolverImagenes(html: string): Promise<string> {
  const etiquetas = [...html.matchAll(RE_IMG)];
  if (etiquetas.length === 0) return html;

  // Primero se resuelven todas las rutas (getImage es asincrono), luego se
  // reescribe el HTML en una pasada sincrona.
  const resueltas = new Map<string, Awaited<ReturnType<typeof getImage>>>();

  for (const [, atributos] of etiquetas) {
    const ruta = atributos.match(RE_SRC)?.[1];
    if (!ruta || !ruta.includes('/assets/uploads/') || resueltas.has(ruta)) continue;

    const nombre = decodeURIComponent(ruta).split('/').pop()!;
    const cargar = POR_NOMBRE.get(nombre);
    // Falla el build en vez de publicar una imagen rota: es el mismo criterio
    // que validate-images.mjs aplica a las imagenes del frontmatter.
    if (!cargar) {
      throw new Error(
        `Nota de curador: imagen inexistente "${ruta}". ` +
          `Se busco "${nombre}" en src/assets/uploads/.`,
      );
    }

    const { default: imagen } = await cargar();
    resueltas.set(
      ruta,
      await getImage({
        src: imagen,
        format: 'webp',
        width: Math.min(imagen.width, ANCHO_MAX),
      }),
    );
  }

  if (resueltas.size === 0) return html;

  return html.replace(RE_IMG, (completo, atributos: string) => {
    const ruta = atributos.match(RE_SRC)?.[1];
    const optimizada = ruta ? resueltas.get(ruta) : undefined;
    if (!optimizada) return completo;

    // Se conservan los atributos de marked (alt, title) con el src reescrito, y
    // se anaden los que aporta Astro: width/height contra el salto de
    // maquetacion, mas loading/decoding, que por defecto son lazy/async — la
    // nota queda siempre por debajo del pliegue.
    const reescritos = atributos.replace(RE_SRC, `src="${optimizada.src}"`);
    const yaPresentes = new Set(
      [...atributos.matchAll(/\b([a-zA-Z-]+)=/g)].map(([, clave]) => clave.toLowerCase()),
    );
    const extra = Object.entries(optimizada.attributes)
      // Astro deja algunos atributos sin valor (p.ej. fetchpriority cuando no se
      // pidio prioridad); serializarlos daria fetchpriority="undefined".
      .filter(([clave, valor]) => valor != null && !yaPresentes.has(clave.toLowerCase()))
      .map(([clave, valor]) => ` ${clave}="${escaparAtributo(String(valor))}"`)
      .join('');
    return `<img${reescritos}${extra}>`;
  });
}
