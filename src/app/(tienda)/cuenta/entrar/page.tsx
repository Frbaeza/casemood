import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { getClienteSesion } from "@/lib/cuenta";
import { getEnv } from "@/lib/env";
import { OpcionesEntrar } from "./opciones-entrar";

export const metadata: Metadata = { title: "Entrar a mi cuenta", robots: { index: false } };

const MENSAJES: Record<string, string> = {
  CorreoInvalido: "Revisa tu correo: parece que está mal escrito.",
  Verification: "Ese link ya se usó o venció. Pide uno nuevo.",
  AccessDenied: "No pudimos verificar tu correo de Google. Prueba con otra cuenta o con tu correo.",
  OAuthAccountNotLinked: "Ese correo ya tiene una cuenta. Entra con la misma forma que usaste la primera vez.",
};

export default async function EntrarCuentaPage({ searchParams }: PageProps<"/cuenta/entrar">) {
  if (await getClienteSesion()) redirect("/cuenta");
  const [{ error }, env] = await Promise.all([searchParams, getEnv()]);
  const mensaje = typeof error === "string" ? (MENSAJES[error] ?? "No se pudo entrar. Inténtalo otra vez.") : null;

  return (
    <div className="space-y-5 pt-3 pb-8">
      <BackLink href="/">Volver a la tienda</BackLink>
      <header>
        <h1 className="font-display text-4xl leading-tight font-bold">Mi cuenta</h1>
        <p className="mt-2 text-lg text-ink-soft">Entra para ver todo lo que nos has comprado.</p>
      </header>
      {mensaje && (
        <p role="alert" className="rounded-2xl border-2 border-danger/30 bg-danger/5 p-4 text-base text-danger">
          {mensaje}
        </p>
      )}
      <OpcionesEntrar conCorreo={!!env.AUTH_RESEND_KEY} />
    </div>
  );
}
