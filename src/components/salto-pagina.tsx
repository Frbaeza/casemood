"use client";

import { useRouter } from "next/navigation";

/** Lista "Página X de N" para ir directo a una página (sin recorrerlas una por una). */
export function SaltoPagina({ pagina, enlaces }: { pagina: number; enlaces: string[] }) {
  const router = useRouter();
  return (
    <label className="block">
      <span className="sr-only">Ir a la página</span>
      <select
        value={pagina}
        onChange={(e) => router.push(enlaces[Number(e.target.value) - 1])}
        className="min-h-12 w-full rounded-xl border-2 border-line bg-white px-3 text-base font-semibold text-ink focus:border-brand focus:outline-none"
      >
        {enlaces.map((_, i) => (
          <option key={i} value={i + 1}>
            Página {i + 1} de {enlaces.length}
          </option>
        ))}
      </select>
    </label>
  );
}
