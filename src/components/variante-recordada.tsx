"use client";

import Link from "next/link";
import { IconChevronRight, IconPhone } from "@/components/icons";
import { guardarVariante, olvidarVariante, useVarianteGuardada, type VarianteGuardada } from "@/lib/variante-guardada";
import { useEffect } from "react";

/** Atajo en el inicio: "Tu iPhone: iPhone 13 Pro — Ver productos". */
export function VarianteRecordada() {
  const v = useVarianteGuardada();
  if (!v) return null;

  return (
    <div className="rounded-2xl border-2 border-brand bg-brand-soft p-4">
      <p className="flex items-center gap-2 text-base text-ink-soft">
        <IconPhone className="h-5 w-5 text-brand" />
        La última vez elegiste
      </p>
      <p className="mt-1 font-display text-2xl font-bold">{v.nombre}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={`/modelo/${v.modeloSlug}/${v.varianteSlug}`}
          className="flex min-h-12 flex-1 items-center justify-center gap-1 rounded-xl bg-brand px-4 font-semibold text-white active:bg-brand-dark"
        >
          Ver productos
          <IconChevronRight className="h-5 w-5" />
        </Link>
        <button
          type="button"
          onClick={olvidarVariante}
          className="min-h-12 rounded-xl border-2 border-line bg-white px-4 font-semibold text-ink"
        >
          Elegir otro
        </button>
      </div>
    </div>
  );
}

/** Guarda en este navegador la variante que se está viendo. No muestra nada. */
export function RecordarVariante(props: VarianteGuardada) {
  const { id, nombre, modeloSlug, varianteSlug } = props;
  useEffect(() => {
    guardarVariante({ id, nombre, modeloSlug, varianteSlug });
  }, [id, nombre, modeloSlug, varianteSlug]);
  return null;
}
