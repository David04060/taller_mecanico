export type ApartadoCliente = "resumen" | "vehiculos" | "ordenes" | "pagos";
export interface Vehiculo {
  id: number; placa: string; marca: string; modelo: string;
  anio: number | null; color: string | null; activo: boolean;
}
export interface Orden {
  id: number; codigo: string; placa: string; marca: string; modelo: string;
  estado: string; problema_reportado: string; diagnostico: string | null;
  fecha_ingreso: string; total: number | string; total_pagado: number | string;
  saldo_pendiente: number | string;
}
export interface Pago {
  pago_id: number; orden_codigo: string; placa: string; metodo_pago: string;
  monto: number | string; fecha_pago: string;
}
export interface DatosPortal { vehiculos: Vehiculo[]; ordenes: Orden[]; pagos: Pago[]; }
type Solicitar = (ruta: string) => Promise<{ data: Partial<DatosPortal> }>;

export async function cargarPortalCliente(apartado: ApartadoCliente, solicitar: Solicitar): Promise<DatosPortal> {
  const datos: DatosPortal = { vehiculos: [], ordenes: [], pagos: [] };
  const apartados = apartado === "resumen" ? ["vehiculos", "ordenes", "pagos"] as const : [apartado];
  await Promise.all(apartados.map(async nombre => {
    const { data } = await solicitar(`/clientes/mis-${nombre}`);
    // Cada respuesta alimenta únicamente el recurso solicitado.
    if (nombre === "vehiculos") datos.vehiculos = data.vehiculos ?? [];
    if (nombre === "ordenes") datos.ordenes = data.ordenes ?? [];
    if (nombre === "pagos") datos.pagos = data.pagos ?? [];
  }));
  return datos;
}
