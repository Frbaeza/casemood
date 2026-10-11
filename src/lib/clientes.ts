import { z } from "zod";

/** Datos de un cliente (admin → Ventas y admin → Clientes). */
export const clienteSchema = z.object({
  nombre: z.string().trim().min(2, "Escribe el nombre del cliente.").max(80),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .transform((v) => v || null)
    .pipe(z.email("Revisa el correo.").nullable()),
  telefono: z
    .string()
    .transform((v) => v.replace(/\D/g, "") || null)
    .pipe(z.string().regex(/^\d{8,15}$/, "Escribe el teléfono con código de país, ej. 56912345678.").nullable()),
});
export type DatosCliente = z.input<typeof clienteSchema>;
