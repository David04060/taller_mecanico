import { useEffect, useState } from "react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import "../Gestion.css";
interface Cliente {
  id: number;
  dni: string;
  nombres: string;
  apellidos: string;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
}
interface Vehiculo {
  id: number;
  placa: string;
  marca: string;
  modelo: string;
  anio: number | null;
  color: string | null;
  activo: boolean;
}
interface Orden {
  id: number;
  codigo: string;
  placa: string;
  marca: string;
  modelo: string;
  estado: string;
  problema_reportado: string;
  diagnostico: string | null;
  fecha_ingreso: string;
  total: number | string;
  total_pagado: number | string;
  saldo_pendiente: number | string;
}
interface Pago {
  pago_id: number;
  orden_codigo: string;
  placa: string;
  metodo_pago: string;
  monto: number | string;
  fecha_pago: string;
}
export default function MiCuenta() {
  const navegar = useNavigate();
  const [cliente, setCliente] = useState<Cliente | null>(null),
    [vehiculos, setVehiculos] = useState<Vehiculo[]>([]),
    [ordenes, setOrdenes] = useState<Orden[]>([]),
    [pagos, setPagos] = useState<Pago[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    Promise.all([
      api.get("/clientes/mis-datos"),
      api.get("/clientes/mis-vehiculos"),
      api.get("/clientes/mis-ordenes"),
      api.get("/clientes/mis-pagos"),
    ])
      .then(([c, v, o, p]) => {
        setCliente(c.data.cliente);
        setVehiculos(v.data.vehiculos ?? []);
        setOrdenes(o.data.ordenes ?? []);
        setPagos(p.data.pagos ?? []);
      })
      .catch((e) =>
        setError(
          e.response?.data?.mensaje ?? "No se pudo cargar su información.",
        ),
      );
  }, []);
  return (
    <section className="gestion">
      <div className="gestion-encabezado">
        <div>
          <h2>Mi cuenta</h2>
          <p>Seguimiento de sus vehículos, reparaciones y pagos.</p>
        </div>
      </div>
      {error && <div className="mensaje-error">{error}</div>}
      {cliente && (
        <div className="panel">
          <h3>
            {cliente.nombres} {cliente.apellidos}
          </h3>
          <div className="formulario-grid">
            <div>
              <strong>DNI:</strong> {cliente.dni}
            </div>
            <div>
              <strong>Teléfono:</strong> {cliente.telefono ?? "—"}
            </div>
            <div>
              <strong>Correo:</strong> {cliente.email ?? "—"}
            </div>
            <div>
              <strong>Dirección:</strong> {cliente.direccion ?? "—"}
            </div>
          </div>
        </div>
      )}
      <div>
        <h3>Mis vehículos</h3>
        <div className="tarjetas-resumen">
          {vehiculos.map((v) => (
            <div className="tarjeta-resumen" key={v.id}>
              <span>{v.placa}</span>
              <strong style={{ fontSize: "1.1rem" }}>
                {v.marca} {v.modelo}
              </strong>
              <small>
                {v.anio ?? ""} {v.color ?? ""}
              </small>
            </div>
          ))}
          {!vehiculos.length && <p>No tiene vehículos registrados.</p>}
        </div>
      </div>
      <div>
        <h3>Mis órdenes</h3>
        <div className="tabla-contenedor">
          <table className="tabla-gestion">
            <thead>
              <tr>
                <th>Código</th>
                <th>Vehículo</th>
                <th>Ingreso</th>
                <th>Estado</th>
                <th>Problema / diagnóstico</th>
                <th>Total</th>
                <th>Pagado</th>
                <th>Pendiente</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {ordenes.map((o) => (
                <tr key={o.id}>
                  <td>
                    <strong>{o.codigo}</strong>
                  </td>
                  <td>
                    {o.placa}
                    <br />
                    <small>
                      {o.marca} {o.modelo}
                    </small>
                  </td>
                  <td>
                    {new Date(o.fecha_ingreso).toLocaleDateString("es-PE")}
                  </td>
                  <td>
                    <span className="estado activo">{o.estado}</span>
                  </td>
                  <td>
                    {o.problema_reportado}
                    <br />
                    <small>{o.diagnostico || "Diagnóstico pendiente"}</small>
                  </td>
                  <td>S/ {Number(o.total).toFixed(2)}</td>
                  <td>S/ {Number(o.total_pagado).toFixed(2)}</td>
                  <td>S/ {Number(o.saldo_pendiente).toFixed(2)}</td>
                  <td>
                    <button
                      className="boton-secundario"
                      onClick={() => navegar(`/mi-cuenta/ordenes/${o.id}`)}
                    >
                      Ver seguimiento
                    </button>
                  </td>
                </tr>
              ))}
              {!ordenes.length && (
                <tr>
                  <td colSpan={9}>No tiene órdenes registradas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <h3>Mis pagos</h3>
        <div className="tabla-contenedor">
          <table className="tabla-gestion">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Orden</th>
                <th>Vehículo</th>
                <th>Método</th>
                <th>Monto</th>
              </tr>
            </thead>
            <tbody>
              {pagos.map((p) => (
                <tr key={p.pago_id}>
                  <td>{new Date(p.fecha_pago).toLocaleString("es-PE")}</td>
                  <td>{p.orden_codigo}</td>
                  <td>{p.placa}</td>
                  <td>{p.metodo_pago}</td>
                  <td>S/ {Number(p.monto).toFixed(2)}</td>
                </tr>
              ))}
              {!pagos.length && (
                <tr>
                  <td colSpan={5}>No tiene pagos registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
