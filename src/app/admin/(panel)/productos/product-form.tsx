"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { toast } from "@/components/admin/toaster";
import { Toggle } from "@/components/admin/toggle";
import { IconArrowLeft, IconCheck } from "@/components/icons";
import type { ActionResult } from "@/lib/admin-utils";
import { subirImagen } from "@/lib/subir-imagen";
import { formatCLP, imgUrl } from "@/lib/format";
import { eliminarProducto, guardarProducto } from "./actions";

const MAX_IMAGENES = 6;

export type ModeloOpcion = {
  id: number;
  nombre: string;
  activo: boolean;
  variantes: { id: number; nombre: string; activo: boolean }[];
};

export type ProductoInicial = {
  id?: number;
  slug?: string;
  nombre: string;
  precio: number | null;
  categoriaId: number | null;
  descripcion: string;
  activo: boolean;
  destacado: boolean;
  /** null = no se lleva stock. */
  stock: number | null;
  imagenes: string[];
  variantes: { varianteId: number; disponible: boolean }[];
};

type Foto = { uid: string; key?: string; preview: string; estado: "subiendo" | "lista" };

const campo = "min-h-12 w-full rounded-xl border-2 border-line bg-white px-4 text-base focus:border-brand focus:outline-none";
const tarjeta = "rounded-3xl bg-white p-4 shadow-sm";

