"use client";

import { useRouter } from "next/navigation";
import { ORDENES, type Orden } from "@/lib/catalog-orden";

/**
 * "Ordenar por" para listas de productos. Cambia ?orden= en la URL conservando los demás
 * parámetros (q, categoria…) y vuelve a la página 1.
 */
export function OrdenSelect({
  ruta,
  params = {},
  valor,
}: {
  ruta: string;
  params?: Record<string, string | undefined>;
  valor: Orden;
}) {
  const router = useRouter();

  function cambiar(nuevo: string) {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== "pagina" && k !== "orden") sp.set(k, v);
    if (nuevo !== "recomendados") sp.set("orden", nuevo);
    const qs = sp.toString();
    router.push(qs ? `${ruta}?${qs}` : ruta, { scroll: false });
  }

  return (
    <label className="flex min-h-12 shrink-0 items-center gap-2 text-base">
      <span className="text-ink-soft">Ordenar:</span>
      <select
        value={valor}
        onChange={(e) => cambiar(e.target.value)}
        className="min-h-12 rounded-xl border-2 border-line bg-white px-3 font-semibold text-ink focus:border-brand focus:outline-none"
      >
        {Object.entries(ORDENES).map(([k, etiqueta]) => (
          <option key={k} value={k}>
            {etiqueta}
          </option>
        ))}
      </select>
    </label>
  );
}
