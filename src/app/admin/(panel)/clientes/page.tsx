import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { IconSearch } from "@/components/icons";
import { leerPagina, Paginacion } from "@/components/paginacion";
import { getDb } from "@/lib/db";
import { formatCLP } from "@/lib/format";

const POR_PAGINA = 30;

export default async function ClientesAdminPage({ searchParams }: PageProps<"/admin/clientes">) {
  const { q, pagina: paginaTexto } = await searchParams;
  const pagina = leerPagina(paginaTexto);
  const texto = typeof q === "string" ? q.trim().slice(0, 60) : "";
  const digitos = texto.replace(/\D/g, "");

  const where: Prisma.ClienteWhereInput = texto
    ? {
        OR: [
          { nombre: { contains: texto, mode: "insensitive" } },
          { email: { contains: texto.toLowerCase() } },
          ...(digitos.length >= 4 ? [{ telefono: { contains: digitos } }] : []),
        ],
      }
    : {};

  const db = await getDb();
  const [clientes, encontrados, total] = await Promise.all([
    db.cliente.findMany({
      where,
      orderBy: { nombre: "asc" },
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
      select: { id: true, nombre: true, email: true, telefono: true },
    }),
    db.cliente.count({ where }),
    db.cliente.count(),
  ]);
  const compras = await db.venta.groupBy({
    by: ["clienteId"],
    where: { anulada: false, clienteId: { in: clientes.map((c) => c.id) } },
    _sum: { total: true },
    _count: true,
  });
  const porCliente = new Map(compras.map((c) => [c.clienteId, c]));
  const paginas = Math.max(1, Math.ceil(encontrados / POR_PAGINA));
  const href = (p: number) => {
    const sp = new URLSearchParams();
    if (texto) sp.set("q", texto);
    if (p > 1) sp.set("pagina", String(p));
    return sp.size ? `/admin/clientes?${sp}` : "/admin/clientes";
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Clientes</h1>
      <p className="text-base text-ink-soft">
        {texto ? `${encontrados} de ${total}` : total} {total === 1 ? "cliente" : "clientes"}
      </p>

      <form role="search" className="mt-4 flex gap-2">
        <label htmlFor="q" className="sr-only">
          Buscar cliente
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={texto}
          placeholder="Nombre, correo o teléfono"
          className="min-h-12 min-w-0 flex-1 rounded-xl border-2 border-line bg-white px-4 text-base focus:border-brand focus:outline-none"
        />
        <button type="submit" className="flex min-h-12 items-center gap-1.5 rounded-xl bg-brand px-4 font-semibold text-white">
          <IconSearch className="h-5 w-5" />
          Buscar
        </button>
      </form>

      {clientes.length === 0 ? (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-line bg-white p-8 text-center">
          <p className="text-lg font-semibold">{texto ? "No hay clientes con esa búsqueda." : "Aún no hay clientes."}</p>
          {!texto && <p className="mt-1 text-base text-ink-soft">Se crean al registrar una venta o con “+ Nuevo cliente”.</p>}
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-line overflow-hidden rounded-3xl bg-white shadow-sm">
          {clientes.map((c) => {
            const r = porCliente.get(c.id);
            return (
              <li key={c.id}>
                <Link href={`/admin/clientes/${c.id}`} className="flex min-h-16 items-center gap-3 px-4 py-3 active:bg-surface">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold">{c.nombre}</p>
                    <p className="truncate text-sm text-ink-soft">{c.email ?? c.telefono ?? "Sin correo ni teléfono"}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-display text-lg font-bold">{formatCLP(r?._sum.total ?? 0)}</p>
                    <p className="text-sm text-ink-soft">
                      {r?._count ?? 0} {r?._count === 1 ? "compra" : "compras"}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Paginacion pagina={pagina} paginas={paginas} href={href} />

      <Link
        href="/admin/clientes/nuevo"
        className="fixed right-[max(1rem,calc(50vw-224px))] bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 flex min-h-14 items-center gap-2 rounded-full bg-brand px-6 text-lg font-bold text-white shadow-xl active:bg-brand-dark"
      >
        <span aria-hidden className="text-2xl leading-none">+</span>
        Nuevo cliente
      </Link>
    </div>
  );
}
