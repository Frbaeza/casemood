"use client";

import { useEffect, useState } from "react";

/**
 * Búsqueda con espera corta (no consulta en cada tecla).
 * Con `minimo` 0 también busca con el texto vacío (ej. listar todos los clientes).
 */
export function useBusqueda<T>(texto: string, buscar: (t: string) => Promise<T[]>, minimo = 2, activa = true) {
  const [resultados, setResultados] = useState<{ para: string | null; lista: T[] }>({ para: null, lista: [] });
  const t = texto.trim();
  const aplica = activa && t.length >= minimo;

  useEffect(() => {
    if (!aplica) return;
    let vigente = true;
    const id = setTimeout(
      () => {
        buscar(t)
          .then((lista) => vigente && setResultados({ para: t, lista }))
          .catch(() => vigente && setResultados({ para: t, lista: [] }));
      },
      t ? 250 : 0,
    );
    return () => {
      vigente = false;
      clearTimeout(id);
    };
  }, [t, aplica, buscar]);

  return { lista: aplica && resultados.para === t ? resultados.lista : [], buscando: aplica && resultados.para !== t };
}
