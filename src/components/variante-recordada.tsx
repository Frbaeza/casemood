"use client";

import { useEffect } from "react";
import { guardarVariante, type VarianteGuardada } from "@/lib/variante-guardada";

/** Guarda en este navegador la variante que se está viendo. No muestra nada. */
export function RecordarVariante(props: VarianteGuardada) {
  const { id, nombre, modeloSlug, varianteSlug } = props;
  useEffect(() => {
    guardarVariante({ id, nombre, modeloSlug, varianteSlug });
  }, [id, nombre, modeloSlug, varianteSlug]);
  return null;
}