export function ProductForm({
  inicial,
  categorias,
  modelos,
}: {
  inicial: ProductoInicial;
  categorias: { id: number; nombre: string }[];
  modelos: ModeloOpcion[];
}) {
  const router = useRouter();
  const esNuevo = !inicial.id;

  // ---- Datos ----
  const [nombre, setNombre] = useState(inicial.nombre);
  const [precio, setPrecio] = useState(inicial.precio != null ? String(inicial.precio) : "");
  const [categoriaId, setCategoriaId] = useState(inicial.categoriaId ? String(inicial.categoriaId) : "");
  const [descripcion, setDescripcion] = useState(inicial.descripcion);
  const [activo, setActivo] = useState(inicial.activo);
  const [destacado, setDestacado] = useState(inicial.destacado);
  const [llevaStock, setLlevaStock] = useState(inicial.stock !== null);
  const [stock, setStock] = useState(inicial.stock !== null ? String(inicial.stock) : "");

  // ---- Fotos ----
  const [fotos, setFotos] = useState<Foto[]>(() =>
    inicial.imagenes.map((key) => ({ uid: key, key, preview: imgUrl(key), estado: "lista" as const })),
  );
  const subiendo = fotos.some((f) => f.estado === "subiendo");
  const inputCamara = useRef<HTMLInputElement>(null);
  const inputGaleria = useRef<HTMLInputElement>(null);

  async function agregarFotos(lista: FileList | null) {
    if (!lista?.length) return;
    const libres = MAX_IMAGENES - fotos.length;
    const archivos = Array.from(lista).filter((f) => f.type.startsWith("image/")).slice(0, libres);
    if (lista.length > libres) toast(`Solo caben ${MAX_IMAGENES} fotos por producto.`, "error");

    const nuevas: Foto[] = archivos.map((f) => ({
      uid: crypto.randomUUID(),
      preview: URL.createObjectURL(f),
      estado: "subiendo",
    }));
    setFotos((prev) => [...prev, ...nuevas]);

    await Promise.all(
      archivos.map(async (archivo, i) => {
        const { uid } = nuevas[i];
        try {
          const key = await subirImagen(archivo);
          setFotos((prev) => prev.map((f) => (f.uid === uid ? { ...f, key, estado: "lista" } : f)));
        } catch (e) {
          setFotos((prev) => prev.filter((f) => f.uid !== uid));
          toast(e instanceof Error ? e.message : "No se pudo subir la foto.", "error");
        }
      }),
    );
  }

  function moverFoto(i: number, delta: -1 | 1) {
    setFotos((prev) => {
      const j = i + delta;
      if (j < 0 || j >= prev.length) return prev;
      const copia = [...prev];
      [copia[i], copia[j]] = [copia[j], copia[i]];
      return copia;
    });
  }

  // ---- Compatibilidad ----
  const [compat, setCompat] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(inicial.variantes.map((v) => [v.varianteId, v.disponible])),
  );
  const [abiertos, setAbiertos] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(modelos.map((m) => [m.id, m.variantes.some((v) => v.id in compat)])),
  );
  const totalMarcadas = Object.keys(compat).length;

  function marcar(varianteId: number, si: boolean) {
    setCompat((prev) => {
      const copia = { ...prev };
      if (si) copia[varianteId] = prev[varianteId] ?? true;
      else delete copia[varianteId];
      return copia;
    });
  }

  function marcarTodas(m: ModeloOpcion, si: boolean) {
    setCompat((prev) => {
      const copia = { ...prev };
      for (const v of m.variantes) {
        if (si) copia[v.id] = prev[v.id] ?? true;
        else delete copia[v.id];
      }
      return copia;
    });
  }

  // ---- Guardar ----
  const [estado, accion, guardando] = useActionState<ActionResult | null, FormData>(guardarProducto, null);
  const errores = estado?.ok === false ? (estado.errores ?? {}) : {};

  // Un error de campo se oculta apenas la persona edita ese campo (hasta el próximo envío).
  const [editados, setEditados] = useState<{ para: ActionResult | null; campos: string[] }>({ para: null, campos: [] });
  const camposEditados = editados.para === estado ? editados.campos : [];
  const editado = (c: string) => {
    if (errores[c] && !camposEditados.includes(c)) setEditados({ para: estado, campos: [...camposEditados, c] });
  };
  const err = (c: string) => (camposEditados.includes(c) ? undefined : errores[c]);

  useEffect(() => {
    if (!estado) return;
    if (estado.ok) {
      toast(estado.mensaje ?? "Guardado.");
      if (esNuevo && estado.id) router.replace(`/admin/productos/${estado.id}`);
      else router.refresh();
    } else {
      toast(estado.mensaje ?? "No se pudo guardar.", "error");
    }
  }, [estado, esNuevo, router]);

  // ---- Eliminar ----
  const [confirmando, setConfirmando] = useState(false);
  const [eliminando, startEliminar] = useTransition();
  function eliminar() {
    if (!inicial.id) return;
    const id = inicial.id;
    startEliminar(async () => {
      const r = await eliminarProducto(id);
      setConfirmando(false);
      toast(r.mensaje ?? (r.ok ? "Eliminado." : "No se pudo eliminar."), r.ok ? "ok" : "error");
      if (r.ok) router.replace("/admin/productos");
    });
  }

  const precioNumero = Number(precio.replace(/\D/g, ""));

  return (
    <form action={accion} className="space-y-4 pb-24" noValidate>
      {inicial.id && <input type="hidden" name="id" value={inicial.id} />}
      <input type="hidden" name="imagenes" value={JSON.stringify(fotos.filter((f) => f.key).map((f) => f.key))} />
      <input
        type="hidden"
        name="variantes"
        value={JSON.stringify(Object.entries(compat).map(([id, disponible]) => ({ varianteId: Number(id), disponible })))}
      />

      <div className="flex items-center justify-between gap-2">
        <Link href="/admin/productos" className="-ml-2 inline-flex min-h-12 items-center gap-2 px-2 font-semibold text-brand">
          <IconArrowLeft className="h-5 w-5" />
          Productos
        </Link>
        {inicial.slug && (
          <Link
            href={`/producto/${inicial.slug}`}
            target="_blank"
            className="inline-flex min-h-12 items-center rounded-xl px-2 font-semibold text-brand"
          >
            Ver en la tienda
          </Link>
        )}
      </div>

      <h1 className="font-display text-3xl font-bold">{esNuevo ? "Nuevo producto" : "Editar producto"}</h1>

      {/* ---------- Fotos ---------- */}
      <section className={tarjeta} aria-labelledby="t-fotos">
        <h2 id="t-fotos" className="font-display text-2xl font-bold">
          Fotos <span className="text-base font-normal text-ink-soft">({fotos.length} de {MAX_IMAGENES})</span>
        </h2>
        <p className="text-sm text-ink-soft">La primera foto es la principal. Se achican solas antes de subir.</p>

        {fotos.length > 0 && (
          <ul className="mt-3 space-y-2">
            {fotos.map((f, i) => (
              <li key={f.uid} className="flex items-center gap-3 rounded-2xl border-2 border-line p-2">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.preview} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                  {f.estado === "subiendo" && (
                    <span className="absolute inset-0 flex items-center justify-center bg-white/75 text-sm font-semibold">
                      Subiendo…
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold">{i === 0 ? "Foto principal" : `Foto ${i + 1}`}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => moverFoto(i, -1)}
                      disabled={i === 0}
                      className="min-h-10 rounded-lg border-2 border-line px-2.5 text-sm font-semibold disabled:opacity-35"
                    >
                      ↑ Subir
                    </button>
                    <button
                      type="button"
                      onClick={() => moverFoto(i, 1)}
                      disabled={i === fotos.length - 1}
                      className="min-h-10 rounded-lg border-2 border-line px-2.5 text-sm font-semibold disabled:opacity-35"
                    >
                      ↓ Bajar
                    </button>
                    <button
                      type="button"
                      onClick={() => setFotos((prev) => prev.filter((x) => x.uid !== f.uid))}
                      className="min-h-10 rounded-lg border-2 border-danger/30 px-2.5 text-sm font-semibold text-danger"
                    >
                      ✕ Quitar
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {fotos.length < MAX_IMAGENES && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => inputCamara.current?.click()}
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand bg-brand-soft px-3 font-semibold text-brand"
            >
              <span aria-hidden>📷</span> Tomar foto
            </button>
            <button
              type="button"
              onClick={() => inputGaleria.current?.click()}
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand bg-brand-soft px-3 font-semibold text-brand"
            >
              <span aria-hidden>🖼️</span> Galería
            </button>
            <input
              ref={inputCamara}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              tabIndex={-1}
              onChange={(e) => {
                agregarFotos(e.target.files);
                e.target.value = "";
              }}
            />
            <input
              ref={inputGaleria}
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              tabIndex={-1}
              onChange={(e) => {
                agregarFotos(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
        )}
      </section>

      {/* ---------- Datos ---------- */}
      <section className={`${tarjeta} space-y-4`} aria-labelledby="t-datos">
        <h2 id="t-datos" className="font-display text-2xl font-bold">
          Datos
        </h2>

        <div>
          <label htmlFor="nombre" className="mb-1 block text-base font-semibold">
            Nombre
          </label>
          <input
            id="nombre"
            name="nombre"
            value={nombre}
            onChange={(e) => { setNombre(e.target.value); editado("nombre"); }}
            placeholder="Ej: Carcasa transparente MagSafe"
            autoComplete="off"
            className={campo}
            aria-invalid={!!err("nombre")}
          />
          {err("nombre") && <p className="mt-1 text-sm font-semibold text-danger">{err("nombre")}</p>}
        </div>

        <div>
          <label htmlFor="precio" className="mb-1 block text-base font-semibold">
            Precio (en pesos)
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-lg font-semibold text-ink-soft">$</span>
            <input
              id="precio"
              name="precio"
              value={precio}
              onChange={(e) => { setPrecio(e.target.value.replace(/\D/g, "")); editado("precio"); }}
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="12990"
              className={`${campo} pl-8 text-lg`}
              aria-invalid={!!err("precio")}
              aria-describedby="precio-ayuda"
            />
          </div>
          <p id="precio-ayuda" className="mt-1 text-sm text-ink-soft">
            {precio ? (
              <>
                Se verá como <strong className="text-ink">{formatCLP(precioNumero)}</strong>
              </>
            ) : (
              "Solo números, sin puntos."
            )}
          </p>
          {err("precio") && <p className="mt-1 text-sm font-semibold text-danger">{err("precio")}</p>}
        </div>

        <div>
          <label htmlFor="categoriaId" className="mb-1 block text-base font-semibold">
            Categoría
          </label>
          <select
            id="categoriaId"
            name="categoriaId"
            value={categoriaId}
            onChange={(e) => { setCategoriaId(e.target.value); editado("categoriaId"); }}
            className={campo}
            aria-invalid={!!err("categoriaId")}
          >
            <option value="">Elige una categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          {err("categoriaId") && <p className="mt-1 text-sm font-semibold text-danger">{err("categoriaId")}</p>}
        </div>

        <div>
          <label htmlFor="descripcion" className="mb-1 block text-base font-semibold">
            Descripción <span className="font-normal text-ink-soft">(opcional)</span>
          </label>
          <textarea
            id="descripcion"
            name="descripcion"
            value={descripcion}
            onChange={(e) => { setDescripcion(e.target.value); editado("descripcion"); }}
            rows={4}
            placeholder="Material, colores, detalles…"
            className={`${campo} py-3`}
          />
          {err("descripcion") && <p className="mt-1 text-sm font-semibold text-danger">{err("descripcion")}</p>}
        </div>

        <div className="divide-y divide-line rounded-2xl border-2 border-line px-4">
          <div className="py-2">
            <Toggle
              name="activo"
              checked={activo}
              onChange={setActivo}
              label="Activo"
              descripcion={activo ? "Se ve en la tienda." : "Oculto: no aparece en la tienda."}
            />
          </div>
          <div className="py-2">
            <Toggle
              name="destacado"
              checked={destacado}
              onChange={setDestacado}
              label="Destacado"
              descripcion="Aparece en el inicio, en “Destacados”."
            />
          </div>
          <div className="py-2">
            <Toggle
              name="llevaStock"
              checked={llevaStock}
              onChange={(v) => { setLlevaStock(v); editado("stock"); }}
              label="Llevar stock"
              descripcion={
                llevaStock
                  ? "Cada venta descuenta unidades. En 0 queda agotado y no se ve en la tienda."
                  : "Sin control de cantidad: se vende siempre."
              }
            />
            {llevaStock && (
              <div className="pb-2">
                <label htmlFor="stock" className="mt-2 mb-1 block text-base font-semibold">
                  Unidades disponibles
                </label>
                <input
                  id="stock"
                  name="stock"
                  value={stock}
                  onChange={(e) => { setStock(e.target.value.replace(/\D/g, "")); editado("stock"); }}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Ej: 5"
                  className={campo}
                  aria-invalid={!!err("stock")}
                />
                <p className="mt-1 text-sm text-ink-soft">
                  Si sirve para varios iPhone, es una sola cantidad para todos.
                </p>
                {err("stock") && <p className="mt-1 text-sm font-semibold text-danger">{err("stock")}</p>}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ---------- Compatibilidad ---------- */}
      <section className={tarjeta} aria-labelledby="t-compat">
        <h2 id="t-compat" className="font-display text-2xl font-bold">
          ¿Para qué iPhone?
        </h2>
        <p className="mt-1 rounded-xl bg-surface p-3 text-sm">
          {totalMarcadas === 0 ? (
            <>
              <strong>Universal:</strong> no marcaste ningún modelo, así que se mostrará para todos (ej. un cargador).
            </>
          ) : (
            <>
              Marcaste <strong>{totalMarcadas}</strong> {totalMarcadas === 1 ? "modelo" : "modelos"}. Apaga “Disponible” si
              no te queda stock para ese modelo (se verá como Agotado).
            </>
          )}
        </p>

        <ul className="mt-3 space-y-2">
          {modelos.map((m) => {
            const marcadas = m.variantes.filter((v) => v.id in compat).length;
            const abierto = abiertos[m.id];
            const todas = marcadas === m.variantes.length;
            return (
              <li key={m.id} className="overflow-hidden rounded-2xl border-2 border-line">
                <button
                  type="button"
                  onClick={() => setAbiertos((prev) => ({ ...prev, [m.id]: !prev[m.id] }))}
                  aria-expanded={abierto}
                  className="flex min-h-14 w-full items-center justify-between gap-2 px-4 text-left"
                >
                  <span>
                    <span className="font-display text-xl font-bold">{m.nombre}</span>
                    {!m.activo && <span className="ml-2 text-sm text-ink-soft">(oculto)</span>}
                    <span className="block text-sm text-ink-soft">
                      {marcadas === 0 ? "Ninguno marcado" : `${marcadas} de ${m.variantes.length} marcados`}
                    </span>
                  </span>
                  <span className="text-base font-semibold text-brand">{abierto ? "Cerrar ▲" : "Abrir ▼"}</span>
                </button>

                {abierto && (
                  <div className="border-t-2 border-line bg-surface/50 px-4 pb-3">
                    <button
                      type="button"
                      onClick={() => marcarTodas(m, !todas)}
                      className="mt-3 min-h-12 w-full rounded-xl border-2 border-brand bg-white font-semibold text-brand"
                    >
                      {todas ? "Quitar todas" : "Marcar todas"}
                    </button>
                    <ul className="mt-2 divide-y divide-line">
                      {m.variantes.map((v) => {
                        const marcada = v.id in compat;
                        return (
                          <li key={v.id} className="py-2">
                            <label className="flex min-h-12 cursor-pointer items-center gap-3">
                              <span
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 ${
                                  marcada ? "border-brand bg-brand text-white" : "border-ink-soft/40 bg-white"
                                }`}
                              >
                                {marcada && <IconCheck className="h-5 w-5" />}
                              </span>
                              <input
                                type="checkbox"
                                checked={marcada}
                                onChange={(e) => marcar(v.id, e.target.checked)}
                                className="sr-only"
                              />
                              <span className="text-lg font-semibold">
                                {v.nombre}
                                {!v.activo && <span className="ml-1 text-sm font-normal text-ink-soft">(oculto)</span>}
                              </span>
                            </label>
                            {marcada && (
                              <div className="mt-1 ml-11">
                                <Toggle
                                  checked={compat[v.id]}
                                  onChange={(si) => setCompat((prev) => ({ ...prev, [v.id]: si }))}
                                  label="Disponible"
                                  descripcion={compat[v.id] ? "Hay stock." : "Se muestra como Agotado."}
                                />
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* ---------- Eliminar ---------- */}
      {!esNuevo && (
        <section className={tarjeta}>
          <h2 className="font-display text-xl font-bold">Eliminar producto</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Si solo quieres ocultarlo por un tiempo, apaga “Activo” en vez de eliminarlo.
          </p>
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            className="mt-3 min-h-12 w-full rounded-xl border-2 border-danger/40 font-semibold text-danger"
          >
            Eliminar este producto
          </button>
          <ConfirmDialog
            abierto={confirmando}
            titulo="¿Eliminar este producto?"
            confirmar="Sí, eliminar"
            peligro
            ocupado={eliminando}
            onConfirmar={eliminar}
            onCerrar={() => setConfirmando(false)}
          >
            Se borrará “{inicial.nombre}” con sus fotos. Esto no se puede deshacer.
          </ConfirmDialog>
        </section>
      )}

      {/* ---------- Barra de guardar (sobre la navegación inferior) ---------- */}
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-line bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-[480px] px-4 py-2">
          <button
            type="submit"
            disabled={guardando || subiendo}
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-lg font-bold text-white disabled:opacity-60"
          >
            {subiendo ? "Esperando fotos…" : guardando ? "Guardando…" : esNuevo ? "Crear producto" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </form>
  );
}
