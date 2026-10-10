import type { Metadata } from "next";
import Link from "next/link";
import { BackLink } from "@/components/back-link";
import { FiltroActivo } from "@/components/category-chips";
import { EmptyState } from "@/components/empty-state";
import { leerPagina, Paginacion } from "@/components/paginacion";
import { ProductGrid } from "@/components/product-card";
import { OrdenSelect } from "@/components/orden-select";
import { SearchBox } from "@/components/search-box";
import { buscarProductos, getCategoriasConProductos, getProductosDeCategoria } from "@/lib/catalog";
import { leerOrden } from "@/lib/catalog-orden";

export const metadata: Metadata = { title: "Buscar", robots: { index: false } };

export default async function BuscarPage({ searchParams }: PageProps<"/buscar">) {
  const { q, categoria, pagina: paginaTexto, orden: ordenTexto } = await searchParams;
  const texto = (typeof q === "string" ? q : "").trim().slice(0, 80);
  const categoriaSlug = typeof categoria === "string" ? categoria : undefined;
  const pagina = leerPagina(paginaTexto);
  const orden = leerOrden(ordenTexto);

  const [resultados, todasLasCategorias, todos] = await Promise.all([
    texto ? buscarProductos(texto, orden) : Promise.resolve([]),
    getCategoriasConProductos(),
    texto ? Promise.resolve({ productos: [], total: 0, paginas: 1 }) : getProductosDeCategoria(undefined, pagina, orden),
  ]);

  // Categoría elegida en "Filtros" (aunque no tenga resultados para esta palabra).
  const activa = todasLasCategorias.find((c) => c.slug === categoriaSlug);
  const productos = activa ? resultados.filter((p) => p.categoria.slug === activa.slug) : resultados;

  return (
    <div className="space-y-5 pt-3">
      <BackLink href="/">Volver al inicio</BackLink>
      <SearchBox
        key={`${texto}|${categoriaSlug ?? ""}`}
        defaultValue={texto}
        categorias={todasLasCategorias}
        categoriaActiva={activa?.slug}
        viendoTodo={!activa}
      />

      {!texto ? (
        // Sin texto ("Todas las categorías" en Filtros): todo el catálogo, paginado.
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="font-display text-3xl leading-tight font-bold">Todos los productos</h1>
            <p className="text-base text-ink-soft">
              {todos.total} {todos.total === 1 ? "producto" : "productos"}
              {todos.paginas > 1 && ` · página ${pagina} de ${todos.paginas}`}
            </p>
            <OrdenSelect ruta="/buscar" valor={orden} />
          </div>
          <ProductGrid productos={todos.productos} />
          <Paginacion pagina={pagina} paginas={todos.paginas} href={(p) => {
              const sp = new URLSearchParams();
              if (orden !== "recomendados") sp.set("orden", orden);
              if (p > 1) sp.set("pagina", String(p));
              return sp.size ? `/buscar?${sp}` : "/buscar";
            }} />
        </div>
      ) : resultados.length === 0 ? (
        <EmptyState titulo={`No encontramos productos para "${texto}".`}>
          <p className="text-base text-ink-soft">
            Prueba con otra palabra, o toca <strong className="text-ink">Filtros</strong> para ver una categoría completa.
          </p>
          <Link href="/" className="mt-4 inline-flex min-h-12 items-center rounded-xl bg-brand px-5 font-semibold text-white">
            Ver categorías
          </Link>
        </EmptyState>
      ) : activa && productos.length === 0 ? (
        <EmptyState titulo={`No encontramos "${texto}" en ${activa.nombre}.`}>
          <Link
            href={`/buscar?q=${encodeURIComponent(texto)}`}
            className="mt-2 inline-flex min-h-12 items-center rounded-xl bg-brand px-5 font-semibold text-white"
          >
            Buscar en todas las categorías
          </Link>
        </EmptyState>
      ) : (
        <>
          <h1 className="font-display text-2xl font-bold">
            {productos.length} {productos.length === 1 ? "resultado" : "resultados"} para &quot;{texto}&quot;
            {activa && <span className="text-ink-soft"> en {activa.nombre}</span>}
          </h1>
          {activa && <FiltroActivo nombre={activa.nombre} quitarHref={`/buscar?q=${encodeURIComponent(texto)}`} />}
          {productos.length > 1 && (
            <OrdenSelect ruta="/buscar" params={{ q: texto, categoria: activa?.slug }} valor={orden} />
          )}
          <ProductGrid productos={productos} />
        </>
      )}
    </div>
  );
}
