"use client";

import { useState } from "react";
import { IconCheck, IconWhatsApp } from "@/components/icons";
import { whatsappUrl } from "@/lib/format";
import { useVarianteGuardada } from "@/lib/variante-guardada";

export type GrupoCompatibilidad = {
  modelo: string;
  variantes: { id: number; nombre: string; disponible: boolean }[];
};

/**
 * Lista de variantes compatibles (las agotadas tachadas) y botón fijo de WhatsApp.
 * La variante del mensaje se toma de: lo que toque el cliente › ?v= de la URL › la recordada.
 */
export function ProductInquiry({
  producto,
  grupos,
  whatsapp,
  varianteDesdeUrl,
}: {
  producto: string;
  grupos: GrupoCompatibilidad[];
  whatsapp: string;
  varianteDesdeUrl?: number;
}) {
  const guardada = useVarianteGuardada();
  const [elegida, setElegida] = useState<number | null>(null);

  const disponibles = new Map(
    grupos.flatMap((g) => g.variantes.filter((v) => v.disponible).map((v) => [v.id, v.nombre] as const)),
  );
  const universal = grupos.length === 0;

  const candidatos = [elegida, varianteDesdeUrl, guardada?.id];
  const seleccion = candidatos.find((id): id is number => id != null && disponibles.has(id));
  const nombreSeleccion = seleccion != null ? disponibles.get(seleccion) : undefined;

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
                              onClick={() => setElegida(v.id)}
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

      {/* Botón fijo abajo */}
      <div data-fixed-cta className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-[480px] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {nombreSeleccion && (
            <p className="mb-2 text-center text-sm text-ink-soft">
              Consultarás para <strong className="text-ink">{nombreSeleccion}</strong>
            </p>
          )}
          <a
            href={whatsappUrl(whatsapp, mensaje)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-whatsapp px-4 text-lg font-bold text-white shadow-md active:brightness-95"
          >
            <IconWhatsApp className="h-6 w-6" />
            Consultar por WhatsApp
          </a>
        </div>
      </div>
    </>
  );
}
