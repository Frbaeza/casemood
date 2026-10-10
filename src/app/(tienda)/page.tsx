import { CategoryGrid } from "@/components/category-grid";
import { EmptyState } from "@/components/empty-state";
import { ProductGrid } from "@/components/product-card";
import { SearchBox } from "@/components/search-box";
import { VarianteRecordada } from "@/components/variante-recordada";
import { getCategoriasConProductos, getDestacados } from "@/lib/catalog";

export default async function Home() {
  const [categorias, destacados] = await Promise.all([getCategoriasConProductos(), getDestacados()]);

  return (
    <div className="space-y-8 pt-5">
      <SearchBox categorias={categorias} />

      <section aria-labelledby="titulo-categorias">
        <h1 id="titulo-categorias" className="text-center font-display text-4xl leading-tight font-bold">
          ¿Qué estás buscando?
        </h1>
        <p className="mt-2 text-center text-lg text-ink-soft">Toca una categoría para ver los productos.</p>
        <div className="mt-6">
          {categorias.length === 0 ? (
            <EmptyState titulo="Aún no hay productos disponibles." />
          ) : (
            <CategoryGrid categorias={categorias} />
          )}
        </div>
      </section>

      <VarianteRecordada />

      {destacados.length > 0 && (
        <section aria-labelledby="titulo-destacados">
          <h2 id="titulo-destacados" className="mb-4 text-center font-display text-3xl font-bold">
            Destacados
          </h2>
          <ProductGrid productos={destacados} />
        </section>
      )}
    </div>
  );
}
