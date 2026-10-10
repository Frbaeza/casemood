"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { AgregarForm, NombreEditable } from "@/components/admin/inline-forms";
import { OrdenButtons } from "@/components/admin/orden-buttons";
import { useAccion } from "@/components/admin/use-accion";
import { crearCategoria, eliminarCategoria, moverCategoria, renombrarCategoria } from "./actions";
import { FotoCategoria } from "./foto-categoria";

type Categoria = { id: number; nombre: string; productos: number; imagenKey: string | null; respaldoKey: string | null };

export function CategoriasEditor({ categorias }: { categorias: Categoria[] }) {
  const { ejecutar, pendiente } = useAccion();
  const [eliminar, setEliminar] = useState<Categoria | null>(null);

  return (
    <div className="mt-4 space-y-4">
      <section className="rounded-3xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 font-display text-xl font-bold">Agregar categoría</h2>
        <AgregarForm
          placeholder="Ej: Micas"
          boton="Agregar"
          disabled={pendiente}
          onAgregar={(n) => ejecutar(() => crearCategoria(n))}
        />
      </section>

      {categorias.length === 0 ? (
        <p className="rounded-2xl border-2 border-dashed border-line bg-white p-6 text-center text-lg">
          Aún no hay categorías. Crea al menos una para poder agregar productos.
        </p>
      ) : (
        <ul className="space-y-2">
          {categorias.map((c, i) => (
            <li key={c.id} className="space-y-2 rounded-3xl bg-white p-4 shadow-sm">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-display text-xl font-bold">{c.nombre}</p>
                <p className="shrink-0 text-sm text-ink-soft">
                  {c.productos} {c.productos === 1 ? "producto" : "productos"}
                </p>
              </div>
              <FotoCategoria id={c.id} nombre={c.nombre} imagenKey={c.imagenKey} respaldoKey={c.respaldoKey} />
              <NombreEditable
                key={c.nombre}
                etiqueta={`Nombre de ${c.nombre}`}
                valor={c.nombre}
                disabled={pendiente}
                onGuardar={(n) => ejecutar(() => renombrarCategoria(c.id, n))}
              />
              <div className="flex flex-wrap gap-2">
                <OrdenButtons
                  primero={i === 0}
                  ultimo={i === categorias.length - 1}
                  disabled={pendiente}
                  onMover={(d) => ejecutar(() => moverCategoria(c.id, d), { silenciosa: true })}
                />
                <button
                  type="button"
                  onClick={() => setEliminar(c)}
                  className="ml-auto min-h-11 rounded-lg border-2 border-danger/30 px-3 text-sm font-semibold text-danger"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        abierto={!!eliminar}
        titulo={eliminar?.productos ? "No se puede eliminar" : `¿Eliminar “${eliminar?.nombre}”?`}
        confirmar={eliminar?.productos ? "Entendido" : "Sí, eliminar"}
        cancelar={eliminar?.productos ? null : "Cancelar"}
        peligro={!eliminar?.productos}
        ocupado={pendiente}
        onConfirmar={() => {
          if (!eliminar || eliminar.productos) return setEliminar(null);
          const id = eliminar.id;
          ejecutar(() => eliminarCategoria(id), { alTerminar: () => setEliminar(null) });
        }}
        onCerrar={() => setEliminar(null)}
      >
        {eliminar?.productos
          ? `Tiene ${eliminar.productos} ${eliminar.productos === 1 ? "producto" : "productos"}. Cámbialos a otra categoría (o elimínalos) y vuelve a intentarlo.`
          : "Esto no se puede deshacer."}
      </ConfirmDialog>
    </div>
  );
}
