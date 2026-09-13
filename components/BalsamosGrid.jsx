"use client";

import { useEffect, useState } from "react";
import { fetchProductos } from "@/lib/sanity";
import { CATEGORIAS } from "@/lib/categorias";
import { ProductCard } from "./ProductGrid";

const { subcategorias, subcategoriasTitulos } = CATEGORIAS.balsamos;

export default function BalsamosGrid() {
  const [porSub, setPorSub] = useState(null); // null = cargando

  useEffect(() => {
    let cancelado = false;
    fetchProductos("balsamos")
      .then((result) => {
        if (cancelado) return;
        const agrupado = Object.fromEntries(subcategorias.map((s) => [s, []]));
        result.forEach((prod) => {
          if (agrupado[prod.subcategoria]) agrupado[prod.subcategoria].push(prod);
        });
        setPorSub(agrupado);
      })
      .catch((err) => {
        console.error("Error cargando productos:", err);
        if (!cancelado) setPorSub(Object.fromEntries(subcategorias.map((s) => [s, []])));
      });
    return () => {
      cancelado = true;
    };
  }, []);

  if (porSub === null) {
    return <p>Cargando productos…</p>;
  }

  return (
    <>
      {subcategorias.map((sub) => (
        <section className="subseccion" key={sub}>
          <h2>{subcategoriasTitulos[sub]}</h2>
          <div className="products-grid">
            {porSub[sub].length === 0 ? (
              <p>No hay productos en esta categoría todavía.</p>
            ) : (
              porSub[sub].map((prod) => <ProductCard key={prod._id} prod={prod} />)
            )}
          </div>
        </section>
      ))}
    </>
  );
}
