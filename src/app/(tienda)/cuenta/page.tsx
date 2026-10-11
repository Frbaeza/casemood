import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getClienteSesion } from "@/lib/cuenta";
import { getDb } from "@/lib/db";
import { formatCLP } from "@/lib/format";
import { fechaCorta } from "@/lib/ventas";
import { salirDeLaCuenta } from "./acciones";

export const metadata: Metadata = { title: "Mi cuenta", robots: { index: false } };

export default async function CuentaPage() {
  const [cliente, session] = await Promise.all([getClienteSesion(), auth()]);
  if (!session?.user?.email) redirect("/cuenta/entrar");

  const db = await getDb();
  const compras = cliente
    ? await db.venta.findMany({
        where: { clienteId: cliente.id, anulada: false },
        orderBy: [{ fecha: "desc" }, { id: "desc" }],
        select: {
          id: true,
          fecha: true,
          total: true,
          descuento: true,
          items: { orderBy: { id: "asc" }, select: { id: true, nombre: true, modelo: true, cantidad: true, subtotal: true } },
        },
      })
    : [];
  const total = compras.reduce((s, v) => s + v.total, 0);
  const nombre = cliente?.nombre ?? session.user.name ?? "";

  return (
    <div className="space-y-5 pt-5 pb-8">
      <header>
        <p className="text-lg text-ink-soft">Hola{nombre ? `, ${nombre.split(" ")[0]}` : ""} 👋</p>
        <h1 className="font-display text-4xl leading-tight font-bold">Mis compras</h1>
        <p className="mt-1 text-base break-all text-ink-soft">{session.user.email}</p>
      </header>

      {compras.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-3xl bg-brand-soft p-4">
            <p className="text-sm font-semibold text-ink-soft">Compras</p>
            <p className="font-display text-3xl font-bold">{compras.length}</p>
          </div>
          <div className="rounded-3xl bg-brand-soft p-4">
            <p className="text-sm font-semibold text-ink-soft">Total</p>
            <p className="font-display text-3xl font-bold">{formatCLP(total)}</p>
          </div>
        </div>
      )}

      {compras.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-line p-6 text-center">
          <p className="text-lg font-semibold">Aún no tienes compras registradas.</p>
          <p className="mt-1 text-base text-ink-soft">
            Cuando nos compres, la tienda las registrará aquí con este mismo correo.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {compras.map((v) => (
            <li key={v.id} className="rounded-3xl border-2 border-line bg-white p-4">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-base font-semibold">{fechaCorta(v.fecha)}</p>
                <p className="font-display text-xl font-bold">{formatCLP(v.total)}</p>
              </div>
              <ul className="mt-2 space-y-1 text-base">
                {v.items.map((i) => (
                  <li key={i.id} className="flex justify-between gap-3">
                    <span className="min-w-0">
                      {i.cantidad > 1 && `${i.cantidad}× `}
                      {i.nombre}
                      {i.modelo && <span className="text-ink-soft"> · {i.modelo}</span>}
                    </span>
                    <span className="shrink-0 text-ink-soft">{formatCLP(i.subtotal)}</span>
                  </li>
                ))}
              </ul>
              {v.descuento > 0 && <p className="mt-1 text-sm text-ink-soft">Incluye {formatCLP(v.descuento)} de descuento.</p>}
            </li>
          ))}
        </ul>
      )}

      <form action={salirDeLaCuenta}>
        <button type="submit" className="min-h-12 w-full rounded-xl border-2 border-line px-4 text-base font-semibold">
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}
