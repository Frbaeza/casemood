import { getDb } from "@/lib/db";
import { aTexto, edad } from "@/lib/fecha-nacimiento";
import { CANALES, diaChile, inicioDiaChile, MEDIOS_PAGO } from "@/lib/ventas";

export const PERIODOS = {
  "7d": "7 días",
  "30d": "30 días",
  mes: "Este mes",
  "3m": "3 meses",
  "12m": "12 meses",
} as const;
export type Periodo = keyof typeof PERIODOS;

export function leerPeriodo(v: unknown): Periodo {
  return typeof v === "string" && v in PERIODOS ? (v as Periodo) : "30d";
}

type Rango = { gte: Date; lt: Date };
type Agrupacion = "dia" | "semana" | "mes";

const sumarMes = (dia: string, meses: number) => {
  const [a, m] = dia.split("-").map(Number);
  const total = a * 12 + (m - 1) + meses;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}-01`;
};

/** Rango del período, el período anterior de igual largo (para comparar) y cómo agrupar el gráfico. */
function rangos(p: Periodo): { actual: Rango; anterior: Rango; agrupar: Agrupacion } {
  const hoy = diaChile();
  const manana = inicioDiaChile(hoy, 1);
  if (p === "mes") {
    const inicio = inicioDiaChile(`${hoy.slice(0, 7)}-01`);
    const inicioAnterior = inicioDiaChile(sumarMes(hoy, -1));
    // Mes anterior hasta el mismo día, para comparar justo.
    const dias = Math.round((manana.getTime() - inicio.getTime()) / 86_400_000);
    const finAnterior = new Date(Math.min(inicio.getTime(), inicioAnterior.getTime() + dias * 86_400_000));
    return { actual: { gte: inicio, lt: manana }, anterior: { gte: inicioAnterior, lt: finAnterior }, agrupar: "dia" };
  }
  const dias = { "7d": 7, "30d": 30, "3m": 91, "12m": 365 }[p];
  const inicio = inicioDiaChile(hoy, -(dias - 1));
  return {
    actual: { gte: inicio, lt: manana },
    anterior: { gte: inicioDiaChile(hoy, -(2 * dias - 1)), lt: inicio },
    agrupar: p === "12m" ? "mes" : p === "3m" ? "semana" : "dia",
  };
}

const MES_CORTO = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** Columnas vacías del período (para que los días sin ventas también aparezcan). */
function columnas(r: Rango, agrupar: Agrupacion): { clave: string; etiqueta: string; titulo: string; desde: string }[] {
  const lista: { clave: string; etiqueta: string; titulo: string; desde: string }[] = [];
  const finDia = diaChile(new Date(r.lt.getTime() - 1));
  let dia = diaChile(r.gte);
  if (agrupar === "mes") dia = `${dia.slice(0, 7)}-01`;
  while (dia <= finDia) {
    const [a, m, d] = dia.split("-").map(Number);
    if (agrupar === "mes") {
      lista.push({ clave: dia.slice(0, 7), etiqueta: MES_CORTO[m - 1], titulo: `${MES_CORTO[m - 1]} ${a}`, desde: dia });
      dia = sumarMes(dia, 1);
    } else {
      lista.push({
        clave: dia,
        etiqueta: agrupar === "semana" ? `${d} ${MES_CORTO[m - 1]}` : String(d),
        titulo: agrupar === "semana" ? `Semana del ${d} ${MES_CORTO[m - 1]}` : `${d} ${MES_CORTO[m - 1]}`,
        desde: dia,
      });
      dia = diaChile(inicioDiaChile(dia, agrupar === "semana" ? 7 : 1));
    }
  }
  return lista;
}

const RANGOS_EDAD = [
  { etiqueta: "Menos de 18", hasta: 17 },
  { etiqueta: "18 a 24", hasta: 24 },
  { etiqueta: "25 a 34", hasta: 34 },
  { etiqueta: "35 a 44", hasta: 44 },
  { etiqueta: "45 o más", hasta: 200 },
];
const rangoEdad = (anios: number) => RANGOS_EDAD.find((r) => anios <= r.hasta)!.etiqueta;

export type Fila = { etiqueta: string; valor: number; detalle?: string };

/** Todo lo que muestra admin → Análisis para un período. */
export async function getAnalisis(p: Periodo) {
  const db = await getDb();
  const { actual, anterior, agrupar } = rangos(p);
  const enPeriodo = { anulada: false, fecha: actual };
  const enAnterior = { anulada: false, fecha: anterior };

  const [
    resumen,
    resumenAnterior,
    unidades,
    unidadesAnterior,
    ventasPeriodo,
    productos,
    categorias,
    modelos,
    porCanal,
    porMedio,
    porCliente,
    clientesNuevos,
    totalClientes,
    comprasPorCliente,
    conFecha,
  ] = await Promise.all([
    db.venta.aggregate({ where: enPeriodo, _sum: { total: true }, _count: true }),
    db.venta.aggregate({ where: enAnterior, _sum: { total: true }, _count: true }),
    db.ventaItem.aggregate({ where: { venta: enPeriodo }, _sum: { cantidad: true } }),
    db.ventaItem.aggregate({ where: { venta: enAnterior }, _sum: { cantidad: true } }),
    db.venta.findMany({
      where: enPeriodo,
      select: { fecha: true, total: true, cliente: { select: { fechaNacimiento: true } } },
    }),
    db.ventaItem.groupBy({
      by: ["nombre"],
      where: { venta: enPeriodo },
      _sum: { subtotal: true, cantidad: true },
      orderBy: { _sum: { subtotal: "desc" } },
      take: 8,
    }),
    db.ventaItem.groupBy({
      by: ["categoria"],
      where: { venta: enPeriodo },
      _sum: { subtotal: true, cantidad: true },
      orderBy: { _sum: { subtotal: "desc" } },
    }),
    // Unidades por categoría y modelo de iPhone (solo lo que se vende por modelo).
    db.ventaItem.groupBy({
      by: ["categoria", "modelo"],
      where: { venta: enPeriodo, modelo: { not: null } },
      _sum: { cantidad: true, subtotal: true },
    }),
    db.venta.groupBy({ by: ["canal"], where: enPeriodo, _sum: { total: true }, _count: true }),
    db.venta.groupBy({ by: ["medioPago"], where: enPeriodo, _sum: { total: true }, _count: true }),
    db.venta.groupBy({
      by: ["clienteId"],
      where: enPeriodo,
      _sum: { total: true },
      _count: true,
      orderBy: { _sum: { total: "desc" } },
    }),
    db.cliente.count({ where: { creadoEn: actual } }),
    db.cliente.count(),
    // Compras por cliente (histórico) para saber cuántos vuelven a comprar.
    db.venta.groupBy({ by: ["clienteId"], where: { anulada: false, clienteId: { not: null } }, _count: true }),
    db.cliente.findMany({
      where: { fechaNacimiento: { not: null } },
      select: { id: true, nombre: true, telefono: true, fechaNacimiento: true },
    }),
  ]);

  // ---------- Serie de tiempo ----------
  const cols = columnas(actual, agrupar);
  const serie = cols.map((c) => ({ ...c, total: 0, ventas: 0 }));
  for (const v of ventasPeriodo) {
    const dia = diaChile(v.fecha);
    // La columna es la última cuyo inicio es <= al día de la venta.
    let i = serie.length - 1;
    while (i > 0 && serie[i].desde > dia) i--;
    serie[i].total += v.total;
    serie[i].ventas += 1;
  }

  // ---------- Modelo de iPhone más vendido en cada categoría ----------
  const porCategoria = new Map<string, { modelo: string; unidades: number; monto: number }[]>();
  for (const x of modelos) {
    const lista = porCategoria.get(x.categoria) ?? [];
    lista.push({ modelo: x.modelo!, unidades: x._sum.cantidad ?? 0, monto: x._sum.subtotal ?? 0 });
    porCategoria.set(x.categoria, lista);
  }
  const modelosPorCategoria = [...porCategoria.entries()]
    .map(([categoria, lista]) => {
      const orden = lista.sort((p, q) => q.unidades - p.unidades || q.monto - p.monto);
      return {
        categoria,
        unidades: orden.reduce((n, x) => n + x.unidades, 0),
        top: orden[0],
        filas: orden.slice(0, 5).map((x) => ({ etiqueta: x.modelo, valor: x.unidades, detalle: undefined })),
      };
    })
    .sort((p, q) => q.unidades - p.unidades);

  // ---------- Clientes ----------
  const topIds = porCliente.filter((c) => c.clienteId !== null).slice(0, 5);
  const nombres = new Map(
    (await db.cliente.findMany({ where: { id: { in: topIds.map((c) => c.clienteId!) } }, select: { id: true, nombre: true } })).map(
      (c) => [c.id, c.nombre],
    ),
  );
  const generico = porCliente.find((c) => c.clienteId === null);
  const totalVentas = resumen._sum.total ?? 0;
  const conCuenta = totalVentas - (generico?._sum.total ?? 0);
  const recurrentes = comprasPorCliente.filter((c) => c._count >= 2).length;
  const compradores = comprasPorCliente.length;

  // ---------- Edad ----------
  const clientesPorEdad = new Map(RANGOS_EDAD.map((r) => [r.etiqueta, 0]));
  for (const c of conFecha) {
    const r = rangoEdad(edad(aTexto(c.fechaNacimiento!)));
    clientesPorEdad.set(r, clientesPorEdad.get(r)! + 1);
  }
  const ventasPorEdad = new Map(RANGOS_EDAD.map((r) => [r.etiqueta, 0]));
  for (const v of ventasPeriodo) {
    if (!v.cliente?.fechaNacimiento) continue;
    const r = rangoEdad(edad(aTexto(v.cliente.fechaNacimiento)));
    ventasPorEdad.set(r, ventasPorEdad.get(r)! + v.total);
  }

  // ---------- Cumpleaños de este mes ----------
  const hoy = diaChile();
  const mesActual = hoy.slice(5, 7);
  const cumpleanos = conFecha
    .map((c) => ({ ...c, fecha: aTexto(c.fechaNacimiento!) }))
    .filter((c) => c.fecha.slice(5, 7) === mesActual)
    .map((c) => ({
      id: c.id,
      nombre: c.nombre,
      telefono: c.telefono,
      dia: Number(c.fecha.slice(8, 10)),
      cumple: edad(c.fecha) + (c.fecha.slice(5) > hoy.slice(5) ? 1 : 0),
      yaPaso: c.fecha.slice(5) < hoy.slice(5),
      esHoy: c.fecha.slice(5) === hoy.slice(5),
    }))
    .sort((a, b) => a.dia - b.dia);

  const filas = <T>(lista: T[], f: (x: T) => Fila) => lista.map(f).filter((x) => x.valor > 0);

  return {
    kpis: {
      ventas: { actual: totalVentas, anterior: resumenAnterior._sum.total ?? 0 },
      cantidad: { actual: resumen._count, anterior: resumenAnterior._count },
      ticket: {
        actual: resumen._count ? Math.round(totalVentas / resumen._count) : 0,
        anterior: resumenAnterior._count ? Math.round((resumenAnterior._sum.total ?? 0) / resumenAnterior._count) : 0,
      },
      unidades: { actual: unidades._sum.cantidad ?? 0, anterior: unidadesAnterior._sum.cantidad ?? 0 },
    },
    serie,
    agrupar,
    productos: filas(productos, (x) => ({
      etiqueta: x.nombre,
      valor: x._sum.subtotal ?? 0,
      detalle: `${x._sum.cantidad} ${x._sum.cantidad === 1 ? "unidad" : "unidades"}`,
    })),
    categorias: filas(categorias, (x) => ({
      etiqueta: x.categoria,
      valor: x._sum.subtotal ?? 0,
      detalle: `${x._sum.cantidad} ${x._sum.cantidad === 1 ? "unidad" : "unidades"}`,
    })),
    modelosPorCategoria,
    canales: filas(porCanal, (x) => ({
      etiqueta: CANALES[x.canal as keyof typeof CANALES] ?? x.canal,
      valor: x._sum.total ?? 0,
      detalle: `${x._count} ${x._count === 1 ? "venta" : "ventas"}`,
    })).sort((a, b) => b.valor - a.valor),
    medios: filas(porMedio, (x) => ({
      etiqueta: MEDIOS_PAGO[x.medioPago as keyof typeof MEDIOS_PAGO] ?? x.medioPago,
      valor: x._sum.total ?? 0,
      detalle: `${x._count} ${x._count === 1 ? "venta" : "ventas"}`,
    })).sort((a, b) => b.valor - a.valor),
    clientes: {
      total: totalClientes,
      nuevos: clientesNuevos,
      compradores,
      recurrentes,
      conCuenta,
      generico: generico?._sum.total ?? 0,
      top: topIds.map((c) => ({
        id: c.clienteId!,
        nombre: nombres.get(c.clienteId!) ?? "Cliente",
        total: c._sum.total ?? 0,
        compras: c._count,
      })),
    },
    edad: {
      conFecha: conFecha.length,
      clientes: RANGOS_EDAD.map((r) => ({ etiqueta: r.etiqueta, valor: clientesPorEdad.get(r.etiqueta)! })),
      ventas: RANGOS_EDAD.map((r) => ({ etiqueta: r.etiqueta, valor: ventasPorEdad.get(r.etiqueta)! })),
    },
    cumpleanos,
  };
}
