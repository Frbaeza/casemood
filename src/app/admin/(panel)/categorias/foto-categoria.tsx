"use client";

import { useRef, useState } from "react";
import { toast } from "@/components/admin/toaster";
import { useAccion } from "@/components/admin/use-accion";
import { imgUrl } from "@/lib/format";
import { subirImagen } from "@/lib/subir-imagen";
import { cambiarImagenCategoria } from "./actions";

/** Foto de portada de la categoría (la que se ve en los cuadrados del inicio). */
export function FotoCategoria({
  id,
  nombre,
  imagenKey,
  respaldoKey,
}: {
  id: number;
  nombre: string;
  /** Foto elegida en el admin. */
  imagenKey: string | null;
  /** Foto de un producto, usada si no hay una propia. */
  respaldoKey: string | null;
}) {
  const { ejecutar, pendiente } = useAccion();
  const [subiendo, setSubiendo] = useState(false);
  const camara = useRef<HTMLInputElement>(null);
  const galeria = useRef<HTMLInputElement>(null);
  const ocupado = subiendo || pendiente;
  const vista = imagenKey ?? respaldoKey;

  async function alElegir(archivo: File | undefined) {
    if (!archivo) return;
    setSubiendo(true);
    try {
      const key = await subirImagen(archivo);
      ejecutar(() => cambiarImagenCategoria(id, key));
    } catch (e) {
      toast(e instanceof Error ? e.message : "No se pudo subir la foto.", "error");
    } finally {
      setSubiendo(false);
    }
  }

  const boton = "flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-brand bg-brand-soft px-2 text-sm font-semibold text-brand disabled:opacity-50";

  return (
    <div className="flex gap-3 rounded-2xl bg-surface p-3">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2 border-line bg-white">
        {vista ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imgUrl(vista)} alt={`Foto de ${nombre}`} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center p-1 text-center text-xs text-ink-soft">Sin foto</span>
        )}
        {ocupado && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/75 text-sm font-semibold">Subiendo…</span>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-sm text-ink-soft">
          {imagenKey ? "Foto propia de la categoría." : "Usando la foto de un producto. Puedes poner una propia."}
        </p>
        <div className="flex gap-2">
          <button type="button" disabled={ocupado} onClick={() => camara.current?.click()} className={boton}>
            <span aria-hidden>📷</span> Tomar foto
          </button>
          <button type="button" disabled={ocupado} onClick={() => galeria.current?.click()} className={boton}>
            <span aria-hidden>🖼️</span> Galería
          </button>
        </div>
        {imagenKey && (
          <button
            type="button"
            disabled={ocupado}
            onClick={() => ejecutar(() => cambiarImagenCategoria(id, null))}
            className="min-h-11 rounded-lg border-2 border-danger/30 px-3 text-sm font-semibold text-danger disabled:opacity-50"
          >
            ✕ Quitar foto propia
          </button>
        )}
        <input
          ref={camara}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            alElegir(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <input
          ref={galeria}
          type="file"
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            alElegir(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
