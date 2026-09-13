import { createClient } from "@supabase/supabase-js";

/**
 * Este cliente usa la Secret Key (SUPABASE_SECRET_KEY), que ignora las
 * reglas de RLS. SOLO se debe usar desde archivos que corren en el
 * servidor (app/api/.../route.js, páginas Server Component) — nunca
 * desde un componente "use client".
 *
 * Las variables vienen de .env.local (en tu máquina) y de las
 * "Environment Variables" del proyecto en Vercel (en producción).
 * Ninguna de las dos lleva el prefijo NEXT_PUBLIC_, justamente para que
 * Next.js nunca la incluya en el código que baja al navegador.
 *
 * Es una función (no un cliente ya armado) a propósito: si Supabase
 * intentara crear la conexión apenas se importa este archivo, un build
 * en un entorno sin las variables configuradas todavía (como el primer
 * deploy en Vercel) rompería la compilación entera. Así, solo se crea
 * cuando alguien realmente la usa.
 */
export function getSupabaseAdmin() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
}
