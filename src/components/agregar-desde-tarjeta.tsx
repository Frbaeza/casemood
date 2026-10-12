"use client";

import Link from "next/link";
import { IconCheck } from "@/components/icons";
import { agregarAlPedido, cambiarCantidad, usePedido } from "@/lib/carrito";

/**
 * "+" en la tarjeta de un listado. Si el producto ya está en el pedido se cambia por "− n +" para
 * subir o bajar la cantidad. Si hay que elegir iPhone y no se sabe cuál (listado general de un
 * producto para varios modelos), lleva al producto a elegirlo (en verde si ya hay alguno en el pedido).
 */
export function AgregarDesdeTarjeta({
  producto,
  modelo,
  href,
}: {
  producto: { productoId: number; slug: string; nombre: string; precio: number; imagen: string | null };
  /** undefined = falta elegir el iPhone; null = universal; texto = iPhone ya conocido. */
  modelo: string | null | undefined;
  href: string;
}) {
  const pedido = usePedido();
  // Cuántas unidades de este producto (y de este iPhone, si se conoce) hay en el pedido.
  const enPedido = pedido
    .filter((i) => i.productoId === producto.productoId && (modelo === undefined || i.modelo === modelo))
    .reduce((n, i) => n + i.cantidad, 0);

  // Círculo de 36 px a la derecha del precio; el área táctil sigue siendo de 48 px.
  const clase = "-mr-1.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full active:scale-95";
  const circulo = (
    <span
      className={`flex h-9 w-9 items-center justify-center rounded-full text-base font-bold text-white shadow-sm ${
        enPedido ? "bg-whatsapp" : "bg-brand"
      }`}
    >
      {enPedido > 1 ? (
        enPedido
      ) : enPedido === 1 ? (
        <IconCheck className="h-5 w-5" />
      ) : (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" aria-hidden>
          <path d="M12 5v14M5 12h14" />
        </svg>
      )}
    </span>
  );
  const yaEsta = enPedido ? ` (ya tienes ${enPedido} en tu pedido)` : "";

  if (modelo === undefined) {
    return (
      <Link href={href} aria-label={`Elegir iPhone para ${producto.nombre}${yaEsta}`} className={clase}>
        {circulo}
      </Link>
    );
  }
  // Ya está en el pedido: "− n +" compacto, a la derecha del precio.
  if (enPedido > 0) {
    const boton =
      "flex h-10 w-8 shrink-0 items-center justify-center rounded-full text-xl leading-none font-bold text-whatsapp active:bg-white";
    return (
      <div className="flex shrink-0 items-center rounded-full border-2 border-whatsapp bg-whatsapp/10">
        <button
          type="button"
          onClick={() => cambiarCantidad(producto.productoId, modelo, enPedido - 1)}
          aria-label={`Quitar uno de ${producto.nombre}`}
          className={boton}
        >
          −
        </button>
        <span className="min-w-5 text-center text-base font-bold" aria-live="polite">
          {enPedido} <span className="sr-only">en tu pedido</span>
        </span>
        <button
          type="button"
          onClick={() => agregarAlPedido({ ...producto, modelo })}
          aria-label={`Agregar otro ${producto.nombre}`}
          className={boton}
        >
          +
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => agregarAlPedido({ ...producto, modelo })}
      aria-label={`Agregar ${producto.nombre}${modelo ? ` para ${modelo}` : ""} al pedido${yaEsta}`}
      className={clase}
    >
      {circulo}
    </button>
  );
}
