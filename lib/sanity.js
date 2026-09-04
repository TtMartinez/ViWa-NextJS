const PROJECT_ID = "bh05ol1a";
const DATASET = "production";

/**
 * Convierte la referencia de imagen de Sanity en una URL utilizable.
 * (Misma lógica que tenías en js/productos.js -> sanityImgUrl)
 */
export function sanityImgUrl(ref) {
  if (!ref) return "";
  return `https://cdn.sanity.io/images/${PROJECT_ID}/${DATASET}/${ref
    .replace("image-", "")
    .replace(/-(\w+)$/, ".$1")}`;
}

/**
 * Trae los productos de una categoría desde Sanity.
 * (Misma query GROQ que usabas en cargarProductos)
 */
export async function fetchProductos(categoria) {
  const query = encodeURIComponent(
    `*[_type == "product" && categoria == "${categoria}"] | order(_createdAt asc)`
  );
  const url = `https://${PROJECT_ID}.api.sanity.io/v2023-01-01/data/query/${DATASET}?query=${query}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Error consultando Sanity");

  const { result } = await res.json();
  return result || [];
}
