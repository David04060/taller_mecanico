import { Outlet } from "react-router-dom";
import BarraLateral from "./BarraLateral";
import Encabezado from "./Encabezado";
import "./DisenoPrincipal.css";

function DisenoPrincipal() {
  return (
    <div className="diseño-principal">
      <BarraLateral />

      <div className="contenido-principal">
        <Encabezado />

        <main className="contenido-pagina">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DisenoPrincipal;
