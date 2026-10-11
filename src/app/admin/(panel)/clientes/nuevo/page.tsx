import { BackLink } from "@/components/back-link";
import { ClienteForm } from "../cliente-form";

export default function NuevoClientePage() {
  return (
    <div className="space-y-4">
      <BackLink href="/admin/clientes">Volver a clientes</BackLink>
      <h1 className="font-display text-3xl font-bold">Nuevo cliente</h1>
      <ClienteForm id={null} inicial={{ nombre: "", email: "", telefono: "", nota: "" }} />
    </div>
  );
}
