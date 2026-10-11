import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { adaptadorClientes } from "@/lib/auth-adapter";
import { getDb } from "@/lib/db";
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

/** Correo con el link para entrar (en español), enviado con la API de Resend. */
async function enviarLinkDeAcceso({ identifier, url, apiKey, from }: { identifier: string; url: string; apiKey: string; from: string }) {
  const tienda = from.replace(/\s*<.*>\s*$/, "").trim() || "la tienda";
  const html = `<!doctype html><html lang="es"><body style="margin:0;background:#f6f4f0;font-family:Arial,Helvetica,sans-serif;color:#23201d">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:440px;background:#ffffff;border-radius:20px" cellpadding="0" cellspacing="0"><tr><td style="padding:28px">
<h1 style="margin:0 0 12px;font-size:24px">Entra a tu cuenta</h1>
<p style="margin:0 0 24px;font-size:17px;line-height:1.5">Toca el botón para entrar a tu cuenta de ${tienda} y ver tus compras.</p>
<a href="${url}" style="display:block;text-align:center;background:#b8461b;color:#ffffff;text-decoration:none;font-size:18px;font-weight:bold;padding:16px;border-radius:14px">Entrar a mi cuenta</a>
<p style="margin:24px 0 0;font-size:14px;line-height:1.5;color:#5b5650">El link sirve una sola vez y vence en 24 horas. Si no pediste entrar, ignora este correo.</p>
</td></tr></table></td></tr></table></body></html>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: identifier,
      subject: `Tu link para entrar a ${tienda}`,
      html,
      text: `Entra a tu cuenta de ${tienda}: ${url}\n\nEl link sirve una sola vez y vence en 24 horas. Si no pediste entrar, ignora este correo.`,
    }),
  });
  if (!res.ok) throw new Error(`Resend respondió ${res.status}: ${await res.text()}`);
}

// Configuración diferida: los secretos y la base se leen de Cloudflare en cada request.
export const { handlers, auth, signIn, signOut } = NextAuth(async () => {
  const [env, db] = await Promise.all([getEnv(), getDb()]);
  const remitente = env.AUTH_EMAIL_FROM || "Casemood <acceso@casemood.cl>";
  return {
    secret: env.AUTH_SECRET,
    trustHost: true,
    adapter: adaptadorClientes(db),
    session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
    providers: [
      Google({
        clientId: env.AUTH_GOOGLE_ID,
        clientSecret: env.AUTH_GOOGLE_SECRET,
        // Google verifica el correo: si la persona entró antes con link al correo, es la misma cuenta.
        allowDangerousEmailAccountLinking: true,
      }),
      // El link al correo se activa cuando existe la clave de Resend.
      ...(env.AUTH_RESEND_KEY
        ? [
            Resend({
              apiKey: env.AUTH_RESEND_KEY,
              from: remitente,
              sendVerificationRequest: ({ identifier, url, provider }) =>
                enviarLinkDeAcceso({ identifier, url, apiKey: provider.apiKey ?? "", from: provider.from ?? remitente }),
            }),
          ]
        : []),
    ],
    pages: { signIn: "/cuenta/entrar", error: "/cuenta/entrar", verifyRequest: "/cuenta/revisa-tu-correo" },
    callbacks: {
      // Google: solo correos verificados. Link al correo: el correo queda verificado al usarlo.
      signIn({ account, profile }) {
        if (account?.provider === "google") return profile?.email_verified === true;
        return true;
      },
    },
  };
});
