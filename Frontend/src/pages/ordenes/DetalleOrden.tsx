import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import ReembolsosOrden from '../../components/ReembolsosOrden';
import "./DetalleOrden.css";
import { useAutenticacion } from "../../hooks/useAutenticacion";

interface Orden {
  id: number;
  codigo: string;
  vehiculo_id: number;
  recepcionista_id: number | null;
  mecanico_id: number | null;
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

interface Cliente {
  cliente_id: number;
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
}
interface Mecanico {
  id: number;
  nombres: string;
  apellidos: string;
  email: string | null;
  telefono: string | null;
  activo: boolean;
  rol: string;
}
interface Personal {
  id: number;
  nombres: string;
  apellidos: string;
  email: string | null;
  telefono: string | null;
}

interface Servicio {
  id: number;
  nombre: string;
  precio_unitario: number | string;
  cantidad: number;
  subtotal: number | string;
}
interface ServicioDisponible {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio_base: string;
  activo: boolean;
}
interface Repuesto {
  id: number;
  nombre: string;
  precio_unitario: number | string;
  cantidad: number;
  subtotal: number | string;
}
interface RepuestoDisponible {
  id: number;
  categoria_id: number;
  categoria: string;
  codigo: string;
  nombre: string;
  precio_compra: string;
  precio_venta: string;
  stock_actual: number;
  stock_minimo: number;
  activo: boolean;
}
interface Pago {
  id: number;
  monto: number;
  fecha: string;
  metodo_pago: string;
}
interface MetodoPago {
  id: number;
  nombre: string;
  activo: boolean;
}
interface ResumenPago {
  total: number;
  total_pagado: number;
  saldo_pendiente: number;
  porcentaje_pagado: number;
}

interface Historial {
  id: number;
  estado_id: number;
  estado: string;
  orden_estado: number;
  usuario_id: number;
  nombres: string;
  apellidos: string;
  rol: string;
  comentario: string | null;
  fecha: string;
}

interface DetalleOrden {
  orden: Orden;
  cliente: Cliente;
  vehiculo: Vehiculo;
  mecanico: Personal | null;
  recepcionista: Personal | null;
  servicios: Servicio[];
  repuestos: Repuesto[];
  pagos: Pago[];
  resumen_pago: ResumenPago;
  historial: Historial[];
}

function DetalleOrden() {
  const { id } = useParams();
  const navegar = useNavigate();
  const { usuario } = useAutenticacion();

  const [detalle, setDetalle] = useState<DetalleOrden | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mecanicos, setMecanicos] = useState<Mecanico[]>([]);
  const [mecanicoSeleccionado, setMecanicoSeleccionado] = useState("");
  const [guardandoMecanico, setGuardandoMecanico] = useState(false);
  const [errorMecanico, setErrorMecanico] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [guardandoDiagnostico, setGuardandoDiagnostico] = useState(false);
  const [errorDiagnostico, setErrorDiagnostico] = useState("");
  const [serviciosDisponibles, setServiciosDisponibles] = useState<
    ServicioDisponible[]
  >([]);
  const [servicioSeleccionado, setServicioSeleccionado] = useState("");
  const [cantidadServicio, setCantidadServicio] = useState("1");
  const [guardandoServicio, setGuardandoServicio] = useState(false);
  const [errorServicio, setErrorServicio] = useState("");
  const ordenBloqueada =
    detalle?.orden.estado_id === 6 || detalle?.orden.estado_id === 7;
  const [repuestosDisponibles, setRepuestosDisponibles] = useState<
    RepuestoDisponible[]
  >([]);

