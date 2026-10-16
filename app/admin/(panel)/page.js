import Link from "next/link";
import styles from "@/app/admin/admin.module.css";
import Badge from "@/components/admin/Badge";
import { exigirSesion } from "@/lib/admin-auth";
import { POR_PAGINA, aQueryString, buscarPedidos, leerFiltros, resumenEstados } from "@/lib/pedidos-admin";
import { facturadoDelMes } from "@/lib/metricas";
import { ESTADOS, ETIQUETA, fechaHora, numeroPedido, pesos } from "@/lib/formato";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pedidos · Panel ViWa" };

export default async function PedidosPage({ searchParams }) {
  const sesion = await exigirSesion();
  const esAdmin = sesion.rol === "admin";
  const f = leerFiltros(await searchParams);

  const [{ pedidos, total, error }, resumen, facturado] = await Promise.all([
    buscarPedidos(f),
    resumenEstados(),
    esAdmin ? facturadoDelMes().catch(() => null) : Promise.resolve(null),
  ]);

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const hayFiltros = Boolean(f.q || f.estado || f.tipo || f.desde || f.hasta);

  return (
    <div>
      <div className={styles.encabezado}>
        <h1 className={styles.titulo}>Pedidos</h1>
        {esAdmin && (
          <a className={`${styles.btn} ${styles.btnClaro}`} href={`/api/admin/exportar${aQueryString(f)}`}>
            Exportar a Excel (CSV)
          </a>
        )}
      </div>

      {error && (
        <div className={`${styles.aviso} ${styles.avisoError}`} role="alert">
          No se pudieron cargar los pedidos. Revisá la conexión con Supabase y que se haya corrido el SQL del panel.
        </div>
      )}

      <div className={styles.kpis}>
        <div className={styles.kpi}>
          <span className={styles.kpiTitulo}>Pendientes de pago</span>
          <span className={styles.kpiNumero}>{resumen.pendientes}</span>
        </div>
        <div className={styles.kpi}>
          <span className={styles.kpiTitulo}>Pagados sin entregar</span>
          <span className={styles.kpiNumero}>{resumen.pagados}</span>
        </div>
        <div className={styles.kpi}>
          <span className={styles.kpiTitulo}>Entregados</span>
          <span className={styles.kpiNumero}>{resumen.entregados}</span>
        </div>
        {esAdmin && (
          <div className={styles.kpi}>
            <span className={styles.kpiTitulo}>Facturado este mes</span>
            <span className={styles.kpiNumero}>{facturado === null ? "—" : pesos(facturado)}</span>
          </div>
        )}
      </div>

      <form className={styles.filtros} method="GET" action="/admin">
        <label className={`${styles.campo} ${styles.campoAncho}`}>
          Buscar
          <input
            className={styles.input}
            type="search"
            name="q"
            defaultValue={f.q}
            placeholder="Cliente, email o N° de pedido"
            maxLength={80}
          />
        </label>
        <label className={styles.campo}>
          Estado
          <select className={styles.input} name="estado" defaultValue={f.estado}>
            <option value="">Todos</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {ETIQUETA[e]}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.campo}>
          Tipo
          <select className={styles.input} name="tipo" defaultValue={f.tipo}>
            <option value="">Todos</option>
            <option value="fisico">Físico</option>
            <option value="digital">Digital (ebook)</option>
          </select>
        </label>
        <label className={styles.campo}>
          Desde
          <input className={styles.input} type="date" name="desde" defaultValue={f.desde} />
        </label>
        <label className={styles.campo}>
          Hasta
          <input className={styles.input} type="date" name="hasta" defaultValue={f.hasta} />
        </label>
        <button type="submit" className={styles.btn}>
          Filtrar
        </button>
        {hayFiltros && (
          <Link href="/admin" className={styles.linkSuave}>
            Limpiar filtros
          </Link>
        )}
      </form>

      {pedidos.length === 0 ? (
        <div className={styles.panel}>
          {hayFiltros ? "No hay pedidos que coincidan con esos filtros." : "Todavía no hay pedidos."}
        </div>
      ) : (
        <div className={styles.tablaWrap}>
          <table className={styles.tabla}>
            <thead>
              <tr>
                <th>N°</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Qué compró</th>
                <th>Tipo</th>
                <th>Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link className={styles.enlaceNumero} href={`/admin/pedidos/${p.id}`}>
                      {numeroPedido(p.numero)}
                    </Link>
                  </td>
                  <td className={styles.noCorta}>{fechaHora(p.creado_en)}</td>
                  <td>
                    {p.cliente_nombre || "—"}
                    <br />
                    <span className={styles.mail}>{p.cliente_email || "—"}</span>
                  </td>
                  <td>
                    {(p.pedido_items || []).length === 0 ? (
                      "—"
                    ) : (
                      <ul className={styles.listaItems}>
                        {p.pedido_items.map((it, i) => (
                          <li key={i}>
                            {it.cantidad} × {it.producto_nombre}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td>{p.tipo_producto === "digital" ? "Digital" : "Físico"}</td>
                  <td className={styles.noCorta}>{pesos(p.total)}</td>
                  <td>
                    <Badge estado={p.estado} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPaginas > 1 && (
        <div className={styles.paginacion}>
          {f.pagina > 1 ? (
            <Link className={styles.linkSuave} href={`/admin${aQueryString(f, { pagina: f.pagina - 1 })}`}>
              ‹ Anterior
            </Link>
          ) : (
            <span />
          )}
          <span>
            Página {f.pagina} de {totalPaginas} · {total} pedidos
          </span>
          {f.pagina < totalPaginas ? (
            <Link className={styles.linkSuave} href={`/admin${aQueryString(f, { pagina: f.pagina + 1 })}`}>
              Siguiente ›
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}
