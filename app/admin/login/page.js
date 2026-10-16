import { redirect } from "next/navigation";
import styles from "@/app/admin/admin.module.css";
import { getSesion } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ingresar · Panel ViWa", robots: "noindex, nofollow" };

const MENSAJES = {
  1: "El email o la contraseña no son correctos.",
  2: "El panel no está configurado correctamente. Avisale a quien lo administra.",
  3: "Demasiados intentos fallidos. Esperá 15 minutos y volvé a probar.",
};

export default async function LoginPage({ searchParams }) {
  const sp = await searchParams;
  if (await getSesion()) redirect("/admin");
  const error = MENSAJES[Array.isArray(sp?.error) ? sp.error[0] : sp?.error];

  return (
    <div className={styles.loginFondo}>
      <form className={styles.loginCaja} method="POST" action="/api/admin/login">
        <div className={styles.loginTitulo}>
          <span className={styles.loginMarca}>ViWa</span>
          <span className={styles.loginSub}>Panel de administración</span>
        </div>

        {error && (
          <div className={`${styles.aviso} ${styles.avisoError}`} role="alert">
            {error}
          </div>
        )}

        <label className={styles.campo}>
          Email
          <input
            className={styles.input}
            type="email"
            name="email"
            autoComplete="username"
            required
            autoFocus
          />
        </label>
        <label className={styles.campo}>
          Contraseña
          <input
            className={styles.input}
            type="password"
            name="password"
            autoComplete="current-password"
            required
          />
        </label>
        <button type="submit" className={styles.btn}>
          Ingresar
        </button>
        <span className={styles.loginPie}>Acceso solo para personal autorizado</span>
      </form>
    </div>
  );
}
