import { cache } from "react";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma/client";
import { getEnv } from "@/lib/env";

/**
 * Cliente Prisma para el request actual.
 * En Workers no se puede reutilizar una conexión entre requests, por eso no hay cliente global;
 * `cache` lo comparte solo dentro del mismo render de servidor.
 */
export const getDb = cache(async (): Promise<PrismaClient> => {
  const env = await getEnv();
  const adapter = new PrismaNeon({ connectionString: env.DATABASE_URL });
  return new PrismaClient({ adapter });
});
