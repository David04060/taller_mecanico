import { Navigate, Outlet } from "react-router-dom";
import { useAutenticacion } from "../hooks/useAutenticacion";

function RutaProtegida() {
  const { autenticado, cargandoSesion } = useAutenticacion();

  // Todavía estamos comprobando si existe una sesión
  if (cargandoSesion) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: "Arial",
        }}
      >
        <p>Comprobando sesión...</p>
      </main>
    );
  }

  // Ya comprobamos la sesión y no existe
  if (!autenticado) {
    return <Navigate to="/" replace />;
  }

  // El usuario está autenticado
  return <Outlet />;
}

export default RutaProtegida;
