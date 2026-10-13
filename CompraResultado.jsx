"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";

function formatearPrecio(num) {
  return num.toLocaleString("es-AR");
}

export default function PaymentModal() {
  const { carrito, total, paymentOpen, closePayment } = useCart();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  // Si el cliente vuelve atrás desde Mercado Pago, el navegador puede
  // restaurar esta página con el botón todavía bloqueado: lo liberamos.
  useEffect(() => {
    function onPageShow(e) {
      if (e.persisted) setEnviando(false);
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  if (!paymentOpen) return null;

  function handleCancelar() {
    if (enviando) return;
    setError("");
    closePayment();
  }

  async function handlePagar(e) {
    e.preventDefault();
    if (enviando) return;

    setEnviando(true);
    setError("");

    try {
      const res = await fetch("/api/crear-preferencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Solo mandamos QUÉ se compra y cuántos: el precio lo calcula el servidor.
        body: JSON.stringify({
          cliente: { nombre, email },
          items: carrito.map((p) => ({
            productoId: p.productoId,
            sabor: p.sabor || null,
            cantidad: p.cantidad,
          })),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.init_point) {
        throw new Error(data.error || "No pudimos iniciar el pago. Intentá de nuevo.");
      }

      window.location.href = data.init_point;
    } catch (err) {
      setError(err.message || "No pudimos iniciar el pago. Intentá de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <div id="modal-pago">
      <div id="modal-pago-contenido">
        <h3>Finalizar compra</h3>
        <p className="total">Total: ${formatearPrecio(total)}</p>

        <form onSubmit={handlePagar}>
          <label className="campo">
            Nombre y apellido
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              minLength={2}
              maxLength={80}
              autoComplete="name"
            />
          </label>

          <label className="campo">
            Email (acá te avisamos de tu compra)
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={120}
              autoComplete="email"
            />
          </label>

          {error && <p className="error">{error}</p>}

          <div className="acciones">
            <button type="submit" disabled={enviando}>
              {enviando ? "Redirigiendo…" : "Pagar con Mercado Pago"}
            </button>
            <button type="button" onClick={handleCancelar} disabled={enviando}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
