import type { Adapter, AdapterUser } from "next-auth/adapters";
import type { PrismaClient } from "@/generated/prisma/client";

type FilaCliente = { id: number; nombre: string; email: string | null; emailVerificado: Date | null };

const aUsuario = (c: FilaCliente): AdapterUser => ({
  id: String(c.id),
  name: c.nombre,
  email: c.email ?? "",
  emailVerified: c.emailVerificado,
});

const columnas = { id: true, nombre: true, email: true, emailVerificado: true } as const;

/**
 * Adaptador mínimo de Auth.js sobre nuestras tablas: el "usuario" es el Cliente.
 * Las sesiones son JWT, así que solo se guardan clientes, sus formas de entrar y los
 * links de acceso por correo. No se guardan tokens de Google.
 */
export function adaptadorClientes(db: PrismaClient): Adapter {
  return {
    async createUser(user) {
      const email = user.email.trim().toLowerCase();
      const datos = {
        nombre: user.name?.trim() || email.split("@")[0],
        emailVerificado: user.emailVerified,
      };
      // Los botones de entrar solo se activan tras aceptar la política de privacidad.
      const c = await db.cliente.upsert({
        where: { email },
        create: { ...datos, email, aceptoPrivacidadEn: new Date() },
        update: { emailVerificado: user.emailVerified },
        select: columnas,
      });
      return aUsuario(c);
    },
    async getUser(id) {
      if (!/^\d+$/.test(id)) return null;
      const c = await db.cliente.findUnique({ where: { id: Number(id) }, select: columnas });
      return c ? aUsuario(c) : null;
    },
    async getUserByEmail(email) {
      const c = await db.cliente.findUnique({ where: { email: email.trim().toLowerCase() }, select: columnas });
      return c ? aUsuario(c) : null;
    },
    async getUserByAccount({ provider, providerAccountId }) {
      const a = await db.accesoCliente.findUnique({
        where: { proveedor_idEnProveedor: { proveedor: provider, idEnProveedor: providerAccountId } },
        select: { cliente: { select: columnas } },
      });
      return a ? aUsuario(a.cliente) : null;
    },
    async updateUser(user) {
      const c = await db.cliente.update({
        where: { id: Number(user.id) },
        data: { ...(user.emailVerified !== undefined ? { emailVerificado: user.emailVerified } : {}) },
        select: columnas,
      });
      return aUsuario(c);
    },
    async linkAccount(account) {
      await db.accesoCliente.upsert({
        where: { proveedor_idEnProveedor: { proveedor: account.provider, idEnProveedor: account.providerAccountId } },
        create: {
          clienteId: Number(account.userId),
          tipo: account.type,
          proveedor: account.provider,
          idEnProveedor: account.providerAccountId,
        },
        update: {},
      });
    },
    async createVerificationToken(t) {
      await db.tokenAcceso.create({ data: { identificador: t.identifier, token: t.token, vence: t.expires } });
      return t;
    },
    async useVerificationToken({ identifier, token }) {
      // Un solo uso: se borra al usarlo.
      const t = await db.tokenAcceso
        .delete({ where: { identificador_token: { identificador: identifier, token } } })
        .catch(() => null);
      return t ? { identifier: t.identificador, token: t.token, expires: t.vence } : null;
    },
  };
}
