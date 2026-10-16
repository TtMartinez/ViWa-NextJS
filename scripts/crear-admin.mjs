// Crea (o actualiza la contraseña de) una cuenta del panel de administración.
//
// Uso (desde la carpeta del proyecto):
//   node --env-file=.env.local scripts/crear-admin.mjs email@ejemplo.com "Nombre Apellido" admin
//
// El último dato es el rol: "admin" (ve todo) o "operador" (solo pedidos).
// La contraseña se pide por pantalla (no se ve mientras la escribís).

import readline from "node:readline";
import { randomBytes, scryptSync } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const [email, nombre, rol = "admin"] = process.argv.slice(2);

if (!email || !nombre || !["admin", "operador"].includes(rol)) {
  console.error('Uso: node --env-file=.env.local scripts/crear-admin.mjs email "Nombre Apellido" [admin|operador]');
  process.exit(1);
}
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
  console.error("Faltan SUPABASE_URL o SUPABASE_SECRET_KEY (revisá tu .env.local).");
  process.exit(1);
}

// Pide la contraseña dos veces, mostrando asteriscos en lugar de lo que se escribe.
function pedirClaves() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => {
      if (rl.silenciar && s !== "\r\n" && s !== "\n") rl.output.write("*");
      else rl.output.write(s);
    };
    rl.question("Contraseña (mínimo 10 caracteres): ", (primera) => {
      rl.silenciar = false;
      process.stdout.write("\n");
      rl.question("Repetí la contraseña: ", (segunda) => {
        rl.close();
        process.stdout.write("\n");
        resolve([primera, segunda]);
      });
      rl.silenciar = true;
    });
    rl.silenciar = true;
  });
}

const [clave, repetir] = await pedirClaves();

if (clave.length < 10) {
  console.error("La contraseña es muy corta (mínimo 10 caracteres).");
  process.exit(1);
}
if (clave !== repetir) {
  console.error("Las contraseñas no coinciden.");
  process.exit(1);
}

// Mismo formato que lib/password.js
const sal = randomBytes(16);
const hash = scryptSync(clave, sal, 64);
const password_hash = `scrypt$${sal.toString("hex")}$${hash.toString("hex")}`;

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

const { error } = await supabase.from("admin_usuarios").upsert(
  {
    email: email.trim().toLowerCase(),
    nombre: nombre.trim(),
    rol,
    password_hash,
    activo: true,
    intentos_fallidos: 0,
    bloqueado_hasta: null,
  },
  { onConflict: "email" }
);

if (error) {
  console.error("No se pudo guardar la cuenta:", error.message);
  process.exit(1);
}
console.log(`Listo: cuenta ${email.trim().toLowerCase()} (${rol}) guardada.`);
