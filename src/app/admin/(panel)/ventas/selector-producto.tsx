"use client";

import { useEffect, useState } from "react";
import { formatCLP, imgUrl } from "@/lib/format";
import { buscarProductosVenta, type ProductoOpcion } from "./actions";

export type CategoriaFiltro = { id: number; nombre: string; porModelo: boolean };
export type ModeloFiltro = { id: number; nombre: string; variantes: { id: number; nombre: string }[] };

/** "todos" = la categoría tiene modelos, pero se pidió ver todo sin elegir iPhone. */
type Version = { id: number; nombre: string } | "todos" | null;

const paso = "block text-base font-bold";
const lista =
  "min-h-12 w-full rounded-xl border-2 border-line bg-white px-3 text-base font-normal focus:border-brand focus:outline-none";

/**
 * Elegir productos paso a paso, como en la tienda:
 * 1) categoría → 2) iPhone (solo si la categoría depende del modelo) → 3) productos con foto.
 */
export function SelectorProducto({
  categorias,
  modelos,
  onElegir,
}: {
  categorias: CategoriaFiltro[];
  modelos: ModeloFiltro[];
  /** `modelo`: nombre de la versión elegida (se anota en la venta). */
  onElegir: (p: ProductoOpcion, modelo: string | null) => void;
}) {
  const [categoria, setCategoria] = useState<CategoriaFiltro | null>(null);
  const [version, setVersion] = useState<Version>(null);
  const [texto, setTexto] = useState("");
  const [pagina, setPagina] = useState(1);
  const [resultado, setResultado] = useState<{ clave: string; productos: ProductoOpcion[]; hayMas: boolean } | null>(null);

  const t = texto.trim();
  const varianteId = version && version !== "todos" ? version.id : null;
  const listo = categoria !== null && (!categoria.porModelo || version !== null);
  const clave = JSON.stringify([categoria?.id, varianteId, t, pagina]);
  const cargando = listo && resultado?.clave !== clave;

  useEffect(() => {
    if (!listo || !categoria) return;
    let vigente = true;
    const id = setTimeout(
      () => {
        buscarProductosVenta({ texto: t, categoriaId: categoria.id, varianteId, pagina })
          .then((r) => vigente && setResultado({ clave, ...r }))
          .catch(() => vigente && setResultado({ clave, productos: [], hayMas: false }));
      },
      t ? 300 : 0,
    );
    return () => {
      vigente = false;
      clearTimeout(id);
    };
  }, [clave, listo, categoria, varianteId, t, pagina]);

  function elegirCategoria(c: CategoriaFiltro | null) {
    setCategoria(c);
    setVersion(null);
    setTexto("");
    setPagina(1);
  }
  function elegirVersion(v: Version) {
    setVersion(v);
    setTexto("");
    setPagina(1);
  }
  // Mientras carga "Ver más" se siguen mostrando los ya cargados.
  const productos = resultado && (resultado.clave === clave || pagina > 1) ? resultado.productos : [];

  return (
    <div className="space-y-3">
      {/* ---------- Paso 1: categoría ---------- */}
      <label className="block">
        <span className={paso}>¿Qué categoría?</span>
        <select
          value={categoria?.id ?? ""}
          onChange={(e) => elegirCategoria(categorias.find((c) => c.id === Number(e.target.value)) ?? null)}
          className={`${lista} mt-1`}
        >
          <option value="">Elige la categoría</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </label>

      {/* ---------- Paso 2: iPhone (solo si la categoría lo necesita) ---------- */}
      {categoria?.porModelo && (
        <label className="block">
          <span className={paso}>¿Para qué iPhone?</span>
          <select
            value={version === null ? "" : version === "todos" ? "todos" : version.id}
            onChange={(e) => {
              const v = e.target.value;
              elegirVersion(
                v === "" ? null : v === "todos" ? "todos" : (modelos.flatMap((m) => m.variantes).find((x) => x.id === Number(v)) ?? null),
              );
            }}
            className={`${lista} mt-1`}
          >
            <option value="">Elige el iPhone</option>
            <option value="todos">Todos los iPhone</option>
            {modelos.map((m) => (
              <optgroup key={m.id} label={m.nombre}>
                {m.variantes.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nombre}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      )}

      {/* ---------- Paso 3: productos ---------- */}
      {listo && (
        <>
          <input
            type="search"
            aria-label="Filtrar por nombre"
            placeholder="Filtrar por nombre (opcional)"
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
              setPagina(1);
            }}
            autoComplete="off"
            className="min-h-12 w-full rounded-xl border-2 border-line bg-white px-3 text-base focus:border-brand focus:outline-none"
          />
          {productos.length > 0 && (
            <ul className="grid grid-cols-2 gap-2">
              {productos.map((p) => {
                return (
                  <li key={p.id} className="flex">
                    <button
                      type="button"
                      onClick={() => onElegir(p, version && version !== "todos" ? version.nombre : null)}
                      className="flex w-full flex-col overflow-hidden rounded-2xl border-2 border-line bg-white text-left active:border-brand"
                    >
                      <span className="relative block aspect-3/4 w-full bg-surface">
                        {p.imagen ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imgUrl(p.imagen)} alt="" loading="lazy" className="h-full w-full object-cover" />
                        ) : (
                          <span className="flex h-full items-center justify-center text-sm text-ink-soft">Sin foto</span>
                        )}
                        {!p.activo && (
                          <span className="absolute top-1.5 left-1.5 rounded-md bg-ink px-1.5 py-0.5 text-xs font-bold text-white uppercase">
                            Inactivo
                          </span>
                        )}
                      </span>
                      <span className="flex flex-1 flex-col gap-0.5 p-2">
                        <span className="line-clamp-2 text-sm leading-snug font-semibold">{p.nombre}</span>
                        <span className="mt-auto text-base font-bold">{formatCLP(p.precio)}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {cargando && <p className="text-center text-base text-ink-soft">Cargando productos…</p>}
          {!cargando && productos.length === 0 && (
            <p className="rounded-2xl bg-surface p-3 text-base text-ink-soft">
              {t ? `No hay productos con “${t}”.` : "No hay productos en esta categoría para ese iPhone."}
            </p>
          )}
          {!cargando && resultado?.hayMas && (
            <button type="button" onClick={() => setPagina((n) => n + 1)} className="min-h-12 w-full rounded-xl border-2 border-line bg-white px-3 font-semibold">
              Ver más productos
            </button>
          )}
        </>
      )}
    </div>
  );
}
