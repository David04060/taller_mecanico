import { useEffect, useMemo, useState, type FormEvent } from "react";
import api from "../../services/api";
import "../Gestion.css";

interface Usuario {
  id: number;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  rol: string;
  activo: boolean;
}
const inicial = {
  nombres: "",
  apellidos: "",
  email: "",
  telefono: "",
  password: "",
  rol: "mecanico",
};

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [formulario, setFormulario] = useState(inicial);
  const [editando, setEditando] = useState<number | null>(null);
  const [mostrar, setMostrar] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    try {
      const { data } = await api.get("/usuarios");
      setUsuarios(data.usuarios ?? []);
      setError("");
    } catch (e: any) {
      setError(
        e.response?.data?.mensaje ?? "No se pudieron cargar los usuarios.",
      );
    }
  };
  useEffect(() => {
    void cargar();
  }, []);

  const filtrados = useMemo(
    () =>
      usuarios.filter((u) =>
        `${u.nombres} ${u.apellidos} ${u.email} ${u.rol}`
          .toLowerCase()
          .includes(busqueda.toLowerCase()),
      ),
    [usuarios, busqueda],
  );

  const nuevo = () => {
    setFormulario(inicial);
    setEditando(null);
    setMostrar(true);
    setError("");
  };
  const editar = (u: Usuario) => {
    setFormulario({
      nombres: u.nombres,
      apellidos: u.apellidos,
      email: u.email,
      telefono: u.telefono ?? "",
      password: "",
      rol: u.rol,
    });
    setEditando(u.id);
    setMostrar(true);
  };
  const guardar = async (evento: FormEvent) => {
    evento.preventDefault();
    setGuardando(true);
    setError("");
    try {
      if (editando)
        await api.put(`/usuarios/${editando}`, {
          ...formulario,
          password: undefined,
        });
      else await api.post("/usuarios", formulario);
      setMostrar(false);
      await cargar();
    } catch (e: any) {
      setError(e.response?.data?.mensaje ?? "No se pudo guardar el usuario.");
    } finally {
      setGuardando(false);
    }
  };
  const cambiarEstado = async (u: Usuario) => {
    if (
      !confirm(
        `¿${u.activo ? "Desactivar" : "Activar"} a ${u.nombres} ${u.apellidos}?`,
      )
    )
      return;
    try {
      await api.patch(`/usuarios/${u.id}/estado`, { activo: !u.activo });
      await cargar();
    } catch (e: any) {
      setError(e.response?.data?.mensaje ?? "No se pudo cambiar el estado.");
    }
  };

  return (
    <section className="gestion">
      <div className="gestion-encabezado">
        <div>
          <h2>Usuarios</h2>
          <p>Administración de recepcionistas y mecánicos.</p>
        </div>
        <button className="boton-primario" onClick={nuevo}>
          Nuevo usuario
        </button>
      </div>
      {error && (
        <div className="mensaje-error" role="alert">
          {error}
        </div>
      )}
      {mostrar && (
        <form className="panel" onSubmit={guardar}>
          <div className="formulario-grid">
            <div className="campo">
              <label>Nombres</label>
              <input
                required
                value={formulario.nombres}
                onChange={(e) =>
                  setFormulario({ ...formulario, nombres: e.target.value })
                }
              />
            </div>
            <div className="campo">
              <label>Apellidos</label>
              <input
                required
                value={formulario.apellidos}
                onChange={(e) =>
                  setFormulario({ ...formulario, apellidos: e.target.value })
                }
              />
            </div>
            <div className="campo">
              <label>Correo</label>
              <input
                required
                type="email"
                value={formulario.email}
                onChange={(e) =>
                  setFormulario({ ...formulario, email: e.target.value })
                }
              />
            </div>
            <div className="campo">
              <label>Teléfono</label>
              <input
                required
                value={formulario.telefono}
                onChange={(e) =>
                  setFormulario({ ...formulario, telefono: e.target.value })
                }
              />
            </div>
            {!editando && (
              <div className="campo">
                <label>Contraseña</label>
                <input
                  required
                  minLength={8}
                  type="password"
                  value={formulario.password}
                  onChange={(e) =>
                    setFormulario({ ...formulario, password: e.target.value })
                  }
                />
              </div>
            )}
            <div className="campo">
              <label>Rol</label>
              <select
                value={formulario.rol}
                onChange={(e) =>
                  setFormulario({ ...formulario, rol: e.target.value })
                }
              >
                <option value="mecanico">Mecánico</option>
                <option value="recepcionista">Recepcionista</option>
              </select>
            </div>
          </div>
          <div className="gestion-acciones" style={{ marginTop: "1rem" }}>
            <button className="boton-primario" disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              className="boton-secundario"
              onClick={() => setMostrar(false)}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
      <div className="filtros">
        <input
          aria-label="Buscar usuarios"
          placeholder="Buscar por nombre, correo o rol"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>
      <div className="tabla-contenedor">
        <table className="tabla-gestion">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((u) => (
              <tr key={u.id}>
                <td>
                  {u.nombres} {u.apellidos}
                </td>
                <td>{u.email}</td>
                <td>{u.telefono}</td>
                <td>{u.rol}</td>
                <td>
                  <span
                    className={`estado ${u.activo ? "activo" : "inactivo"}`}
                  >
                    {u.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td>
                  <div className="gestion-acciones">
                    <button
                      className="boton-secundario"
                      onClick={() => editar(u)}
                    >
                      Editar
                    </button>
                    <button
                      className="boton-peligro"
                      onClick={() => cambiarEstado(u)}
                    >
                      {u.activo ? "Desactivar" : "Activar"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!filtrados.length && (
              <tr>
                <td colSpan={6}>No hay usuarios para mostrar.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
