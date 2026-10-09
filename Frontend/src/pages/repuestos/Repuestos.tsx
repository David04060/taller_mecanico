import { useEffect, useMemo, useState, type FormEvent } from "react";
import api from "../../services/api";
import { useAutenticacion } from "../../hooks/useAutenticacion";
import "../Gestion.css";
interface Categoria {
  id: number;
  nombre: string;
  activo: boolean;
}
interface Repuesto {
  id: number;
  categoria_id: number;
  categoria: string;
  codigo: string;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
  precio_compra: string | number;
  precio_venta: string | number;
  activo: boolean;
}
const vacio = {
  categoria_id: "",
  codigo: "",
  nombre: "",
  stock_minimo: "0",
  precio_compra: "0",
  precio_venta: "0",
};
export default function Repuestos() {
  const { usuario } = useAutenticacion(),
    editable = usuario?.rol !== "mecanico";
  const [items, setItems] = useState<Repuesto[]>([]),
    [categorias, setCategorias] = useState<Categoria[]>([]),
    [form, setForm] = useState(vacio);
  const [mostrar, setMostrar] = useState(false),
    [editando, setEditando] = useState<number | null>(null),
    [busqueda, setBusqueda] = useState(""),
    [error, setError] = useState(""),
    [categoriaNueva, setCategoriaNueva] = useState("");
  const cargar = async () => {
    try {
      const [r, c] = await Promise.all([
        api.get("/repuestos"),
        api.get("/categorias_repuesto"),
      ]);
      setItems(r.data.repuestos ?? []);
      setCategorias(c.data.categorias ?? []);
      setError("");
    } catch (e: any) {
      setError(e.response?.data?.mensaje ?? "No se pudo cargar el catálogo.");
    }
  };
  useEffect(() => {
    void cargar();
  }, []);
  const filtrados = useMemo(
    () =>
      items.filter((i) =>
        `${i.codigo} ${i.nombre} ${i.categoria}`
          .toLowerCase()
          .includes(busqueda.toLowerCase()),
      ),
    [items, busqueda],
  );
  const abrir = (i?: Repuesto) => {
    setForm(
      i
        ? {
            categoria_id: String(i.categoria_id),
            codigo: i.codigo,
            nombre: i.nombre,
            stock_minimo: String(i.stock_minimo),
            precio_compra: String(i.precio_compra),
            precio_venta: String(i.precio_venta),
          }
        : vacio,
    );
    setEditando(i?.id ?? null);
    setMostrar(true);
  };
  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    const datos = {
      ...form,
      categoria_id: Number(form.categoria_id),
      stock_minimo: Number(form.stock_minimo),
      precio_compra: Number(form.precio_compra),
      precio_venta: Number(form.precio_venta),
    };
    try {
      if (editando) await api.put(`/repuestos/${editando}`, datos);
      else await api.post("/repuestos", datos);
      setMostrar(false);
      await cargar();
    } catch (err: any) {
      setError(
        err.response?.data?.mensaje ?? "No se pudo guardar el repuesto.",
      );
    }
  };
  const estado = async (i: Repuesto) => {
    try {
      await api.patch(`/repuestos/${i.id}/estado`, { activo: !i.activo });
      await cargar();
    } catch (e: any) {
      setError(e.response?.data?.mensaje ?? "No se pudo cambiar el estado.");
    }
  };
  const crearCategoria = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/categorias_repuesto", { nombre: categoriaNueva });
      setCategoriaNueva("");
      await cargar();
    } catch (err: any) {
      setError(err.response?.data?.mensaje ?? "No se pudo crear la categoría.");
    }
  };
  return (
    <section className="gestion">
      <div className="gestion-encabezado">
        <div>
          <h2>Repuestos</h2>
          <p>Catálogo, precios y niveles actuales de stock.</p>
        </div>
        {editable && (
          <button className="boton-primario" onClick={() => abrir()}>
            Nuevo repuesto
          </button>
        )}
      </div>
      {error && <div className="mensaje-error">{error}</div>}
      {editable && (
        <form className="panel" onSubmit={crearCategoria}>
          <div className="gestion-acciones">
            <input
              required
              placeholder="Nueva categoría"
              value={categoriaNueva}
              onChange={(e) => setCategoriaNueva(e.target.value)}
              style={{
                padding: ".65rem",
                border: "1px solid #cbd5e1",
                borderRadius: ".5rem",
              }}
            />
            <button className="boton-secundario">Agregar categoría</button>
          </div>
        </form>
      )}
      {mostrar && (
        <form className="panel" onSubmit={guardar}>
          <div className="formulario-grid">
            <div className="campo">
              <label>Categoría</label>
              <select
                required
                value={form.categoria_id}
                onChange={(e) =>
                  setForm({ ...form, categoria_id: e.target.value })
                }
              >
                <option value="">Seleccione</option>
                {categorias
                  .filter((c) => c.activo)
                  .map((c) => (
                    <option value={c.id} key={c.id}>
                      {c.nombre}
                    </option>
                  ))}
              </select>
            </div>
            <div className="campo">
              <label>Código</label>
              <input
                required
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value })}
              />
            </div>
            <div className="campo">
              <label>Nombre</label>
              <input
                required
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </div>
            <div className="campo">
              <label>Stock mínimo</label>
              <input
                type="number"
                min="0"
                required
                value={form.stock_minimo}
                onChange={(e) =>
                  setForm({ ...form, stock_minimo: e.target.value })
                }
              />
            </div>
            <div className="campo">
              <label>Precio compra</label>
              <input
                type="number"
                min="0"
                step=".01"
                required
                value={form.precio_compra}
                onChange={(e) =>
                  setForm({ ...form, precio_compra: e.target.value })
                }
              />
            </div>
            <div className="campo">
              <label>Precio venta</label>
              <input
                type="number"
                min="0"
                step=".01"
                required
                value={form.precio_venta}
                onChange={(e) =>
                  setForm({ ...form, precio_venta: e.target.value })
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
          placeholder="Buscar por código, nombre o categoría"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>
      <div className="tabla-contenedor">
        <table className="tabla-gestion">
          <thead>
            <tr>
              <th>Código</th>
              <th>Repuesto</th>
              <th>Categoría</th>
              <th>Stock</th>
              <th>Compra</th>
              <th>Venta</th>
              <th>Estado</th>
              {editable && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {filtrados.map((i) => (
              <tr key={i.id}>
                <td>
                  <strong>{i.codigo}</strong>
                </td>
                <td>{i.nombre}</td>
                <td>{i.categoria}</td>
                <td>
                  <span
                    className={`estado ${i.stock_actual <= i.stock_minimo ? "inactivo" : "activo"}`}
                  >
                    {i.stock_actual} / mín. {i.stock_minimo}
                  </span>
                </td>
                <td>S/ {Number(i.precio_compra).toFixed(2)}</td>
                <td>S/ {Number(i.precio_venta).toFixed(2)}</td>
                <td>
                  <span
                    className={`estado ${i.activo ? "activo" : "inactivo"}`}
                  >
                    {i.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                {editable && (
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
                <td colSpan={8}>No hay repuestos.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
