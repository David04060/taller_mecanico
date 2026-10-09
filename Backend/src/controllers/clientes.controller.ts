import { Request, Response } from "express";
import { pool } from "../config/database";
import { AuthRequest } from "../middleware/auth.middleware";
import bcrypt from "bcryptjs";

/**
 * Crear cliente
 */
export const crearCliente = async (req: Request, res: Response) => {
  try {
    const { usuario_id, dni, nombres, apellidos, telefono, email, direccion } =
      req.body;

    // Campos obligatorios
    if (!dni || !nombres || !apellidos) {
      return res.status(400).json({
        mensaje: "El DNI, nombres y apellidos son obligatorios",
      });
    }

    // Verificar si el DNI ya existe
    const clienteExistente = await pool.query(
      `
            SELECT id
            FROM clientes
            WHERE dni = $1
            `,
      [dni],
    );

    if (clienteExistente.rows.length > 0) {
      return res.status(409).json({
        mensaje: "Ya existe un cliente registrado con ese DNI",
      });
    }

    // Si se proporciona usuario_id,
    // verificar que el usuario exista
    if (usuario_id !== undefined && usuario_id !== null) {
      const usuario = await pool.query(
        `
                SELECT id
                FROM usuarios
                WHERE id = $1
                `,
        [usuario_id],
      );

      if (usuario.rows.length === 0) {
        return res.status(400).json({
          mensaje: "El usuario indicado no existe",
        });
      }
    }

    const resultado = await pool.query(
      `
            INSERT INTO clientes
                (
                    usuario_id,
                    dni,
                    nombres,
                    apellidos,
                    telefono,
                    email,
                    direccion,
                    activo
                )
            VALUES
                ($1, $2, $3, $4, $5, $6, $7, true)
            RETURNING
                id,
                usuario_id,
                dni,
                nombres,
                apellidos,
                telefono,
                email,
                direccion,
                activo,
                creado_en,
                actualizado_en
            `,
      [
        usuario_id ?? null,
        dni,
        nombres,
        apellidos,
        telefono ?? null,
        email ?? null,
        direccion ?? null,
      ],
    );

    return res.status(201).json({
      mensaje: "Cliente creado correctamente",
      cliente: resultado.rows[0],
    });
  } catch (error) {
    console.error("Error al crear cliente:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};

/**
 * Obtener todos los clientes
 */
export const obtenerClientes = async (req: Request, res: Response) => {
  try {
    const resultado = await pool.query(
      `
            SELECT
                c.id,
                c.usuario_id,
                c.dni,
                c.nombres,
                c.apellidos,
                c.telefono,
                c.email,
                c.direccion,
                c.activo,
                c.creado_en,
                c.actualizado_en
            FROM clientes c
            ORDER BY c.id ASC
            `,
    );

    return res.status(200).json({
      clientes: resultado.rows,
    });
  } catch (error) {
    console.error("Error al obtener clientes:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};

/**
 * Obtener un cliente por ID
 */
export const obtenerClientePorId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const resultado = await pool.query(
      `
            SELECT
                c.id,
                c.usuario_id,
                c.dni,
                c.nombres,
                c.apellidos,
                c.telefono,
                c.email,
                c.direccion,
                c.activo,
                c.creado_en,
                c.actualizado_en
            FROM clientes c
            WHERE c.id = $1
            `,
      [id],
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Cliente no encontrado",
      });
    }

    return res.status(200).json({
      cliente: resultado.rows[0],
    });
  } catch (error) {
    console.error("Error al obtener cliente:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};

/**
 * Actualizar cliente
 */
export const actualizarCliente = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { dni, nombres, apellidos, telefono, email, direccion } = req.body;

    if (!dni || !nombres || !apellidos) {
      return res.status(400).json({
        mensaje: "El DNI, nombres y apellidos son obligatorios",
      });
    }

    // Verificar que el cliente exista
    const cliente = await pool.query(
      `
            SELECT id
            FROM clientes
            WHERE id = $1
            `,
      [id],
    );

    if (cliente.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Cliente no encontrado",
      });
    }

    // Verificar que el DNI no pertenezca a otro cliente
    const dniExistente = await pool.query(
      `
            SELECT id
            FROM clientes
            WHERE dni = $1
            AND id <> $2
            `,
      [dni, id],
    );

    if (dniExistente.rows.length > 0) {
      return res.status(409).json({
        mensaje: "El DNI ya pertenece a otro cliente",
      });
    }

    const resultado = await pool.query(
      `
            UPDATE clientes
            SET
                dni = $1,
                nombres = $2,
                apellidos = $3,
                telefono = $4,
                email = $5,
                direccion = $6,
                actualizado_en = now()
            WHERE id = $7
            RETURNING
                id,
                usuario_id,
                dni,
                nombres,
                apellidos,
                telefono,
                email,
                direccion,
                activo,
                creado_en,
                actualizado_en
            `,
      [
        dni,
        nombres,
        apellidos,
        telefono ?? null,
        email ?? null,
        direccion ?? null,
        id,
      ],
    );

    return res.status(200).json({
      mensaje: "Cliente actualizado correctamente",
      cliente: resultado.rows[0],
    });
  } catch (error) {
    console.error("Error al actualizar cliente:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};

/**
 * Activar o desactivar cliente
 */
export const cambiarEstadoCliente = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    if (typeof activo !== "boolean") {
      return res.status(400).json({
        mensaje: "El campo activo debe ser true o false",
      });
    }

    const resultado = await pool.query(
      `
            UPDATE clientes
            SET
                activo = $1,
                actualizado_en = now()
            WHERE id = $2
            RETURNING
                id,
                usuario_id,
                dni,
                nombres,
                apellidos,
                telefono,
                email,
                direccion,
                activo,
                creado_en,
                actualizado_en
            `,
      [activo, id],
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Cliente no encontrado",
      });
    }

    if (resultado.rows[0].usuario_id) {
      await pool.query("UPDATE usuarios SET activo = $1 WHERE id = $2", [
        activo,
        resultado.rows[0].usuario_id,
      ]);
    }

    return res.status(200).json({
      mensaje: activo
        ? "Cliente activado correctamente"
        : "Cliente desactivado correctamente",
      cliente: resultado.rows[0],
    });
  } catch (error) {
    console.error("Error al cambiar estado del cliente:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};

export const obtenerMisDatos = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.usuario!.id;

    const resultado = await pool.query(
      `
      SELECT
        c.id,
        c.usuario_id,
        c.dni,
        c.nombres,
        c.apellidos,
        c.telefono,
        c.email,
        c.direccion,
        c.activo,
        c.creado_en,
        c.actualizado_en
      FROM clientes c
      WHERE c.usuario_id = $1
      `,
      [usuarioId],
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensaje: "No se encontró un cliente asociado a este usuario",
      });
    }

    return res.status(200).json({
      cliente: resultado.rows[0],
    });
  } catch (error) {
    console.error("Error al obtener los datos del cliente:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};
export const obtenerMisVehiculos = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.usuario!.id;

    // Primero obtenemos el cliente asociado al usuario autenticado
    const cliente = await pool.query(
      `
      SELECT id
      FROM clientes
      WHERE usuario_id = $1
      `,
      [usuarioId],
    );

    if (cliente.rows.length === 0) {
      return res.status(404).json({
        mensaje: "No se encontró un cliente asociado a este usuario",
      });
    }

    const clienteId = cliente.rows[0].id;

    // Obtenemos solamente los vehículos de ese cliente
    const resultado = await pool.query(
      `
      SELECT
        id,
        cliente_id,
        placa,
        marca,
        modelo,
        anio,
        color,
        vin,
        activo,
        creado_en,
        actualizado_en
      FROM vehiculos
      WHERE cliente_id = $1
      ORDER BY id
      `,
      [clienteId],
    );

    return res.status(200).json({
      cliente_id: clienteId,
      cantidad: resultado.rows.length,
      vehiculos: resultado.rows,
    });
  } catch (error) {
    console.error("Error al obtener los vehículos del cliente:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};
export const obtenerMisOrdenesCliente = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const usuarioId = req.usuario!.id;

    // Obtener el cliente asociado al usuario autenticado
    const cliente = await pool.query(
      `
      SELECT id
      FROM clientes
      WHERE usuario_id = $1
      `,
      [usuarioId],
    );

    if (cliente.rows.length === 0) {
      return res.status(404).json({
        mensaje: "No se encontró un cliente asociado a este usuario",
      });
    }

    const clienteId = cliente.rows[0].id;

    // Obtener solamente las órdenes de los vehículos del cliente
    const resultado = await pool.query(
      `
      SELECT
        ot.id,
        ot.codigo,
        ot.vehiculo_id,

        v.placa,
        v.marca,
        v.modelo,

        ot.estado_id,
        eo.nombre AS estado,

        ot.problema_reportado,
        ot.diagnostico,
        ot.observaciones,

        ot.fecha_ingreso,
        ot.fecha_estimada_entrega,
        ot.fecha_entrega,

        ot.total,

        COALESCE(
          (
            SELECT SUM(p.monto)
            FROM pagos p
            WHERE p.orden_id = ot.id
          ),
          0
        ) AS total_pagado,

        ot.total -
        COALESCE(
          (
            SELECT SUM(p.monto)
            FROM pagos p
            WHERE p.orden_id = ot.id
          ),
          0
        ) AS saldo_pendiente

      FROM ordenes_trabajo ot

      INNER JOIN vehiculos v
        ON ot.vehiculo_id = v.id

      INNER JOIN estados_orden eo
        ON ot.estado_id = eo.id

      WHERE v.cliente_id = $1

      ORDER BY ot.fecha_ingreso DESC, ot.id DESC
      `,
      [clienteId],
    );

    return res.status(200).json({
      cliente_id: clienteId,
      cantidad: resultado.rows.length,
      ordenes: resultado.rows,
    });
  } catch (error) {
    console.error("Error al obtener las órdenes del cliente:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};
export const obtenerDetalleMiOrden = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;

    // ==========================================
    // 1. Verificar que el usuario tenga cliente
    // ==========================================

    const cliente = await pool.query(
      `
      SELECT id
      FROM clientes
      WHERE usuario_id = $1
        AND activo = true
      `,
      [req.usuario!.id],
    );

    if (cliente.rows.length === 0) {
      return res.status(404).json({
        mensaje: "No se encontró un perfil de cliente asociado al usuario",
      });
    }

    const clienteId = cliente.rows[0].id;

    // ==========================================
    // 2. Obtener la orden
    // ==========================================

    const orden = await pool.query(
      `
      SELECT
        ot.id,
        ot.codigo,

        ot.vehiculo_id,
        v.placa,
        v.marca,
        v.modelo,
        v.anio,
        v.color,

        ot.estado_id,
        eo.nombre AS estado,

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

      INNER JOIN estados_orden eo
        ON ot.estado_id = eo.id

      WHERE ot.id = $1
        AND v.cliente_id = $2
      `,
      [id, clienteId],
    );

    if (orden.rows.length === 0) {
      return res.status(404).json({
        mensaje: "La orden no existe o no pertenece al cliente",
      });
    }

    const datosOrden = orden.rows[0];

    // ==========================================
    // 3. Obtener servicios
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
        ds.cantidad * ds.precio_unitario AS subtotal
      FROM detalle_servicios ds

      INNER JOIN servicios s
        ON ds.servicio_id = s.id

      WHERE ds.orden_id = $1

      ORDER BY ds.id
      `,
      [id],
    );

    // ==========================================
    // 4. Obtener repuestos
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
        dr.cantidad * dr.precio_unitario AS subtotal
      FROM detalle_repuestos dr

      INNER JOIN repuestos r
        ON dr.repuesto_id = r.id

      WHERE dr.orden_id = $1

      ORDER BY dr.id
      `,
      [id],
    );

    // ==========================================
    // 5. Obtener pagos
    // ==========================================

    const pagos = await pool.query(
      `
      SELECT
        p.id,
        p.metodo_pago_id,
        mp.nombre AS metodo_pago,
        p.monto,
        p.referencia,
        p.fecha
      FROM pagos p

      INNER JOIN metodos_pago mp
        ON p.metodo_pago_id = mp.id

      WHERE p.orden_id = $1

      ORDER BY p.fecha ASC, p.id ASC
      `,
      [id],
    );

    // ==========================================
    // 6. Calcular resumen de pagos
    // ==========================================

    const totalPagado = pagos.rows.reduce(
      (total, pago) => total + Number(pago.monto),
      0,
    );

    const totalOrden = Number(datosOrden.total);

    const saldoPendiente = Math.max(totalOrden - totalPagado, 0);

    // ==========================================
    // 7. Obtener historial
    // ==========================================

    const historial = await pool.query(
      `
      SELECT
        h.id,
        h.estado_id,
        eo.nombre AS estado,
        h.comentario,
        h.fecha
      FROM historial_estados h

      INNER JOIN estados_orden eo
        ON h.estado_id = eo.id

      WHERE h.orden_id = $1

      ORDER BY h.fecha ASC, h.id ASC
      `,
      [id],
    );

    // ==========================================
    // 8. Respuesta
    // ==========================================

    return res.status(200).json({
      orden: {
        id: datosOrden.id,
        codigo: datosOrden.codigo,

        vehiculo: {
          id: datosOrden.vehiculo_id,
          placa: datosOrden.placa,
          marca: datosOrden.marca,
          modelo: datosOrden.modelo,
          anio: datosOrden.anio,
          color: datosOrden.color,
        },

        estado: {
          id: datosOrden.estado_id,
          nombre: datosOrden.estado,
        },

        problema_reportado: datosOrden.problema_reportado,

        diagnostico: datosOrden.diagnostico,

        observaciones: datosOrden.observaciones,

        fecha_ingreso: datosOrden.fecha_ingreso,

        fecha_estimada_entrega: datosOrden.fecha_estimada_entrega,

        fecha_entrega: datosOrden.fecha_entrega,

        servicios: servicios.rows,

        repuestos: repuestos.rows,

        pagos: pagos.rows,

        resumen_pago: {
          total: totalOrden,
          total_pagado: totalPagado,
          saldo_pendiente: saldoPendiente,
        },

        historial: historial.rows,
      },
    });
  } catch (error) {
    console.error(
      "Error al obtener el detalle de la orden del cliente:",
      error,
    );

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};
export const obtenerMisPagos = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.usuario!.id;

    // Obtener el cliente asociado al usuario autenticado
    const cliente = await pool.query(
      `
      SELECT id
      FROM clientes
      WHERE usuario_id = $1
      `,
      [usuarioId],
    );

    if (cliente.rows.length === 0) {
      return res.status(404).json({
        mensaje: "No se encontró un cliente asociado a este usuario",
      });
    }

    const clienteId = cliente.rows[0].id;

    // Obtener todos los pagos de las órdenes del cliente
    const resultado = await pool.query(
      `
      SELECT
        p.id AS pago_id,

        p.orden_id,
        ot.codigo AS orden_codigo,

        v.placa,
        v.marca,
        v.modelo,

        p.metodo_pago_id,
        mp.nombre AS metodo_pago,

        p.monto,
        p.referencia,
        p.fecha AS fecha_pago,

        ot.total AS total_orden

      FROM pagos p

      INNER JOIN ordenes_trabajo ot
        ON p.orden_id = ot.id

      INNER JOIN vehiculos v
        ON ot.vehiculo_id = v.id

      INNER JOIN metodos_pago mp
        ON p.metodo_pago_id = mp.id

      WHERE v.cliente_id = $1

      ORDER BY p.fecha DESC, p.id DESC
      `,
      [clienteId],
    );

    // Calcular total pagado por el cliente
    const resumen = await pool.query(
      `
      SELECT
        COALESCE(SUM(p.monto), 0) AS total_pagado
      FROM pagos p
      INNER JOIN ordenes_trabajo ot
        ON p.orden_id = ot.id
      INNER JOIN vehiculos v
        ON ot.vehiculo_id = v.id
      WHERE v.cliente_id = $1
      `,
      [clienteId],
    );

    return res.status(200).json({
      cliente_id: clienteId,
      cantidad: resultado.rows.length,
      total_pagado: resumen.rows[0].total_pagado,
      pagos: resultado.rows,
    });
  } catch (error) {
    console.error("Error al obtener los pagos del cliente:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};

export const crearAccesoCliente = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { email, password } = req.body;
    if (!email || !password || String(password).length < 8) {
      return res
        .status(400)
        .json({
          mensaje:
            "Correo y contraseña de al menos 8 caracteres son obligatorios",
        });
    }
    await client.query("BEGIN");
    const cliente = await client.query(
      `SELECT id, usuario_id, nombres, apellidos, telefono, activo
       FROM clientes WHERE id = $1 FOR UPDATE`,
      [id],
    );
    if (!cliente.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }
    if (cliente.rows[0].usuario_id) {
      await client.query("ROLLBACK");
      return res
        .status(409)
        .json({ mensaje: "El cliente ya tiene una cuenta de acceso" });
    }
    const rol = await client.query(
      "SELECT id FROM roles WHERE nombre = 'cliente'",
    );
    if (!rol.rows.length) throw new Error("No existe el rol cliente");
    const hash = await bcrypt.hash(String(password), 12);
    const usuario = await client.query(
      `INSERT INTO usuarios (rol_id, nombres, apellidos, email, password_hash, telefono, activo)
       VALUES ($1, $2, $3, LOWER($4), $5, $6, $7)
       RETURNING id, nombres, apellidos, email, activo`,
      [
        rol.rows[0].id,
        cliente.rows[0].nombres,
        cliente.rows[0].apellidos,
        email,
        hash,
        cliente.rows[0].telefono,
        cliente.rows[0].activo,
      ],
    );
    await client.query(
      "UPDATE clientes SET usuario_id = $1, email = LOWER($2) WHERE id = $3",
      [usuario.rows[0].id, email, id],
    );
    await client.query("COMMIT");
    return res
      .status(201)
      .json({
        mensaje: "Acceso del cliente creado correctamente",
        usuario: usuario.rows[0],
      });
  } catch (error: any) {
    await client.query("ROLLBACK");
    if (error?.code === "23505")
      return res.status(409).json({ mensaje: "El correo ya está registrado" });
    console.error("Error al crear acceso de cliente:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  } finally {
    client.release();
  }
};
