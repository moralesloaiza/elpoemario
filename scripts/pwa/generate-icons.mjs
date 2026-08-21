// Genera los iconos PNG de la PWA a partir de public/logo.svg.
//
// `sharp` NO es dependencia del proyecto (los iconos ya van commiteados en
// public/icons/). Solo hace falta al regenerarlos; instálala puntualmente:
//     npm i -D sharp && npm run pwa:icons && npm uninstall sharp
//
// Salidas (en public/icons/):
//   icon-192.png            · icono estándar 192×192 (transparente)
//   icon-512.png            · icono estándar 512×512 (transparente)
//   icon-maskable-512.png   · variante "maskable": el logo al 80% sobre fondo
//                             sólido, para que Android pueda recortarlo en
//                             círculo/rombo sin comerse el diseño.
//   apple-touch-icon.png    · 180×180 a sangre sobre fondo sólido (iOS no
//                             respeta la transparencia y pondría negro detrás).
//
// El fondo sólido es #161320, el mismo tono que el círculo exterior del logo,
// para que el relleno sea invisible y el borde crema quede como el filo.

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const raiz = join(__dirname, '..', '..');
const svg = join(raiz, 'public', 'logo.svg');
const salida = join(raiz, 'public', 'icons');

const FONDO = '#161320';

await mkdir(salida, { recursive: true });

// Iconos estándar (transparentes, logo a sangre).
for (const size of [192, 512]) {
  await sharp(svg, { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(join(salida, `icon-${size}.png`));
}

// Maskable 512: logo al 80% (410px) centrado sobre fondo sólido.
{
  const size = 512;
  const inner = Math.round(size * 0.8);
  const pad = Math.round((size - inner) / 2);
  const logo = await sharp(svg, { density: 384 })
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: FONDO },
  })
    .composite([{ input: logo, top: pad, left: pad }])
    .png()
    .toFile(join(salida, 'icon-maskable-512.png'));
}

// Apple touch 180: logo a sangre sobre fondo sólido (sin transparencia).
{
  const size = 180;
  const logo = await sharp(svg, { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: FONDO },
  })
    .composite([{ input: logo, top: 0, left: 0 }])
    .png()
    .toFile(join(salida, 'apple-touch-icon.png'));
}

console.log('Iconos PWA generados en public/icons/');
