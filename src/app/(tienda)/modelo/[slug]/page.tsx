import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { EmptyState } from "@/components/empty-state";
import { IconChevronRight } from "@/components/icons";
import { getModelo } from "@/lib/catalog";

export async function generateMetadata({ params }: PageProps<"/modelo/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const modelo = await getModelo(slug);
  if (!modelo) return {};
  return {
    title: `Carcasas y accesorios para ${modelo.nombre}`,
    description: `Carcasas, protectores y accesorios para ${modelo.nombre} y sus versiones. Elige tu iPhone y pide por WhatsApp.`,
    alternates: { canonical: `/modelo/${slug}` },
  };
}

export default async function ModeloPage({ params, searchParams }: PageProps<"/modelo/[slug]">) {
  const { slug } = await params;
  const { categoria } = await searchParams;
  // Si se llegó desde una categoría (ej. Carcasas): la disponibilidad se calcula con sus productos
  // y el filtro sigue al elegir la versión.
  const categoriaSlug = typeof categoria === "string" && /^[a-z0-9-]+$/.test(categoria) ? categoria : undefined;
  const modelo = await getModelo(slug, categoriaSlug);
  if (!modelo) notFound();
  const sufijo = categoriaSlug ? `?categoria=${categoriaSlug}` : "";
  const hayDisponibles = modelo.variantes.some((v) => v.disponible);

  return (
    <div className="pt-3">
      <BackLink href={categoriaSlug ? `/categoria/${categoriaSlug}` : "/"}>
        {categoriaSlug ? "Volver a los modelos" : "Volver al inicio"}
      </BackLink>

      <h1 className="mt-3 text-center font-display text-4xl leading-tight font-bold">{modelo.nombre}</h1>
      <p className="mt-2 text-center text-lg text-ink-soft">¿Cuál de estos es el tuyo?</p>

      {!hayDisponibles && (
        <div className="mt-6">
          <EmptyState titulo="Por ahora no hay productos para este modelo.">
            <Link
              href={categoriaSlug ? `/categoria/${categoriaSlug}` : "/"}
              className="inline-flex min-h-12 items-center rounded-xl bg-brand px-5 font-semibold text-white"
            >
              Ver otros modelos
            </Link>
          </EmptyState>
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {modelo.variantes.map((v) => (
          <li key={v.id}>
            {v.disponible ? (
              <Link
                href={`/modelo/${modelo.slug}/${v.slug}${sufijo}`}
                className="flex min-h-16 items-center justify-between gap-3 rounded-2xl border-2 border-line bg-white px-5 shadow-sm active:border-brand active:bg-brand-soft"
              >
                <span className="font-display text-2xl font-bold">{v.nombre}</span>
                <span className="flex items-center gap-1 text-base font-semibold text-brand">
                  Elegir
                  <IconChevronRight className="h-5 w-5" />
                </span>
              </Link>
            ) : (
              // Sin productos: se muestra para que el cliente sepa que existe, pero no se puede tocar.
              <div
                aria-disabled="true"
                className="flex min-h-16 items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-line bg-surface px-5 text-ink-soft opacity-70"
              >
                <span className="font-display text-2xl font-bold">{v.nombre}</span>
                <span className="text-base font-semibold">Sin stock</span>
              </div>
            )}
          </li>
        ))}
      </ul>

      <p className="mt-8 rounded-2xl bg-surface p-4 text-base text-ink-soft">
        <strong className="text-ink">¿No sabes cuál tienes?</strong> En tu iPhone abre{" "}
        <strong className="text-ink">Ajustes › General › Información</strong> y mira el &quot;Nombre del modelo&quot;.
      </p>
    </div>
  );
}
