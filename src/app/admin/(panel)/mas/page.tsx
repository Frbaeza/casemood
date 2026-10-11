import Link from "next/link";
import { IconChevronRight } from "@/components/icons";
import { SECCIONES_MAS } from "@/lib/admin-secciones";

export default function MasPage() {
  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Más</h1>
      <ul className="mt-4 divide-y divide-line overflow-hidden rounded-3xl bg-white shadow-sm">
        {SECCIONES_MAS.map((s) => (
          <li key={s.href}>
            <Link href={s.href} className="flex min-h-16 items-center gap-3 px-4 py-3 active:bg-surface">
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-semibold">{s.label}</span>
                <span className="block text-sm text-ink-soft">{s.descripcion}</span>
              </span>
              <IconChevronRight className="h-5 w-5 shrink-0 text-ink-soft" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
