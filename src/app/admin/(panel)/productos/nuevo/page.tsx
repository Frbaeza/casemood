import { getOpcionesFormulario } from "../datos-form";
import { ProductForm } from "../product-form";

export default async function NuevoProductoPage() {
  const { categorias, modelos } = await getOpcionesFormulario();
  return (
    <ProductForm
      categorias={categorias}
      modelos={modelos}
      inicial={{
        nombre: "",
        precio: null,
        // Si solo hay una categoría (ej. "Carcasas"), viene elegida.
        categoriaId: categorias.length === 1 ? categorias[0].id : null,
        descripcion: "",
        activo: true,
        destacado: false,
        imagenes: [],
        variantes: [],
      }}
    />
  );
}
