"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { WHATSAPP_NUMBER } from "@/lib/categorias";

function formatearPrecioWA(num) {
  return num.toLocaleString("es-AR").replace(/\./g, "");
}

export default function PaymentModal() {
  const { carrito, paymentOpen, closePayment, showToast } = useCart();
  const [metodo, setMetodo] = useState("");

  if (!paymentOpen) return null;

  function handleCerrar() {
    setMetodo("");
    closePayment();
  }

  function handleConfirmar() {
    if (!metodo) {
      showToast("⚠️ Por favor seleccioná un método de pago");
      return;
    }
    enviarWhatsApp(metodo);
    handleCerrar();
  }

  function enviarWhatsApp(metodoPago) {
    let mensaje = "Hola! Quiero comprar:\n\n";
    carrito.forEach((prod) => {
      const subtotal = prod.precio * prod.cantidad;
      mensaje += `- ${prod.nombre} x${prod.cantidad} ($${formatearPrecioWA(
        prod.precio
      )}) = $${formatearPrecioWA(subtotal)}\n`;
    });
    const total = carrito.reduce((acc, p) => acc + p.precio * p.cantidad, 0);
    mensaje += `\nTotal: $${formatearPrecioWA(total)}`;
    mensaje += `\nForma de pago: ${metodoPago}`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");
  }

  return (
    <div id="modal-pago">
      <div id="modal-pago-contenido">
        <h3>¿Cómo vas a pagar?</h3>
        <label>
          <input
            type="radio"
            name="pago"
            value="Transferencia"
            checked={metodo === "Transferencia"}
            onChange={(e) => setMetodo(e.target.value)}
          />{" "}
          Transferencia
        </label>
        <label>
          <input
            type="radio"
            name="pago"
            value="Efectivo"
            checked={metodo === "Efectivo"}
            onChange={(e) => setMetodo(e.target.value)}
          />{" "}
          Efectivo
        </label>
        <div>
          <button onClick={handleConfirmar}>Confirmar</button>
          <button onClick={handleCerrar}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
