import Link from "next/link";
import type { ProductoTarjeta } from "@/lib/catalog";
import { formatCLP, imgUrl } from "@/lib/format";

export function ProductCard({ producto, varianteId }: { producto: ProductoTarjeta; varianteId?: number }) {
  const imagen = producto.imagenes[0];
  const href = varianteId ? `/producto/${producto.slug}?v=${varianteId}` : `/producto/${producto.slug}`;

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm active:scale-[0.98] transition-transform"
    >
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
      <div className="flex flex-1 flex-col gap-1 p-3 text-center">
        <h3 className="line-clamp-2 text-base leading-snug font-semibold text-ink">{producto.nombre}</h3>
        <p className="mt-auto font-display text-xl font-bold">{formatCLP(producto.precio)}</p>
      </div>
    </Link>
  );
}

export function ProductGrid({ productos, varianteId }: { productos: ProductoTarjeta[]; varianteId?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-3">
      {productos.map((p) => (
        <li key={p.id} className="flex">
          <ProductCard producto={p} varianteId={varianteId} />
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
