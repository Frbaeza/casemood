"use client";

import { useEffect, useState } from "react";

/** Búsqueda con espera corta (no consulta en cada tecla). */
export function useBusqueda<T>(texto: string, buscar: (t: string) => Promise<T[]>, minimo = 2) {
  const [resultados, setResultados] = useState<{ para: string; lista: T[] }>({ para: "", lista: [] });
  useEffect(() => {
    const t = texto.trim();
    if (t.length < minimo) return;
    let vigente = true;
    const id = setTimeout(() => {
      buscar(t)
        .then((lista) => vigente && setResultados({ para: t, lista }))
        .catch(() => vigente && setResultados({ para: t, lista: [] }));
    }, 250);
    return () => {
      vigente = false;
      clearTimeout(id);
    };
  }, [texto, buscar, minimo]);
  const t = texto.trim();
  return { lista: t.length >= minimo && resultados.para === t ? resultados.lista : [], buscando: t.length >= minimo && resultados.para !== t };
}
