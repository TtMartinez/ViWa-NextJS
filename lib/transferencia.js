// Datos de la cuenta que recibe las transferencias + mails del pedido por transferencia.
// Los datos de la cuenta se cargan como variables de entorno (en .env.local y en Vercel):
//   TRANSFERENCIA_ALIAS    (obligatoria)  ej: viwa.atelier
//   TRANSFERENCIA_CVU      (opcional)     22 dígitos
//   TRANSFERENCIA_TITULAR  (obligatoria)  nombre de la persona titular de la cuenta
//   TRANSFERENCIA_BANCO    (opcional)     por defecto "Mercado Pago"

export function datosTransferencia() {
  const alias = (process.env.TRANSFERENCIA_ALIAS || "").trim();
  const titular = (process.env.TRANSFERENCIA_TITULAR || "").trim();
  if (!alias || !titular) return null;
  return {
    alias,
    cvu: (process.env.TRANSFERENCIA_CVU || "").trim(),
    titular,
    banco: (process.env.TRANSFERENCIA_BANCO || "Mercado Pago").trim(),
  };
}

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const pesos = (n) => "$" + Number(n || 0).toLocaleString("es-AR");
const numeroPedido = (n) => "#" + String(n ?? 0).padStart(4, "0");

// Envío por Resend. Nunca lanza error: si falla, devuelve { ok: false } y se registra en el log.
async function enviar({ para, asunto, html }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const destinos = (Array.isArray(para) ? para : String(para || "").split(","))
    .map((s) => s.trim())
    .filter(Boolean);
  if (!key || !from || destinos.length === 0) {
    console.error("[transferencia] Mail no enviado: falta RESEND_API_KEY, EMAIL_FROM o destinatario");
    return { ok: false };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ from, to: destinos, subject: asunto, html }),
    });
    if (!res.ok) {
      console.error("[transferencia] Resend rechazó el mail:", res.status, await res.text().catch(() => ""));
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error("[transferencia] Error enviando mail:", err);
    return { ok: false };
  }
}

function tablaItems(lineas) {
  const filas = lineas
    .map(
      (l) =>
        `<tr><td style="padding:4px 12px 4px 0">${esc(l.cantidad)} × ${esc(l.titulo)}</td>` +
        `<td style="padding:4px 0;text-align:right">${pesos(l.precio * l.cantidad)}</td></tr>`
    )
    .join("");
  return `<table style="border-collapse:collapse;font-size:15px">${filas}</table>`;
}

// Mail para la dueña: entró un pedido por transferencia y hay que esperar el dinero.
export async function avisarTransferenciaNueva({ pedidoId, numero, nombre, email, total, lineas }) {
  const origen = process.env.SITE_URL || "";
  const enlace = origen ? `${origen}/admin/pedidos/${pedidoId}` : "";
  const html =
    `<div style="font-family:Arial,sans-serif;color:#1d1d1b;max-width:520px">` +
    `<h2 style="color:#1e3a5f">Nuevo pedido por transferencia ${numeroPedido(numero)}</h2>` +
    `<p><strong>${esc(nombre)}</strong> (${esc(email)}) dice que va a transferir <strong>${pesos(total)}</strong>.</p>` +
    tablaItems(lineas) +
    `<p style="margin-top:16px">Todavía <strong>no está pagado</strong>. Cuando veas el dinero en tu Mercado Pago, ` +
    `confirmá el pago desde el panel.</p>` +
    (enlace ? `<p><a href="${esc(enlace)}">Abrir el pedido en el panel</a></p>` : "") +
    `</div>`;
  return enviar({
    para: process.env.AVISO_EMAIL,
    asunto: `Nuevo pedido por transferencia ${numeroPedido(numero)} · ${pesos(total)}`,
    html,
  });
}

// Mail para el cliente con los datos para transferir (solo llega si Resend tiene el dominio verificado).
export async function enviarDatosAlCliente({ email, nombre, numero, total, datos, lineas }) {
  const html =
    `<div style="font-family:Arial,sans-serif;color:#1d1d1b;max-width:520px">` +
    `<h2 style="color:#1e3a5f">Tu pedido ${numeroPedido(numero)} en ViWa</h2>` +
    `<p>Hola ${esc(nombre)}, ¡gracias por tu compra! Para completarla transferí <strong>${pesos(total)}</strong> ` +
    `desde cualquier banco o billetera virtual:</p>` +
    `<p style="background:#f5f1e6;padding:12px 16px;border-radius:8px;line-height:1.7">` +
    `Alias: <strong>${esc(datos.alias)}</strong><br>` +
    (datos.cvu ? `CVU: <strong>${esc(datos.cvu)}</strong><br>` : "") +
    `Titular: <strong>${esc(datos.titular)}</strong><br>` +
    `Banco: <strong>${esc(datos.banco)}</strong></p>` +
    tablaItems(lineas) +
    `<p style="margin-top:16px">Después mandanos el comprobante por WhatsApp. ` +
    `Tenés 24 horas para transferir: pasado ese tiempo el pedido se cancela.</p>` +
    `</div>`;
  return enviar({ para: email, asunto: `Tu pedido ${numeroPedido(numero)} en ViWa: datos para transferir`, html });
}
