import { getSupabaseAdmin } from "@/lib/supabase";
import { fetchProductosPorIds } from "@/lib/sanity";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function fallo(mensaje, status = 400) {
  return Response.json({ error: mensaje }, { status });
}

export async function POST(request) {
  // ---------- 0. Configuración ----------
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    console.error("[crear-preferencia] Falta la variable MP_ACCESS_TOKEN");
    return fallo("El pago online no está disponible por el momento.", 500);
  }

  // ---------- 1. Validar lo que manda el navegador ----------
  let body;
  try {
    body = await request.json();
  } catch {
    return fallo("Solicitud inválida.");
  }

  const nombre = String(body?.cliente?.nombre ?? "").trim();
  const email = String(body?.cliente?.email ?? "").trim().toLowerCase();

  if (nombre.length < 2 || nombre.length > 80) return fallo("Ingresá tu nombre y apellido.");
  if (email.length > 120 || !EMAIL_RE.test(email)) return fallo("Ingresá un email válido.");

  const items = body?.items;
  if (!Array.isArray(items) || items.length === 0 || items.length > 30) {
    return fallo("El carrito está vacío.");
  }

  const pedidoItems = [];
  for (const it of items) {
    const productoId = typeof it?.productoId === "string" ? it.productoId : "";
    const sabor = typeof it?.sabor === "string" && it.sabor ? it.sabor : null;
    const cantidad = Number(it?.cantidad);

    if (
      !productoId ||
      productoId.length > 100 ||
      !Number.isInteger(cantidad) ||
      cantidad < 1 ||
      cantidad > 50
    ) {
      return fallo("Hay productos inválidos en el carrito.");
    }
    pedidoItems.push({ productoId, sabor, cantidad });
  }

  // ---------- 2. Precios reales desde Sanity (nunca los del navegador) ----------
  let productos;
  try {
    productos = await fetchProductosPorIds([...new Set(pedidoItems.map((i) => i.productoId))]);
  } catch (err) {
    console.error("[crear-preferencia] Error consultando Sanity:", err);
    return fallo("No pudimos verificar los precios. Intentá de nuevo en unos minutos.", 502);
  }
  const porId = new Map(productos.map((p) => [p._id, p]));

  const lineas = [];
  for (const it of pedidoItems) {
    const prod = porId.get(it.productoId);
    if (!prod || typeof prod.precio !== "number" || prod.precio <= 0) {
      return fallo("Uno de los productos ya no está disponible. Revisá tu carrito.", 409);
    }

    const variantes = (prod.sabores || []).map((s) => s.nombre);
    if (variantes.length > 0 && !variantes.includes(it.sabor)) {
      return fallo(`Elegí una variante válida para "${prod.nombre}".`, 409);
    }

    lineas.push({
      productoId: prod._id,
      titulo: variantes.length > 0 ? `${prod.nombre} - ${it.sabor}` : prod.nombre,
      cantidad: it.cantidad,
      precio: prod.precio,
      digital: prod.tipoProducto === "digital",
    });
  }

  const total = lineas.reduce((acc, l) => acc + l.precio * l.cantidad, 0);
  const tipoProducto = lineas.every((l) => l.digital) ? "digital" : "fisico";

  // ---------- 3. Guardar el pedido como "pendiente" en Supabase ----------
  const supabase = getSupabaseAdmin();

  const { data: pedido, error: errPedido } = await supabase
    .from("pedidos")
    .insert({
      cliente_nombre: nombre,
      cliente_email: email,
      total,
      tipo_producto: tipoProducto,
      estado: "pendiente",
    })
    .select("id")
    .single();

  if (errPedido || !pedido) {
    console.error("[crear-preferencia] Error guardando el pedido:", errPedido);
    return fallo("No pudimos registrar tu pedido. Intentá de nuevo.", 500);
  }

  // Si algo falla de acá en adelante, borramos el pedido para no dejar
  // pedidos "fantasma" en el panel (los items se borran en cascada).
  async function deshacerPedido() {
    const { error } = await supabase.from("pedidos").delete().eq("id", pedido.id);
    if (error) console.error("[crear-preferencia] No se pudo deshacer el pedido:", error);
  }

  const { error: errItems } = await supabase.from("pedido_items").insert(
    lineas.map((l) => ({
      pedido_id: pedido.id,
      producto_nombre: l.titulo,
      cantidad: l.cantidad,
      precio: l.precio,
      es_digital: l.digital,
    }))
  );

  if (errItems) {
    console.error("[crear-preferencia] Error guardando los items:", errItems);
    await deshacerPedido();
    return fallo("No pudimos registrar tu pedido. Intentá de nuevo.", 500);
  }

  // ---------- 4. Pedirle a Mercado Pago el link de pago ----------
  const origen = process.env.SITE_URL || new URL(request.url).origin;

  const preferencia = {
    items: lineas.map((l) => ({
      id: l.productoId,
      title: l.titulo,
      quantity: l.cantidad,
      unit_price: l.precio,
      currency_id: "ARS",
    })),
    payer: { name: nombre, email },
    // Con esto, cuando llegue el webhook, sabemos a qué pedido corresponde el pago
    external_reference: pedido.id,
    back_urls: {
      success: `${origen}/compra/exito`,
      pending: `${origen}/compra/pendiente`,
      failure: `${origen}/compra/fallida`,
    },
    // El link de pago vence a las 24 hs (misma regla que pidió la clienta)
    expires: true,
    expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    statement_descriptor: "VIWA",
  };

  // auto_return solo lo acepta Mercado Pago con una URL pública.
  const esLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origen);
  if (!esLocal) preferencia.auto_return = "approved";

  // Para producción: solo transferencia (sin tarjetas ni pagos en efectivo).
  // Se activa con MP_SOLO_TRANSFERENCIA=true. Con credenciales de prueba
  // conviene dejarlo apagado, porque las transferencias no se pueden simular.
  if (process.env.MP_SOLO_TRANSFERENCIA === "true") {
    preferencia.payment_methods = {
      excluded_payment_types: [
        { id: "credit_card" },
        { id: "debit_card" },
        { id: "prepaid_card" },
        { id: "ticket" },
        { id: "atm" },
      ],
    };
  }

  let mp;
  try {
    const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(preferencia),
    });
    mp = await res.json().catch(() => null);

    if (!res.ok || !mp?.init_point) {
      console.error("[crear-preferencia] Mercado Pago rechazó la preferencia:", res.status, JSON.stringify(mp));
      await deshacerPedido();
      return fallo("No pudimos iniciar el pago con Mercado Pago. Intentá de nuevo en unos minutos.", 502);
    }
  } catch (err) {
    console.error("[crear-preferencia] Error llamando a Mercado Pago:", err);
    await deshacerPedido();
    return fallo("No pudimos iniciar el pago con Mercado Pago. Intentá de nuevo en unos minutos.", 502);
  }

  // Guardamos el ID de la preferencia (si falla no es grave: el pedido ya
  // quedó vinculado por external_reference)
  const { error: errPref } = await supabase
    .from("pedidos")
    .update({ mp_preference_id: mp.id })
    .eq("id", pedido.id);
  if (errPref) console.error("[crear-preferencia] No se pudo guardar mp_preference_id:", errPref);

  return Response.json({ init_point: mp.init_point });
}