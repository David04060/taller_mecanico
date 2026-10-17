import { NavLink } from "react-router-dom";
import { useAutenticacion } from "../../hooks/useAutenticacion";
import Icono from "./Icono";
const enlaces = [
  { ruta: "/dashboard", texto: "Vista general", icono: "inicio", grupo: "Operación", roles: ["administrador", "recepcionista"] },
  { ruta: "/ordenes", texto: "Órdenes de trabajo", icono: "ordenes", grupo: "Operación", roles: ["administrador", "recepcionista", "mecanico"] },
  { ruta: "/clientes", texto: "Clientes", icono: "clientes", grupo: "Operación", roles: ["administrador", "recepcionista"] },
  { ruta: "/vehiculos", texto: "Vehículos", icono: "vehiculos", grupo: "Operación", roles: ["administrador", "recepcionista", "mecanico"] },
  { ruta: "/servicios", texto: "Servicios", icono: "servicios", grupo: "Recursos", roles: ["administrador", "recepcionista", "mecanico"] },
  { ruta: "/repuestos", texto: "Repuestos", icono: "repuestos", grupo: "Recursos", roles: ["administrador", "recepcionista", "mecanico"] },
  { ruta: "/inventario", texto: "Inventario", icono: "inventario", grupo: "Recursos", roles: ["administrador", "recepcionista", "mecanico"] },
  { ruta: "/pagos", texto: "Pagos", icono: "pagos", grupo: "Administración", roles: ["administrador", "recepcionista"] },
  { ruta: "/usuarios", texto: "Personal y accesos", icono: "usuarios", grupo: "Administración", roles: ["administrador"] },
  { ruta: "/mi-cuenta", texto: "Vista general", icono: "inicio", grupo: "Mi taller", roles: ["cliente"] },
  { ruta: "/mi-cuenta/vehiculos", texto: "Mis vehículos", icono: "vehiculos", grupo: "Mi taller", roles: ["cliente"] },
  { ruta: "/mi-cuenta/ordenes", texto: "Mis órdenes", icono: "ordenes", grupo: "Mi taller", roles: ["cliente"] },
  { ruta: "/mi-cuenta/pagos", texto: "Mis pagos", icono: "pagos", grupo: "Mi taller", roles: ["cliente"] },
];
export default function BarraLateral({ abierta, cerrar }: { abierta: boolean; cerrar: () => void }) {
  const { usuario } = useAutenticacion();
  const visibles = enlaces.filter(e => e.roles.includes(usuario?.rol ?? ""));
  return <aside id="navegacion-taller" className={`barra-lateral ${abierta ? "abierta" : ""}`}>
    <div className="barra-lateral-logo"><div className="logo-icono"><Icono nombre="servicios" size={25} /></div><div><h2>Taller Mecánico</h2><span>CONTROL Y SERVICIO</span></div></div>
    <nav className="barra-lateral-navegacion" aria-label="Navegación principal">
      {Array.from(new Set(visibles.map(e=>e.grupo))).map(grupo=><div className="nav-grupo" key={grupo}><p className="nav-etiqueta">{grupo}</p>{visibles.filter(e=>e.grupo===grupo).map(e=><NavLink key={e.ruta} to={e.ruta} end={e.ruta === "/mi-cuenta"} onClick={cerrar} className="enlace-navegacion"><Icono nombre={e.icono}/><span>{usuario?.rol === "mecanico" && e.ruta === "/ordenes" ? "Mis órdenes" : e.texto}</span></NavLink>)}</div>)}
      <div className="nav-grupo"><p className="nav-etiqueta">Cuenta</p><NavLink to="/mi-perfil" onClick={cerrar} className="enlace-navegacion"><Icono nombre="perfil"/><span>Mi perfil</span></NavLink></div>
    </nav>
    <div className="barra-lateral-usuario"><div className="avatar-usuario">{usuario?.nombres?.slice(0,1)}{usuario?.apellidos?.slice(0,1)}</div><div><span className="usuario-nombre">{usuario?.nombres}</span><span className="usuario-rol">{usuario?.rol === "mecanico" ? "Mecánico" : usuario?.rol}</span></div></div>
  </aside>;
}
