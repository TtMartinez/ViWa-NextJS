"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

const TEXTOS = {
  exito: {
    titulo: "¡Gracias por tu compra!",
    texto:
      "Mercado Pago nos está confirmando tu pago. Apenas se acredite, te avisamos por email.",
  },
  pendiente: {
    titulo: "Tu pago está pendiente",
    texto:
      "Mercado Pago todavía no acreditó el pago. Las transferencias pueden demorar un poco. Cuando se confirme, te avisamos por email.",
  },
  fallida: {
    titulo: "No pudimos procesar el pago",
    texto:
      "El pago no se completó. Tu carrito sigue guardado: podés intentarlo de nuevo cuando quieras.",
  },
};

export default function CompraResultado({ estado }) {
  const { clearCart } = useCart();
  const { titulo, texto } = TEXTOS[estado];

  // Si el cliente ya hizo el pedido (aprobado o pendiente), vaciamos el carrito.
  // Si falló, lo dejamos para que pueda reintentar.
  useEffect(() => {
    if (estado === "exito" || estado === "pendiente") clearCart();
  }, [estado, clearCart]);

  return (
    <section style={{ textAlign: "center" }}>
      <h1>{titulo}</h1>
      <p className="section-text">{texto}</p>
      <Link
        href="/"
        className="nav-pill-item"
        style={{ display: "inline-block", marginTop: 20, backgroundColor: "#1e3a5f" }}
      >
        Volver al inicio
      </Link>
    </section>
  );
}
