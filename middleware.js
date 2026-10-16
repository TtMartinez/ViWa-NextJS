import { NextResponse } from "next/server";
import { COOKIE_SESION, verificarToken } from "@/lib/sesion";

/**
 * Protege el panel (/admin) y su API (/api/admin).
 * Si no hay una sesión válida (cookie firmada), manda al login.
 * Las únicas rutas públicas son la pantalla de login y el envío del formulario.
 */
const PUBLICAS = ["/admin/login", "/api/admin/login"];

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  if (PUBLICAS.includes(pathname)) return NextResponse.next();

  const secreto = process.env.ADMIN_SESSION_SECRET;
  if (!secreto || secreto.length < 32) {
    return new NextResponse("Falta configurar ADMIN_SESSION_SECRET", { status: 500 });
  }

  const sesion = await verificarToken(request.cookies.get(COOKIE_SESION)?.value);
  if (sesion) {
    const res = NextResponse.next();
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
