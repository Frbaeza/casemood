import { columnas, rangos, type Periodo, type Rango } from "@/lib/analisis";
import { getDb } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { diaChile } from "@/lib/ventas";

/**
 * Visitas de la tienda desde Cloudflare Web Analytics (sin cookies). Se excluye el panel /admin
 * y el tráfico de robots. Necesita CF_ANALYTICS_TOKEN (Account Analytics: Read), ANALYTICS_ACCOUNT_ID
 * y CF_WEB_ANALYTICS_SITE; si faltan, la sección no se muestra.
 */

type Grupo = { count: number; sum: { visits: number }; dimensions?: Record<string, string> };

const CONSULTA = `
query Visitas($cuenta: string!, $actual: AccountRumPageloadEventsAdaptiveGroupsFilter_InputObject!, $anterior: AccountRumPageloadEventsAdaptiveGroupsFilter_InputObject!) {
  viewer {
    accounts(filter: { accountTag: $cuenta }) {
      total: rumPageloadEventsAdaptiveGroups(filter: $actual, limit: 1) { count sum { visits } }
      totalAnterior: rumPageloadEventsAdaptiveGroups(filter: $anterior, limit: 1) { count sum { visits } }
      porHora: rumPageloadEventsAdaptiveGroups(filter: $actual, limit: 10000) { count sum { visits } dimensions { datetimeHour } }
      paginas: rumPageloadEventsAdaptiveGroups(filter: $actual, limit: 12, orderBy: [count_DESC]) { count sum { visits } dimensions { requestPath } }
      origen: rumPageloadEventsAdaptiveGroups(filter: $actual, limit: 30, orderBy: [sum_visits_DESC]) { count sum { visits } dimensions { refererHost } }
      dispositivo: rumPageloadEventsAdaptiveGroups(filter: $actual, limit: 5, orderBy: [sum_visits_DESC]) { count sum { visits } dimensions { deviceType } }
    }
  }
}`;

const filtro = (sitio: string, r: Rango) => ({
  AND: [
    { siteTag: sitio },
    { datetime_geq: r.gte.toISOString(), datetime_lt: r.lt.toISOString() },
    { requestPath_notlike: "/admin%" },
    { bot: 0 },
  ],
});

/** Nombre legible del sitio desde el que llegaron. */
function origenLegible(host: string, propio: string): string | null {
  const h = host.toLowerCase().replace(/^www\./, "");
  if (!h) return "Directo (link guardado, WhatsApp u otra app)";
  // Navegación dentro de la tienda o vuelta desde "Entrar con Google".
  if (h === propio || h.endsWith(`.${propio}`) || h === "accounts.google.com") return null;
  if (h.includes("instagram")) return "Instagram";
  if (h.includes("facebook") || h === "fb.com" || h === "m.facebook.com") return "Facebook";
  if (h.includes("whatsapp") || h === "wa.me") return "WhatsApp";
  if (h.includes("tiktok")) return "TikTok";
  if (/(^|\.)google\./.test(h) || h.includes("googleapis")) return "Google";
  if (h.includes("bing.")) return "Bing";
  return h;
}

const DISPOSITIVO: Record<string, string> = { mobile: "Celular", desktop: "Computador", tablet: "Tablet" };

const tituloSlug = (slug: string) =>
  slug
    .split("-")
    .map((p) => (p === "iphone" ? "iPhone" : /^(pro|max|plus|mini|air|se|e)$/.test(p) ? p[0].toUpperCase() + p.slice(1) : p))
    .join(" ");

