export const TZ = "America/Argentina/Buenos_Aires";

export const ESTADOS = ["pendiente", "pagado", "entregado", "cancelado"];
// Estados que cuentan como venta concretada (para facturación y ranking)
export const VENDIDOS = ["pagado", "entregado"];
export const ETIQUETA = {
  pendiente: "Pendiente",
  pagado: "Pagado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export const pesos = (n) =>
  "$" + Number(n || 0).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export const numeroPedido = (n) => "#" + String(n ?? 0).padStart(4, "0");

export function fechaHora(iso) {
  if (!iso) return "—";
  return new Date(iso)
    .toLocaleString("es-AR", {
      timeZone: TZ,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace(",", "");
}

// ----- Fechas en hora argentina (UTC-3, sin horario de verano) -----
const TRES_HORAS = 3 * 3600 * 1000;

export const fechaAR = (iso) => new Date(new Date(iso).getTime() - TRES_HORAS).toISOString().slice(0, 10);
export const hoyAR = () => fechaAR(new Date().toISOString());
export const inicioDia = (ymd) => `${ymd}T00:00:00-03:00`;
export const finDia = (ymd) => `${ymd}T23:59:59.999-03:00`;

export function esFecha(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s || "") && !Number.isNaN(new Date(`${s}T12:00:00Z`).getTime());
}

export function sumarDias(ymd, n) {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function diasEntre(a, b) {
  return Math.round((new Date(`${b}T12:00:00Z`) - new Date(`${a}T12:00:00Z`)) / 86400000);
}
