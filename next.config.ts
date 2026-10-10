import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // Cache Components queda desactivado: todo el catálogo se lee de la base de datos
  // en cada request y así evitamos depender de una caché incremental en R2.
  cacheComponents: false,
  // Las imágenes vienen ya comprimidas desde el admin y se sirven desde /img/[key].
  images: { unoptimized: true },
  // Next marca @prisma/client como externo y OpenNext tendría que crear symlinks para él
  // (fallan en Windows con EPERM). Empaquetado, solo entra su runtime para Workers.
  transpilePackages: ["@prisma/client"],
  // El rastreo de archivos arrastra el CLI de Prisma, Studio, PGlite y los WASM de todos los
  // motores (≈15 MiB). El Worker solo usa el compilador "small" de Postgres que genera Prisma
  // en src/generated, así que se excluye todo lo demás.
  outputFileTracingExcludes: {
    "*": [
      "node_modules/prisma/**",
      "node_modules/@prisma/{dev,studio-core,streams-local,fetch-engine,engines,engines-version,get-platform,config,query-plan-executor}/**",
      "node_modules/@electric-sql/**",
      "node_modules/@prisma/client/**/*.wasm",
      // next/og (resvg + yoga, ≈1.5 MiB): no generamos imágenes OG, usamos las fotos del producto.
      "node_modules/next/dist/compiled/@vercel/og/**",
    ],
  },
  // Una sola dirección oficial: www.casemood.cl -> casemood.cl (mejor para Google y links compartidos).
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.casemood.cl" }],
        destination: "https://casemood.cl/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

// Expone los bindings de Cloudflare (R2, variables) también durante `next dev`.
initOpenNextCloudflareForDev();
