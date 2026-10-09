import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import "./OrdenesTrabajo.css";
import { useAutenticacion } from "../../hooks/useAutenticacion";

interface Vehiculo {
  id: number;
  placa: string;
  marca: string;
  modelo: string;
  cliente_id: number;
  cliente_nombres: string;
  cliente_apellidos: string;
  activo: boolean;
}

interface Orden {
  id: number;
  codigo: string;
  vehiculo_id: number;
  placa: string;
  marca: string;
  modelo: string;
  cliente_nombres: string;
  cliente_apellidos: string;
  recepcionista_id: number | null;
  recepcionista_nombres: string | null;
  recepcionista_apellidos: string | null;
  mecanico_id: number | null;
  mecanico_nombres: string | null;
  mecanico_apellidos: string | null;
  estado_id: number;
  estado_nombre: string;
  problema_reportado: string;
  diagnostico: string | null;
  observaciones: string | null;
  fecha_ingreso: string;
  fecha_estimada_entrega: string | null;
  fecha_entrega: string | null;
  total: number;
}

interface FormularioOrden {
  codigo: string;
  vehiculo_id: string;
  problema_reportado: string;
  observaciones: string;
  fecha_estimada_entrega: string;
}

function Ordenes() {
  const navegar = useNavigate();
  const { usuario } = useAutenticacion();
  const rolUsuario = usuario?.rol;
  const puedeCrear =
    rolUsuario === "administrador" || rolUsuario === "recepcionista";
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [guardando, setGuardando] = useState(false);
  const [mensajeFormulario, setMensajeFormulario] = useState("");

  const [formulario, setFormulario] = useState<FormularioOrden>({
    codigo: "",
    vehiculo_id: "",
    problema_reportado: "",
    observaciones: "",
    fecha_estimada_entrega: "",
  });

  const obtenerOrdenes = useCallback(async () => {
    try {
      setCargando(true);
      setError("");

      const respuesta = await api.get(
        rolUsuario === "mecanico"
          ? "/ordenes_trabajo/mis-ordenes"
          : "/ordenes_trabajo",
      );

      setOrdenes(respuesta.data.ordenes);
    } catch (errorDesconocido: any) {
      console.error("Error al obtener órdenes:", errorDesconocido);

      setError(
        errorDesconocido.response?.data?.mensaje ||
          "No se pudieron cargar las órdenes.",
      );
    } finally {
      setCargando(false);
    }
  }, [rolUsuario]);

  const obtenerVehiculos = useCallback(async () => {
    try {
      const respuesta = await api.get("/vehiculos");

      setVehiculos(
        respuesta.data.vehiculos.filter(
          (vehiculo: Vehiculo) => vehiculo.activo,
        ),
      );
    } catch (errorDesconocido) {
      console.error("Error al obtener vehículos:", errorDesconocido);
    }
  }, []);

  useEffect(() => {
    void obtenerOrdenes();
    if (puedeCrear) void obtenerVehiculos();
  }, [obtenerOrdenes, obtenerVehiculos, puedeCrear]);

  const manejarCambioFormulario = (
    evento: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = evento.target;

    setFormulario((formularioAnterior) => ({
      ...formularioAnterior,
      [name]: value,
    }));
  };

  const abrirFormulario = () => {
    setFormulario({
      codigo: "",
      vehiculo_id: "",
      problema_reportado: "",
      observaciones: "",
      fecha_estimada_entrega: "",
    });

    setMensajeFormulario("");
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    if (guardando) {
      return;
    }

    setMostrarFormulario(false);
    setMensajeFormulario("");
  };

  const guardarOrden = async (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault();

    try {
      setGuardando(true);
      setMensajeFormulario("");

      const datosOrden = {
        codigo: formulario.codigo.trim(),
        vehiculo_id: Number(formulario.vehiculo_id),
        problema_reportado: formulario.problema_reportado,
        observaciones: formulario.observaciones || null,
        fecha_estimada_entrega: formulario.fecha_estimada_entrega || null,
      };

      await api.post("/ordenes_trabajo", datosOrden);

      setMostrarFormulario(false);

      setFormulario({
        codigo: "",
        vehiculo_id: "",
        problema_reportado: "",
        observaciones: "",
        fecha_estimada_entrega: "",
      });

      await obtenerOrdenes();
    } catch (errorDesconocido: any) {
      console.error("Error al registrar orden:", errorDesconocido);

      setMensajeFormulario(
        errorDesconocido.response?.data?.mensaje ||
          "No se pudo registrar la orden.",
      );
    } finally {
      setGuardando(false);
    }
  };

  const obtenerNombreEstado = (estado: string) => {
    return estado || "Sin estado";
  };

  if (cargando) {
    return (
      <section className="ordenes">
        <div className="ordenes-titulo">
          <h2>Órdenes de trabajo</h2>
          <p>Cargando órdenes...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="ordenes">
        <div className="ordenes-titulo">
          <h2>Órdenes de trabajo</h2>
          <p className="ordenes-error">{error}</p>
        </div>
      </section>
    );
  }
  return (
    <section className="ordenes">
      {/* ENCABEZADO */}

      <div className="ordenes-titulo">
        <div>
          <h2>Órdenes de trabajo</h2>

          <p>
            Gestión de las reparaciones y servicios realizados en el taller.
          </p>
        </div>

        {puedeCrear && (
          <button className="ordenes-boton-nuevo" onClick={abrirFormulario}>
            Nueva orden
          </button>
        )}
      </div>

      {/* FORMULARIO */}

      {puedeCrear && mostrarFormulario && (
        <div className="ordenes-formulario-contenedor">
          <div className="ordenes-formulario-encabezado">
            <div>
              <h3>Registrar nueva orden</h3>

              <p>Complete los datos iniciales de la orden de trabajo.</p>
            </div>

            <button
              type="button"
              className="ordenes-boton-cerrar"
              onClick={cerrarFormulario}
            >
              ×
            </button>
          </div>

          <form className="ordenes-formulario" onSubmit={guardarOrden}>
            <div className="ordenes-formulario-grid">
              {/* CÓDIGO DE ORDEN */}
              <div className="ordenes-campo">
                <label htmlFor="codigo">Código de orden</label>

                <input
                  id="codigo"
                  name="codigo"
                  type="text"
                  value={formulario.codigo}
                  onChange={manejarCambioFormulario}
                  placeholder="Ejemplo: OT-0003"
                  required
                />
              </div>

              <div className="ordenes-campo">
                <label htmlFor="vehiculo_id">Vehículo</label>

                <select
                  id="vehiculo_id"
                  name="vehiculo_id"
                  value={formulario.vehiculo_id}
                  onChange={manejarCambioFormulario}
                  required
                >
                  <option value="">Seleccione un vehículo</option>

                  {vehiculos.map((vehiculo) => (
                    <option key={vehiculo.id} value={vehiculo.id}>
                      {vehiculo.placa} - {vehiculo.marca} {vehiculo.modelo} -{" "}
                      {vehiculo.cliente_nombres} {vehiculo.cliente_apellidos}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ordenes-campo">
                <label htmlFor="fecha_estimada_entrega">
                  Fecha estimada de entrega
                </label>

                <input
                  id="fecha_estimada_entrega"
                  name="fecha_estimada_entrega"
                  type="date"
                  value={formulario.fecha_estimada_entrega}
                  onChange={manejarCambioFormulario}
                />
              </div>

              <div className="ordenes-campo ordenes-campo-completo">
                <label htmlFor="problema_reportado">Problema reportado</label>

                <textarea
                  id="problema_reportado"
                  name="problema_reportado"
                  value={formulario.problema_reportado}
                  onChange={manejarCambioFormulario}
                  rows={4}
                  required
                />
              </div>

              <div className="ordenes-campo ordenes-campo-completo">
                <label htmlFor="observaciones">Observaciones</label>

                <textarea
                  id="observaciones"
                  name="observaciones"
                  value={formulario.observaciones}
                  onChange={manejarCambioFormulario}
                  rows={3}
                />
              </div>
            </div>

            {mensajeFormulario && (
              <div className="ordenes-formulario-error">
                {mensajeFormulario}
              </div>
            )}

            <div className="ordenes-formulario-acciones">
              <button
                type="button"
                className="ordenes-boton-cancelar"
                onClick={cerrarFormulario}
                disabled={guardando}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="ordenes-boton-guardar"
                disabled={guardando}
              >
                {guardando ? "Registrando..." : "Registrar orden"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RESUMEN */}

      <div className="ordenes-resumen">
        <span>
          Órdenes registradas: <strong>{ordenes.length}</strong>
        </span>
      </div>

      {/* TABLA */}

      <div className="ordenes-tabla-contenedor">
        <table className="ordenes-tabla">
          <thead>
            <tr>
              <th>ID</th>
              <th>Código</th>
              <th>Vehículo</th>
              <th>Cliente</th>
              <th>Mecánico</th>
              <th>Estado</th>
              <th>Ingreso</th>
              <th>Total</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {ordenes.length === 0 ? (
              <tr>
                <td colSpan={9} className="ordenes-sin-datos">
                  No hay órdenes registradas.
                </td>
              </tr>
            ) : (
              ordenes.map((orden) => (
                <tr key={orden.id}>
                  <td>{orden.id}</td>

                  <td>
                    <strong>{orden.codigo}</strong>
                  </td>

                  <td>
                    {orden.placa}
                    <br />
                    <span className="ordenes-detalle-secundario">
                      {orden.marca} {orden.modelo}
                    </span>
                  </td>

                  <td>
                    {orden.cliente_nombres} {orden.cliente_apellidos}
                  </td>

                  <td>
                    {orden.mecanico_nombres
                      ? `${orden.mecanico_nombres} ${orden.mecanico_apellidos}`
                      : "Sin asignar"}
                  </td>

                  <td>
                    <span className={`orden-estado estado-${orden.estado_id}`}>
                      {obtenerNombreEstado(orden.estado_nombre)}
                    </span>
                  </td>

                  <td>
                    {new Date(orden.fecha_ingreso).toLocaleDateString("es-PE")}
                  </td>

                  <td>S/ {Number(orden.total || 0).toFixed(2)}</td>

                  <td>
                    <div className="orden-acciones">
                      <button
                        type="button"
                        className="orden-boton-ver"
                        onClick={() => navegar(`/ordenes/${orden.id}`)}
                      >
                        Ver
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default Ordenes;
