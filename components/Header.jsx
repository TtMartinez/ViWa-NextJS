"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { NAV_ITEMS } from "@/lib/categorias";

export default function Header({ mostrarLogo = false }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Equivalente al listener global "click fuera del dropdown lo cierra"
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
    <header className="main-header">
      {mostrarLogo && (
        <div className="header-content">
          <Link href="/" className="logo-link">
            <Image
              src="/logos/LogoViWa.jpeg"
              alt="Logo de ViWa"
              width={70}
              height={70}
              className="logo-img"
            />
          </Link>
          <div className="header-text">
            <h1 className="header-title">ViWa · Atelier de Artesanías</h1>
          </div>
        </div>
      )}

      <nav className="main-nav">
        <ul className="nav-list">
          <li className="nav-item">
            <Link href="/" className="nav-link">
              Inicio
            </Link>
          </li>
          <li className="nav-item dropdown" ref={dropdownRef}>
            <a className="nav-link dropdown-toggle" onClick={() => setOpen((v) => !v)}>
              Nuestros Productos ▾
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
          </li>
        </ul>
      </nav>
    </header>
  );
}
