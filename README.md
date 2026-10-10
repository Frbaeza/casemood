| `/admin/envios` | Tarifas de envío por zona (Punto Blue Express y domicilio, tallas XS–L) y zona de cada región. Alimenta “¿Cuánto cuesta el envío?” del footer. Valores iniciales: `npm run db:seed-envios`. |
# Casemood

Catálogo web mobile-first de accesorios para iPhone, con panel de administración.

- **Next.js 16.3** (App Router, TypeScript) + **Tailwind CSS 4**
- **Cloudflare Workers** con [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare)
- **Neon (PostgreSQL)** con **Prisma 7** y `@prisma/adapter-neon` (cliente creado por request)
- **Cloudflare R2** para imágenes, servidas desde `/img/[key]`
- **Auth.js (next-auth v5)** con Google, restringido a `ADMIN_EMAILS`

## Requisitos

- Node.js 22 o superior (probado con 24 LTS)
- Una cuenta de Cloudflare (plan gratuito sirve) y una base de datos en [Neon](https://neon.tech)

## Variables de entorno

En local se leen desde `.dev.vars` (copia `.dev.vars.example`). En producción:

| Variable | Tipo | Descripción |
|---|---|---|
| `DATABASE_URL` | secreto | Cadena de conexión de Neon (la *pooled*, con `sslmode=require`). |
| `AUTH_SECRET` | secreto | Secreto de Auth.js. Genéralo con `npx auth secret`. |
| `AUTH_GOOGLE_ID` | secreto | Client ID de OAuth de Google. |
| `AUTH_GOOGLE_SECRET` | secreto | Client secret de OAuth de Google. |
| `ADMIN_EMAILS` | secreto | Correos con acceso a `/admin`, separados por coma. |
| `WHATSAPP_NUMBER` | var | Número en formato internacional sin `+` (ej. `56912345678`). |
| `STORE_NAME` | var | Nombre de la tienda (por defecto `Casemood`). |

`WHATSAPP_NUMBER` y `STORE_NAME` están en `vars` dentro de `wrangler.jsonc`. Los secretos se cargan así:

```bash
npx wrangler secret put DATABASE_URL
```

(repite para `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` y `ADMIN_EMAILS`).

## Desarrollo local

```bash
npm install                      # también ejecuta `prisma generate`
cp .dev.vars.example .dev.vars   # y completa los valores
npm run db:deploy                # aplica las migraciones en Neon
npm run db:seed                  # carga "Carcasas" y los iPhone 11 a 16
npm run dev                      # Next.js en Node, con bindings de Cloudflare simulados
```

## Base de datos (Prisma + Neon)

- Schema: `prisma/schema.prisma`. Migraciones: `prisma/migrations`.
- `prisma.config.ts` lee `.dev.vars` y usa la conexión **directa** de Neon (quita `-pooler`)
  para migrar; la app usa la conexión **pooled** de `DATABASE_URL`.
- Se generan dos clientes (carpeta `src/generated`, ignorada por git):
  - `prisma`: runtime `workerd` con compilador `small`, el que usa la app (`src/lib/db.ts`).
  - `prisma-node`: runtime Node, solo para `prisma/seed.ts`.
- El cliente se crea por request (`getDb()`), nunca global.

| Script | Qué hace |
|---|---|
| `npm run db:migrate` | Crea una migración nueva tras cambiar el schema (desarrollo). |
| `npm run db:deploy` | Aplica migraciones pendientes (producción / otra base). |
| `npm run db:seed` | Carga los datos iniciales. Se puede repetir sin duplicar. |
| `npm run db:studio` | Abre Prisma Studio para ver/editar datos. |
| `npm run demo:crear` | Crea 5 productos de prueba (`demo-…`) y sube sus imágenes al R2 **local**. |
| `npm run demo:borrar` | Elimina los productos de prueba. **Hazlo antes de publicar.** |

## Importar desde Glide

El catálogo inicial se migró desde la app anterior en Glide con `prisma/importar-glide.ts`.

1. En Glide → Data → tabla **Items** → **Export** (columnas Row ID, Name, Image, Precio, Category).
2. Copia `Items.csv` a `.glide-import/` (carpeta ignorada por git).
3. `npm run importar:glide` simula y muestra qué haría; `npm run importar:glide -- --aplicar` importa.

Qué hace: convierte la columna `Category` de Glide en categoría + compatibilidad
(ej. "iPhone 13/14" → Carcasas para iPhone 13 y 14; "Tazas personalizadas" → categoría propia, universal),
descarga cada foto, la convierte a WebP ≤1200 px con `sharp`, la sube a R2 (producción y local) con
`wrangler r2 bulk put` y crea los productos. Es idempotente (key fija `p/glide-<rowid>.webp`).
Se omiten a propósito la categoría "3x $10.000" (promo) y las filas sin categoría.

## Catálogo público (rutas)

| Ruta | Qué muestra |
|---|---|
| `/` | Buscador con "Filtros", cuadrados de categorías con foto ("¿Qué estás buscando?"), variante recordada y destacados. |
| `/modelo/[slug]` | Variantes del modelo como botones grandes. |
| `/modelo/[slug]/[variante]` | Productos compatibles y disponibles + universales; chips `?categoria=`. |
| `/producto/[slug]` | Carrusel, precio, descripción, compatibilidad y botón de WhatsApp. `?v=<id>` preselecciona la variante. |
| `/categoria/[slug]` | Si la categoría depende del modelo (ej. Carcasas): "¿Qué iPhone tienes?" y luego todas. Si no: todos sus productos. 48 por página (`?pagina=`). |
| `/buscar?q=` | Búsqueda por nombre (todas las palabras); chips `&categoria=` si hay resultados en varias categorías. |
| `/img/[...key]` | Imagen desde R2 con `Cache-Control: public, max-age=31536000, immutable`. |

La variante elegida se guarda en `localStorage` (`casemood:variante`) para ofrecer "Ver productos"
al volver al inicio y para prellenar el mensaje de WhatsApp.

## Panel de administración (`/admin`)

| Ruta | Qué hace |
|---|---|
| `/admin/entrar` | Inicio de sesión con Google. Solo entran correos de `ADMIN_EMAILS`. |
| `/admin/productos` | Lista con buscador y filtro por categoría; botón "+ Nuevo producto". |
| `/admin/productos/nuevo`, `/admin/productos/[id]` | Formulario: fotos (cámara/galería, WebP ≤1200 px, ↑↓, quitar), datos, compatibilidad por modelo con "Disponible", eliminar. |
| `/admin/modelos` | Modelos y variantes: crear, renombrar, mostrar/ocultar, ↑↓, eliminar (si tiene productos, ofrece ocultar). |
| `/admin/categorias` | Crear, renombrar, ↑↓, eliminar (bloqueado si tiene productos). |
| `POST /api/admin/imagenes` | Sube una foto a R2 (`p/<uuid>.webp`); la asocia al producto al guardar. |

Seguridad en tres capas:
1. `src/middleware.ts`: si no hay cookie de sesión, redirige a `/admin/entrar` (o 401 en `/api/admin`).
2. `requireAdmin()` en el layout del panel: verifica el token y que el correo esté en `ADMIN_EMAILS`.
3. `assertAdmin()` en cada Server Action y en la API de imágenes.

### Google OAuth

En [Google Cloud Console](https://console.cloud.google.com) → Google Auth Platform → **Clientes** → el cliente web
"Casemood web". Debe tener:

- **Orígenes autorizados**: `http://localhost:8787`, `http://localhost:3000` y el dominio de producción.
- **URIs de redireccionamiento**: `<origen>/api/auth/callback/google` para cada origen.
- **Público**: en modo "Prueba", agrega los correos de admin en **Usuarios de prueba**.

El login del admin no funciona desde una IP de red local (`192.168.x.x`): Google solo acepta
`localhost` o dominios reales.

## Probar en el runtime de Workers

Para probar en el runtime real de Workers (workerd) antes de publicar:

```bash
npm run preview                  # http://localhost:8787
```

`/api/health` indica si los bindings y variables están presentes (sin mostrar sus valores).

Si cambias `wrangler.jsonc` o agregas variables, regenera los tipos:

```bash
npm run cf-typegen
```

## Deploy

1. Crea el bucket de R2 (una sola vez): `npx wrangler r2 bucket create casemood-imagenes`
2. Carga los secretos (ver arriba).
3. `npm run deploy`

Revisa el tamaño del Worker con `npx wrangler deploy --dry-run --outdir .wrangler/dryrun`.
El plan gratuito permite **3 MiB comprimido** (gzip).

## Decisiones técnicas

- **Next.js fijado en 16.3.8**: `@opennextjs/cloudflare` 1.20.10 todavía no soporta 16.4
  (el Worker falla con `Unexpected loadManifest(/.next/server/preview-props.json)`).
  Actualiza Next solo cuando OpenNext declare soporte para la nueva versión.
- **`middleware.ts` en vez de `proxy.ts`**: en Next 16 `proxy` corre en Node y OpenNext lo empaqueta
  aparte (experimental), subiendo el Worker a ~4 MiB. `middleware.ts` (edge) sigue soportado aunque
  Next avise que está obsoleto; hace solo un chequeo optimista del cookie (sin importar Auth.js).
- **`"minify": true` en `wrangler.jsonc`**: OpenNext no minifica el servidor; con esto el Worker
  queda en ≈2,4 MiB gzip con el admin completo.
- **Tamaño del Worker**: `next.config.ts` empaqueta `@prisma/client`
  (`transpilePackages`, evita symlinks que fallan en Windows) y excluye del rastreo el CLI de Prisma,
  PGlite, los WASM de otros motores y `next/og`. Si agregas `next/og` u otra librería pesada, vuelve a
  medir con el dry-run.
- **`cacheComponents: false`** y `dynamic = "force-dynamic"` en el layout: el catálogo se lee de la
  base de datos en cada request, sin caché incremental.
- **Imágenes sin optimizar por Next** (`images.unoptimized`): se comprimen a WebP en el navegador
  al subirlas desde el admin y se sirven desde R2 con caché larga.
- **Windows**: OpenNext advierte que no es 100 % compatible con Windows. Funciona en este proyecto,
  pero si aparece un error raro al compilar, usa WSL o despliega desde CI (GitHub Actions).
- **npm `allowScripts`**: npm 11 bloquea los scripts de instalación por defecto; los paquetes
  aprobados (esbuild, workerd, prisma) están listados en `package.json`.
