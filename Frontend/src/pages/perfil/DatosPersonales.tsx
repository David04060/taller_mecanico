import { useEffect, useState, type FormEvent } from "react";
import { useAutenticacion } from "../../hooks/useAutenticacion";
import type { Usuario } from "../../context/ContextoAutenticacionBase";
import api from "../../services/api";
import "./Perfil.css";

type Datos = { nombres: string; apellidos: string; email: string; telefono: string; direccion: string };
function formulario(usuario: Usuario): Datos {
  return { nombres: usuario.nombres, apellidos: usuario.apellidos, email: usuario.email,
    telefono: usuario.telefono ?? "", direccion: usuario.direccion ?? "" };
}
export default function DatosPersonales() {
  const { usuario, actualizarUsuario } = useAutenticacion();
  const [datos, setDatos] = useState<Datos | null>(null);
  const [guardados, setGuardados] = useState<Datos | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    let vigente = true;
    setCargando(true); setError("");
    api.get<{ usuario: Usuario }>("/auth/me").then(({ data }) => {
      if (!vigente) return;
      actualizarUsuario(data.usuario);
      setDatos(formulario(data.usuario)); setGuardados(formulario(data.usuario));
    }).catch(() => { if (vigente) setError("No se pudieron cargar sus datos. Inténtelo nuevamente."); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [actualizarUsuario, intento]);
  const cliente = usuario?.rol === "cliente";
  const modificado = datos !== null && guardados !== null && Object.keys(datos).some(campo => datos[campo as keyof Datos] !== guardados[campo as keyof Datos]);
  const cambiar = (campo: keyof Datos, valor: string) => {
    setDatos(actual => actual ? { ...actual, [campo]: valor } : actual);
    setMensaje(""); setError("");
  };
  const guardar = async (evento: FormEvent) => {
    evento.preventDefault();
    if (!datos || guardando || !modificado) return;
    setGuardando(true); setError(""); setMensaje("");
    try {
      const { direccion, ...contacto } = datos;
      const { data } = await api.patch<{ usuario: Usuario; mensaje: string }>("/auth/me", cliente ? { ...contacto, direccion } : contacto);
      actualizarUsuario(data.usuario);
      setDatos(formulario(data.usuario)); setGuardados(formulario(data.usuario)); setMensaje(data.mensaje);
    } catch (err: unknown) {
      const fallo = err as { response?: { data?: { mensaje?: string } } };
      setError(fallo.response?.data?.mensaje ?? "No se pudieron guardar sus datos. Puede volver a intentarlo.");
    } finally { setGuardando(false); }
  };
  return <form className="panel perfil-datos" onSubmit={guardar} aria-labelledby="perfil-datos-titulo" aria-busy={cargando || guardando}>
    <div className="perfil-datos-cabecera"><div><h3 id="perfil-datos-titulo">Datos personales</h3><p>Mantenga actualizados sus datos de contacto.</p></div><span className="perfil-rol">{usuario?.rol}</span></div>
    {cargando && <p role="status">Cargando sus datos…</p>}
    {!cargando && datos && <fieldset className="campos-guardado" disabled={guardando}>
      <div className="formulario-grid">
        <div className="campo"><label htmlFor="perfil-nombres">Nombres</label><input id="perfil-nombres" autoComplete="given-name" required maxLength={80} value={datos.nombres} onChange={e => cambiar("nombres", e.target.value)} /></div>
        <div className="campo"><label htmlFor="perfil-apellidos">Apellidos</label><input id="perfil-apellidos" autoComplete="family-name" required maxLength={80} value={datos.apellidos} onChange={e => cambiar("apellidos", e.target.value)} /></div>
        <div className="campo"><label htmlFor="perfil-correo">Correo electrónico</label><input id="perfil-correo" type="email" autoComplete="email" required maxLength={120} value={datos.email} aria-describedby="perfil-correo-ayuda" onChange={e => cambiar("email", e.target.value)} /><small id="perfil-correo-ayuda">Usará este correo para iniciar sesión.</small></div>
        <div className="campo"><label htmlFor="perfil-telefono">Teléfono <span className="perfil-opcional">(opcional)</span></label><input id="perfil-telefono" type="tel" autoComplete="tel" maxLength={20} value={datos.telefono} onChange={e => cambiar("telefono", e.target.value)} /></div>
        {cliente && <div className="campo campo-completo"><label htmlFor="perfil-direccion">Dirección <span className="perfil-opcional">(opcional)</span></label><input id="perfil-direccion" autoComplete="street-address" maxLength={200} value={datos.direccion} onChange={e => cambiar("direccion", e.target.value)} /></div>}
      </div>
      {cliente && usuario?.dni && <p className="perfil-documento"><strong>DNI:</strong> {usuario.dni}</p>}
      <div className="gestion-acciones perfil-acciones"><button className="boton-secundario" type="button" disabled={!modificado} onClick={() => { setDatos(guardados); setError(""); setMensaje(""); }}>Descartar cambios</button><button className="boton-primario" disabled={!modificado}>{guardando ? "Guardando…" : "Guardar mis datos"}</button></div>
    </fieldset>}
    {error && <div className="mensaje-error perfil-feedback" role="alert">{error}</div>}
    {mensaje && <div className="mensaje-exito perfil-feedback" role="status">{mensaje}</div>}
    {!cargando && !datos && <button className="boton-secundario" type="button" onClick={() => setIntento(valor => valor + 1)}>Reintentar</button>}
  </form>;
}
