"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECCIONES_MAS } from "@/lib/admin-secciones";

const SECCIONES = [
  {
    href: "/admin/ventas",
    label: "Ventas",
    activaEn: ["/admin/ventas"],
    icono: (
      <>
        <path d="M4 4h16v16H4z" />
        <path d="M8 15l3-3 2 2 4-5" />
      </>
    ),
  },
  {
    href: "/admin/productos",
    label: "Productos",
    activaEn: ["/admin/productos"],
    icono: <path d="M4 7l8-4 8 4-8 4-8-4zM4 7v10l8 4 8-4V7M12 11v10" />,
  },
  {
    href: "/admin/clientes",
    label: "Clientes",
    activaEn: ["/admin/clientes"],
    icono: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
      </>
    ),
  },
  {
    href: "/admin/analisis",
    label: "Análisis",
    activaEn: ["/admin/analisis"],
    icono: <path d="M5 20V10M12 20V4M19 20v-7" />,
  },
  {
    href: "/admin/mas",
    label: "Más",
    activaEn: ["/admin/mas", ...SECCIONES_MAS.map((s) => s.href)],
    icono: (
      <>
        <circle cx="5" cy="12" r="1.5" />
        <circle cx="12" cy="12" r="1.5" />
        <circle cx="19" cy="12" r="1.5" />
      </>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Secciones del panel"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid max-w-[480px] grid-cols-5">
        {SECCIONES.map((s) => {
          const activa = s.activaEn.some((r) => pathname.startsWith(r));
          return (
            <li key={s.href}>
              <Link
                href={s.href}
                aria-current={activa ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-0.5 text-sm font-semibold ${
                  activa ? "text-brand" : "text-ink-soft"
                }`}
              >
                <span className={`rounded-full px-3 py-1 ${activa ? "bg-brand-soft" : ""}`}>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    {s.icono}
                  </svg>
                </span>
                {s.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
