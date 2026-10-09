import { useEffect, useState } from "react";
import api from "../../services/api";
import "./Clientes.css";

interface Cliente {
  id: number;
  usuario_id: number | null;
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  activo: boolean;
}

interface FormularioCliente {
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string;
  email: string;
  direccion: string;
}

function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [mensajeFormulario, setMensajeFormulario] = useState("");
  const [clienteAcceso, setClienteAcceso] = useState<Cliente | null>(null);
  const [acceso, setAcceso] = useState({ email: "", password: "" });

  const [formulario, setFormulario] = useState<FormularioCliente>({
    nombres: "",
    apellidos: "",
    dni: "",
    telefono: "",
    email: "",
    direccion: "",
  });

  const obtenerClientes = async () => {
    try {
      setCargando(true);
      setError("");

      const respuesta = await api.get("/clientes");

      setClientes(respuesta.data.clientes);
    } catch (errorDesconocido: any) {
      console.error("Error al obtener clientes:", errorDesconocido);

      setError(
        errorDesconocido.response?.data?.mensaje ||
          "No se pudieron cargar los clientes.",
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    obtenerClientes();
  }, []);

  const manejarCambioFormulario = (
    evento: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = evento.target;

    setFormulario((formularioAnterior) => ({
      ...formularioAnterior,
      [name]: value,
    }));
  };

  const abrirFormulario = () => {
    setFormulario({
      nombres: "",
      apellidos: "",
      dni: "",
      telefono: "",
      email: "",
      direccion: "",
    });

    setClienteEditando(null);
    setMensajeFormulario("");
    setMostrarFormulario(true);
  };

  const editarCliente = (cliente: Cliente) => {
    setFormulario({
      nombres: cliente.nombres,
      apellidos: cliente.apellidos,
      dni: cliente.dni,
      telefono: cliente.telefono || "",
      email: cliente.email || "",
      direccion: cliente.direccion || "",
    });

    setClienteEditando(cliente.id);
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

  const guardarCliente = async (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault();

    try {
      setGuardando(true);
      setMensajeFormulario("");

      const datosCliente = {
        nombres: formulario.nombres,
        apellidos: formulario.apellidos,
        dni: formulario.dni,
        telefono: formulario.telefono || null,
        email: formulario.email || null,
        direccion: formulario.direccion || null,
      };

      if (clienteEditando === null) {
        await api.post("/clientes", datosCliente);
      } else {
        await api.put(`/clientes/${clienteEditando}`, datosCliente);
      }

      setMostrarFormulario(false);
      setClienteEditando(null);

      setFormulario({
        nombres: "",
        apellidos: "",
        dni: "",
        telefono: "",
        email: "",
        direccion: "",
      });

      await obtenerClientes();
    } catch (errorDesconocido: any) {
      console.error("Error al guardar cliente:", errorDesconocido);

      setMensajeFormulario(
        errorDesconocido.response?.data?.mensaje ||
          "No se pudo guardar el cliente.",
      );
    } finally {
      setGuardando(false);
    }
  };
  const crearAcceso = async (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (!clienteAcceso) return;
    try {
      await api.post(`/clientes/${clienteAcceso.id}/acceso`, acceso);
      setClienteAcceso(null);
      setAcceso({ email: "", password: "" });
      await obtenerClientes();
    } catch (errorDesconocido: any) {
      setMensajeFormulario(
        errorDesconocido.response?.data?.mensaje ||
          "No se pudo crear el acceso.",
      );
    }
  };
  const cambiarEstadoCliente = async (cliente: Cliente) => {
    const nuevoEstado = !cliente.activo;

    const confirmar = window.confirm(
      nuevoEstado
        ? `¿Desea activar a ${cliente.nombres} ${cliente.apellidos}?`
        : `¿Desea desactivar a ${cliente.nombres} ${cliente.apellidos}?`,
    );

    if (!confirmar) {
      return;
    }

    try {
      await api.patch(`/clientes/${cliente.id}/estado`, {
        activo: nuevoEstado,
      });

      await obtenerClientes();
    } catch (errorDesconocido: any) {
      console.error("Error al cambiar estado del cliente:", errorDesconocido);

      alert(
        errorDesconocido.response?.data?.mensaje ||
          "No se pudo cambiar el estado del cliente.",
      );
    }
  };
  if (cargando) {
    return (
      <section className="clientes">
        <div className="clientes-titulo">
          <h2>Clientes</h2>
          <p>Cargando clientes...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="clientes">
        <div className="clientes-titulo">
          <h2>Clientes</h2>
          <p className="clientes-error">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="clientes">
      <div className="clientes-titulo">
        <div>
          <h2>Clientes</h2>
          <p>Gestión de clientes registrados en el taller.</p>
        </div>

        <button className="clientes-boton-nuevo" onClick={abrirFormulario}>
          Nuevo cliente
        </button>
      </div>

      {mostrarFormulario && (
        <div className="clientes-formulario-contenedor">
          <div className="clientes-formulario-encabezado">
            <div>
              <h3>
                {clienteEditando === null
                  ? "Registrar nuevo cliente"
                  : "Editar cliente"}
              </h3>
              <p>Ingrese los datos del cliente.</p>
            </div>

            <button
              type="button"
              className="clientes-boton-cerrar"
              onClick={cerrarFormulario}
            >
              x
            </button>
          </div>

          <form className="clientes-formulario" onSubmit={guardarCliente}>
            <div className="clientes-formulario-grid">
              <div className="clientes-campo">
                <label htmlFor="nombres">Nombres</label>

                <input
                  id="nombres"
                  name="nombres"
                  type="text"
                  value={formulario.nombres}
                  onChange={manejarCambioFormulario}
                  required
                />
              </div>

              <div className="clientes-campo">
                <label htmlFor="apellidos">Apellidos</label>

                <input
                  id="apellidos"
                  name="apellidos"
                  type="text"
                  value={formulario.apellidos}
                  onChange={manejarCambioFormulario}
                  required
                />
              </div>

              <div className="clientes-campo">
                <label htmlFor="dni">DNI</label>

                <input
                  id="dni"
                  name="dni"
                  type="text"
                  value={formulario.dni}
                  onChange={manejarCambioFormulario}
                  maxLength={8}
                  inputMode="numeric"
                  required
                />
              </div>

              <div className="clientes-campo">
                <label htmlFor="telefono">Teléfono</label>

                <input
                  id="telefono"
                  name="telefono"
                  type="text"
                  value={formulario.telefono}
                  onChange={manejarCambioFormulario}
                />
              </div>

              <div className="clientes-campo">
                <label htmlFor="email">Correo electrónico</label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formulario.email}
                  onChange={manejarCambioFormulario}
                />
              </div>

              <div className="clientes-campo">
                <label htmlFor="direccion">Dirección</label>

                <input
                  id="direccion"
                  name="direccion"
                  type="text"
                  value={formulario.direccion}
                  onChange={manejarCambioFormulario}
                />
              </div>
            </div>

            {mensajeFormulario && (
              <div className="clientes-formulario-error">
                {mensajeFormulario}
              </div>
            )}

            <div className="clientes-formulario-acciones">
              <button
                type="button"
                className="clientes-boton-cancelar"
                onClick={cerrarFormulario}
                disabled={guardando}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="clientes-boton-guardar"
                disabled={guardando}
              >
                {guardando
                  ? "Guardando..."
                  : clienteEditando === null
                    ? "Registrar cliente"
                    : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      )}

      {clienteAcceso && (
        <form className="clientes-formulario-contenedor" onSubmit={crearAcceso}>
          <div className="clientes-formulario-encabezado">
            <div>
              <h3>Crear acceso de cliente</h3>
              <p>
                {clienteAcceso.nombres} {clienteAcceso.apellidos} podrá ingresar
                al portal.
              </p>
            </div>
          </div>
          <div className="clientes-formulario-grid">
            <div className="clientes-campo">
              <label>Correo de acceso</label>
              <input
                type="email"
                required
                value={acceso.email}
                onChange={(e) =>
                  setAcceso({ ...acceso, email: e.target.value })
                }
              />
            </div>
            <div className="clientes-campo">
              <label>Contraseña de acceso</label>
              <input
                type="password"
                minLength={8}
                required
                value={acceso.password}
                onChange={(e) =>
                  setAcceso({ ...acceso, password: e.target.value })
                }
              />
            </div>
          </div>
          {mensajeFormulario && (
            <div className="clientes-formulario-error">{mensajeFormulario}</div>
          )}
          <div className="clientes-formulario-acciones">
            <button
              type="button"
              className="clientes-boton-cancelar"
              onClick={() => setClienteAcceso(null)}
            >
              Cancelar
            </button>
            <button className="clientes-boton-guardar">Crear acceso</button>
          </div>
        </form>
      )}

      <div className="clientes-resumen">
        <span>
          Clientes registrados: <strong>{clientes.length}</strong>
        </span>
      </div>

      <div className="clientes-tabla-contenedor">
        <table className="clientes-tabla">
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>DNI</th>
              <th>Teléfono</th>
              <th>Correo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {clientes.length === 0 ? (
              <tr>
                <td colSpan={7} className="clientes-sin-datos">
                  No hay clientes registrados.
                </td>
              </tr>
            ) : (
              clientes.map((cliente) => (
                <tr key={cliente.id}>
                  <td>{cliente.id}</td>

                  <td>
                    <div className="cliente-nombre">
                      <strong>
                        {cliente.nombres} {cliente.apellidos}
                      </strong>
                    </div>
                  </td>

                  <td>{cliente.dni}</td>

                  <td>{cliente.telefono || "No registrado"}</td>

                  <td>{cliente.email || "No registrado"}</td>

                  <td>
                    <span
                      className={
                        cliente.activo
                          ? "cliente-estado activo"
                          : "cliente-estado inactivo"
                      }
                    >
                      {cliente.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="cliente-acciones">
                    <button
                      className="cliente-boton-editar"
                      onClick={() => editarCliente(cliente)}
                    >
                      Editar
                    </button>
                    <button
                      className={
                        cliente.activo
                          ? "cliente-boton-desactivar"
                          : "cliente-boton-activar"
                      }
                      onClick={() => cambiarEstadoCliente(cliente)}
                    >
                      {cliente.activo ? "Desactivar" : "Activar"}
                    </button>
                    {!cliente.usuario_id && cliente.email && (
                      <button
                        className="cliente-boton-editar"
                        onClick={() => {
                          setClienteAcceso(cliente);
                          setAcceso({
                            email: cliente.email || "",
                            password: "",
                          });
                          setMensajeFormulario("");
                        }}
                      >
                        Crear acceso
                      </button>
                    )}
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

export default Clientes;
