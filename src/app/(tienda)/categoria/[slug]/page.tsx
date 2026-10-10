import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { FiltroActivo } from "@/components/category-chips";
import { EmptyState } from "@/components/empty-state";
import { ModelGrid } from "@/components/model-grid";
import { leerPagina, Paginacion } from "@/components/paginacion";
import { ProductGrid } from "@/components/product-card";
import { OrdenSelect } from "@/components/orden-select";
import { SearchBox } from "@/components/search-box";
import { getCategoriasConProductos, getModelos, getProductosDeCategoria } from "@/lib/catalog";
import { leerOrden } from "@/lib/catalog-orden";

export async function generateMetadata({ params }: PageProps<"/categoria/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const categoria = (await getCategoriasConProductos()).find((c) => c.slug === slug);
  return categoria ? { title: categoria.nombre } : {};
}

export default async function CategoriaPage({ params, searchParams }: PageProps<"/categoria/[slug]">) {
  const { slug } = await params;
  const { pagina: paginaTexto, orden: ordenTexto } = await searchParams;
  const pagina = leerPagina(paginaTexto);
  const orden = leerOrden(ordenTexto);

  const categorias = await getCategoriasConProductos();
  const categoria = categorias.find((c) => c.slug === slug);
  if (!categoria) notFound();

  // Si los productos dependen del modelo (ej. Carcasas), primero se elige el iPhone.
  const [{ productos, total, paginas }, modelos] = await Promise.all([
    getProductosDeCategoria(slug, pagina, orden),
    categoria.porModelo && pagina === 1 ? getModelos(slug) : Promise.resolve([]),
  ]);
  const nombreMinuscula = categoria.nombre.toLocaleLowerCase("es-CL");
  const Titulo = modelos.length > 0 ? "h2" : "h1";
  const href = (p: number) => {
    const sp = new URLSearchParams();
    if (orden !== "recomendados") sp.set("orden", orden);
    if (p > 1) sp.set("pagina", String(p));
    const qs = sp.toString();
    return qs ? `/categoria/${slug}?${qs}` : `/categoria/${slug}`;
  };

  return (
    <div className="space-y-4 pt-3">
      <BackLink href="/">Volver al inicio</BackLink>

      <SearchBox key={slug} categorias={categorias} categoriaActiva={slug} />

      <FiltroActivo nombre={categoria.nombre} quitarHref="/" />

      {modelos.length > 0 && (
        <section aria-labelledby="titulo-modelos" className="pt-2 pb-4">
          <h1 id="titulo-modelos" className="text-center font-display text-3xl leading-tight font-bold">
            ¿Qué iPhone tienes?
          </h1>
          <p className="mt-1 mb-4 text-center text-lg text-ink-soft">
            Toca tu modelo para ver las {nombreMinuscula} que le quedan.
          </p>
          <ModelGrid modelos={modelos} categoriaSlug={slug} />
        </section>
      )}

      <div className="space-y-2">
        <Titulo className="font-display text-3xl leading-tight font-bold">
          {modelos.length > 0 ? `Todas las ${nombreMinuscula}` : categoria.nombre}
        </Titulo>
        <p className="text-base text-ink-soft">
          {total} {total === 1 ? "producto" : "productos"}
          {paginas > 1 && ` · página ${pagina} de ${paginas}`}
        </p>
        {total > 1 && <OrdenSelect ruta={`/categoria/${slug}`} params={{}} valor={orden} />}
      </div>

      {productos.length === 0 ? (
        <EmptyState titulo="No hay más productos en esta página.">
          <Link href={href(1)} className="inline-flex min-h-12 items-center rounded-xl bg-brand px-5 font-semibold text-white">
            Ir a la primera página
          </Link>
        </EmptyState>
      ) : (
        <ProductGrid productos={productos} />
      )}

      <Paginacion pagina={pagina} paginas={paginas} href={href} />
    </div>
  );
}
