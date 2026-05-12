# Guia del proyecto - E-commerce Astro

Este documento describe todo el proyecto: que es, como esta armado, por que se tomo cada decision y como operar cada parte. Esta pensado para resolver dudas tecnicas y de flujo.

## 1) Vision general

- Para que sirve: tener un e-commerce con catalogo publico y un panel admin seguro.
- Que hace: mezcla SSR para el catalogo y SSG para el admin, con datos en Supabase.
- Por que: se obtiene rendimiento y contenido vivo en publico, y una shell simple para admin.

## 2) Stack y responsabilidades

- Para que sirve: definir tecnologias y limites de cada capa.
- Que hace: Astro 6 como framework, Tailwind v4 para estilos, Supabase para DB/Auth/Storage.
- Por que: Astro permite SSR/SSG por ruta y Supabase resuelve backend sin servidor propio.

Stack actual:
- Astro 6 + Cloudflare adapter
- React 18 (islas cliente para admin)
- Tailwind v4 via @tailwindcss/vite
- Supabase JS v2
- TypeScript estricto

## 3) SSR vs SSG (regla central)

- Para que sirve: controlar como se entrega cada pagina.
- Que hace: `output: 'server'` deja SSR por defecto; `export const prerender = true` activa SSG.
- Por que: el catalogo necesita datos vivos y el admin puede ser una shell estatica.

Reglas por ruta:
- Publico: `/`, `/games`, `/games/[id]` en SSR.
- Admin: `/admin/*` y `/login` en SSG.

## 4) Despliegue unico en Cloudflare Pages

- Para que sirve: evitar dos despliegues separados.
- Que hace: Pages sirve assets estaticos y una Function SSR en el mismo deploy.
- Por que: simplifica la infraestructura sin perder SSR.

## 5) Estructura del proyecto

- Para que sirve: mantener separacion clara entre publico y admin.
- Que hace: `src/pages` separa rutas; `src/components` separa UI; `src/services` encapsula datos.
- Por que: reduce acoplamiento y evita mezclar cliente con servidor.

Convenciones clave:
- `*.client.ts` solo para cliente (admin).
- `*.server.ts` solo para SSR (catalogo).
- Tipos compartidos en `src/types`.

## 6) Supabase y modelo de datos

- Para que sirve: persistencia, auth y storage.
- Que hace: la tabla `games` guarda datos y `product-images` almacena imagenes.
- Por que: Supabase da REST + Auth + Storage con RLS integrada.

Tablas principales:
- `games`: juegos.
- `developers`: desarrolladores.
- `genres`: generos.
- `platforms`: plataformas.

Campos de `games`:
- id, name, description, price, image_url, release_date, developer_id, created_at, updated_at.

Relaciones many to many:
- `game_genres` (game_id, genre_id).
- `game_platforms` (game_id, platform_id).

Storage:
- Bucket: `product-images` (lectura publica).
- Path actual: `{productId}/{timestamp}-{filename}`.

## 7) Seguridad y RLS

- Para que sirve: seguridad real sin backend propio.
- Que hace: RLS bloquea inserciones/updates/deletes a usuarios no autenticados.
- Por que: el HTML del admin es publico en SSG, la seguridad real vive en RLS.

Politicas esperadas:
- SELECT publico (anon y authenticated).
- INSERT/UPDATE/DELETE solo authenticated.
- Storage: lectura publica, escritura y borrado solo authenticated.

## 8) Cliente Supabase

- Para que sirve: controlar contexto de ejecucion.
- Que hace: `supabaseBrowser()` crea un singleton con sesion persistente.
- Por que: el admin trabaja con sesion y refresh automatico en el navegador.

Nota:
- Para SSR del catalogo se usa un cliente sin sesion (cuando exista `supabaseServer`).

## 9) Admin (SSG + cliente)

- Para que sirve: gestionar juegos sin backend propio.
- Que hace: el HTML se genera en build, la logica corre 100% en el navegador.
- Por que: simplifica el admin y reduce carga en server.

Flujos:
- Login: `signInWithPassword` y redireccion a `/admin`.
- Guard: `AuthGuard` revisa sesion y redirige a `/login`.
- CRUD: `products.client.ts` para crear, editar y borrar juegos.
- Upload: `storage.client.ts` valida tipo/tamano y sube al bucket.
- Delete: al borrar juego se intenta borrar su imagen del bucket.
- Relaciones: el formulario sincroniza `game_genres` y `game_platforms`.

## 10) React islands (client only)

- Para que sirve: UI compleja con estado en el admin.
- Que hace: `client:only="react"` monta componentes React solo en el cliente.
- Por que: evita SSR innecesario en el admin y mantiene interaccion rica.

Esto no cambia SSR/SSG por ruta. Solo afecta a la hidratacion en navegador.

## 11) Catalogo publico (SSR)

- Para que sirve: mostrar juegos con datos vivos.
- Que hace: paginas SSR consultan Supabase y renderizan HTML completo.
- Por que: los datos cambian y no se quiere rebuild por cada cambio.

Regla:
- No importar `*.client.ts` ni `supabaseBrowser` en SSR.

## 12) Servicios y tipos

- Para que sirve: encapsular llamadas a datos.
- Que hace: `products.client.ts` y `storage.client.ts` exponen funciones tipadas.
- Por que: evita duplicar logica y centraliza errores.

## 13) Estados de UI y feedback

- Para que sirve: UX clara.
- Que hace: loading, error y success visibles en formularios y tablas.
- Por que: el admin es cliente y debe mostrar el estado de red.

## 14) Variables de entorno

- Para que sirve: configurar Supabase sin hardcode.
- Que hace: `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_ANON_KEY` se leen en cliente.
- Por que: Astro solo expone variables con prefijo PUBLIC_.

Sugerencia:
- Mantener `.env` local y una plantilla `.env.example` en el repo.

## 15) Comandos principales

- Para que sirve: ejecutar el proyecto.
- Que hace: `npm run dev`, `npm run build`, `npm run preview`.
- Por que: flujo clasico de Astro.

## 16) Reglas de oro

- Para que sirve: evitar bugs y riesgos.
- Que hace: define limites entre cliente y servidor.
- Por que: la arquitectura es hibrida y necesita disciplina.

Reglas:
- SSR solo en catalogo.
- SSG solo en admin y login.
- Seguridad real en RLS, no en el HTML.
- No guardar secretos en cliente, solo PUBLIC_.

## 17) Checklist rapido

- Admin con `prerender = true` en todas sus paginas.
- Catalogo con SSR (sin prerender).
- React integrado y islas `client:only="react"`.
- RLS activa en `games` y `storage.objects`.
- Subida de imagen valida tipo y tamano.
- Delete de juego intenta borrar imagen asociada.
- Relaciones guardadas en `game_genres` y `game_platforms`.

Ultima actualizacion: 2026-05-11.
