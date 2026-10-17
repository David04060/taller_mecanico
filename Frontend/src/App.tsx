import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PaginaInicioSesion from "./pages/auth/PaginaInicioSesion";
import { ProveedorAutenticacion } from "./context/ContextoAutenticacion";
import RutaProtegida from "./routes/RutaProtegida";
import DisenoPrincipal from "./components/design/DisenoPrincipal";
import Dashboard from "./pages/dashboard/Dashboard";
import Clientes from "./pages/clientes/Clientes";
import Vehiculos from "./pages/vehiculos/Vehiculos";
import Ordenes from "./pages/ordenes/OrdenesTrabajo";
import DetalleOrden from "./pages/ordenes/DetalleOrden";
import Usuarios from "./pages/usuarios/Usuarios";
import Servicios from "./pages/servicios/Servicios";
import Repuestos from "./pages/repuestos/Repuestos";
import Inventario from "./pages/inventario/Inventario";
import Pagos from "./pages/pagos/Pagos";
import MiCuenta from "./pages/cliente/MiCuenta";
import DetalleMiOrden from "./pages/cliente/DetalleMiOrden";
import MiPerfil from "./pages/perfil/MiPerfil";
import { useAutenticacion } from "./hooks/useAutenticacion";
import type { ReactNode } from "react";

function InicioPorRol() {
  const { usuario } = useAutenticacion();
  if (usuario?.rol === "cliente") return <Navigate to="/mi-cuenta" replace />;
  if (usuario?.rol === "mecanico") return <Navigate to="/ordenes" replace />;
  return <Dashboard />;
}

function SoloRoles({
  roles,
  children,
}: {
  roles: string[];
  children: ReactNode;
}) {
  const { usuario } = useAutenticacion();
  if (!usuario || !roles.includes(usuario.rol))
    return <Navigate to="/dashboard" replace />;
  return children;
}

function Aplicacion() {
  return (
    <ProveedorAutenticacion>
      <BrowserRouter>
        <Routes>
          {/* Página de inicio de sesión */}
          <Route path="/" element={<PaginaInicioSesion />} />
          {/* Rutas protegidas */}
          <Route element={<RutaProtegida />}>
            <Route element={<DisenoPrincipal />}>
              {/* Dashboard principal */}
              <Route path="/dashboard" element={<InicioPorRol />} />
              {/* Página de clientes */}
              <Route
                path="/clientes"
                element={
                  <SoloRoles roles={["administrador", "recepcionista"]}>
                    <Clientes />
                  </SoloRoles>
                }
              />
              {/* Página de vehículos */}
              <Route
                path="/vehiculos"
                element={
                  <SoloRoles
                    roles={["administrador", "recepcionista", "mecanico"]}
                  >
                    <Vehiculos />
                  </SoloRoles>
                }
              />
              {/* Página de órdenes */}
              <Route
                path="/ordenes"
                element={
                  <SoloRoles
                    roles={["administrador", "recepcionista", "mecanico"]}
                  >
                    <Ordenes />
                  </SoloRoles>
                }
              />
              {/* Página de detalle de orden */}
              <Route
                path="/ordenes/:id"
                element={
                  <SoloRoles
                    roles={["administrador", "recepcionista", "mecanico"]}
                  >
                    <DetalleOrden />
                  </SoloRoles>
                }
              />
              <Route
                path="/usuarios"
                element={
                  <SoloRoles roles={["administrador"]}>
                    <Usuarios />
                  </SoloRoles>
                }
              />
              <Route
                path="/servicios"
                element={
                  <SoloRoles
                    roles={["administrador", "recepcionista", "mecanico"]}
                  >
                    <Servicios />
                  </SoloRoles>
                }
              />
              <Route
                path="/repuestos"
                element={
                  <SoloRoles
                    roles={["administrador", "recepcionista", "mecanico"]}
                  >
                    <Repuestos />
                  </SoloRoles>
                }
              />
              <Route
                path="/inventario"
                element={
                  <SoloRoles
                    roles={["administrador", "recepcionista", "mecanico"]}
                  >
                    <Inventario />
                  </SoloRoles>
                }
              />
              <Route
                path="/pagos"
                element={
                  <SoloRoles roles={["administrador", "recepcionista"]}>
                    <Pagos />
                  </SoloRoles>
                }
              />
              <Route
                path="/mi-cuenta"
                element={
                  <SoloRoles roles={["cliente"]}>
                    <MiCuenta />
                  </SoloRoles>
                }
              />
              <Route
                path="/mi-cuenta/ordenes/:id"
                element={
                  <SoloRoles roles={["cliente"]}>
                    <DetalleMiOrden />
                  </SoloRoles>
                }
              />
              <Route path="/mi-cuenta/vehiculos" element={<SoloRoles roles={["cliente"]}><MiCuenta key="vehiculos" apartado="vehiculos" /></SoloRoles>} />
              <Route path="/mi-cuenta/ordenes" element={<SoloRoles roles={["cliente"]}><MiCuenta key="ordenes" apartado="ordenes" /></SoloRoles>} />
              <Route path="/mi-cuenta/pagos" element={<SoloRoles roles={["cliente"]}><MiCuenta key="pagos" apartado="pagos" /></SoloRoles>} />
              <Route path="/mi-perfil" element={<MiPerfil />} />
            </Route>
          </Route>
          {/* Cualquier ruta inexistente vuelve al inicio de sesión */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ProveedorAutenticacion>
  );
}

export default Aplicacion;
