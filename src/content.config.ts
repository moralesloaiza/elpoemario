import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { TIPOS, MOVIMIENTOS, TEMAS, MOTIVOS } from './utils/taxonomia';

// Decap stores cleared optional fields inconsistently:
//   - cleared text: ""
//   - cleared multi-select (lists): null
//   - cleared empty list: [] (rare, but observed)
// These helpers normalize those values to `undefined` so the schema validates
// as the user intended (field absent, not field invalid). For arrays the
// strategy depends on the field's semantics — see each preprocess below.

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

const poemas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/poemas' }),
  schema: z.object({
    titulo: z.string(),
    resumen: optionalString(),
    fecha: z.coerce.date(),
    fecha_actualizada: optionalDate(),
    ilustracion: optionalString(),
    spotify_url: optionalUrl(),
    borrador: z.boolean().default(false),
    tipo: z.enum(TIPOS),
    movimiento: z.preprocess(
      (v) => (v === '' || v === null ? undefined : v),
      z.enum(MOVIMIENTOS).optional(),
    ),
    // Required, min 1. Normalize null/"" to [] so `.min(1)` emits a clean
    // "array must contain at least 1 element" error instead of Zod's
    // generic "expected array, got null".
    temas: z.preprocess(
      (v) => (v === null || v === '' ? [] : v),
      z.array(z.enum(TEMAS)).min(1),
    ),
    // Optional with default []. Normalize null/"" to undefined so `.default([])`
    // takes over. Covers Decap writing `motivos: null` after the user clears
    // the multi-select.
    motivos: z.preprocess(
      (v) => (v === null || v === '' ? undefined : v),
      z.array(z.enum(MOTIVOS)).default([]),
    ),
    autor: reference('autores'),
    // Optional translator. Used when the poem is a translation; the
    // referenced author entry represents whoever rendered the text into
    // Spanish. Decap writes "" or null when the relation is cleared.
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
  schema: z.object({
    nombre: z.string(),
    tipo: z.enum(['clasico', 'colaborador']),
    descripcion: z.string(),
    // Adjective form ("Venezolano", "Mexicana"). Mirrors El Fabulario.
    // Optional because anonymous authors have no nationality.
    nacionalidad: optionalString(),
    // Birth/death years as integers. Day/month precision was unjustified:
    // most corpus authors only have year-level data and writing "1836-01-01"
    // for "born in 1836" is a typographic lie. Mirrors El Fabulario's
    // nacimiento/muerte schema.
    nacimiento: optionalInt(),
    muerte: optionalInt(),
    lugar_nacimiento: optionalString(),
    lugar_muerte: optionalString(),
    imagen: optionalString(),
    // Optional list of canonical URLs (Wikipedia, VIAF, etc.). Normalize
    // null, "", and empty arrays to undefined so the schema treats the
    // field as absent.
    sameAs: z.preprocess(
      (v) => {
        if (v === null || v === '' || v === undefined) return undefined;
        if (Array.isArray(v) && v.length === 0) return undefined;
        return v;
      },
      z.array(z.string().url()).optional(),
    ),
    tambien_en: optionalString(),
  }),
});

// Entries collection — bitácora (editorial notes) and correspondencia
// (reader letters with curator's reply). The `tipo` field discriminates
// the two formats. Correspondence-only fields are validated by .refine().
// Mirrors the Fabulario schema, with `poema_referido` replacing
// `fabula_referida`.
const entradas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/entradas' }),
  schema: z
    .object({
      titulo: z.string(),
      resumen: optionalString(),
      fecha: z.coerce.date(),
      fecha_actualizada: optionalDate(),
      ilustracion: optionalString(),
      borrador: z.boolean().default(false),

      // Curator signature (parity with poemas; supports pseudonyms).
      curador: z.string().default('Don Alejandro'),
      es_seudonimo: z.boolean().default(true),
      nombre_real: optionalString(),

      // Format discriminator. Defaults to 'bitacora' since editorial
      // notes are the common case.
      tipo: z.enum(['bitacora', 'correspondencia']).default('bitacora'),

      // Correspondence-only fields.
      // `remitente`: publishable signature of the letter writer.
      //   Use 'Un lector' for anonymous letters. Required when
      //   tipo='correspondencia' (validated by .refine() below).
      // `poema_referido`: optional reference to a poem the letter
      //   discusses; surfaced in CartaHeader.
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
  loader: glob({ pattern: 'actual.md', base: './src/content/destacado' }),
  schema: z.object({
    tipo: z.enum(['poema', 'entrada', 'autor']),
    referencia: z.string(),
    nota: optionalString(),
  }),
});

export const collections = { poemas, autores, entradas, destacado };