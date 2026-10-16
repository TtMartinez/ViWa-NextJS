import { NextResponse } from "next/server";
import { getSesion } from "@/lib/admin-auth";
import { leerFiltros, traerTodosPedidos } from "@/lib/pedidos-admin";
import { ETIQUETA, fechaHora, hoyAR, numeroPedido } from "@/lib/formato";

export const runtime = "nodejs";

// Texto de una celda. Si empieza con = + - @ lo neutralizamos para que Excel
// no lo interprete como una fórmula (un cliente podría escribir eso en su nombre).
function celda(valor) {
  let s = String(valor ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  if (/[";\r\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}

// Exporta los pedidos (con los mismos filtros del listado) como CSV para Excel.
export async function GET(request) {
  const sesion = await getSesion();
  if (!sesion) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (sesion.rol !== "admin") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const filtros = leerFiltros(Object.fromEntries(new URL(request.url).searchParams));

  let pedidos;
  try {
    pedidos = await traerTodosPedidos(filtros);
  } catch (err) {
    console.error("[admin-exportar] Error consultando pedidos:", err);
    return NextResponse.json({ error: "No se pudo exportar" }, { status: 500 });
  }

  const encabezado = [
    "N°",
    "Fecha",
    "Cliente",
    "Email",
    "Tipo",
    "Estado",
    "Total",
    "Productos",
    "ID de pago (Mercado Pago)",
    "Nota",
  ];

  const filas = pedidos.map((p) => {
    const productos = (p.pedido_items || []).map((i) => `${i.cantidad} x ${i.producto_nombre}`).join(" | ");
    return [
      celda(numeroPedido(p.numero)),
      celda(fechaHora(p.creado_en)),
      celda(p.cliente_nombre),
      celda(p.cliente_email),
      celda(p.tipo_producto === "digital" ? "Digital" : "Físico"),
      celda(ETIQUETA[p.estado] || p.estado),
      String(Number(p.total)).replace(".", ","),
      celda(productos),
      celda(p.mp_payment_id),
      celda(p.nota),
    ].join(";");
  });

  // BOM para que Excel respete los acentos; ";" porque Excel en español separa columnas con punto y coma.
  const csv = "﻿" + [encabezado.map(celda).join(";"), ...filas].join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pedidos-viwa-${hoyAR()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
