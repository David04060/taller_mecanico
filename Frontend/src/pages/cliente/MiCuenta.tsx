import { useEffect, useState } from "react";
import api from "../../services/api";
import { Link, useNavigate } from "react-router-dom";
import { cargarPortalCliente, type ApartadoCliente, type DatosPortal } from "./portalCliente";
import Icono from "../../components/design/Icono";
import "./PortalCliente.css";
import "../Gestion.css";
const encabezados = {
  resumen: ["Vista general", "Su taller, sus vehículos y el estado de sus reparaciones."],
  vehiculos: ["Mis vehículos", "Consulte los vehículos registrados a su nombre."],
  ordenes: ["Mis órdenes", "Siga el progreso de sus reparaciones y consulte cada detalle."],
  pagos: ["Mis pagos", "Consulte los pagos registrados en sus órdenes de trabajo."],
};
export default function MiCuenta({ apartado = "resumen" }: { apartado?: ApartadoCliente }) {
  const navegar = useNavigate();
  const [datos, setDatos] = useState<DatosPortal>({ vehiculos: [], ordenes: [], pagos: [] });
  const [cargando, setCargando] = useState(true), [error, setError] = useState("");
  const [intento, setIntento] = useState(0);
  const { vehiculos, ordenes, pagos } = datos;
  useEffect(() => {
    let vigente = true;
    setCargando(true); setError("");
    cargarPortalCliente(apartado, ruta => api.get(ruta))
      .then(resultado => { if (vigente) setDatos(resultado); })
      .catch(e => { if (vigente) setError(e.response?.data?.mensaje ?? "No se pudo cargar su información."); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [apartado, intento]);
  return (
    <section className="gestion">
      <div className="gestion-encabezado">
        <div>
          <h2>{encabezados[apartado][0]}</h2>
          <p>{encabezados[apartado][1]}</p>
        </div>
      </div>
      {cargando && <div className="panel" role="status">Cargando su información…</div>}
      {!cargando && error && <div className="panel"><p className="mensaje-error" role="alert">{error}</p><button className="boton-secundario" onClick={() => setIntento(valor => valor + 1)}>Reintentar</button></div>}
      {!cargando && !error && <>
      {apartado === "resumen" && <>
        <div className="tarjetas-resumen portal-metricas">
          <article className="tarjeta-resumen"><span>Vehículos registrados</span><strong>{vehiculos.length}</strong><small>Sus vehículos en el taller</small></article>
          <article className="tarjeta-resumen"><span>Órdenes de trabajo</span><strong>{ordenes.length}</strong><small>Su historial de reparaciones</small></article>
          <article className="tarjeta-resumen"><span>Saldo pendiente</span><strong>S/ {ordenes.reduce((suma, orden) => suma + Number(orden.saldo_pendiente), 0).toFixed(2)}</strong><small>Saldo de sus órdenes</small></article>
        </div>
        <section className="panel"><h3>Acceda a sus apartados</h3><p className="portal-descripcion">Toda su información, organizada en un lugar propio.</p>
          <div className="portal-accesos">
            <Link to="/mi-cuenta/vehiculos"><span className="portal-icono"><Icono nombre="vehiculos" /></span><strong>Mis vehículos</strong><span>Datos de sus vehículos registrados</span><span className="portal-ir">Ver vehículos →</span></Link>
            <Link to="/mi-cuenta/ordenes"><span className="portal-icono"><Icono nombre="ordenes" /></span><strong>Mis órdenes</strong><span>Reparaciones, servicios y seguimiento</span><span className="portal-ir">Ver órdenes →</span></Link>
            <Link to="/mi-cuenta/pagos"><span className="portal-icono"><Icono nombre="pagos" /></span><strong>Mis pagos</strong><span>Historial de los pagos de sus órdenes</span><span className="portal-ir">Ver pagos →</span></Link>
          </div>
        </section>
        <div className="panel portal-contacto"><div><h3>Su información de contacto</h3><p className="portal-descripcion">Actualice sus datos personales desde su perfil.</p></div><Link className="portal-enlace-perfil" to="/mi-perfil">Editar mi perfil →</Link></div>
      </>}
      {apartado === "vehiculos" && <div>
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
      </div>}
      {apartado === "ordenes" && <div>
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
                    <span className="estado portal-estado">{o.estado}</span>
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
      </div>}
      {apartado === "pagos" && <div>
        <div className="panel portal-total-pagos"><span>Total de pagos registrados</span><strong>S/ {pagos.reduce((suma, pago) => suma + Number(pago.monto), 0).toFixed(2)}</strong></div>
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
      </div>}
      </>}
    </section>
  );
}
