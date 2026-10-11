import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Revisa tu correo", robots: { index: false } };

export default function RevisaTuCorreoPage() {
  return (
    <div className="space-y-4 pt-8 pb-8 text-center">
      <p aria-hidden className="text-6xl">✉️</p>
      <h1 className="font-display text-3xl leading-tight font-bold">Revisa tu correo</h1>
      <p className="text-lg text-ink-soft">
        Te enviamos un link para entrar. Ábrelo desde este mismo teléfono. Si no lo ves en unos minutos, revisa la carpeta
        de spam o promociones.
      </p>
      <Link href="/cuenta/entrar" className="inline-flex min-h-12 items-center rounded-xl border-2 border-line px-5 font-semibold">
        Pedir otro link
      </Link>
    </div>
  );
}
