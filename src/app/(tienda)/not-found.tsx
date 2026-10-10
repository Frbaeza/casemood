import Link from "next/link";

// Para notFound() dentro del catálogo (mantiene header y footer).
export default function NotFound() {
  return (
    <div className="py-12 text-center">
      <h1 className="font-display text-3xl font-bold">No encontramos esta página</h1>
      <p className="mt-3 text-lg text-ink-soft">Puede que el producto ya no esté disponible.</p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-brand px-6 font-semibold text-white"
      >
        Ir al inicio
      </Link>
    </div>
  );
}
