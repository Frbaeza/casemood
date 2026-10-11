import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { IconChevronRight } from "@/components/icons";
import { getClienteSesion } from "@/lib/cuenta";
import { getDb } from "@/lib/db";
import { formatCLP } from "@/lib/format";
import { fechaCorta } from "@/lib/ventas";
import { salirDeLaCuenta } from "./acciones";

export const metadata: Metadata = { title: "Historial de compras", robots: { index: false } };

export default async function CuentaPage() {
  const [cliente, session] = await Promise.all([getClienteSesion(), auth()]);
  if (!session?.user?.email) redirect("/cuenta/entrar");
  // Primera vez: debe completar su perfil (fecha de nacimiento) antes de ver su cuenta.
  if (cliente && !cliente.fechaNacimiento) redirect("/cuenta/completar");

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
          items: {
            orderBy: { id: "asc" },
            select: {
              id: true,
              nombre: true,
              cantidad: true,
            },
          },
        },
      })
    : [];
  const total = compras.reduce((s, v) => s + v.total, 0);
  const nombre = cliente?.nombre ?? session.user.name ?? "";

  return (
    <div className="space-y-5 pt-5 pb-8">
      <header>
        <p className="text-lg text-ink-soft">Hola{nombre ? `, ${nombre.split(" ")[0]}` : ""} 👋</p>
        <h1 className="font-display text-4xl leading-tight font-bold">Historial de compras</h1>
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
        <ul className="divide-y divide-line overflow-hidden rounded-3xl border-2 border-line bg-white">
          {compras.map((v) => {
            const unidades = v.items.reduce((n, i) => n + i.cantidad, 0);
            return (
              <li key={v.id}>
                <Link href={`/cuenta/compras/${v.id}`} className="flex min-h-16 items-center gap-3 px-4 py-3 active:bg-surface">
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-semibold">{fechaCorta(v.fecha)}</span>
                    <span className="block truncate text-sm text-ink-soft">
                      {v.items.length === 1 ? v.items[0].nombre : `${unidades} productos`}
                    </span>
                  </span>
                  <span className="shrink-0 font-display text-lg font-bold">{formatCLP(v.total)}</span>
                  <IconChevronRight className="h-5 w-5 shrink-0 text-ink-soft" />
                </Link>
              </li>
            );
          })}
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
