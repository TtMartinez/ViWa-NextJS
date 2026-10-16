import styles from "@/app/admin/admin.module.css";
import { ETIQUETA } from "@/lib/formato";

export default function Badge({ estado }) {
  return (
    <span className={`${styles.badge} ${styles["estado_" + estado] || ""}`}>
      {ETIQUETA[estado] || estado}
    </span>
  );
}
