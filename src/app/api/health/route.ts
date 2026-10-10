import { getDb } from "@/lib/db";
import { getEnv } from "@/lib/env";

// Diagnóstico: confirma que los bindings, variables y la base de datos responden
// (nunca expone valores secretos).
export async function GET() {
  const env = await getEnv();
  const has = (v: unknown) => typeof v === "string" && v.length > 0;

  let db: { ok: boolean; modelos?: number; variantes?: number; error?: string };
  try {
    const prisma = await getDb();
    const [modelos, variantes] = await Promise.all([prisma.modelo.count(), prisma.variante.count()]);
    db = { ok: true, modelos, variantes };
  } catch (e) {
    db = { ok: false, error: e instanceof Error ? e.message : "error desconocido" };
  }

  return Response.json({
    ok: db.ok,
    db,
    r2: typeof env.R2_IMAGES?.get === "function",
    vars: {
      DATABASE_URL: has(env.DATABASE_URL),
      AUTH_SECRET: has(env.AUTH_SECRET),
      AUTH_GOOGLE_ID: has(env.AUTH_GOOGLE_ID),
      AUTH_GOOGLE_SECRET: has(env.AUTH_GOOGLE_SECRET),
      ADMIN_EMAILS: has(env.ADMIN_EMAILS),
      WHATSAPP_NUMBER: has(env.WHATSAPP_NUMBER),
      STORE_NAME: has(env.STORE_NAME),
    },
  });
}
