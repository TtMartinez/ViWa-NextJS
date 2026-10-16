import styles from "@/app/admin/admin.module.css";
import NavLink from "@/components/admin/NavLink";
import { exigirSesion } from "@/lib/admin-auth";

export const metadata = { title: "Panel ViWa", robots: "noindex, nofollow" };

export default async function PanelLayout({ children }) {
  const sesion = await exigirSesion();
  const esAdmin = sesion.rol === "admin";

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <span className={styles.marca}>ViWa · Panel</span>
        <nav className={styles.nav}>
          <NavLink href="/admin" exacto>
            Pedidos
          </NavLink>
          {esAdmin && <NavLink href="/admin/metricas">Métricas</NavLink>}
        </nav>
        <div className={styles.usuario}>
          <span className={styles.usuarioNombre}>{sesion.nombre}</span>
          <span className={styles.usuarioRol}>{esAdmin ? "Administrador" : "Operador"}</span>
          <form method="POST" action="/api/admin/logout">
            <button type="submit" className={styles.btnSalir}>
              Salir
            </button>
          </form>
        </div>
      </aside>
      <main className={styles.contenido}>{children}</main>
    </div>
  );
}
