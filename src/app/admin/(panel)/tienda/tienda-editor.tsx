"use client";

import { useRef, useState } from "react";
import { Toggle } from "@/components/admin/toggle";
import { toast } from "@/components/admin/toaster";
import { useAccion } from "@/components/admin/use-accion";
import { imgUrl } from "@/lib/format";
import { subirImagen } from "@/lib/subir-imagen";
import { LOGO_ORIGINAL, PALETA_POR_DEFECTO, PALETAS, paleta, type ClavePaleta } from "@/lib/tienda";
import { type DatosTienda, guardarTienda } from "./actions";

type Datos = Omit<DatosTienda, "color"> & { color: ClavePaleta };

const campo =
  "mt-1 min-h-12 w-full rounded-xl border-2 border-line bg-white px-3 text-base font-normal focus:border-brand focus:outline-none";
const tarjeta = "space-y-3 rounded-3xl bg-white p-4 shadow-sm";
const titulo = "font-display text-xl font-bold";

export function TiendaEditor({ inicial }: { inicial: Datos }) {
  const { ejecutar, pendiente } = useAccion();
  const [d, setD] = useState<Datos>(inicial);
  const [subiendo, setSubiendo] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const archivo = useRef<HTMLInputElement>(null);
  const set = <K extends keyof Datos>(k: K, v: Datos[K]) => setD((prev) => ({ ...prev, [k]: v }));

  const p = paleta(d.color);
  const logo = d.logoKey ? imgUrl(d.logoKey) : LOGO_ORIGINAL;
  const hayCambios = JSON.stringify(d) !== JSON.stringify(inicial);

  async function alElegirLogo(f: File | undefined) {
    if (!f) return;
    setSubiendo(true);
    try {
      set("logoKey", await subirImagen(f));
    } catch (e) {
      toast(e instanceof Error ? e.message : "No se pudo subir el logo.", "error");
    } finally {
      setSubiendo(false);
    }
  }

  function guardar() {
    setErrores({});
    ejecutar(() => guardarTienda(d), { alTerminar: (r) => setErrores(r.errores ?? {}) });
  }

  const error = (k: string) =>
    errores[k] && (
      <span role="alert" className="mt-1 block text-sm font-normal text-danger">
        {errores[k]}
      </span>
    );

  return (
    <div className="mt-4 space-y-5">
      {/* Vista previa del encabezado con los cambios aún sin guardar */}
      <section aria-label="Vista previa" className="overflow-hidden rounded-3xl border-2 border-line bg-white shadow-sm">
        <p className="bg-surface px-4 py-2 text-sm font-semibold text-ink-soft">Vista previa</p>
        {d.avisoActivo && d.avisoTexto.trim() && (
          <p className="px-4 py-2 text-center text-sm font-semibold text-white" style={{ background: p.brand }}>
            {d.avisoTexto}
          </p>
        )}
        <div className="flex items-center gap-3 bg-cream px-4 py-3" style={{ borderBottom: `4px solid ${p.orange}` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt="" width={52} height={52} className="h-13 w-13 shrink-0 rounded-2xl bg-cream object-cover" />
          <span className="min-w-0 leading-none">
            <span className="block truncate font-display text-2xl font-bold" style={{ color: p.orange }}>
              {d.nombre || "Nombre"}
            </span>
            <span className="mt-0.5 block truncate text-sm text-ink-soft">{d.frase || "Frase"}</span>
          </span>
        </div>
        <div className="flex gap-2 p-4">
          <span className="flex min-h-12 flex-1 items-center justify-center rounded-xl px-3 font-semibold text-white" style={{ background: p.brand }}>
            Botón
          </span>
          <span
            className="flex min-h-12 flex-1 items-center justify-center rounded-xl px-3 font-semibold"
            style={{ background: p.brandSoft, color: p.brand }}
          >
            Destacado
          </span>
        </div>
      </section>

      <section className={tarjeta}>
        <h2 className={titulo}>Logo</h2>
        <div className="flex items-center gap-4">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-3xl border-2 border-line bg-cream">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt="Logo actual" className="h-full w-full object-cover" />
            {subiendo && (
              <span className="absolute inset-0 flex items-center justify-center bg-white/75 text-sm font-semibold">Subiendo…</span>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-sm text-ink-soft">Imagen cuadrada, idealmente con fondo. Se ve en el encabezado, el pie y la pestaña del navegador.</p>
            <button
              type="button"
              disabled={subiendo}
              onClick={() => archivo.current?.click()}
              className="flex min-h-12 w-full items-center justify-center rounded-xl border-2 border-dashed border-brand bg-brand-soft px-3 font-semibold text-brand disabled:opacity-50"
            >
              Cambiar logo
            </button>
            {d.logoKey && (
              <button
                type="button"
                onClick={() => set("logoKey", null)}
                className="min-h-12 w-full rounded-xl border-2 border-line px-3 text-base font-semibold"
              >
                Usar el logo original
              </button>
            )}
          </div>
        </div>
        <input
          ref={archivo}
          type="file"
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            alElegirLogo(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </section>

      <section className={tarjeta}>
        <h2 className={titulo}>Color principal</h2>
        <p className="text-sm text-ink-soft">Botones, encabezado y pie de página. Todos se leen bien con texto blanco.</p>
        <div role="radiogroup" aria-label="Color principal" className="grid grid-cols-2 gap-2">
          {(Object.keys(PALETAS) as ClavePaleta[]).map((clave) => {
            const c = PALETAS[clave];
            const activo = d.color === clave;
            return (
              <button
                key={clave}
                type="button"
                role="radio"
                aria-checked={activo}
                onClick={() => set("color", clave)}
                className={`flex min-h-14 items-center gap-3 rounded-2xl border-2 px-3 text-left text-base font-semibold ${
                  activo ? "border-ink bg-surface" : "border-line bg-white"
                }`}
              >
                <span aria-hidden className="flex shrink-0 overflow-hidden rounded-full border-2 border-white shadow">
                  <span className="h-8 w-4" style={{ background: c.orange }} />
                  <span className="h-8 w-4" style={{ background: c.brand }} />
                </span>
                <span className="min-w-0 leading-tight">
                  {c.nombre}
                  {activo && <span className="block text-sm font-normal text-ink-soft">Elegido</span>}
                </span>
              </button>
            );
          })}
        </div>
        {d.color !== PALETA_POR_DEFECTO && (
          <button
            type="button"
            onClick={() => set("color", PALETA_POR_DEFECTO)}
            className="min-h-12 w-full rounded-xl border-2 border-line px-3 text-base font-semibold"
          >
            Volver al naranjo original
          </button>
        )}
      </section>

      <section className={tarjeta}>
        <h2 className={titulo}>Nombre y frase</h2>
        <label className="block text-base font-semibold">
          Nombre de la tienda
          <input value={d.nombre} onChange={(e) => set("nombre", e.target.value)} maxLength={40} className={campo} />
          {error("nombre")}
        </label>
        <label className="block text-base font-semibold">
          Frase bajo el nombre
          <input
            value={d.frase}
            onChange={(e) => set("frase", e.target.value)}
            maxLength={60}
            placeholder="Ej: Carcasas y accesorios"
            className={campo}
          />
          {error("frase")}
        </label>
      </section>

      <section className={tarjeta}>
        <h2 className={titulo}>Contacto</h2>
        <label className="block text-base font-semibold">
          Número de WhatsApp
          <input
            value={d.whatsapp}
            onChange={(e) => set("whatsapp", e.target.value)}
            inputMode="tel"
            placeholder="56912345678"
            className={campo}
          />
          <span className="mt-1 block text-sm font-normal text-ink-soft">Con código de país (56), sin + ni espacios.</span>
          {error("whatsapp")}
        </label>
        <label className="block text-base font-semibold">
          Usuario de Instagram
          <input
            value={d.instagram}
            onChange={(e) => set("instagram", e.target.value)}
            placeholder="casemood_.cl"
            autoCapitalize="none"
            className={campo}
          />
          <span className="mt-1 block text-sm font-normal text-ink-soft">Sin @. Déjalo vacío para ocultar Instagram.</span>
          {error("instagram")}
        </label>
      </section>

      <section className={tarjeta}>
        <h2 className={titulo}>Aviso destacado</h2>
        <Toggle
          checked={d.avisoActivo}
          onChange={(v) => set("avisoActivo", v)}
          label="Mostrar aviso"
          descripcion="Una franja de color arriba de toda la tienda."
        />
        <label className="block text-base font-semibold">
          Texto del aviso
          <textarea
            value={d.avisoTexto}
            onChange={(e) => set("avisoTexto", e.target.value)}
            maxLength={140}
            rows={2}
            placeholder="Ej: Envíos gratis este fin de semana"
            className={`${campo} py-2`}
          />
          <span className="mt-1 block text-right text-sm font-normal text-ink-soft">{d.avisoTexto.length}/140</span>
          {error("avisoTexto")}
        </label>
      </section>

      <section className={tarjeta}>
        <h2 className={titulo}>Secciones de la tienda</h2>
        <Toggle
          checked={d.mostrarCotizador}
          onChange={(v) => set("mostrarCotizador", v)}
          label="Cotizador de envíos"
          descripcion="“¿Cuánto cuesta el envío?” al final de la tienda."
        />
        <Toggle
          checked={d.mostrarDisenador}
          onChange={(v) => set("mostrarDisenador", v)}
          label="Diseña tu carcasa"
          descripcion="El diseñador de carcasas personalizadas y su recuadro en el inicio."
        />
        <label className="block text-base font-semibold">
          Comuna desde donde envían
          <input value={d.comunaOrigen} onChange={(e) => set("comunaOrigen", e.target.value)} maxLength={40} className={campo} />
          {error("comunaOrigen")}
        </label>
      </section>

      <div className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] z-20 space-y-2 rounded-3xl bg-white/95 p-3 shadow-lg backdrop-blur">
        {hayCambios && <p className="text-center text-sm font-semibold text-ink-soft">Tienes cambios sin guardar.</p>}
        <div className="flex gap-2">
          {hayCambios && (
            <button
              type="button"
              disabled={pendiente}
              onClick={() => {
                setD(inicial);
                setErrores({});
              }}
              className="min-h-14 rounded-2xl border-2 border-line px-4 text-base font-semibold disabled:opacity-50"
            >
              Deshacer
            </button>
          )}
          <button
            type="button"
            disabled={pendiente || subiendo || !hayCambios}
            onClick={guardar}
            className="min-h-14 flex-1 rounded-2xl bg-brand px-4 text-lg font-bold text-white disabled:opacity-50"
          >
            {pendiente ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
