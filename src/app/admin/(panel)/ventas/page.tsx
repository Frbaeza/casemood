import Link from "next/link";
import { leerPagina, Paginacion } from "@/components/paginacion";
import { getDb } from "@/lib/db";
import { formatCLP } from "@/lib/format";
import { CLIENTE_GENERICO, diaChile, fechaCorta, inicioDiaChile, MEDIOS_PAGO } from "@/lib/ventas";

const POR_PAGINA = 30;

export default async function VentasAdminPage({ searchParams }: PageProps<"/admin/ventas">) {
  const { pagina: paginaTexto } = await searchParams;
  const pagina = leerPagina(paginaTexto);

  const hoy = diaChile();
  const [anio, mes] = hoy.split("-").map(Number);
  const rangos = {
    hoy: { gte: inicioDiaChile(hoy), lt: inicioDiaChile(hoy, 1) },
    semana: { gte: inicioDiaChile(hoy, -6), lt: inicioDiaChile(hoy, 1) },
    mes: {
      gte: inicioDiaChile(`${anio}-${String(mes).padStart(2, "0")}-01`),
      lt: inicioDiaChile(mes === 12 ? `${anio + 1}-01-01` : `${anio}-${String(mes + 1).padStart(2, "0")}-01`),
    },
  };

  const db = await getDb();
  const resumen = (fecha: { gte: Date; lt: Date }) =>
    db.venta.aggregate({ where: { anulada: false, fecha }, _sum: { total: true }, _count: true });
  const [rHoy, rSemana, rMes, top, ventas, total] = await Promise.all([
    resumen(rangos.hoy),
    resumen(rangos.semana),
    resumen(rangos.mes),
    db.ventaItem.groupBy({
      by: ["nombre"],
      where: { venta: { anulada: false, fecha: rangos.mes } },
      _sum: { cantidad: true, subtotal: true },
      orderBy: { _sum: { subtotal: "desc" } },
      take: 5,
    }),
    db.venta.findMany({
      orderBy: [{ fecha: "desc" }, { id: "desc" }],
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
      select: {
        id: true,
        fecha: true,
        total: true,
        anulada: true,
        medioPago: true,
        cliente: { select: { nombre: true } },
        _count: { select: { items: true } },
      },
    }),
    db.venta.count(),
  ]);
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const ticket = rMes._count ? Math.round((rMes._sum.total ?? 0) / rMes._count) : 0;

  const tarjetas = [
    { titulo: "Hoy", r: rHoy },
    { titulo: "Últimos 7 días", r: rSemana },
    { titulo: "Este mes", r: rMes },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Ventas</h1>

      <section aria-label="Resumen" className="mt-4 grid grid-cols-2 gap-3">
        {tarjetas.map(({ titulo, r }) => (
          <div key={titulo} className="rounded-3xl bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-ink-soft">{titulo}</p>
            <p className="font-display text-2xl font-bold">{formatCLP(r._sum.total ?? 0)}</p>
            <p className="text-sm text-ink-soft">
              {r._count} {r._count === 1 ? "venta" : "ventas"}
            </p>
          </div>
        ))}
        <div className="rounded-3xl bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-ink-soft">Ticket promedio del mes</p>
          <p className="font-display text-2xl font-bold">{formatCLP(ticket)}</p>
          <p className="text-sm text-ink-soft">por venta</p>
        </div>
      </section>

      {top.length > 0 && (
        <section aria-labelledby="t-top" className="mt-3 rounded-3xl bg-white p-4 shadow-sm">
          <h2 id="t-top" className="font-display text-xl font-bold">
            Lo más vendido este mes
          </h2>
          <ol className="mt-2 divide-y divide-line">
            {top.map((t, i) => (
              <li key={t.nombre} className="flex items-center gap-3 py-2">
                <span className="w-5 shrink-0 text-center font-bold text-ink-soft">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-base">{t.nombre}</span>
                <span className="shrink-0 text-right text-sm">
                  <strong className="block text-base">{formatCLP(t._sum.subtotal ?? 0)}</strong>
                  {t._sum.cantidad} {t._sum.cantidad === 1 ? "unidad" : "unidades"}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <h2 className="mt-6 font-display text-2xl font-bold">Historial</h2>
      {ventas.length === 0 ? (
        <div className="mt-3 rounded-2xl border-2 border-dashed border-line bg-white p-8 text-center">
          <p className="text-lg font-semibold">Aún no hay ventas registradas.</p>
          <p className="mt-1 text-base text-ink-soft">Toca “+ Nueva venta” para registrar la primera.</p>
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-line overflow-hidden rounded-3xl bg-white shadow-sm">
          {ventas.map((v) => (
            <li key={v.id}>
              <Link href={`/admin/ventas/${v.id}`} className={`flex min-h-16 items-center gap-3 px-4 py-3 active:bg-surface ${v.anulada ? "opacity-60" : ""}`}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold">{v.cliente?.nombre ?? CLIENTE_GENERICO}</p>
                  <p className="text-sm text-ink-soft">
                    {fechaCorta(v.fecha)} · {v._count.items} {v._count.items === 1 ? "producto" : "productos"} ·{" "}
                    {MEDIOS_PAGO[v.medioPago as keyof typeof MEDIOS_PAGO] ?? v.medioPago}
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

      <Paginacion pagina={pagina} paginas={paginas} href={(p) => (p > 1 ? `/admin/ventas?pagina=${p}` : "/admin/ventas")} />

      <Link
        href="/admin/ventas/nueva"
        className="fixed right-[max(1rem,calc(50vw-224px))] bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 flex min-h-14 items-center gap-2 rounded-full bg-brand px-6 text-lg font-bold text-white shadow-xl active:bg-brand-dark"
      >
        <span aria-hidden className="text-2xl leading-none">+</span>
        Nueva venta
      </Link>
    </div>
  );
}
