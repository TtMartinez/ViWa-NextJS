import { getSupabaseAdmin } from "@/lib/supabase";
import styles from "./admin.module.css";

// Nunca cachear esta página — cada visita tiene que traer datos frescos.
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabaseAdmin = getSupabaseAdmin();

  const { data: pedidos, error: errorPedidos } = await supabaseAdmin
    .from("pedidos")
    .select("*")
    .order("creado_en", { ascending: false });

  const { data: items, error: errorItems } = await supabaseAdmin
    .from("pedido_items")
    .select("producto_nombre, cantidad");

  // Ranking de productos más vendidos (sumando cantidades por nombre)
  const ranking = {};
  (items || []).forEach((item) => {
    ranking[item.producto_nombre] = (ranking[item.producto_nombre] || 0) + item.cantidad;
  });
  const topProductos = Object.entries(ranking).sort((a, b) => b[1] - a[1]).slice(0, 10);

  const totalPedidos = pedidos?.length || 0;
  const totalPagado = (pedidos || [])
    .filter((p) => p.estado === "pagado")
    .reduce((acc, p) => acc + Number(p.total), 0);

  return (
    <div className={styles.wrapper}>
      <h1>Panel de pedidos — ViWa</h1>

      {(errorPedidos || errorItems) && (
        <p className={styles.error}>
          No se pudo consultar Supabase. Revisá que SUPABASE_URL y SUPABASE_SECRET_KEY estén
          bien configuradas.
        </p>
      )}

      <div className={styles.resumen}>
        <div className={styles.card}>
          <span className={styles.cardNumero}>{totalPedidos}</span>
          <span>Pedidos totales</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardNumero}>${totalPagado.toLocaleString("es-AR")}</span>
          <span>Facturado (pedidos pagados)</span>
        </div>
      </div>

      <h2>Productos más vendidos</h2>
      {topProductos.length === 0 ? (
        <p>Todavía no hay ventas registradas.</p>
      ) : (
        <table className={styles.tabla}>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Unidades vendidas</th>
            </tr>
          </thead>
          <tbody>
            {topProductos.map(([nombre, cantidad]) => (
              <tr key={nombre}>
                <td>{nombre}</td>
                <td>{cantidad}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Pedidos</h2>
      {totalPedidos === 0 ? (
        <p>Todavía no hay pedidos.</p>
      ) : (
        <table className={styles.tabla}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Email</th>
              <th>Tipo</th>
              <th>Total</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((p) => (
              <tr key={p.id}>
                <td>{new Date(p.creado_en).toLocaleString("es-AR")}</td>
                <td>{p.cliente_nombre || "—"}</td>
                <td>{p.cliente_email || "—"}</td>
                <td>{p.tipo_producto}</td>
                <td>${Number(p.total).toLocaleString("es-AR")}</td>
                <td>
                  <span className={`${styles.badge} ${styles["estado_" + p.estado]}`}>
                    {p.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
