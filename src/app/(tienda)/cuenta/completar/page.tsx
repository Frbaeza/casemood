import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getClienteSesion } from "@/lib/cuenta";
import { FormularioPerfil } from "../formulario-perfil";

export const metadata: Metadata = { title: "Completa tu perfil", robots: { index: false } };

/** Primera vez que entra: datos obligatorios antes de ver su cuenta. */
export default async function CompletarPerfilPage() {
  const cliente = await getClienteSesion();
  if (!cliente) redirect("/cuenta/entrar");
  if (cliente.fechaNacimiento) redirect("/cuenta");

  return (
    <div className="space-y-5 pt-5 pb-8">
      <header>
        <p className="text-lg text-ink-soft">¡Bienvenida o bienvenido! 👋</p>
        <h1 className="font-display text-4xl leading-tight font-bold">Completa tu perfil</h1>
        <p className="mt-2 text-lg text-ink-soft">Un último paso para crear tu cuenta.</p>
      </header>
      <FormularioPerfil
        modo="completar"
        nombre={cliente.nombre}
        email={cliente.email ?? ""}
        telefono={cliente.telefono ?? ""}
        fechaNacimiento=""
      />
    </div>
  );
}
