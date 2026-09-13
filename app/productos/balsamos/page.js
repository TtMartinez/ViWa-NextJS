import BalsamosGrid from "@/components/BalsamosGrid";
import { CATEGORIAS } from "@/lib/categorias";

const info = CATEGORIAS.balsamos;

export const metadata = {
  title: info.titulo,
  description: info.description,
  keywords: info.keywords,
  robots: "index, follow",
  openGraph: {
    type: "website",
    title: `${info.titulo} | ViWa Atelier`,
    description: info.description,
    url: "https://ttmartinez.github.io/ViWa/pages/balsamos.html",
    images: ["https://raw.githubusercontent.com/TtMartinez/ViWa/main/assets/logos/LogoViWa.jpeg"],
    locale: "es_AR",
  },
};

export default function BalsamosPage() {
  return (
    <div className="products-page">
      <h1>{info.titulo}</h1>
      <BalsamosGrid />
    </div>
  );
}
