import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { getClienteSesion } from "@/lib/cuenta";
import { getDb } from "@/lib/db";
import { formatCLP, imgUrl } from "@/lib/format";
import { fechaCorta, MEDIOS_PAGO } from "@/lib/ventas";

export const metadata: Metadata = { title: "Detalle de compra", robots: { index: false } };

export default async function DetalleCompraPage({ params }: PageProps<"/cuenta/compras/[id]">) {
  const cliente = await getClienteSesion();
  if (!cliente) redirect("/cuenta/entrar");
  if (!cliente.fechaNacimiento) redirect("/cuenta/completar");

  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const db = await getDb();
  // Solo compras propias y vigentes: otra persona no puede ver esta página aunque tenga el link.
  const venta = await db.venta.findFirst({
    where: { id: Number(id), clienteId: cliente.id, anulada: false },
    select: {
      id: true,
      fecha: true,
      subtotal: true,
      descuento: true,
      total: true,
      medioPago: true,
      items: {
        orderBy: { id: "asc" },
        select: {
          id: true,
          nombre: true,
          modelo: true,
          cantidad: true,
          precioUnitario: true,
          subtotal: true,
          producto: {
            select: { slug: true, activo: true, imagenes: { orderBy: { orden: "asc" }, take: 1, select: { key: true } } },
          },
        },
      },
    },
  });
  if (!venta) notFound();
  const unidades = venta.items.reduce((n, i) => n + i.cantidad, 0);

  return (
    <div className="space-y-5 pt-3 pb-8">
      <BackLink href="/cuenta" historial>
        Volver
      </BackLink>
      <header>
        <h1 className="font-display text-4xl leading-tight font-bold">Tu compra</h1>
        <p className="mt-1 text-lg text-ink-soft">
          {fechaCorta(venta.fecha)} · {unidades} {unidades === 1 ? "producto" : "productos"}
        </p>
      </header>

      <ul className="space-y-3">
        {venta.items.map((i) => {
          const imagen = i.producto?.imagenes[0]?.key;
          const enTienda = i.producto?.activo ? `/producto/${i.producto.slug}` : null;
          return (
            <li key={i.id} className="flex gap-3 rounded-3xl border-2 border-line bg-white p-3">
              <div className="h-32 w-24 shrink-0 overflow-hidden rounded-2xl bg-surface">
                {imagen ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imgUrl(imagen)} alt={i.nombre} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center p-1 text-center text-sm text-ink-soft">Sin foto</span>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="text-base leading-snug font-semibold">{i.nombre}</p>
                {i.modelo && <p className="text-sm text-ink-soft">Para {i.modelo}</p>}
                <p className="mt-1 text-base text-ink-soft">
                  {i.cantidad} × {formatCLP(i.precioUnitario)}
                </p>
                <p className="font-display text-lg font-bold">{formatCLP(i.subtotal)}</p>
                {enTienda && (
                  <Link href={enTienda} className="mt-auto inline-flex min-h-12 items-center text-base font-semibold text-brand">
                    Ver en la tienda
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <dl className="divide-y divide-line rounded-3xl bg-white p-4 text-base shadow-sm">
        {venta.descuento > 0 && (
          <>
            <div className="flex justify-between gap-3 py-2">
              <dt className="text-ink-soft">Subtotal</dt>
              <dd>{formatCLP(venta.subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-3 py-2">
              <dt className="text-ink-soft">Descuento</dt>
              <dd>− {formatCLP(venta.descuento)}</dd>
            </div>
          </>
        )}
        <div className="flex items-baseline justify-between gap-3 py-2">
          <dt className="font-bold">Total</dt>
          <dd className="font-display text-2xl font-bold">{formatCLP(venta.total)}</dd>
        </div>
        <div className="flex justify-between gap-3 py-2">
          <dt className="text-ink-soft">Medio de pago</dt>
          <dd>{MEDIOS_PAGO[venta.medioPago as keyof typeof MEDIOS_PAGO] ?? venta.medioPago}</dd>
        </div>
      </dl>
    </div>
  );
}
