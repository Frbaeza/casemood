import Link from "next/link";

// WhatsApp e Instagram están en el footer y en el botón fijo de cada producto.
export function SiteHeader({ storeName }: { storeName: string }) {
  return (
    <header className="sticky top-0 z-30 h-(--header-h) border-b-4 border-orange bg-cream/95 backdrop-blur">
      <div className="mx-auto flex h-full max-w-[480px] items-center px-4">
        <Link href="/" className="flex min-h-12 min-w-0 items-center gap-3" aria-label={`${storeName}, ir al inicio`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-v2-160.png"
            alt=""
            width={52}
            height={52}
            className="h-13 w-13 shrink-0 rounded-2xl border-2 border-orange/30 bg-cream object-cover"
          />
          <span className="min-w-0 leading-none">
            <span className="block font-display text-[1.65rem] font-bold tracking-tight text-orange">
              {storeName}
            </span>
            <span className="mt-0.5 block truncate text-sm text-ink-soft">Carcasas y accesorios</span>
          </span>
        </Link>
      </div>
    </header>
  );
}
