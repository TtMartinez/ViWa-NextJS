"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  // En el sitio original, los íconos de Instagram/WhatsApp solo estaban
  // en el footer de index.html y politica-de-privacidad.html — las páginas
  // de producto tenían un footer más simple, solo con el texto.
  const mostrarSocial = !pathname?.startsWith("/productos");

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-text">
          <p>© 2026 ViWa Atelier de Artesanías</p>
          <p>Todos los derechos reservados</p>
          <p>
            <Link
              href="/politica-de-privacidad"
              style={{ color: "#f97316", fontSize: "0.85rem" }}
            >
              Política de Privacidad
            </Link>
          </p>
        </div>

        {mostrarSocial && (
          <div className="footer-social">
            <a
              href="https://www.instagram.com/viwa.atelierdeartesanias/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image src="/logos/instagram.png" alt="Instagram" width={32} height={32} className="img" />
            </a>

            <a href="https://wa.me/5493462645379" target="_blank" rel="noopener noreferrer">
              <Image src="/logos/whatsapp.png" alt="WhatsApp" width={32} height={32} className="img" />
            </a>
          </div>
        )}
      </div>
    </footer>
  );
}
