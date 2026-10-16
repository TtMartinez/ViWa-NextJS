import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_SESION, verificarToken } from "@/lib/sesion";

// Sesión actual del panel (o null si no hay).
export async function getSesion() {
  const jar = await cookies();
  return verificarToken(jar.get(COOKIE_SESION)?.value);
}

// Para páginas: si no hay sesión va al login; si exige admin y es operador, vuelve al inicio.
export async function exigirSesion({ soloAdmin = false } = {}) {
  const sesion = await getSesion();
  if (!sesion) redirect("/admin/login");
  if (soloAdmin && sesion.rol !== "admin") redirect("/admin");
  return sesion;
}

// Para formularios POST: solo aceptamos pedidos que vengan de nuestro propio sitio.
export function origenValido(request) {
  const origen = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origen || !host) return false;
  try {
    return new URL(origen).host === host;
  } catch {
    return false;
  }
}
