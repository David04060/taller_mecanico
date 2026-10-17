import { useCallback, useEffect, useState, type ReactNode } from "react";
import { comprobarSesion } from './comprobarSesion';
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
  const [errorSesion, setErrorSesion] = useState(false);

  useEffect(() => {
    const recuperarSesion = async () => {
      const tokenGuardado = localStorage.getItem("token");
      const usuarioGuardado = localStorage.getItem("usuario");

      if (tokenGuardado && usuarioGuardado) {
        try {
          const baseApi = import.meta.env.VITE_API_URL || "/api";
          const resultado = await comprobarSesion(baseApi, tokenGuardado);
          if (resultado.estado === 'temporal') {
            setErrorSesion(true);
            setCargandoSesion(false);
            return;
          }
          if (resultado.estado === 'invalida') {
            throw new Error("La sesión guardada ya no es válida");
          }
          setToken(tokenGuardado);
          setUsuario(resultado.usuario);
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
    setErrorSesion(false);
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
  const actualizarUsuario = useCallback((datos: Usuario) => {
    localStorage.setItem("usuario", JSON.stringify(datos));
    setUsuario(datos);
  }, []);

  return (
    <ContextoAutenticacion.Provider
      value={{
        usuario,
        token,
        autenticado,
        cargandoSesion,
        cerrarSesion,
        iniciarSesion,
        actualizarUsuario,
      }}
    >
      {errorSesion ? <main style={{maxWidth: 480, margin: '15vh auto', padding: 24}}>
        <h1>No se pudo comprobar la sesión</h1>
        <p role="alert">El servidor no está disponible en este momento. Conservamos tu sesión para que puedas reintentar.</p>
        <button onClick={() => window.location.reload()}>Reintentar</button>{' '}
        <button onClick={cerrarSesion}>Volver al inicio de sesión</button>
      </main> : children}
    </ContextoAutenticacion.Provider>
  );
}
