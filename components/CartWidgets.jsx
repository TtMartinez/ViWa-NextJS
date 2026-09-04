"use client";

import { usePathname } from "next/navigation";
import { CartButton, CartPanel } from "./CartPanel";

/**
 * El carrito solo tiene sentido en las páginas de producto (donde se puede
 * comprar). En la Home y en Política de Privacidad no se muestra, para que
 * no tape el footer con los íconos de Instagram/WhatsApp — igual que en el
 * sitio original, donde el botón de carrito no existía en index.html.
 */
export default function CartWidgets() {
  const pathname = usePathname();
  const mostrar = pathname?.startsWith("/productos");

  if (!mostrar) return null;

  return (
    <>
      <CartButton />
      <CartPanel />
    </>
  );
}
