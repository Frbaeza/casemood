import Link from "next/link";
import { IconChevronRight } from "@/components/icons";

/** Invitación a "Diseña tu carcasa" (inicio y categorías de carcasas). */
export function PromoPersonaliza() {
  return (
    <Link
      href="/personaliza"
      className="flex items-center gap-4 rounded-3xl border-2 border-brand bg-brand-soft p-4 shadow-sm active:scale-[0.99]"
    >
      <span aria-hidden className="grid h-20 w-12 shrink-0 place-items-center rounded-xl border-4 border-ink bg-linear-to-br from-orange to-blush" />
      <span className="min-w-0 flex-1">
        <span className="block font-display text-2xl leading-tight font-bold">Diseña tu carcasa</span>
        <span className="mt-1 block text-base text-ink-soft">Sube tu foto y mira cómo queda en tu iPhone.</span>
      </span>
      <IconChevronRight className="h-6 w-6 shrink-0 text-brand" />
    </Link>
  );
}
