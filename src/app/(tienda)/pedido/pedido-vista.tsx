"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IconWhatsApp } from "@/components/icons";
import {
  actualizarPedido,
  cambiarCantidad,
  type ItemPedido,
  subtotalDe,
  unidadesDe,
  usePedido,
  vaciarPedido,
} from "@/lib/carrito";
import { formatCLP, imgUrl, whatsappUrl } from "@/lib/format";
import { revisarPedido } from "./acciones";

const tarjeta = "space-y-3 rounded-3xl bg-white p-4 shadow-sm";

/** Mensaje de WhatsApp con todo el pedido. */
function armarMensaje(o: { tienda: string; items: ItemPedido[] }): string {
  const lineas = [`Hola ${o.tienda}, quiero hacer este pedido:`, ""];
  o.items.forEach((i, n) => {
    lineas.push(`${n + 1}. ${i.nombre}${i.modelo ? ` (${i.modelo})` : ""} — ${i.cantidad} × ${formatCLP(i.precio)}`);
  });
  const subtotal = subtotalDe(o.items);
  lineas.push("", `Total: ${formatCLP(subtotal)}`);
  return lineas.join("\n");
}

export function PedidoVista({ tienda, whatsapp }: { tienda: string; whatsapp: string }) {
  const pedido = usePedido();
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  // Al abrir: precios, nombres y fotos vigentes; se quita lo que ya no se vende.
  const ids = [...new Set(pedido.map((i) => i.productoId))].sort().join(",");
  useEffect(() => {
    if (!ids) return;
    let vigente = true;
    revisarPedido(ids.split(",").map(Number)).then((lista) => {
      if (!vigente) return;
      const mapa = new Map(lista.map((p) => [p.productoId, p]));
      actualizarPedido(mapa);
      const quitados = pedido.filter((i) => !mapa.has(i.productoId)).length;
      const cambioPrecio = pedido.some((i) => mapa.has(i.productoId) && mapa.get(i.productoId)!.precio !== i.precio);
      if (quitados) setAviso(`Quitamos ${quitados === 1 ? "un producto que ya no está" : `${quitados} productos que ya no están`} disponible.`);
      else if (cambioPrecio) setAviso("Actualizamos los precios a los vigentes.");
    });
    return () => {
      vigente = false;
    };
    // Solo al abrir o si cambian los productos (no la cantidad).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  const unidades = unidadesDe(pedido);
  const subtotal = subtotalDe(pedido);
  const mensaje = armarMensaje({ tienda, items: pedido });

  if (pedido.length === 0) {
    return (
      <div className="space-y-4 rounded-3xl border-2 border-dashed border-line p-6 text-center">
        <p className="text-lg font-semibold">Tu pedido está vacío.</p>
        <p className="text-base text-ink-soft">En cada producto toca “Agregar al pedido”.</p>
        <Link href="/" className="inline-flex min-h-12 items-center rounded-xl bg-brand px-5 font-semibold text-white">
          Ver productos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {aviso && (
        <p role="status" className="rounded-2xl bg-brand-soft p-3 text-base">
          {aviso}
        </p>
      )}

      <ul className="space-y-3">
        {pedido.map((i) => (
          <li key={`${i.productoId}-${i.modelo ?? ""}`} className="flex gap-3 rounded-3xl border-2 border-line bg-white p-3">
            <Link href={`/producto/${i.slug}`} className="h-28 w-21 shrink-0 overflow-hidden rounded-2xl bg-surface">
              {i.imagen && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imgUrl(i.imagen)} alt={i.nombre} className="h-full w-full object-cover" />
              )}
            </Link>
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="text-base leading-snug font-semibold">{i.nombre}</p>
              {i.modelo && <p className="text-sm text-ink-soft">Para {i.modelo}</p>}
              <p className="text-base font-bold">{formatCLP(i.precio * i.cantidad)}</p>
              <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center">
                  <button
                    type="button"
                    aria-label={`Uno menos de ${i.nombre}`}
                    onClick={() => cambiarCantidad(i.productoId, i.modelo, i.cantidad - 1)}
                    className="h-12 w-12 rounded-l-xl border-2 border-line text-xl font-bold"
                  >
                    −
                  </button>
                  <span className="flex h-12 w-11 items-center justify-center border-y-2 border-line text-lg font-bold">{i.cantidad}</span>
                  <button
                    type="button"
                    aria-label={`Uno más de ${i.nombre}`}
                    onClick={() => cambiarCantidad(i.productoId, i.modelo, i.cantidad + 1)}
                    className="h-12 w-12 rounded-r-xl border-2 border-line text-xl font-bold"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => cambiarCantidad(i.productoId, i.modelo, 0)}
                  className="min-h-12 px-2 text-base font-semibold text-danger"
                >
                  Quitar
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <section className={tarjeta} aria-label="Total">
        <div className="flex items-baseline justify-between">
          <span className="text-lg font-bold">
            Total <span className="text-base font-normal text-ink-soft">({unidades} {unidades === 1 ? "producto" : "productos"})</span>
          </span>
          <span className="font-display text-3xl font-bold">{formatCLP(subtotal)}</span>
        </div>
        <a
          href={whatsappUrl(whatsapp, mensaje)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setEnviado(true)}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-whatsapp px-4 text-lg font-bold text-white shadow-md active:brightness-95"
        >
          <IconWhatsApp className="h-6 w-6" />
          Enviar pedido por WhatsApp
        </a>
        <p className="text-center text-sm text-ink-soft">Te confirmamos disponibilidad, envío y total por WhatsApp.</p>
      </section>

      {enviado && (
        <div role="status" className="space-y-3 rounded-3xl bg-brand-soft p-4 text-center">
          <p className="text-base font-semibold">¿Ya enviaste tu pedido por WhatsApp?</p>
          <button
            type="button"
            onClick={() => {
              vaciarPedido();
              setEnviado(false);
            }}
            className="min-h-12 w-full rounded-xl bg-brand px-4 font-semibold text-white"
          >
            Sí, vaciar mi pedido
          </button>
        </div>
      )}
    </div>
  );
}
