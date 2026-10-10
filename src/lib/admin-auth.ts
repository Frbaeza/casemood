import { redirect } from "next/navigation";
import { auth, esAdmin } from "@/auth";
import { getEnv } from "@/lib/env";

/** Devuelve el correo del admin con sesión, o null. */
export async function getAdminEmail(): Promise<string | null> {
  const [session, env] = await Promise.all([auth(), getEnv()]);
  const email = session?.user?.email;
  return email && esAdmin(email, env.ADMIN_EMAILS) ? email : null;
}

/** Para páginas del admin: redirige a /admin/entrar si no corresponde. */
export async function requireAdmin(): Promise<string> {
  const email = await getAdminEmail();
  if (!email) redirect("/admin/entrar");
  return email;
}

/** Para Server Actions y rutas API: lanza error si no corresponde. */
export async function assertAdmin(): Promise<string> {
  const email = await getAdminEmail();
  if (!email) throw new Error("No autorizado");
  return email;
}
