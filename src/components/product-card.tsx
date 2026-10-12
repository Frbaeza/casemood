import Link from "next/link";
import { AgregarDesdeTarjeta } from "@/components/agregar-desde-tarjeta";
import type { ProductoTarjeta } from "@/lib/catalog";
import { formatCLP, imgUrl } from "@/lib/format";

export function ProductCard({
  producto,
  varianteId,
  varianteNombre,
}: {
  producto: ProductoTarjeta;
  varianteId?: number;
  /** iPhone de la página actual (ej. /modelo/iphone-15/iphone-15-pro): se agrega para ese modelo. */
  varianteNombre?: string;
}) {
  const imagen = producto.imagenes[0];
  const href = varianteId ? `/producto/${producto.slug}?v=${varianteId}` : `/producto/${producto.slug}`;
  // Modelo con que se agrega al pedido desde la tarjeta (ver AgregarDesdeTarjeta).
  const modelo =
    producto._count.variantes === 0
      ? null
      : varianteNombre
        ? varianteNombre
        : producto.variantes.length === 1
          ? producto.variantes[0].variante.nombre
          : undefined;

  return (
    <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      <Link href={href} className="group flex flex-1 flex-col transition-transform active:scale-[0.98]">
        <div className="aspect-3/4 w-full overflow-hidden bg-surface">
          {imagen ? (
            // Tamaño fijo (3:4, como las fotos de la tienda) para que la grilla no salte mientras carga.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imgUrl(imagen.key)}
              alt={producto.nombre}
              width={600}
              height={800}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-ink-soft">Sin foto</div>
          )}
        </div>
        <div className="flex-1 px-3 pt-3">
          <h3 className="line-clamp-2 text-base leading-snug font-semibold text-ink">{producto.nombre}</h3>
        </div>
      </Link>
      <div className="flex items-center justify-between gap-1 py-2 pr-2 pl-3">
        <p className="font-display text-lg font-bold whitespace-nowrap">{formatCLP(producto.precio)}</p>
        <AgregarDesdeTarjeta
          producto={{
            productoId: producto.id,
            slug: producto.slug,
            nombre: producto.nombre,
            precio: producto.precio,
            imagen: imagen?.key ?? null,
          }}
          modelo={modelo}
          href={href}
        />
      </div>
    </div>
  );
}

export function ProductGrid({
  productos,
  varianteId,
  varianteNombre,
}: {
  productos: ProductoTarjeta[];
  varianteId?: number;
  varianteNombre?: string;
}) {
  return (
    <ul className="grid grid-cols-2 gap-3">
      {productos.map((p) => (
        <li key={p.id} className="flex">
          <ProductCard producto={p} varianteId={varianteId} varianteNombre={varianteNombre} />
        </li>
      ))}
    </ul>
  );
}

export function ProductGridSkeleton({ cantidad = 4 }: { cantidad?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-3" aria-hidden>
      {Array.from({ length: cantidad }, (_, i) => (
        <li key={i} className="overflow-hidden rounded-2xl border border-line">
          <div className="aspect-3/4 animate-pulse bg-surface" />
          <div className="space-y-2 p-3">
            <div className="h-4 animate-pulse rounded bg-surface" />
            <div className="mx-auto h-6 w-2/3 animate-pulse rounded bg-surface" />
          </div>
        </li>
      ))}
    </ul>
  );
}
