"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import ProductModal from "./ProductModal";
import PaymentModal from "./PaymentModal";
import CartWidgets from "./CartWidgets";
import Toast from "./Toast";

/**
 * El panel de /admin es una herramienta interna, no parte de la tienda:
 * no debería mostrar el header con el logo, el footer con Instagram/WhatsApp,
 * ni el carrito de compras flotando. Esta capa decide qué "cáscara" mostrar
 * según en qué sección del sitio estás.
 */
export default function ConditionalChrome({ children }) {
  const pathname = usePathname();
  const esAdmin = pathname?.startsWith("/admin");

  if (esAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <Header mostrarLogo />
      <main className="main-content">{children}</main>
      <Footer />
      <ProductModal />
      <CartWidgets />
      <PaymentModal />
      <Toast />
    </>
  );
}
