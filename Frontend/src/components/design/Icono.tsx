import type { CSSProperties } from "react";
const paths: Record<string, string> = {
  inicio: "M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z",
  clientes: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  vehiculos: "M5 17H3v-6l2-6h14l2 6v6h-2M5 17h14M5 11h14M7 14h.01M17 14h.01M5 17v3M19 17v3",
  ordenes: "M9 5H5v16h14V5h-4M9 3h6v4H9ZM8 12h8M8 16h5",
  servicios: "M14.7 6.3a5 5 0 0 0-6.4 6.4L3 18a2 2 0 0 0 3 3l5.3-5.3a5 5 0 0 0 6.4-6.4L14 13l-3-3Z",
  repuestos: "m12 3 9 5-9 5-9-5 9-5ZM3 8v10l9 5 9-5V8M12 13v10M7 5.8l9 5",
  inventario: "M3 21h18M5 21V7l7-4 7 4v14M9 21v-8h6v8M8 9h.01M16 9h.01",
  pagos: "M3 5h18v14H3ZM3 10h18M7 15h3",
  usuarios: "M12 3 3 7v5c0 5 9 10 9 10s9-5 9-10V7l-9-4ZM8 12l3 3 5-6",
  perfil: "M20 21a8 8 0 0 0-16 0M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  menu: "M4 6h16M4 12h16M4 18h16",
  salir: "M9 21H3V3h6M9 12h12m-5-5 5 5-5 5",
};
export default function Icono({ nombre, size = 20, style }: { nombre: string; size?: number; style?: CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}><path d={paths[nombre] ?? paths.ordenes} /></svg>;
}
