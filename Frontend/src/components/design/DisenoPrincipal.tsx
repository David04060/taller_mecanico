import { useState } from "react";
import { Outlet } from "react-router-dom";
import BarraLateral from "./BarraLateral";
import Encabezado from "./Encabezado";
import "./DisenoPrincipal.css";
import "./Sistema.css";
import "./Apartados.css";
export default function DisenoPrincipal() {
  const [abierta, setAbierta] = useState(false);
  return <div className="diseño-principal" onKeyDown={e=>{if(e.key==="Escape")setAbierta(false);}}>
    <a className="saltar-contenido" href="#contenido-taller">Saltar al contenido</a>
    <BarraLateral abierta={abierta} cerrar={()=>setAbierta(false)}/>
    <div className="contenido-principal"><Encabezado menuAbierto={abierta} alternarMenu={()=>setAbierta(!abierta)}/><main id="contenido-taller" className="contenido-pagina" tabIndex={-1}><Outlet/></main><footer className="pie-taller">Taller Mecánico <span>Gestión de vehículos, servicio y confianza.</span></footer></div>
  </div>;
}
