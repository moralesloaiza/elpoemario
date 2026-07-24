import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { TIPOS, MOVIMIENTOS, TEMAS, MOTIVOS, NACIONALIDADES, LENGUAS } from './utils/taxonomia';

// Decap stores cleared optional fields inconsistently:
//   - cleared text: ""
//   - cleared multi-select (lists): null
//   - cleared empty list: [] (rare, but observed)
// These helpers normalize those values to `undefined` so the schema validates
// as the user intended (field absent, not field invalid).

const optionalDate = () =>
  z.preprocess(
    (v) => (v === '' || v === null ? undefined : v),
    z.coerce.date().optional(),
  );

const optionalString = () =>
  z.preprocess(
    (v) => (v === '' || v === null ? undefined : v),
    z.string().optional(),
  );

const optionalUrl = () =>
  z.preprocess(
    (v) => (v === '' || v === null ? undefined : v),
    z.string().url().optional(),
  );

const optionalInt = () =>
  z.preprocess(
    (v) => (v === '' || v === null ? undefined : v),
    z.coerce.number().int().optional(),
  );

// Punto focal vertical de la ilustración en el hero inmersivo, en % desde el
// borde superior. El hero recorta la imagen a una franja 8:3 (ver
// HeroInmersivo.astro), así que de una ilustración 3:2 sólo se ve algo más de
// la mitad de su alto: este campo decide QUÉ franja. 0 = pegado arriba,
// 100 = pegado abajo. Sin valor: 8 para poemas y entradas, FOCO_RETRATO (15)
// para los retratos de autor.
const optionalFoco = () =>
  z.preprocess(
    (v) => (v === '' || v === null ? undefined : v),
    z.coerce.number().min(0).max(100).optional(),
  );

const poemas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/poemas' }),
  schema: ({ image }) =>
    z.object({
      titulo: z.string(),
      resumen: optionalString(),
      fecha: z.coerce.date(),
      fecha_actualizada: optionalDate(),
      ilustracion: z.optional(image()),
      foco: optionalFoco(),
      spotify_url: optionalUrl(),
      borrador: z.boolean().default(false),
      tipo: z.enum(TIPOS),
      movimiento: z.preprocess(
        (v) => (v === '' || v === null ? undefined : v),
        z.enum(MOVIMIENTOS).optional(),
      ),
      temas: z.preprocess(
        (v) => (v === null || v === '' ? [] : v),
        z.array(z.enum(TEMAS)).min(1),
      ),
      motivos: z.preprocess(
        (v) => (v === null || v === '' ? undefined : v),
        z.array(z.enum(MOTIVOS)).default([]),
      ),
      autor: reference('autores'),
      traductor: z.preprocess(
        (v) => (v === '' || v === null ? undefined : v),
        reference('autores').optional(),
      ),
      curador: z.string().default('Don Alejandro'),
      es_seudonimo: z.boolean().default(true),
      nombre_real: optionalString(),
      nota_curador: optionalString(),
    }),
});

const autores = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/autores' }),
  schema: ({ image }) =>
    z.object({
      nombre: z.string(),
      tipo: z.enum(['director', 'clasico', 'colaborador']),
      descripcion: optionalString(),
      nacionalidad: z.preprocess(
        (v) => (v === '' || v === null ? undefined : v),
        z.enum(NACIONALIDADES).optional(),
      ),
      lengua_original: z.preprocess(
        (v) => (v === '' || v === null ? undefined : v),
        z.enum(LENGUAS).optional(),
      ),
      nacimiento: optionalInt(),
      muerte: optionalInt(),
      lugar_nacimiento: optionalString(),
      lugar_muerte: optionalString(),
      imagen: z.optional(image()),
      foco: optionalFoco(),
      sameAs: z.preprocess(
        (v) => {
          if (v === null || v === '' || v === undefined) return undefined;
          if (Array.isArray(v) && v.length === 0) return undefined;
          return v;
        },
        z.array(z.string().url()).optional(),
      ),
      tambien_en: optionalString(),
      github_username: optionalString(),
      nombre_real: optionalString(),
    }),
});

