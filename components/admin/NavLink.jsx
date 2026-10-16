"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "@/app/admin/admin.module.css";

// Enlace del menú lateral; se resalta cuando estás en esa sección.
export default function NavLink({ href, exacto = false, children }) {
  const pathname = usePathname() || "";
  const activo = exacto ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  return (
    <Link href={href} className={`${styles.navLink} ${activo ? styles.navActivo : ""}`}>
      {children}
    </Link>
  );
}
