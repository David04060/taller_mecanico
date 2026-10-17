import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { pool } from "../config/database";

const estadosFinales = [6, 7];
const ordenEstaBloqueada = (estadoId: number): boolean => {
  return estadosFinales.includes(estadoId);
};

const verificarOrdenModificable = async (ordenId: number) => {
  const resultado = await pool.query(
    `
      SELECT estado_id
      FROM ordenes_trabajo
      WHERE id = $1
    `,
    [ordenId],
  );

  if (resultado.rows.length === 0) {
    return {
      existe: false,
      bloqueada: false,
    };
  }

  const estadoId = resultado.rows[0].estado_id;

  return {
    existe: true,
    bloqueada: ordenEstaBloqueada(estadoId),
    estadoId,
  };
};
export const crearOrden = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  let confirmado = false;
  try {
    await client.query("BEGIN");
    const {
      codigo,
      vehiculo_id,
      mecanico_id,
      problema_reportado,
      observaciones,
      fecha_estimada_entrega,
    } = req.body;

    if (!codigo || !vehiculo_id || !problema_reportado) {
      return res.status(400).json({
        mensaje: "El código, vehículo y problema reportado son obligatorios",
      });
    }

    /*
     * Verificar código duplicado
     */
    const codigoExistente = await client.query(
      `
            SELECT id
            FROM ordenes_trabajo
            WHERE codigo = $1
            `,
      [codigo],
    );

    if (codigoExistente.rows.length > 0) {
      return res.status(409).json({
        mensaje: "El código de la orden ya existe",
      });
    }

    /*
     * Verificar vehículo
     */
    const vehiculo = await client.query(
      `
            SELECT id
            FROM vehiculos
            WHERE id = $1
            AND activo = true
            `,
      [vehiculo_id],
    );

    if (vehiculo.rows.length === 0) {
      return res.status(400).json({
        mensaje: "El vehículo no existe o está inactivo",
      });
    }

    /*
     * Si se proporciona mecánico,
     * verificar que exista y tenga rol mecánico
     */
    if (mecanico_id) {
      const mecanico = await client.query(
        `
                SELECT u.id
                FROM usuarios u
                INNER JOIN roles r
                    ON u.rol_id = r.id
                WHERE u.id = $1
                AND u.activo = true
                AND r.nombre = 'mecanico'
                `,
        [mecanico_id],
      );

      if (mecanico.rows.length === 0) {
        return res.status(400).json({
          mensaje: "El mecánico no existe o no tiene el rol de mecánico",
        });
      }
    }

    /*
     * Estado inicial:
     * 1 = Recibido
     */
    const resultado = await client.query(
      `
            INSERT INTO ordenes_trabajo
            (
                codigo,
                vehiculo_id,
                recepcionista_id,
                mecanico_id,
                estado_id,
                problema_reportado,
                observaciones,
                fecha_estimada_entrega,
                total
            )
            VALUES
            (
                $1,
                $2,
                $3,
                $4,
                1,
                $5,
                $6,
                $7,
                0
            )
            RETURNING
                id,
                codigo,
                vehiculo_id,
                recepcionista_id,
                mecanico_id,
                estado_id,
                problema_reportado,
                diagnostico,
                observaciones,
                fecha_ingreso,
                fecha_estimada_entrega,
                fecha_entrega,
                total,
                creado_en,
                actualizado_en
            `,
      [
        codigo,
        vehiculo_id,
        req.usuario!.id,
        mecanico_id || null,
        problema_reportado,
        observaciones || null,
        fecha_estimada_entrega || null,
      ],
    );

    /*
     * Registrar el primer estado
     */
    await client.query(
      `
            INSERT INTO historial_estados
            (
                orden_id,
                estado_id,
                usuario_id,
                comentario
            )
            VALUES
            ($1, 1, $2, $3)
            `,
      [resultado.rows[0].id, req.usuario!.id, "Orden creada"],
    );

    await client.query("COMMIT");
    confirmado = true;
    return res.status(201).json({
      mensaje: "Orden de trabajo creada correctamente",
      orden: resultado.rows[0],
    });
  } catch (error) {
    console.error("Error al crear orden:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  } finally {
    try { if (!confirmado) await client.query("ROLLBACK"); } finally { client.release(); }
  }
};

