import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "@/auth";
import { IconGoogle } from "@/components/icons";
import { getTienda } from "@/lib/configuracion";
import { getAdminEmail } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Entrar al panel", robots: { index: false } };

const MENSAJES: Record<string, string> = {
  AccessDenied: "Este correo no tiene permiso para entrar al panel. Pide que lo agreguen a la lista de administradores.",
  Configuration: "Hay un problema con la configuración del inicio de sesión. Revisa las variables AUTH_* del proyecto.",
};

export default async function EntrarPage({ searchParams }: PageProps<"/admin/entrar">) {
  const tienda = await getTienda();
  const { error, volver } = await searchParams;
  const destino = typeof volver === "string" && volver.startsWith("/admin") ? volver : "/admin/ventas";

  if (await getAdminEmail()) redirect(destino);
  // Sesión de cliente (no administrador): se ofrece salir para entrar con otra cuenta.
  const otraCuenta = (await auth())?.user?.email ?? null;

  const mensaje = typeof error === "string" ? (MENSAJES[error] ?? "No se pudo iniciar sesión. Inténtalo otra vez.") : null;

  return (
    <main className="flex flex-1 items-center justify-center bg-cream px-4 py-12">
      <div className="w-full max-w-[400px] rounded-3xl bg-white p-6 text-center shadow-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={tienda.logo} alt="" width={96} height={96} className="mx-auto h-24 w-24 rounded-3xl" />
        <h1 className="mt-4 font-display text-3xl font-bold">Panel de la tienda</h1>
        <p className="mt-2 text-lg text-ink-soft">Entra con tu cuenta de Google para administrar el catálogo.</p>

        {otraCuenta && (
          <div role="alert" className="mt-5 rounded-2xl border-2 border-line bg-surface p-4 text-left text-base">
            Entraste como <strong className="break-all">{otraCuenta}</strong>, que no tiene acceso al panel.
            <form
              className="mt-3"
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/admin/entrar" });
              }}
            >
              <button type="submit" className="min-h-12 w-full rounded-xl border-2 border-line bg-white px-3 font-semibold">
                Salir de esa cuenta
              </button>
            </form>
          </div>
        )}

        {mensaje && (
          <p role="alert" className="mt-5 rounded-2xl border-2 border-danger/30 bg-danger/5 p-4 text-left text-base text-danger">
            {mensaje}
          </p>
        )}

        <form
          className="mt-6"
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: destino });
          }}
        >
          <button
            type="submit"
            className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border-2 border-line bg-white px-4 text-lg font-semibold text-ink shadow-sm active:bg-cream"
          >
            <IconGoogle className="h-6 w-6" />
            Entrar con Google
          </button>
        </form>

        <Link href="/" className="mt-4 inline-flex min-h-12 items-center text-base font-semibold text-brand">
          Volver a la tienda
        </Link>
      </div>
    </main>
  );
}
