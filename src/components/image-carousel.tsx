"use client";

import { useRef, useState } from "react";
import { IconChevronLeft, IconChevronRight } from "@/components/icons";
import { imgUrl } from "@/lib/format";

/** Carrusel deslizable con el dedo (scroll-snap nativo) + botones con texto y miniaturas. */
export function ImageCarousel({ keys, alt }: { keys: string[]; alt: string }) {
  const pista = useRef<HTMLDivElement>(null);
  const [actual, setActual] = useState(0);
  const total = keys.length;

  if (total === 0) {
    return (
      <div className="flex aspect-3/4 w-full items-center justify-center rounded-2xl bg-surface text-lg text-ink-soft">
        Sin fotos
      </div>
    );
  }

  const ir = (i: number) => {
    const el = pista.current;
    if (!el) return;
    const destino = Math.max(0, Math.min(total - 1, i));
    el.scrollTo({ left: destino * el.clientWidth, behavior: "smooth" });
  };

  const alDeslizar = () => {
    const el = pista.current;
    if (!el || el.clientWidth === 0) return;
    setActual(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div>
      <div
        ref={pista}
        onScroll={alDeslizar}
        className="flex aspect-3/4 w-full snap-x snap-mandatory overflow-x-auto rounded-2xl bg-surface [scrollbar-width:none]"
        aria-roledescription="carrusel"
        aria-label={`Fotos de ${alt}`}
      >
        {keys.map((key, i) => (
          <div
            key={key}
            className="h-full w-full shrink-0 snap-center"
            aria-roledescription="foto"
            aria-label={`${i + 1} de ${total}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgUrl(key)}
              alt={i === 0 ? alt : `${alt}, foto ${i + 1}`}
              width={1200}
              height={1600}
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : "auto"}
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>

      {total > 1 && (
        <>
          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => ir(actual - 1)}
              disabled={actual === 0}
              className="flex min-h-12 items-center gap-1 rounded-xl border-2 border-line px-3 font-semibold disabled:opacity-40"
            >
              <IconChevronLeft className="h-5 w-5" />
              Anterior
            </button>
            <span className="text-base text-ink-soft" aria-live="polite">
              Foto {actual + 1} de {total}
            </span>
            <button
              type="button"
              onClick={() => ir(actual + 1)}
              disabled={actual === total - 1}
              className="flex min-h-12 items-center gap-1 rounded-xl border-2 border-line px-3 font-semibold disabled:opacity-40"
            >
              Siguiente
              <IconChevronRight className="h-5 w-5" />
            </button>
          </div>

          <ul className="mt-3 flex gap-2 overflow-x-auto [scrollbar-width:none]">
            {keys.map((key, i) => (
              <li key={key} className="shrink-0">
                <button
                  type="button"
                  onClick={() => ir(i)}
                  aria-label={`Ver foto ${i + 1}`}
                  aria-current={i === actual}
                  className={`block h-16 w-16 overflow-hidden rounded-xl border-2 ${
                    i === actual ? "border-brand" : "border-transparent opacity-70"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imgUrl(key)} alt="" width={64} height={64} loading="lazy" className="h-full w-full object-cover" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