export const obtenerOrdenes = async (req: AuthRequest, res: Response) => {
  try {
    const { placa } = req.query;

    let consulta = `
      SELECT
        ot.id,
        ot.codigo,

        ot.vehiculo_id,
        v.placa,
        v.marca,
        v.modelo,

        c.id AS cliente_id,
        c.nombres AS cliente_nombres,
        c.apellidos AS cliente_apellidos,

        ot.recepcionista_id,
        rec.nombres AS recepcionista_nombres,
        rec.apellidos AS recepcionista_apellidos,

        ot.mecanico_id,
        mec.nombres AS mecanico_nombres,
        mec.apellidos AS mecanico_apellidos,

        ot.estado_id,
        eo.nombre AS estado_nombre,

        ot.problema_reportado,
        ot.diagnostico,
        ot.observaciones,

        ot.fecha_ingreso,
        ot.fecha_estimada_entrega,
        ot.fecha_entrega,

        ot.total

      FROM ordenes_trabajo ot

      INNER JOIN vehiculos v
        ON ot.vehiculo_id = v.id

      INNER JOIN clientes c
        ON v.cliente_id = c.id

      INNER JOIN estados_orden eo
        ON ot.estado_id = eo.id

      INNER JOIN usuarios rec
        ON ot.recepcionista_id = rec.id

      LEFT JOIN usuarios mec
        ON ot.mecanico_id = mec.id
    `;

    const valores: string[] = [];

    if (placa) {
      valores.push(String(placa).trim());

      consulta += `
        WHERE UPPER(v.placa) = UPPER($1)
      `;
    }

    consulta += `
      ORDER BY ot.fecha_ingreso DESC, ot.id DESC
    `;

    const resultado = await pool.query(consulta, valores);

    return res.status(200).json({
      cantidad: resultado.rows.length,
      ordenes: resultado.rows,
    });
  } catch (error) {
    console.error("Error al obtener las órdenes:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};

export const obtenerOrdenPorId = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const resultado = await pool.query(
      `
      SELECT
        ot.id,
        ot.codigo,
        ot.vehiculo_id,
        v.placa,
        v.marca,
        v.modelo,
        c.id AS cliente_id,
        c.nombres AS cliente_nombres,
        c.apellidos AS cliente_apellidos,
        ot.recepcionista_id,
        rec.nombres AS recepcionista_nombres,
        rec.apellidos AS recepcionista_apellidos,
        ot.mecanico_id,
        mec.nombres AS mecanico_nombres,
        mec.apellidos AS mecanico_apellidos,
        ot.estado_id,
        eo.nombre AS estado_nombre,
        ot.problema_reportado,
        ot.diagnostico,
        ot.observaciones,
        ot.fecha_ingreso,
        ot.fecha_estimada_entrega,
        ot.fecha_entrega,
        ot.total
      FROM ordenes_trabajo ot
      INNER JOIN vehiculos v ON ot.vehiculo_id = v.id
      INNER JOIN clientes c ON v.cliente_id = c.id
      INNER JOIN estados_orden eo ON ot.estado_id = eo.id
      INNER JOIN usuarios rec ON ot.recepcionista_id = rec.id
      LEFT JOIN usuarios mec ON ot.mecanico_id = mec.id
      WHERE ot.id = $1
      `,
      [id],
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Orden de trabajo no encontrada",
      });
    }

    return res.status(200).json({
      orden: resultado.rows[0],
    });
  } catch (error) {
    console.error("Error al obtener la orden:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};

export const actualizarOrden = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orden = await pool.query('SELECT * FROM ordenes_trabajo WHERE id = $1', [id]);
    if (!orden.rows.length) return res.status(404).json({ mensaje: "Orden no encontrada" });
    const actual = orden.rows[0];
    if (req.usuario!.rol === "mecanico" && Number(actual.mecanico_id) !== req.usuario!.id)
      return res.status(403).json({ mensaje: "La orden no está asignada a este mecánico" });
    if ([6, 7].includes(Number(actual.estado_id)))
      return res.status(400).json({ mensaje: "No se puede modificar una orden entregada o cancelada" });
    if (req.usuario!.rol === "mecanico" && req.body.mecanico_id !== undefined && Number(req.body.mecanico_id) !== Number(actual.mecanico_id))
      return res.status(403).json({ mensaje: "Solo administración y recepción pueden reasignar la orden" });
    const { problema_reportado = actual.problema_reportado, diagnostico = actual.diagnostico,
      observaciones = actual.observaciones, fecha_estimada_entrega = actual.fecha_estimada_entrega,
      mecanico_id = actual.mecanico_id } = req.body;
    if (typeof problema_reportado !== "string" || !problema_reportado.trim())
      return res.status(400).json({ mensaje: "El problema reportado es obligatorio" });
    if (mecanico_id) {
      const mecanico = await pool.query(`SELECT u.id FROM usuarios u JOIN roles r ON r.id = u.rol_id
        WHERE u.id = $1 AND u.activo = true AND r.nombre = 'mecanico'`, [mecanico_id]);
      if (!mecanico.rows.length) return res.status(400).json({ mensaje: "El mecánico no existe o está inactivo" });
    }
    const resultado = await pool.query(`UPDATE ordenes_trabajo SET mecanico_id=$1, problema_reportado=$2,
      diagnostico=$3, observaciones=$4, fecha_estimada_entrega=$5, actualizado_en=now()
      WHERE id=$6 AND estado_id NOT IN (6,7)
      AND ($7::text <> 'mecanico' OR mecanico_id=$8) RETURNING *`,
      [mecanico_id || null, problema_reportado.trim(), diagnostico || null, observaciones || null,
       fecha_estimada_entrega || null, id, req.usuario!.rol, req.usuario!.id]);
    if (!resultado.rows.length) return res.status(409).json({ mensaje: "La orden cambió; vuelva a cargarla" });
    return res.json({ mensaje: "Orden actualizada correctamente", orden: resultado.rows[0] });
  } catch (error) {
    console.error("Error al actualizar orden:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

export const cambiarEstadoOrden = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  let confirmado = false;
  try {
    await client.query("BEGIN");
    const { id } = req.params;
    const { estado_id, comentario } = req.body;

    // ==========================================
    // 1. Validar estado recibido
    // ==========================================

    if (!estado_id) {
      return res.status(400).json({
        mensaje: "El estado_id es obligatorio",
      });
    }

    const nuevoEstado = Number(estado_id);

    if (!Number.isInteger(nuevoEstado)) {
      return res.status(400).json({
        mensaje: "El estado_id debe ser un número entero",
      });
    }

    if (nuevoEstado < 1 || nuevoEstado > 7) {
      return res.status(400).json({
        mensaje: "El estado_id no es válido",
      });
    }

    // ==========================================
    // 2. Obtener la orden
    // ==========================================

    const orden = await client.query(
      `
      SELECT
        ot.id,
        ot.codigo,
        ot.mecanico_id,
        ot.estado_id,
        ot.diagnostico,
        ot.total
      FROM ordenes_trabajo ot
      WHERE ot.id = $1 FOR UPDATE OF ot
      `,
      [id],
    );

    if (orden.rows.length === 0) {
      return res.status(404).json({
        mensaje: "La orden no existe",
      });
    }

    const datosOrden = orden.rows[0];

    const estadoActual = Number(datosOrden.estado_id);

    // ==========================================
    // 3. Verificar que el nuevo estado exista
    // ==========================================

    const estado = await client.query(
      `
      SELECT
        id,
        nombre
      FROM estados_orden
      WHERE id = $1
      `,
      [nuevoEstado],
    );

    if (estado.rows.length === 0) {
      return res.status(400).json({
        mensaje: "El estado seleccionado no existe",
      });
    }

    // ==========================================
    // 4. Verificar transición
    // ==========================================

    const transicionesPermitidas: {
      [key: number]: number[];
    } = {
      1: [2, 7],
      2: [3, 7],
      3: [4, 7],
      4: [5, 7],
      5: [6, 7],
      6: [],
      7: [],
    };
    if ([6, 7].includes(estadoActual)) {
      return res.status(400).json({mensaje: "No se puede modificar una orden entregada o cancelada"});
    }
    if (!transicionesPermitidas[estadoActual].includes(nuevoEstado)) {
      return res.status(400).json({
        mensaje: `No se puede cambiar la orden del estado ${estadoActual} al estado ${nuevoEstado}`,
      });
    }

    // ==========================================
    // 5. Permisos según el rol
    // ==========================================

    const rol = req.usuario!.rol;

    // ------------------------------------------
    // MECÁNICO
    // ------------------------------------------

    if (rol === "mecanico") {
      // Debe tener una orden asignada
      if (datosOrden.mecanico_id === null) {
        return res.status(400).json({
          mensaje: "La orden todavía no tiene un mecánico asignado",
        });
      }

      // Debe ser el mecánico asignado
      if (Number(datosOrden.mecanico_id) !== req.usuario!.id) {
        return res.status(403).json({
          mensaje:
            "No puedes cambiar el estado de una orden que no tienes asignada",
        });
      }

      // Transiciones permitidas para mecánico
      const transicionesMecanico = ["1-2", "2-3", "4-5"];

      const transicion = `${estadoActual}-${nuevoEstado}`;

      if (!transicionesMecanico.includes(transicion)) {
        return res.status(403).json({
          mensaje:
            "El mecánico no tiene permisos para realizar esta transición",
        });
      }
    }

    // Administradores y recepcionistas pueden ejecutar cualquier transición
    // válida del flujo. Los requisitos de diagnóstico y pago se comprueban
    // debajo para ambos roles.

    // ==========================================
    // 6. Validar diagnóstico
    // ==========================================

    if (nuevoEstado === 3) {
      if (!datosOrden.diagnostico || !String(datosOrden.diagnostico).trim()) {
        return res.status(400).json({
          mensaje:
            "No se puede pasar a Esperando aprobación sin registrar el diagnóstico",
        });
      }

      if (Number(datosOrden.total) <= 0) {
        return res.status(400).json({
          mensaje:
            "No se puede pasar a Esperando aprobación si la orden no tiene un total mayor a 0",
        });
      }
    }

    // ==========================================
    // 7. Obtener pagos de la orden
    // ==========================================

    const pagos = await client.query(
      `
      SELECT
        COALESCE(SUM(monto), 0) AS total_pagado
      FROM pagos
      WHERE orden_id = $1
      `,
      [id],
    );

    const totalPagado = Number(pagos.rows[0].total_pagado);

    const totalOrden = Number(datosOrden.total);

    // ==========================================
    // 8. Validar paso a EN REPARACIÓN
    // ==========================================

    if (nuevoEstado === 4) {
      if (totalOrden <= 0) {
        return res.status(400).json({
          mensaje:
            "No se puede iniciar la reparación porque la orden no tiene un total válido",
        });
      }

      const pagoMinimo = totalOrden * 0.5;

      if (totalPagado < pagoMinimo) {
        return res.status(400).json({
          mensaje:
            "No se puede iniciar la reparación. El cliente debe haber pagado al menos el 50% del total",
          total_orden: totalOrden,
          total_pagado: totalPagado,
          minimo_requerido: pagoMinimo,
        });
      }
    }

    // ==========================================
    // 9. Validar entrega
    // ==========================================

    if (nuevoEstado === 6) {
      if (totalOrden <= 0) {
        return res.status(400).json({
          mensaje: "No se puede entregar una orden sin un total válido",
        });
      }

      if (totalPagado < totalOrden) {
        return res.status(400).json({
          mensaje:
            "No se puede entregar la orden. El cliente debe haber pagado el 100% del total",
          total_orden: totalOrden,
          total_pagado: totalPagado,
          saldo_pendiente: totalOrden - totalPagado,
        });
      }
    }

    // ==========================================
    // 10. Actualizar estado
    // ==========================================

    let resultado;
    try {
      const bloqueo = await client.query(
        "SELECT estado_id FROM ordenes_trabajo WHERE id = $1 FOR UPDATE",
        [id],
      );
      if (Number(bloqueo.rows[0].estado_id) !== estadoActual) {
        return res
          .status(409)
          .json({ mensaje: "La orden cambió de estado; vuelva a cargarla" });
      }

      // Al cancelar se devuelve al inventario todo repuesto reservado por la orden.
      if (nuevoEstado === 7) {
        const repuestos = await client.query(
          `SELECT repuesto_id, cantidad FROM detalle_repuestos WHERE orden_id = $1`,
          [id],
        );
        for (const repuesto of repuestos.rows) {
          await client.query(
            "UPDATE repuestos SET stock_actual = stock_actual + $1 WHERE id = $2",
            [repuesto.cantidad, repuesto.repuesto_id],
          );
          await client.query(
            `INSERT INTO movimientos_inventario
             (repuesto_id, orden_id, usuario_id, tipo, cantidad, motivo)
             VALUES ($1, $2, $3, 'ENTRADA', $4, 'Devolución por cancelación de orden')`,
            [repuesto.repuesto_id, id, req.usuario!.id, repuesto.cantidad],
          );
        }
      }

      resultado = await client.query(
        `UPDATE ordenes_trabajo
         SET estado_id = $1::smallint,
             fecha_entrega = CASE WHEN $1::smallint = 6 THEN now() ELSE fecha_entrega END,
             actualizado_en = now()
         WHERE id = $2
         RETURNING id, codigo, estado_id, fecha_entrega, actualizado_en`,
        [nuevoEstado, id],
      );

      await client.query(
        `INSERT INTO historial_estados (orden_id, estado_id, usuario_id, comentario)
         VALUES ($1, $2, $3, $4)`,
        [
          id,
          nuevoEstado,
          req.usuario!.id,
          comentario ? String(comentario).trim() : null,
        ],
      );
      await client.query("COMMIT");
      confirmado = true;
    } catch (error) {
      throw error;
    }

    // ==========================================
    // 12. Respuesta
    // ==========================================

    return res.status(200).json({
      mensaje: "Estado de la orden actualizado correctamente",

      orden: resultado.rows[0],

      estado_anterior: estadoActual,

      estado_nuevo: {
        id: nuevoEstado,
        nombre: estado.rows[0].nombre,
      },

      total_pagado: totalPagado,
      total_orden: totalOrden,
    });
  } catch (error) {
    console.error("Error al cambiar el estado de la orden:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  } finally {
    try { if (!confirmado) await client.query("ROLLBACK"); } finally { client.release(); }
  }
};

export const registrarDiagnostico = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { diagnostico, observaciones } = req.body;

    // ==========================================
    // 1. VALIDAR DIAGNÓSTICO
    // ==========================================

    if (!diagnostico || !String(diagnostico).trim()) {
      return res.status(400).json({
        mensaje: "El diagnóstico es obligatorio",
      });
    }

    const orden = await pool.query(
      `
      SELECT
        id,
        codigo,
        mecanico_id,
        estado_id
      FROM ordenes_trabajo
      WHERE id = $1
      `,
      [id],
    );

    if (orden.rows.length === 0) {
      return res.status(404).json({
        mensaje: "La orden no existe",
      });
    }

    const datosOrden = orden.rows[0];

    // ==========================================
    // 2. VALIDAR PERMISOS DEL MECÁNICO
    // ==========================================

    if (req.usuario!.rol === "mecanico") {
      if (datosOrden.mecanico_id === null) {
        return res.status(400).json({
          mensaje: "La orden todavía no tiene un mecánico asignado",
        });
      }

      if (Number(datosOrden.mecanico_id) !== req.usuario!.id) {
        return res.status(403).json({
          mensaje:
            "No puedes registrar el diagnóstico de una orden que no tienes asignada",
        });
      }
    }

    // ==========================================
    // 3. VALIDAR ESTADO DE LA ORDEN
    // ==========================================

    if (![1, 2].includes(Number(datosOrden.estado_id))) {
      return res.status(400).json({
        mensaje:
          "El diagnóstico solamente puede registrarse cuando la orden está Recibida o En diagnóstico",
      });
    }
    const verificacion = await verificarOrdenModificable(Number(id));

    if (!verificacion.existe) {
      return res.status(404).json({
        mensaje: "Orden no encontrada",
      });
    }

    if (verificacion.bloqueada) {
      return res.status(400).json({
        mensaje: "No se puede modificar una orden entregada o cancelada",
      });
    }
    // ==========================================
    // 4. ACTUALIZAR DIAGNÓSTICO
    // ==========================================

    const resultado = await pool.query(
      `
      UPDATE ordenes_trabajo
      SET
        diagnostico = $1,
        observaciones = $2,
        actualizado_en = now()
      WHERE id = $3
      RETURNING
        id,
        codigo,
        mecanico_id,
        estado_id,
        diagnostico,
        observaciones,
        actualizado_en
      `,
      [
        String(diagnostico).trim(),
        observaciones ? String(observaciones).trim() : null,
        id,
      ],
    );

    return res.status(200).json({
      mensaje: "Diagnóstico registrado correctamente",
      orden: resultado.rows[0],
    });
  } catch (error) {
    console.error("Error al registrar el diagnóstico:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};

export const agregarServicioOrden = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { servicio_id, cantidad = 1 } = req.body;
  if (!Number.isInteger(Number(servicio_id)) || Number(servicio_id) <= 0 ||
      !Number.isInteger(Number(cantidad)) || Number(cantidad) <= 0)
    return res.status(400).json({ mensaje: "Servicio y cantidad deben ser enteros positivos" });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const orden = await client.query("SELECT id, mecanico_id, estado_id FROM ordenes_trabajo WHERE id=$1 FOR UPDATE", [id]);
    const rechazar = async (status: number, mensaje: string) => {
      await client.query("ROLLBACK"); return res.status(status).json({ mensaje });
    };
    if (!orden.rows.length) return await rechazar(404, "Orden no encontrada");
    if ([6,7].includes(Number(orden.rows[0].estado_id))) return await rechazar(400, "La orden ya no puede modificarse");
    if (req.usuario!.rol === "mecanico" && Number(orden.rows[0].mecanico_id) !== req.usuario!.id)
      return await rechazar(403, "La orden no está asignada a este mecánico");
    const servicio = await client.query("SELECT id, precio_base, activo FROM servicios WHERE id=$1", [servicio_id]);
    if (!servicio.rows.length || !servicio.rows[0].activo) return await rechazar(400, "Servicio inexistente o inactivo");
    const resultado = await client.query(`INSERT INTO detalle_servicios (orden_id, servicio_id, cantidad, precio_unitario)
      VALUES ($1,$2,$3,$4) RETURNING *`, [id,servicio_id,Number(cantidad),servicio.rows[0].precio_base]);
    await client.query("SELECT recalcular_total_orden($1)", [id]);
    await client.query("COMMIT");
    return res.status(201).json({ mensaje: "Servicio agregado correctamente", detalle: resultado.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al agregar servicio:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  } finally { client.release(); }
};

export const obtenerServiciosOrden = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;

    // Verificar que la orden exista
    const orden = await pool.query(
      `
      SELECT id, codigo
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

    const resultado = await pool.query(
      `
      SELECT
        ds.id,
        ds.orden_id,
        ds.servicio_id,
        s.nombre AS servicio,
        s.descripcion,
        ds.cantidad,
        ds.precio_unitario,
        (ds.cantidad * ds.precio_unitario) AS subtotal
      FROM detalle_servicios ds
      INNER JOIN servicios s
        ON ds.servicio_id = s.id
      WHERE ds.orden_id = $1
      ORDER BY ds.id
      `,
      [id],
    );

    return res.status(200).json({
      orden_id: Number(id),
      codigo: orden.rows[0].codigo,
      servicios: resultado.rows,
    });
  } catch (error) {
    console.error("Error al obtener servicios de la orden:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};
export const agregarRepuestoOrden = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { repuesto_id, cantidad } = req.body;

    if (!Number.isInteger(Number(cantidad)) || Number(cantidad) <= 0 || !Number.isInteger(Number(repuesto_id)) || Number(repuesto_id) <= 0) {
      return res.status(400).json({
        mensaje: "La cantidad debe ser mayor que 0",
      });
    }

    await client.query("BEGIN");

    // Verificar que la orden exista
    const orden = await client.query(
      `
      SELECT id, codigo, mecanico_id, estado_id
      FROM ordenes_trabajo
      WHERE id = $1
      FOR UPDATE
      `,
      [id],
    );

    if (orden.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        mensaje: "La orden de trabajo no existe",
      });
    }
    const datosOrden = orden.rows[0];

    if (req.usuario!.rol === "mecanico") {
      if (datosOrden.mecanico_id === null) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          mensaje: "La orden todavía no tiene un mecánico asignado",
        });
      }

      if (Number(datosOrden.mecanico_id) !== req.usuario!.id) {
        await client.query("ROLLBACK");

        return res.status(403).json({
          mensaje:
            "No puedes agregar repuestos a una orden que no tienes asignada",
        });
      }
    }
    // Verificar repuesto
    const repuesto = await client.query(
      `
      SELECT
        id,
        codigo,
        nombre,
        stock_actual,
        precio_venta,
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
        mensaje: "El repuesto está inactivo",
      });
    }

    // Verificar stock
    if (datosRepuesto.stock_actual < cantidad) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        mensaje: "Stock insuficiente",
        stock_actual: datosRepuesto.stock_actual,
        cantidad_solicitada: cantidad,
      });
    }

    // Verificar si el repuesto ya está en la orden
    const repuestoExistente = await client.query(
      `
      SELECT id
      FROM detalle_repuestos
      WHERE orden_id = $1
        AND repuesto_id = $2
      `,
      [id, repuesto_id],
    );

    if (repuestoExistente.rows.length > 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        mensaje: "El repuesto ya está agregado a esta orden",
      });
    }
    if ([6, 7].includes(Number(datosOrden.estado_id))) {
      await client.query("ROLLBACK");
      return res.status(400).json({ mensaje: "No se puede modificar una orden entregada o cancelada" });
    }
    // Registrar detalle del repuesto
    const detalle = await client.query(
      `
      INSERT INTO detalle_repuestos
      (
        orden_id,
        repuesto_id,
        cantidad,
        precio_unitario
      )
      VALUES
      (
        $1,
        $2,
        $3,
        $4
      )
      RETURNING
        id,
        orden_id,
        repuesto_id,
        cantidad,
        precio_unitario
      `,
      [id, repuesto_id, cantidad, datosRepuesto.precio_venta],
    );

    // Registrar movimiento de inventario
    await client.query(
      `
      INSERT INTO movimientos_inventario
      (
        repuesto_id,
        orden_id,
        usuario_id,
        tipo,
        cantidad,
        motivo
      )
      VALUES
      (
        $1,
        $2,
        $3,
        'SALIDA',
        $4,
        $5
      )
      `,
      [
        repuesto_id,
        id,
        req.usuario!.id,
        cantidad,
        `Repuesto utilizado en orden ${orden.rows[0].codigo}`,
      ],
    );

    // Descontar stock
    await client.query(
      `
      UPDATE repuestos
      SET
        stock_actual = stock_actual - $1,
        actualizado_en = now()
      WHERE id = $2
      `,
      [cantidad, repuesto_id],
    );

    await client.query("SELECT recalcular_total_orden($1)", [id]);
    await client.query("COMMIT");

    return res.status(201).json({
      mensaje: "Repuesto agregado correctamente a la orden",
      detalle: detalle.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error al agregar repuesto a la orden:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  } finally {
    client.release();
  }
};
export const obtenerRepuestosOrden = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;

    const orden = await pool.query(
      `
      SELECT
        id,
        codigo
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

    const resultado = await pool.query(
      `
      SELECT
        dr.id,
        dr.orden_id,
        dr.repuesto_id,
        r.codigo,
        r.nombre AS repuesto,
        dr.cantidad,
        dr.precio_unitario,
        (dr.cantidad * dr.precio_unitario) AS subtotal
      FROM detalle_repuestos dr
      INNER JOIN repuestos r
        ON dr.repuesto_id = r.id
      WHERE dr.orden_id = $1
      ORDER BY dr.id
      `,
      [id],
    );

    const totalResultado = await pool.query(
      `
      SELECT
        COALESCE(
          SUM(cantidad * precio_unitario),
          0
        ) AS total_repuestos
      FROM detalle_repuestos
      WHERE orden_id = $1
      `,
      [id],
    );

    return res.status(200).json({
      orden_id: Number(id),
      codigo: orden.rows[0].codigo,
      repuestos: resultado.rows,
      total_repuestos: totalResultado.rows[0].total_repuestos,
    });
  } catch (error) {
    console.error("Error al obtener repuestos de la orden:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};
export const actualizarTotalOrden = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  let confirmado = false;
  try {
    await client.query("BEGIN");
    const { id } = req.params;
    const orden = await client.query("SELECT id, mecanico_id, estado_id FROM ordenes_trabajo WHERE id=$1 FOR UPDATE", [id]);
    if (!orden.rows.length) return res.status(404).json({ mensaje: "Orden no encontrada" });
    if ([6,7].includes(Number(orden.rows[0].estado_id))) return res.status(400).json({ mensaje: "La orden ya no puede modificarse" });
    if (req.usuario!.rol === "mecanico" && Number(orden.rows[0].mecanico_id) !== req.usuario!.id)
      return res.status(403).json({ mensaje: "La orden no está asignada a este mecánico" });
    const servicios = await client.query("SELECT COALESCE(SUM(cantidad * precio_unitario),0) AS total FROM detalle_servicios WHERE orden_id=$1", [id]);
    const repuestos = await client.query("SELECT COALESCE(SUM(cantidad * precio_unitario),0) AS total FROM detalle_repuestos WHERE orden_id=$1", [id]);
    const pagos = await client.query("SELECT COALESCE(SUM(monto),0) AS total_pagado FROM pagos WHERE orden_id=$1", [id]);
    const total = Math.round((Number(servicios.rows[0].total) + Number(repuestos.rows[0].total))*100)/100;
    if (Number(pagos.rows[0].total_pagado) > total)
      return res.status(409).json({ mensaje: "Los pagos registrados superan el total calculado; revise los detalles" });
    const resultado = await client.query("UPDATE ordenes_trabajo SET total=$1, actualizado_en=now() WHERE id=$2 RETURNING id,codigo,total,actualizado_en", [total,id]);
    await client.query("COMMIT"); confirmado = true;
    return res.json({ mensaje: "Total actualizado correctamente", orden: resultado.rows[0],
      detalle_total: { servicios: Number(servicios.rows[0].total), repuestos: Number(repuestos.rows[0].total), total } });
  } catch (error) {
    console.error("Error al recalcular total:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  } finally {
    try { if (!confirmado) await client.query("ROLLBACK"); } finally { client.release(); }
  }
};
export const obtenerHistorialOrden = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;

    // Verificar que la orden exista
    const orden = await pool.query(
      `
      SELECT
        id,
        codigo
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

    // Obtener historial
    const resultado = await pool.query(
      `
      SELECT
        he.id,
        he.orden_id,
        he.estado_id,
        eo.nombre AS estado,
        eo.orden AS orden_estado,
        he.usuario_id,
        u.nombres,
        u.apellidos,
        r.nombre AS rol,
        he.comentario,
        he.fecha
      FROM historial_estados AS he
      INNER JOIN estados_orden AS eo
        ON he.estado_id = eo.id
      INNER JOIN usuarios AS u
        ON he.usuario_id = u.id
      INNER JOIN roles AS r
        ON u.rol_id = r.id
      WHERE he.orden_id = $1
      ORDER BY he.fecha ASC, he.id ASC
      `,
      [id],
    );

    return res.status(200).json({
      orden_id: Number(id),
      codigo: orden.rows[0].codigo,
      historial: resultado.rows,
    });
  } catch (error) {
    console.error("Error al obtener historial de la orden:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};
export const obtenerDetalleCompletoOrden = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;

    // ==========================================
    // 1. DATOS PRINCIPALES DE LA ORDEN
    // ==========================================

    const orden = await pool.query(
      `
      SELECT
        ot.id,
        ot.codigo,

        ot.vehiculo_id,
        ot.recepcionista_id,
        ot.mecanico_id,

        ot.estado_id,
        eo.nombre AS estado_nombre,

        ot.problema_reportado,
        ot.diagnostico,
        ot.observaciones,

        ot.fecha_ingreso,
        ot.fecha_estimada_entrega,
        ot.fecha_entrega,

        ot.total,

        ot.creado_en,
        ot.actualizado_en

      FROM ordenes_trabajo ot

      INNER JOIN estados_orden eo
        ON ot.estado_id = eo.id

      WHERE ot.id = $1
      `,
      [id],
    );

    if (orden.rows.length === 0) {
      return res.status(404).json({
        mensaje: "La orden de trabajo no existe",
      });
    }

    // ==========================================
    // 2. CLIENTE Y VEHÍCULO
    // ==========================================

    const clienteVehiculo = await pool.query(
      `
      SELECT
        c.id AS cliente_id,
        c.dni,
        c.nombres,
        c.apellidos,
        c.telefono,
        c.email,
        c.direccion,

        v.id AS vehiculo_id,
        v.placa,
        v.marca,
        v.modelo,
        v.anio,
        v.color,
        v.vin

      FROM ordenes_trabajo ot

      INNER JOIN vehiculos v
        ON ot.vehiculo_id = v.id

      INNER JOIN clientes c
        ON v.cliente_id = c.id

      WHERE ot.id = $1
      `,
      [id],
    );

    // ==========================================
    // 3. RECEPCIONISTA
    // ==========================================

    const recepcionista = await pool.query(
      `
      SELECT
        u.id,
        u.nombres,
        u.apellidos,
        u.email,
        u.telefono

      FROM ordenes_trabajo ot

      INNER JOIN usuarios u
        ON ot.recepcionista_id = u.id

      WHERE ot.id = $1
      `,
      [id],
    );

    // ==========================================
    // 4. MECÁNICO
    // ==========================================

    const mecanico = await pool.query(
      `
      SELECT
        u.id,
        u.nombres,
        u.apellidos,
        u.email,
        u.telefono

      FROM ordenes_trabajo ot

      LEFT JOIN usuarios u
        ON ot.mecanico_id = u.id

      WHERE ot.id = $1
      `,
      [id],
    );

    // ==========================================
    // 5. SERVICIOS
    // ==========================================

    const servicios = await pool.query(
      `
      SELECT
        ds.id,
        ds.servicio_id,
        s.nombre,
        s.descripcion,
        ds.cantidad,
        ds.precio_unitario,
        (ds.cantidad * ds.precio_unitario) AS subtotal

      FROM detalle_servicios ds

      INNER JOIN servicios s
        ON ds.servicio_id = s.id

      WHERE ds.orden_id = $1

      ORDER BY ds.id
      `,
      [id],
    );

    // ==========================================
    // 6. REPUESTOS
    // ==========================================

    const repuestos = await pool.query(
      `
      SELECT
        dr.id,
        dr.repuesto_id,
        r.codigo,
        r.nombre,
        dr.cantidad,
        dr.precio_unitario,
        (dr.cantidad * dr.precio_unitario) AS subtotal

      FROM detalle_repuestos dr

      INNER JOIN repuestos r
        ON dr.repuesto_id = r.id

      WHERE dr.orden_id = $1

      ORDER BY dr.id
      `,
      [id],
    );

    // ==========================================
    // 7. PAGOS
    // ==========================================

    const pagos = await pool.query(
      `
      SELECT
        p.id,
        p.metodo_pago_id,
        mp.nombre AS metodo_pago,
        p.monto,
        p.referencia,
        p.fecha,
        p.registrado_por,
        u.nombres AS registrado_por_nombres,
        u.apellidos AS registrado_por_apellidos

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

    // ==========================================
    // 8. RESUMEN DE PAGOS
    // ==========================================

    const resumenPagos = await pool.query(
      `
      SELECT
        COALESCE(SUM(monto), 0) AS total_pagado
      FROM pagos
      WHERE orden_id = $1
      `,
      [id],
    );

    const total = Number(orden.rows[0].total);
    const totalPagado = Number(resumenPagos.rows[0].total_pagado);
    const saldoPendiente = total - totalPagado;

    // ==========================================
    // 9. HISTORIAL DE ESTADOS
    // ==========================================

    const historial = await pool.query(
      `
      SELECT
        he.id,
        he.estado_id,
        eo.nombre AS estado,
        eo.orden AS orden_estado,

        he.usuario_id,
        u.nombres,
        u.apellidos,

        r.nombre AS rol,

        he.comentario,
        he.fecha

      FROM historial_estados he

      INNER JOIN estados_orden eo
        ON he.estado_id = eo.id

      INNER JOIN usuarios u
        ON he.usuario_id = u.id

      INNER JOIN roles r
        ON u.rol_id = r.id

      WHERE he.orden_id = $1

      ORDER BY he.fecha ASC, he.id ASC
      `,
      [id],
    );

    // ==========================================
    // 10. RESPUESTA COMPLETA
    // ==========================================

    return res.status(200).json({
      orden: orden.rows[0],

      cliente: clienteVehiculo.rows[0] || null,

      vehiculo: clienteVehiculo.rows[0]
        ? {
            id: clienteVehiculo.rows[0].vehiculo_id,
            placa: clienteVehiculo.rows[0].placa,
            marca: clienteVehiculo.rows[0].marca,
            modelo: clienteVehiculo.rows[0].modelo,
            anio: clienteVehiculo.rows[0].anio,
            color: clienteVehiculo.rows[0].color,
            vin: clienteVehiculo.rows[0].vin,
          }
        : null,

      recepcionista: recepcionista.rows[0] || null,

      mecanico: mecanico.rows[0] || null,

      servicios: servicios.rows,

      repuestos: repuestos.rows,

      pagos: pagos.rows,

      resumen_pago: {
        total: total,
        total_pagado: totalPagado,
        saldo_pendiente: saldoPendiente,
        porcentaje_pagado:
          total > 0 ? Number(((totalPagado / total) * 100).toFixed(2)) : 0,
      },

      historial: historial.rows,
    });
  } catch (error) {
    console.error("Error al obtener detalle completo de la orden:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};
export const asignarMecanico = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { mecanico_id } = req.body;

    // ==========================================
    // 1. VALIDAR MECÁNICO
    // ==========================================

    if (!mecanico_id) {
      return res.status(400).json({
        mensaje: "El mecanico_id es obligatorio",
      });
    }

    // ==========================================
    // 2. VERIFICAR QUE LA ORDEN EXISTA
    // ==========================================

    const orden = await pool.query(
      `
      SELECT
        id,
        codigo,
        mecanico_id,
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

    // ==========================================
    // 3. VERIFICAR QUE EL USUARIO SEA MECÁNICO
    // ==========================================

    const mecanico = await pool.query(
      `
      SELECT
        u.id,
        u.nombres,
        u.apellidos,
        u.email,
        u.telefono,
        u.activo,
        r.nombre AS rol

      FROM usuarios u

      INNER JOIN roles r
        ON u.rol_id = r.id

      WHERE u.id = $1
      `,
      [mecanico_id],
    );

    if (mecanico.rows.length === 0) {
      return res.status(404).json({
        mensaje: "El usuario indicado no existe",
      });
    }

    // ==========================================
    // 4. VALIDAR ROL
    // ==========================================

    if (mecanico.rows[0].rol !== "mecanico") {
      return res.status(400).json({
        mensaje: "El usuario seleccionado no tiene el rol de mecanico",
      });
    }

    // ==========================================
    // 5. VALIDAR QUE ESTÉ ACTIVO
    // ==========================================

    if (!mecanico.rows[0].activo) {
      return res.status(400).json({
        mensaje: "El mecánico seleccionado está inactivo",
      });
    }

    const verificacion = await verificarOrdenModificable(Number(id));

    if (!verificacion.existe) {
      return res.status(404).json({
        mensaje: "Orden no encontrada",
      });
    }

    if (verificacion.bloqueada) {
      return res.status(400).json({
        mensaje: "No se puede modificar una orden entregada o cancelada",
      });
    }
    // ==========================================
    // 6. ASIGNAR MECÁNICO
    // ==========================================

    const resultado = await pool.query(
      `
      UPDATE ordenes_trabajo
      SET
        mecanico_id = $1,
        actualizado_en = now()
      WHERE id = $2
      RETURNING
        id,
        codigo,
        vehiculo_id,
        recepcionista_id,
        mecanico_id,
        estado_id,
        problema_reportado,
        diagnostico,
        observaciones,
        fecha_ingreso,
        fecha_estimada_entrega,
        fecha_entrega,
        total,
        creado_en,
        actualizado_en
      `,
      [mecanico_id, id],
    );

    return res.status(200).json({
      mensaje: "Mecánico asignado correctamente",
      orden: resultado.rows[0],
      mecanico: mecanico.rows[0],
    });
  } catch (error) {
    console.error("Error al asignar mecánico:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};

export const obtenerMisOrdenes = async (req: AuthRequest, res: Response) => {
  try {
    const mecanicoId = req.usuario!.id;

    const resultado = await pool.query(
      `
      SELECT
        ot.id,
        ot.codigo,

        ot.vehiculo_id,
        v.placa,
        v.marca,
        v.modelo,

        c.id AS cliente_id,
        c.nombres AS cliente_nombres,
        c.apellidos AS cliente_apellidos,
        c.telefono AS cliente_telefono,

        ot.mecanico_id,
        m.nombres AS mecanico_nombres,
        m.apellidos AS mecanico_apellidos,

        ot.estado_id,
        eo.nombre AS estado_nombre,

        ot.problema_reportado,
        ot.diagnostico,
        ot.observaciones,

        ot.fecha_ingreso,
        ot.fecha_estimada_entrega,
        ot.fecha_entrega,

        ot.total,

        ot.creado_en,
        ot.actualizado_en

      FROM ordenes_trabajo ot
      INNER JOIN usuarios m ON m.id=ot.mecanico_id

      INNER JOIN vehiculos v
        ON ot.vehiculo_id = v.id

      INNER JOIN clientes c
        ON v.cliente_id = c.id

      INNER JOIN estados_orden eo
        ON ot.estado_id = eo.id

      WHERE ot.mecanico_id = $1

      ORDER BY
        ot.fecha_ingreso DESC,
        ot.id DESC
      `,
      [mecanicoId],
    );

    return res.status(200).json({
      mecanico_id: mecanicoId,
      total_ordenes: resultado.rows.length,
      ordenes: resultado.rows,
    });
  } catch (error) {
    console.error("Error al obtener órdenes del mecánico:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};

export const eliminarServicioOrden = async (
  req: AuthRequest,
  res: Response,
) => {
  const client = await pool.connect();
  try {
    const { id, detalleId } = req.params;
    await client.query("BEGIN");
    const detalle = await client.query(
      `SELECT ds.id, ot.mecanico_id, ot.estado_id
       FROM detalle_servicios ds
       INNER JOIN ordenes_trabajo ot ON ot.id = ds.orden_id
       WHERE ds.id = $1 AND ds.orden_id = $2 FOR UPDATE`,
      [detalleId, id],
    );
    if (!detalle.rows.length) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ mensaje: "Servicio no encontrado en la orden" });
    }
    const orden = detalle.rows[0];
    if ([6, 7].includes(Number(orden.estado_id))) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ mensaje: "La orden ya no puede modificarse" });
    }
    if (
      req.usuario!.rol === "mecanico" &&
      Number(orden.mecanico_id) !== req.usuario!.id
    ) {
      await client.query("ROLLBACK");
      return res
        .status(403)
        .json({ mensaje: "La orden no está asignada a este mecánico" });
    }
    await client.query("DELETE FROM detalle_servicios WHERE id = $1", [
      detalleId,
    ]);
    await client.query("SELECT recalcular_total_orden($1)", [id]);
    const saldo = await client.query(
      `SELECT ot.total, COALESCE(SUM(p.monto), 0) total_pagado
       FROM ordenes_trabajo ot LEFT JOIN pagos p ON p.orden_id = ot.id
       WHERE ot.id = $1 GROUP BY ot.id`,
      [id],
    );
    if (Number(saldo.rows[0].total_pagado) > Number(saldo.rows[0].total)) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        mensaje: "No se puede retirar: los pagos superarían el nuevo total",
      });
    }
    await client.query("COMMIT");
    return res.json({ mensaje: "Servicio retirado correctamente" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al retirar servicio:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  } finally {
    client.release();
  }
};

