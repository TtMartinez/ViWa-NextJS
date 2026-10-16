import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import { enviarEbook } from "@/lib/ebook";
import { avisarPedidoNuevo } from "@/lib/avisos";

export const runtime = "nodejs";

// Verifica que el aviso venga realmente de Mercado Pago (si hay MP_WEBHOOK_SECRET).
function firmaValida(request, dataIdQuery) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret || !dataIdQuery) return true; // igual confirmamos el pago contra la API de MP
  const firma = request.headers.get("x-signature") || "";
  const requestId = request.headers.get("x-request-id") || "";
  const partes = Object.fromEntries(
    firma.split(",").map((p) => p.trim().split("=").map((s) => s.trim()))
  );
  if (!partes.ts || !partes.v1) return false;

  const id = /^[a-z0-9]+$/i.test(dataIdQuery) ? dataIdQuery.toLowerCase() : dataIdQuery;
  const manifiesto = `id:${id};request-id:${requestId};ts:${partes.ts};`;
  const esperado = crypto.createHmac("sha256", secret).update(manifiesto).digest("hex");

  const a = Buffer.from(esperado);
  const b = Buffer.from(partes.v1);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(request) {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) return new Response("config", { status: 500 });

  const url = new URL(request.url);
  let body = null;
  try {
    body = await request.json();
  } catch {}

  const tipo = body?.type || url.searchParams.get("type") || url.searchParams.get("topic");
  const dataIdQuery = url.searchParams.get("data.id") || url.searchParams.get("id");
  const pagoId = String(body?.data?.id || dataIdQuery || "");

  // Solo nos interesan los avisos de pagos; al resto respondemos OK para que no reintente.
  if (tipo !== "payment" || !pagoId) return new Response("ok", { status: 200 });

  if (!firmaValida(request, dataIdQuery)) {
    console.error("[webhook-mp] Firma inválida");
    return new Response("firma", { status: 401 });
  }

  // 1. Preguntamos a Mercado Pago el estado real del pago (no confiamos en el aviso).
  let pago;
  try {
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(pagoId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      console.error("[webhook-mp] MP respondió", res.status, "para el pago", pagoId);
      return new Response("mp", { status: 500 }); // MP reintenta más tarde
    }
    pago = await res.json();
  } catch (err) {
    console.error("[webhook-mp] Error consultando MP:", err);
    return new Response("mp", { status: 500 });
  }

  if (pago.status !== "approved") return new Response("ok", { status: 200 });

  const pedidoId = pago.external_reference;
  if (!pedidoId) return new Response("ok", { status: 200 });

  const supabase = getSupabaseAdmin();

  // 2. Buscamos el pedido (con sus productos) y comprobamos que el monto coincida.
  const { data: pedido, error: errPedido } = await supabase
    .from("pedidos")
    .select(
      "id, estado, total, cliente_nombre, cliente_email, pedido_items(producto_nombre, cantidad, precio, es_digital)"
    )
    .eq("id", pedidoId)
    .maybeSingle();

  if (errPedido) {
    console.error("[webhook-mp] Error leyendo el pedido:", errPedido);
    return new Response("db", { status: 500 });
  }
  if (!pedido) {
    console.error("[webhook-mp] Pedido inexistente:", pedidoId);
    return new Response("ok", { status: 200 });
  }
  if (Math.abs(Number(pago.transaction_amount) - Number(pedido.total)) > 0.01) {
    console.error("[webhook-mp] Monto no coincide", pago.transaction_amount, pedido.total, pedidoId);
    return new Response("ok", { status: 200 });
  }

  // 3. Marcamos como pagado SOLO si estaba pendiente o vencido.
  //    Si MP avisa dos veces, la segunda no encuentra filas y no se reenvía nada.
  const { data: actualizados, error: errUpd } = await supabase
    .from("pedidos")
    .update({
      estado: "pagado",
      mp_payment_id: String(pago.id),
      actualizado_en: new Date().toISOString(),
    })
    .eq("id", pedido.id)
    .in("estado", ["pendiente", "cancelado"])
    .select("id");

  if (errUpd) {
    console.error("[webhook-mp] Error actualizando el pedido:", errUpd);
    return new Response("db", { status: 500 });
  }
  if (!actualizados || actualizados.length === 0) return new Response("ok", { status: 200 });

  // 4. Aviso a la dueña: entró un pedido pagado.
  const aviso = await avisarPedidoNuevo(pedido);
  if (!aviso.ok) console.error("[webhook-mp] No se pudo enviar el aviso:", pedido.id, aviso.error);

  // 5. Solo el ebook va por mail al cliente: si hay algún ítem digital, lo enviamos.
  const tieneEbook = (pedido.pedido_items || []).some((i) => i.es_digital);
  if (tieneEbook) {
    const r = await enviarEbook({ email: pedido.cliente_email, nombre: pedido.cliente_nombre });
    if (r.ok) {
      await supabase
        .from("pedidos")
        .update({ ebook_enviado_en: new Date().toISOString() })
        .eq("id", pedido.id);
    } else {
      // El pedido ya quedó pagado; el ebook se puede reenviar a mano desde el panel.
      console.error("[webhook-mp] No se pudo enviar el ebook:", pedido.id, r.error);
    }
  }

  return new Response("ok", { status: 200 });
}