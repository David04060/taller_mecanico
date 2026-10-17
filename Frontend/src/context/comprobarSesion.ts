import type { Usuario } from './ContextoAutenticacionBase';

type ResultadoSesion = { estado: 'valida'; usuario: Usuario } | { estado: 'invalida'; usuario?: never } | { estado: 'temporal'; usuario?: never };

export async function comprobarSesion(baseApi: string, token: string, solicitar: typeof fetch = fetch): Promise<ResultadoSesion> {
  try {
    const respuesta = await solicitar(`${baseApi}/auth/me`, {headers: {Authorization: `Bearer ${token}`}});
    if (respuesta.status === 401 || respuesta.status === 403) return {estado: 'invalida'};
    if (!respuesta.ok) return {estado: 'temporal'};
    const datos = await respuesta.json();
    if (!datos.usuario) return {estado: 'temporal'};
    return {estado: 'valida', usuario: datos.usuario};
  } catch {
    return {estado: 'temporal'};
  }
}
