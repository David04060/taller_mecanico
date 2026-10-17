import { useLocation, useNavigate } from "react-router-dom";
import { useAutenticacion } from "../../hooks/useAutenticacion";

import Icono from "./Icono";

function Encabezado({ menuAbierto, alternarMenu }: { menuAbierto: boolean; alternarMenu: () => void }) {
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const { usuario, cerrarSesion } = useAutenticacion();

  const manejarCerrarSesion = () => {
    cerrarSesion();
    navegar("/", { replace: true });
  };
  const titulos: Record<string, string> = {
    "/dashboard": "Vista general",
    "/clientes": "Clientes",
    "/vehiculos": "Vehículos",
    "/ordenes": "Órdenes de trabajo",
    "/servicios": "Servicios",
    "/repuestos": "Repuestos",
    "/inventario": "Inventario",
    "/pagos": "Pagos",
    "/usuarios": "Usuarios",
    "/mi-cuenta": "Vista general",
    "/mi-cuenta/vehiculos": "Mis vehículos",
    "/mi-cuenta/ordenes": "Mis órdenes",
    "/mi-cuenta/pagos": "Mis pagos",
    "/mi-perfil": "Mi perfil",
  };
  const titulo =
    ubicacion.pathname.startsWith("/ordenes/") ||
    ubicacion.pathname.startsWith("/mi-cuenta/ordenes/")
      ? "Detalle de orden"
      : (titulos[ubicacion.pathname] ?? "Taller Mecánico");

  return (
    <header className="encabezado">
      <button className="boton-menu" onClick={alternarMenu} aria-expanded={menuAbierto} aria-controls="navegacion-taller" aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}><Icono nombre="menu"/></button>
      <div className="encabezado-titulo">
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
          <Icono nombre="salir" size={17}/> Cerrar sesión
        </button>
      </div>
    </header>
  );
}

export default Encabezado;
