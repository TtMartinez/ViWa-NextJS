import { getSupabaseAdmin } from "@/lib/supabase";
import { VENDIDOS, diasEntre, esFecha, fechaAR, finDia, hoyAR, inicioDia, sumarDias } from "@/lib/formato";

export const PERIODOS = [
  { clave: "hoy", etiqueta: "Hoy" },
  { clave: "7d", etiqueta: "7 días" },
  { clave: "30d", etiqueta: "30 días" },
  { clave: "mes", etiqueta: "Este mes" },
  { clave: "mes_ant", etiqueta: "Mes anterior" },
  { clave: "anio", etiqueta: "Este año" },
];

const primero = (v) => (Array.isArray(v) ? v[0] : v) || "";

// Convierte ?periodo=... (o ?desde=&hasta=) en un rango de fechas y su período anterior.
export function resolverPeriodo(sp = {}) {
  const hoy = hoyAR();
  let clave = primero(sp.periodo);
  let desde;
  let hasta;

  if (esFecha(primero(sp.desde)) && esFecha(primero(sp.hasta))) {
    desde = primero(sp.desde);
    hasta = primero(sp.hasta);
    if (desde > hasta) [desde, hasta] = [hasta, desde];
    if (diasEntre(desde, hasta) > 730) desde = sumarDias(hasta, -730);
    clave = "custom";
  } else {
    switch (clave) {
      case "hoy":
        desde = hoy;
        hasta = hoy;
        break;
      case "7d":
        desde = sumarDias(hoy, -6);
        hasta = hoy;
        break;
      case "30d":
        desde = sumarDias(hoy, -29);
        hasta = hoy;
        break;
      case "mes_ant": {
        const primerDiaMes = hoy.slice(0, 7) + "-01";
        hasta = sumarDias(primerDiaMes, -1);
        desde = hasta.slice(0, 7) + "-01";
        break;
      }
      case "anio":
        desde = hoy.slice(0, 4) + "-01-01";
        hasta = hoy;
        break;
      default:
        clave = "mes";
        desde = hoy.slice(0, 7) + "-01";
        hasta = hoy;
    }
  }

  const dias = diasEntre(desde, hasta) + 1;
  const hastaPrev = sumarDias(desde, -1);
  const desdePrev = sumarDias(hastaPrev, -(dias - 1));
  return { clave, desde, hasta, dias, desdePrev, hastaPrev };
}

// Pedidos creados entre dos fechas (inclusive), de a 1000 por consulta.
export async function traerPedidosRango(desde, hasta, maximo = 20000) {
  const supabase = getSupabaseAdmin();
  const todos = [];
  for (let desdeIdx = 0; desdeIdx < maximo; desdeIdx += 1000) {
    const { data, error } = await supabase
      .from("pedidos")
      .select("id, creado_en, total, estado, pedido_items(producto_nombre, cantidad, precio)")
      .gte("creado_en", inicioDia(desde))
      .lte("creado_en", finDia(hasta))
      .order("creado_en", { ascending: true })
      .order("id")
      .range(desdeIdx, desdeIdx + 999);
    if (error) throw error;
    todos.push(...(data || []));
    if ((data || []).length < 1000) break;
  }
  return todos;
}

export async function facturadoDelMes() {
  const hoy = hoyAR();
  const pedidos = await traerPedidosRango(hoy.slice(0, 7) + "-01", hoy);
  return pedidos.filter((p) => VENDIDOS.includes(p.estado)).reduce((a, p) => a + Number(p.total), 0);
}

export function variacion(actual, anterior) {
  if (!anterior) return null;
  return ((actual - anterior) / anterior) * 100;
}

// Totales, ranking de productos y serie por día (o por mes si el período es largo).
export function calcular(pedidos, desde, hasta) {
  const vendidos = pedidos.filter((p) => VENDIDOS.includes(p.estado));
  const facturacion = vendidos.reduce((a, p) => a + Number(p.total), 0);
  const cantidad = vendidos.length;

  const ranking = new Map();
  for (const p of vendidos) {
    for (const it of p.pedido_items || []) {
      const r = ranking.get(it.producto_nombre) || { nombre: it.producto_nombre, unidades: 0, monto: 0 };
      r.unidades += it.cantidad;
      r.monto += it.cantidad * Number(it.precio);
      ranking.set(it.producto_nombre, r);
    }
  }

  const dias = diasEntre(desde, hasta) + 1;
  const porDia = dias <= 92;
  const claves = [];
  if (porDia) {
    for (let i = 0; i < dias; i++) claves.push(sumarDias(desde, i));
  } else {
    let m = desde.slice(0, 7);
    const fin = hasta.slice(0, 7);
    while (m <= fin) {
      claves.push(m);
      const [y, mes] = m.split("-").map(Number);
      m = mes === 12 ? `${y + 1}-01` : `${y}-${String(mes + 1).padStart(2, "0")}`;
    }
  }
  const serie = new Map(
    claves.map((c) => [
      c,
      { clave: c, etiqueta: porDia ? `${c.slice(8)}/${c.slice(5, 7)}` : `${c.slice(5)}/${c.slice(0, 4)}`, total: 0, pedidos: 0 },
    ])
  );
  for (const p of vendidos) {
    const dia = fechaAR(p.creado_en);
    const b = serie.get(porDia ? dia : dia.slice(0, 7));
    if (b) {
      b.total += Number(p.total);
      b.pedidos += 1;
    }
  }

  return {
    facturacion,
    cantidad,
    ticket: cantidad ? facturacion / cantidad : 0,
    pendientes: pedidos.filter((p) => p.estado === "pendiente").length,
    cancelados: pedidos.filter((p) => p.estado === "cancelado").length,
    ranking: [...ranking.values()].sort((a, b) => b.unidades - a.unidades || b.monto - a.monto),
    serie: [...serie.values()],
    porDia,
  };
}
