"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { AgregarForm, NombreEditable } from "@/components/admin/inline-forms";
import { OrdenButtons } from "@/components/admin/orden-buttons";
import { Toggle } from "@/components/admin/toggle";
import { useAccion } from "@/components/admin/use-accion";
import {
  cambiarActivoModelo,
  cambiarActivoVariante,
  crearModelo,
  crearVariante,
  eliminarModelo,
  eliminarVariante,
  moverModelo,
  moverVariante,
  renombrarModelo,
  renombrarVariante,
} from "./actions";

type Variante = { id: number; nombre: string; activo: boolean; productos: number };
type Modelo = { id: number; nombre: string; activo: boolean; productos: number; variantes: Variante[] };

type Dialogo =
  | { paso: "confirmar"; tipo: "modelo" | "variante"; id: number; nombre: string }
  | { paso: "ocultar"; tipo: "modelo" | "variante"; id: number; nombre: string; cantidad: number };

export function ModelosEditor({ modelos }: { modelos: Modelo[] }) {
  const { ejecutar, pendiente } = useAccion();
  const [abierto, setAbierto] = useState<number | null>(null);
  const [dialogo, setDialogo] = useState<Dialogo | null>(null);

  function pedirEliminar(tipo: "modelo" | "variante", id: number, nombre: string) {
    setDialogo({ paso: "confirmar", tipo, id, nombre });
  }

  function confirmarDialogo() {
    if (!dialogo) return;
    const { tipo, id, nombre } = dialogo;
    if (dialogo.paso === "confirmar") {
      ejecutar(() => (tipo === "modelo" ? eliminarModelo(id) : eliminarVariante(id)), {
        alTerminar: (r) => {
          if (r.conProductos) setDialogo({ paso: "ocultar", tipo, id, nombre, cantidad: r.conProductos });
          else setDialogo(null);
        },
      });
    } else {
      ejecutar(() => (tipo === "modelo" ? cambiarActivoModelo(id, false) : cambiarActivoVariante(id, false)), {
        alTerminar: () => setDialogo(null),
      });
    }
  }

  return (
    <div className="mt-4 space-y-4">
      <section className="rounded-3xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 font-display text-xl font-bold">Agregar modelo</h2>
        <AgregarForm
          placeholder="Ej: iPhone 17"
          boton="Agregar"
          disabled={pendiente}
          onAgregar={(n) => ejecutar(() => crearModelo(n))}
        />
        <p className="mt-2 text-sm text-ink-soft">Los modelos nuevos aparecen primeros. Después agrégale sus variantes.</p>
      </section>

      {modelos.length === 0 && (
        <p className="rounded-2xl border-2 border-dashed border-line bg-white p-6 text-center text-lg">Aún no hay modelos.</p>
      )}

      <ul className="space-y-2">
        {modelos.map((m, i) => {
          const expandido = abierto === m.id;
          const productos = m.productos;
          return (
            <li key={m.id} className="overflow-hidden rounded-3xl bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setAbierto(expandido ? null : m.id)}
                aria-expanded={expandido}
                className="flex min-h-16 w-full items-center justify-between gap-2 px-4 text-left"
              >
                <span>
                  <span className={`font-display text-xl font-bold ${m.activo ? "" : "text-ink-soft line-through"}`}>{m.nombre}</span>
                  {!m.activo && <span className="ml-2 rounded-md bg-line px-1.5 py-0.5 text-xs font-bold uppercase">Oculto</span>}
                  <span className="block text-sm text-ink-soft">
                    {m.variantes.length} {m.variantes.length === 1 ? "variante" : "variantes"} · {productos}{" "}
                    {productos === 1 ? "producto" : "productos"}
                  </span>
                </span>
                <span className="shrink-0 font-semibold text-brand">{expandido ? "Cerrar ▲" : "Editar ▼"}</span>
              </button>

              {expandido && (
                <div className="space-y-4 border-t-2 border-line px-4 pt-3 pb-4">
                  <div>
                    <p className="mb-1 text-sm font-semibold text-ink-soft">Nombre del modelo</p>
                    <NombreEditable
                      key={m.nombre}
                      etiqueta="Nombre del modelo"
                      valor={m.nombre}
                      disabled={pendiente}
                      onGuardar={(n) => ejecutar(() => renombrarModelo(m.id, n))}
                    />
                  </div>

                  <Toggle
                    checked={m.activo}
                    disabled={pendiente}
                    onChange={(v) => ejecutar(() => cambiarActivoModelo(m.id, v))}
                    label="Visible en la tienda"
                    descripcion={m.activo ? "Aparece en “¿Qué iPhone tienes?”." : "Oculto para los clientes."}
                  />

                  <div className="flex flex-wrap gap-2">
                    <OrdenButtons
                      primero={i === 0}
                      ultimo={i === modelos.length - 1}
                      disabled={pendiente}
                      onMover={(d) => ejecutar(() => moverModelo(m.id, d), { silenciosa: true })}
                    />
                    <button
                      type="button"
                      onClick={() => pedirEliminar("modelo", m.id, m.nombre)}
                      className="ml-auto min-h-11 rounded-lg border-2 border-danger/30 px-3 text-sm font-semibold text-danger"
                    >
                      Eliminar modelo
                    </button>
                  </div>

                  <div className="rounded-2xl bg-surface p-3">
                    <h3 className="font-display text-lg font-bold">Variantes</h3>
                    {m.variantes.length === 0 && (
                      <p className="mt-1 text-sm text-ink-soft">Este modelo aún no tiene variantes; no se mostrará en la tienda.</p>
                    )}
                    <ul className="mt-2 space-y-2">
                      {m.variantes.map((v, j) => (
                        <li key={v.id} className="space-y-2 rounded-xl border-2 border-line bg-white p-3">
                          <NombreEditable
                            key={v.nombre}
                            etiqueta={`Nombre de ${v.nombre}`}
                            valor={v.nombre}
                            disabled={pendiente}
                            onGuardar={(n) => ejecutar(() => renombrarVariante(v.id, n))}
                          />
                          <Toggle
                            checked={v.activo}
                            disabled={pendiente}
                            onChange={(a) => ejecutar(() => cambiarActivoVariante(v.id, a))}
                            label="Visible"
                            descripcion={`${v.productos} ${v.productos === 1 ? "producto" : "productos"}`}
                          />
                          <div className="flex flex-wrap gap-2">
                            <OrdenButtons
                              primero={j === 0}
                              ultimo={j === m.variantes.length - 1}
                              disabled={pendiente}
                              onMover={(d) => ejecutar(() => moverVariante(v.id, d), { silenciosa: true })}
                            />
                            <button
                              type="button"
                              onClick={() => pedirEliminar("variante", v.id, v.nombre)}
                              className="ml-auto min-h-11 rounded-lg border-2 border-danger/30 px-3 text-sm font-semibold text-danger"
                            >
                              Eliminar
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3">
                      <AgregarForm
                        placeholder={`Ej: ${m.nombre} Pro Max`}
                        boton="Agregar"
                        disabled={pendiente}
                        onAgregar={(n) => ejecutar(() => crearVariante(m.id, n))}
                      />
                    </div>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        abierto={!!dialogo}
        titulo={
          dialogo?.paso === "ocultar"
            ? "No se puede eliminar"
            : `¿Eliminar ${dialogo?.tipo === "modelo" ? "el modelo" : "la variante"} “${dialogo?.nombre}”?`
        }
        confirmar={dialogo?.paso === "ocultar" ? "Ocultarlo de la tienda" : "Sí, eliminar"}
        cancelar={dialogo?.paso === "ocultar" ? "Dejarlo como está" : "Cancelar"}
        peligro={dialogo?.paso === "confirmar"}
        ocupado={pendiente}
        onConfirmar={confirmarDialogo}
        onCerrar={() => setDialogo(null)}
      >
        {dialogo?.paso === "ocultar" ? (
          <>
            Tiene {dialogo.cantidad} {dialogo.cantidad === 1 ? "producto asociado" : "productos asociados"}. Puedes ocultarlo
            para que los clientes no lo vean, sin perder esos productos.
          </>
        ) : dialogo?.tipo === "modelo" ? (
          "También se eliminarán sus variantes. Esto no se puede deshacer."
        ) : (
          "Esto no se puede deshacer."
        )}
      </ConfirmDialog>
    </div>
  );
}
