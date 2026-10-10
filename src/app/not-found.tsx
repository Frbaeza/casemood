import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-[480px] flex-1 px-4 py-16 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-v2-160.png" alt="" width={96} height={96} className="mx-auto h-24 w-24 rounded-3xl" />
      <h1 className="mt-6 font-display text-3xl font-bold">No encontramos esta página</h1>
      <p className="mt-3 text-lg text-ink-soft">Puede que el producto ya no esté disponible.</p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-brand px-6 font-semibold text-white"
      >
        Ir al inicio
      </Link>
    </main>
  );
}
