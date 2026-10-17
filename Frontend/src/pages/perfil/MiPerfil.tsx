import { useState, type FormEvent } from "react";
import DatosPersonales from "./DatosPersonales";
import api from "../../services/api";
import "../Gestion.css";
export default function MiPerfil() {
  const [guardando, setGuardando] = useState(false);
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
    if (guardando) return;
    setGuardando(true);
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
    } finally {
      setGuardando(false);
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
      <DatosPersonales />
      <form className="panel" onSubmit={guardar}>
          <fieldset disabled={guardando} className="campos-guardado">
        <h3>Cambiar contraseña</h3>
        <div className="formulario-grid">
          <div className="campo">
            <label htmlFor="miperfil-campo-1">Contraseña actual</label>
            <input id="miperfil-campo-1"
              type="password"
              required
              value={form.actual}
              onChange={(e) => setForm({ ...form, actual: e.target.value })}
            />
          </div>
          <div className="campo">
            <label htmlFor="miperfil-campo-2">Nueva contraseña</label>
            <input id="miperfil-campo-2"
              type="password"
              minLength={8}
              required
              value={form.nueva}
              onChange={(e) => setForm({ ...form, nueva: e.target.value })}
            />
          </div>
          <div className="campo">
            <label htmlFor="miperfil-campo-3">Confirmar nueva contraseña</label>
            <input id="miperfil-campo-3"
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
      </fieldset>
        </form>
    </section>
  );
}