export const eliminarRepuestoOrden = async (
  req: AuthRequest,
  res: Response,
) => {
  const client = await pool.connect();
  try {
    const { id, detalleId } = req.params;
    await client.query("BEGIN");
    const detalle = await client.query(
      `SELECT dr.id, dr.repuesto_id, dr.cantidad, r.nombre,
              ot.mecanico_id, ot.estado_id
       FROM detalle_repuestos dr
       INNER JOIN repuestos r ON r.id = dr.repuesto_id
       INNER JOIN ordenes_trabajo ot ON ot.id = dr.orden_id
       WHERE dr.id = $1 AND dr.orden_id = $2 FOR UPDATE OF dr, r, ot`,
      [detalleId, id],
    );
    if (!detalle.rows.length) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ mensaje: "Repuesto no encontrado en la orden" });
    }
    const item = detalle.rows[0];
    if ([6, 7].includes(Number(item.estado_id))) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ mensaje: "La orden ya no puede modificarse" });
    }
    if (
      req.usuario!.rol === "mecanico" &&
      Number(item.mecanico_id) !== req.usuario!.id
    ) {
      await client.query("ROLLBACK");
      return res
        .status(403)
        .json({ mensaje: "La orden no está asignada a este mecánico" });
    }
    await client.query("DELETE FROM detalle_repuestos WHERE id = $1", [
      detalleId,
    ]);
    await client.query(
      "UPDATE repuestos SET stock_actual = stock_actual + $1 WHERE id = $2",
      [item.cantidad, item.repuesto_id],
    );
    await client.query(
      `INSERT INTO movimientos_inventario
       (repuesto_id, orden_id, usuario_id, tipo, cantidad, motivo)
       VALUES ($1, $2, $3, 'ENTRADA', $4, $5)`,
      [
        item.repuesto_id,
        id,
        req.usuario!.id,
        item.cantidad,
        `Devolución al retirar ${item.nombre} de la orden`,
      ],
    );
    await client.query("SELECT recalcular_total_orden($1)", [id]);
    const saldo = await client.query(
      `SELECT ot.total, COALESCE(SUM(p.monto), 0) total_pagado
       FROM ordenes_trabajo ot LEFT JOIN pagos p ON p.orden_id = ot.id
       WHERE ot.id = $1 GROUP BY ot.id`,
      [id],
    );
    if (Number(saldo.rows[0].total_pagado) > Number(saldo.rows[0].total)) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        mensaje: "No se puede retirar: los pagos superarían el nuevo total",
      });
    }
    await client.query("COMMIT");
    return res.json({ mensaje: "Repuesto retirado y stock restaurado" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al retirar repuesto:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  } finally {
    client.release();
  }
};