  const [repuestoSeleccionado, setRepuestoSeleccionado] = useState("");
  const [cantidadRepuesto, setCantidadRepuesto] = useState("1");
  const [guardandoRepuesto, setGuardandoRepuesto] = useState(false);
  const [errorRepuesto, setErrorRepuesto] = useState("");
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [errorEstado, setErrorEstado] = useState("");
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]);
  const [montoPago, setMontoPago] = useState("");
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState("");
  const [guardandoPago, setGuardandoPago] = useState(false);
  const [errorPago, setErrorPago] = useState("");
  useEffect(() => {
    const obtenerDetalle = async () => {
      try {
        setCargando(true);
        setError("");

        const [
          respuesta,
          respuestaServicios,
          respuestaRepuestos,
          respuestaMetodos,
        ] = await Promise.all([
          api.get(`/ordenes_trabajo/${id}/detalle`),
          api.get("/servicios"),
          api.get("/repuestos"),
          api.get("/metodos-pago"),
        ]);

        setDetalle(respuesta.data);
        setDiagnostico(respuesta.data.orden.diagnostico || "");

        const listaServicios = respuestaServicios.data.servicios || [];
        setServiciosDisponibles(
          listaServicios.filter(
            (servicio: ServicioDisponible) => servicio.activo,
          ),
        );

        const listaRepuestos = respuestaRepuestos.data.repuestos || [];
        setRepuestosDisponibles(
          listaRepuestos.filter(
            (repuesto: RepuestoDisponible) =>
              repuesto.activo && repuesto.stock_actual > 0,
          ),
        );

        const listaMetodos =
          respuestaMetodos.data.metodosPago ||
          respuestaMetodos.data.metodos_pago ||
          [];
        setMetodosPago(
          listaMetodos.filter((metodo: MetodoPago) => metodo.activo),
        );
      } catch (error) {
        console.error("Error al obtener el detalle de la orden:", error);

        setError("No se pudo obtener el detalle de la orden.");
      } finally {
        setCargando(false);
      }
    };

    if (id) {
      obtenerDetalle();
    }
  }, [id]);
  useEffect(() => {
    const obtenerMecanicos = async () => {
      try {
        const respuesta = await api.get("/usuarios/mecanicos/activos");

        const listaMecanicos = respuesta.data.usuarios.filter(
          (usuario: Mecanico) => usuario.rol === "mecanico" && usuario.activo,
        );

        setMecanicos(listaMecanicos);
      } catch (error) {
        console.error("Error al obtener mecánicos:", error);
      }
    };

    obtenerMecanicos();
  }, []);
  const formatearFecha = (fecha: string | null) => {
    if (!fecha) {
      return "No registrada";
    }

    return new Date(/^\d{4}-\d{2}-\d{2}$/.test(fecha) ? `${fecha}T00:00:00` : fecha).toLocaleDateString("es-PE");
  };

  const formatearFechaHora = (fecha: string) => {
    return new Date(fecha).toLocaleString("es-PE");
  };
  const asignarMecanico = async () => {
    if (!id || !mecanicoSeleccionado) {
      setErrorMecanico("Selecciona un mecánico.");
      return;
    }

    try {
      setGuardandoMecanico(true);
      setErrorMecanico("");

      await api.patch(`/ordenes_trabajo/${id}/mecanico`, {
        mecanico_id: Number(mecanicoSeleccionado),
      });

      const respuesta = await api.get(`/ordenes_trabajo/${id}/detalle`);

      setDetalle(respuesta.data);

      setMecanicoSeleccionado("");
    } catch (error) {
      console.error("Error al asignar mecánico:", error);

      setErrorMecanico("No se pudo asignar el mecánico.");
    } finally {
      setGuardandoMecanico(false);
    }
  };
  const guardarDiagnostico = async () => {
    if (!id || !diagnostico.trim()) {
      setErrorDiagnostico("Ingresa el diagnóstico.");
      return;
    }

    try {
      setGuardandoDiagnostico(true);
      setErrorDiagnostico("");

      await api.patch(`/ordenes_trabajo/${id}/diagnostico`, {
        diagnostico: diagnostico.trim(),
      });

      const respuesta = await api.get(`/ordenes_trabajo/${id}/detalle`);

      setDetalle(respuesta.data);
      setDiagnostico(respuesta.data.orden.diagnostico || "");
    } catch (error) {
      console.error("Error al guardar diagnóstico:", error);
      setErrorDiagnostico("No se pudo guardar el diagnóstico.");
    } finally {
      setGuardandoDiagnostico(false);
    }
  };
  const agregarServicio = async () => {
    if (!id || !servicioSeleccionado) {
      setErrorServicio("Selecciona un servicio.");
      return;
    }

    const cantidad = Number(cantidadServicio);

    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      setErrorServicio("La cantidad debe ser un número entero mayor que 0.");
      return;
    }

    try {
      setGuardandoServicio(true);
      setErrorServicio("");

      await api.post(`/ordenes_trabajo/${id}/servicios`, {
        servicio_id: Number(servicioSeleccionado),
        cantidad,
      });

      const respuesta = await api.get(`/ordenes_trabajo/${id}/detalle`);

      setDetalle(respuesta.data);
      setServicioSeleccionado("");
      setCantidadServicio("1");
    } catch (error) {
      console.error("Error al agregar servicio:", error);
      setErrorServicio("No se pudo agregar el servicio.");
    } finally {
      setGuardandoServicio(false);
    }
  };
  const eliminarServicio = async (detalleId: number) => {
    if (!id || !confirm("¿Retirar este servicio de la orden?")) return;
    try {
      await api.delete(`/ordenes_trabajo/${id}/servicios/${detalleId}`);
      const respuesta = await api.get(`/ordenes_trabajo/${id}/detalle`);
      setDetalle(respuesta.data);
    } catch (error: any) {
      setErrorServicio(
        error.response?.data?.mensaje || "No se pudo retirar el servicio.",
      );
    }
  };
  const obtenerRepuestosDisponibles = async () => {
    try {
      const respuesta = await api.get("/repuestos");

      const listaRepuestos = respuesta.data.repuestos || [];

      setRepuestosDisponibles(
        listaRepuestos.filter(
          (repuesto: RepuestoDisponible) =>
            repuesto.activo && repuesto.stock_actual > 0,
        ),
      );
    } catch (error) {
      console.error("Error al obtener repuestos:", error);
    }
  };
  const agregarRepuesto = async () => {
    if (!id || !repuestoSeleccionado) {
      setErrorRepuesto("Selecciona un repuesto.");
      return;
    }

    const cantidad = Number(cantidadRepuesto);

    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      setErrorRepuesto("La cantidad debe ser un número entero mayor que 0.");
      return;
    }

    const repuesto = repuestosDisponibles.find(
      (item) => item.id === Number(repuestoSeleccionado),
    );

    if (!repuesto) {
      setErrorRepuesto("El repuesto seleccionado no existe.");
      return;
    }

    if (cantidad > repuesto.stock_actual) {
      setErrorRepuesto(
        `Stock insuficiente. Disponible: ${repuesto.stock_actual}.`,
      );
      return;
    }

    try {
      setGuardandoRepuesto(true);
      setErrorRepuesto("");

      await api.post(`/ordenes_trabajo/${id}/repuestos`, {
        repuesto_id: Number(repuestoSeleccionado),
        cantidad,
      });

      const respuesta = await api.get(`/ordenes_trabajo/${id}/detalle`);

      setDetalle(respuesta.data);
      setRepuestoSeleccionado("");
      setCantidadRepuesto("1");

      await obtenerRepuestosDisponibles();
    } catch (error) {
      console.error("Error al agregar repuesto:", error);
      setErrorRepuesto("No se pudo agregar el repuesto.");
    } finally {
      setGuardandoRepuesto(false);
    }
  };

  const eliminarRepuesto = async (detalleId: number) => {
    if (!id || !confirm("¿Retirar este repuesto y devolverlo al inventario?"))
      return;
    try {
      await api.delete(`/ordenes_trabajo/${id}/repuestos/${detalleId}`);
      const respuesta = await api.get(`/ordenes_trabajo/${id}/detalle`);
      setDetalle(respuesta.data);
      await obtenerRepuestosDisponibles();
    } catch (error: any) {
      setErrorRepuesto(
        error.response?.data?.mensaje || "No se pudo retirar el repuesto.",
      );
    }
  };

  const recalcularTotal = async () => {
    if (!id || ordenBloqueada) {
      return;
    }

    try {
      await api.patch(`/ordenes_trabajo/${id}/total`);

      const respuesta = await api.get(`/ordenes_trabajo/${id}/detalle`);

      setDetalle(respuesta.data);
    } catch (error) {
      console.error("Error al recalcular total:", error);
    }
  };

  const registrarPago = async () => {
    if (!id || ordenBloqueada) {
      return;
    }

    setErrorPago("");

    const monto = Number(montoPago);

    if (!montoPago || isNaN(monto) || monto <= 0) {
      setErrorPago("Ingresa un monto de pago válido.");
      return;
    }

    if (!metodoPagoSeleccionado) {
      setErrorPago("Selecciona un método de pago.");
      return;
    }

    const saldoPendiente = Number(detalle?.resumen_pago.saldo_pendiente || 0);

    if (monto > saldoPendiente) {
      setErrorPago(
        `El monto no puede ser mayor al saldo pendiente de S/ ${saldoPendiente.toFixed(2)}.`,
      );
      return;
    }

    try {
      setGuardandoPago(true);

      await api.post(`/pagos/orden/${id}`, {
        monto,
        metodo_pago_id: Number(metodoPagoSeleccionado),
      });

      const respuesta = await api.get(`/ordenes_trabajo/${id}/detalle`);

      setDetalle(respuesta.data);

      setMontoPago("");
      setMetodoPagoSeleccionado("");
      setErrorPago("");
    } catch (error: any) {
      console.error("Error al registrar pago:", error);

      const mensaje =
        error.response?.data?.mensaje || "No se pudo registrar el pago.";

      setErrorPago(mensaje);
    } finally {
      setGuardandoPago(false);
    }
  };

  const cambiarEstado = async (nuevoEstadoId: number) => {
    if (!id || ordenBloqueada) {
      return;
    }

    try {
      setCambiandoEstado(true);
      setErrorEstado("");

      await api.patch(`/ordenes_trabajo/${id}/estado`, {
        estado_id: nuevoEstadoId,
      });

      const respuesta = await api.get(`/ordenes_trabajo/${id}/detalle`);

      setDetalle(respuesta.data);
    } catch (error: any) {
      console.error("Error al cambiar estado:", error);

      const mensaje =
        error.response?.data?.mensaje ||
        "No se pudo cambiar el estado de la orden.";

      setErrorEstado(mensaje);
    } finally {
      setCambiandoEstado(false);
    }
  };

  const obtenerSiguienteEstado = () => {
    if (!detalle) {
      return null;
    }

    const estadoActual = detalle.orden.estado_id;

    const siguientesEstados: {
      [key: number]: {
        id: number;
        nombre: string;
      } | null;
    } = {
      1: {
        id: 2,
        nombre: "En diagnóstico",
      },
      2: {
        id: 3,
        nombre: "Esperando aprobación",
      },
      3: {
        id: 4,
        nombre: "En reparación",
      },
      4: {
        id: 5,
        nombre: "Listo para entrega",
      },
      5: {
        id: 6,
        nombre: "Entregado",
      },
      6: null,
      7: null,
    };

    return siguientesEstados[estadoActual];
  };
  if (cargando) {
    return (
      <div className="detalle-orden">
        <div className="detalle-orden-cargando">
          Cargando información de la orden...
        </div>
      </div>
    );
  }

  if (error || !detalle) {
    return (
      <div className="detalle-orden">
        <div className="detalle-orden-error">
          {error || "No se encontró la orden."}
        </div>

        <button
          type="button"
          className="detalle-orden-boton-volver"
          onClick={() => navegar("/ordenes")}
        >
          Volver a órdenes
        </button>
      </div>
    );
  }

  const {
    orden,
    cliente,
    vehiculo,
    mecanico,
    recepcionista,
    servicios,
    repuestos,
    resumen_pago,
    historial,
  } = detalle;
  return (
    <div className="detalle-orden">
      {/* ENCABEZADO */}
      <div className="detalle-orden-encabezado">
        <div>
          <h1 className="detalle-orden-titulo">Detalle de Orden</h1>

          <p className="detalle-orden-codigo">{orden.codigo}</p>
        </div>

        <button
          type="button"
          className="detalle-orden-boton-volver"
          onClick={() => navegar("/ordenes")}
        >
          Volver
        </button>
      </div>

      <div className="detalle-orden-contenedor">
        {/* INFORMACIÓN DE LA ORDEN */}
        <section className="detalle-orden-seccion">
          <div className="detalle-orden-seccion-encabezado">
            <h2>Información de la orden</h2>
          </div>

          <div className="detalle-orden-grid">
            <div className="detalle-orden-dato">
              <span>Código</span>
              <strong>{orden.codigo}</strong>
            </div>

            <div className="detalle-orden-dato">
              <span>Estado</span>

              <strong
                className={`detalle-orden-estado estado-${orden.estado_id}`}
              >
                {orden.estado_nombre}
              </strong>
            </div>

            <div className="detalle-orden-dato">
              <span>Fecha de ingreso</span>

              <strong>{formatearFecha(orden.fecha_ingreso)}</strong>
            </div>

            <div className="detalle-orden-dato">
              <span>Entrega estimada</span>

              <strong>{formatearFecha(orden.fecha_estimada_entrega)}</strong>
            </div>

            <div className="detalle-orden-dato">
              <span>Fecha de entrega</span>

              <strong>{formatearFecha(orden.fecha_entrega)}</strong>
            </div>

            <div className="detalle-orden-dato">
              <span>Total de la orden</span>

              <strong className="detalle-orden-total">
                S/ {Number(orden.total).toFixed(2)}
              </strong>
            </div>
          </div>
        </section>

        {/* CLIENTE */}
        <section className="detalle-orden-seccion">
          <div className="detalle-orden-seccion-encabezado">
            <h2>Cliente</h2>
          </div>

          <div className="detalle-orden-grid">
            <div className="detalle-orden-dato">
              <span>Nombres</span>
              <strong>{cliente.nombres}</strong>
            </div>

            <div className="detalle-orden-dato">
              <span>Apellidos</span>
              <strong>{cliente.apellidos}</strong>
            </div>

            <div className="detalle-orden-dato">
              <span>DNI</span>
              <strong>{cliente.dni}</strong>
            </div>

            <div className="detalle-orden-dato">
              <span>Teléfono</span>
              <strong>{cliente.telefono || "No registrado"}</strong>
            </div>

            <div className="detalle-orden-dato">
              <span>Correo electrónico</span>
              <strong>{cliente.email || "No registrado"}</strong>
            </div>

            <div className="detalle-orden-dato">
              <span>Dirección</span>
              <strong>{cliente.direccion || "No registrada"}</strong>
            </div>
          </div>
        </section>

        {/* VEHÍCULO */}
        <section className="detalle-orden-seccion">
          <div className="detalle-orden-seccion-encabezado">
            <h2>Vehículo</h2>
          </div>

          <div className="detalle-orden-grid">
            <div className="detalle-orden-dato">
              <span>Placa</span>
              <strong>{vehiculo.placa}</strong>
            </div>

            <div className="detalle-orden-dato">
              <span>Marca</span>
              <strong>{vehiculo.marca}</strong>
            </div>

            <div className="detalle-orden-dato">
              <span>Modelo</span>
              <strong>{vehiculo.modelo}</strong>
            </div>

            <div className="detalle-orden-dato">
              <span>Año</span>
              <strong>{vehiculo.anio || "No registrado"}</strong>
            </div>

            <div className="detalle-orden-dato">
              <span>Color</span>
              <strong>{vehiculo.color || "No registrado"}</strong>
            </div>
          </div>
        </section>

        {/* PERSONAL */}
        <section className="detalle-orden-seccion">
          <div className="detalle-orden-seccion-encabezado">
            <h2>Personal responsable</h2>
          </div>

          <div className="detalle-orden-grid">
            <div className="detalle-orden-dato">
              <span>Recepcionista</span>

              <strong>
                {recepcionista
                  ? `${recepcionista.nombres} ${recepcionista.apellidos}`
                  : "No asignado"}
              </strong>
            </div>

            <div className="detalle-orden-dato">
              <span>Mecánico actual</span>

              <strong>
                {mecanico
                  ? `${mecanico.nombres} ${mecanico.apellidos}`
                  : "No asignado"}
              </strong>
            </div>
          </div>

          {(usuario?.rol === "administrador" ||
            usuario?.rol === "recepcionista") && (
            <div className="detalle-orden-asignacion">
              <div className="detalle-orden-campo">
                <label htmlFor="mecanico">
                  {mecanico ? "Cambiar mecánico" : "Asignar mecánico"}
                </label>

                <select
                  id="mecanico"
                  value={mecanicoSeleccionado}
                  onChange={(evento) =>
                    setMecanicoSeleccionado(evento.target.value)
                  }
                  disabled={ordenBloqueada}
                >
                  <option value="">Seleccionar mecánico</option>

                  {mecanicos.map((mecanicoDisponible) => (
                    <option
                      key={mecanicoDisponible.id}
                      value={mecanicoDisponible.id}
                    >
                      {mecanicoDisponible.nombres}{" "}
                      {mecanicoDisponible.apellidos}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="detalle-orden-boton-asignar"
                onClick={asignarMecanico}
                disabled={
                  ordenBloqueada || guardandoMecanico || !mecanicoSeleccionado
                }
              >
                {guardandoMecanico
                  ? "Guardando..."
                  : mecanico
                    ? "Cambiar mecánico"
                    : "Asignar"}
              </button>
            </div>
          )}

          {errorMecanico && (
            <div className="detalle-orden-error-campo">{errorMecanico}</div>
          )}
        </section>

        {/* PROBLEMA */}
        <section className="detalle-orden-seccion">
          <div className="detalle-orden-seccion-encabezado">
            <h2>Problema reportado</h2>
          </div>

          <div className="detalle-orden-texto">{orden.problema_reportado}</div>
        </section>

        {/* DIAGNÓSTICO */}
        <section className="detalle-orden-seccion">
          <div className="detalle-orden-seccion-encabezado">
            <h2>Diagnóstico</h2>
          </div>

          <div className="detalle-orden-diagnostico">
            <div className="detalle-orden-campo">
              <label htmlFor="diagnostico">Diagnóstico del vehículo</label>

              <textarea
                id="diagnostico"
                value={diagnostico}
                onChange={(evento) => setDiagnostico(evento.target.value)}
                placeholder="Describe el diagnóstico realizado al vehículo..."
                rows={5}
              />
            </div>

            {(usuario?.rol === "administrador" ||
              usuario?.rol === "mecanico") && (
              <div className="detalle-orden-diagnostico-acciones">
                <button
                  type="button"
                  className="detalle-orden-boton-guardar"
                  onClick={guardarDiagnostico}
                  disabled={
                    ordenBloqueada ||
                    guardandoDiagnostico ||
                    !diagnostico.trim()
                  }
                >
                  {guardandoDiagnostico
                    ? "Guardando..."
                    : "Guardar diagnóstico"}
                </button>
              </div>
            )}

            {errorDiagnostico && (
              <div className="detalle-orden-error-campo">
                {errorDiagnostico}
              </div>
            )}
          </div>
        </section>

        {/* OBSERVACIONES */}
        <section className="detalle-orden-seccion">
          <div className="detalle-orden-seccion-encabezado">
            <h2>Observaciones</h2>
          </div>

          <div className="detalle-orden-texto">
            {orden.observaciones || "No hay observaciones registradas."}
          </div>
        </section>

        {/* SERVICIOS */}
        <section className="detalle-orden-seccion">
          <div className="detalle-orden-seccion-encabezado">
            <h2>Servicios</h2>
          </div>

          <div className="detalle-orden-agregar">
            <div className="detalle-orden-campo">
              <label htmlFor="servicio">Servicio</label>

              <select
                id="servicio"
                value={servicioSeleccionado}
                onChange={(evento) =>
                  setServicioSeleccionado(evento.target.value)
                }
              >
                <option value="">Seleccionar servicio</option>

                {serviciosDisponibles.map((servicio) => (
                  <option key={servicio.id} value={servicio.id}>
                    {servicio.nombre} - S/{" "}
                    {Number(servicio.precio_base).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            <div className="detalle-orden-campo detalle-orden-campo-cantidad">
              <label htmlFor="cantidad-servicio">Cantidad</label>

              <input
                id="cantidad-servicio"
                type="number"
                min="1"
                value={cantidadServicio}
                onChange={(evento) => setCantidadServicio(evento.target.value)}
              />
            </div>

            <button
              type="button"
              className="detalle-orden-boton-agregar"
              onClick={agregarServicio}
              disabled={
                ordenBloqueada || guardandoServicio || !servicioSeleccionado
              }
            >
              {guardandoServicio ? "Agregando..." : "Agregar"}
            </button>
          </div>

          {errorServicio && (
            <div className="detalle-orden-error-campo">{errorServicio}</div>
          )}

          {servicios.length === 0 ? (
            <div className="detalle-orden-vacio">
              No hay servicios agregados.
            </div>
          ) : (
            <div className="detalle-orden-tabla-contenedor">
              <table className="detalle-orden-tabla">
                <thead>
                  <tr>
                    <th>Servicio</th>
                    <th>Precio</th>
                    <th>Cantidad</th>
                    <th>Subtotal</th>
                    {!ordenBloqueada && <th>Acción</th>}
                  </tr>
                </thead>

                <tbody>
                  {servicios.map((servicio) => (
                    <tr key={servicio.id}>
                      <td>{servicio.nombre}</td>

                      <td>S/ {Number(servicio.precio_unitario).toFixed(2)}</td>

                      <td>{servicio.cantidad}</td>

                      <td>S/ {Number(servicio.subtotal).toFixed(2)}</td>
                      {!ordenBloqueada && (
                        <td>
                          <button
                            type="button"
                            className="detalle-orden-boton-cancelar-estado"
                            onClick={() => eliminarServicio(servicio.id)}
                          >
                            Retirar
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* REPUESTOS */}
        <section className="detalle-orden-seccion">
          <div className="detalle-orden-seccion-encabezado">
            <h2>Repuestos</h2>
          </div>

          {!ordenBloqueada && (
            <>
              <div className="detalle-orden-agregar">
                <div className="detalle-orden-campo">
                  <label htmlFor="repuesto">Repuesto</label>

                  <select
                    id="repuesto"
                    value={repuestoSeleccionado}
                    onChange={(evento) =>
                      setRepuestoSeleccionado(evento.target.value)
                    }
                  >
                    <option value="">Seleccionar repuesto</option>

                    {repuestosDisponibles.map((repuesto) => (
                      <option key={repuesto.id} value={repuesto.id}>
                        {repuesto.codigo} - {repuesto.nombre} - S/{" "}
                        {Number(repuesto.precio_venta).toFixed(2)} — Stock:{" "}
                        {repuesto.stock_actual}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="detalle-orden-campo detalle-orden-campo-cantidad">
                  <label htmlFor="cantidad-repuesto">Cantidad</label>

                  <input
                    id="cantidad-repuesto"
                    type="number"
                    min="1"
                    value={cantidadRepuesto}
                    onChange={(evento) =>
                      setCantidadRepuesto(evento.target.value)
                    }
                  />
                </div>

                <button
                  type="button"
                  className="detalle-orden-boton-agregar"
                  onClick={agregarRepuesto}
                  disabled={guardandoRepuesto || !repuestoSeleccionado}
                >
                  {guardandoRepuesto ? "Agregando..." : "Agregar"}
                </button>
              </div>

              {errorRepuesto && (
                <div className="detalle-orden-error-campo">{errorRepuesto}</div>
              )}
            </>
          )}

          {repuestos.length === 0 ? (
            <div className="detalle-orden-vacio">
              No hay repuestos agregados.
            </div>
          ) : (
            <div className="detalle-orden-tabla-contenedor">
              <table className="detalle-orden-tabla">
                <thead>
                  <tr>
                    <th>Repuesto</th>
                    <th>Precio</th>
                    <th>Cantidad</th>
                    <th>Subtotal</th>
                    {!ordenBloqueada && <th>Acción</th>}
                  </tr>
                </thead>

                <tbody>
                  {repuestos.map((repuesto) => (
                    <tr key={repuesto.id}>
                      <td>{repuesto.nombre}</td>

                      <td>S/ {Number(repuesto.precio_unitario).toFixed(2)}</td>

                      <td>{repuesto.cantidad}</td>

                      <td>S/ {Number(repuesto.subtotal).toFixed(2)}</td>
                      {!ordenBloqueada && (
                        <td>
                          <button
                            type="button"
                            className="detalle-orden-boton-cancelar-estado"
                            onClick={() => eliminarRepuesto(repuesto.id)}
                          >
                            Retirar
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* RESUMEN DE PAGO */}
        <section className="detalle-orden-seccion">
          <div className="detalle-orden-seccion-encabezado">
            <h2>Resumen de pago</h2>
          </div>

          {/* RESUMEN */}
          <div className="detalle-orden-grid">
            <div className="detalle-orden-dato">
              <span>Total</span>

              <strong>S/ {Number(resumen_pago.total).toFixed(2)}</strong>
            </div>

            <div className="detalle-orden-dato">
              <span>Total pagado</span>

              <strong>S/ {Number(resumen_pago.total_pagado).toFixed(2)}</strong>
            </div>

            <div className="detalle-orden-dato">
              <span>{Number(detalle.orden.estado_id)===7?'Presupuesto no cobrado (orden cancelada)':'Saldo pendiente'}</span>

              <strong>
                S/ {Number(resumen_pago.saldo_pendiente).toFixed(2)}
              </strong>
            </div>

            <div className="detalle-orden-dato">
              <span>Porcentaje pagado</span>

              <strong>
                {Number(resumen_pago.porcentaje_pagado).toFixed(2)}%
              </strong>
            </div>
          </div>

          {/* REGISTRAR PAGO */}
          {(usuario?.rol === "administrador" ||
            usuario?.rol === "recepcionista") &&
            !ordenBloqueada &&
            Number(resumen_pago.saldo_pendiente) > 0 && (
              <div className="detalle-orden-pago-formulario">
                <div className="detalle-orden-campo">
                  <label htmlFor="monto-pago">Monto del pago</label>

                  <input
                    id="monto-pago"
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={Number(resumen_pago.saldo_pendiente)}
                    value={montoPago}
                    onChange={(evento) => setMontoPago(evento.target.value)}
                    placeholder="Ejemplo: 100.00"
                    disabled={guardandoPago}
                  />
                </div>

                <div className="detalle-orden-campo">
                  <label htmlFor="metodo-pago">Método de pago</label>

                  <select
                    id="metodo-pago"
                    value={metodoPagoSeleccionado}
                    onChange={(evento) =>
                      setMetodoPagoSeleccionado(evento.target.value)
                    }
                    disabled={guardandoPago}
                  >
                    <option value="">Seleccionar método de pago</option>

                    {metodosPago.map((metodo) => (
                      <option key={metodo.id} value={metodo.id}>
                        {metodo.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  className="detalle-orden-boton-agregar"
                  onClick={registrarPago}
                  disabled={
                    guardandoPago || !montoPago || !metodoPagoSeleccionado
                  }
                >
                  {guardandoPago ? "Registrando..." : "Registrar pago"}
                </button>
              </div>
            )}

          {errorPago && (
            <div className="detalle-orden-error-campo">{errorPago}</div>
          )}

          {/* MENSAJE CUANDO YA ESTÁ PAGADO */}
          {Number(resumen_pago.saldo_pendiente) <= 0 && (
            <div className="detalle-orden-pago-completado">
              La orden ha sido pagada completamente.
            </div>
          )}

          {/* HISTORIAL DE PAGOS */}
          <div className="detalle-orden-subseccion">
            <h3>Historial de pagos</h3>

            {detalle.pagos.length === 0 ? (
              <div className="detalle-orden-vacio">
                No hay pagos registrados.
              </div>
            ) : (
              <div className="detalle-orden-tabla-contenedor">
                <table className="detalle-orden-tabla">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Método de pago</th>
                      <th>Monto</th>
                    </tr>
                  </thead>

                  <tbody>
                    {detalle.pagos.map((pago) => (
                      <tr key={pago.id}>
                        <td>{formatearFechaHora(pago.fecha)}</td>

                        <td>{pago.metodo_pago}</td>

                        <td>S/ {Number(pago.monto).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* RESUMEN DE LA ORDEN */}
        <section className="detalle-orden-seccion">
          <div className="detalle-orden-seccion-encabezado">
            <h2>Resumen de la orden</h2>
          </div>

          <div className="detalle-orden-resumen-total">
            <div className="detalle-orden-resumen-fila">
              <span>Servicios</span>

              <strong>
                S/{" "}
                {servicios
                  .reduce(
                    (total, servicio) => total + Number(servicio.subtotal),
                    0,
                  )
                  .toFixed(2)}
              </strong>
            </div>

            <div className="detalle-orden-resumen-fila">
              <span>Repuestos</span>

              <strong>
                S/{" "}
                {repuestos
                  .reduce(
                    (total, repuesto) => total + Number(repuesto.subtotal),
                    0,
                  )
                  .toFixed(2)}
              </strong>
            </div>

            <div className="detalle-orden-resumen-separador"></div>

            <div className="detalle-orden-resumen-fila detalle-orden-resumen-total-final">
              <span>Total de la orden</span>

              <strong>
                S/ {Number(detalle.resumen_pago.total).toFixed(2)}
              </strong>
            </div>

            {!ordenBloqueada && (
              <button
                type="button"
                className="detalle-orden-boton-recalcular"
                onClick={recalcularTotal}
              >
                Recalcular total
              </button>
            )}
          </div>
        </section>

        {/* ESTADO DE LA ORDEN */}
        <section className="detalle-orden-seccion">
          <div className="detalle-orden-seccion-encabezado">
            <h2>Estado de la orden</h2>
          </div>

          <div className="detalle-orden-estado-contenido">
            <div className="detalle-orden-estado-actual">
              <span>Estado actual</span>

              <strong>{detalle.orden.estado_nombre}</strong>
            </div>

            {!ordenBloqueada && (
              <div className="detalle-orden-estado-acciones">
                {obtenerSiguienteEstado() && (
                  <button
                    type="button"
                    className="detalle-orden-boton-estado"
                    onClick={() => cambiarEstado(obtenerSiguienteEstado()!.id)}
                    disabled={cambiandoEstado}
                  >
                    {cambiandoEstado
                      ? "Actualizando..."
                      : `Pasar a ${obtenerSiguienteEstado()!.nombre}`}
                  </button>
                )}

                <button
                  type="button"
                  className="detalle-orden-boton-cancelar-estado"
                  onClick={() => cambiarEstado(7)}
                  disabled={cambiandoEstado}
                >
                  Cancelar orden
                </button>
              </div>
            )}
          </div>

          {errorEstado && (
            <div className="detalle-orden-error-campo">{errorEstado}</div>
          )}
        </section>

        {/* HISTORIAL */}
        {Number(detalle.orden.estado_id)===7&&<ReembolsosOrden ordenId={detalle.orden.id}/>}
        <section className="detalle-orden-seccion">
          <div className="detalle-orden-seccion-encabezado">
            <h2>Historial de estados</h2>
          </div>

          {historial.length === 0 ? (
            <div className="detalle-orden-vacio">
              No hay historial registrado.
            </div>
          ) : (
            <div className="detalle-orden-historial">
              {historial.map((registro, indice) => (
                <div key={registro.id} className="detalle-orden-historial-item">
                  <div className="detalle-orden-historial-indicador">
                    <div
                      className={`detalle-orden-historial-circulo estado-${registro.estado_id}`}
                    >
                      {registro.estado_id}
                    </div>

                    {indice < historial.length - 1 && (
                      <div className="detalle-orden-historial-linea"></div>
                    )}
                  </div>

                  <div className="detalle-orden-historial-contenido">
                    <div className="detalle-orden-historial-superior">
                      <strong>{registro.estado}</strong>

                      <span>{formatearFechaHora(registro.fecha)}</span>
                    </div>

                    <div className="detalle-orden-historial-usuario">
                      {registro.nombres} {registro.apellidos}
                      {" · "}
                      {registro.rol}
                    </div>

                    {registro.comentario && (
                      <div className="detalle-orden-historial-comentario">
                        {registro.comentario}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default DetalleOrden;
