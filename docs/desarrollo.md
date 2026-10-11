# Guía de desarrollo

Detalles para correr, desplegar y mantener Casemood. Para una visión general, ver el [README](../README.md).

## Requisitos

- Node.js 22 o superior (probado con 24 LTS)
- Una cuenta de Cloudflare (el plan gratuito sirve) y una base de datos en [Neon](https://neon.tech)

## Variables de entorno

En local se leen desde `.dev.vars` (copia `.dev.vars.example`). En producción:

| Variable | Tipo | Descripción |
|---|---|---|
| `DATABASE_URL` | secreto | Cadena de conexión de Neon (la *pooled*, con `sslmode=require`). |
| `AUTH_SECRET` | secreto | Secreto de Auth.js. Genéralo con `npx auth secret`. |
| `AUTH_GOOGLE_ID` | secreto | Client ID de OAuth de Google. |
| `AUTH_GOOGLE_SECRET` | secreto | Client secret de OAuth de Google. |
| `ADMIN_EMAILS` | secreto | Correos con acceso a `/admin`, separados por coma. |
| `AUTH_RESEND_KEY` | secreto | Clave de [Resend](https://resend.com) para el link de acceso por correo de los clientes. Sin ella, los clientes entran solo con Google. |
| `AUTH_EMAIL_FROM` | var/secreto | Remitente de ese correo (por defecto `Casemood <acceso@casemood.cl>`; el dominio debe estar verificado en Resend). |
| `WHATSAPP_NUMBER` | secreto | Número de la tienda en formato internacional sin `+` (ej. `56912345678`). |
| `STORE_NAME` | var | Nombre de la tienda (en `wrangler.jsonc`). |
| `INSTAGRAM_USERNAME` | var | Usuario de Instagram sin `@` (en `wrangler.jsonc`). |

Nombre, WhatsApp e Instagram se pueden cambiar después en admin → Tienda (tabla `Configuracion`); estas variables
quedan como valores de respaldo mientras no se guarde nada ahí.

Los secretos se cargan en Cloudflare así (repite para cada uno):

```bash
npx wrangler secret put DATABASE_URL
```

## Desarrollo local

```bash
npm install                      # también ejecuta `prisma generate`
cp .dev.vars.example .dev.vars   # y completa los valores
npm run db:deploy                # aplica las migraciones en Neon
npm run db:seed                  # carga categorías y modelos de iPhone
npm run db:seed-envios           # carga las zonas y tarifas de envío iniciales
npm run dev                      # Next.js en Node, con bindings de Cloudflare simulados
```

Para probar en el runtime real de Workers (workerd) antes de publicar:

```bash
npm run preview                  # http://localhost:8787
```

`/api/health` indica si los bindings y variables están presentes (sin mostrar sus valores). Si cambias
`wrangler.jsonc` o agregas variables, regenera los tipos con `npm run cf-typegen`.

## Base de datos (Prisma + Neon)

- Schema: `prisma/schema.prisma`. Migraciones: `prisma/migrations`.
- `prisma.config.ts` lee `.dev.vars` y usa la conexión **directa** de Neon (quita `-pooler`) para migrar; la app usa la
  conexión **pooled** de `DATABASE_URL`.
- Se generan dos clientes (carpeta `src/generated`, ignorada por git):
  - `prisma`: runtime `workerd` con compilador `small`, el que usa la app (`src/lib/db.ts`).
  - `prisma-node`: runtime Node, para los scripts de `prisma/`.
- El cliente se crea por request (`getDb()`), nunca global.

| Script | Qué hace |
|---|---|
| `npm run db:migrate` | Crea una migración nueva tras cambiar el schema (desarrollo). |
| `npm run db:deploy` | Aplica migraciones pendientes (producción u otra base). |
| `npm run db:seed` | Carga los datos iniciales. Se puede repetir sin duplicar. |
| `npm run db:seed-envios` | Crea las zonas de envío y las regiones si faltan (no pisa lo editado en el admin). |
| `npm run db:studio` | Abre Prisma Studio para ver y editar datos. |
| `npm run demo:crear` / `demo:borrar` | Crea o elimina productos de prueba (`demo-…`) con imágenes en el R2 local. |

## Importación desde Glide

El catálogo inicial se migró desde la app anterior en Glide con `prisma/importar-glide.ts`.

1. En Glide → Data → tabla **Items** → **Export** (columnas Row ID, Name, Image, Precio, Category).
2. Copia `Items.csv` a `.glide-import/` (carpeta ignorada por git).
3. `npm run importar:glide` simula y muestra qué haría; `npm run importar:glide -- --aplicar` importa.

Convierte la columna `Category` en categoría + compatibilidad (ej. "iPhone 13/14" → Carcasas para iPhone 13 y 14),
descarga cada foto, la convierte a WebP ≤1200 px con `sharp`, la sube a R2 con `wrangler r2 bulk put` y crea los
productos. Es idempotente (key fija `p/glide-<rowid>.webp`).

## Diseña tu carcasa: contornos

Los contornos de `public/carcasas/*.json` se generan desde las plantillas de sublimación (una carpeta por modelo con
`SVG.svg`):

```bash
node scripts/plantillas-carcasas.mjs "D:/Sublimacion/Carcasas"
```

El script toma la forma vertical más grande de cada plantilla (cada una trae 3 copias del contorno), guarda su `path`
y su caja en puntos, y regenera `src/lib/carcasas-disponibles.ts`. Para agregar un modelo, suma su carpeta al mapa
`VARIANTES` del script con el slug de la versión en la tienda.

## Rutas

### Catálogo público

| Ruta | Qué muestra |
|---|---|
| `/` | Buscador con filtros, categorías con foto, acceso a "Diseña tu carcasa" y destacados. |
| `/categoria/[slug]` | Si la categoría depende del modelo (ej. Carcasas): "¿Qué iPhone tienes?" y luego todos sus productos. 48 por página. |
| `/modelo/[slug]` y `/modelo/[slug]/[variante]` | Versiones del modelo y productos compatibles con la versión elegida. |
| `/producto/[slug]` | Fotos, precio, compatibilidad y botón de WhatsApp. `?v=<id>` preselecciona la versión. "Volver" regresa a la página de origen. |
| `/buscar?q=` | Búsqueda por nombre (todas las palabras), con filtro de categoría y orden. |
| `/personaliza` | Diseñador de carcasas personalizadas con vista previa. |
| `/cuenta/entrar` | Crear cuenta o entrar (Google o link al correo), aceptando la política de privacidad. |
| `/cuenta` | “Mis compras”: las ventas registradas a nombre del cliente. |
| `/privacidad` | Política de privacidad. |
| `/img/[...key]` | Imagen desde R2 con `Cache-Control: public, max-age=31536000, immutable`. |

### Panel de administración

| Ruta | Qué hace |
|---|---|
| `/admin/entrar` | Inicio de sesión con Google. Solo entran correos de `ADMIN_EMAILS`. |
| `/admin/ventas` | Resumen (hoy, 7 días, mes, ticket promedio, lo más vendido) e historial. |
| `/admin/ventas/nueva` | Registrar una venta: cliente con cuenta (búsqueda por exactitud) o “Cliente genérico”; productos por categoría → iPhone → foto; cantidad, precio, descuento, medio de pago y canal. Descuenta stock. |
| `/admin/ventas/[id]` | Detalle: reasignar cliente y anular (devuelve el stock). |
| `/admin/clientes` | Clientes con cuenta: total comprado e historial. |
| `/admin/productos` | Cuadrícula con buscador, filtro por categoría y por modelo de iPhone, y paginación. |
| `/admin/productos/nuevo`, `/admin/productos/[id]` | Fotos (cámara o galería, WebP ≤1200 px), datos, compatibilidad por modelo con disponibilidad. |
| `/admin/modelos` | Modelos y versiones: crear, renombrar, mostrar u ocultar, ordenar, eliminar. |
| `/admin/categorias` | Crear, renombrar, ordenar, foto de portada, eliminar (bloqueado si tiene productos). |
| `/admin/envios` | Tarifas por zona (Punto Blue Express y domicilio, tallas XS y S) y zona de cada región. |
| `/admin/tienda` | Logo, color principal (6 paletas, naranjo por defecto), nombre y frase, WhatsApp e Instagram, aviso destacado, mostrar u ocultar el cotizador y el diseñador, y comuna de origen de los envíos. |
| `POST /api/admin/imagenes` | Sube una foto a R2 (`p/<uuid>.webp`). |

Seguridad en tres capas:

1. `src/middleware.ts`: sin cookie de sesión, redirige a `/admin/entrar` (o responde 401 en `/api/admin`).
2. `requireAdmin()` en el layout del panel: verifica el token y que el correo esté en `ADMIN_EMAILS`.
3. `assertAdmin()` en cada Server Action y en la API de imágenes.

### Google OAuth

En [Google Cloud Console](https://console.cloud.google.com) → Google Auth Platform → **Clientes**, el cliente web debe
tener como orígenes autorizados `http://localhost:3000`, `http://localhost:8787` y el dominio de producción, y como
URI de redireccionamiento `<origen>/api/auth/callback/google` para cada uno. Google no acepta IPs de red local
(`192.168.x.x`) para el login.

## Despliegue

1. Crea el bucket de R2 (una sola vez): `npx wrangler r2 bucket create casemood-imagenes`
2. Carga los secretos (ver arriba).
3. `npm run deploy`

Para revisar el tamaño del Worker: `npx wrangler deploy --dry-run --outdir .wrangler/dryrun`. El plan gratuito permite
**3 MiB comprimido** y 10 ms de CPU por request; con tráfico real conviene el plan Workers Paid.

## Decisiones técnicas

- **Next.js fijado en 16.3.8**: `@opennextjs/cloudflare` 1.20.10 todavía no soporta 16.4. Actualiza Next solo cuando
  OpenNext declare soporte para la nueva versión.
- **`middleware.ts` en vez de `proxy.ts`**: en Next 16 `proxy` corre en Node y OpenNext lo empaqueta aparte, subiendo
  el Worker a ~4 MiB. `middleware.ts` (edge) hace solo un chequeo optimista de la cookie.
- **`"minify": true` en `wrangler.jsonc`**: OpenNext no minifica el servidor; con esto el Worker queda en ≈2,4 MiB gzip.
- **Tamaño del Worker**: `next.config.ts` empaqueta `@prisma/client` (`transpilePackages`, evita symlinks que fallan
  en Windows) y excluye del rastreo el CLI de Prisma, PGlite, los WASM de otros motores y `next/og`.
- **`cacheComponents: false`** y `dynamic = "force-dynamic"`: el catálogo se lee de la base de datos en cada request.
- **Imágenes sin optimizar por Next** (`images.unoptimized`): se comprimen a WebP en el navegador al subirlas y se
  sirven desde R2 con caché larga. Las fotos de producto se muestran en proporción 3:4.
- **Windows**: OpenNext advierte que no es 100 % compatible con Windows. Funciona en este proyecto, pero si aparece un
  error raro al compilar, usa WSL o despliega desde CI.
- **npm `allowScripts`**: npm 11 bloquea los scripts de instalación por defecto; los paquetes aprobados (esbuild,
  workerd, prisma) están listados en `package.json`.
