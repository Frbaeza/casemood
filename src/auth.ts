import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { getEnv } from "@/lib/env";

/** Correos con acceso al admin (ADMIN_EMAILS, separados por coma). */
export function esAdmin(email: string | null | undefined, adminEmails: string | undefined): boolean {
  if (!email) return false;
  const lista = (adminEmails ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return lista.includes(email.trim().toLowerCase());
}

// Configuración diferida: los secretos se leen de Cloudflare en cada request.
export const { handlers, auth, signIn, signOut } = NextAuth(async () => {
  const env = await getEnv();
  return {
    secret: env.AUTH_SECRET,
    trustHost: true,
    session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
    providers: [Google({ clientId: env.AUTH_GOOGLE_ID, clientSecret: env.AUTH_GOOGLE_SECRET })],
    pages: { signIn: "/admin/entrar", error: "/admin/entrar" },
    callbacks: {
      // Solo entran correos verificados que estén en ADMIN_EMAILS.
      signIn({ profile }) {
        return profile?.email_verified === true && esAdmin(profile.email, env.ADMIN_EMAILS);
      },
    },
  };
});
