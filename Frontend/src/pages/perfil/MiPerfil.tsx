import { useState, type FormEvent } from "react";
import { useAutenticacion } from "../../hooks/useAutenticacion";
import api from "../../services/api";
import "../Gestion.css";
export default function MiPerfil() {
  const { usuario } = useAutenticacion();
  const [form, setForm] = useState({ actual: "", nueva: "", confirmacion: "" }),
    [mensaje, setMensaje] = useState(""),
    [error, setError] = useState("");
  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMensaje("");
    if (form.nueva !== form.confirmacion) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }
    try {
      const { data } = await api.patch("/auth/password", {
        password_actual: form.actual,
        password_nueva: form.nueva,
      });
      setMensaje(data.mensaje);
      setForm({ actual: "", nueva: "", confirmacion: "" });
    } catch (err: any) {
      setError(
        err.response?.data?.mensaje ?? "No se pudo actualizar la contraseña.",
      );
    }
  };
  return (
    <section className="gestion">
      <div className="gestion-encabezado">
        <div>
          <h2>Mi perfil</h2>
          <p>Datos de la cuenta y seguridad.</p>
        </div>
      </div>
      <div className="panel">
        <h3>
          {usuario?.nombres} {usuario?.apellidos}
        </h3>
        <p>
          <strong>Correo:</strong> {usuario?.email}
        </p>
        <p>
          <strong>Rol:</strong> {usuario?.rol}
        </p>
      </div>
      <form className="panel" onSubmit={guardar}>
        <h3>Cambiar contraseña</h3>
        <div className="formulario-grid">
          <div className="campo">
            <label>Contraseña actual</label>
            <input
              type="password"
              required
              value={form.actual}
              onChange={(e) => setForm({ ...form, actual: e.target.value })}
            />
          </div>
          <div className="campo">
            <label>Nueva contraseña</label>
            <input
              type="password"
              minLength={8}
              required
              value={form.nueva}
              onChange={(e) => setForm({ ...form, nueva: e.target.value })}
            />
          </div>
          <div className="campo">
            <label>Confirmar nueva contraseña</label>
            <input
              type="password"
              minLength={8}
              required
              value={form.confirmacion}
              onChange={(e) =>
                setForm({ ...form, confirmacion: e.target.value })
              }
            />
          </div>
        </div>
        {error && (
          <div className="mensaje-error" style={{ marginTop: "1rem" }}>
            {error}
          </div>
        )}
        {mensaje && (
          <div className="mensaje-exito" style={{ marginTop: "1rem" }}>
            {mensaje}
          </div>
        )}
        <button className="boton-primario" style={{ marginTop: "1rem" }}>
          Actualizar contraseña
        </button>
      </form>
    </section>
  );
}
