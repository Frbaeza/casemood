import { cache } from "react";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";

/** Cliente con sesión iniciada en la tienda (o null). */
export const getClienteSesion = cache(async () => {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) return null;
  const db = await getDb();
  return db.cliente.findUnique({
    where: { email },
    select: { id: true, nombre: true, email: true, creadoEn: true },
  });
});
