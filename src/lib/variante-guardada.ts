"use client";

import { useSyncExternalStore } from "react";

/** Variante elegida por el visitante, recordada en este navegador. */
export type VarianteGuardada = {
  id: number;
  nombre: string; // "iPhone 13 Pro"
  modeloSlug: string;
  varianteSlug: string;
};

const CLAVE = "casemood:variante";
const EVENTO = "casemood:variante-cambio";

export function guardarVariante(v: VarianteGuardada) {
  try {
    const nuevo = JSON.stringify(v);
    if (localStorage.getItem(CLAVE) === nuevo) return;
    localStorage.setItem(CLAVE, nuevo);
    window.dispatchEvent(new Event(EVENTO));
  } catch {
    // Modo privado o almacenamiento bloqueado: simplemente no se recuerda.
  }
}

export function olvidarVariante() {
  try {
    localStorage.removeItem(CLAVE);
    window.dispatchEvent(new Event(EVENTO));
  } catch {}
}

function leerRaw(): string | null {
  try {
    return localStorage.getItem(CLAVE);
  } catch {
    return null;
  }
}

function suscribir(cb: () => void) {
  window.addEventListener(EVENTO, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENTO, cb);
    window.removeEventListener("storage", cb);
  };
}

function parsear(raw: string | null): VarianteGuardada | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<VarianteGuardada>;
    if (typeof v.id === "number" && v.nombre && v.modeloSlug && v.varianteSlug) return v as VarianteGuardada;
  } catch {}
  return null;
}

/** Lee la variante guardada (null en el servidor y en el primer render). */
export function useVarianteGuardada(): VarianteGuardada | null {
  const raw = useSyncExternalStore(suscribir, leerRaw, () => null);
  return parsear(raw);
}
