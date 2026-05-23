import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { TIPOS, MOVIMIENTOS, TEMAS, MOTIVOS } from './utils/taxonomia';

const poemas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/poemas' }),
  schema: z.object({
    titulo: z.string(),
    resumen: z.string().optional(),
    fecha: z.date(),
    fecha_actualizada: z.date().optional(),
    ilustracion: z.string().optional(),
    spotify_url: z.string().url().optional(),
    borrador: z.boolean().default(false),
    tipo: z.enum(TIPOS),
    movimiento: z.enum(MOVIMIENTOS).optional(),
    temas: z.array(z.enum(TEMAS)).min(1),
    motivos: z.array(z.enum(MOTIVOS)).default([]),
    autor: reference('autores'),
    curador: z.string().default('Don Alejandro'),
    es_seudonimo: z.boolean().default(true),
    nombre_real: z.string().optional(),
    nota_curador: z.string().optional(),
  }),
});

const autores = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/autores' }),
  schema: z.object({
    nombre: z.string(),
    tipo: z.enum(['clasico', 'colaborador']),
    descripcion: z.string(),
    fecha_nacimiento: z.date().optional(),
    fecha_muerte: z.date().optional(),
    lugar_nacimiento: z.string().optional(),
    lugar_muerte: z.string().optional(),
    imagen: z.string().optional(),
    sameAs: z.array(z.string().url()).optional(),
    tambien_en: z.string().optional(),
  }),
});

const entradas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/entradas' }),
  schema: z.object({
    titulo: z.string(),
    resumen: z.string().optional(),
    fecha: z.date(),
    fecha_actualizada: z.date().optional(),
    ilustracion: z.string().optional(),
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
    nota: z.string().optional(),
  }),
});

export const collections = { poemas, autores, entradas, destacado };