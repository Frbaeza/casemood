import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { getOpcionesFormulario } from "../datos-form";
import { ProductForm } from "../product-form";

export default async function EditarProductoPage({ params }: PageProps<"/admin/productos/[id]">) {
  const { id: idTexto } = await params;
  if (!/^\d+$/.test(idTexto)) notFound();
  const id = Number(idTexto);

  const db = await getDb();
  const [producto, { categorias, modelos }] = await Promise.all([
    db.producto.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        nombre: true,
        precio: true,
        categoriaId: true,
        descripcion: true,
        activo: true,
        destacado: true,
        stock: true,
        actualizadoEn: true,
        imagenes: { orderBy: { orden: "asc" }, select: { key: true } },
        variantes: { select: { varianteId: true, disponible: true } },
      },
    }),
    getOpcionesFormulario(),
  ]);
  if (!producto) notFound();

  return (
    <ProductForm
      // Al guardar, el servidor devuelve datos nuevos: la key fuerza a reiniciar el estado del formulario.
      key={producto.actualizadoEn.toISOString()}
      categorias={categorias}
      modelos={modelos}
      inicial={{ ...producto, imagenes: producto.imagenes.map((i) => i.key) }}
    />
  );
}
