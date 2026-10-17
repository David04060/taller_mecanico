import { useEffect, useMemo, useState, type FormEvent } from "react";
import api from "../../services/api";
import { useAutenticacion } from "../../hooks/useAutenticacion";
import "../Gestion.css";
interface Item {
  id: number;
  codigo: string;
  nombre: string;
  categoria: string;
  stock_actual: number;
  stock_minimo: number;
  estado_stock: string;
  precio_compra: string;
  precio_venta: string;
}
interface Movimiento {
  id: number;
  repuesto: string;
  repuesto_codigo: string;
  orden_codigo: string | null;
  tipo: string;
  cantidad: number;
  motivo: string;
  fecha: string;
  usuario_nombres: string;
  usuario_apellidos: string;
}
export default function Inventario() {
  const [guardando, setGuardando] = useState(false);
  const { usuario } = useAutenticacion();
  const esAdmin = usuario?.rol === "administrador" || usuario?.rol === "recepcionista";
  const [items, setItems] = useState<Item[]>([]),
    [movimientos, setMovimientos] = useState<Movimiento[]>([]),
    [vista, setVista] = useState<"stock" | "movimientos">("stock"),
    [busqueda, setBusqueda] = useState(""),
    [error, setError] = useState(""),
    [mostrar, setMostrar] = useState(false),
    [entrada, setEntrada] = useState({
      repuesto_id: "",
      cantidad: "",
      motivo: "Compra a proveedor",
    });
  const cargar = async () => {
    try {
      const [i, m] = await Promise.all([
        api.get("/inventario"),
        api.get("/inventario/movimientos"),
      ]);
      setItems(i.data.inventario ?? []);
      setMovimientos(m.data.movimientos ?? []);
      setError("");
    } catch (e: any) {
      setError(e.response?.data?.mensaje ?? "No se pudo cargar el inventario.");
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
  const registrar = async (e: FormEvent) => {
    e.preventDefault();
    if (guardando) return;
    setGuardando(true);
    try {
      await api.post("/inventario/entrada", {
        repuesto_id: Number(entrada.repuesto_id),
        cantidad: Number(entrada.cantidad),
        motivo: entrada.motivo,
      });
      setMostrar(false);
      setEntrada({
        repuesto_id: "",
        cantidad: "",
        motivo: "Compra a proveedor",
      });
      await cargar();
    } catch (err: any) {
      setError(
        err.response?.data?.mensaje ?? "No se pudo registrar la entrada.",
      );
    } finally {
      setGuardando(false);
    }
  };
  const bajos = items.filter((i) => i.stock_actual <= i.stock_minimo).length;
  return (
    <section className="gestion">
      <div className="gestion-encabezado">
        <div>
          <h2>Inventario</h2>
          <p>Existencias y trazabilidad de movimientos.</p>
        </div>
        {esAdmin && (
          <button className="boton-primario" onClick={() => setMostrar(true)}>
            Registrar entrada
          </button>
        )}
      </div>
      {error && <div className="mensaje-error" role="alert">{error}</div>}
      <div className="tarjetas-resumen">
        <div className="tarjeta-resumen">
          <span>Repuestos</span>
          <strong>{items.length}</strong>
        </div>
        <div className="tarjeta-resumen">
          <span>Bajo stock</span>
          <strong>{bajos}</strong>
        </div>
        <div className="tarjeta-resumen">
          <span>Movimientos</span>
          <strong>{movimientos.length}</strong>
        </div>
      </div>
      {mostrar && (
        <form className="panel" onSubmit={registrar}>
          <fieldset disabled={guardando} className="campos-guardado">
          <div className="formulario-grid">
            <div className="campo">
              <label htmlFor="inventario-campo-1">Repuesto</label>
              <select id="inventario-campo-1"
                required
                value={entrada.repuesto_id}
                onChange={(e) =>
                  setEntrada({ ...entrada, repuesto_id: e.target.value })
                }
              >
                <option value="">Seleccione</option>
                {items.map((i) => (
                  <option value={i.id} key={i.id}>
                    {i.codigo} — {i.nombre} (actual: {i.stock_actual})
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label htmlFor="inventario-campo-2">Cantidad</label>
              <input id="inventario-campo-2"
                required
                min="1"
                type="number"
                value={entrada.cantidad}
                onChange={(e) =>
                  setEntrada({ ...entrada, cantidad: e.target.value })
                }
              />
            </div>
            <div className="campo">
              <label htmlFor="inventario-campo-3">Motivo</label>
              <input id="inventario-campo-3"
                required
                value={entrada.motivo}
                onChange={(e) =>
                  setEntrada({ ...entrada, motivo: e.target.value })
                }
              />
            </div>
          </div>
          <div className="gestion-acciones" style={{ marginTop: "1rem" }}>
            <button className="boton-primario">Registrar</button>
            <button
              type="button"
              className="boton-secundario"
              onClick={() => setMostrar(false)}
            >
              Cancelar
            </button>
          </div>
        </fieldset>
        </form>
      )}
      <div className="filtros">
        <button
          className={vista === "stock" ? "boton-primario" : "boton-secundario"}
          onClick={() => setVista("stock")}
        >
          Existencias
        </button>
        <button
          className={
            vista === "movimientos" ? "boton-primario" : "boton-secundario"
          }
          onClick={() => setVista("movimientos")}
        >
          Movimientos
        </button>
        {vista === "stock" && (
          <input
            placeholder="Buscar repuesto"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        )}
      </div>
      {vista === "stock" ? (
        <div className="tabla-contenedor">
          <table className="tabla-gestion">
            <thead>
              <tr>
                <th>Código</th>
                <th>Repuesto</th>
                <th>Categoría</th>
                <th>Stock</th>
                <th>Mínimo</th>
                <th>Estado</th>
                <th>Valor compra</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((i) => (
                <tr key={i.id}>
                  <td>{i.codigo}</td>
                  <td>{i.nombre}</td>
                  <td>{i.categoria}</td>
                  <td>{i.stock_actual}</td>
                  <td>{i.stock_minimo}</td>
                  <td>
                    <span
                      className={`estado ${i.stock_actual <= i.stock_minimo ? "inactivo" : "activo"}`}
                    >
                      {i.estado_stock}
                    </span>
                  </td>
                  <td>
                    S/ {(Number(i.precio_compra) * i.stock_actual).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla-gestion">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Repuesto</th>
                <th>Tipo</th>
                <th>Cantidad</th>
                <th>Orden</th>
                <th>Motivo</th>
                <th>Usuario</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((m) => (
                <tr key={m.id}>
                  <td>{new Date(m.fecha).toLocaleString("es-PE")}</td>
                  <td>
                    {m.repuesto_codigo} — {m.repuesto}
                  </td>
                  <td>{m.tipo}</td>
                  <td>{m.cantidad}</td>
                  <td>{m.orden_codigo ?? "—"}</td>
                  <td>{m.motivo}</td>
                  <td>
                    {m.usuario_nombres} {m.usuario_apellidos}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
