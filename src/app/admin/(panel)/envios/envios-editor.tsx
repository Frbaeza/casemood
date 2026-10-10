"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { AgregarForm } from "@/components/admin/inline-forms";
import { useAccion } from "@/components/admin/use-accion";
import { formatCLP } from "@/lib/format";
import { TALLAS } from "@/lib/envios";
import { asignarZona, crearZona, type DatosZona, eliminarZona, guardarZona } from "./actions";

type Zona = DatosZona & { id: number; regiones: number };
type Region = { id: number; nombre: string; zonaId: number | null };

const campo = "min-h-12 w-full rounded-xl border-2 border-line bg-white px-3 text-base focus:border-brand focus:outline-none";
const CLAVES = {
  punto: { XS: "puntoXS", S: "puntoS", M: "puntoM", L: "puntoL" },
  domicilio: { XS: "domicilioXS", S: "domicilioS", M: "domicilioM", L: "domicilioL" },
} as const;

/** Tarjeta editable de una zona: nombre y los 8 precios. */
function ZonaCard({ zona, onEliminar }: { zona: Zona; onEliminar: () => void }) {
  const { ejecutar, pendiente } = useAccion();
  const [d, setD] = useState<DatosZona>(() => ({
    nombre: zona.nombre,
    puntoXS: zona.puntoXS,
    puntoS: zona.puntoS,
    puntoM: zona.puntoM,
    puntoL: zona.puntoL,
    domicilioXS: zona.domicilioXS,
    domicilioS: zona.domicilioS,
    domicilioM: zona.domicilioM,
    domicilioL: zona.domicilioL,
  }));
  const set = <K extends keyof DatosZona>(k: K, v: DatosZona[K]) => setD((prev) => ({ ...prev, [k]: v }));
  const precioInput = (k: keyof typeof d, etiqueta: string) => (
    <input
      aria-label={etiqueta}
      inputMode="numeric"
      pattern="[0-9]*"
      value={String(d[k])}
      onChange={(e) => set(k, Number(e.target.value.replace(/\D/g, "")) as never)}
      className="min-h-12 w-full rounded-lg border-2 border-line bg-white px-1.5 text-center text-base focus:border-brand focus:outline-none"
    />
  );

  return (
    <li className="space-y-3 rounded-3xl bg-white p-4 shadow-sm">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-display text-xl font-bold">{zona.nombre}</p>
        <p className="shrink-0 text-sm text-ink-soft">
          {zona.regiones} {zona.regiones === 1 ? "región" : "regiones"}
        </p>
      </div>

      <label className="block text-sm font-semibold">
        Nombre
        <input value={d.nombre} onChange={(e) => set("nombre", e.target.value)} className={`${campo} mt-1`} />
      </label>

      <div className="overflow-hidden rounded-2xl border-2 border-line">
        <div className="grid grid-cols-[5.5rem_repeat(2,1fr)] items-center gap-1 bg-surface p-2 text-center text-sm font-bold">
          <span />
          {TALLAS.map((t) => (
            <span key={t.clave} title={t.ayuda}>
              {t.clave}
            </span>
          ))}
        </div>
        {(["punto", "domicilio"] as const).map((tipo) => (
          <div key={tipo} className="grid grid-cols-[5.5rem_repeat(2,1fr)] items-center gap-1 p-2">
            <span className="text-sm font-semibold">{tipo === "punto" ? "Punto Blue" : "Domicilio"}</span>
            {TALLAS.map((t) => (
              <div key={t.clave}>{precioInput(CLAVES[tipo][t.clave], `${tipo} talla ${t.clave}`)}</div>
            ))}
          </div>
        ))}
      </div>
      <p className="text-xs text-ink-soft">
        Ej. talla XS: Punto {formatCLP(d.puntoXS)} · Domicilio {formatCLP(d.domicilioXS)}. Precios en pesos, sin puntos.
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={pendiente}
          onClick={() => ejecutar(() => guardarZona(zona.id, d))}
          className="min-h-12 flex-1 rounded-xl bg-brand px-4 font-semibold text-white disabled:opacity-50"
        >
          {pendiente ? "Guardando…" : "Guardar tarifas"}
        </button>
        <button
          type="button"
          onClick={onEliminar}
          className="min-h-12 rounded-xl border-2 border-danger/30 px-3 text-sm font-semibold text-danger"
        >
          Eliminar
        </button>
      </div>
    </li>
  );
}

export function EnviosEditor({ zonas, regiones }: { zonas: Zona[]; regiones: Region[] }) {
  const { ejecutar, pendiente } = useAccion();
  const [eliminar, setEliminar] = useState<Zona | null>(null);

  return (
    <div className="mt-4 space-y-6">
      <section className="rounded-3xl bg-white p-4 shadow-sm">
        <h2 className="font-display text-xl font-bold">Zona de cada región</h2>
        <p className="mb-3 text-sm text-ink-soft">
          Si eliges “No mostrar”, esa región no aparece en el cotizador.
        </p>
        <ul className="divide-y divide-line">
          {regiones.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 py-2">
              <span className="min-w-0 text-base font-semibold">{r.nombre}</span>
              <select
                aria-label={`Zona de ${r.nombre}`}
                value={r.zonaId ?? ""}
                disabled={pendiente}
                onChange={(e) =>
                  ejecutar(() => asignarZona(r.id, e.target.value ? Number(e.target.value) : null), { silenciosa: true })
                }
                className="min-h-12 w-44 shrink-0 rounded-xl border-2 border-line bg-white px-2 text-base"
              >
                <option value="">No mostrar</option>
                {zonas.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.nombre}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-display text-xl font-bold">Zonas y tarifas</h2>
        <ul className="space-y-3">
          {zonas.map((z) => (
            // key con los valores guardados: al refrescar, la tarjeta toma los datos nuevos.
            <ZonaCard key={`${z.id}-${JSON.stringify(z)}`} zona={z} onEliminar={() => setEliminar(z)} />
          ))}
        </ul>
        <div className="mt-3 rounded-3xl bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-base font-bold">Agregar zona</h3>
          <AgregarForm
            placeholder="Ej: Zona Isla de Pascua"
            boton="Agregar"
            disabled={pendiente}
            onAgregar={(n) => ejecutar(() => crearZona(n))}
          />
        </div>
      </section>

      <ConfirmDialog
        abierto={!!eliminar}
        titulo={`¿Eliminar “${eliminar?.nombre}”?`}
        confirmar="Sí, eliminar"
        peligro
        ocupado={pendiente}
        onConfirmar={() => {
          if (!eliminar) return;
          const id = eliminar.id;
          ejecutar(() => eliminarZona(id), { alTerminar: () => setEliminar(null) });
        }}
        onCerrar={() => setEliminar(null)}
      >
        {eliminar?.regiones
          ? "Antes, asigna otra zona a las regiones que la usan."
          : "Esto no se puede deshacer."}
      </ConfirmDialog>
    </div>
  );
}
