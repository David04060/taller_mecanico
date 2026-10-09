import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import "./DetalleMiOrden.css";

interface Servicio {
  id: number;
  nombre: string;
  descripcion: string | null;
  cantidad: number;
  precio_unitario: number | string;
  subtotal: number | string;
}
interface Repuesto {
  id: number;
  codigo: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number | string;
  subtotal: number | string;
}
interface Pago {
  id: number;
  metodo_pago: string;
  monto: number | string;
  referencia: string | null;
  fecha: string;
}
interface Historial {
  id: number;
  estado_id: number;
  estado: string;
  comentario: string | null;
  fecha: string;
}
interface OrdenCliente {
  id: number;
  codigo: string;
  vehiculo: {
    id: number;
    placa: string;
    marca: string;
    modelo: string;
    anio: number | null;
    color: string | null;
  };
  estado: { id: number; nombre: string };
  problema_reportado: string;
  diagnostico: string | null;
  observaciones: string | null;
  fecha_ingreso: string;
  fecha_estimada_entrega: string | null;
  fecha_entrega: string | null;
  servicios: Servicio[];
  repuestos: Repuesto[];
  pagos: Pago[];
  resumen_pago: {
    total: number;
    total_pagado: number;
    saldo_pendiente: number;
  };
  historial: Historial[];
}

const estados = [
  { id: 1, nombre: "Recibida", descripcion: "El vehículo ingresó al taller" },
  {
    id: 2,
    nombre: "En diagnóstico",
    descripcion: "Estamos evaluando el vehículo",
  },
  {
    id: 3,
    nombre: "Esperando aprobación",
    descripcion: "El presupuesto está pendiente",
  },
  {
    id: 4,
    nombre: "En reparación",
    descripcion: "Los trabajos están en curso",
  },
  {
    id: 5,
    nombre: "Listo para entrega",
    descripcion: "El vehículo está listo",
  },
  { id: 6, nombre: "Entregado", descripcion: "El vehículo fue entregado" },
  { id: 7, nombre: "Cancelada", descripcion: "La orden fue cancelada" },
];

