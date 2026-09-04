"use client";

import { createContext, useContext, useState, useCallback } from "react";

const ModalContext = createContext(null);

export function ModalProvider({ children }) {
  const [producto, setProducto] = useState(null); // producto seleccionado
  const [isOpen, setIsOpen] = useState(false);

  const openModal = useCallback((prod) => {
    setProducto(prod);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setProducto(null);
  }, []);

  return (
    <ModalContext.Provider value={{ producto, isOpen, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useProductModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useProductModal debe usarse dentro de <ModalProvider>");
  return ctx;
}
