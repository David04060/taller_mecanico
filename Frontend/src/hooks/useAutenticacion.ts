import { useContext } from "react";
import { ContextoAutenticacion } from "../context/ContextoAutenticacionBase";

export function useAutenticacion() {
  const contexto = useContext(ContextoAutenticacion);

  if (!contexto) {
    throw new Error(
      "useAutenticacion debe utilizarse dentro de ProveedorAutenticacion",
    );
  }

  return contexto;
}
