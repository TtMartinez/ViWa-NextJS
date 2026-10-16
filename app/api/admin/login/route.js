import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { hashPassword, verificarPassword } from "@/lib/password";
import { COOKIE_SESION, DURACION_HORAS, crearToken } from "@/lib/sesion";
import { origenValido } from "@/lib/admin-auth";

export const runtime = "nodejs";

const MAX_INTENTOS = 5;
const BLOQUEO_MINUTOS = 15;

function volver(request, codigo) {
  const url = new URL("/admin/login", request.url);
  url.searchParams.set("error", codigo);
  return NextResponse.redirect(url, 303);
}

export async function POST(request) {
  if (!origenValido(request)) return new NextResponse("Origen no permitido", { status: 403 });

  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const clave = String(form.get("password") ?? "");
  if (!email || !clave || email.length > 120 || clave.length > 200) return volver(request, "1");

  const supabase = getSupabaseAdmin();
  const { data: u, error } = await supabase
    .from("admin_usuarios")
    .select("id, email, nombre, rol, password_hash, activo, intentos_fallidos, bloqueado_hasta")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    console.error("[admin-login] Error consultando usuarios:", error);
    return volver(request, "2");
  }

  // Si el usuario no existe igual gastamos el mismo tiempo, para no revelar qué mails existen.
  if (!u || !u.activo) {
    await hashPassword(clave);
    return volver(request, "1");
  }

  if (u.bloqueado_hasta && new Date(u.bloqueado_hasta) > new Date()) return volver(request, "3");

  const ok = await verificarPassword(clave, u.password_hash);
  if (!ok) {
    const intentos = (u.intentos_fallidos || 0) + 1;
    const cambios = { intentos_fallidos: intentos };
    if (intentos >= MAX_INTENTOS) {
      cambios.intentos_fallidos = 0;
      cambios.bloqueado_hasta = new Date(Date.now() + BLOQUEO_MINUTOS * 60000).toISOString();
    }
    await supabase.from("admin_usuarios").update(cambios).eq("id", u.id);
    return volver(request, "1");
  }

  await supabase
    .from("admin_usuarios")
    .update({ intentos_fallidos: 0, bloqueado_hasta: null, ultimo_acceso: new Date().toISOString() })
    .eq("id", u.id);

  let token;
  try {
    token = await crearToken({ email: u.email, nombre: u.nombre, rol: u.rol });
  } catch (err) {
    console.error("[admin-login] No se pudo crear la sesión:", err);
    return volver(request, "2");
  }

  const res = NextResponse.redirect(new URL("/admin", request.url), 303);
  res.cookies.set(COOKIE_SESION, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_HORAS * 3600,
  });
  return res;
}
