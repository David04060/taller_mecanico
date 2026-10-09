import { useLocation, useNavigate } from "react-router-dom";
import { useAutenticacion } from "../../hooks/useAutenticacion";

function Encabezado() {
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const { usuario, cerrarSesion } = useAutenticacion();

  const manejarCerrarSesion = () => {
    cerrarSesion();
    navegar("/", { replace: true });
  };
  const titulos: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/clientes": "Clientes",
    "/vehiculos": "Vehículos",
    "/ordenes": "Órdenes de trabajo",
    "/servicios": "Servicios",
    "/repuestos": "Repuestos",
    "/inventario": "Inventario",
    "/pagos": "Pagos",
    "/usuarios": "Usuarios",
    "/mi-cuenta": "Mi cuenta",
    "/mi-perfil": "Mi perfil",
  };
  const titulo =
    ubicacion.pathname.startsWith("/ordenes/") ||
    ubicacion.pathname.startsWith("/mi-cuenta/ordenes/")
      ? "Detalle de orden"
      : (titulos[ubicacion.pathname] ?? "Taller Mecánico");

  return (
    <header className="encabezado">
      <div>
        <h1>{titulo}</h1>
        <p>Bienvenido, {usuario?.nombres}</p>
      </div>

      <div className="encabezado-usuario">
        <div className="informacion-usuario">
          <strong>
            {usuario?.nombres} {usuario?.apellidos}
          </strong>

          <span>{usuario?.rol}</span>
        </div>

        <button className="boton-cerrar-sesion" onClick={manejarCerrarSesion}>
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}

export default Encabezado;