const entradas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/entradas' }),
  schema: ({ image }) =>
    z
      .object({
        titulo: z.string(),
        resumen: optionalString(),
        fecha: z.coerce.date(),
        fecha_actualizada: optionalDate(),
        ilustracion: z.optional(image()),
        foco: optionalFoco(),
        spotify_url: optionalUrl(),
        borrador: z.boolean().default(false),
        curador: z.string().default('Don Alejandro'),
        es_seudonimo: z.boolean().default(true),
        nombre_real: optionalString(),
        tipo: z.enum(['bitacora', 'correspondencia']).default('bitacora'),
        remitente: optionalString(),
        poema_referido: z.preprocess(
          (v) => (v === '' || v === null ? undefined : v),
          reference('poemas').optional(),
        ),
      })
      .refine(
        (data) =>
          data.tipo !== 'correspondencia' ||
          (typeof data.remitente === 'string' && data.remitente.length > 0),
        {
          message:
            "Las entradas con tipo='correspondencia' requieren `remitente`. Usa 'Un lector' para cartas anónimas.",
          path: ['remitente'],
        },
      ),
});

const destacado = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/destacado' }),
  schema: z
    .object({
      activo: z.boolean().default(true),
      cintillo: z.string(),
      // Verse extract for the poema variant: one verse per line. Ignored for
      // entrada/autor (those use the referred item's resumen/descripcion).
      extracto: optionalString(),
      tipo: z.enum(['poema', 'entrada', 'autor']),
      poema_referido: z.preprocess(
        (v) => (v === '' || v === null ? undefined : v),
        reference('poemas').optional(),
      ),
      entrada_referida: z.preprocess(
        (v) => (v === '' || v === null ? undefined : v),
        reference('entradas').optional(),
      ),
      autor_referido: z.preprocess(
        (v) => (v === '' || v === null ? undefined : v),
        reference('autores').optional(),
      ),
    })
    .refine(
      (data) => {
        if (!data.activo) return true;
        if (data.tipo === 'poema') return data.poema_referido !== undefined;
        if (data.tipo === 'entrada') return data.entrada_referida !== undefined;
        if (data.tipo === 'autor') return data.autor_referido !== undefined;
        return false;
      },
      {
        message:
          'Cuando `activo: true`, debes seleccionar el elemento referido del tipo correspondiente.',
        path: ['tipo'],
      },
    ),
});

// Non-routed didactic collection. One .md per `tipo` slug feeds the intro
// block on /tipos/<slug>/ (rendered conditionally: no file → page unchanged).
// The body is the public-domain example verse (remark-breaks turns each line
// into a verse). Slug ∈ TIPOS is asserted at build in src/utils/formas.ts.
const formas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/formas' }),
  schema: z.object({
    descripcion: z.string(),
    ejemplo_autor: z.string(),
    ejemplo_obra: optionalString(),
    // Optional structured metrics. Decap sends "" / null when the object or
    // its fields are cleared; normalize both the object and each inner field.
    metrica: z.preprocess(
      (v) => (v === '' || v === null ? undefined : v),
      z
        .object({
          medida: optionalString(),
          rima: optionalString(),
        })
        .optional(),
    ),
  }),
});

const paginas = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/paginas' }),
  schema: z.object({
    rotulo: optionalString(),
    titulo: optionalString(),
    subtitulo: optionalString(),
    // Italic tagline under the home <h1>. Only the home page renders it.
    lema: optionalString(),
    descripcion: optionalString(),
    // Podcast card copy on the home page. Only home.md uses these.
    podcast_titulo: optionalString(),
    podcast_subtitulo: optionalString(),
    podcast_eyebrow: optionalString(),
    podcast_cta: optionalString(),
    podcast_glosa: optionalString(),
    // Franja «Novedad» de la home que enlaza a /taller. Solo home.md las usa.
    taller_eyebrow: optionalString(),
    taller_titulo: optionalString(),
    // Llamada a /taller: `taller_cta` la comparten home.md (franja) y tipos.md
    // (llamada del índice de formas y de cada ficha /tipos/<slug>/).
    taller_cta: optionalString(),
    // Texto de la llamada en las páginas de formas. Solo tipos.md lo usa.
    taller_texto: optionalString(),
  }),
});

export const collections = { poemas, autores, entradas, destacado, paginas, formas };