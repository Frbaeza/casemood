import Link from "next/link";
import { IconChevronLeft, IconChevronRight } from "@/components/icons";
import { SaltoPagina } from "@/components/salto-pagina";

/** Botones "Anterior" / "Siguiente" y una lista para saltar a cualquier página. `href(p)` arma la URL de la página p. */
export function Paginacion({ pagina, paginas, href }: { pagina: number; paginas: number; href: (p: number) => string }) {
  if (paginas <= 1) return null;
  return (
    <nav aria-label="Páginas" className="space-y-2 pt-2">
      <SaltoPagina pagina={pagina} enlaces={Array.from({ length: paginas }, (_, i) => href(i + 1))} />
      <div className="flex items-center justify-between gap-2">
        {pagina > 1 ? (
          <Link
            href={href(pagina - 1)}
            className="flex min-h-12 items-center gap-1 rounded-xl border-2 border-line bg-white px-4 font-semibold"
          >
            <IconChevronLeft className="h-5 w-5" />
            Anterior
          </Link>
        ) : (
          <span />
        )}
        {pagina < paginas ? (
          <Link href={href(pagina + 1)} className="flex min-h-12 items-center gap-1 rounded-xl bg-brand px-4 font-semibold text-white">
            Siguiente
            <IconChevronRight className="h-5 w-5" />
          </Link>
        ) : (
          <span />
        )}
      </div>
    </nav>
  );
}

/** "?pagina=n" válido (1 si falta o es inválido). */
export function leerPagina(valor: string | string[] | undefined): number {
  return typeof valor === "string" && /^\d+$/.test(valor) ? Math.max(1, Number(valor)) : 1;
}
