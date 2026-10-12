import type { Metadata } from "next";
import { BackLink } from "@/components/back-link";
import { getTienda } from "@/lib/configuracion";
import { PedidoVista } from "./pedido-vista";

export const metadata: Metadata = { title: "Tu pedido", robots: { index: false } };

export default async function PedidoPage() {
  const tienda = await getTienda();

  return (
    <div className="space-y-5 pt-3 pb-8">
      <BackLink href="/" historial>
        Seguir comprando
      </BackLink>
      <h1 className="font-display text-4xl leading-tight font-bold">Tu pedido</h1>
      <PedidoVista tienda={tienda.nombre} whatsapp={tienda.whatsapp} />
    </div>
  );
}
