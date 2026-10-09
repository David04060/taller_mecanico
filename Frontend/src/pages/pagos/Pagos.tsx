import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import "../Gestion.css";
interface Pago {
  id: number;
  orden_id: number;
  orden_codigo: string;
  placa: string;
  cliente_nombres: string;
  cliente_apellidos: string;
  metodo_pago: string;
  monto: string | number;
  referencia: string | null;
  fecha: string;
  registrado_por_nombres: string;
  registrado_por_apellidos: string;
}
export default function Pagos() {
  const [pagos, setPagos] = useState<Pago[]>([]),
    [total, setTotal] = useState(0),
    [busqueda, setBusqueda] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    api
      .get("/pagos")
      .then(({ data }) => {
        setPagos(data.pagos ?? []);
        setTotal(Number(data.total ?? 0));
      })
      .catch((e) =>
        setError(
          e.response?.data?.mensaje ?? "No se pudieron cargar los pagos.",
        ),
      );
  }, []);
  const filtrados = useMemo(
    () =>
      pagos.filter((p) =>
        `${p.orden_codigo} ${p.placa} ${p.cliente_nombres} ${p.cliente_apellidos} ${p.metodo_pago}`
          .toLowerCase()
          .includes(busqueda.toLowerCase()),
      ),
    [pagos, busqueda],
  );
  return (
    <section className="gestion">
      <div className="gestion-encabezado">
        <div>
          <h2>Pagos</h2>
          <p>Historial consolidado de ingresos del taller.</p>
        </div>
      </div>
      {error && <div className="mensaje-error">{error}</div>}
      <div className="tarjetas-resumen">
        <div className="tarjeta-resumen">
          <span>Pagos registrados</span>
          <strong>{pagos.length}</strong>
        </div>
        <div className="tarjeta-resumen">
          <span>Total acumulado</span>
          <strong>S/ {total.toFixed(2)}</strong>
        </div>
      </div>
      <div className="filtros">
        <input
          placeholder="Buscar orden, placa, cliente o método"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>
      <div className="tabla-contenedor">
        <table className="tabla-gestion">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Orden</th>
              <th>Cliente</th>
              <th>Vehículo</th>
              <th>Método</th>
              <th>Referencia</th>
              <th>Monto</th>
              <th>Registrado por</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p) => (
              <tr key={p.id}>
                <td>{new Date(p.fecha).toLocaleString("es-PE")}</td>
                <td>{p.orden_codigo}</td>
                <td>
                  {p.cliente_nombres} {p.cliente_apellidos}
                </td>
                <td>{p.placa}</td>
                <td>{p.metodo_pago}</td>
                <td>{p.referencia ?? "—"}</td>
                <td>
                  <strong>S/ {Number(p.monto).toFixed(2)}</strong>
                </td>
                <td>
                  {p.registrado_por_nombres} {p.registrado_por_apellidos}
                </td>
              </tr>
            ))}
            {!filtrados.length && (
              <tr>
                <td colSpan={8}>No hay pagos.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
