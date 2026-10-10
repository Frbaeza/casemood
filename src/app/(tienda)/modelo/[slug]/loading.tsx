export default function Loading() {
  return (
    <div className="space-y-3 pt-3" aria-busy="true" aria-label="Cargando">
      <div className="h-12 w-48 animate-pulse rounded-xl bg-surface" />
      <div className="mx-auto h-10 w-2/3 animate-pulse rounded-lg bg-surface" />
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-2xl bg-surface" />
      ))}
    </div>
  );
}
