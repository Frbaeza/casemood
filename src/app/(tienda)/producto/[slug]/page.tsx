import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { ImageCarousel } from "@/components/image-carousel";
import { ProductInquiry, type GrupoCompatibilidad } from "@/components/product-inquiry";
import { getProducto } from "@/lib/catalog";
import { getEnv, getStoreName } from "@/lib/env";
import { formatCLP, imgUrl } from "@/lib/format";

function resumen(texto: string, max = 160) {
  const limpio = texto.replace(/\s+/g, " ").trim();
  return limpio.length > max ? `${limpio.slice(0, max - 1)}…` : limpio;
}

export async function generateMetadata({ params }: PageProps<"/producto/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const producto = await getProducto(slug);
  if (!producto) return {};

  const storeName = await getStoreName();
  const descripcion = resumen(producto.descripcion) || `${producto.nombre} a ${formatCLP(producto.precio)} en ${storeName}.`;
  const imagen = producto.imagenes[0];

  return {
    title: producto.nombre,
    description: descripcion,
    alternates: { canonical: `/producto/${producto.slug}` },
    openGraph: {
      type: "website",
      title: `${producto.nombre} · ${formatCLP(producto.precio)}`,
      description: descripcion,
      siteName: storeName,
      locale: "es_CL",
      url: `/producto/${producto.slug}`,
      images: imagen ? [{ url: imgUrl(imagen.key), width: 1200, height: 1200, alt: producto.nombre }] : undefined,
    },
    twitter: { card: imagen ? "summary_large_image" : "summary" },
  };
}

export default async function ProductoPage({ params, searchParams }: PageProps<"/producto/[slug]">) {
  const { slug } = await params;
  const { v } = await searchParams;
  const producto = await getProducto(slug);
  if (!producto) notFound();

  const env = await getEnv();
  const varianteDesdeUrl = typeof v === "string" && /^\d+$/.test(v) ? Number(v) : undefined;

  // Agrupar variantes por modelo (ya vienen ordenadas por modelo y variante).
  const grupos: GrupoCompatibilidad[] = [];
  for (const pv of producto.variantes) {
    const modelo = pv.variante.modelo.nombre;
    let grupo = grupos.at(-1);
    if (grupo?.modelo !== modelo) {
      grupo = { modelo, variantes: [] };
      grupos.push(grupo);
    }
    grupo.variantes.push({ id: pv.variante.id, nombre: pv.variante.nombre, disponible: pv.disponible });
  }

  return (
    <div className="pt-3 pb-6">
      <BackLink href="/">Volver al catálogo</BackLink>

      <div className="mt-2">
        <ImageCarousel keys={producto.imagenes.map((i) => i.key)} alt={producto.nombre} />
      </div>

      <p className="mt-5 text-center text-base text-ink-soft">{producto.categoria.nombre}</p>
      <h1 className="mt-1 text-center font-display text-3xl leading-tight font-bold">{producto.nombre}</h1>
      <p className="mt-2 text-center font-display text-3xl font-bold text-brand">{formatCLP(producto.precio)}</p>

      {producto.descripcion && (
        <div className="mt-6 text-lg leading-relaxed whitespace-pre-line">{producto.descripcion}</div>
      )}

      <ProductInquiry
        producto={producto.nombre}
        grupos={grupos}
        whatsapp={env.WHATSAPP_NUMBER}
        varianteDesdeUrl={varianteDesdeUrl}
      />
    </div>
  );
}
