"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/categorias";

export default function Header() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const pathname = usePathname();

  const enInicio = pathname === "/";
  const enProductos = pathname?.startsWith("/productos");

  // Cierra el dropdown si el clic fue afuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <header className="site-header">
      <Link href="/" className="brand">
        <span className="brand-name">ViWa</span>
        <span className="brand-sub">Atelier de Artesanías</span>
      </Link>

      <nav className="nav-pill">
        <Link href="/" className={`nav-pill-item${enInicio ? " active" : ""}`}>
          Inicio
        </Link>

        <div className="nav-pill-item dropdown" ref={dropdownRef}>
          <a
            className={`dropdown-toggle${enProductos ? " active" : ""}`}
            onClick={() => setOpen((v) => !v)}
          >
            Productos ▾
          </a>
          <ul className={`dropdown-menu${open ? " open" : ""}`}>
            {NAV_ITEMS.map((item) => (
              <li key={item.slug}>
                <Link href={`/productos/${item.slug}`} onClick={() => setOpen(false)}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}
