"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconArrowLeft } from "@/components/icons";
import { vieneDeLaTienda } from "@/components/registro-navegacion";

/**
 * Link "Volver". Con `historial`, regresa a la página exacta de la que se vino
 * (misma búsqueda, filtro, orden y página); si se entró directo, va a `href`.
 */
export function BackLink({
  href,
  historial = false,
  children,
}: {
  href: string;
  historial?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <Link
      href={href}
      onClick={(e) => {
        if (!historial || e.metaKey || e.ctrlKey || e.shiftKey || !vieneDeLaTienda()) return;
        e.preventDefault();
        router.back();
      }}
      className="-ml-2 inline-flex min-h-12 items-center gap-2 rounded-xl px-2 text-base font-semibold text-brand"
    >
      <IconArrowLeft className="h-5 w-5" />
      {children}
    </Link>
  );
}
