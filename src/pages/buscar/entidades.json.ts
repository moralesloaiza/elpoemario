// src/pages/buscar/entidades.json.ts
//
// Static endpoint serving the search index for entities.
//
// The site buscador combines two sources:
//   1. Pagefind for free-text search over poem bodies.
//   2. This JSON for taxonomy entities (autor, forma, movimiento, tema,
//      motivo), with counts.
//
// Inclusion: only entities with at least one published (non-draft) poem.
// Order: by count desc, alphabetical on ties (locale 'es').
//
// Differences vs the Fabulario equivalent:
//   - In the Poemario, `poema.data.autor` is a reference() object
//     { collection, id }. The Map key for author counts MUST be
//     `p.data.autor.id` (string), not the object itself — using the
//     object would create a distinct key per poem.
//   - Five entity tipos: autor + 4 taxonomy axes.

import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import {
	TIPOS_DISPLAY,
	MOVIMIENTOS_DISPLAY,
	TEMAS_DISPLAY,
	MOTIVOS_DISPLAY,
} from '../../utils/taxonomia';

type TipoEntidad = 'autor' | 'forma' | 'movimiento' | 'tema' | 'motivo';

interface Entidad {
	tipo: TipoEntidad;
	slug: string;
	nombre: string;
	conteo: number;
	url: string;
}

export const GET: APIRoute = async () => {
	const poemas = await getCollection('poemas', ({ data }) => !data.borrador);
	const autores = await getCollection('autores');

	// ── Autores ───────────────────────────────────────────────────────────
	// Key is .id (string), not the reference object.
	const conteoAutores = new Map<string, number>();
	for (const p of poemas) {
		const id = p.data.autor.id;
		conteoAutores.set(id, (conteoAutores.get(id) ?? 0) + 1);
	}
	const entidadesAutor: Entidad[] = autores
		.map((a) => ({
			tipo: 'autor' as const,
			slug: a.id,
			nombre: a.data.nombre,
			conteo: conteoAutores.get(a.id) ?? 0,
			url: `/autores/${a.id}/`,
		}))
		.filter((e) => e.conteo > 0);

	// ── Formas (frontmatter `tipo`) ──────────────────────────────────────
	const conteoFormas = new Map<string, number>();
	for (const p of poemas) {
		conteoFormas.set(p.data.tipo, (conteoFormas.get(p.data.tipo) ?? 0) + 1);
	}
	const entidadesForma: Entidad[] = Array.from(conteoFormas.entries()).map(
		([slug, conteo]) => ({
			tipo: 'forma' as const,
			slug,
			nombre: TIPOS_DISPLAY[slug as keyof typeof TIPOS_DISPLAY],
			conteo,
			url: `/tipos/${slug}/`,
		}),
	);

	// ── Movimientos ──────────────────────────────────────────────────────
	const conteoMovimientos = new Map<string, number>();
	for (const p of poemas) {
		if (p.data.movimiento) {
			conteoMovimientos.set(
				p.data.movimiento,
				(conteoMovimientos.get(p.data.movimiento) ?? 0) + 1,
			);
		}
	}
	const entidadesMovimiento: Entidad[] = Array.from(conteoMovimientos.entries()).map(
		([slug, conteo]) => ({
			tipo: 'movimiento' as const,
			slug,
			nombre: MOVIMIENTOS_DISPLAY[slug as keyof typeof MOVIMIENTOS_DISPLAY],
			conteo,
			url: `/movimientos/${slug}/`,
		}),
	);

	// ── Temas ────────────────────────────────────────────────────────────
	const conteoTemas = new Map<string, number>();
	for (const p of poemas) {
		for (const t of p.data.temas) {
			conteoTemas.set(t, (conteoTemas.get(t) ?? 0) + 1);
		}
	}
	const entidadesTema: Entidad[] = Array.from(conteoTemas.entries()).map(
		([slug, conteo]) => ({
			tipo: 'tema' as const,
			slug,
			nombre: TEMAS_DISPLAY[slug as keyof typeof TEMAS_DISPLAY],
			conteo,
			url: `/temas/${slug}/`,
		}),
	);

	// ── Motivos ──────────────────────────────────────────────────────────
	const conteoMotivos = new Map<string, number>();
	for (const p of poemas) {
		for (const m of p.data.motivos) {
			conteoMotivos.set(m, (conteoMotivos.get(m) ?? 0) + 1);
		}
	}
	const entidadesMotivo: Entidad[] = Array.from(conteoMotivos.entries()).map(
		([slug, conteo]) => ({
			tipo: 'motivo' as const,
			slug,
			nombre: MOTIVOS_DISPLAY[slug as keyof typeof MOTIVOS_DISPLAY],
			conteo,
			url: `/motivos/${slug}/`,
		}),
	);

	// ── Final assembly: stable order ─────────────────────────────────────
	const ordenar = (a: Entidad, b: Entidad) => {
		if (b.conteo !== a.conteo) return b.conteo - a.conteo;
		return a.nombre.localeCompare(b.nombre, 'es');
	};

	const entidades: Entidad[] = [
		...entidadesAutor.sort(ordenar),
		...entidadesForma.sort(ordenar),
		...entidadesMovimiento.sort(ordenar),
		...entidadesTema.sort(ordenar),
		...entidadesMotivo.sort(ordenar),
	];

	return new Response(JSON.stringify(entidades), {
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	});
};