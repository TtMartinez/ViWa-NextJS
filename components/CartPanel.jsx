"use client";

import { useCart } from "@/context/CartContext";

function formatearPrecio(num) {
  return num.toLocaleString("es-AR");
}

export function CartButton() {
  const { itemCount, openCart } = useCart();
  return (
    <button className="ver-carrito" onClick={openCart}>
      🛒 ({itemCount})
    </button>
  );
}

export function CartPanel() {
  const { carrito, total, cartOpen, closeCart, updateQty, removeItem, openPayment } = useCart();

  return (
    <div id="carrito-panel" className={`compra-panel${cartOpen ? "" : " hidden"}`}>
      <h2>Carrito</h2>

      <div id="carrito-items">
        {carrito.map((prod, index) => {
          const subtotal = prod.precio * prod.cantidad;
          return (
            <div
              key={`${prod.nombre}-${index}`}
              style={{ marginBottom: 10, borderBottom: "1px solid #ccc", paddingBottom: 5 }}
            >
              <strong>{prod.nombre}</strong>
              <br />${formatearPrecio(prod.precio)} x{" "}
              <input
                type="number"
                min={1}
                value={prod.cantidad}
                onChange={(e) => updateQty(index, e.target.value)}
              />{" "}
              = <strong>${formatearPrecio(subtotal)}</strong>{" "}
              <button onClick={() => removeItem(index)}>❌</button>
            </div>
          );
        })}
      </div>

      <p>
        Total: $<span>{formatearPrecio(total)}</span>
      </p>
      <button onClick={openPayment}>Finalizar compra</button>
      <button onClick={closeCart}>Cerrar</button>
    </div>
  );
}
