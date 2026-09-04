import { NextResponse } from "next/server";

/**
 * Protege todo lo que empiece con /admin pidiendo usuario y contraseña
 * (autenticación HTTP Basic — el navegador muestra el cartel nativo,
 * no hace falta armar una pantalla de login aparte).
 *
 * El usuario/contraseña se definen en variables de entorno:
 * ADMIN_USER y ADMIN_PASSWORD (en .env.local y en Vercel).
 */
export function middleware(request) {
  const authHeader = request.headers.get("authorization");

  if (authHeader) {
    const base64Credentials = authHeader.split(" ")[1];
    const [user, pass] = atob(base64Credentials).split(":");

    if (user === process.env.ADMIN_USER && pass === process.env.ADMIN_PASSWORD) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Autenticación requerida", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Panel de administración ViWa"' },
  });
}

export const config = {
  matcher: "/admin/:path*",
};
