import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { TIPOS, MOVIMIENTOS, TEMAS, MOTIVOS } from './utils/taxonomia';

// Decap stores cleared optional fields as empty strings ("") instead of omitting
// them from frontmatter. These helpers normalize "" -> undefined so the schema
// validates as the user intended (field absent, not field invalid).
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
    temas: z.array(z.enum(TEMAS)).min(1),
    motivos: z.array(z.enum(MOTIVOS)).default([]),
    autor: reference('autores'),
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
    fecha_nacimiento: optionalDate(),
    fecha_muerte: optionalDate(),
    lugar_nacimiento: optionalString(),
    lugar_muerte: optionalString(),
    imagen: optionalString(),
    sameAs: z
      .preprocess(
        (v) => (Array.isArray(v) && v.length === 0 ? undefined : v),
        z.array(z.string().url()).optional(),
      ),
    tambien_en: optionalString(),
  }),
});

const entradas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/entradas' }),
  schema: z.object({
    titulo: z.string(),
    resumen: optionalString(),
    fecha: z.coerce.date(),
    fecha_actualizada: optionalDate(),
    ilustracion: optionalString(),
    borrador: z.boolean().default(false),
    tipo: z.enum(['bitacora', 'correspondencia']),
    autor: reference('autores').optional(),
    curador: z.string().default('Don Alejandro'),
  }),
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