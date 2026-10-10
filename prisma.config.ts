import { defineConfig } from "prisma/config";

// Las variables locales viven en .dev.vars (formato dotenv, igual que Wrangler).
try {
  process.loadEnvFile(".dev.vars");
} catch {
  // En CI las variables ya vienen en el entorno.
}

/**
 * Las migraciones usan la conexión directa de Neon (sin "-pooler"), como recomienda Neon:
 * PgBouncer en modo transacción no es compatible con los bloqueos que usa `prisma migrate`.
 * La app (Worker) sigue usando la cadena pooled de DATABASE_URL.
 */
function directUrl(): string | undefined {
  const url = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;
  return url?.replace("-pooler.", ".");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: directUrl(),
  },
});
