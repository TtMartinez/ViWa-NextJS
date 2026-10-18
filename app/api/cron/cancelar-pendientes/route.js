import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HORAS_VENCIMIENTO = 24;

function autorizado(request) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || secreto.length < 16) return false;
  const recibido = request.headers.get("authorization") || "";
  const esperado = `Bearer ${secreto}`;
  const a = Buffer.from(recibido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Vercel Cron llama a esta ruta una vez por día (ver vercel.json) y manda
// automáticamente "Authorization: Bearer <CRON_SECRET>".
// Cancela los pedidos que siguen "pendiente" pasadas 24 hs desde que se crearon.
export async function GET(request) {
  if (!autorizado(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const limite = new Date(Date.now() - HORAS_VENCIMIENTO * 3600 * 1000).toISOString();
  const supabase = getSupabaseAdmin();

  // El filtro estado = 'pendiente' va dentro del propio UPDATE: si el webhook de
  // Mercado Pago marcó el pedido como pagado un instante antes, no se toca.
  const { data, error } = await supabase
    .from("pedidos")
    .update({ estado: "cancelado", actualizado_en: new Date().toISOString() })
    .eq("estado", "pendiente")
    .lt("creado_en", limite)
    .select("id");

  if (error) {
    console.error("[cron-cancelar] Error cancelando pedidos vencidos:", error);
    return NextResponse.json({ error: "db" }, { status: 500 });
  }

  const cancelados = data || [];
  if (cancelados.length > 0) {
    const { error: errEv } = await supabase.from("pedido_eventos").insert(
      cancelados.map((p) => ({
        pedido_id: p.id,
        evento: `Cancelado automáticamente: pasaron ${HORAS_VENCIMIENTO} hs sin pago`,
        usuario: "sistema",
      }))
    );
    if (errEv) console.error("[cron-cancelar] No se pudo registrar el historial:", errEv);
  }

  console.log(`[cron-cancelar] Pedidos cancelados: ${cancelados.length}`);
  return NextResponse.json({ ok: true, cancelados: cancelados.length });
}
