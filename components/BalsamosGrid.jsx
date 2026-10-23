"use client";

import { useEffect, useState } from "react";
import { fetchProductos } from "@/lib/sanity";
import { CATEGORIAS } from "@/lib/categorias";
import { ProductCard } from "./ProductGrid";

const { subcategorias, subcategoriasTitulos } = CATEGORIAS.balsamos;

export default function BalsamosGrid() {
  const [productos, setProductos] = useState(null); // null = cargando

  useEffect(() => {
    let cancelado = false;
    fetchProductos("balsamos")
      .then((result) => {
        if (cancelado) return;
        // Ordenados por subcategoría: labiales, corporales, exfoliantes
        const ordenados = subcategorias.flatMap((sub) =>
          result.filter((prod) => prod.subcategoria === sub)
        );
        setProductos(ordenados);
      })
      .catch((err) => {
        console.error("Error cargando productos:", err);
        if (!cancelado) setProductos([]);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  if (productos === null) {
    return <p>Cargando productos…</p>;
  }

  if (productos.length === 0) {
    return <p>No hay productos en esta categoría todavía.</p>;
  }

  return (
    <div className="products-grid">
      {productos.map((prod) => (
        <ProductCard
          key={prod._id}
          prod={prod}
          etiqueta={subcategoriasTitulos[prod.subcategoria]}
        />
      ))}
    </div>
  );
}