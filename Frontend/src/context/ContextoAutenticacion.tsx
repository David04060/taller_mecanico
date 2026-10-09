import { useEffect, useState, type ReactNode } from "react";
import {
  ContextoAutenticacion,
  type Usuario,
} from "./ContextoAutenticacionBase";

interface ProveedorAutenticacionProps {
  children: ReactNode;
}

export function ProveedorAutenticacion({
  children,
}: ProveedorAutenticacionProps) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Indica si todavía estamos comprobando la sesión guardada
  const [cargandoSesion, setCargandoSesion] = useState(true);

  useEffect(() => {
    const recuperarSesion = async () => {
      const tokenGuardado = localStorage.getItem("token");
      const usuarioGuardado = localStorage.getItem("usuario");

      if (tokenGuardado && usuarioGuardado) {
        try {
          const usuarioConvertido: Usuario = JSON.parse(usuarioGuardado);

          const baseApi = import.meta.env.VITE_API_URL || "/api";
          const respuesta = await fetch(`${baseApi}/auth/me`, {
            headers: { Authorization: `Bearer ${tokenGuardado}` },
          });
          if (!respuesta.ok) {
            throw new Error("La sesión guardada ya no es válida");
          }
          const datos = await respuesta.json();
          setToken(tokenGuardado);
          setUsuario(datos.usuario ?? usuarioConvertido);
        } catch (error) {
          console.error("Error al recuperar la sesión:", error);

          localStorage.removeItem("token");
          localStorage.removeItem("usuario");

          setToken(null);
          setUsuario(null);
        }
      }

      // Ya terminamos de comprobar la sesión
      setCargandoSesion(false);
    };

    recuperarSesion();
  }, []);

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");

    setToken(null);
    setUsuario(null);
  };

  const iniciarSesion = (nuevoToken: string, nuevoUsuario: Usuario) => {
    localStorage.setItem("token", nuevoToken);
    localStorage.setItem("usuario", JSON.stringify(nuevoUsuario));
    setToken(nuevoToken);
    setUsuario(nuevoUsuario);
  };

  const autenticado = Boolean(token && usuario);

  return (
    <ContextoAutenticacion.Provider
      value={{
        usuario,
        token,
        autenticado,
        cargandoSesion,
        cerrarSesion,
        iniciarSesion,
      }}
    >
      {children}
    </ContextoAutenticacion.Provider>
  );
}
