import { BackLink } from "@/components/back-link";
import { diaChile } from "@/lib/ventas";
import { VentaForm } from "../venta-form";

export default function NuevaVentaPage() {
  return (
    <div>
      <BackLink href="/admin/ventas">Volver a ventas</BackLink>
      <h1 className="font-display text-3xl font-bold">Nueva venta</h1>
      <VentaForm hoy={diaChile()} />
    </div>
  );
}
