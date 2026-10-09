import jwt, { type SignOptions } from "jsonwebtoken";
import { app } from "../app";
import { pool } from "../config/database";
import { env } from "../config/env";

const rutasPorRol: Record<string, string[]> = {
  administrador: [
    "/api/auth/me",
    "/api/dashboard/resumen",
    "/api/usuarios",
    "/api/usuarios/mecanicos/activos",
    "/api/clientes",
    "/api/vehiculos",
    "/api/servicios",
    "/api/categorias_repuesto",
    "/api/repuestos",
    "/api/inventario",
    "/api/inventario/movimientos",
    "/api/pagos",
    "/api/metodos-pago",
    "/api/ordenes_trabajo",
  ],
  recepcionista: [
    "/api/auth/me",
    "/api/dashboard/resumen",
    "/api/usuarios/mecanicos/activos",
    "/api/clientes",
    "/api/vehiculos",
    "/api/ordenes_trabajo",
    "/api/pagos",
  ],
  mecanico: [
    "/api/auth/me",
    "/api/ordenes_trabajo/mis-ordenes",
    "/api/servicios",
    "/api/repuestos",
    "/api/inventario",
  ],
  cliente: [
    "/api/auth/me",
    "/api/clientes/mis-datos",
    "/api/clientes/mis-vehiculos",
    "/api/clientes/mis-ordenes",
    "/api/clientes/mis-pagos",
  ],
};

interface OrdenListado {
  id: number;
  estado_nombre?: unknown;
  cliente_nombres?: unknown;
  cliente_apellidos?: unknown;
}

function validarOrdenesDePersonal(
  ordenes: OrdenListado[],
  contexto: string,
): void {
  for (const orden of ordenes) {
    if (
      typeof orden.estado_nombre !== "string" ||
      !orden.estado_nombre.trim()
    ) {
      throw new Error(`${contexto}: una orden no contiene estado_nombre`);
    }
    if (
      typeof orden.cliente_nombres !== "string" ||
      typeof orden.cliente_apellidos !== "string"
    ) {
      throw new Error(
        `${contexto}: una orden no contiene los datos del cliente`,
      );
    }
  }
}

async function ejecutar() {
  const server = app.listen(0);
  try {
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const direccion = server.address();
    if (!direccion || typeof direccion === "string")
      throw new Error("No se pudo obtener el puerto de prueba");
    const usuarios = await pool.query(
      `SELECT DISTINCT ON (r.nombre) u.id, u.email, r.nombre AS rol
       FROM usuarios u INNER JOIN roles r ON r.id = u.rol_id
       WHERE u.activo = true ORDER BY r.nombre, u.id`,
    );
    if (!usuarios.rows.length)
      throw new Error("No existen usuarios activos para ejecutar las pruebas");

    let verificadas = 0;
    for (const usuario of usuarios.rows) {
      const token = jwt.sign(
        { id: usuario.id, email: usuario.email, rol: usuario.rol },
        env.JWT_SECRET,
        { expiresIn: "5m" as SignOptions["expiresIn"] },
      );
      for (const ruta of rutasPorRol[usuario.rol] ?? []) {
        const respuesta = await fetch(
          `http://127.0.0.1:${direccion.port}${ruta}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (!respuesta.ok) {
          const cuerpo = await respuesta.text();
          throw new Error(
            `${usuario.rol} ${ruta}: HTTP ${respuesta.status} ${cuerpo}`,
          );
        }
        verificadas += 1;

        if (
          ruta === "/api/ordenes_trabajo" ||
          ruta === "/api/ordenes_trabajo/mis-ordenes"
        ) {
          const datos = (await respuesta.clone().json()) as {
            ordenes?: OrdenListado[];
          };
          const ordenes = datos.ordenes ?? [];
          validarOrdenesDePersonal(ordenes, `${usuario.rol} ${ruta}`);

          if (ruta === "/api/ordenes_trabajo" && ordenes.length) {
            const detalle = await fetch(
              `http://127.0.0.1:${direccion.port}/api/ordenes_trabajo/${ordenes[0].id}/detalle`,
              { headers: { Authorization: `Bearer ${token}` } },
            );
            if (!detalle.ok) {
              throw new Error(
                `${usuario.rol} detalle de orden: HTTP ${detalle.status}`,
              );
            }
            const cuerpo = (await detalle.json()) as {
              orden?: { estado_nombre?: unknown };
              cliente?: { nombres?: unknown; apellidos?: unknown };
              servicios?: Array<{ precio_unitario?: unknown }>;
              repuestos?: Array<{ precio_unitario?: unknown }>;
            };
            if (
              typeof cuerpo.orden?.estado_nombre !== "string" ||
              typeof cuerpo.cliente?.nombres !== "string" ||
              typeof cuerpo.cliente?.apellidos !== "string" ||
              !Array.isArray(cuerpo.servicios) ||
              cuerpo.servicios.some(
                (servicio) => servicio.precio_unitario === undefined,
              ) ||
              !Array.isArray(cuerpo.repuestos) ||
              cuerpo.repuestos.some(
                (repuesto) => repuesto.precio_unitario === undefined,
              )
            ) {
              throw new Error(
                `${usuario.rol}: el detalle de orden no cumple el contrato esperado`,
              );
            }
            verificadas += 1;
          }
        }

        if (usuario.rol === "cliente" && ruta === "/api/clientes/mis-ordenes") {
          const datos = (await respuesta.json()) as {
            ordenes?: Array<{ id: number }>;
          };
          if (datos.ordenes?.length) {
            const detalle = await fetch(
              `http://127.0.0.1:${direccion.port}/api/clientes/mis-ordenes/${datos.ordenes[0].id}`,
              { headers: { Authorization: `Bearer ${token}` } },
            );
            if (!detalle.ok)
              throw new Error(
                `cliente detalle de orden: HTTP ${detalle.status}`,
              );
            const cuerpo = (await detalle.json()) as {
              orden?: {
                servicios?: unknown[];
                repuestos?: unknown[];
                historial?: unknown[];
              };
            };
            if (
              !cuerpo.orden ||
              !Array.isArray(cuerpo.orden.servicios) ||
              !Array.isArray(cuerpo.orden.repuestos) ||
              !Array.isArray(cuerpo.orden.historial)
            ) {
              throw new Error(
                "El detalle de orden del cliente no contiene servicios, repuestos e historial",
              );
            }
            verificadas += 1;
          }
        }
      }
    }
    console.log(
      `Pruebas de humo correctas: ${verificadas} solicitudes autenticadas`,
    );
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    await pool.end();
  }
}

ejecutar().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
