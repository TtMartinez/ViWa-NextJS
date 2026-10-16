import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSesion, origenValido } from "@/lib/admin-auth";
import { enviarEbook } from "@/lib/ebook";
import { ESTADOS, ETIQUETA } from "@/lib/formato";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Acciones sobre un pedido: cambiar estado, guardar nota interna, reenviar ebook.
// Después de cada acción volvemos al detalle con un código (?ok=... o ?error=...).
export async function POST(request, { params }) {
  if (!origenValido(request)) return new NextResponse("Origen no permitido", { status: 403 });

  const sesion = await getSesion();
  if (!sesion) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  if (!UUID.test(id)) return new NextResponse("Pedido inválido", { status: 404 });

  const volver = (clave, codigo) => {
    const url = new URL(`/admin/pedidos/${id}`, request.url);
    url.searchParams.set(clave, codigo);
    return NextResponse.redirect(url, 303);
  };

  const form = await request.formData();
  const accion = String(form.get("accion") ?? "");

  const supabase = getSupabaseAdmin();
  const { data: pedido, error } = await supabase
    .from("pedidos")
    .select("id, estado, cliente_nombre, cliente_email, pedido_items(es_digital)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[admin-pedido] Error leyendo el pedido:", error);
    return volver("error", "db");
  }
  if (!pedido) return new NextResponse("Pedido no encontrado", { status: 404 });

  const registrar = async (evento) => {
    const { error: errEv } = await supabase
      .from("pedido_eventos")
      .insert({ pedido_id: id, evento, usuario: sesion.email });
    if (errEv) console.error("[admin-pedido] No se pudo registrar el evento:", errEv);
  };

  if (accion === "estado") {
    const nuevo = String(form.get("estado") ?? "");
    if (!ESTADOS.includes(nuevo)) return volver("error", "estado_invalido");
    if (nuevo === pedido.estado) return volver("error", "estado_igual");

    const { error: errUpd } = await supabase
      .from("pedidos")
      .update({ estado: nuevo, actualizado_en: new Date().toISOString() })
      .eq("id", id);
    if (errUpd) {
      console.error("[admin-pedido] Error cambiando el estado:", errUpd);
      return volver("error", "db");
    }
    await registrar(`Estado: ${ETIQUETA[pedido.estado]} → ${ETIQUETA[nuevo]}`);
    return volver("ok", "estado");
  }

  if (accion === "nota") {
    const nota = String(form.get("nota") ?? "").trim().slice(0, 1000);
    const { error: errNota } = await supabase
      .from("pedidos")
      .update({ nota: nota || null })
      .eq("id", id);
    if (errNota) {
      console.error("[admin-pedido] Error guardando la nota:", errNota);
      return volver("error", "db");
    }
    return volver("ok", "nota");
  }

  if (accion === "reenviar_ebook") {
    const tieneEbook = (pedido.pedido_items || []).some((i) => i.es_digital);
    if (!tieneEbook || !["pagado", "entregado"].includes(pedido.estado)) {
      return volver("error", "ebook_no_aplica");
    }
    const r = await enviarEbook({ email: pedido.cliente_email, nombre: pedido.cliente_nombre });
    if (!r.ok) {
      console.error("[admin-pedido] No se pudo reenviar el ebook:", id, r.error);
      return volver("error", "ebook_fallo");
    }
    await supabase.from("pedidos").update({ ebook_enviado_en: new Date().toISOString() }).eq("id", id);
    await registrar(`Ebook reenviado a ${pedido.cliente_email}`);
    return volver("ok", "ebook");
  }

  return volver("error", "accion_invalida");
}