export async function getVisitas(p: Periodo) {
  const env = await getEnv();
  const token = env.CF_ANALYTICS_TOKEN;
  const cuenta = env.ANALYTICS_ACCOUNT_ID;
  const sitio = env.CF_WEB_ANALYTICS_SITE;
  if (!token || !cuenta || !sitio) return null;

  // Cloudflare permite consultar a lo más ~13 semanas: los períodos más largos muestran los últimos 92 días.
  const MAX = 92 * 86_400_000;
  const r = rangos(p);
  const recortado = r.actual.lt.getTime() - r.actual.gte.getTime() > MAX;
  const actual = recortado ? { gte: new Date(r.actual.lt.getTime() - MAX), lt: r.actual.lt } : r.actual;
  const anterior = recortado ? { gte: new Date(actual.gte.getTime() - MAX), lt: actual.gte } : r.anterior;
  const agrupar = recortado ? "semana" : r.agrupar;
  let datos: Record<string, Grupo[]>;
  try {
    const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: CONSULTA, variables: { cuenta, actual: filtro(sitio, actual), anterior: filtro(sitio, anterior) } }),
    });
    const json = (await res.json()) as { data?: { viewer: { accounts: Record<string, Grupo[]>[] } }; errors?: { message: string }[] | null };
    if (json.errors?.length || !json.data) {
      console.error("Web Analytics:", json.errors?.map((e) => e.message).join("; "));
      return { error: true as const };
    }
    datos = json.data.viewer.accounts[0] ?? {};
  } catch (e) {
    console.error("Web Analytics:", e);
    return { error: true as const };
  }

  const total = datos.total?.[0];
  const totalAnterior = datos.totalAnterior?.[0];

  // Serie: horas UTC → día de Chile → columna del gráfico.
  const serie = columnas(actual, agrupar).map((c) => ({ ...c, total: 0, ventas: 0 }));
  for (const g of datos.porHora ?? []) {
    const dia = diaChile(new Date(g.dimensions!.datetimeHour));
    let i = serie.length - 1;
    while (i > 0 && serie[i].desde > dia) i--;
    serie[i].total += g.sum.visits;
    serie[i].ventas += g.count;
  }

  // Páginas más vistas con nombres reales de productos y categorías.
  const rutas = (datos.paginas ?? []).map((g) => ({ ruta: g.dimensions!.requestPath, vistas: g.count }));
  const slugs = (prefijo: string) => rutas.map((r) => r.ruta.split("/")).filter((s) => s[1] === prefijo && s[2]).map((s) => s[2]);
  const db = await getDb();
  const [productos, categorias] = await Promise.all([
    db.producto.findMany({ where: { slug: { in: slugs("producto") } }, select: { slug: true, nombre: true } }),
    db.categoria.findMany({ where: { slug: { in: slugs("categoria") } }, select: { slug: true, nombre: true } }),
  ]);
  const nombreProducto = new Map(productos.map((x) => [x.slug, x.nombre]));
  const nombreCategoria = new Map(categorias.map((x) => [x.slug, x.nombre]));
  const nombrePagina = (ruta: string) => {
    const [, tipo, a, b] = ruta.split("/");
    if (!tipo) return "Inicio";
    if (tipo === "producto") return nombreProducto.get(a) ?? a;
    if (tipo === "categoria") return `Categoría: ${nombreCategoria.get(a) ?? a}`;
    if (tipo === "modelo") return `Modelo: ${tituloSlug(b ?? a ?? "")}`;
    if (tipo === "personaliza") return "Diseña tu carcasa";
    if (tipo === "pedido") return "Carrito";
    if (tipo === "buscar") return "Búsqueda";
    if (tipo === "cuenta") return "Mi cuenta";
    return ruta;
  };
  const paginas = new Map<string, number>();
  for (const r of rutas) paginas.set(nombrePagina(r.ruta), (paginas.get(nombrePagina(r.ruta)) ?? 0) + r.vistas);

  const propio = "casemood.cl";
  const origen = new Map<string, number>();
  for (const g of datos.origen ?? []) {
    const nombre = origenLegible(g.dimensions!.refererHost ?? "", propio);
    if (nombre && g.sum.visits > 0) origen.set(nombre, (origen.get(nombre) ?? 0) + g.sum.visits);
  }

  const aFilas = (m: Map<string, number>, max = 8) =>
    [...m.entries()]
      .sort((x, y) => y[1] - x[1])
      .slice(0, max)
      .map(([etiqueta, valor]) => ({ etiqueta, valor }));

  return {
    error: false as const,
    recortado,
    visitas: { actual: total?.sum.visits ?? 0, anterior: totalAnterior?.sum.visits ?? 0 },
    vistas: { actual: total?.count ?? 0, anterior: totalAnterior?.count ?? 0 },
    serie,
    agrupar,
    paginas: aFilas(paginas),
    origen: aFilas(origen),
    dispositivos: (datos.dispositivo ?? [])
      .filter((g) => g.sum.visits > 0)
      .map((g) => ({ etiqueta: DISPOSITIVO[g.dimensions!.deviceType] ?? g.dimensions!.deviceType, valor: g.sum.visits })),
  };
}
