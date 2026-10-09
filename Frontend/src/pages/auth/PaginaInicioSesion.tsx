import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./PaginaInicioSesion.css";
import { useAutenticacion } from "../../hooks/useAutenticacion";

interface Usuario {
  id: number;
  nombres: string;
  apellidos: string;
  email: string;
  rol: string;
}

function PaginaInicioSesion() {
  const navegar = useNavigate();
  const { iniciarSesion } = useAutenticacion();

  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const manejarInicioSesion = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();

    setError("");
    setCargando(true);

    try {
      const respuesta = await api.post("/auth/login", {
        email: correo,
        password: contrasena,
      });

      const datos = respuesta.data;
      const token = datos.token;
      const usuario: Usuario = datos.usuario;

      if (!token || !usuario) {
        throw new Error(
          "La respuesta del servidor no contiene el token o los datos del usuario.",
        );
      }

      iniciarSesion(token, usuario);
      navegar(usuario.rol === "cliente" ? "/mi-cuenta" : "/dashboard");
    } catch (errorDesconocido: any) {
      if (errorDesconocido.response?.status === 401) {
        setError("Correo electrónico o contraseña incorrectos.");
      } else {
        setError(
          errorDesconocido.response?.data?.mensaje ||
            errorDesconocido.message ||
            "No se pudo iniciar sesión. Verifica la conexión con el servidor.",
        );
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="login-container">
      <section className="login-card">
        <div className="login-header">
          <div className="login-icon">TM</div>

          <h1>Taller Mecánico</h1>
          <p>Sistema de gestión automotriz</p>
        </div>

        <form onSubmit={manejarInicioSesion} className="login-form">
          <div className="form-group">
            <label htmlFor="correo">Correo electrónico</label>

            <input
              id="correo"
              type="email"
              placeholder="Ingrese su correo"
              value={correo}
              onChange={(evento) => setCorreo(evento.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="contrasena">Contraseña</label>

            <input
              id="contrasena"
              type="password"
              placeholder="Ingrese su contraseña"
              value={contrasena}
              onChange={(evento) => setContrasena(evento.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <button type="submit" disabled={cargando}>
            {cargando ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>

        <footer className="login-footer">
          <p>Acceso exclusivo para usuarios registrados</p>
        </footer>
      </section>
    </main>
  );
}

export default PaginaInicioSesion;
