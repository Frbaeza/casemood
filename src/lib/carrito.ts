"use client";

import { useSyncExternalStore } from "react";

/** Producto en el pedido. `modelo`: versión de iPhone elegida (null en productos universales). */
export type ItemPedido = {
  productoId: number;
  slug: string;
  nombre: string;
  precio: number;
  imagen: string | null;
  modelo: string | null;
  cantidad: number;
};

const CLAVE = "casemood:pedido";
const EVENTO = "casemood:pedido-cambio";
const MAX_CANTIDAD = 20;

const mismo = (a: ItemPedido, productoId: number, modelo: string | null) =>
  a.productoId === productoId && a.modelo === modelo;

function leerRaw(): string {
  try {
    return localStorage.getItem(CLAVE) ?? "[]";
  } catch {
    return "[]";
  }
}

function parsear(raw: string): ItemPedido[] {
  try {
    const lista = JSON.parse(raw) as ItemPedido[];
    return Array.isArray(lista) ? lista.filter((i) => typeof i.productoId === "number" && i.cantidad > 0) : [];
  } catch {
    return [];
  }
}

function guardar(lista: ItemPedido[]) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(lista));
    window.dispatchEvent(new Event(EVENTO));
  } catch {
    // Modo privado o almacenamiento bloqueado: el pedido no se puede recordar.
  }
}

export function agregarAlPedido(item: Omit<ItemPedido, "cantidad">, cantidad = 1) {
  const lista = parsear(leerRaw());
  const existente = lista.find((i) => mismo(i, item.productoId, item.modelo));
  if (existente) existente.cantidad = Math.min(MAX_CANTIDAD, existente.cantidad + cantidad);
  else lista.push({ ...item, cantidad });
  guardar(lista);
}

export function cambiarCantidad(productoId: number, modelo: string | null, cantidad: number) {
  const lista = parsear(leerRaw())
    .map((i) => (mismo(i, productoId, modelo) ? { ...i, cantidad: Math.min(MAX_CANTIDAD, cantidad) } : i))
    .filter((i) => i.cantidad > 0);
  guardar(lista);
}

/** Actualiza nombre, precio y foto con lo vigente en la tienda; quita lo que ya no existe. */
export function actualizarPedido(vigentes: Map<number, { nombre: string; precio: number; imagen: string | null; slug: string }>) {
  const lista = parsear(leerRaw())
    .filter((i) => vigentes.has(i.productoId))
    .map((i) => ({ ...i, ...vigentes.get(i.productoId)! }));
  if (JSON.stringify(lista) !== leerRaw()) guardar(lista);
}

export function vaciarPedido() {
  guardar([]);
}

function suscribir(cb: () => void) {
  window.addEventListener(EVENTO, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENTO, cb);
    window.removeEventListener("storage", cb);
  };
}

/** Pedido guardado en este navegador (vacío en el servidor y en el primer render). */
export function usePedido(): ItemPedido[] {
  const raw = useSyncExternalStore(suscribir, leerRaw, () => "[]");
  return parsear(raw);
}

export const unidadesDe = (lista: ItemPedido[]) => lista.reduce((n, i) => n + i.cantidad, 0);
export const subtotalDe = (lista: ItemPedido[]) => lista.reduce((n, i) => n + i.cantidad * i.precio, 0);
