"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { IconGoogle } from "@/components/icons";
import { entrarConCorreo, entrarConGoogle } from "../acciones";

function Boton({ children, disabled, className }: { children: React.ReactNode; disabled: boolean; className: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={disabled || pending} className={`${className} disabled:opacity-50`}>
      {pending ? "Un momento…" : children}
    </button>
  );
}

/** Aceptar la política de privacidad habilita las formas de entrar. */
export function OpcionesEntrar({ conCorreo }: { conCorreo: boolean }) {
  const [acepta, setAcepta] = useState(false);

  return (
    <div className="space-y-5">
      <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-2xl bg-surface p-4 text-left text-base">
        <input
          type="checkbox"
          checked={acepta}
          onChange={(e) => setAcepta(e.target.checked)}
          className="mt-0.5 h-6 w-6 shrink-0 accent-brand"
        />
        <span>
          Acepto la{" "}
          <Link href="/privacidad" target="_blank" className="font-semibold text-brand underline underline-offset-4">
            política de privacidad
          </Link>{" "}
          y que la tienda guarde mis datos y compras para mostrármelas aquí.
        </span>
      </label>

      <form action={entrarConGoogle}>
        <Boton
          disabled={!acepta}
          className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border-2 border-line bg-white px-4 text-lg font-semibold text-ink shadow-sm active:bg-cream"
        >
          <IconGoogle className="h-6 w-6" />
          Continuar con Google
        </Boton>
      </form>

      {conCorreo && (
        <>
          <p className="flex items-center gap-3 text-base text-ink-soft before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">
            o con tu correo
          </p>
          <form action={entrarConCorreo} className="space-y-3">
            <label htmlFor="email" className="sr-only">
              Tu correo
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              autoCapitalize="none"
              placeholder="tucorreo@ejemplo.cl"
              className="min-h-14 w-full rounded-2xl border-2 border-line bg-white px-4 text-lg focus:border-brand focus:outline-none"
            />
            <Boton disabled={!acepta} className="min-h-14 w-full rounded-2xl bg-brand px-4 text-lg font-bold text-white">
              Enviarme un link para entrar
            </Boton>
            <p className="text-sm text-ink-soft">Te llega un correo con un botón para entrar, sin contraseña.</p>
          </form>
        </>
      )}

      {!acepta && <p className="text-sm text-ink-soft">Marca la casilla de arriba para continuar.</p>}
    </div>
  );
}
