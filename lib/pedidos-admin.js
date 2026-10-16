import { getSupabaseAdmin } from "@/lib/supabase";
import { ESTADOS, esFecha, inicioDia, finDia } from "@/lib/formato";

export const POR_PAGINA = 25;
const COLUMNAS = "*, pedido_items(producto_nombre, cantidad, precio, es_digital)";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const primero = (v) => (Array.isArray(v) ? v[0] : v) || "";

// Lee y valida los filtros que vienen en la dirección (?q=...&estado=...).
export function leerFiltros(sp = {}) {
  const q = primero(sp.q).trim().slice(0, 80);
  const estado = ESTADOS.includes(primero(sp.estado)) ? primero(sp.estado) : "";
  const tipo = ["fisico", "digital"].includes(primero(sp.tipo)) ? primero(sp.tipo) : "";
  const desde = esFecha(primero(sp.desde)) ? primero(sp.desde) : "";
  const hasta = esFecha(primero(sp.hasta)) ? primero(sp.hasta) : "";
  const pagina = Math.max(1, parseInt(primero(sp.pagina), 10) || 1);
  return { q, estado, tipo, desde, hasta, pagina };
}

// Vuelve a armar "?q=...&estado=..." a partir de los filtros.
export function aQueryString(f, extra = {}) {
  const p = new URLSearchParams();
  for (const k of ["q", "estado", "tipo", "desde", "hasta"]) if (f[k]) p.set(k, f[k]);
  for (const [k, v] of Object.entries(extra)) if (v) p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
}

function aplicarFiltros(query, f) {
  if (f.estado) query = query.eq("estado", f.estado);
  if (f.tipo) query = query.eq("tipo_producto", f.tipo);
  if (f.desde) query = query.gte("creado_en", inicioDia(f.desde));
  if (f.hasta) query = query.lte("creado_en", finDia(f.hasta));
  if (f.q) {
    // Sacamos los caracteres que tienen significado especial en el filtro.
    const s = f.q.replace(/[,()*%\\:"']/g, " ").trim();
    if (s) {
      const partes = [`cliente_nombre.ilike."*${s}*"`, `cliente_email.ilike."*${s}*"`];
      const n = s.replace(/^#/, "");
      if (/^\d{1,9}$/.test(n)) partes.push(`numero.eq.${parseInt(n, 10)}`);
      query = query.or(partes.join(","));
    }
  }
  return query;
}

export async function buscarPedidos(f) {
  const supabase = getSupabaseAdmin();
  const desde = (f.pagina - 1) * POR_PAGINA;
  const query = aplicarFiltros(supabase.from("pedidos").select(COLUMNAS, { count: "exact" }), f)
    .order("creado_en", { ascending: false })
    .order("id")
    .range(desde, desde + POR_PAGINA - 1);
  const { data, count, error } = await query;
  return { pedidos: data || [], total: count || 0, error };
}

// Todos los pedidos que cumplen los filtros (para exportar). Supabase devuelve de a 1000.
export async function traerTodosPedidos(f, maximo = 20000) {
  const supabase = getSupabaseAdmin();
  const todos = [];
  for (let desde = 0; desde < maximo; desde += 1000) {
    const { data, error } = await aplicarFiltros(supabase.from("pedidos").select(COLUMNAS), f)
      .order("creado_en", { ascending: false })
      .order("id")
      .range(desde, desde + 999);
    if (error) throw error;
    todos.push(...(data || []));
    if ((data || []).length < 1000) break;
  }
  return todos;
}

export async function resumenEstados() {
  const supabase = getSupabaseAdmin();
  const contar = async (estado) => {
    const { count } = await supabase
      .from("pedidos")
      .select("id", { count: "exact", head: true })
      .eq("estado", estado);
    return count || 0;
  };
  const [pendientes, pagados, entregados] = await Promise.all([
    contar("pendiente"),
    contar("pagado"),
    contar("entregado"),
  ]);
  return { pendientes, pagados, entregados };
}

export async function obtenerPedido(id) {
  if (!UUID.test(id)) return null;
  const supabase = getSupabaseAdmin();
  const { data: pedido } = await supabase.from("pedidos").select(COLUMNAS).eq("id", id).maybeSingle();
  if (!pedido) return null;
  const { data: eventos } = await supabase
    .from("pedido_eventos")
    .select("evento, usuario, creado_en")
    .eq("pedido_id", id)
    .order("creado_en", { ascending: true });
  return { pedido, eventos: eventos || [] };
}
