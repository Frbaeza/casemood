"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { toast } from "@/components/admin/toaster";
import { eliminarCliente, guardarCliente } from "./actions";

type Datos = { nombre: string; telefono: string; nota: string };

const campo =
  "mt-1 min-h-12 w-full rounded-xl border-2 border-line bg-white px-3 text-base font-normal focus:border-brand focus:outline-none";

export function ClienteForm({ id, email, inicial, ventas }: { id: number; email: string | null; inicial: Datos; ventas: number }) {
  const router = useRouter();
  const [d, setD] = useState(inicial);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [pendiente, start] = useTransition();
  const [borrando, setBorrando] = useState(false);
  const set = (k: keyof Datos, v: string) => setD((prev) => ({ ...prev, [k]: v }));
  const hayCambios = JSON.stringify(d) !== JSON.stringify(inicial);

  function guardar() {
    start(async () => {
      const r = await guardarCliente(id, d);
      setErrores(r.errores ?? {});
      if (!r.ok) return toast((r.errores && Object.values(r.errores)[0]) ?? r.mensaje ?? "No se pudo guardar.", "error");
      toast(r.mensaje ?? "Guardado.");
      router.refresh();
    });
  }

  function eliminar() {
    start(async () => {
      const r = await eliminarCliente(id);
      if (!r.ok) return toast(r.mensaje ?? "No se pudo eliminar.", "error");
      toast(r.mensaje ?? "Eliminado.");
      router.push("/admin/clientes");
    });
  }

  const error = (k: string) => errores[k] && <span role="alert" className="mt-1 block text-sm font-normal text-danger">{errores[k]}</span>;

  return (
    <section className="space-y-3 rounded-3xl bg-white p-4 shadow-sm">
      <div>
        <p className="text-base font-semibold">Correo de su cuenta</p>
        <p className="mt-1 rounded-xl bg-surface px-3 py-3 text-base break-all">{email ?? "—"}</p>
      </div>
      <label className="block text-base font-semibold">
        Nombre
        <input value={d.nombre} onChange={(e) => set("nombre", e.target.value)} maxLength={80} className={campo} />
        {error("nombre")}
      </label>
      <label className="block text-base font-semibold">
        Teléfono
        <input inputMode="tel" placeholder="56912345678" value={d.telefono} onChange={(e) => set("telefono", e.target.value)} className={campo} />
        {error("telefono")}
      </label>
      <label className="block text-base font-semibold">
        Nota (solo la ves tú)
        <textarea rows={2} maxLength={500} value={d.nota} onChange={(e) => set("nota", e.target.value)} className={`${campo} py-2`} />
      </label>
      <button
        type="button"
        disabled={pendiente || !hayCambios}
        onClick={guardar}
        className="min-h-14 w-full rounded-2xl bg-brand px-4 text-lg font-bold text-white disabled:opacity-50"
      >
        {pendiente ? "Guardando…" : "Guardar cambios"}
      </button>
      <button type="button" onClick={() => setBorrando(true)} className="min-h-12 w-full rounded-xl border-2 border-danger/30 px-3 font-semibold text-danger">
        Eliminar cliente
      </button>
      <ConfirmDialog
        abierto={borrando}
        titulo={`¿Eliminar a ${inicial.nombre}?`}
        confirmar="Sí, eliminar"
        peligro
        ocupado={pendiente}
        onConfirmar={eliminar}
        onCerrar={() => setBorrando(false)}
      >
        Se borra su cuenta de la tienda (podría volver a crearla).{" "}
        {ventas > 0
          ? `Sus ${ventas} ${ventas === 1 ? "venta se conserva" : "ventas se conservan"} como “Cliente genérico”.`
          : ""}
      </ConfirmDialog>
    </section>
  );
}
