import type { Fila } from "@/lib/analisis";
import { formatCLP } from "@/lib/format";

/** "$1,2 M", "$85 mil", "$950" (para ejes y cifras grandes). */
export function formatCompacto(valor: number): string {
  if (valor >= 1_000_000) return `$${(valor / 1_000_000).toLocaleString("es-CL", { maximumFractionDigits: 1 })} M`;
  if (valor >= 10_000) return `$${Math.round(valor / 1000).toLocaleString("es-CL")} mil`;
  return formatCLP(valor);
}

/** Variación porcentual vs el período anterior (null si no hay base para comparar). */
function variacion(actual: number, anterior: number): number | null {
  if (anterior === 0) return null;
  return Math.round(((actual - anterior) / anterior) * 100);
}

/** Cifra clave: valor y cambio vs el período anterior. */
export function Indicador({
  etiqueta,
  actual,
  anterior,
  formato = (n) => n.toLocaleString("es-CL"),
}: {
  etiqueta: string;
  actual: number;
  anterior: number;
  formato?: (n: number) => string;
}) {
  const v = variacion(actual, anterior);
  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-ink-soft">{etiqueta}</p>
      <p className="mt-0.5 text-2xl font-bold">{formato(actual)}</p>
      <p className="mt-0.5 text-sm text-ink-soft">
        {v === null ? (
          "Sin datos del período anterior"
        ) : (
          <>
            <span className={`font-semibold ${v > 0 ? "text-green-700" : v < 0 ? "text-danger" : "text-ink"}`}>
              <span aria-hidden>{v > 0 ? "▲" : v < 0 ? "▼" : "="}</span> {v > 0 ? "+" : ""}
              {v}%
            </span>{" "}
            vs período anterior
          </>
        )}
      </p>
    </div>
  );
}

/**
 * Ranking en barras horizontales (una serie, un color): nombre y valor arriba, barra debajo.
 * Las barras crecen desde el mismo borde y miden contra el mayor valor.
 */
export function Barras({
  filas,
  formato = formatCLP,
  vacio = "Sin datos en este período.",
}: {
  filas: Fila[];
  formato?: (n: number) => string;
  vacio?: string;
}) {
  if (filas.length === 0) return <p className="text-base text-ink-soft">{vacio}</p>;
  const max = Math.max(...filas.map((f) => f.valor), 1);
  return (
    <ul className="space-y-3">
      {filas.map((f) => (
        <li key={f.etiqueta}>
          <div className="flex items-baseline justify-between gap-3 text-base">
            <span className="min-w-0 truncate">{f.etiqueta}</span>
            <span className="shrink-0 font-semibold tabular-nums">
              {formato(f.valor)}
              {f.detalle && <span className="ml-1 text-sm font-normal text-ink-soft">· {f.detalle}</span>}
            </span>
          </div>
          <div className="mt-1 h-3 w-full rounded-r-md bg-surface">
            <div className="h-3 rounded-r-md bg-brand" style={{ width: `${Math.max(2, (f.valor / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Tarjeta con título para cada bloque de análisis. */
export function Bloque({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-4 shadow-sm" aria-label={titulo}>
      <h2 className="font-display text-xl font-bold">{titulo}</h2>
      {subtitulo && <p className="text-sm text-ink-soft">{subtitulo}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}
