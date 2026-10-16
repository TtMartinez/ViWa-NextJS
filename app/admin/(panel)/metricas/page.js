import Link from "next/link";
import styles from "@/app/admin/admin.module.css";
import { exigirSesion } from "@/lib/admin-auth";
import { PERIODOS, calcular, resolverPeriodo, traerPedidosRango, variacion } from "@/lib/metricas";
import { pesos } from "@/lib/formato";

export const dynamic = "force-dynamic";
export const metadata = { title: "Métricas · Panel ViWa" };

const fmtFecha = (ymd) => `${ymd.slice(8)}/${ymd.slice(5, 7)}/${ymd.slice(0, 4)}`;

function Delta({ actual, anterior }) {
  const v = variacion(actual, anterior);
  if (v === null) return <span className={styles.delta}>Sin datos del período anterior</span>;
  const sube = v >= 0;
  return (
    <span className={`${styles.delta} ${sube ? styles.deltaSube : styles.deltaBaja}`}>
      {sube ? "▲" : "▼"} {Math.abs(v).toFixed(0)}% vs. período anterior
    </span>
  );
}

export default async function MetricasPage({ searchParams }) {
  await exigirSesion({ soloAdmin: true });
  const per = resolverPeriodo(await searchParams);

  let actual = null;
  let previo = null;
  let fallo = false;
  try {
    const [pedidosActual, pedidosPrevio] = await Promise.all([
      traerPedidosRango(per.desde, per.hasta),
      traerPedidosRango(per.desdePrev, per.hastaPrev),
    ]);
    actual = calcular(pedidosActual, per.desde, per.hasta);
    previo = calcular(pedidosPrevio, per.desdePrev, per.hastaPrev);
  } catch (err) {
    console.error("[admin-metricas] Error:", err);
    fallo = true;
  }

  const maxBarra = actual ? Math.max(1, ...actual.serie.map((s) => s.total)) : 1;
  const maxUnidades = actual?.ranking[0]?.unidades || 1;

  return (
    <div>
      <div className={styles.encabezado}>
        <h1 className={styles.titulo}>Métricas de ventas</h1>
        <span className={styles.mail}>
          {fmtFecha(per.desde)} al {fmtFecha(per.hasta)}
        </span>
      </div>

      <div className={styles.chips}>
        {PERIODOS.map((o) => (
          <Link
            key={o.clave}
            href={`/admin/metricas?periodo=${o.clave}`}
            className={`${styles.chip} ${per.clave === o.clave ? styles.chipActivo : ""}`}
          >
            {o.etiqueta}
          </Link>
        ))}
      </div>

      <form className={styles.filtros} method="GET" action="/admin/metricas">
        <label className={styles.campo}>
          Desde
          <input className={styles.input} type="date" name="desde" defaultValue={per.desde} required />
        </label>
        <label className={styles.campo}>
          Hasta
          <input className={styles.input} type="date" name="hasta" defaultValue={per.hasta} required />
        </label>
        <button type="submit" className={`${styles.btn} ${styles.btnClaro}`}>
          Ver período
        </button>
      </form>

      {fallo && (
        <div className={`${styles.aviso} ${styles.avisoError}`} role="alert">
          No se pudieron calcular las métricas. Intentá de nuevo en un momento.
        </div>
      )}

      {actual && (
        <>
          <div className={styles.kpis}>
            <div className={styles.kpi}>
              <span className={styles.kpiTitulo}>Facturación</span>
              <span className={styles.kpiNumero}>{pesos(actual.facturacion)}</span>
              <Delta actual={actual.facturacion} anterior={previo.facturacion} />
            </div>
            <div className={styles.kpi}>
              <span className={styles.kpiTitulo}>Pedidos pagados</span>
              <span className={styles.kpiNumero}>{actual.cantidad}</span>
              <Delta actual={actual.cantidad} anterior={previo.cantidad} />
            </div>
            <div className={styles.kpi}>
              <span className={styles.kpiTitulo}>Ticket promedio</span>
              <span className={styles.kpiNumero}>{pesos(actual.ticket)}</span>
              <span className={styles.delta}>Facturación ÷ pedidos</span>
            </div>
            <div className={styles.kpi}>
              <span className={styles.kpiTitulo}>Pendientes / cancelados</span>
              <span className={styles.kpiNumero}>
                {actual.pendientes} / {actual.cancelados}
              </span>
              <span className={styles.delta}>Pedidos que no se concretaron</span>
            </div>
          </div>

          <div className={styles.panel}>
            <h2 className={styles.panelTitulo}>
              Facturación {actual.porDia ? "por día" : "por mes"}
            </h2>
            {actual.cantidad === 0 ? (
              <span className={styles.mail}>No hay ventas en este período.</span>
            ) : (
              <>
                <div className={styles.grafico} role="img" aria-label="Gráfico de facturación">
                  {actual.serie.map((s) => (
                    <div
                      key={s.clave}
                      className={styles.barra}
                      style={{ height: `${Math.max(1, (s.total / maxBarra) * 100)}%` }}
                      title={`${s.etiqueta}: ${pesos(s.total)} (${s.pedidos} pedidos)`}
                    />
                  ))}
                </div>
                <div className={styles.ejeGrafico}>
                  <span>{actual.serie[0]?.etiqueta}</span>
                  <span>Máximo: {pesos(maxBarra)}</span>
                  <span>{actual.serie[actual.serie.length - 1]?.etiqueta}</span>
                </div>
              </>
            )}
          </div>

          <div className={styles.panel}>
            <h2 className={styles.panelTitulo}>Productos más vendidos</h2>
            {actual.ranking.length === 0 ? (
              <span className={styles.mail}>No hay ventas en este período.</span>
            ) : (
              <div className={styles.tablaWrap}>
                <table className={styles.tabla}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Producto</th>
                      <th>Unidades</th>
                      <th>Facturado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actual.ranking.slice(0, 15).map((r, i) => (
                      <tr key={r.nombre}>
                        <td>{i + 1}</td>
                        <td>
                          {r.nombre}
                          <div className={styles.meter}>
                            <div className={styles.meterRelleno} style={{ width: `${(r.unidades / maxUnidades) * 100}%` }} />
                          </div>
                        </td>
                        <td>{r.unidades}</td>
                        <td>{pesos(r.monto)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <span className={styles.mail}>
            Cuentan como venta los pedidos pagados y entregados, por fecha de creación del pedido.
          </span>
        </>
      )}
    </div>
  );
}
