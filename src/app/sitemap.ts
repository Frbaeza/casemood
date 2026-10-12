import type { MetadataRoute } from "next";
import { getDb } from "@/lib/db";
import { getTienda } from "@/lib/configuracion";
import { imgUrl } from "@/lib/format";
import { absoluta } from "@/lib/sitio";

// Se arma con el catálogo vigente en cada visita de Google.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = await getDb();
  const [tienda, productos, categorias, modelos] = await Promise.all([
    getTienda(),
    db.producto.findMany({
      where: { activo: true },
      orderBy: { id: "asc" },
      select: { slug: true, actualizadoEn: true, imagenes: { orderBy: { orden: "asc" }, take: 3, select: { key: true } } },
    }),
    db.categoria.findMany({ where: { productos: { some: { activo: true } } }, select: { slug: true } }),
    db.modelo.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
      select: { slug: true, variantes: { where: { activo: true }, select: { slug: true } } },
    }),
  ]);

  return [
    { url: absoluta("/"), changeFrequency: "daily", priority: 1 },
    ...categorias.map((c) => ({ url: absoluta(`/categoria/${c.slug}`), changeFrequency: "daily" as const, priority: 0.8 })),
    ...modelos.flatMap((m) => [
      { url: absoluta(`/modelo/${m.slug}`), changeFrequency: "weekly" as const, priority: 0.6 },
      ...m.variantes.map((v) => ({
        url: absoluta(`/modelo/${m.slug}/${v.slug}`),
        changeFrequency: "daily" as const,
        priority: 0.7,
      })),
    ]),
    ...productos.map((p) => ({
      url: absoluta(`/producto/${p.slug}`),
      lastModified: p.actualizadoEn,
      changeFrequency: "weekly" as const,
      priority: 0.9,
      images: p.imagenes.map((i) => absoluta(imgUrl(i.key))),
    })),
    ...(tienda.mostrarDisenador ? [{ url: absoluta("/personaliza"), changeFrequency: "monthly" as const, priority: 0.5 }] : []),
    { url: absoluta("/privacidad"), changeFrequency: "yearly", priority: 0.1 },
  ];
}
