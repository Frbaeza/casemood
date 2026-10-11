import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { getDb } from "@/lib/db";
import { formatCLP } from "@/lib/format";
import { CANALES, CLIENTE_GENERICO, fechaCorta, MEDIOS_PAGO } from "@/lib/ventas";
import { AnularVenta, ReasignarCliente } from "./venta-acciones";

export default async function VentaPage({ params }: PageProps<"/admin/ventas/[id]">) {
  const { id: idTexto } = await params;
  if (!/^\d+$/.test(idTexto)) notFound();
  const db = await getDb();
  const venta = await db.venta.findUnique({
    where: { id: Number(idTexto) },
    include: {
      cliente: { select: { id: true, nombre: true, email: true, telefono: true } },
      items: { orderBy: { id: "asc" } },
    },
  });
  if (!venta) notFound();

  const dato = (titulo: string, valor: React.ReactNode) => (
    <div className="flex justify-between gap-3 py-2">
      <dt className="text-ink-soft">{titulo}</dt>
      <dd className="text-right font-semibold">{valor}</dd>
    </div>
  );

  return (
    <div className="space-y-4">
      <BackLink href="/admin/ventas">Volver a ventas</BackLink>
      <div>
        <h1 className="font-display text-3xl font-bold">Venta #{venta.id}</h1>
        <p className="text-base text-ink-soft">{fechaCorta(venta.fecha)}</p>
        {venta.anulada && (
          <p className="mt-2 rounded-2xl bg-danger/10 p-3 text-base font-semibold text-danger">
            Anulada{venta.anuladaEn ? ` el ${fechaCorta(venta.anuladaEn)}` : ""}. No cuenta en los totales.
          </p>
        )}
      </div>

      <section className="space-y-3 rounded-3xl bg-white p-4 shadow-sm" aria-labelledby="t-cliente">
        <h2 id="t-cliente" className="font-display text-xl font-bold">
          Cliente
        </h2>
        {venta.cliente ? (
          <Link href={`/admin/clientes/${venta.cliente.id}`} className="block rounded-2xl bg-brand-soft p-3">
            <span className="block text-base font-bold">{venta.cliente.nombre}</span>
            <span className="block text-sm text-ink-soft">{venta.cliente.email ?? venta.cliente.telefono ?? "Sin correo ni teléfono"}</span>
          </Link>
        ) : (
          <p className="rounded-2xl bg-surface p-3 text-base font-semibold">{CLIENTE_GENERICO}</p>
        )}
        <ReasignarCliente ventaId={venta.id} tieneCliente={!!venta.cliente} />
      </section>

      <section className="rounded-3xl bg-white p-4 shadow-sm" aria-labelledby="t-items">
        <h2 id="t-items" className="font-display text-xl font-bold">
          Productos
        </h2>
        <ul className="mt-2 divide-y divide-line">
          {venta.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3 py-2">
              <div className="min-w-0">
                {i.productoId ? (
                  <Link href={`/admin/productos/${i.productoId}`} className="text-base font-semibold underline-offset-4 hover:underline">
                    {i.nombre}
                  </Link>
                ) : (
                  <p className="text-base font-semibold">{i.nombre}</p>
                )}
                <p className="text-sm text-ink-soft">
                  {i.cantidad} × {formatCLP(i.precioUnitario)}
                  {i.modelo && ` · ${i.modelo}`}
                </p>
              </div>
              <p className="shrink-0 font-semibold">{formatCLP(i.subtotal)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-2 divide-y divide-line border-t-2 border-line text-base">
          {venta.descuento > 0 && dato("Subtotal", formatCLP(venta.subtotal))}
          {venta.descuento > 0 && dato("Descuento", `− ${formatCLP(venta.descuento)}`)}
          <div className="flex justify-between gap-3 py-2">
            <dt className="font-bold">Total</dt>
            <dd className={`font-display text-2xl font-bold ${venta.anulada ? "line-through" : ""}`}>{formatCLP(venta.total)}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-3xl bg-white p-4 shadow-sm" aria-labelledby="t-datos">
        <h2 id="t-datos" className="font-display text-xl font-bold">
          Datos
        </h2>
        <dl className="mt-1 divide-y divide-line text-base">
          {dato("Medio de pago", MEDIOS_PAGO[venta.medioPago as keyof typeof MEDIOS_PAGO] ?? venta.medioPago)}
          {dato("Canal", CANALES[venta.canal as keyof typeof CANALES] ?? venta.canal)}
          {venta.boleta && dato("Boleta SII", venta.boleta)}
          {dato("Registrada por", <span className="break-all">{venta.creadaPor}</span>)}
        </dl>
        {venta.nota && <p className="mt-2 rounded-2xl bg-surface p-3 text-base whitespace-pre-line">{venta.nota}</p>}
      </section>

      {!venta.anulada && <AnularVenta ventaId={venta.id} />}
    </div>
  );
}
