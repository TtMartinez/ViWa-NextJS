// Sesión firmada (HMAC-SHA256) guardada en una cookie.
// Usa solo Web Crypto, así funciona tanto en el middleware (Edge) como en Node.

export const COOKIE_SESION = "viwa_admin";
export const DURACION_HORAS = 12;

const enc = new TextEncoder();

function aBase64Url(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function deBase64Url(str) {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const relleno = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(relleno);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function importarClave() {
  const secreto = process.env.ADMIN_SESSION_SECRET;
  if (!secreto || secreto.length < 32) {
    throw new Error("Falta ADMIN_SESSION_SECRET (mínimo 32 caracteres)");
  }
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secreto),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function crearToken({ email, nombre, rol }) {
  const datos = { e: email, n: nombre, r: rol, exp: Date.now() + DURACION_HORAS * 3600 * 1000 };
  const cuerpo = aBase64Url(enc.encode(JSON.stringify(datos)));
  const clave = await importarClave();
  const firma = await crypto.subtle.sign("HMAC", clave, enc.encode(cuerpo));
  return `${cuerpo}.${aBase64Url(new Uint8Array(firma))}`;
}

// Devuelve { email, nombre, rol } si la cookie es válida y no venció; si no, null.
export async function verificarToken(token) {
  try {
    const [cuerpo, firma] = String(token || "").split(".");
    if (!cuerpo || !firma) return null;
    const clave = await importarClave();
    const ok = await crypto.subtle.verify("HMAC", clave, deBase64Url(firma), enc.encode(cuerpo));
    if (!ok) return null;
    const datos = JSON.parse(new TextDecoder().decode(deBase64Url(cuerpo)));
    if (!datos.exp || datos.exp < Date.now()) return null;
    return { email: datos.e, nombre: datos.n, rol: datos.r };
  } catch {
    return null;
  }
}
