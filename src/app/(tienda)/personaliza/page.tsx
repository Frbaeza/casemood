import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { DisenaCarcasa } from "@/components/disena-carcasa";
import { EmptyState } from "@/components/empty-state";
import { getVariantesPersonalizables } from "@/lib/catalog";
import { getTienda } from "@/lib/configuracion";

export const metadata: Metadata = {
  title: "Diseña tu carcasa",
  description: "Sube tu foto y mira cómo queda tu carcasa personalizada antes de pedirla.",
};

export default async function PersonalizaPage() {
  const [modelos, tienda] = await Promise.all([getVariantesPersonalizables(), getTienda()]);
  if (!tienda.mostrarDisenador) notFound();

  return (
    <div className="space-y-6 pt-3 pb-8">
      <BackLink href="/" historial>
        Volver
      </BackLink>
      <header>
        <h1 className="font-display text-4xl leading-tight font-bold">Diseña tu carcasa</h1>
        <p className="mt-2 text-lg text-ink-soft">
          Sube una foto y mira cómo quedaría en tu iPhone. La imprimimos nosotros.
        </p>
      </header>
      {modelos.length === 0 ? (
        <EmptyState titulo="Pronto podrás diseñar tu carcasa aquí." />
      ) : (
        <DisenaCarcasa modelos={modelos} whatsapp={tienda.whatsapp} tienda={tienda.nombre} />
      )}
    </div>
  );
}
