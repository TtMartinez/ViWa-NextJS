import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { ModalProvider } from "@/context/ModalContext";
import ConditionalChrome from "@/components/ConditionalChrome";

export const metadata = {
  title: "ViWa",
  description:
    "ViWa Atelier de Artesanías: jabones artesanales y cosmética natural hecha a mano. Bienestar consciente para el cuidado diario.",
  keywords:
    "jabones artesanales, jabones naturales, cosmética natural, jabones herbales, exfoliantes, bálsamos, ViWa atelier",
  robots: "index, follow",
  openGraph: {
    type: "website",
    title: "ViWa Atelier de Artesanías",
    description:
      "Descubrí jabones y bálsamos artesanales hechos a mano. Cosmética consciente, natural y simple.",
    url: "https://ttmartinez.github.io/ViWa/",
    images: ["https://raw.githubusercontent.com/TtMartinez/ViWa/main/assets/logos/LogoViWa.jpeg"],
    locale: "es_AR",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <CartProvider>
          <ModalProvider>
            <ConditionalChrome>{children}</ConditionalChrome>
          </ModalProvider>
        </CartProvider>
      </body>
    </html>
  );
}
