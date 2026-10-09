import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import { useAutenticacion } from "../../hooks/useAutenticacion";
import "./Dashboard.css";

interface ResumenDashboard {
  ordenes: Record<string, number> & { total: number };
  clientes: number;
  vehiculos: number;
  mecanicos: number;
  repuestos_bajo_stock: number;
  ingresos: number | string;
}
const nombres: Record<string, string> = {
  recibidas: "Recibidas",
  en_diagnostico: "En diagnóstico",
  esperando_aprobacion: "Esperando aprobación",
  en_reparacion: "En reparación",
  listas_para_entrega: "Listas para entrega",
  entregadas: "Entregadas",
  canceladas: "Canceladas",
};

export default function Dashboard() {
  const { usuario } = useAutenticacion();
  const [hoy] = useState(() => new Date());
  const [resumen, setResumen] = useState<ResumenDashboard | null>(null),
    [cargando, setCargando] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    api
      .get("/dashboard/resumen")
      .then(({ data }) => setResumen(data))
      .catch((e) =>
        setError(
          e.response?.data?.mensaje ??
            "No se pudo cargar el resumen del sistema.",
        ),
      )
      .finally(() => setCargando(false));
  }, []);
  const estados = useMemo(
    () =>
      resumen
        ? Object.entries(resumen.ordenes).filter(([k]) => k !== "total")
        : [],
    [resumen],
  );
  if (cargando)
    return (
      <div className="dash-cargando">Preparando el resumen del taller...</div>
    );
  if (error || !resumen)
    return (
      <div className="dash-error">
        {error || "No hay información disponible."}
      </div>
    );
  const total = Math.max(Number(resumen.ordenes.total), 1);
  return (
    <section className="dash">
      <header className="dash-bienvenida">
        <div>
          <span className="dash-saludo">Resumen del taller</span>
          <h2>Hola, {usuario?.nombres}</h2>
          <p>
            Una vista clara de la operación y las tareas que requieren atención.
          </p>
        </div>
        <div className="dash-fecha">
          <span>
            {new Intl.DateTimeFormat("es-PE", { weekday: "long" }).format(hoy)}
          </span>
          <strong>
            {new Intl.DateTimeFormat("es-PE", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            }).format(hoy)}
          </strong>
        </div>
      </header>
      <div className="dash-metricas">
        <article>
          <span className="dash-icono tono-verde">CL</span>
          <div>
            <small>Clientes activos</small>
            <strong>{resumen.clientes}</strong>
            <p>registrados en el taller</p>
          </div>
        </article>
        <article>
          <span className="dash-icono tono-azul">VH</span>
          <div>
            <small>Vehículos activos</small>
            <strong>{resumen.vehiculos}</strong>
            <p>en la base de clientes</p>
          </div>
        </article>
        <article>
          <span className="dash-icono tono-gris">MC</span>
          <div>
            <small>Mecánicos activos</small>
            <strong>{resumen.mecanicos}</strong>
            <p>disponibles para órdenes</p>
          </div>
        </article>
        <article
          className={
            resumen.repuestos_bajo_stock > 0 ? "requiere-atencion" : ""
          }
        >
          <span className="dash-icono tono-arena">ST</span>
          <div>
            <small>Stock bajo</small>
            <strong>{resumen.repuestos_bajo_stock}</strong>
            <p>
              {resumen.repuestos_bajo_stock > 0
                ? "requieren revisión"
                : "sin alertas pendientes"}
            </p>
          </div>
        </article>
      </div>
      <div className="dash-contenido">
        <section className="dash-panel dash-ordenes">
          <div className="dash-panel-cabecera">
            <div>
              <h3>Órdenes por estado</h3>
              <p>{resumen.ordenes.total} órdenes registradas en total</p>
            </div>
            <span className="dash-total">{resumen.ordenes.total}</span>
          </div>
          <div className="dash-estados">
            {estados.map(([clave, cantidad]) => (
              <div className="dash-estado" key={clave}>
                <div className="dash-estado-texto">
                  <span>
                    <i className={`punto punto-${clave}`}></i>
                    {nombres[clave] ?? clave}
                  </span>
                  <strong>{cantidad}</strong>
                </div>
                <div className="dash-barra">
                  <span
                    className={`barra-${clave}`}
                    style={{
                      width: `${Math.max((Number(cantidad) / total) * 100, Number(cantidad) > 0 ? 4 : 0)}%`,
                    }}
                  ></span>
                </div>
              </div>
            ))}
          </div>
        </section>
        <aside className="dash-lateral">
          <section className="dash-panel dash-ingresos">
            <span>Ingresos registrados</span>
            <strong>
              S/{" "}
              {Number(resumen.ingresos).toLocaleString("es-PE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </strong>
            <p>Suma de todos los pagos recibidos</p>
            <div className="dash-ingresos-marca">
              Actualizado con los pagos del sistema
            </div>
          </section>
          <section className="dash-panel dash-atencion">
            <h3>Atención necesaria</h3>
            {resumen.repuestos_bajo_stock > 0 ? (
              <>
                <strong>{resumen.repuestos_bajo_stock} repuestos</strong>
                <p>alcanzaron o bajaron de su nivel mínimo de inventario.</p>
              </>
            ) : (
              <>
                <strong>Todo en orden</strong>
                <p>No existen alertas de inventario en este momento.</p>
              </>
            )}
          </section>
        </aside>
      </div>
    </section>
  );
}
