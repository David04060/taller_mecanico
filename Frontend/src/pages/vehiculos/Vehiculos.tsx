import { useEffect, useState } from "react";
import api from "../../services/api";
import "./Vehiculos.css";
import { useAutenticacion } from "../../hooks/useAutenticacion";

interface Vehiculo {
  id: number;
  placa: string;
  marca: string;
  modelo: string;
  anio: number | null;
  color: string | null;
  cliente_id: number;
  cliente_nombres: string;
  cliente_apellidos: string;
  activo: boolean;
}

interface Cliente {
  id: number;
  nombres: string;
  apellidos: string;
  dni: string;
  activo: boolean;
}

interface FormularioVehiculo {
  placa: string;
  marca: string;
  modelo: string;
  anio: string;
  color: string;
  cliente_id: string;
}

function Vehiculos() {
  const { usuario } = useAutenticacion();
  const puedeEditar =
    usuario?.rol === "administrador" || usuario?.rol === "recepcionista";
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [vehiculoEditando, setVehiculoEditando] = useState<number | null>(null);

  const [guardando, setGuardando] = useState(false);
  const [mensajeFormulario, setMensajeFormulario] = useState("");

  const [formulario, setFormulario] = useState<FormularioVehiculo>({
    placa: "",
    marca: "",
    modelo: "",
    anio: "",
    color: "",
    cliente_id: "",
  });

  const obtenerVehiculos = async () => {
    try {
      setCargando(true);
      setError("");

      const respuesta = await api.get("/vehiculos");

      setVehiculos(respuesta.data.vehiculos);
    } catch (errorDesconocido: any) {
      console.error("Error al obtener vehículos:", errorDesconocido);

      setError(
        errorDesconocido.response?.data?.mensaje ||
          "No se pudieron cargar los vehículos.",
      );
    } finally {
      setCargando(false);
    }
  };

  const obtenerClientes = async () => {
    try {
      const respuesta = await api.get("/clientes");

      setClientes(respuesta.data.clientes);
    } catch (errorDesconocido) {
      console.error("Error al obtener clientes:", errorDesconocido);
    }
  };

  useEffect(() => {
    obtenerVehiculos();
    obtenerClientes();
  }, []);

  const manejarCambioFormulario = (
    evento: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = evento.target;

    setFormulario((formularioAnterior) => ({
      ...formularioAnterior,
      [name]: value,
    }));
  };

  const abrirFormulario = () => {
    setFormulario({
      placa: "",
      marca: "",
      modelo: "",
      anio: "",
      color: "",
      cliente_id: "",
    });

    setVehiculoEditando(null);
    setMensajeFormulario("");
    setMostrarFormulario(true);
  };

  const editarVehiculo = (vehiculo: Vehiculo) => {
    setFormulario({
      placa: vehiculo.placa,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      anio: vehiculo.anio ? String(vehiculo.anio) : "",
      color: vehiculo.color || "",
      cliente_id: String(vehiculo.cliente_id),
    });

    setVehiculoEditando(vehiculo.id);
    setMensajeFormulario("");
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    if (guardando) {
      return;
    }

    setMostrarFormulario(false);
    setVehiculoEditando(null);
    setMensajeFormulario("");
  };

  const guardarVehiculo = async (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault();

    try {
      setGuardando(true);
      setMensajeFormulario("");

      const datosVehiculo = {
        placa: formulario.placa,
        marca: formulario.marca,
        modelo: formulario.modelo,
        anio: formulario.anio ? Number(formulario.anio) : null,
        color: formulario.color || null,
        cliente_id: Number(formulario.cliente_id),
      };

      if (vehiculoEditando === null) {
        await api.post("/vehiculos", datosVehiculo);
      } else {
        await api.put(`/vehiculos/${vehiculoEditando}`, datosVehiculo);
      }

      setMostrarFormulario(false);
      setVehiculoEditando(null);

      setFormulario({
        placa: "",
        marca: "",
        modelo: "",
        anio: "",
        color: "",
        cliente_id: "",
      });

      await obtenerVehiculos();
    } catch (errorDesconocido: any) {
      console.error("Error al guardar vehículo:", errorDesconocido);

      setMensajeFormulario(
        errorDesconocido.response?.data?.mensaje ||
          "No se pudo guardar el vehículo.",
      );
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstadoVehiculo = async (vehiculo: Vehiculo) => {
    const nuevoEstado = !vehiculo.activo;

    const confirmar = window.confirm(
      nuevoEstado
        ? `¿Desea activar el vehículo ${vehiculo.placa}?`
        : `¿Desea desactivar el vehículo ${vehiculo.placa}?`,
    );

    if (!confirmar) {
      return;
    }

    try {
      await api.patch(`/vehiculos/${vehiculo.id}/estado`, {
        activo: nuevoEstado,
      });

      await obtenerVehiculos();
    } catch (errorDesconocido: any) {
      console.error("Error al cambiar estado:", errorDesconocido);

      alert(
        errorDesconocido.response?.data?.mensaje ||
          "No se pudo cambiar el estado del vehículo.",
      );
    }
  };

  if (cargando) {
    return (
      <section className="vehiculos">
        <div className="vehiculos-titulo">
          <h2>Vehículos</h2>
          <p>Cargando vehículos...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="vehiculos">
        <div className="vehiculos-titulo">
          <h2>Vehículos</h2>
          <p className="vehiculos-error">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="vehiculos">
      {/* ENCABEZADO */}

      <div className="vehiculos-titulo">
        <div>
          <h2>Vehículos</h2>

          <p>Gestión de vehículos registrados en el taller.</p>
        </div>

        {puedeEditar && (
          <button className="vehiculos-boton-nuevo" onClick={abrirFormulario}>
            Nuevo vehículo
          </button>
        )}
      </div>

      {/* FORMULARIO */}

      {puedeEditar && mostrarFormulario && (
        <div className="vehiculos-formulario-contenedor">
          <div className="vehiculos-formulario-encabezado">
            <div>
              <h3>
                {vehiculoEditando === null
                  ? "Registrar nuevo vehículo"
                  : "Editar vehículo"}
              </h3>

              <p>
                {vehiculoEditando === null
                  ? "Complete los datos del vehículo."
                  : "Modifique los datos del vehículo."}
              </p>
            </div>

            <button
              type="button"
              className="vehiculos-boton-cerrar"
              onClick={cerrarFormulario}
            >
              ×
            </button>
          </div>

          <form className="vehiculos-formulario" onSubmit={guardarVehiculo}>
            <div className="vehiculos-formulario-grid">
              <div className="vehiculos-campo">
                <label htmlFor="placa">Placa</label>

                <input
                  id="placa"
                  name="placa"
                  type="text"
                  value={formulario.placa}
                  onChange={manejarCambioFormulario}
                  maxLength={10}
                  required
                />
              </div>

              <div className="vehiculos-campo">
                <label htmlFor="marca">Marca</label>

                <input
                  id="marca"
                  name="marca"
                  type="text"
                  value={formulario.marca}
                  onChange={manejarCambioFormulario}
                  required
                />
              </div>

              <div className="vehiculos-campo">
                <label htmlFor="modelo">Modelo</label>

                <input
                  id="modelo"
                  name="modelo"
                  type="text"
                  value={formulario.modelo}
                  onChange={manejarCambioFormulario}
                  required
                />
              </div>

              <div className="vehiculos-campo">
                <label htmlFor="anio">Año</label>

                <input
                  id="anio"
                  name="anio"
                  type="number"
                  value={formulario.anio}
                  onChange={manejarCambioFormulario}
                  min="1900"
                  max="2100"
                />
              </div>

              <div className="vehiculos-campo">
                <label htmlFor="color">Color</label>

                <input
                  id="color"
                  name="color"
                  type="text"
                  value={formulario.color}
                  onChange={manejarCambioFormulario}
                />
              </div>

              <div className="vehiculos-campo">
                <label htmlFor="cliente_id">Propietario</label>

                <select
                  id="cliente_id"
                  name="cliente_id"
                  value={formulario.cliente_id}
                  onChange={manejarCambioFormulario}
                  required
                >
                  <option value="">Seleccione un cliente</option>

                  {clientes
                    .filter((cliente) => cliente.activo)
                    .map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombres} {cliente.apellidos} - {cliente.dni}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {mensajeFormulario && (
              <div className="vehiculos-formulario-error">
                {mensajeFormulario}
              </div>
            )}

            <div className="vehiculos-formulario-acciones">
              <button
                type="button"
                className="vehiculos-boton-cancelar"
                onClick={cerrarFormulario}
                disabled={guardando}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="vehiculos-boton-guardar"
                disabled={guardando}
              >
                {guardando
                  ? "Guardando..."
                  : vehiculoEditando === null
                    ? "Registrar vehículo"
                    : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RESUMEN */}

      <div className="vehiculos-resumen">
        <span>
          Vehículos registrados: <strong>{vehiculos.length}</strong>
        </span>
      </div>

      {/* TABLA */}

      <div className="vehiculos-tabla-contenedor">
        <table className="vehiculos-tabla">
          <thead>
            <tr>
              <th>ID</th>
              <th>Placa</th>
              <th>Marca</th>
              <th>Modelo</th>
              <th>Año</th>
              <th>Color</th>
              <th>Propietario</th>
              <th>Estado</th>
              {puedeEditar && <th>Acciones</th>}
            </tr>
          </thead>

          <tbody>
            {vehiculos.length === 0 ? (
              <tr>
                <td colSpan={9} className="vehiculos-sin-datos">
                  No hay vehículos registrados.
                </td>
              </tr>
            ) : (
              vehiculos.map((vehiculo) => (
                <tr key={vehiculo.id}>
                  <td>{vehiculo.id}</td>

                  {puedeEditar && (
                    <td>
                      <strong>{vehiculo.placa}</strong>
                    </td>
                  )}

                  <td>{vehiculo.marca}</td>

                  <td>{vehiculo.modelo}</td>

                  <td>{vehiculo.anio || "No registrado"}</td>

                  <td>{vehiculo.color || "No registrado"}</td>

                  <td>
                    {vehiculo.cliente_nombres} {vehiculo.cliente_apellidos}
                  </td>

                  <td>
                    <span
                      className={
                        vehiculo.activo
                          ? "vehiculo-estado activo"
                          : "vehiculo-estado inactivo"
                      }
                    >
                      {vehiculo.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>

                  <td>
                    <div className="vehiculo-acciones">
                      <button
                        className="vehiculo-boton-editar"
                        onClick={() => editarVehiculo(vehiculo)}
                      >
                        Editar
                      </button>

                      <button
                        className={
                          vehiculo.activo
                            ? "vehiculo-boton-desactivar"
                            : "vehiculo-boton-activar"
                        }
                        onClick={() => cambiarEstadoVehiculo(vehiculo)}
                      >
                        {vehiculo.activo ? "Desactivar" : "Activar"}
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

export default Vehiculos;
