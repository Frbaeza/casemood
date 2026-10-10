import { ProductGridSkeleton } from "@/components/product-card";

export default function Loading() {
  return (
    <div className="space-y-4 pt-3" aria-busy="true" aria-label="Cargando productos">
      <div className="h-16 animate-pulse rounded-xl bg-surface" />
      <div className="mx-auto h-9 w-3/4 animate-pulse rounded-lg bg-surface" />
      <div className="flex gap-2">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-12 w-28 animate-pulse rounded-full bg-surface" />
        ))}
      </div>
      <ProductGridSkeleton />
    </div>
  );
}
