import { NavLink } from "react-router-dom";
import { useAutenticacion } from "../../hooks/useAutenticacion";

function BarraLateral() {
  const { usuario } = useAutenticacion();
  const rol = usuario?.rol;
  const administrativo = rol === "administrador" || rol === "recepcionista";

  return (
    <aside className="barra-lateral">
      <div className="barra-lateral-logo">
        <div className="logo-icono">TM</div>

        <div>
          <h2>Taller Mecánico</h2>
          <span>Sistema de gestión</span>
        </div>
      </div>

      <nav className="barra-lateral-navegacion">
        {administrativo && (
          <NavLink to="/dashboard" className="enlace-navegacion">
            <span>⌂</span>
            Inicio
          </NavLink>
        )}

        {administrativo && (
          <NavLink to="/clientes" className="enlace-navegacion">
            <span>👥</span>
            Clientes
          </NavLink>
        )}

        {(administrativo || rol === "mecanico") && (
          <NavLink to="/vehiculos" className="enlace-navegacion">
            <span>🚗</span>
            Vehículos
          </NavLink>
        )}

        {(administrativo || rol === "mecanico") && (
          <NavLink to="/ordenes" className="enlace-navegacion">
            <span>🔧</span>
            Órdenes de trabajo
          </NavLink>
        )}

        {(administrativo || rol === "mecanico") && (
          <NavLink to="/servicios" className="enlace-navegacion">
            <span>⚙</span>
            Servicios
          </NavLink>
        )}

        {(administrativo || rol === "mecanico") && (
          <NavLink to="/repuestos" className="enlace-navegacion">
            <span>📦</span>
            Repuestos
          </NavLink>
        )}

        {(administrativo || rol === "mecanico") && (
          <NavLink to="/inventario" className="enlace-navegacion">
            <span>📋</span>
            Inventario
          </NavLink>
        )}

        {administrativo && (
          <NavLink to="/pagos" className="enlace-navegacion">
            <span>💰</span>
            Pagos
          </NavLink>
        )}

        {rol === "administrador" && (
          <NavLink to="/usuarios" className="enlace-navegacion">
            <span>🛡</span>Usuarios
          </NavLink>
        )}
        {rol === "cliente" && (
          <NavLink to="/mi-cuenta" className="enlace-navegacion">
            <span>⌂</span>Mi cuenta
          </NavLink>
        )}
        <NavLink to="/mi-perfil" className="enlace-navegacion">
          <span>⚙</span>Mi perfil
        </NavLink>
      </nav>

      <div className="barra-lateral-usuario">
        <span className="usuario-rol">{usuario?.rol}</span>

        <span className="usuario-nombre">
          {usuario?.nombres} {usuario?.apellidos}
        </span>
      </div>
    </aside>
  );
}

export default BarraLateral;