export default function DetalleMiOrden() {
  const { id } = useParams();
  const navegar = useNavigate();
  const [orden, setOrden] = useState<OrdenCliente | null>(null),
    [cargando, setCargando] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    if (!id) return;
    api
      .get(`/clientes/mis-ordenes/${id}`)
      .then(({ data }) => setOrden(data.orden))
      .catch((e) =>
        setError(e.response?.data?.mensaje ?? "No se pudo cargar la orden."),
      )
      .finally(() => setCargando(false));
  }, [id]);
  if (cargando)
    return (
      <div className="mi-orden-mensaje">Cargando detalle de la orden...</div>
    );
  if (error || !orden)
    return (
      <section className="mi-orden">
        <div className="mi-orden-error">{error || "Orden no encontrada."}</div>
        <button
          className="mi-orden-volver"
          onClick={() => navegar("/mi-cuenta")}
        >
          Volver
        </button>
      </section>
    );
  const cancelada = orden.estado.id === 7;
  const estadoClase = (estadoId: number) => {
    if (estadoId === orden.estado.id) return "actual";
    if (!cancelada && estadoId < orden.estado.id && estadoId !== 7)
      return "completado";
    return "pendiente";
  };
  return (
    <section className="mi-orden">
      <button className="mi-orden-volver" onClick={() => navegar("/mi-cuenta")}>
        ← Volver a mis órdenes
      </button>
      <header className="mi-orden-cabecera">
        <div>
          <span className="mi-orden-etiqueta">Orden de trabajo</span>
          <h2>{orden.codigo}</h2>
          <p>
            {orden.vehiculo.placa} · {orden.vehiculo.marca}{" "}
            {orden.vehiculo.modelo}
          </p>
        </div>
        <span className={`mi-orden-estado estado-${orden.estado.id}`}>
          {orden.estado.nombre}
        </span>
      </header>

      <section className="mi-orden-panel">
        <div className="mi-orden-titulo">
          <h3>Progreso de la orden</h3>
          <p>Puede consultar en qué etapa se encuentra su vehículo.</p>
        </div>
        <ol className={`linea-estados ${cancelada ? "linea-cancelada" : ""}`}>
          {estados.map((estado) => (
            <li key={estado.id} className={estadoClase(estado.id)}>
              <div className="linea-marcador">
                <span>
                  {estadoClase(estado.id) === "completado" ? "✓" : estado.id}
                </span>
              </div>
              <div className="linea-contenido">
                <strong>{estado.nombre}</strong>
                <small>{estado.descripcion}</small>
                {estado.id === orden.estado.id && <em>Estado actual</em>}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="mi-orden-columnas">
        <section className="mi-orden-panel">
          <div className="mi-orden-titulo">
            <h3>Información del trabajo</h3>
          </div>
          <dl className="mi-orden-datos">
            <div>
              <dt>Problema reportado</dt>
              <dd>{orden.problema_reportado}</dd>
            </div>
            <div>
              <dt>Diagnóstico</dt>
              <dd>
                {orden.diagnostico ||
                  "El diagnóstico todavía no ha sido registrado."}
              </dd>
            </div>
            {orden.observaciones && (
              <div>
                <dt>Observaciones</dt>
                <dd>{orden.observaciones}</dd>
              </div>
            )}
            <div>
              <dt>Fecha de ingreso</dt>
              <dd>{new Date(orden.fecha_ingreso).toLocaleString("es-PE")}</dd>
            </div>
            <div>
              <dt>Entrega estimada</dt>
              <dd>
                {orden.fecha_estimada_entrega
                  ? new Date(
                      `${orden.fecha_estimada_entrega}T00:00:00`,
                    ).toLocaleDateString("es-PE")
                  : "Por definir"}
              </dd>
            </div>
          </dl>
        </section>
        <section className="mi-orden-panel mi-orden-resumen">
          <div className="mi-orden-titulo">
            <h3>Resumen de pago</h3>
          </div>
          <div>
            <span>Total de la orden</span>
            <strong>S/ {Number(orden.resumen_pago.total).toFixed(2)}</strong>
          </div>
          <div>
            <span>Total pagado</span>
            <strong>
              S/ {Number(orden.resumen_pago.total_pagado).toFixed(2)}
            </strong>
          </div>
          <div className="saldo">
            <span>Saldo pendiente</span>
            <strong>
              S/ {Number(orden.resumen_pago.saldo_pendiente).toFixed(2)}
            </strong>
          </div>
        </section>
      </div>

      <section className="mi-orden-panel">
        <div className="mi-orden-titulo">
          <h3>Servicios contratados</h3>
          <p>Trabajos incluidos en esta orden.</p>
        </div>
        <div className="mi-orden-tabla-wrap">
          <table className="mi-orden-tabla">
            <thead>
              <tr>
                <th>Servicio</th>
                <th>Descripción</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {orden.servicios.map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong>{s.nombre}</strong>
                  </td>
                  <td>{s.descripcion || "—"}</td>
                  <td>{s.cantidad}</td>
                  <td>S/ {Number(s.precio_unitario).toFixed(2)}</td>
                  <td>S/ {Number(s.subtotal).toFixed(2)}</td>
                </tr>
              ))}
              {!orden.servicios.length && (
                <tr>
                  <td colSpan={5} className="mi-orden-vacio">
                    Aún no se agregaron servicios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mi-orden-panel">
        <div className="mi-orden-titulo">
          <h3>Repuestos adquiridos</h3>
          <p>Repuestos utilizados en la reparación.</p>
        </div>
        <div className="mi-orden-tabla-wrap">
          <table className="mi-orden-tabla">
            <thead>
              <tr>
                <th>Código</th>
                <th>Repuesto</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {orden.repuestos.map((r) => (
                <tr key={r.id}>
                  <td>{r.codigo}</td>
                  <td>
                    <strong>{r.nombre}</strong>
                  </td>
                  <td>{r.cantidad}</td>
                  <td>S/ {Number(r.precio_unitario).toFixed(2)}</td>
                  <td>S/ {Number(r.subtotal).toFixed(2)}</td>
                </tr>
              ))}
              {!orden.repuestos.length && (
                <tr>
                  <td colSpan={5} className="mi-orden-vacio">
                    Aún no se agregaron repuestos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mi-orden-panel">
        <div className="mi-orden-titulo">
          <h3>Historial de actualizaciones</h3>
        </div>
        <div className="mi-orden-historial">
          {orden.historial.map((h) => (
            <div key={h.id}>
              <span></span>
              <p>
                <strong>{h.estado}</strong>
                <small>{new Date(h.fecha).toLocaleString("es-PE")}</small>
                {h.comentario && <em>{h.comentario}</em>}
              </p>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
