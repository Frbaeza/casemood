"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "@/components/admin/toaster";
import { formatCLP, imgUrl } from "@/lib/format";
import { CANALES, CLIENTE_GENERICO, MEDIOS_PAGO, type Canal, type MedioPago } from "@/lib/ventas";
import {
  buscarClientes,
  buscarProductosVenta,
  type ClienteOpcion,
  crearCliente,
  type ProductoOpcion,
  registrarVenta,
} from "./actions";
import { useBusqueda } from "./use-busqueda";

type Item = { uid: number; producto: ProductoOpcion; modelo: string; cantidad: number; precio: string };

const campo =
  "min-h-12 w-full rounded-xl border-2 border-line bg-white px-3 text-base focus:border-brand focus:outline-none";
const tarjeta = "space-y-3 rounded-3xl bg-white p-4 shadow-sm";
const titulo = "font-display text-xl font-bold";
const chip = (activo: boolean) =>
  `min-h-12 rounded-xl border-2 px-3 text-base font-semibold ${activo ? "border-brand bg-brand text-white" : "border-line bg-white text-ink"}`;

export function VentaForm({ hoy }: { hoy: string }) {
  const router = useRouter();
  const [guardando, startGuardar] = useTransition();

  // Cliente
  const [cliente, setCliente] = useState<ClienteOpcion | null>(null);
  const [textoCliente, setTextoCliente] = useState("");
  const [nuevo, setNuevo] = useState<{ nombre: string; email: string; telefono: string } | null>(null);
  const [creandoCliente, startCrearCliente] = useTransition();
  const clientes = useBusqueda(textoCliente, buscarClientes);

  // Productos
  const [items, setItems] = useState<Item[]>([]);
  const [textoProducto, setTextoProducto] = useState("");
  const productos = useBusqueda(textoProducto, buscarProductosVenta);
  const [siguienteUid, setSiguienteUid] = useState(1);

  // Pago y datos
  const [descuento, setDescuento] = useState("");
  const [medioPago, setMedioPago] = useState<MedioPago | null>(null);
  const [canal, setCanal] = useState<Canal | null>(null);
  const [dia, setDia] = useState(hoy);
  const [boleta, setBoleta] = useState("");
  const [nota, setNota] = useState("");

  const subtotal = items.reduce((s, i) => s + i.cantidad * (Number(i.precio) || 0), 0);
  const descuentoNum = Number(descuento) || 0;
  const total = Math.max(0, subtotal - descuentoNum);

  function agregar(p: ProductoOpcion) {
    setItems((prev) => [
      ...prev,
      { uid: siguienteUid, producto: p, modelo: p.modelos.length === 1 ? p.modelos[0] : "", cantidad: 1, precio: String(p.precio) },
    ]);
    setSiguienteUid((n) => n + 1);
    setTextoProducto("");
  }
  const cambiar = (uid: number, cambio: Partial<Item>) =>
    setItems((prev) => prev.map((i) => (i.uid === uid ? { ...i, ...cambio } : i)));

  function guardarNuevoCliente() {
    if (!nuevo) return;
    startCrearCliente(async () => {
      const r = await crearCliente(nuevo);
      if (r.ok && r.cliente) {
        setCliente(r.cliente);
        setNuevo(null);
        setTextoCliente("");
        toast(r.mensaje ?? "Cliente creado.");
      } else {
        toast((r.errores && Object.values(r.errores)[0]) ?? r.mensaje ?? "No se pudo crear el cliente.", "error");
      }
    });
  }

  function registrar() {
    if (items.length === 0) return toast("Agrega al menos un producto.", "error");
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
        boleta,
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
        {cliente ? (
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-brand-soft p-3">
            <div className="min-w-0">
              <p className="truncate text-base font-bold">{cliente.nombre}</p>
              <p className="truncate text-sm text-ink-soft">{cliente.email ?? cliente.telefono ?? "Sin correo ni teléfono"}</p>
            </div>
            <button type="button" onClick={() => setCliente(null)} className="min-h-12 shrink-0 rounded-xl border-2 border-line bg-white px-3 font-semibold">
              Cambiar
            </button>
          </div>
        ) : nuevo ? (
          <div className="space-y-2 rounded-2xl bg-surface p-3">
            <p className="text-base font-semibold">Nuevo cliente</p>
            <input aria-label="Nombre" placeholder="Nombre" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} className={campo} />
            <input aria-label="Correo" placeholder="Correo (para que vea sus compras)" type="email" autoCapitalize="none" value={nuevo.email} onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })} className={campo} />
            <input aria-label="Teléfono" placeholder="Teléfono, ej. 56912345678" inputMode="tel" value={nuevo.telefono} onChange={(e) => setNuevo({ ...nuevo, telefono: e.target.value })} className={campo} />
            <p className="text-sm text-ink-soft">Con el correo, sus compras aparecen solas cuando cree su cuenta.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setNuevo(null)} className="min-h-12 rounded-xl border-2 border-line bg-white px-4 font-semibold">
                Cancelar
              </button>
              <button type="button" disabled={creandoCliente} onClick={guardarNuevoCliente} className="min-h-12 flex-1 rounded-xl bg-brand px-4 font-semibold text-white disabled:opacity-50">
                {creandoCliente ? "Creando…" : "Crear cliente"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="rounded-2xl bg-surface p-3 text-base">
              <strong>{CLIENTE_GENERICO}</strong>
              <span className="block text-sm text-ink-soft">Si no lo eliges, la venta queda así y puedes asignarla después.</span>
            </p>
            <input
              type="search"
              aria-label="Buscar cliente"
              placeholder="Buscar por nombre, correo o teléfono"
              value={textoCliente}
              onChange={(e) => setTextoCliente(e.target.value)}
              className={campo}
            />
            {clientes.buscando && <p className="text-sm text-ink-soft">Buscando…</p>}
            {clientes.lista.length > 0 && (
              <ul className="divide-y divide-line overflow-hidden rounded-2xl border-2 border-line">
                {clientes.lista.map((c) => (
                  <li key={c.id}>
                    <button type="button" onClick={() => { setCliente(c); setTextoCliente(""); }} className="flex min-h-14 w-full flex-col justify-center px-3 py-2 text-left active:bg-surface">
                      <span className="text-base font-semibold">{c.nombre}</span>
                      <span className="text-sm text-ink-soft">{c.email ?? c.telefono ?? "—"}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {textoCliente.trim().length >= 2 && !clientes.buscando && clientes.lista.length === 0 && (
              <p className="text-sm text-ink-soft">No hay clientes con “{textoCliente.trim()}”.</p>
            )}
            <button
              type="button"
              onClick={() => setNuevo({ nombre: /\d|@/.test(textoCliente) ? "" : textoCliente.trim(), email: textoCliente.includes("@") ? textoCliente.trim() : "", telefono: /^\+?\d[\d\s]+$/.test(textoCliente.trim()) ? textoCliente.trim() : "" })}
              className="min-h-12 w-full rounded-xl border-2 border-dashed border-brand bg-brand-soft px-3 font-semibold text-brand"
            >
              + Nuevo cliente
            </button>
          </>
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
              const sinStock = i.producto.stock !== null && i.cantidad > i.producto.stock;
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
                        {i.producto.stock !== null && ` · Stock: ${i.producto.stock}`}
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
                      <option value="">¿Para qué iPhone? (opcional)</option>
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
                    <span className={sinStock ? "font-semibold text-danger" : "text-ink-soft"}>
                      {sinStock ? `Solo quedan ${i.producto.stock}` : "Subtotal"}
                    </span>
                    <strong>{formatCLP(i.cantidad * (Number(i.precio) || 0))}</strong>
                  </p>
                </li>
              );
            })}
          </ul>
        )}
        <input
          type="search"
          aria-label="Buscar producto"
          placeholder={items.length ? "Agregar otro producto" : "Buscar producto por nombre"}
          value={textoProducto}
          onChange={(e) => setTextoProducto(e.target.value)}
          className={campo}
        />
        {productos.buscando && <p className="text-sm text-ink-soft">Buscando…</p>}
        {productos.lista.length > 0 && (
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border-2 border-line">
            {productos.lista.map((p) => {
              const agotado = p.stock !== null && p.stock <= 0;
              return (
                <li key={p.id}>
                  <button type="button" disabled={agotado} onClick={() => agregar(p)} className="flex min-h-16 w-full items-center gap-3 px-3 py-2 text-left active:bg-surface disabled:opacity-50">
                    <span className="h-12 w-9 shrink-0 overflow-hidden rounded-md bg-surface">
                      {p.imagen && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imgUrl(p.imagen)} alt="" className="h-full w-full object-cover" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-semibold">{p.nombre}</span>
                      <span className="block text-sm text-ink-soft">
                        {formatCLP(p.precio)}
                        {p.stock !== null && (agotado ? " · Agotado" : ` · Stock: ${p.stock}`)}
                        {!p.activo && " · Oculto"}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {textoProducto.trim().length >= 2 && !productos.buscando && productos.lista.length === 0 && (
          <p className="text-sm text-ink-soft">No hay productos con “{textoProducto.trim()}”.</p>
        )}
      </section>

      {/* ---------- Pago ---------- */}
      <section className={tarjeta} aria-labelledby="t-pago">
        <h2 id="t-pago" className={titulo}>
          Pago
        </h2>
        <div>
          <p className="mb-2 text-base font-semibold">Medio de pago</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Medio de pago">
            {(Object.keys(MEDIOS_PAGO) as MedioPago[]).map((k) => (
              <button key={k} type="button" aria-pressed={medioPago === k} onClick={() => setMedioPago(k)} className={chip(medioPago === k)}>
                {MEDIOS_PAGO[k]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-base font-semibold">¿Por dónde fue la venta?</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Canal de venta">
            {(Object.keys(CANALES) as Canal[]).map((k) => (
              <button key={k} type="button" aria-pressed={canal === k} onClick={() => setCanal(k)} className={chip(canal === k)}>
                {CANALES[k]}
              </button>
            ))}
          </div>
        </div>
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
          N° de boleta del SII (opcional)
          <input value={boleta} onChange={(e) => setBoleta(e.target.value)} inputMode="numeric" className={`${campo} mt-1`} />
        </label>
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
