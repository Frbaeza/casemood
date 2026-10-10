"use client";

import { useState } from "react";
import { formatCLP } from "@/lib/format";
import { TALLAS, type RegionCotizable, type Talla } from "@/lib/envios";

/** "¿Cuánto cuesta el envío?" — tarifas fijas por zona, administradas en admin → Envíos. */
export function CotizadorEnvio({ regiones, comunaOrigen }: { regiones: RegionCotizable[]; comunaOrigen: string }) {
  const [regionId, setRegionId] = useState("");
  const [talla, setTalla] = useState<Talla>("XS");
  const region = regiones.find((r) => String(r.id) === regionId);

  if (regiones.length === 0) return null;

  const campo =
    "min-h-12 w-full rounded-xl border-2 border-line bg-white px-3 text-base text-ink focus:border-brand focus:outline-none";

  return (
    <section aria-labelledby="titulo-envio" className="mt-6 rounded-3xl bg-white p-5 text-ink shadow-lg">
      <h2 id="titulo-envio" className="font-display text-2xl leading-tight font-semibold">
        ¿Cuánto cuesta el envío?
      </h2>
      <p className="mt-1 text-base text-ink-soft">Enviamos por Blue Express desde {comunaOrigen} a todo Chile.</p>

      <div className="mt-4 space-y-3">
        <div>
          <label htmlFor="envio-region" className="mb-1 block text-base font-semibold">
            ¿A qué región?
          </label>
          <select id="envio-region" value={regionId} onChange={(e) => setRegionId(e.target.value)} className={campo}>
            <option value="">Elige tu región</option>
            {regiones.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="envio-talla" className="mb-1 block text-base font-semibold">
            Tamaño del pedido
          </label>
          <select id="envio-talla" value={talla} onChange={(e) => setTalla(e.target.value as Talla)} className={campo}>
            {TALLAS.map((t) => (
              <option key={t.clave} value={t.clave}>
                {t.clave}: {t.ayuda}
              </option>
            ))}
          </select>
        </div>
      </div>

      {region ? (
        <div aria-live="polite" className="mt-4 space-y-2">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-brand-soft px-4 py-3">
            <span className="text-base font-semibold">Retiro en Punto Blue Express</span>
            <span className="font-display text-2xl font-bold text-brand">{formatCLP(region.punto[talla])}</span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-brand-soft px-4 py-3">
            <span className="text-base font-semibold">A domicilio</span>
            <span className="font-display text-2xl font-bold text-brand">{formatCLP(region.domicilio[talla])}</span>
          </div>
        </div>
      ) : (
        <p className="mt-4 rounded-2xl bg-surface p-3 text-center text-base text-ink-soft">
          Elige tu región para ver el valor.
        </p>
      )}

      <p className="mt-3 text-center text-xs text-ink-soft">
        Valores referenciales de Blue Express. Te confirmamos el total al coordinar tu pedido.
      </p>
    </section>
  );
}
