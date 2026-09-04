"use client";

import { useEffect, useState } from "react";
import { sanityImgUrl } from "@/lib/sanity";
import { useProductModal } from "@/context/ModalContext";
import { useCart } from "@/context/CartContext";

export default function ProductModal() {
  const { producto, isOpen, closeModal } = useProductModal();
  const { addToCart } = useCart();

  const [cantidad, setCantidad] = useState(1);
  const [saborIndex, setSaborIndex] = useState(0);

  // Resetear cantidad y sabor cada vez que se abre un producto nuevo
  useEffect(() => {
    setCantidad(1);
    setSaborIndex(0);
  }, [producto]);

  if (!isOpen || !producto) return null;

  const sabores = producto.sabores || [];
  const tieneSabores = sabores.length > 0;
  const saborActual = tieneSabores ? sabores[saborIndex] : null;

  const descripcion = saborActual?.descripcion || producto.descripcion || "Sin descripción.";
  const ingredientes = saborActual?.ingredientes || producto.ingredientes || "Sin especificar.";
  const imgUrl = sanityImgUrl(producto.imagen?.asset?._ref);

  function handleAgregar() {
    let nombreFinal = producto.nombre;
    if (tieneSabores) {
      nombreFinal += ` - ${sabores[saborIndex].nombre}`;
    }
    addToCart(nombreFinal, producto.precio, cantidad);
    closeModal();
  }

  return (
    <div
      id="producto-modal"
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div className="modal-contenido">
        <button className="modal-cerrar" onClick={closeModal}>
          ✕
        </button>
        <img src={imgUrl} alt="Foto del producto" className="modal-img" />
        <h2>{producto.nombre}</h2>
        <p className="modal-precio">${producto.precio?.toLocaleString("es-AR")}</p>

        {tieneSabores && (
          <div>
            <p className="modal-label">Sabor / Variante</p>
            <select
              className="modal-select"
              value={saborIndex}
              onChange={(e) => setSaborIndex(Number(e.target.value))}
            >
              {sabores.map((s, i) => (
                <option key={i} value={i}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        <p className="modal-label">Descripción</p>
        <p className="modal-texto">{descripcion}</p>
        <p className="modal-label">Ingredientes</p>
        <p className="modal-texto">{ingredientes}</p>

        <div className="modal-cantidad">
          <button onClick={() => setCantidad((c) => Math.max(1, c - 1))}>−</button>
          <span>{cantidad}</span>
          <button onClick={() => setCantidad((c) => c + 1)}>+</button>
        </div>

        <button onClick={handleAgregar}>Agregar al carrito</button>
      </div>
    </div>
  );
}
