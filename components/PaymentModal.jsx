"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "@/context/CartContext";
import { WHATSAPP_NUMBER } from "@/lib/categorias";

function formatearPrecio(num) {
  return Number(num).toLocaleString("es-AR");
}

export default function PaymentModal() {
  const { carrito, total, paymentOpen, closePayment, closeCart, clearCart } = useCart();
  const formRef = useRef(null);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(""); // "", "mp" o "transferencia"
  const [error, setError] = useState("");
  const [pedido, setPedido] = useState(null); // datos del pedido por transferencia ya creado
  const [copiado, setCopiado] = useState("");

  // Si el cliente vuelve atrás desde Mercado Pago, el navegador puede
  // restaurar esta página con el botón todavía bloqueado: lo liberamos.
  useEffect(() => {
    function onPageShow(e) {
      if (e.persisted) setEnviando("");
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  if (!paymentOpen) return null;

  function cuerpo() {
    // Solo mandamos QUÉ se compra y cuántos: el precio lo calcula el servidor.
    return JSON.stringify({
      cliente: { nombre, email },
      items: carrito.map((p) => ({
        productoId: p.productoId,
        sabor: p.sabor || null,
        cantidad: p.cantidad,
      })),
    });
  }

  function handleCancelar() {
    if (enviando) return;
    setError("");
    closePayment();
  }

  // Cierra el paso final de la transferencia (el carrito ya se vació al crear el pedido).
  function handleListo() {
    setPedido(null);
    setError("");
    setCopiado("");
    closePayment();
    closeCart();
  }

  async function handlePagarMP(e) {
    e.preventDefault();
    if (enviando) return;

    setEnviando("mp");
    setError("");

    try {
      const res = await fetch("/api/crear-preferencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: cuerpo(),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.init_point) {
        throw new Error(data.error || "No pudimos iniciar el pago. Intentá de nuevo.");
      }

      window.location.href = data.init_point;
    } catch (err) {
      setError(err.message || "No pudimos iniciar el pago. Intentá de nuevo.");
      setEnviando("");
    }
  }

  async function handleTransferencia() {
    if (enviando) return;
    // Mismas validaciones del formulario (nombre y email obligatorios)
    if (formRef.current && !formRef.current.reportValidity()) return;

    setEnviando("transferencia");
    setError("");

    try {
      const res = await fetch("/api/crear-pedido-transferencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: cuerpo(),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.datos) {
        throw new Error(data.error || "No pudimos registrar tu pedido. Intentá de nuevo.");
      }

      // El pedido ya existe: vaciamos el carrito para que no se pueda duplicar.
      setPedido(data);
      clearCart();
    } catch (err) {
      setError(err.message || "No pudimos registrar tu pedido. Intentá de nuevo.");
    } finally {
      setEnviando("");
    }
  }

  async function copiar(clave, texto) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(clave);
      setTimeout(() => setCopiado(""), 2000);
    } catch {
      // Si el navegador no deja copiar, el cliente puede seleccionar el texto a mano.
    }
  }

  // ---------- Paso 2: datos para transferir ----------
  if (pedido) {
    const numero = String(pedido.numero).padStart(4, "0");
    const { alias, cvu, titular, banco } = pedido.datos;
    const mensaje = `Hola! Hice el pedido #${numero} por transferencia por $${formatearPrecio(
      pedido.total
    )}. Te paso el comprobante.`;
    const linkWhatsApp = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;

    return (
      <div id="modal-pago">
        <div id="modal-pago-contenido">
          <h3>Pedido #{numero} registrado</h3>
          <p>
            Transferí <strong>${formatearPrecio(pedido.total)}</strong> desde cualquier banco o billetera virtual
            a esta cuenta:
          </p>

          <div className="datos-transferencia">
            <div className="dato-fila">
              <span>
                Alias: <strong>{alias}</strong>
              </span>
              <button type="button" onClick={() => copiar("alias", alias)}>
                {copiado === "alias" ? "¡Copiado!" : "Copiar"}
              </button>
            </div>
            {cvu && (
              <div className="dato-fila">
                <span>
                  CVU: <strong>{cvu}</strong>
                </span>
                <button type="button" onClick={() => copiar("cvu", cvu)}>
                  {copiado === "cvu" ? "¡Copiado!" : "Copiar"}
                </button>
              </div>
            )}
            <div className="dato-fila">
              <span>
                Titular: <strong>{titular}</strong>
              </span>
            </div>
            <div className="dato-fila">
              <span>
                Banco: <strong>{banco}</strong>
              </span>
            </div>
            <div className="dato-fila">
              <span>
                Monto exacto: <strong>${formatearPrecio(pedido.total)}</strong>
              </span>
              <button type="button" onClick={() => copiar("monto", String(pedido.total))}>
                {copiado === "monto" ? "¡Copiado!" : "Copiar"}
              </button>
            </div>
          </div>

          <p className="nota-transferencia">
            Cuando termines, mandanos el comprobante por WhatsApp indicando tu número de pedido. Tenés 24 horas para
            transferir: pasado ese tiempo el pedido se cancela.
          </p>

          <div className="acciones">
            <a className="btn-whatsapp" href={linkWhatsApp} target="_blank" rel="noopener noreferrer">
              Enviar comprobante por WhatsApp
            </a>
            <button type="button" onClick={handleListo}>
              Listo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Paso 1: datos del cliente y forma de pago ----------
  return (
    <div id="modal-pago">
      <div id="modal-pago-contenido">
        <h3>Finalizar compra</h3>
        <p className="total">Total: ${formatearPrecio(total)}</p>

        <form ref={formRef} onSubmit={handlePagarMP}>
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
            <button type="submit" disabled={Boolean(enviando)}>
              {enviando === "mp" ? "Redirigiendo…" : "Pagar con Mercado Pago"}
            </button>
            <button
              type="button"
              className="btn-transferencia"
              onClick={handleTransferencia}
              disabled={Boolean(enviando)}
            >
              {enviando === "transferencia" ? "Registrando…" : "Pagar por transferencia"}
            </button>
            <button type="button" onClick={handleCancelar} disabled={Boolean(enviando)}>
              Cancelar
            </button>
          </div>
          <p className="nota-transferencia">
            ¿No tenés Mercado Pago? Elegí transferencia: podés pagar desde cualquier banco o billetera virtual.
          </p>
        </form>
      </div>
    </div>
  );
}
