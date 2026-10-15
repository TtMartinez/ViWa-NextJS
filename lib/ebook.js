import { getSupabaseAdmin } from "@/lib/supabase";

function escapar(texto) {
  return String(texto).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Envía el ebook por mail con un link de descarga que vence a los 7 días.
// Devuelve { ok: true } o { ok: false, error }.
export async function enviarEbook({ email, nombre }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const bucket = process.env.EBOOK_BUCKET || "ebooks";
  const archivo = process.env.EBOOK_FILE;

  if (!apiKey || !from || !archivo) {
    return { ok: false, error: "Faltan RESEND_API_KEY, EMAIL_FROM o EBOOK_FILE" };
  }

  const supabase = getSupabaseAdmin();
  const { data: firmado, error: errUrl } = await supabase.storage
    .from(bucket)
    .createSignedUrl(archivo, 60 * 60 * 24 * 7);

  if (errUrl || !firmado?.signedUrl) {
    return { ok: false, error: `No se pudo generar el link: ${errUrl?.message}` };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from,
      to: email,
      subject: "Tu ebook de ViWa",
      html: `
        <p>Hola ${escapar(nombre)}, ¡gracias por tu compra!</p>
        <p>Podés descargar tu ebook desde este link (disponible por 7 días):</p>
        <p><a href="${firmado.signedUrl}">Descargar ebook</a></p>
        <p>Si tenés algún problema, respondé este mail.</p>
        <p>ViWa</p>`,
    }),
  });

  if (!res.ok) {
    const detalle = await res.text().catch(() => "");
    return { ok: false, error: `Resend ${res.status}: ${detalle}` };
  }
  return { ok: true };
}