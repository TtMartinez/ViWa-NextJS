import { scrypt as scryptCb, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb);
const LARGO = 64;

// Guarda la contraseña como "scrypt$<sal>$<hash>" (nunca en texto plano).
export async function hashPassword(clave) {
  const sal = randomBytes(16);
  const hash = await scrypt(clave, sal, LARGO);
  return `scrypt$${sal.toString("hex")}$${hash.toString("hex")}`;
}

export async function verificarPassword(clave, guardado) {
  try {
    const [tipo, salHex, hashHex] = String(guardado).split("$");
    if (tipo !== "scrypt" || !salHex || !hashHex) return false;
    const esperado = Buffer.from(hashHex, "hex");
    const hash = await scrypt(clave, Buffer.from(salHex, "hex"), esperado.length);
    return hash.length === esperado.length && timingSafeEqual(hash, esperado);
  } catch {
    return false;
  }
}
