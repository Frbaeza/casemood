import Link from "next/link";

type Modelo = { id: number; nombre: string; slug: string; versiones: number; conProductos: number };

/**
 * Tarjetas de modelos de iPhone. Con `categoriaSlug`, el filtro de categoría se mantiene
 * al elegir modelo y versión. Los modelos sin productos se ven en gris y no se pueden tocar.
 */
export function ModelGrid({ modelos, categoriaSlug }: { modelos: Modelo[]; categoriaSlug?: string }) {
  const sufijo = categoriaSlug ? `?categoria=${encodeURIComponent(categoriaSlug)}` : "";
  return (
    <ul className="grid grid-cols-2 gap-3">
      {modelos.map((m) => {
        const contenido = (
          <>
            <span className="font-display text-2xl leading-tight font-bold">{m.nombre}</span>
            {m.conProductos === 0 && <span className="mt-1 text-base">Sin stock por ahora</span>}
          </>
        );
        return (
          <li key={m.id}>
            {m.conProductos > 0 ? (
              <Link
                href={`/modelo/${m.slug}${sufijo}`}
                className="flex min-h-28 flex-col items-center justify-center rounded-2xl border-2 border-line bg-white p-4 text-center text-ink-soft shadow-sm transition-transform active:scale-[0.98] active:border-brand [&>span:first-child]:text-ink"
              >
                {contenido}
              </Link>
            ) : (
              <div
                aria-disabled="true"
                className="flex min-h-28 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line bg-surface p-4 text-center text-ink-soft opacity-70"
              >
                {contenido}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
