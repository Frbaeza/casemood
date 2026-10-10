import { ProductGridSkeleton } from "@/components/product-card";

// Skeleton genérico mientras carga cualquier página del catálogo.
export default function Loading() {
  return (
    <div className="space-y-6 pt-5" aria-busy="true" aria-label="Cargando">
      <div className="h-12 animate-pulse rounded-xl bg-surface" />
      <div className="mx-auto h-10 w-3/4 animate-pulse rounded-lg bg-surface" />
      <ProductGridSkeleton />
    </div>
  );
}
