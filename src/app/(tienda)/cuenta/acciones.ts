"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { getClienteSesion } from "@/lib/cuenta";
import { aFecha, EDAD_SIN_TUTOR, edad, errorFechaNacimiento } from "@/lib/fecha-nacimiento";
import { getDb } from "@/lib/db";

export async function entrarConGoogle() {
  await signIn("google", { redirectTo: "/cuenta" });
}

/** Envía el link de acceso al correo (Auth.js redirige a "Revisa tu correo"). */
export async function entrarConCorreo(formData: FormData) {
  const email = z.email().safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!email.success) redirect("/cuenta/entrar?error=CorreoInvalido");
  await signIn("resend", { email: email.data, redirectTo: "/cuenta" });
}

export async function salirDeLaCuenta() {
  await signOut({ redirectTo: "/" });
}

const datosSchema = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre.").max(80, "El nombre es muy largo."),
  telefono: z
    .string()
    .transform((v) => v.replace(/\D/g, "") || null)
    .pipe(z.string().regex(/^\d{8,15}$/, "Escribe tu teléfono con código de país, ej. 56912345678.").nullable()),
  fechaNacimiento: z.string().trim(),
  autorizaTutor: z.boolean(),
});

export type ResultadoDatos = { ok: boolean; mensaje: string };

/** Valida nombre, teléfono y fecha de nacimiento (obligatoria; menores de 14 con autorización). */
function leerDatos(formData: FormData) {
  const d = datosSchema.safeParse({
    nombre: formData.get("nombre") ?? "",
    telefono: formData.get("telefono") ?? "",
    fechaNacimiento: formData.get("fechaNacimiento") ?? "",
    autorizaTutor: formData.get("autorizaTutor") === "on",
  });
  if (!d.success) return { error: d.error.issues[0]?.message ?? "Revisa tus datos." } as const;
  const errorFecha = errorFechaNacimiento(d.data.fechaNacimiento);
  if (errorFecha) return { error: errorFecha } as const;
  const menor = edad(d.data.fechaNacimiento) < EDAD_SIN_TUTOR;
  if (menor && !d.data.autorizaTutor) {
    return { error: "Si tienes menos de 14 años, marca que tu madre, padre o tutor te autoriza." } as const;
  }
  return {
    datos: {
      nombre: d.data.nombre,
      telefono: d.data.telefono,
      fechaNacimiento: aFecha(d.data.fechaNacimiento),
      autorizaTutor: menor && d.data.autorizaTutor,
    },
  } as const;
}

/** "Mis datos": el cliente con sesión cambia su nombre, teléfono y fecha de nacimiento (el correo es el de su cuenta). */
export async function guardarMisDatos(_prev: ResultadoDatos | null, formData: FormData): Promise<ResultadoDatos> {
  const cliente = await getClienteSesion();
  if (!cliente) return { ok: false, mensaje: "Tu sesión expiró. Vuelve a entrar." };
  const r = leerDatos(formData);
  if (!r.datos) return { ok: false, mensaje: r.error ?? "Revisa tus datos." };
  const db = await getDb();
  await db.cliente.update({ where: { id: cliente.id }, data: r.datos });
  revalidatePath("/", "layout");
  return { ok: true, mensaje: "Tus datos quedaron guardados." };
}

/** "Completa tu perfil" (primera vez que entra): guarda los datos y lo lleva a su cuenta. */
export async function completarPerfil(_prev: ResultadoDatos | null, formData: FormData): Promise<ResultadoDatos> {
  const cliente = await getClienteSesion();
  if (!cliente) return { ok: false, mensaje: "Tu sesión expiró. Vuelve a entrar." };
  const r = leerDatos(formData);
  if (!r.datos) return { ok: false, mensaje: r.error ?? "Revisa tus datos." };
  const db = await getDb();
  await db.cliente.update({ where: { id: cliente.id }, data: r.datos });
  revalidatePath("/", "layout");
  redirect("/cuenta");
}
