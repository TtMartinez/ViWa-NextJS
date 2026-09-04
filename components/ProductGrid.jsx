"use client";

import { useEffect, useState } from "react";
import { fetchProductos, sanityImgUrl } from "@/lib/sanity";
import { useProductModal } from "@/context/ModalContext";

function ProductCard({ prod }) {
  const { openModal } = useProductModal();
  const imgUrl = sanityImgUrl(prod.imagen?.asset?._ref);

  return (
    <div className="product-card" onClick={() => openModal(prod)}>
      <img src={imgUrl} alt={prod.nombre} className="product-img" />
      <h3>{prod.nombre}</h3>
      <p>${prod.precio?.toLocaleString("es-AR")}</p>
    </div>
  );
}

/**
 * Grilla simple para categorías sin subcategorías
 * (equivalente a la rama "else" de cargarProductos en productos.js)
 */
export default function ProductGrid({ categoria }) {
  const [productos, setProductos] = useState(null); // null = cargando

  useEffect(() => {
    let cancelado = false;
    fetchProductos(categoria)
      .then((result) => {
        if (!cancelado) setProductos(result);
      })
      .catch((err) => {
        console.error("Error cargando productos:", err);
        if (!cancelado) setProductos([]);
      });
    return () => {
      cancelado = true;
    };
  }, [categoria]);

  if (productos === null) {
    return <p>Cargando productos…</p>;
  }

  if (productos.length === 0) {
    return <p>No hay productos en esta categoría todavía.</p>;
  }

  return (
    <div className="products-grid">
      {productos.map((prod) => (
        <ProductCard key={prod._id} prod={prod} />
      ))}
    </div>
  );
}

export { ProductCard };
