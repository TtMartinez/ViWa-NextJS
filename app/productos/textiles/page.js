import ProductGrid from "@/components/ProductGrid";
import { CATEGORIAS } from "@/lib/categorias";

const info = CATEGORIAS.textiles;

export const metadata = {
  title: info.titulo,
  description: info.description,
  keywords: info.keywords,
  robots: "index, follow",
  openGraph: {
    type: "website",
    title: `${info.titulo} - ViWa Atelier de Artesanías`,
    description: info.description,
    url: `https://ttmartinez.github.io/ViWa/pages/textiles.html`,
    images: ["https://raw.githubusercontent.com/TtMartinez/ViWa/main/assets/logos/LogoViWa.jpeg"],
    locale: "es_AR",
  },
};

export default function Page() {
  return (
    <div className="products-page">
      <h1>{info.titulo}</h1>
      <ProductGrid categoria={info.categoria} />
    </div>
  );
}
