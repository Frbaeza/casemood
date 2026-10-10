import { NextResponse, type NextRequest } from "next/server";

/**
 * Protege el admin con un chequeo "optimista": si no hay cookie de sesión, redirige a
 * /admin/entrar sin renderizar nada. La verificación real (firma del token + correo en
 * ADMIN_EMAILS) la hacen el layout del panel (requireAdmin) y cada Server Action/API (assertAdmin).
 *
 * Se usa `middleware.ts` (runtime edge) y no `proxy.ts` de Next 16 a propósito: proxy corre
 * en Node y OpenNext lo empaqueta aparte (experimental), lo que sube el Worker a ~4 MiB,
 * por encima del límite de 3 MiB del plan gratuito. Por lo mismo no se importa Auth.js aquí.
 */
const COOKIES_SESION = ["authjs.session-token", "__Secure-authjs.session-token"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/entrar") return NextResponse.next();

  const conSesion = COOKIES_SESION.some((nombre) => req.cookies.has(nombre));
  if (conSesion) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const url = new URL("/admin/entrar", req.nextUrl);
  url.searchParams.set("volver", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
