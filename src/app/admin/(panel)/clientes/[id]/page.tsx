import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { getDb } from "@/lib/db";
import { formatCLP } from "@/lib/format";
import { aTexto, edad, fechaLarga } from "@/lib/fecha-nacimiento";
import { fechaCorta } from "@/lib/ventas";
import { ClienteForm } from "../cliente-form";

export default async function ClientePage({ params }: PageProps<"/admin/clientes/[id]">) {
  const { id: idTexto } = await params;
  if (!/^\d+$/.test(idTexto)) notFound();
  const db = await getDb();
  const cliente = await db.cliente.findUnique({
    where: { id: Number(idTexto) },
    include: {
      ventas: {
        orderBy: [{ fecha: "desc" }, { id: "desc" }],
        select: { id: true, fecha: true, total: true, anulada: true, items: { select: { nombre: true, cantidad: true } } },
      },
    },
  });
  if (!cliente) notFound();

  const validas = cliente.ventas.filter((v) => !v.anulada);
  const gastado = validas.reduce((s, v) => s + v.total, 0);
  const nacimiento = cliente.fechaNacimiento
    ? `${fechaLarga(cliente.fechaNacimiento)} (${edad(aTexto(cliente.fechaNacimiento))} años)${cliente.autorizaTutor ? " · con autorización de tutor" : ""}`
    : null;
  const resumen = [
    { titulo: "Total comprado", valor: formatCLP(gastado) },
    { titulo: "Compras", valor: String(validas.length) },
    { titulo: "Última", valor: validas[0] ? fechaCorta(validas[0].fecha) : "—" },
  ];

  return (
    <div className="space-y-4">
      <BackLink href="/admin/clientes">Volver a clientes</BackLink>
      <h1 className="font-display text-3xl font-bold">{cliente.nombre}</h1>

      <section aria-label="Resumen" className="grid grid-cols-3 gap-2">
        {resumen.map((r) => (
          <div key={r.titulo} className="rounded-2xl bg-white p-3 shadow-sm">
            <p className="text-xs font-semibold text-ink-soft">{r.titulo}</p>
            <p className="font-display text-lg leading-tight font-bold">{r.valor}</p>
          </div>
        ))}
      </section>

      <ClienteForm
        key={`${cliente.nombre}|${cliente.telefono}|${cliente.nota}`}
        id={cliente.id}
        email={cliente.email}
        nacimiento={nacimiento}
        ventas={cliente.ventas.length}
        inicial={{ nombre: cliente.nombre, telefono: cliente.telefono ?? "", nota: cliente.nota }}
      />

      <section aria-labelledby="t-compras">
        <h2 id="t-compras" className="font-display text-2xl font-bold">
          Compras
        </h2>
        {cliente.ventas.length === 0 ? (
          <p className="mt-2 rounded-2xl border-2 border-dashed border-line bg-white p-6 text-center text-base text-ink-soft">
            Todavía no tiene compras registradas.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-line overflow-hidden rounded-3xl bg-white shadow-sm">
            {cliente.ventas.map((v) => (
              <li key={v.id}>
                <Link
                  href={`/admin/ventas/${v.id}`}
                  className={`flex min-h-16 items-center gap-3 px-4 py-3 active:bg-surface ${v.anulada ? "opacity-60" : ""}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold">{fechaCorta(v.fecha)}</p>
                    <p className="truncate text-sm text-ink-soft">
                      {v.items.map((i) => (i.cantidad > 1 ? `${i.cantidad}× ${i.nombre}` : i.nombre)).join(", ")}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`font-display text-lg font-bold ${v.anulada ? "line-through" : ""}`}>{formatCLP(v.total)}</p>
                    {v.anulada && <p className="text-xs font-bold text-danger uppercase">Anulada</p>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
