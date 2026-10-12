import Link from "next/link";
import { GraficoColumnas } from "@/components/admin/grafico-columnas";
import { Barras, Bloque, formatCompacto, Indicador } from "@/components/admin/graficos";
import { IconWhatsApp } from "@/components/icons";
import { getAnalisis, leerPeriodo, PERIODOS, type Periodo } from "@/lib/analisis";
import { getTienda } from "@/lib/configuracion";
import { getVisitas } from "@/lib/visitas";
import { formatCLP, whatsappUrl } from "@/lib/format";
import { CLIENTE_GENERICO } from "@/lib/ventas";

export default async function AnalisisPage({ searchParams }: PageProps<"/admin/analisis">) {
  const { p } = await searchParams;
  const periodo = leerPeriodo(p);
  const [a, tienda, v] = await Promise.all([getAnalisis(periodo), getTienda(), getVisitas(periodo)]);
  const sinVentas = a.kpis.cantidad.actual === 0;
  const unidades = (n: number) => `${n} ${n === 1 ? "unidad" : "unidades"}`;
  const visitasTexto = (n: number) => `${n.toLocaleString("es-CL")} ${n === 1 ? "visita" : "visitas"}`;

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold">Análisis</h1>

      {/* Período: un solo filtro, arriba de todo */}
      <nav aria-label="Período" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
        {(Object.keys(PERIODOS) as Periodo[]).map((k) => (
          <Link
            key={k}
            href={k === "30d" ? "/admin/analisis" : `/admin/analisis?p=${k}`}
            aria-current={k === periodo ? "page" : undefined}
            className={`flex min-h-12 shrink-0 items-center rounded-xl border-2 px-3 text-base font-semibold whitespace-nowrap ${
              k === periodo ? "border-brand bg-brand text-white" : "border-line bg-white text-ink"
            }`}
          >
            {PERIODOS[k]}
          </Link>
        ))}
      </nav>

      <div className="grid grid-cols-2 gap-3">
        <Indicador etiqueta="Ventas" actual={a.kpis.ventas.actual} anterior={a.kpis.ventas.anterior} formato={formatCompacto} />
        <Indicador etiqueta="N° de ventas" actual={a.kpis.cantidad.actual} anterior={a.kpis.cantidad.anterior} />
        <Indicador etiqueta="Ticket promedio" actual={a.kpis.ticket.actual} anterior={a.kpis.ticket.anterior} formato={formatCLP} />
        <Indicador etiqueta="Unidades vendidas" actual={a.kpis.unidades.actual} anterior={a.kpis.unidades.anterior} />
      </div>

      {sinVentas && (
        <p className="rounded-2xl bg-surface p-4 text-base text-ink-soft">
          No hay ventas registradas en este período. Los gráficos se llenan a medida que registras ventas.
        </p>
      )}

      <Bloque
        titulo="Ventas en el tiempo"
        subtitulo={a.agrupar === "mes" ? "Total por mes" : a.agrupar === "semana" ? "Total por semana" : "Total por día"}
      >
        <GraficoColumnas puntos={a.serie} titulo={`Ventas por ${a.agrupar === "mes" ? "mes" : a.agrupar === "semana" ? "semana" : "día"}`} />
      </Bloque>

      {v && (
        <Bloque titulo="Visitas a la tienda" subtitulo="Personas que entraron al sitio, sin contar el panel. Cifras aproximadas: Cloudflare mide con una muestra.">
          {v.error ? (
            <p className="text-base text-ink-soft">No se pudieron cargar las visitas en este momento. Intenta más tarde.</p>
          ) : (
            <div className="space-y-5">
              {v.recortado && (
                <p className="rounded-2xl bg-surface p-3 text-sm text-ink-soft">Las visitas muestran los últimos 3 meses (es lo máximo que entrega Cloudflare).</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Indicador etiqueta="Visitas" actual={v.visitas.actual} anterior={v.visitas.anterior} />
                <Indicador etiqueta="Páginas vistas" actual={v.vistas.actual} anterior={v.vistas.anterior} />
              </div>
              <GraficoColumnas
                puntos={v.serie}
                modo="visitas"
                titulo={`Visitas por ${v.agrupar === "mes" ? "mes" : v.agrupar === "semana" ? "semana" : "día"}`}
              />
              <div>
                <p className="mb-2 text-base font-semibold">Lo más visto</p>
                <Barras filas={v.paginas} formato={(n) => `${n.toLocaleString("es-CL")} ${n === 1 ? "vista" : "vistas"}`} vacio="Aún no hay visitas en este período." />
              </div>
              <div>
                <p className="mb-2 text-base font-semibold">De dónde llegan</p>
                <Barras filas={v.origen} formato={visitasTexto} vacio="Aún no hay visitas en este período." />
              </div>
              <div>
                <p className="mb-2 text-base font-semibold">Desde qué equipo</p>
                <Barras filas={v.dispositivos} formato={visitasTexto} vacio="Aún no hay visitas en este período." />
              </div>
            </div>
          )}
        </Bloque>
      )}

      <Bloque titulo="Lo más vendido" subtitulo="Por monto vendido">
        <Barras filas={a.productos} />
      </Bloque>

      <Bloque titulo="Por categoría" subtitulo="Monto vendido">
        <Barras filas={a.categorias} />
      </Bloque>

      <Bloque titulo="iPhone más vendido por categoría" subtitulo="Unidades vendidas de cada modelo, por separado en cada categoría">
        {a.modelosPorCategoria.length === 0 ? (
          <p className="text-base text-ink-soft">Aún no hay ventas con modelo de iPhone en este período.</p>
        ) : (
          <div className="space-y-5">
            {a.modelosPorCategoria.map((c) => (
              <div key={c.categoria}>
                <div className="rounded-2xl bg-brand-soft p-3">
                  <p className="text-sm font-semibold text-ink-soft">{c.categoria}</p>
                  <p className="text-xl leading-tight font-bold">{c.top.modelo}</p>
                  <p className="text-sm text-ink-soft">
                    {unidades(c.top.unidades)} de {c.unidades} en {c.categoria.toLocaleLowerCase("es-CL")}
                  </p>
                </div>
                {c.filas.length > 1 && (
                  <div className="mt-3">
                    <Barras filas={c.filas} formato={unidades} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Bloque>

      <Bloque titulo="Por dónde compran">
        <Barras filas={a.canales} />
      </Bloque>

      <Bloque titulo="Cómo pagan">
        <Barras filas={a.medios} />
      </Bloque>

      <Bloque titulo="Clientes">
        <div className="grid grid-cols-3 gap-2">
          {[
            { t: "Con cuenta", v: a.clientes.total },
            { t: "Nuevos", v: a.clientes.nuevos, d: "en el período" },
            { t: "Recurrentes", v: a.clientes.recurrentes, d: `de ${a.clientes.compradores} ${a.clientes.compradores === 1 ? "comprador" : "compradores"}` },
          ].map((x) => (
            <div key={x.t} className="rounded-2xl bg-surface p-3">
              <p className="text-xs font-semibold text-ink-soft">{x.t}</p>
              <p className="text-2xl font-bold">{x.v}</p>
              {x.d && <p className="text-xs text-ink-soft">{x.d}</p>}
            </div>
          ))}
        </div>
        <p className="mt-4 mb-2 text-base font-semibold">Ventas del período</p>
        <Barras
          filas={[
            { etiqueta: "Clientes con cuenta", valor: a.clientes.conCuenta },
            { etiqueta: CLIENTE_GENERICO, valor: a.clientes.generico },
          ].filter((f) => f.valor > 0)}
        />
        {a.clientes.top.length > 0 && (
          <>
            <p className="mt-4 mb-1 text-base font-semibold">Mejores clientes del período</p>
            <ol className="divide-y divide-line">
              {a.clientes.top.map((c, i) => (
                <li key={c.id}>
                  <Link href={`/admin/clientes/${c.id}`} className="flex min-h-12 items-center gap-3 py-2">
                    <span className="w-5 text-center font-bold text-ink-soft">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-base">{c.nombre}</span>
                    <span className="shrink-0 text-right text-sm">
                      <strong className="block text-base tabular-nums">{formatCLP(c.total)}</strong>
                      {c.compras} {c.compras === 1 ? "compra" : "compras"}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </>
        )}
      </Bloque>

      <Bloque titulo="Edad de los clientes" subtitulo={`${a.edad.conFecha} ${a.edad.conFecha === 1 ? "cliente" : "clientes"} con fecha de nacimiento`}>
        <p className="mb-2 text-base font-semibold">Clientes por edad</p>
        <Barras
          filas={a.edad.clientes.filter((f) => f.valor > 0)}
          formato={(n) => `${n} ${n === 1 ? "cliente" : "clientes"}`}
          vacio="Aún no hay clientes con fecha de nacimiento."
        />
        <p className="mt-4 mb-2 text-base font-semibold">Ventas del período por edad</p>
        <Barras filas={a.edad.ventas.filter((f) => f.valor > 0)} vacio="Sin ventas a clientes con fecha de nacimiento." />
      </Bloque>

      <Bloque titulo="Cumpleaños de este mes" subtitulo="Salúdalos o envíales una promo">
        {a.cumpleanos.length === 0 ? (
          <p className="text-base text-ink-soft">Nadie está de cumpleaños este mes.</p>
        ) : (
          <ul className="divide-y divide-line">
            {a.cumpleanos.map((c) => (
              <li key={c.id} className={`flex items-center gap-3 py-2 ${c.yaPaso ? "opacity-60" : ""}`}>
                <span className="w-10 shrink-0 text-center">
                  <span className="block text-xl font-bold">{c.dia}</span>
                  {c.esHoy && <span className="block text-xs font-bold text-brand uppercase">Hoy</span>}
                </span>
                <Link href={`/admin/clientes/${c.id}`} className="min-w-0 flex-1">
                  <span className="block truncate text-base font-semibold">{c.nombre}</span>
                  <span className="block text-sm text-ink-soft">Cumple {c.cumple}</span>
                </Link>
                {c.telefono && (
                  <a
                    href={whatsappUrl(c.telefono, `¡Feliz cumpleaños, ${c.nombre.split(" ")[0]}! 🎉 Te saludamos desde ${tienda.nombre}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-12 shrink-0 items-center gap-1.5 rounded-xl bg-whatsapp px-3 text-sm font-bold text-white"
                  >
                    <IconWhatsApp className="h-5 w-5" />
                    Saludar
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </Bloque>
    </div>
  );
}
