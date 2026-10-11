"use client";

import { useState } from "react";
import { formatCLP } from "@/lib/format";

/** `etiqueta`: corta, para el eje; `titulo`: completa, para el detalle y la tabla. */
type Punto = { clave: string; etiqueta: string; titulo: string; total: number; ventas: number };

/** Redondea hacia arriba a un número "limpio" para el eje (1, 2, 5 × 10^n). */
function techo(max: number): number {
  if (max <= 0) return 1000;
  const p = 10 ** Math.floor(Math.log10(max));
  return ([1, 2, 5, 10].map((m) => m * p).find((v) => v >= max) ?? 10 * p);
}

const compacto = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toLocaleString("es-CL", { maximumFractionDigits: 1 })} M` : n >= 1000 ? `${Math.round(n / 1000)} mil` : String(n);

/**
 * Ventas en el tiempo: columnas de un solo color con eje de 3 marcas.
 * Tocar o pasar el mouse sobre una columna muestra su detalle; también hay vista de tabla.
 */
export function GraficoColumnas({ puntos, titulo }: { puntos: Punto[]; titulo: string }) {
  const [activo, setActivo] = useState<number | null>(null);
  const [tabla, setTabla] = useState(false);
  const max = techo(Math.max(...puntos.map((p) => p.total)));
  const ancho = 320;
  const alto = 160;
  const izq = 40; // espacio para el eje
  const abajo = 22; // espacio para las etiquetas
  const arriba = 10; // aire para que la marca superior del eje no se corte
  const banda = (ancho - izq) / puntos.length;
  const grosor = Math.min(24, Math.max(3, banda - 2)); // nunca más de 24 px; 2 px de aire entre columnas
  const y = (v: number) => arriba + (alto - abajo - arriba) * (1 - v / max);
  const cadaN = Math.ceil(puntos.length / 7); // a lo más ~7 etiquetas en el eje x
  const sel = activo !== null ? puntos[activo] : null;

  return (
    <div>
      <p className="min-h-6 text-base" aria-live="polite">
        {sel ? (
          <>
            <strong>{sel.titulo}</strong>: {formatCLP(sel.total)} · {sel.ventas} {sel.ventas === 1 ? "venta" : "ventas"}
          </>
        ) : (
          <span className="text-ink-soft">Toca una columna para ver el detalle.</span>
        )}
      </p>
      <svg
        viewBox={`0 0 ${ancho} ${alto}`}
        className="mt-2 w-full touch-manipulation"
        role="img"
        aria-label={titulo}
        onMouseLeave={() => setActivo(null)}
      >
        {/* Eje y: 0, mitad y techo; líneas finas y discretas */}
        {[0, max / 2, max].map((v) => (
          <g key={v}>
            <line x1={izq} x2={ancho} y1={y(v)} y2={y(v)} stroke="var(--color-line)" strokeWidth={1} />
            <text x={izq - 6} y={y(v) + 4} textAnchor="end" fontSize={10} fill="var(--color-ink-soft)">
              {compacto(v)}
            </text>
          </g>
        ))}
        {puntos.map((p, i) => {
          const x = izq + i * banda + (banda - grosor) / 2;
          const h = y(0) - y(p.total);
          const radio = Math.min(4, grosor / 2, h);
          return (
            <g key={p.clave}>
              {p.total > 0 && (
                <path
                  d={`M${x},${y(0)} V${y(p.total) + radio} Q${x},${y(p.total)} ${x + radio},${y(p.total)} H${x + grosor - radio} Q${x + grosor},${y(p.total)} ${x + grosor},${y(p.total) + radio} V${y(0)} Z`}
                  fill={activo === null || activo === i ? "var(--color-brand)" : "var(--color-blush)"}
                />
              )}
              {/* Zona táctil más grande que la columna */}
              <rect
                x={izq + i * banda}
                y={0}
                width={banda}
                height={alto - abajo}
                fill="transparent"
                onMouseEnter={() => setActivo(i)}
                onClick={() => setActivo(activo === i ? null : i)}
              />
              {i % cadaN === 0 && (
                <text x={izq + i * banda + banda / 2} y={alto - 6} textAnchor="middle" fontSize={10} fill="var(--color-ink-soft)">
                  {p.etiqueta}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <button
        type="button"
        onClick={() => setTabla(!tabla)}
        className="mt-2 min-h-12 rounded-xl border-2 border-line px-3 text-base font-semibold"
        aria-expanded={tabla}
      >
        {tabla ? "Ocultar tabla" : "Ver como tabla"}
      </button>
      {tabla && (
        <table className="mt-2 w-full text-base">
          <thead>
            <tr className="text-left text-sm text-ink-soft">
              <th className="py-1 font-semibold">Fecha</th>
              <th className="py-1 text-right font-semibold">Ventas</th>
              <th className="py-1 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line tabular-nums">
            {puntos
              .filter((p) => p.ventas > 0)
              .map((p) => (
                <tr key={p.clave}>
                  <td className="py-1.5">{p.titulo}</td>
                  <td className="py-1.5 text-right">{p.ventas}</td>
                  <td className="py-1.5 text-right">{formatCLP(p.total)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
