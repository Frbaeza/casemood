"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IconCheck, IconWhatsApp } from "@/components/icons";
import { agregarAlPedido, unidadesDe, usePedido } from "@/lib/carrito";
import { whatsappUrl } from "@/lib/format";
import { useVarianteGuardada } from "@/lib/variante-guardada";

export type GrupoCompatibilidad = {
  modelo: string;
  variantes: { id: number; nombre: string; disponible: boolean }[];
};

/**
 * Lista de variantes compatibles (las agotadas tachadas) y barra fija con "Agregar al pedido"
 * (y "Consultar por WhatsApp" como opción secundaria).
 * La variante del mensaje se toma de: lo que toque el cliente › ?v= de la URL › la recordada.
 */
export function ProductInquiry({
  producto,
  item,
  grupos,
  whatsapp,
  varianteDesdeUrl,
}: {
  producto: string;
  /** Datos para agregarlo al pedido. */
  item: { productoId: number; slug: string; precio: number; imagen: string | null };
  grupos: GrupoCompatibilidad[];
  whatsapp: string;
  varianteDesdeUrl?: number;
}) {
  const pedido = usePedido();
  const [agregado, setAgregado] = useState<string | null>(null);
  const [faltaModelo, setFaltaModelo] = useState(false);
  useEffect(() => {
    if (!agregado) return;
    const t = setTimeout(() => setAgregado(null), 2500);
    return () => clearTimeout(t);
  }, [agregado]);
  const guardada = useVarianteGuardada();
  const [elegida, setElegida] = useState<number | null>(null);

  const disponibles = new Map(
    grupos.flatMap((g) => g.variantes.filter((v) => v.disponible).map((v) => [v.id, v.nombre] as const)),
  );
  const universal = grupos.length === 0;

  const candidatos = [elegida, varianteDesdeUrl, guardada?.id];
  const seleccion = candidatos.find((id): id is number => id != null && disponibles.has(id));
  const nombreSeleccion = seleccion != null ? disponibles.get(seleccion) : undefined;

  function agregar() {
    if (!universal && !nombreSeleccion) {
      setFaltaModelo(true);
      document.getElementById("titulo-compatibilidad")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    agregarAlPedido({ ...item, nombre: producto, modelo: universal ? null : (nombreSeleccion ?? null) });
    setFaltaModelo(false);
    setAgregado(nombreSeleccion ?? producto);
  }

  const mensaje = nombreSeleccion
    ? `Hola, me interesa ${producto} para ${nombreSeleccion}`
    : `Hola, me interesa ${producto}`;

  return (
    <>
      <section aria-labelledby="titulo-compatibilidad" className="mt-8">
        <h2 id="titulo-compatibilidad" className="font-display text-2xl font-bold">
          {universal ? "Compatibilidad" : "¿Para qué iPhone?"}
        </h2>

        {universal ? (
          <p className="mt-2 rounded-2xl bg-surface p-4 text-base">
            <strong>Universal:</strong> sirve para cualquier modelo.
          </p>
        ) : (
          <>
            <p className="mt-1 text-base text-ink-soft">Toca tu modelo para incluirlo en la consulta.</p>
            <div className="mt-4 space-y-4">
              {grupos.map((g) => (
                <div key={g.modelo}>
                  <h3 className="mb-2 text-base font-semibold text-ink-soft">{g.modelo}</h3>
                  <ul className="flex flex-wrap gap-2">
                    {g.variantes.map((v) => {
                      const activa = v.id === seleccion;
                      return (
                        <li key={v.id}>
                          {v.disponible ? (
                            <button
                              type="button"
                              onClick={() => {
                                setElegida(v.id);
                                setFaltaModelo(false);
                              }}
                              aria-pressed={activa}
                              className={`flex min-h-12 items-center gap-1.5 rounded-xl border-2 px-4 text-base font-semibold ${
                                activa ? "border-brand bg-brand text-white" : "border-line bg-white text-ink"
                              }`}
                            >
                              {activa && <IconCheck className="h-5 w-5" />}
                              {v.nombre}
                            </button>
                          ) : (
                            <span className="flex min-h-12 items-center gap-2 rounded-xl border-2 border-dashed border-line bg-surface px-4 text-base text-ink-soft">
                              <s>{v.nombre}</s>
                              <span className="rounded-md bg-ink-soft px-1.5 py-0.5 text-xs font-bold text-white uppercase">
                                Agotado
                              </span>
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Barra fija abajo */}
      <div data-fixed-cta className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-[480px] space-y-2 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {faltaModelo ? (
            <p role="alert" className="text-center text-base font-semibold text-danger">
              Primero elige tu modelo de iPhone (arriba).
            </p>
          ) : agregado ? (
            <p role="status" className="flex items-center justify-center gap-1.5 text-center text-base font-semibold text-whatsapp">
              <IconCheck className="h-5 w-5" /> Agregado al pedido
            </p>
          ) : (
            nombreSeleccion && (
              <p className="text-center text-sm text-ink-soft">
                Para <strong className="text-ink">{nombreSeleccion}</strong>
              </p>
            )
          )}
          <button
            type="button"
            onClick={agregar}
            className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-brand px-4 text-lg font-bold text-white shadow-md active:bg-brand-dark"
          >
            Agregar al pedido
          </button>
          <div className="flex gap-2">
            {pedido.length > 0 && (
              <Link
                href="/pedido"
                className="flex min-h-12 flex-1 items-center justify-center rounded-xl border-2 border-brand bg-brand-soft px-2 text-base font-semibold text-brand"
              >
                Ver pedido ({unidadesDe(pedido)})
              </Link>
            )}
            <a
              href={whatsappUrl(whatsapp, mensaje)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-line bg-white px-2 text-base font-semibold text-ink"
            >
              <IconWhatsApp className="h-5 w-5 text-whatsapp" />
              Consultar
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
