import { Response } from "express";
import { pool } from "../config/database";
import { AuthRequest } from "../middleware/auth.middleware";

export const obtenerResumenDashboard = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    // ==========================================
    // 1. CANTIDAD DE ÓRDENES POR ESTADO
    // ==========================================

    const ordenes = await pool.query(`
      SELECT
        eo.id AS estado_id,
        eo.nombre AS estado,
        COUNT(ot.id) AS cantidad
      FROM estados_orden eo
      LEFT JOIN ordenes_trabajo ot
        ON ot.estado_id = eo.id
      GROUP BY eo.id, eo.nombre, eo.orden
      ORDER BY eo.orden
    `);

    // ==========================================
    // 2. TOTAL DE CLIENTES
    // ==========================================

    const clientes = await pool.query(`
      SELECT COUNT(*) AS cantidad
      FROM clientes
      WHERE activo = true
    `);

    // ==========================================
    // 3. TOTAL DE VEHÍCULOS
    // ==========================================

    const vehiculos = await pool.query(`
      SELECT COUNT(*) AS cantidad
      FROM vehiculos
      WHERE activo = true
    `);

    // ==========================================
    // 4. TOTAL DE MECÁNICOS
    // ==========================================

    const mecanicos = await pool.query(`
      SELECT COUNT(*) AS cantidad
      FROM usuarios u
      INNER JOIN roles r
        ON u.rol_id = r.id
      WHERE r.nombre = 'mecanico'
        AND u.activo = true
    `);

    // ==========================================
    // 5. REPUESTOS CON BAJO STOCK
    // ==========================================

    const bajoStock = await pool.query(`
      SELECT COUNT(*) AS cantidad
      FROM repuestos
      WHERE activo = true
        AND stock_actual <= stock_minimo
    `);

    // ==========================================
    // 6. TOTAL DE PAGOS REGISTRADOS
    // ==========================================

    const ingresos = await pool.query(`
      SELECT
        COALESCE(SUM(monto), 0) AS total
      FROM pagos
    `);

    // ==========================================
    // 7. FORMATEAR ÓRDENES POR ESTADO
    // ==========================================

    const resumenEstados = {
      recibidas: 0,
      en_diagnostico: 0,
      esperando_aprobacion: 0,
      en_reparacion: 0,
      listas_para_entrega: 0,
      entregadas: 0,
      canceladas: 0,
    };

    for (const fila of ordenes.rows) {
      const cantidad = Number(fila.cantidad);

      switch (Number(fila.estado_id)) {
        case 1:
          resumenEstados.recibidas = cantidad;
          break;

        case 2:
          resumenEstados.en_diagnostico = cantidad;
          break;

        case 3:
          resumenEstados.esperando_aprobacion = cantidad;
          break;

        case 4:
          resumenEstados.en_reparacion = cantidad;
          break;

        case 5:
          resumenEstados.listas_para_entrega = cantidad;
          break;

        case 6:
          resumenEstados.entregadas = cantidad;
          break;

        case 7:
          resumenEstados.canceladas = cantidad;
          break;
      }
    }

    // ==========================================
    // 8. RESPUESTA
    // ==========================================

    return res.status(200).json({
      ordenes: {
        total: Object.values(resumenEstados).reduce(
          (total, cantidad) => total + cantidad,
          0,
        ),
        ...resumenEstados,
      },

      clientes: Number(clientes.rows[0].cantidad),

      vehiculos: Number(vehiculos.rows[0].cantidad),

      mecanicos: Number(mecanicos.rows[0].cantidad),

      repuestos_bajo_stock: Number(bajoStock.rows[0].cantidad),

      ingresos: Number(ingresos.rows[0].total).toFixed(2),
    });
  } catch (error) {
    console.error("Error al obtener el resumen del dashboard:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};
