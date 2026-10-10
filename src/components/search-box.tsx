"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IconCheck, IconFilter, IconSearch } from "@/components/icons";

type Categoria = { id: number; nombre: string; slug: string; cantidad?: number };

/**
 * Buscador con botón "Filtros" a la izquierda para elegir categoría.
 * - Sin texto: elegir una categoría abre /categoria/slug (todos sus productos).
 * - Con texto: busca esa palabra dentro de la categoría elegida.
 * Es un formulario GET normal, así que buscar funciona aunque no cargue JavaScript.
 */
export function SearchBox({
  defaultValue = "",
  categorias = [],
  categoriaActiva,
  viendoTodo = false,
}: {
  defaultValue?: string;
  categorias?: Categoria[];
  categoriaActiva?: string;
  /** true solo cuando la página muestra todo el catálogo (marca "Todas las categorías"). */
  viendoTodo?: boolean;
}) {
  const router = useRouter();
  const [texto, setTexto] = useState(defaultValue);
  const [abierto, setAbierto] = useState(false);
  const dialogo = useRef<HTMLDialogElement>(null);
  const activa = categorias.find((c) => c.slug === categoriaActiva);

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);

  function elegir(slug?: string) {
    setAbierto(false);
    const q = texto.trim();
    if (q) {
      const params = new URLSearchParams({ q });
      if (slug) params.set("categoria", slug);
      router.push(`/buscar?${params}`);
    } else {
      router.push(slug ? `/categoria/${slug}` : "/buscar");
    }
  }

  return (
    <>
      <form action="/buscar" role="search" className="flex gap-2">
        <div className="flex min-w-0 flex-1 items-stretch rounded-xl border-2 border-line bg-white focus-within:border-brand">
          {categorias.length > 0 && (
            <button
              type="button"
              onClick={() => setAbierto(true)}
              aria-haspopup="dialog"
              className={`flex min-h-12 shrink-0 items-center gap-1 rounded-l-[10px] border-r-2 border-line px-2.5 text-sm font-semibold ${
                activa ? "bg-brand-soft text-brand" : "text-ink"
              }`}
            >
              <IconFilter className="h-5 w-5" />
              <span className="max-w-24 truncate">{activa ? activa.nombre : "Filtros"}</span>
            </button>
          )}
          <label htmlFor="buscar" className="sr-only">
            Buscar productos
          </label>
          <input
            id="buscar"
            name="q"
            type="search"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Buscar productos"
            enterKeyHint="search"
            autoComplete="off"
            className="min-h-12 min-w-0 flex-1 rounded-r-[10px] bg-transparent px-3 text-base placeholder:text-ink-soft focus:outline-none"
          />
          {activa && <input type="hidden" name="categoria" value={activa.slug} />}
        </div>
        <button
          type="submit"
          className="flex min-h-12 shrink-0 items-center gap-1.5 rounded-xl bg-brand px-4 font-semibold text-white active:bg-brand-dark"
        >
          <IconSearch className="h-5 w-5" />
          Buscar
        </button>
      </form>

      {/* Panel de categorías (sube desde abajo en el teléfono) */}
      <dialog
        ref={dialogo}
        onClose={() => setAbierto(false)}
        onClick={(e) => e.target === dialogo.current && setAbierto(false)}
        aria-labelledby="titulo-filtros"
        className="m-0 mt-auto w-full max-w-none rounded-t-3xl bg-white p-0 text-ink shadow-2xl backdrop:bg-black/50 sm:m-auto sm:max-w-[440px] sm:rounded-3xl"
      >
        <div className="mx-auto max-w-[480px] px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between gap-2">
            <h2 id="titulo-filtros" className="font-display text-2xl font-bold">
              Filtrar por categoría
            </h2>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="min-h-12 rounded-xl px-3 text-base font-semibold text-brand"
            >
              Cerrar
            </button>
          </div>
          <p className="mt-1 text-base text-ink-soft">
            {texto.trim() ? (
              <>
                Buscarás “<strong className="text-ink">{texto.trim()}</strong>” solo en la categoría que elijas.
              </>
            ) : (
              "Toca una categoría para ver todos sus productos."
            )}
          </p>

          <ul className="mt-4 max-h-[60vh] space-y-2 overflow-y-auto">
            <li>
              <button
                type="button"
                onClick={() => elegir()}
                className={`flex min-h-14 w-full items-center justify-between gap-2 rounded-2xl border-2 px-4 text-left text-lg font-semibold ${
                  viendoTodo && !activa ? "border-brand bg-brand-soft" : "border-line"
                }`}
              >
                Todas las categorías
                {viendoTodo && !activa && <IconCheck className="h-6 w-6 text-brand" />}
              </button>
            </li>
            {categorias.map((c) => {
              const seleccionada = activa?.slug === c.slug;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => elegir(c.slug)}
                    className={`flex min-h-14 w-full items-center justify-between gap-2 rounded-2xl border-2 px-4 text-left text-lg font-semibold ${
                      seleccionada ? "border-brand bg-brand-soft" : "border-line"
                    }`}
                  >
                    <span>
                      {c.nombre}
                      {c.cantidad != null && (
                        <span className="ml-1.5 text-base font-normal text-ink-soft">({c.cantidad})</span>
                      )}
                    </span>
                    {seleccionada && <IconCheck className="h-6 w-6 text-brand" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </dialog>
    </>
  );
}
