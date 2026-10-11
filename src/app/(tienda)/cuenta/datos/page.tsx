import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { getClienteSesion } from "@/lib/cuenta";
import { aTexto } from "@/lib/fecha-nacimiento";
import { FormularioPerfil } from "../formulario-perfil";

export const metadata: Metadata = { title: "Mis datos", robots: { index: false } };

export default async function MisDatosPage() {
  const cliente = await getClienteSesion();
  if (!cliente) redirect("/cuenta/entrar");
  if (!cliente.fechaNacimiento) redirect("/cuenta/completar");

  return (
    <div className="space-y-5 pt-3 pb-8">
      <BackLink href="/cuenta" historial>
        Volver
      </BackLink>
      <h1 className="font-display text-4xl leading-tight font-bold">Mis datos</h1>
      <FormularioPerfil
        modo="datos"
        nombre={cliente.nombre}
        email={cliente.email ?? ""}
        telefono={cliente.telefono ?? ""}
        fechaNacimiento={aTexto(cliente.fechaNacimiento)}
      />
    </div>
  );
}
