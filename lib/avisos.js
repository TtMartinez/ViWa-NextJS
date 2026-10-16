function escapar(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const pesos = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(Number(n) || 0);

// Avisa por mail a la dueña que entró un pedido pagado.
// Devuelve { ok: true } o { ok: false, error }. Nunca lanza.
export async function avisarPedidoNuevo(pedido) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const para = process.env.AVISO_EMAIL;

  if (!apiKey || !from || !para) {
    return { ok: false, error: "Faltan RESEND_API_KEY, EMAIL_FROM o AVISO_EMAIL" };
  }

  const sitio = process.env.SITE_URL || "";
  const filas = (pedido.pedido_items || [])
    .map(
      (i) => `<tr>
        <td style="padding:6px 12px 6px 0">${escapar(i.producto_nombre)}</td>
        <td style="padding:6px 12px">x ${escapar(i.cantidad)}</td>
        <td style="padding:6px 0;text-align:right">${pesos(i.precio * i.cantidad)}</td>
      </tr>`
    )
    .join("");

  const numero = String(pedido.id).slice(0, 8);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from,
        to: para,
        subject: `Nuevo pedido pagado #${numero} · ${pesos(pedido.total)}`,
        html: `
          <div style="font-family:Arial,sans-serif;font-size:15px;color:#222">
            <h2 style="margin:0 0 12px">¡Entró un pedido nuevo!</h2>
            <p style="margin:0 0 4px"><b>Pedido:</b> #${numero}</p>
            <p style="margin:0 0 4px"><b>Cliente:</b> ${escapar(pedido.cliente_nombre)}</p>
            <p style="margin:0 0 16px"><b>Email:</b> ${escapar(pedido.cliente_email)}</p>
            <table style="border-collapse:collapse;width:100%;max-width:480px">${filas}</table>
            <p style="margin:16px 0;font-size:17px"><b>Total: ${pesos(pedido.total)}</b></p>
            ${sitio ? `<p><a href="${sitio}/admin">Ver en el panel</a></p>` : ""}
          </div>`,
      }),
    });

    if (!res.ok) {
      const detalle = await res.text().catch(() => "");
      return { ok: false, error: `Resend ${res.status}: ${detalle}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}