import type { Metadata } from "next";
import Link from "next/link";
import { signOut } from "@/auth";
import { BottomNav } from "@/components/admin/bottom-nav";
import { Toaster } from "@/components/admin/toaster";
import { requireAdmin } from "@/lib/admin-auth";
import { getTienda } from "@/lib/configuracion";

export const metadata: Metadata = { title: "Panel", robots: { index: false } };

export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const [email, tienda] = await Promise.all([requireAdmin(), getTienda()]);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-cream">
      <header className="sticky top-0 z-30 border-b-4 border-orange bg-white">
        <div className="mx-auto flex h-16 max-w-[480px] items-center justify-between gap-2 px-4">
          <div className="flex min-w-0 items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={tienda.logo} alt="" width={40} height={40} className="h-10 w-10 rounded-xl object-cover" />
            <div className="min-w-0 leading-tight">
              <p className="font-display text-xl font-bold text-orange">Panel</p>
              <p className="truncate text-xs text-ink-soft">{email}</p>
            </div>
          </div>
          <div className="flex shrink-0 gap-1">
            <Link
              href="/"
              target="_blank"
              className="flex min-h-12 items-center rounded-xl px-3 text-base font-semibold text-brand"
            >
              Ver tienda
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/admin/entrar" });
              }}
            >
              <button type="submit" className="min-h-12 rounded-xl border-2 border-line px-3 text-base font-semibold">
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[480px] flex-1 px-4 pt-4 pb-44">{children}</main>

      <Toaster />
      <BottomNav />
    </div>
  );
}
