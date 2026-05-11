# Astro Starter Kit: Basics

```sh
npm create astro@latest -- --template basics
```

## Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src
│   ├── assets
│   │   └── astro.svg
│   ├── components
│   │   └── Welcome.astro
│   ├── layouts
│   │   └── Layout.astro
│   └── pages
│       └── index.astro
└── package.json
```

To learn more about the folder structure of an Astro project, refer to [our guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## Tailwind CSS

This project uses Tailwind CSS v4 via the Vite plugin `@tailwindcss/vite`.

- Global styles entry: `src/styles/global.css`
- Loaded from the root layout: `src/layouts/Layout.astro`

## Supabase

1. Create a `.env` file from `.env.example` and set:

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`

2. Use the client helper:

- `src/lib/supabaseClient.ts` exports `getSupabaseClient()`

## Admin UI (SSG + React islands)

The admin shell is generated with SSG, and interactive UI runs in the browser.
We keep React islands with `client:only="react"` for tables, forms, and uploads.
This does not change SSR/SSG behavior per route; it only controls client hydration.

## Cloudflare (Astro adapter)

This project is configured for Cloudflare via `@astrojs/cloudflare` with `output: "server"`.

- For Cloudflare Pages, set environment variables in the Pages project settings.
- Local builds should work with `npm run build`.

## Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
