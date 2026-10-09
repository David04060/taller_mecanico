import { createContext } from "react";

export interface Usuario {
  id: number;
  nombres: string;
  apellidos: string;
  email: string;
  rol: string;
}

export interface ContextoAutenticacionProps {
  usuario: Usuario | null;
  token: string | null;
  autenticado: boolean;
  cargandoSesion: boolean;
  cerrarSesion: () => void;
  iniciarSesion: (token: string, usuario: Usuario) => void;
}

export const ContextoAutenticacion = createContext<
  ContextoAutenticacionProps | undefined
>(undefined);
