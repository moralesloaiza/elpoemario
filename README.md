# Astro Starter Kit: Minimal

```sh
npm create astro@latest -- --template minimal
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 🔁 Rotación semanal del destacado ("El poema de la semana")

El destacado de la portada (`src/content/destacado/actual.md`, editable en Decap)
tiene un interruptor **Rotación semanal automática** (`rotacion_semanal`). Con él
activo, la home ignora el destacado curado a mano y elige sola, de forma
determinista, un poema publicado con ilustración distinto cada semana: el mismo
para todos los visitantes durante los siete días, recorriendo todo el archivo
ilustrado antes de repetir (`src/utils/poemaSemanal.ts`).

Como el sitio es estático (Astro → Cloudflare Pages), el HTML de la portada se
congela en el build: para que el poema cambie solo hace falta un **rebuild
semanal**. Lo dispara `.github/workflows/poema-semanal.yml` (cron de los lunes a
las 06:00 UTC) haciendo ping a un **Deploy Hook de Cloudflare Pages**.

**Paso manual único** — crear el secreto del Deploy Hook:

1. En Cloudflare Pages → tu proyecto → **Settings → Builds & deployments →
   Deploy hooks**, crea un hook (rama `main`) y copia su URL.
2. En GitHub → repo → **Settings → Secrets and variables → Actions → New
   repository secret**, nómbralo `CF_DEPLOY_HOOK` y pega la URL.

Sin ese secreto el workflow falla con un aviso claro. Con `rotacion_semanal:
false` vuelve el control curatorial: fijas a mano un poema, una entrada o un
autor como hasta ahora.

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
