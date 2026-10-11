"use client";

import { useActionState, useState } from "react";
import { EDAD_SIN_TUTOR, edad, errorFechaNacimiento } from "@/lib/fecha-nacimiento";
import { completarPerfil, guardarMisDatos } from "./acciones";

const campo =
  "mt-1 min-h-14 w-full rounded-2xl border-2 border-line bg-white px-4 text-lg font-normal focus:border-brand focus:outline-none";

type Props = {
  /** "completar" = primera vez (lleva a la cuenta al guardar); "datos" = Mis datos. */
  modo: "completar" | "datos";
  nombre: string;
  email: string;
  telefono: string;
  /** "AAAA-MM-DD" o "". */
  fechaNacimiento: string;
};

/** Nombre, correo (solo lectura), fecha de nacimiento obligatoria y teléfono opcional. */
export function FormularioPerfil({ modo, nombre, email, telefono, fechaNacimiento }: Props) {
  const [estado, accion, pendiente] = useActionState(modo === "completar" ? completarPerfil : guardarMisDatos, null);
  const [fecha, setFecha] = useState(fechaNacimiento);
  const menor = !errorFechaNacimiento(fecha) && edad(fecha) < EDAD_SIN_TUTOR;

  return (
    <form action={accion} className="space-y-4">
      <label className="block text-base font-semibold">
        Nombre
        <input name="nombre" defaultValue={nombre} required maxLength={80} autoComplete="name" className={campo} />
      </label>

      <label className="block text-base font-semibold">
        Fecha de nacimiento
        <input
          name="fechaNacimiento"
          type="date"
          required
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          autoComplete="bday"
          className={campo}
        />
      </label>

      {menor && (
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-surface p-4 text-base">
          <input type="checkbox" name="autorizaTutor" required className="mt-0.5 h-6 w-6 shrink-0 accent-brand" />
          <span>Tengo menos de 14 años y mi madre, padre o tutor me autoriza a crear esta cuenta.</span>
        </label>
      )}

      {modo === "datos" && (
        <div>
          <p className="text-base font-semibold">Correo</p>
          <p className="mt-1 rounded-2xl bg-surface px-4 py-3 text-lg break-all">{email}</p>
          <p className="mt-1 text-sm text-ink-soft">Es el correo con que entras; no se puede cambiar.</p>
        </div>
      )}

      <label className="block text-base font-semibold">
        Teléfono (opcional)
        <input name="telefono" defaultValue={telefono} inputMode="tel" autoComplete="tel" placeholder="56912345678" className={campo} />
        <span className="mt-1 block text-sm font-normal text-ink-soft">Con código de país, sin + ni espacios.</span>
      </label>

      {estado && (
        <p role="status" className={`rounded-2xl p-3 text-base ${estado.ok ? "bg-brand-soft" : "bg-danger/10 text-danger"}`}>
          {estado.mensaje}
        </p>
      )}
      <button type="submit" disabled={pendiente} className="min-h-14 w-full rounded-2xl bg-brand px-4 text-lg font-bold text-white disabled:opacity-50">
        {pendiente ? "Guardando…" : modo === "completar" ? "Continuar" : "Guardar mis datos"}
      </button>
    </form>
  );
}
