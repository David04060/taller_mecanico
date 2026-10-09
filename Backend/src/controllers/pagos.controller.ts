import { Response } from "express";
import { pool } from "../config/database";
import { AuthRequest } from "../middleware/auth.middleware";

export const registrarPago = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { metodo_pago_id, monto, referencia } = req.body;

    // Validar método de pago
    if (!metodo_pago_id) {
      return res.status(400).json({
        mensaje: "El método de pago es obligatorio",
      });
    }

    // Validar monto
    if (monto === undefined || monto === null) {
      return res.status(400).json({
        mensaje: "El monto es obligatorio",
      });
    }

    const montoNumerico = Number(monto);

    if (!Number.isFinite(montoNumerico) || montoNumerico <= 0) {
      return res.status(400).json({
        mensaje: "El monto debe ser mayor a 0",
      });
    }

    // Verificar que la orden exista
    const orden = await pool.query(
      `
      SELECT
        id,
        codigo,
        total,
        estado_id
      FROM ordenes_trabajo
      WHERE id = $1
      `,
      [id],
    );

    if (orden.rows.length === 0) {
      return res.status(404).json({
        mensaje: "La orden de trabajo no existe",
      });
    }

    const ordenData = orden.rows[0];

    const totalOrden = Number(ordenData.total);

    if (totalOrden <= 0) {
      return res.status(400).json({
        mensaje: "La orden todavía no tiene un total válido",
      });
    }

    // Verificar método de pago
    const metodo = await pool.query(
      `
      SELECT
        id,
        nombre
      FROM metodos_pago
      WHERE id = $1
        AND activo = true
      `,
      [metodo_pago_id],
    );

    if (metodo.rows.length === 0) {
      return res.status(400).json({
        mensaje: "El método de pago no existe o está inactivo",
      });
    }

    // Obtener total pagado hasta el momento
    const pagos = await pool.query(
      `
      SELECT COALESCE(
        SUM(monto),
        0
      ) AS total_pagado
      FROM pagos
      WHERE orden_id = $1
      `,
      [id],
    );

    const totalPagado = Number(pagos.rows[0].total_pagado);

    const saldoPendiente = totalOrden - totalPagado;

    // Evitar pagar más de lo pendiente
    if (montoNumerico > saldoPendiente) {
      return res.status(400).json({
        mensaje: "El monto supera el saldo pendiente",
        total_orden: totalOrden,
        total_pagado: totalPagado,
        saldo_pendiente: saldoPendiente,
      });
    }

    // Registrar pago
    const resultado = await pool.query(
      `
      INSERT INTO pagos (
        orden_id,
        metodo_pago_id,
        registrado_por,
        monto,
        referencia
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id,
        orden_id,
        metodo_pago_id,
        registrado_por,
        monto,
        referencia,
        fecha
      `,
      [
        id,
        metodo_pago_id,
        req.usuario!.id,
        montoNumerico,
        referencia ? referencia.trim() : null,
      ],
    );

    const nuevoTotalPagado = totalPagado + montoNumerico;

    const nuevoSaldo = totalOrden - nuevoTotalPagado;

    return res.status(201).json({
      mensaje: "Pago registrado correctamente",
      pago: resultado.rows[0],
      resumen: {
        total_orden: totalOrden,
        total_pagado: nuevoTotalPagado,
        saldo_pendiente: nuevoSaldo,
      },
    });
  } catch (error) {
    console.error("Error al registrar pago:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};

export const obtenerPagosOrden = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar que la orden exista
    const orden = await pool.query(
      `
      SELECT
        id,
        codigo,
        total
      FROM ordenes_trabajo
      WHERE id = $1
      `,
      [id],
    );

    if (orden.rows.length === 0) {
      return res.status(404).json({
        mensaje: "La orden de trabajo no existe",
      });
    }

    // Obtener pagos
    const pagos = await pool.query(
      `
      SELECT
        p.id,
        p.orden_id,
        p.metodo_pago_id,
        mp.nombre AS metodo_pago,
        p.registrado_por,
        u.nombres,
        u.apellidos,
        p.monto,
        p.referencia,
        p.fecha
      FROM pagos p
      INNER JOIN metodos_pago mp
        ON p.metodo_pago_id = mp.id
      INNER JOIN usuarios u
        ON p.registrado_por = u.id
      WHERE p.orden_id = $1
      ORDER BY p.fecha ASC, p.id ASC
      `,
      [id],
    );

    // Calcular total pagado
    const totalPagadoResultado = await pool.query(
      `
      SELECT COALESCE(
        SUM(monto),
        0
      ) AS total_pagado
      FROM pagos
      WHERE orden_id = $1
      `,
      [id],
    );

    const totalOrden = Number(orden.rows[0].total);

    const totalPagado = Number(totalPagadoResultado.rows[0].total_pagado);

    const saldoPendiente = totalOrden - totalPagado;

    return res.status(200).json({
      orden_id: Number(id),
      codigo: orden.rows[0].codigo,
      total_orden: totalOrden,
      total_pagado: totalPagado,
      saldo_pendiente: saldoPendiente,
      pagos: pagos.rows,
    });
  } catch (error) {
    console.error("Error al obtener pagos de la orden:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};

export const obtenerPagos = async (_req: AuthRequest, res: Response) => {
  try {
    const resultado = await pool.query(
      `SELECT p.id, p.orden_id, ot.codigo AS orden_codigo,
              v.placa, c.nombres AS cliente_nombres,
              c.apellidos AS cliente_apellidos,
              mp.nombre AS metodo_pago, p.monto, p.referencia,
              p.fecha, u.nombres AS registrado_por_nombres,
              u.apellidos AS registrado_por_apellidos
       FROM pagos p
       INNER JOIN ordenes_trabajo ot ON ot.id = p.orden_id
       INNER JOIN vehiculos v ON v.id = ot.vehiculo_id
       INNER JOIN clientes c ON c.id = v.cliente_id
       INNER JOIN metodos_pago mp ON mp.id = p.metodo_pago_id
       INNER JOIN usuarios u ON u.id = p.registrado_por
       ORDER BY p.fecha DESC, p.id DESC`,
    );
    const total = resultado.rows.reduce(
      (acumulado, pago) => acumulado + Number(pago.monto),
      0,
    );
    return res.json({
      pagos: resultado.rows,
      total,
      cantidad: resultado.rows.length,
    });
  } catch (error) {
    console.error("Error al listar pagos:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};
