import { getSupabaseAdmin } from "@/lib/supabase";
import { fetchProductosPorIds } from "@/lib/sanity";
import { datosTransferencia, avisarTransferenciaNueva, enviarDatosAlCliente } from "@/lib/transferencia";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function fallo(mensaje, status = 400) {
  return Response.json({ error: mensaje }, { status });
}

// Crea un pedido "pendiente" que se paga por transferencia a la cuenta de la tienda.
// Misma validación y mismos precios (siempre desde Sanity) que el pago con Mercado Pago.
export async function POST(request) {
  const datos = datosTransferencia();
  if (!datos) {
    console.error("[crear-pedido-transferencia] Faltan TRANSFERENCIA_ALIAS o TRANSFERENCIA_TITULAR");
    return fallo("El pago por transferencia no está disponible por el momento.", 503);
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

  // ---------- 2. Precios reales desde Sanity ----------
  let productos;
  try {
    productos = await fetchProductosPorIds([...new Set(pedidoItems.map((i) => i.productoId))]);
  } catch (err) {
    console.error("[crear-pedido-transferencia] Error consultando Sanity:", err);
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

  // ---------- 3. Guardar el pedido como "pendiente" ----------
  const supabase = getSupabaseAdmin();

  const { data: pedido, error: errPedido } = await supabase
    .from("pedidos")
    .insert({
      cliente_nombre: nombre,
      cliente_email: email,
      total,
      tipo_producto: tipoProducto,
      estado: "pendiente",
      metodo_pago: "transferencia",
    })
    .select("id, numero")
    .single();

  if (errPedido || !pedido) {
    console.error("[crear-pedido-transferencia] Error guardando el pedido:", errPedido);
    return fallo("No pudimos registrar tu pedido. Intentá de nuevo.", 500);
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
    console.error("[crear-pedido-transferencia] Error guardando los items:", errItems);
    // Sin items el pedido no sirve: lo borramos para no dejar pedidos fantasma.
    await supabase.from("pedidos").delete().eq("id", pedido.id);
    return fallo("No pudimos registrar tu pedido. Intentá de nuevo.", 500);
  }

  await supabase
    .from("pedido_eventos")
    .insert({ pedido_id: pedido.id, evento: "Pedido por transferencia: esperando el pago", usuario: "cliente" });

  // ---------- 4. Mails (no bloquean la respuesta si fallan) ----------
  const info = { pedidoId: pedido.id, numero: pedido.numero, nombre, email, total, lineas };
  await Promise.allSettled([
    avisarTransferenciaNueva(info),
    enviarDatosAlCliente({ ...info, datos }),
  ]);

  return Response.json({ numero: pedido.numero, total, datos });
}
