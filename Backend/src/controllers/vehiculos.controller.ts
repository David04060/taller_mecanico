import { Request, Response } from "express";
import { pool } from "../config/database";

/**
 * Crear vehículo
 */
export const crearVehiculo = async (req: Request, res: Response) => {
  try {
    const { cliente_id, placa, marca, modelo, anio, color, vin } = req.body;

    // Campos obligatorios
    if (!cliente_id || !placa || !marca || !modelo) {
      return res.status(400).json({
        mensaje: "El cliente, placa, marca y modelo son obligatorios",
      });
    }

    // Verificar que el cliente exista
    const cliente = await pool.query(
      `
            SELECT id
            FROM clientes
            WHERE id = $1
            AND activo = true
            `,
      [cliente_id],
    );

    if (cliente.rows.length === 0) {
      return res.status(400).json({
        mensaje: "El cliente no existe o está desactivado",
      });
    }

    // Verificar que la placa no esté registrada
    const vehiculoExistente = await pool.query(
      `
            SELECT id
            FROM vehiculos
            WHERE UPPER(placa) = UPPER($1)
            `,
      [placa],
    );

    if (vehiculoExistente.rows.length > 0) {
      return res.status(409).json({
        mensaje: "La placa ya está registrada",
      });
    }

    // Verificar VIN si se proporciona
    if (vin) {
      const vinExistente = await pool.query(
        `
                SELECT id
                FROM vehiculos
                WHERE UPPER(vin) = UPPER($1)
                `,
        [vin],
      );

      if (vinExistente.rows.length > 0) {
        return res.status(409).json({
          mensaje: "El VIN ya está registrado",
        });
      }
    }

    const resultado = await pool.query(
      `
            INSERT INTO vehiculos
                (
                    cliente_id,
                    placa,
                    marca,
                    modelo,
                    anio,
                    color,
                    vin,
                    activo
                )
            VALUES
                ($1, $2, $3, $4, $5, $6, $7, true)
            RETURNING
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
            `,
      [
        cliente_id,
        placa,
        marca,
        modelo,
        anio ?? null,
        color ?? null,
        vin ?? null,
      ],
    );

    return res.status(201).json({
      mensaje: "Vehículo creado correctamente",
      vehiculo: resultado.rows[0],
    });
  } catch (error) {
    console.error("Error al crear vehículo:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};

/**
 * Obtener todos los vehículos
 */
export const obtenerVehiculos = async (req: Request, res: Response) => {
  try {
    const resultado = await pool.query(
      `
            SELECT
                v.id,
                v.cliente_id,
                c.dni AS cliente_dni,
                c.nombres AS cliente_nombres,
                c.apellidos AS cliente_apellidos,
                v.placa,
                v.marca,
                v.modelo,
                v.anio,
                v.color,
                v.vin,
                v.activo,
                v.creado_en,
                v.actualizado_en
            FROM vehiculos v
            INNER JOIN clientes c
                ON v.cliente_id = c.id
            ORDER BY v.id ASC
            `,
    );

    return res.status(200).json({
      vehiculos: resultado.rows,
    });
  } catch (error) {
    console.error("Error al obtener vehículos:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};

/**
 * Obtener vehículo por ID
 */
export const obtenerVehiculoPorId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const resultado = await pool.query(
      `
            SELECT
                v.id,
                v.cliente_id,
                c.dni AS cliente_dni,
                c.nombres AS cliente_nombres,
                c.apellidos AS cliente_apellidos,
                c.telefono AS cliente_telefono,
                c.email AS cliente_email,
                v.placa,
                v.marca,
                v.modelo,
                v.anio,
                v.color,
                v.vin,
                v.activo,
                v.creado_en,
                v.actualizado_en
            FROM vehiculos v
            INNER JOIN clientes c
                ON v.cliente_id = c.id
            WHERE v.id = $1
            `,
      [id],
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Vehículo no encontrado",
      });
    }

    return res.status(200).json({
      vehiculo: resultado.rows[0],
    });
  } catch (error) {
    console.error("Error al obtener vehículo:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};

/**
 * Obtener vehículos de un cliente
 */
export const obtenerVehiculosPorCliente = async (
  req: Request,
  res: Response,
) => {
  try {
    const { clienteId } = req.params;

    // Verificar cliente
    const cliente = await pool.query(
      `
            SELECT id
            FROM clientes
            WHERE id = $1
            `,
      [clienteId],
    );

    if (cliente.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Cliente no encontrado",
      });
    }

    const resultado = await pool.query(
      `
            SELECT
                v.id,
                v.cliente_id,
                v.placa,
                v.marca,
                v.modelo,
                v.anio,
                v.color,
                v.vin,
                v.activo,
                v.creado_en,
                v.actualizado_en
            FROM vehiculos v
            WHERE v.cliente_id = $1
            ORDER BY v.id ASC
            `,
      [clienteId],
    );

    return res.status(200).json({
      vehiculos: resultado.rows,
    });
  } catch (error) {
    console.error("Error al obtener vehículos del cliente:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};

/**
 * Actualizar vehículo
 */
export const actualizarVehiculo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { cliente_id, placa, marca, modelo, anio, color, vin } = req.body;

    if (!cliente_id || !placa || !marca || !modelo) {
      return res.status(400).json({
        mensaje: "El cliente, placa, marca y modelo son obligatorios",
      });
    }

    // Verificar que el vehículo exista
    const vehiculo = await pool.query(
      `
            SELECT id
            FROM vehiculos
            WHERE id = $1
            `,
      [id],
    );

    if (vehiculo.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Vehículo no encontrado",
      });
    }

    // Verificar cliente
    const cliente = await pool.query(
      `
            SELECT id
            FROM clientes
            WHERE id = $1
            AND activo = true
            `,
      [cliente_id],
    );

    if (cliente.rows.length === 0) {
      return res.status(400).json({
        mensaje: "El cliente no existe o está desactivado",
      });
    }

    // Verificar placa en otro vehículo
    const placaExistente = await pool.query(
      `
            SELECT id
            FROM vehiculos
            WHERE UPPER(placa) = UPPER($1)
            AND id <> $2
            `,
      [placa, id],
    );

    if (placaExistente.rows.length > 0) {
      return res.status(409).json({
        mensaje: "La placa ya pertenece a otro vehículo",
      });
    }

    // Verificar VIN en otro vehículo
    if (vin) {
      const vinExistente = await pool.query(
        `
                SELECT id
                FROM vehiculos
                WHERE UPPER(vin) = UPPER($1)
                AND id <> $2
                `,
        [vin, id],
      );

      if (vinExistente.rows.length > 0) {
        return res.status(409).json({
          mensaje: "El VIN ya pertenece a otro vehículo",
        });
      }
    }

    const resultado = await pool.query(
      `
            UPDATE vehiculos
            SET
                cliente_id = $1,
                placa = $2,
                marca = $3,
                modelo = $4,
                anio = $5,
                color = $6,
                vin = $7,
                actualizado_en = now()
            WHERE id = $8
            RETURNING
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
            `,
      [
        cliente_id,
        placa,
        marca,
        modelo,
        anio ?? null,
        color ?? null,
        vin ?? null,
        id,
      ],
    );

    return res.status(200).json({
      mensaje: "Vehículo actualizado correctamente",
      vehiculo: resultado.rows[0],
    });
  } catch (error) {
    console.error("Error al actualizar vehículo:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};

/**
 * Activar / desactivar vehículo
 */
export const cambiarEstadoVehiculo = async (req: Request, res: Response) => {
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
            UPDATE vehiculos
            SET
                activo = $1,
                actualizado_en = now()
            WHERE id = $2
            RETURNING
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
            `,
      [activo, id],
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Vehículo no encontrado",
      });
    }

    return res.status(200).json({
      mensaje: activo
        ? "Vehículo activado correctamente"
        : "Vehículo desactivado correctamente",
      vehiculo: resultado.rows[0],
    });
  } catch (error) {
    console.error("Error al cambiar estado del vehículo:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};
