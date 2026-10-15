import { notFound } from "next/navigation";
import CompraResultado from "@/components/CompraResultado";

const ESTADOS = ["exito", "pendiente", "fallida"];

export const metadata = {
  title: "Tu compra - ViWa",
  robots: "noindex, nofollow",
};

export default async function CompraPage({ params }) {
  const { estado } = await params;
  if (!ESTADOS.includes(estado)) notFound();

  return <CompraResultado estado={estado} />;
}
