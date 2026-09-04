"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [carrito, setCarrito] = useState([]);
  const [toastMsg, setToastMsg] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Cargar del localStorage al montar (equivalente a la línea 1 de script.js,
  // pero en React hay que esperar a que el componente esté en el navegador)
  useEffect(() => {
    try {
      const guardado = JSON.parse(localStorage.getItem("carrito")) || [];
      setCarrito(guardado);
    } catch {
      setCarrito([]);
    }
    setHydrated(true);
  }, []);

  // Guardar cada vez que cambia (equivalente a guardarCarrito())
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
    (nombre, precio, cantidad = 1) => {
      setCarrito((prev) => {
        const existe = prev.find((p) => p.nombre === nombre);
        if (existe) {
          return prev.map((p) =>
            p.nombre === nombre ? { ...p, cantidad: p.cantidad + cantidad } : p
          );
        }
        return [...prev, { nombre, precio: Number(precio), cantidad }];
      });
      showToast("✓ Producto agregado al carrito");
    },
    [showToast]
  );

  const updateQty = useCallback((index, cantidad) => {
    setCarrito((prev) =>
      prev.map((p, i) => (i === index ? { ...p, cantidad: parseInt(cantidad) || 1 } : p))
    );
  }, []);

  const removeItem = useCallback((index) => {
    setCarrito((prev) => prev.filter((_, i) => i !== index));
  }, []);

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
