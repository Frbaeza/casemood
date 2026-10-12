import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryChips } from "@/components/category-chips";
import { EmptyState } from "@/components/empty-state";
import { IconPhone } from "@/components/icons";
import { OrdenSelect } from "@/components/orden-select";
import { ProductGrid } from "@/components/product-card";
import { RecordarVariante } from "@/components/variante-recordada";
import { getCategoriasConProductos, getProductosParaVariante, getVariante } from "@/lib/catalog";
import { leerOrden } from "@/lib/catalog-orden";

export async function generateMetadata({ params }: PageProps<"/modelo/[slug]/[variante]">): Promise<Metadata> {
  const { slug, variante } = await params;
  const v = await getVariante(slug, variante);
  if (!v) return {};
  return {
    title: `Carcasas y accesorios para ${v.nombre}`,
    description: `Carcasas, protectores de cámara y accesorios para ${v.nombre}. Elige tu iPhone y pide por WhatsApp.`,
    alternates: { canonical: `/modelo/${slug}/${variante}` },
  };
}

export default async function VariantePage({ params, searchParams }: PageProps<"/modelo/[slug]/[variante]">) {
  const { slug, variante: varianteSlug } = await params;
  const { categoria, orden: ordenTexto } = await searchParams;
  const orden = leerOrden(ordenTexto);
  const categoriaSlug = typeof categoria === "string" && categoria ? categoria : undefined;

  const variante = await getVariante(slug, varianteSlug);
  if (!variante) notFound();

  const [{ productos, categorias, categoriaActiva }, todas] = await Promise.all([
    getProductosParaVariante(variante.id, categoriaSlug, orden),
    getCategoriasConProductos(),
  ]);
  // "Cambiar modelo" vuelve a la lista de modelos de la categoría (ej. Carcasas); el inicio ya no la muestra.
  const conModelos = todas.find((c) => c.slug === categoriaSlug && c.porModelo) ?? todas.find((c) => c.porModelo);
  const cambiarModeloHref = conModelos ? `/categoria/${conModelos.slug}` : "/";
  const baseHref = `/modelo/${slug}/${varianteSlug}`;

  return (
    <div className="pt-3">
      <RecordarVariante
        id={variante.id}
        nombre={variante.nombre}
        modeloSlug={variante.modelo.slug}
        varianteSlug={variante.slug}
      />

      {/* Variante elegida siempre visible arriba */}
      <div className="sticky top-(--header-h) z-20 -mx-4 border-b border-line bg-white/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-ink-soft">Tu iPhone</p>
            <p className="flex items-center gap-1.5 font-display text-xl leading-tight font-bold">
              <IconPhone className="h-5 w-5 shrink-0 self-start text-brand" />
              {variante.nombre}
            </p>
          </div>
          <Link
            href={cambiarModeloHref}
            className="flex min-h-12 shrink-0 items-center rounded-xl border-2 border-brand px-4 font-semibold text-brand active:bg-brand-soft"
          >
            Cambiar modelo
          </Link>
        </div>
      </div>

      <h1 className="mt-5 text-center font-display text-3xl leading-tight font-bold">
        Para tu {variante.nombre}
      </h1>

      {categorias.length > 1 && (
        <div className="mt-4">
          <CategoryChips categorias={categorias} activa={categoriaActiva?.slug} baseHref={baseHref} />
        </div>
      )}

      <div className="mt-4">
        {productos.length === 0 ? (
          <EmptyState
            titulo={
              categoriaActiva
                ? `Aún no hay ${categoriaActiva.nombre.toLowerCase()} para este modelo.`
                : "Aún no hay carcasas para este modelo."
            }
          >
            <p className="text-base text-ink-soft">Escríbenos por WhatsApp y te avisamos cuando lleguen.</p>
            <Link
              href={categoriaActiva ? baseHref : cambiarModeloHref}
              className="mt-4 inline-flex min-h-12 items-center rounded-xl bg-brand px-5 font-semibold text-white"
            >
              {categoriaActiva ? "Ver todo para este modelo" : "Ver otros modelos"}
            </Link>
          </EmptyState>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-base text-ink-soft">
                {productos.length} {productos.length === 1 ? "producto" : "productos"}
              </p>
              {productos.length > 1 && (
                <OrdenSelect ruta={baseHref} params={{ categoria: categoriaActiva?.slug }} valor={orden} />
              )}
            </div>
            <ProductGrid productos={productos} varianteId={variante.id} varianteNombre={variante.nombre} />
          </>
        )}
      </div>
    </div>
  );
}
