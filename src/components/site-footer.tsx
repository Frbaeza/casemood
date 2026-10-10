import Link from "next/link";
import { CotizadorEnvio } from "@/components/cotizador-envio";
import { IconChevronRight, IconInstagram, IconPhone, IconSearch, IconWhatsApp } from "@/components/icons";
import { whatsappUrl } from "@/lib/format";
import type { RegionCotizable } from "@/lib/envios";
import type { Tienda } from "@/lib/tienda";

export function SiteFooter({
  tienda,
  regionesEnvio = [],
}: {
  tienda: Tienda;
  /** Tarifas para el cotizador de envío (admin → Envíos); vacío = no se muestra. */
  regionesEnvio?: RegionCotizable[];
}) {
  const { nombre: storeName, whatsapp, instagram } = tienda;
  const anio = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-orange text-white">
      {/* Borde ondulado suave arriba */}
      <svg viewBox="0 0 480 24" preserveAspectRatio="none" className="block h-6 w-full text-white" aria-hidden>
        <path d="M0 0h480v8c-40 10-80 16-120 16S280 18 240 12 160 0 120 0 40 6 0 12z" fill="currentColor" />
      </svg>

      <div className="mx-auto max-w-[480px] px-4 pt-4 pb-8">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={tienda.logo}
            alt={`Logo de ${storeName}`}
            width={80}
            height={80}
            loading="lazy"
            className="h-20 w-20 shrink-0 rounded-3xl border-4 border-white/80 bg-cream object-cover"
          />
          <div>
            <p className="font-display text-3xl leading-none font-bold">{storeName}</p>
            <p className="mt-1.5 text-base text-white/90">{tienda.frase} para iPhone</p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl bg-white p-5 text-ink shadow-lg">
          <p className="font-display text-2xl leading-tight font-semibold">¿Tienes dudas?</p>
          <p className="mt-1 text-base text-ink-soft">
            Escríbenos y te ayudamos a encontrar la carcasa para tu iPhone.
          </p>
          <a
            href={whatsappUrl(whatsapp, `Hola ${storeName}, tengo una consulta`)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-whatsapp px-4 text-lg font-bold text-white active:brightness-95"
          >
            <IconWhatsApp className="h-6 w-6" />
            Escríbenos por WhatsApp
          </a>
          {instagram && (
            <a
              href={`https://www.instagram.com/${instagram}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-[#c13584] via-[#e1306c] to-[#f56040] px-4 text-lg font-bold text-white active:brightness-95"
            >
              <IconInstagram className="h-6 w-6" />
              Síguenos en Instagram
            </a>
          )}
          {instagram && <p className="mt-2 text-center text-base font-semibold text-ink-soft">@{instagram}</p>}
        </div>

        <CotizadorEnvio regiones={regionesEnvio} comunaOrigen={tienda.comunaOrigen} />

        <nav aria-label="Enlaces del sitio" className="mt-6">
          <ul className="divide-y divide-white/25 overflow-hidden rounded-2xl bg-white/10">
            <li>
              <Link href="/" className="flex min-h-14 items-center gap-3 px-4 text-lg font-semibold">
                <IconPhone className="h-6 w-6" />
                <span className="flex-1">Ver categorías</span>
                <IconChevronRight className="h-5 w-5" />
              </Link>
            </li>
            <li>
              <Link href="/buscar" className="flex min-h-14 items-center gap-3 px-4 text-lg font-semibold">
                <IconSearch className="h-6 w-6" />
                <span className="flex-1">Buscar productos</span>
                <IconChevronRight className="h-5 w-5" />
              </Link>
            </li>
          </ul>
        </nav>

        <p className="mt-8 text-center text-sm text-white/85">
          © {anio} {storeName} · Hecho en Chile
        </p>
        {/* Acceso discreto al panel (pide iniciar sesión con Google). */}
        <p className="mt-2 text-center">
          <Link
            href="/admin"
            rel="nofollow"
            className="inline-flex min-h-12 items-center px-3 text-sm text-white/70 underline underline-offset-4"
          >
            Panel de administración (solo personal de la tienda)
          </Link>
        </p>
      </div>
    </footer>
  );
}
