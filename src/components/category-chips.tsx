import Link from "next/link";

type Categoria = { id: number; nombre: string; slug: string; cantidad?: number };

const claseChip = (seleccionado: boolean) =>
  `flex min-h-12 items-center gap-1.5 rounded-full border-2 px-5 text-base font-semibold whitespace-nowrap ${
    seleccionado ? "border-brand bg-brand text-white" : "border-line bg-white text-ink"
  }`;

function Cantidad({ n, seleccionado }: { n?: number; seleccionado: boolean }) {
  if (n == null) return null;
  return <span className={`text-sm font-normal ${seleccionado ? "text-white/85" : "text-ink-soft"}`}>({n})</span>;
}

/** Fila horizontal deslizable de chips. */
function FilaChips({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <nav aria-label={etiqueta} className="-mx-4">
      <ul className="flex snap-x gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">{children}</ul>
    </nav>
  );
}

/**
 * Chips para filtrar una lista por categoría (?categoria=slug). Son links, así el filtro funciona sin JS.
 * `baseHref` puede traer otros parámetros (ej. "/buscar?q=taza").
 */
export function CategoryChips({
  categorias,
  activa,
  baseHref,
}: {
  categorias: Categoria[];
  activa?: string;
  baseHref: string;
}) {
  const sep = baseHref.includes("?") ? "&" : "?";
  const chip = (label: string, href: string, seleccionado: boolean, key: string | number, cantidad?: number) => (
    <li key={key} className="shrink-0">
      <Link href={href} scroll={false} aria-current={seleccionado ? "page" : undefined} className={claseChip(seleccionado)}>
        {label}
        <Cantidad n={cantidad} seleccionado={seleccionado} />
      </Link>
    </li>
  );

  return (
    <FilaChips etiqueta="Filtrar por categoría">
      {chip("Todo", baseHref, !activa, "todo")}
      {categorias.map((c) =>
        chip(c.nombre, `${baseHref}${sep}categoria=${encodeURIComponent(c.slug)}`, activa === c.slug, c.id, c.cantidad),
      )}
    </FilaChips>
  );
}

/** Etiqueta del filtro activo, con ✕ para quitarlo (lleva a `quitarHref`). */
export function FiltroActivo({ nombre, quitarHref }: { nombre: string; quitarHref: string }) {
  return (
    <Link
      href={quitarHref}
      aria-label={`Quitar filtro ${nombre}`}
      className="inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-brand bg-brand-soft py-1 pr-2 pl-4 text-base font-semibold text-brand"
    >
      {nombre}
      <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-lg leading-none text-white">
        ✕
      </span>
    </Link>
  );
}

