import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "@/app/admin/admin.module.css";
import Badge from "@/components/admin/Badge";
import BotonConfirmar from "@/components/admin/BotonConfirmar";
import { exigirSesion } from "@/lib/admin-auth";
import { obtenerPedido } from "@/lib/pedidos-admin";
import { ESTADOS, ETIQUETA, fechaHora, numeroPedido, pesos } from "@/lib/formato";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pedido · Panel ViWa" };

const OK = {
  estado: "Estado actualizado.",
  nota: "Nota guardada.",
  ebook: "Ebook reenviado al cliente.",
};
const ERROR = {
  db: "No se pudo guardar el cambio. Intentá de nuevo.",
  estado_invalido: "Estado no válido.",
  estado_igual: "El pedido ya estaba en ese estado.",
  ebook_no_aplica: "Este pedido no tiene un ebook pagado para reenviar.",
  ebook_fallo: "No se pudo enviar el ebook. Revisá la configuración del mail (Resend) y del archivo.",
  accion_invalida: "Acción no válida.",
};

const primero = (v) => (Array.isArray(v) ? v[0] : v);

export default async function PedidoDetalle({ params, searchParams }) {
  await exigirSesion();
  const { id } = await params;
  const sp = await searchParams;

  const datos = await obtenerPedido(id);
  if (!datos) notFound();
  const { pedido: p, eventos } = datos;

  const okMsg = OK[primero(sp?.ok)];
  const errMsg = ERROR[primero(sp?.error)];

  const items = p.pedido_items || [];
  const tieneEbook = items.some((i) => i.es_digital);
  const accion = `/api/admin/pedidos/${p.id}`;
  const puedeEbook = tieneEbook && ["pagado", "entregado"].includes(p.estado);

  let pagoTexto;
  if (p.mp_payment_id) pagoTexto = "Aprobado por Mercado Pago";
  else if (p.estado === "pendiente") pagoTexto = "Esperando el pago";
  else if (p.estado === "cancelado") pagoTexto = "Cancelado, sin pago registrado";
  else pagoTexto = "Marcado como pagado a mano";

  const vence =
    p.estado === "pendiente" ? fechaHora(new Date(new Date(p.creado_en).getTime() + 24 * 3600 * 1000)) : null;

  return (
    <div>
      <Link href="/admin" className={styles.linkSuave}>
        ‹ Volver a pedidos
      </Link>

      <div className={styles.encabezado}>
        <div className={styles.tituloFila}>
          <h1 className={styles.titulo}>Pedido {numeroPedido(p.numero)}</h1>
          <Badge estado={p.estado} />
          <span className={styles.etiqueta}>{p.tipo_producto === "digital" ? "Digital" : "Físico"}</span>
        </div>
        <span className={styles.mail}>Creado el {fechaHora(p.creado_en)}</span>
      </div>

      {okMsg && (
        <div className={`${styles.aviso} ${styles.avisoOk}`} role="status">
          {okMsg}
        </div>
      )}
      {errMsg && (
        <div className={`${styles.aviso} ${styles.avisoError}`} role="alert">
          {errMsg}
        </div>
      )}

      <div className={styles.detalle}>
        <div>
          <div className={styles.panel}>
            <h2 className={styles.panelTitulo}>Qué compró</h2>
            <div className={styles.tablaWrap}>
              <table className={styles.tabla}>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cant.</th>
                    <th>Precio</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i}>
                      <td>
                        {it.producto_nombre}
                        {it.es_digital && <span className={styles.etiqueta}>Ebook</span>}
                      </td>
                      <td>{it.cantidad}</td>
                      <td>{pesos(it.precio)}</td>
                      <td>{pesos(it.cantidad * Number(it.precio))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.totalFila}>Total: {pesos(p.total)}</div>
          </div>

          <div className={styles.dosColumnas}>
            <div className={styles.panel}>
              <h2 className={styles.panelTitulo}>Cliente</h2>
              <div className={styles.dato}>{p.cliente_nombre || "—"}</div>
              {p.cliente_email && (
                <a className={styles.linkSuave} href={`mailto:${p.cliente_email}`}>
                  {p.cliente_email}
                </a>
              )}
            </div>
            <div className={styles.panel}>
              <h2 className={styles.panelTitulo}>Pago</h2>
              <div className={styles.dato}>{pagoTexto}</div>
              {p.mp_payment_id && <span className={styles.mail}>ID de pago: {p.mp_payment_id}</span>}
              {vence && <span className={styles.mail}>El link de pago vence el {vence}</span>}
            </div>
          </div>

          <div className={styles.panel}>
            <h2 className={styles.panelTitulo}>Historial</h2>
            <ul className={styles.historial}>
              <li>
                <span className={styles.mail}>{fechaHora(p.creado_en)}</span> Pedido creado
              </li>
              {eventos.map((e, i) => (
                <li key={i}>
                  <span className={styles.mail}>{fechaHora(e.creado_en)}</span> {e.evento}
                  {e.usuario && <span className={styles.mail}> · {e.usuario}</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <div className={styles.panel}>
            <h2 className={styles.panelTitulo}>Cambiar estado</h2>
            <form method="POST" action={accion} className={styles.formVertical}>
              <input type="hidden" name="accion" value="estado" />
              <select className={styles.input} name="estado" defaultValue={p.estado} aria-label="Nuevo estado">
                {ESTADOS.map((e) => (
                  <option key={e} value={e}>
                    {ETIQUETA[e]}
                  </option>
                ))}
              </select>
              <button type="submit" className={styles.btn}>
                Guardar estado
              </button>
            </form>

            <div className={styles.accionesRapidas}>
              {p.estado === "pagado" && (
                <form method="POST" action={accion}>
                  <input type="hidden" name="accion" value="estado" />
                  <input type="hidden" name="estado" value="entregado" />
                  <button type="submit" className={`${styles.btn} ${styles.btnVerde}`}>
                    Marcar como entregado
                  </button>
                </form>
              )}
              {p.estado !== "cancelado" && (
                <form method="POST" action={accion}>
                  <input type="hidden" name="accion" value="estado" />
                  <input type="hidden" name="estado" value="cancelado" />
                  <BotonConfirmar
                    className={`${styles.btn} ${styles.btnPeligro}`}
                    mensaje="¿Cancelar este pedido? Esto NO devuelve el dinero: si ya fue pagado, la devolución se hace desde Mercado Pago."
                  >
                    Cancelar pedido
                  </BotonConfirmar>
                </form>
              )}
            </div>
          </div>

          {tieneEbook && (
            <div className={styles.panel}>
              <h2 className={styles.panelTitulo}>Ebook</h2>
              <div className={styles.dato}>
                {p.ebook_enviado_en ? `Enviado el ${fechaHora(p.ebook_enviado_en)}` : "Todavía no se envió"}
              </div>
              {puedeEbook ? (
                <form method="POST" action={accion}>
                  <input type="hidden" name="accion" value="reenviar_ebook" />
                  <BotonConfirmar
                    className={`${styles.btn} ${styles.btnClaro}`}
                    mensaje={`¿Enviar el ebook a ${p.cliente_email}?`}
                  >
                    {p.ebook_enviado_en ? "Reenviar ebook" : "Enviar ebook"}
                  </BotonConfirmar>
                </form>
              ) : (
                <span className={styles.mail}>Se puede enviar cuando el pedido esté pagado.</span>
              )}
            </div>
          )}

          <div className={styles.panel}>
            <h2 className={styles.panelTitulo}>Nota interna</h2>
            <form method="POST" action={accion} className={styles.formVertical}>
              <input type="hidden" name="accion" value="nota" />
              <textarea
                className={`${styles.input} ${styles.textarea}`}
                name="nota"
                defaultValue={p.nota || ""}
                maxLength={1000}
                rows={4}
                placeholder="Ej: retira el sábado por el local"
                aria-label="Nota interna"
              />
              <button type="submit" className={`${styles.btn} ${styles.btnClaro}`}>
                Guardar nota
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
