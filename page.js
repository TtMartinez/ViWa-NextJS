"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [carrito, setCarrito] = useState([]);
  const [toastMsg, setToastMsg] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Cargar del localStorage al montar
  useEffect(() => {
    try {
      const guardado = JSON.parse(localStorage.getItem("carrito")) || [];
      // Los carritos guardados antes de este cambio no tienen productoId
      // (no se pueden cobrar con precio verificado), así que se descartan.
      setCarrito(guardado.filter((p) => p && p.productoId));
    } catch {
      setCarrito([]);
    }
    setHydrated(true);
  }, []);

  // Guardar cada vez que cambia
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem("carrito", JSON.stringify(carrito));
    }
  }, [carrito, hydrated]);

  const showToast = useCallback((mensaje) => {
    setToastMsg(mensaje);
    setTimeout(() => setToastMsg(""), 2500);
  }, []);

  const addToCart = useCallback(
    ({ productoId, nombre, sabor = null, precio, cantidad = 1 }) => {
      setCarrito((prev) => {
        const existe = prev.find(
          (p) => p.productoId === productoId && (p.sabor || null) === (sabor || null)
        );
        if (existe) {
          return prev.map((p) =>
            p === existe ? { ...p, cantidad: p.cantidad + cantidad } : p
          );
        }
        return [...prev, { productoId, nombre, sabor, precio: Number(precio), cantidad }];
      });
      showToast("✓ Producto agregado al carrito");
    },
    [showToast]
  );

  const updateQty = useCallback((index, cantidad) => {
    const n = Math.min(50, Math.max(1, parseInt(cantidad) || 1));
    setCarrito((prev) => prev.map((p, i) => (i === index ? { ...p, cantidad: n } : p)));
  }, []);

  const removeItem = useCallback((index) => {
    setCarrito((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearCart = useCallback(() => setCarrito([]), []);

  const total = carrito.reduce((acc, p) => acc + p.precio * p.cantidad, 0);
  const itemCount = carrito.reduce((acc, p) => acc + p.cantidad, 0);

  const openCart = () => setCartOpen(true);
  const closeCart = () => setCartOpen(false);

  const openPayment = () => {
    if (carrito.length === 0) {
      showToast("⚠️ El carrito está vacío");
      return;
    }
    setPaymentOpen(true);
  };
  const closePayment = () => setPaymentOpen(false);

  return (
    <CartContext.Provider
      value={{
        carrito,
        total,
        itemCount,
        addToCart,
        updateQty,
        removeItem,
        clearCart,
        toastMsg,
        showToast,
        cartOpen,
        openCart,
        closeCart,
        paymentOpen,
        openPayment,
        closePayment,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
