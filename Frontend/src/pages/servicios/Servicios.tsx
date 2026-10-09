import { useEffect, useMemo, useState, type FormEvent } from "react";
import api from "../../services/api";
import { useAutenticacion } from "../../hooks/useAutenticacion";
import "../Gestion.css";

interface Servicio {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio_base: number | string;
  activo: boolean;
}
const inicial = { nombre: "", descripcion: "", precio_base: "" };

export default function Servicios() {
  const { usuario } = useAutenticacion();
  const puedeEditar =
    usuario?.rol === "administrador" || usuario?.rol === "recepcionista";
  const [items, setItems] = useState<Servicio[]>([]),
    [form, setForm] = useState(inicial);
  const [mostrar, setMostrar] = useState(false),
    [editando, setEditando] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState(""),
    [error, setError] = useState("");
  const cargar = async () => {
    try {
      const { data } = await api.get("/servicios");
      setItems(data.servicios ?? []);
      setError("");
    } catch (e: any) {
      setError(
        e.response?.data?.mensaje ?? "No se pudieron cargar los servicios.",
      );
    }
  };
  useEffect(() => {
    void cargar();
  }, []);
  const filtrados = useMemo(
    () =>
      items.filter((i) =>
        `${i.nombre} ${i.descripcion ?? ""}`
          .toLowerCase()
          .includes(busqueda.toLowerCase()),
      ),
    [items, busqueda],
  );
  const abrir = (item?: Servicio) => {
    setEditando(item?.id ?? null);
    setForm(
      item
        ? {
            nombre: item.nombre,
            descripcion: item.descripcion ?? "",
            precio_base: String(item.precio_base),
          }
        : inicial,
    );
    setMostrar(true);
    setError("");
  };
  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const datos = { ...form, precio_base: Number(form.precio_base) };
      if (editando) await api.put(`/servicios/${editando}`, datos);
      else await api.post("/servicios", datos);
      setMostrar(false);
      await cargar();
    } catch (err: any) {
      setError(
        err.response?.data?.mensaje ?? "No se pudo guardar el servicio.",
      );
    }
  };
  const estado = async (item: Servicio) => {
    try {
      await api.patch(`/servicios/${item.id}/estado`, { activo: !item.activo });
      await cargar();
    } catch (err: any) {
      setError(err.response?.data?.mensaje ?? "No se pudo cambiar el estado.");
    }
  };
  return (
    <section className="gestion">
      <div className="gestion-encabezado">
        <div>
          <h2>Servicios</h2>
          <p>Catálogo y precios base de los trabajos del taller.</p>
        </div>
        {puedeEditar && (
          <button className="boton-primario" onClick={() => abrir()}>
            Nuevo servicio
          </button>
        )}
      </div>
      {error && <div className="mensaje-error">{error}</div>}
      {mostrar && (
        <form className="panel" onSubmit={guardar}>
          <div className="formulario-grid">
            <div className="campo">
              <label>Nombre</label>
              <input
                required
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </div>
            <div className="campo">
              <label>Precio base</label>
              <input
                required
                min="0"
                step="0.01"
                type="number"
                value={form.precio_base}
                onChange={(e) =>
                  setForm({ ...form, precio_base: e.target.value })
                }
              />
            </div>
            <div className="campo campo-completo">
              <label>Descripción</label>
              <textarea
                value={form.descripcion}
                onChange={(e) =>
                  setForm({ ...form, descripcion: e.target.value })
                }
              />
            </div>
          </div>
          <div className="gestion-acciones" style={{ marginTop: "1rem" }}>
            <button className="boton-primario">Guardar</button>
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
          placeholder="Buscar servicio"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>
      <div className="tabla-contenedor">
        <table className="tabla-gestion">
          <thead>
            <tr>
              <th>Servicio</th>
              <th>Descripción</th>
              <th>Precio base</th>
              <th>Estado</th>
              {puedeEditar && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {filtrados.map((i) => (
              <tr key={i.id}>
                <td>
                  <strong>{i.nombre}</strong>
                </td>
                <td>{i.descripcion || "—"}</td>
                <td>S/ {Number(i.precio_base).toFixed(2)}</td>
                <td>
                  <span
                    className={`estado ${i.activo ? "activo" : "inactivo"}`}
                  >
                    {i.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                {puedeEditar && (
                  <td>
                    <div className="gestion-acciones">
                      <button
                        className="boton-secundario"
                        onClick={() => abrir(i)}
                      >
                        Editar
                      </button>
                      <button
                        className="boton-peligro"
                        onClick={() => estado(i)}
                      >
                        {i.activo ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {!filtrados.length && (
              <tr>
                <td colSpan={5}>No hay servicios.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
