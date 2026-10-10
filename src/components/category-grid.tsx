import Link from "next/link";
import { imgUrl } from "@/lib/format";

type Categoria = { id: number; nombre: string; slug: string; cantidad: number; imagen?: string };

/** Cuadrados grandes de categorías con foto de portada (inicio). */
export function CategoryGrid({ categorias }: { categorias: Categoria[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3">
      {categorias.map((c, i) => (
        <li key={c.id}>
          <Link
            href={`/categoria/${c.slug}`}
            className="group relative block aspect-square overflow-hidden rounded-3xl border-2 border-line bg-cream shadow-sm transition-transform active:scale-[0.98]"
          >
            {c.imagen ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imgUrl(c.imagen)}
                alt=""
                width={400}
                height={400}
                loading={i < 4 ? "eager" : "lazy"}
                decoding="async"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-brand-soft" />
            )}
            {/* Degradado para que el nombre se lea sobre cualquier foto */}
            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/50 to-transparent px-3 pt-10 pb-3">
              <p className="font-display text-xl leading-tight font-bold text-white">{c.nombre}</p>
              <p className="text-sm text-white/90">
                {c.cantidad} {c.cantidad === 1 ? "producto" : "productos"}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
