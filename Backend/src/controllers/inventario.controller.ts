import { Response } from "express";
import { pool } from "../config/database";
import { AuthRequest } from "../middleware/auth.middleware";

// =====================================================
// 1. OBTENER INVENTARIO COMPLETO
// =====================================================

export const obtenerInventario = async (req: AuthRequest, res: Response) => {
  try {
    const resultado = await pool.query(
      `
      SELECT
        r.id,
        r.codigo,
        r.nombre,

        c.id AS categoria_id,
        c.nombre AS categoria,

        r.stock_actual,
        r.stock_minimo,

        r.precio_compra,
        r.precio_venta,

        r.activo,
        r.creado_en,
        r.actualizado_en,

        CASE
          WHEN r.stock_actual = 0 THEN 'SIN STOCK'
          WHEN r.stock_actual <= r.stock_minimo THEN 'STOCK BAJO'
          ELSE 'STOCK NORMAL'
        END AS estado_stock

      FROM repuestos r

      INNER JOIN categorias_repuesto c
        ON r.categoria_id = c.id

      ORDER BY c.nombre, r.nombre
      `,
    );

    return res.status(200).json({
      total_repuestos: resultado.rows.length,
      inventario: resultado.rows,
    });
  } catch (error) {
    console.error("Error al obtener inventario:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};

// =====================================================
// 2. OBTENER REPUESTOS CON STOCK BAJO
// =====================================================

export const obtenerInventarioBajo = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const resultado = await pool.query(
      `
      SELECT
        r.id,
        r.codigo,
        r.nombre,

        c.nombre AS categoria,

        r.stock_actual,
        r.stock_minimo,

        r.precio_compra,
        r.precio_venta,

        CASE
          WHEN r.stock_actual = 0 THEN 'SIN STOCK'
          ELSE 'STOCK BAJO'
        END AS estado_stock

      FROM repuestos r

      INNER JOIN categorias_repuesto c
        ON r.categoria_id = c.id

      WHERE
        r.activo = true
        AND r.stock_actual <= r.stock_minimo

      ORDER BY
        r.stock_actual ASC,
        r.nombre ASC
      `,
    );

    return res.status(200).json({
      total: resultado.rows.length,
      repuestos: resultado.rows,
    });
  } catch (error) {
    console.error("Error al obtener inventario bajo:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};

// =====================================================
// 3. OBTENER TODOS LOS MOVIMIENTOS
// =====================================================

export const obtenerMovimientosInventario = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const resultado = await pool.query(
      `
      SELECT
        mi.id,

        mi.repuesto_id,
        r.codigo AS repuesto_codigo,
        r.nombre AS repuesto,

        mi.orden_id,
        ot.codigo AS orden_codigo,

        mi.usuario_id,
        u.nombres AS usuario_nombres,
        u.apellidos AS usuario_apellidos,

        mi.tipo,
        mi.cantidad,
        mi.motivo,
        mi.fecha

      FROM movimientos_inventario mi

      INNER JOIN repuestos r
        ON mi.repuesto_id = r.id

      LEFT JOIN ordenes_trabajo ot
        ON mi.orden_id = ot.id

      INNER JOIN usuarios u
        ON mi.usuario_id = u.id

      ORDER BY mi.fecha DESC, mi.id DESC
      `,
    );

    return res.status(200).json({
      total_movimientos: resultado.rows.length,
      movimientos: resultado.rows,
    });
  } catch (error) {
    console.error("Error al obtener movimientos de inventario:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};

// =====================================================
// 4. MOVIMIENTOS DE UNA ORDEN
// =====================================================

export const obtenerMovimientosPorOrden = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { ordenId } = req.params;

    const orden = await pool.query(
      `
      SELECT
        id,
        codigo
      FROM ordenes_trabajo
      WHERE id = $1
      `,
      [ordenId],
    );

    if (orden.rows.length === 0) {
      return res.status(404).json({
        mensaje: "La orden de trabajo no existe",
      });
    }

    const resultado = await pool.query(
      `
      SELECT
        mi.id,

        mi.repuesto_id,
        r.codigo AS repuesto_codigo,
        r.nombre AS repuesto,

        mi.tipo,
        mi.cantidad,
        mi.motivo,
        mi.fecha,

        mi.usuario_id,
        u.nombres AS usuario_nombres,
        u.apellidos AS usuario_apellidos

      FROM movimientos_inventario mi

      INNER JOIN repuestos r
        ON mi.repuesto_id = r.id

      INNER JOIN usuarios u
        ON mi.usuario_id = u.id

      WHERE mi.orden_id = $1

      ORDER BY mi.fecha ASC, mi.id ASC
      `,
      [ordenId],
    );

    return res.status(200).json({
      orden_id: Number(ordenId),
      codigo: orden.rows[0].codigo,
      movimientos: resultado.rows,
    });
  } catch (error) {
    console.error("Error al obtener movimientos de la orden:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};

// =====================================================
// 5. MOVIMIENTOS DE UN REPUESTO
// =====================================================

export const obtenerMovimientosPorRepuesto = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { repuestoId } = req.params;

    const repuesto = await pool.query(
      `
      SELECT
        id,
        codigo,
        nombre,
        stock_actual,
        stock_minimo
      FROM repuestos
      WHERE id = $1
      `,
      [repuestoId],
    );

    if (repuesto.rows.length === 0) {
      return res.status(404).json({
        mensaje: "El repuesto no existe",
      });
    }

    const resultado = await pool.query(
      `
      SELECT
        mi.id,

        mi.orden_id,
        ot.codigo AS orden_codigo,

        mi.tipo,
        mi.cantidad,
        mi.motivo,
        mi.fecha,

        mi.usuario_id,
        u.nombres AS usuario_nombres,
        u.apellidos AS usuario_apellidos

      FROM movimientos_inventario mi

      LEFT JOIN ordenes_trabajo ot
        ON mi.orden_id = ot.id

      INNER JOIN usuarios u
        ON mi.usuario_id = u.id

      WHERE mi.repuesto_id = $1

      ORDER BY mi.fecha DESC, mi.id DESC
      `,
      [repuestoId],
    );

    return res.status(200).json({
      repuesto: repuesto.rows[0],
      total_movimientos: resultado.rows.length,
      movimientos: resultado.rows,
    });
  } catch (error) {
    console.error("Error al obtener movimientos del repuesto:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};
export const registrarEntradaInventario = async (
  req: AuthRequest,
  res: Response,
) => {
  const client = await pool.connect();

  try {
    const { repuesto_id, cantidad, motivo } = req.body;

    // ==========================================
    // 1. VALIDACIONES
    // ==========================================

    if (!repuesto_id || !cantidad || !motivo) {
      return res.status(400).json({
        mensaje: "repuesto_id, cantidad y motivo son obligatorios",
      });
    }

    if (!Number.isInteger(Number(repuesto_id))) {
      return res.status(400).json({
        mensaje: "repuesto_id debe ser un número entero",
      });
    }

    if (!Number.isInteger(Number(cantidad)) || Number(cantidad) <= 0) {
      return res.status(400).json({
        mensaje: "La cantidad debe ser un número entero mayor que 0",
      });
    }

    const cantidadEntrada = Number(cantidad);

    // ==========================================
    // 2. INICIAR TRANSACCIÓN
    // ==========================================

    await client.query("BEGIN");

    // ==========================================
    // 3. BUSCAR Y BLOQUEAR EL REPUESTO
    // ==========================================

    const repuesto = await client.query(
      `
      SELECT
        id,
        codigo,
        nombre,
        stock_actual,
        stock_minimo,
        activo
      FROM repuestos
      WHERE id = $1
      FOR UPDATE
      `,
      [repuesto_id],
    );

    if (repuesto.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        mensaje: "El repuesto no existe",
      });
    }

    const datosRepuesto = repuesto.rows[0];

    if (!datosRepuesto.activo) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        mensaje: "El repuesto está desactivado",
      });
    }

    // ==========================================
    // 4. ACTUALIZAR STOCK
    // ==========================================

    const stockAnterior = Number(datosRepuesto.stock_actual);
    const stockNuevo = stockAnterior + cantidadEntrada;

    await client.query(
      `
      UPDATE repuestos
      SET
        stock_actual = $1,
        actualizado_en = now()
      WHERE id = $2
      `,
      [stockNuevo, repuesto_id],
    );

    // ==========================================
    // 5. REGISTRAR MOVIMIENTO
    // ==========================================

    const movimiento = await client.query(
      `
      INSERT INTO movimientos_inventario (
        repuesto_id,
        orden_id,
        usuario_id,
        tipo,
        cantidad,
        motivo
      )
      VALUES (
        $1,
        NULL,
        $2,
        'ENTRADA',
        $3,
        $4
      )
      RETURNING
        id,
        repuesto_id,
        orden_id,
        usuario_id,
        tipo,
        cantidad,
        motivo,
        fecha
      `,
      [repuesto_id, req.usuario!.id, cantidadEntrada, motivo.trim()],
    );

    // ==========================================
    // 6. CONFIRMAR TRANSACCIÓN
    // ==========================================

    await client.query("COMMIT");

    return res.status(201).json({
      mensaje: "Entrada de inventario registrada correctamente",

      repuesto: {
        id: datosRepuesto.id,
        codigo: datosRepuesto.codigo,
        nombre: datosRepuesto.nombre,
      },

      stock: {
        anterior: stockAnterior,
        entrada: cantidadEntrada,
        actual: stockNuevo,
      },

      movimiento: movimiento.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error al registrar entrada de inventario:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  } finally {
    client.release();
  }
};
