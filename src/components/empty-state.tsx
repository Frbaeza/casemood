export function EmptyState({ titulo, children }: { titulo: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-line px-5 py-10 text-center">
      <p className="text-lg font-semibold">{titulo}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
