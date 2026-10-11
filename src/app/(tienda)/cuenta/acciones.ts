"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { signIn, signOut } from "@/auth";

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
