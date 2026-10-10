import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { AutoSubmitSelect } from "@/components/admin/auto-submit-select";
import { IconSearch } from "@/components/icons";
import { leerPagina, Paginacion } from "@/components/paginacion";
import { POR_PAGINA } from "@/lib/catalog";
import { getDb } from "@/lib/db";
import { formatCLP, imgUrl } from "@/lib/format";

export default async function ProductosAdminPage({ searchParams }: PageProps<"/admin/productos">) {
  const { q, categoria, pagina: paginaTexto } = await searchParams;
  const pagina = leerPagina(paginaTexto);
  const texto = typeof q === "string" ? q.trim().slice(0, 80) : "";
  const categoriaId = typeof categoria === "string" && /^\d+$/.test(categoria) ? Number(categoria) : undefined;

  const where: Prisma.ProductoWhereInput = {
    ...(categoriaId ? { categoriaId } : {}),
    ...(texto
      ? { AND: texto.split(/\s+/).map((p) => ({ nombre: { contains: p, mode: "insensitive" as const } })) }
      : {}),
  };

  const db = await getDb();
  const [productos, categorias, total, encontrados] = await Promise.all([
    db.producto.findMany({
      where,
      orderBy: [{ activo: "desc" }, { creadoEn: "desc" }],
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
      select: {
        id: true,
        nombre: true,
        precio: true,
        activo: true,
        destacado: true,
        categoria: { select: { nombre: true } },
        imagenes: { orderBy: { orden: "asc" }, take: 1, select: { key: true } },
        _count: { select: { variantes: true } },
      },
    }),
    db.categoria.findMany({ orderBy: [{ orden: "asc" }, { nombre: "asc" }], select: { id: true, nombre: true } }),
    db.producto.count(),
    db.producto.count({ where }),
  ]);
  const paginas = Math.max(1, Math.ceil(encontrados / POR_PAGINA));
  const href = (p: number) => {
    const sp = new URLSearchParams();
    if (texto) sp.set("q", texto);
    if (categoriaId) sp.set("categoria", String(categoriaId));
    if (p > 1) sp.set("pagina", String(p));
    return sp.size ? `/admin/productos?${sp}` : "/admin/productos";
  };

  const filtrando = !!texto || !!categoriaId;

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Productos</h1>
      <p className="text-base text-ink-soft">
        {filtrando ? `${encontrados} de ${total}` : total} {total === 1 ? "producto" : "productos"}
        {paginas > 1 && ` · página ${pagina} de ${paginas}`}
      </p>

      <form className="mt-4 space-y-2" role="search">
        <div className="flex gap-2">
          <label htmlFor="q" className="sr-only">
            Buscar por nombre
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={texto}
            placeholder="Buscar por nombre"
            className="min-h-12 min-w-0 flex-1 rounded-xl border-2 border-line bg-white px-4 text-base focus:border-brand focus:outline-none"
          />
          <button type="submit" className="flex min-h-12 items-center gap-1.5 rounded-xl bg-brand px-4 font-semibold text-white">
            <IconSearch className="h-5 w-5" />
            Buscar
          </button>
        </div>
        <label htmlFor="categoria" className="sr-only">
          Filtrar por categoría
        </label>
        <AutoSubmitSelect
          id="categoria"
          name="categoria"
          defaultValue={categoriaId ?? ""}
          className="min-h-12 w-full rounded-xl border-2 border-line bg-white px-3 text-base"
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </AutoSubmitSelect>
        {filtrando && (
          <Link href="/admin/productos" className="inline-flex min-h-12 items-center font-semibold text-brand">
            Quitar filtros
          </Link>
        )}
      </form>

      {productos.length === 0 ? (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-line bg-white p-8 text-center">
          <p className="text-lg font-semibold">
            {filtrando ? "No hay productos con esos filtros." : "Aún no hay productos."}
          </p>
          {!filtrando && <p className="mt-1 text-base text-ink-soft">Toca “+ Nuevo producto” para crear el primero.</p>}
        </div>
      ) : (
        <ul className="mt-5 grid grid-cols-2 gap-3">
          {productos.map((p) => (
            <li key={p.id} className="flex">
              <Link
                href={`/admin/productos/${p.id}`}
                className={`flex w-full flex-col overflow-hidden rounded-2xl border-2 bg-white shadow-sm active:border-brand ${
                  p.activo ? "border-line" : "border-dashed border-line opacity-60"
                }`}
              >
                <div className="relative aspect-square w-full bg-surface">
                  {p.imagenes[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imgUrl(p.imagenes[0].key)}
                      alt=""
                      width={300}
                      height={300}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-sm text-ink-soft">Sin foto</span>
                  )}
                  {/* Estado sobre la foto, para verlo de un vistazo */}
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1 text-xs font-bold uppercase">
                    <span className={`rounded-md px-1.5 py-0.5 shadow-sm ${p.activo ? "bg-green-100 text-green-800" : "bg-ink text-white"}`}>
                      {p.activo ? "Activo" : "Inactivo"}
                    </span>
                    {p.destacado && <span className="rounded-md bg-brand px-1.5 py-0.5 text-white shadow-sm">Destacado</span>}
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-1 p-2.5">
                  <p className="line-clamp-2 text-base leading-snug font-semibold">{p.nombre}</p>
                  <p className="font-display text-lg font-bold">{formatCLP(p.precio)}</p>
                  <p className="mt-auto text-xs text-ink-soft">
                    {p.categoria.nombre} · {p._count.variantes === 0
                      ? "Universal"
                      : `${p._count.variantes} ${p._count.variantes === 1 ? "modelo" : "modelos"}`}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Paginacion pagina={pagina} paginas={paginas} href={href} />

      {/* Botón flotante, sobre la navegación inferior */}
      <Link
        href="/admin/productos/nuevo"
        className="fixed right-[max(1rem,calc(50vw-224px))] bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 flex min-h-14 items-center gap-2 rounded-full bg-brand px-6 text-lg font-bold text-white shadow-xl active:bg-brand-dark"
      >
        <span aria-hidden className="text-2xl leading-none">+</span>
        Nuevo producto
      </Link>
    </div>
  );
}
