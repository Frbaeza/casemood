import type { Metadata } from "next";
import { BackLink } from "@/components/back-link";
import { getTienda } from "@/lib/configuracion";
import { whatsappUrl } from "@/lib/format";

export const metadata: Metadata = { title: "Política de privacidad" };

export default async function PrivacidadPage() {
  const t = await getTienda();
  const h2 = "mt-6 font-display text-2xl font-bold";

  return (
    <article className="space-y-3 pt-3 pb-10 text-lg leading-relaxed">
      <BackLink href="/" historial>
        Volver
      </BackLink>
      <h1 className="font-display text-4xl leading-tight font-bold">Política de privacidad</h1>
      <p className="text-base text-ink-soft">Última actualización: 11 de octubre de 2026.</p>

      <p>
        En {t.nombre} cuidamos tus datos personales. Aquí te contamos qué datos guardamos, para qué y cómo puedes
        ejercer tus derechos, de acuerdo con la ley chilena de protección de datos personales.
      </p>

      <h2 className={h2}>Quién es responsable</h2>
      <p>
        {t.nombre}, tienda de accesorios para iPhone con despachos desde {t.comunaOrigen}, Chile. Puedes escribirnos por
        WhatsApp{t.instagram ? ` o por Instagram (@${t.instagram})` : ""} para cualquier consulta sobre tus datos.
      </p>

      <h2 className={h2}>Qué datos guardamos</h2>
      <ul className="list-disc space-y-1 pl-6">
        <li>Tu nombre y correo electrónico, al crear tu cuenta (con Google o con un link a tu correo).</li>
        <li>Tu teléfono, solo si nos lo das al comprar.</li>
        <li>Tus compras: fecha, productos, montos y medio de pago.</li>
      </ul>
      <p>No guardamos contraseñas ni datos de tarjetas. No pedimos datos sensibles.</p>

      <h2 className={h2}>Para qué los usamos</h2>
      <ul className="list-disc space-y-1 pl-6">
        <li>Mostrarte tu historial de compras en “Mi cuenta”.</li>
        <li>Registrar y gestionar las ventas de la tienda, y atenderte si tienes un problema con un pedido.</li>
        <li>Estadísticas internas de ventas para mejorar la tienda.</li>
      </ul>
      <p>No vendemos ni compartimos tus datos con terceros para publicidad.</p>

      <h2 className={h2}>Servicios que usamos</h2>
      <p>
        Para que la tienda funcione, tus datos se procesan en proveedores de tecnología que actúan por encargo nuestro:
        Cloudflare (alojamiento del sitio), Neon (base de datos), Google (inicio de sesión con Google) y Resend (envío del
        correo para entrar). Algunos de ellos pueden almacenar datos fuera de Chile.
      </p>

      <h2 className={h2}>Cookies</h2>
      <p>
        Usamos solo las cookies necesarias para mantener tu sesión iniciada. No usamos cookies de publicidad ni de
        seguimiento.
      </p>

      <h2 className={h2}>Cuánto tiempo los guardamos</h2>
      <p>
        Mientras tengas tu cuenta. Los registros de ventas pueden conservarse por el tiempo que exijan las obligaciones
        tributarias y contables de la tienda.
      </p>

      <h2 className={h2}>Tus derechos</h2>
      <p>
        Puedes pedirnos en cualquier momento acceder a tus datos, corregirlos, eliminarlos u oponerte a su uso. Escríbenos
        y te responderemos a la brevedad.
      </p>
      {t.whatsapp && (
        <a
          href={whatsappUrl(t.whatsapp, `Hola ${t.nombre}, tengo una consulta sobre mis datos personales`)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex min-h-12 items-center rounded-xl bg-whatsapp px-5 text-base font-bold text-white"
        >
          Escribir por WhatsApp
        </a>
      )}
    </article>
  );
}
