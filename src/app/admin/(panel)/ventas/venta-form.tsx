"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "@/components/admin/toaster";
import { formatCLP, imgUrl } from "@/lib/format";
import { CANALES, CLIENTE_GENERICO, MEDIOS_PAGO, type Canal, type MedioPago } from "@/lib/ventas";
import { type ClienteOpcion, type ProductoOpcion, registrarVenta } from "./actions";
import { SelectorCliente } from "./selector-cliente";
import { type CategoriaFiltro, type ModeloFiltro, SelectorProducto } from "./selector-producto";

type Item = { uid: number; producto: ProductoOpcion; modelo: string; cantidad: number; precio: string };

const campo =
  "min-h-12 w-full rounded-xl border-2 border-line bg-white px-3 text-base focus:border-brand focus:outline-none";
const tarjeta = "space-y-3 rounded-3xl bg-white p-4 shadow-sm";
const titulo = "font-display text-xl font-bold";

export function VentaForm({ hoy, categorias, modelos }: { hoy: string; categorias: CategoriaFiltro[]; modelos: ModeloFiltro[] }) {
  const router = useRouter();
  const [guardando, startGuardar] = useTransition();

  // Cliente
  const [cliente, setCliente] = useState<ClienteOpcion | null>(null);
  const [eligiendoCliente, setEligiendoCliente] = useState(true);

  // Productos
  const [items, setItems] = useState<Item[]>([]);
  const [agregando, setAgregando] = useState(true);
  const [siguienteUid, setSiguienteUid] = useState(1);

  // Pago y datos
  const [descuento, setDescuento] = useState("");
  const [medioPago, setMedioPago] = useState<MedioPago | null>(null);
  const [canal, setCanal] = useState<Canal | null>(null);
  const [dia, setDia] = useState(hoy);
  const [nota, setNota] = useState("");

  const subtotal = items.reduce((s, i) => s + i.cantidad * (Number(i.precio) || 0), 0);
  const descuentoNum = Number(descuento) || 0;
  const total = Math.max(0, subtotal - descuentoNum);

  function agregar(p: ProductoOpcion, modeloFiltro: string | null) {
    // El iPhone elegido en el filtro (o el único compatible) queda anotado en la venta.
    const modelo = modeloFiltro && p.modelos.includes(modeloFiltro) ? modeloFiltro : p.modelos.length === 1 ? p.modelos[0] : "";
    setItems((prev) => [...prev, { uid: siguienteUid, producto: p, modelo, cantidad: 1, precio: String(p.precio) }]);
    setSiguienteUid((n) => n + 1);
    setAgregando(false);
    toast(`Agregado: ${p.nombre}`);
  }
  const cambiar = (uid: number, cambio: Partial<Item>) =>
    setItems((prev) => prev.map((i) => (i.uid === uid ? { ...i, ...cambio } : i)));

  function registrar() {
    if (items.length === 0) return toast("Agrega al menos un producto.", "error");
    // Para saber qué modelo se vende más: el iPhone es obligatorio si el producto depende del modelo.
    const sinModelo = items.find((i) => i.producto.modelos.length > 1 && !i.modelo);
    if (sinModelo) return toast(`Elige para qué iPhone es “${sinModelo.producto.nombre}”.`, "error");
    if (!medioPago) return toast("Elige el medio de pago.", "error");
    if (!canal) return toast("Elige por dónde fue la venta.", "error");
    startGuardar(async () => {
      const r = await registrarVenta({
        clienteId: cliente?.id ?? null,
        dia,
        items: items.map((i) => ({
          productoId: i.producto.id,
          modelo: i.modelo || null,
          cantidad: i.cantidad,
          precioUnitario: Number(i.precio) || 0,
        })),
        descuento: descuentoNum,
        medioPago,
        canal,
        boleta: "",
        nota,
      });
      if (r.ok) {
        toast(r.mensaje ?? "Venta registrada.");
        router.push(`/admin/ventas/${r.id}`);
      } else {
        toast((r.errores && Object.values(r.errores)[0]) ?? r.mensaje ?? "No se pudo registrar.", "error");
      }
    });
  }

  return (
    <div className="mt-4 space-y-5">
      {/* ---------- Cliente ---------- */}
      <section className={tarjeta} aria-labelledby="t-cliente">
        <h2 id="t-cliente" className={titulo}>
          Cliente
        </h2>
        {eligiendoCliente ? (
          <SelectorCliente
            onElegir={(c) => {
              setCliente(c);
              setEligiendoCliente(false);
            }}
          />
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-brand-soft p-3">
            <div className="min-w-0">
              <p className="truncate text-base font-bold">{cliente?.nombre ?? CLIENTE_GENERICO}</p>
              <p className="truncate text-sm text-ink-soft">
                {cliente ? (cliente.email ?? cliente.telefono ?? "—") : "Podrás asignarla a su cuenta después."}
              </p>
            </div>
            <button type="button" onClick={() => setEligiendoCliente(true)} className="min-h-12 shrink-0 rounded-xl border-2 border-line bg-white px-3 font-semibold">
              Cambiar
            </button>
          </div>
        )}
      </section>

      {/* ---------- Productos ---------- */}
      <section className={tarjeta} aria-labelledby="t-productos">
        <h2 id="t-productos" className={titulo}>
          Productos
        </h2>
        {items.length > 0 && (
          <ul className="space-y-3">
            {items.map((i) => {
              return (
                <li key={i.uid} className="space-y-2 rounded-2xl border-2 border-line p-3">
                  <div className="flex gap-3">
                    <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-surface">
                      {i.producto.imagen && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imgUrl(i.producto.imagen)} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base leading-snug font-semibold">{i.producto.nombre}</p>
                      <p className="text-sm text-ink-soft">
                        {i.producto.categoria}
                        {i.modelo && i.producto.modelos.length <= 1 && ` · ${i.modelo}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setItems((prev) => prev.filter((x) => x.uid !== i.uid))}
                      className="min-h-12 shrink-0 self-start rounded-xl px-2 text-sm font-semibold text-danger"
                    >
                      Quitar
                    </button>
                  </div>
                  {i.producto.modelos.length > 1 && (
                    <select aria-label="Para qué iPhone" value={i.modelo} onChange={(e) => cambiar(i.uid, { modelo: e.target.value })} className={campo}>
                      <option value="">¿Para qué iPhone? (obligatorio)</option>
                      {i.producto.modelos.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  )}
                  <div className="flex items-end gap-2">
                    <div>
                      <span className="mb-1 block text-sm font-semibold">Cantidad</span>
                      <div className="flex items-center">
                        <button type="button" aria-label="Uno menos" disabled={i.cantidad <= 1} onClick={() => cambiar(i.uid, { cantidad: i.cantidad - 1 })} className="h-12 w-12 rounded-l-xl border-2 border-line text-xl font-bold disabled:opacity-40">
                          −
                        </button>
                        <span className="flex h-12 w-12 items-center justify-center border-y-2 border-line text-lg font-bold">{i.cantidad}</span>
                        <button type="button" aria-label="Uno más" onClick={() => cambiar(i.uid, { cantidad: i.cantidad + 1 })} className="h-12 w-12 rounded-r-xl border-2 border-line text-xl font-bold">
                          +
                        </button>
                      </div>
                    </div>
                    <label className="min-w-0 flex-1 text-sm font-semibold">
                      Precio unitario
                      <input
                        inputMode="numeric"
                        value={i.precio}
                        onChange={(e) => cambiar(i.uid, { precio: e.target.value.replace(/\D/g, "") })}
                        className={`${campo} mt-1`}
                      />
                    </label>
                  </div>
                  <p className="flex justify-between text-base">
                    <span className="text-ink-soft">
                      Subtotal
                    </span>
                    <strong>{formatCLP(i.cantidad * (Number(i.precio) || 0))}</strong>
                  </p>
                </li>
              );
            })}
          </ul>
        )}
        {agregando ? (
          <>
            <SelectorProducto categorias={categorias} modelos={modelos} onElegir={agregar} />
            {items.length > 0 && (
              <button type="button" onClick={() => setAgregando(false)} className="min-h-12 w-full rounded-xl border-2 border-line bg-white px-3 font-semibold">
                Listo, no agregar más
              </button>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={() => setAgregando(true)}
            className="min-h-12 w-full rounded-xl border-2 border-dashed border-brand bg-brand-soft px-3 font-semibold text-brand"
          >
            + Agregar otro producto
          </button>
        )}
      </section>

      {/* ---------- Pago ---------- */}
      <section className={tarjeta} aria-labelledby="t-pago">
        <h2 id="t-pago" className={titulo}>
          Pago
        </h2>
        <label className="block text-base font-semibold">
          Medio de pago
          <select value={medioPago ?? ""} onChange={(e) => setMedioPago((e.target.value || null) as MedioPago | null)} className={`${campo} mt-1 font-normal`}>
            <option value="">Elige el medio de pago</option>
            {(Object.keys(MEDIOS_PAGO) as MedioPago[]).map((k) => (
              <option key={k} value={k}>
                {MEDIOS_PAGO[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-base font-semibold">
          ¿Por dónde fue la venta?
          <select value={canal ?? ""} onChange={(e) => setCanal((e.target.value || null) as Canal | null)} className={`${campo} mt-1 font-normal`}>
            <option value="">Elige por dónde fue</option>
            {(Object.keys(CANALES) as Canal[]).map((k) => (
              <option key={k} value={k}>
                {CANALES[k]}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-sm font-semibold">
            Fecha
            <input type="date" value={dia} max={hoy} onChange={(e) => setDia(e.target.value)} className={`${campo} mt-1`} />
          </label>
          <label className="text-sm font-semibold">
            Descuento
            <input inputMode="numeric" placeholder="0" value={descuento} onChange={(e) => setDescuento(e.target.value.replace(/\D/g, ""))} className={`${campo} mt-1`} />
          </label>
        </div>
        <label className="block text-sm font-semibold">
          Nota (opcional)
          <textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={2} maxLength={500} className={`${campo} mt-1 py-2`} />
        </label>
      </section>

      <div className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] z-20 space-y-1 rounded-3xl bg-white/95 p-3 shadow-lg backdrop-blur">
        {descuentoNum > 0 && (
          <p className="flex justify-between text-sm text-ink-soft">
            <span>
              {formatCLP(subtotal)} − {formatCLP(descuentoNum)} de descuento
            </span>
          </p>
        )}
        <button
          type="button"
          disabled={guardando || items.length === 0}
          onClick={registrar}
          className="flex min-h-14 w-full items-center justify-between gap-2 rounded-2xl bg-brand px-5 text-lg font-bold text-white disabled:opacity-50"
        >
          <span>{guardando ? "Registrando…" : "Registrar venta"}</span>
          <span>{formatCLP(total)}</span>
        </button>
      </div>
    </div>
  );
}
