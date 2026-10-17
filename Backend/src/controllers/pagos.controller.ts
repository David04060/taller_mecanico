import { Response } from "express";
import { pool } from "../config/database";
import { AuthRequest } from "../middleware/auth.middleware";

export const registrarPago = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { metodo_pago_id, monto, referencia } = req.body;
  const importe = Number(monto);
  const centimos = Math.round(importe * 100);
  if ((typeof monto !== "number" && typeof monto !== "string") || !Number.isFinite(importe) ||
      importe <= 0 || importe > 99999999.99 || Math.abs(importe * 100 - centimos) > 0.000001)
    return res.status(400).json({ mensaje: "El monto debe ser positivo y tener como máximo dos decimales" });
  if (!Number.isInteger(Number(metodo_pago_id)) || Number(metodo_pago_id) <= 0)
    return res.status(400).json({ mensaje: "Selecciona un método de pago válido" });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const rechazar = async (status: number, mensaje: string) => {
      await client.query("ROLLBACK"); return res.status(status).json({ mensaje });
    };
    // El mismo bloqueo serializa pagos, cambios de detalle y cierre de la orden.
    const orden = await client.query(
      'SELECT id, total, estado_id FROM ordenes_trabajo WHERE id=$1 FOR UPDATE', [id]);
    if (!orden.rows.length) return await rechazar(404, "Orden no encontrada");
    if ([6,7].includes(Number(orden.rows[0].estado_id))) return await rechazar(400, "No se pueden registrar pagos en una orden cerrada");
    const total = Math.round(Number(orden.rows[0].total) * 100);
    if (total <= 0) return await rechazar(400, "La orden todavía no tiene un total válido");
    const metodo = await client.query("SELECT id FROM metodos_pago WHERE id=$1 AND activo=true", [metodo_pago_id]);
    if (!metodo.rows.length) return await rechazar(400, "Método de pago inexistente o inactivo");
    const pagos = await client.query("SELECT COALESCE(SUM(monto),0) AS total_pagado FROM pagos WHERE orden_id=$1", [id]);
    const pagado = Math.round(Number(pagos.rows[0].total_pagado) * 100);
    if (centimos > total - pagado) return await rechazar(400, "El monto supera el saldo pendiente");
    const resultado = await client.query(`INSERT INTO pagos (orden_id, metodo_pago_id, registrado_por, monto, referencia)
      VALUES ($1,$2,$3,$4,$5) RETURNING *`, [id,metodo_pago_id,req.usuario!.id,centimos/100,referencia?.trim() || null]);
    await client.query("COMMIT");
    return res.status(201).json({ mensaje: "Pago registrado correctamente", pago: resultado.rows[0],
      resumen: { total_orden: total/100, total_pagado: (pagado+centimos)/100, saldo_pendiente: (total-pagado-centimos)/100 } });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al registrar pago:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  } finally { client.release(); }
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

    const totalReembolsado = 0;
    const total = resultado.rows.reduce(
      (acumulado, pago) => acumulado + Number(pago.monto),
      0,
    );
    return res.json({
      pagos: resultado.rows,
      reembolsos: [],
      total_reembolsado: totalReembolsado,
      total_neto: Math.round((total-totalReembolsado)*100)/100,
      total,
      cantidad: resultado.rows.length,
    });
  } catch (error) {
    console.error("Error al listar pagos:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};
