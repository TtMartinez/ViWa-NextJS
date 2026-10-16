import { NextResponse } from "next/server";
import { COOKIE_SESION } from "@/lib/sesion";
import { origenValido } from "@/lib/admin-auth";

export async function POST(request) {
  if (!origenValido(request)) return new NextResponse("Origen no permitido", { status: 403 });
  const res = NextResponse.redirect(new URL("/admin/login", request.url), 303);
  res.cookies.set(COOKIE_SESION, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
