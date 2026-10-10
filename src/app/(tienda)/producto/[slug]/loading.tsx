export default function Loading() {
  return (
    <div className="space-y-4 pt-3" aria-busy="true" aria-label="Cargando producto">
      <div className="h-12 w-40 animate-pulse rounded-xl bg-surface" />
      <div className="aspect-3/4 w-full animate-pulse rounded-2xl bg-surface" />
      <div className="mx-auto h-9 w-3/4 animate-pulse rounded-lg bg-surface" />
      <div className="mx-auto h-9 w-1/3 animate-pulse rounded-lg bg-surface" />
      <div className="h-24 animate-pulse rounded-xl bg-surface" />
    </div>
  );
}
