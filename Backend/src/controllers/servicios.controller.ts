import { Request, Response } from "express";
import { pool } from "../config/database";

/**
 * Crear servicio
 */
export const crearServicio = async (req: Request, res: Response) => {
  try {
    const { nombre, descripcion, precio_base } = req.body;

    // Validar campos obligatorios
    if (!nombre || precio_base === undefined || precio_base === null) {
      return res.status(400).json({
        mensaje: "El nombre y el precio base son obligatorios",
      });
    }

    // Validar que el precio sea numérico
    if (typeof precio_base !== "number" || precio_base < 0) {
      return res.status(400).json({
        mensaje: "El precio base debe ser un número mayor o igual a 0",
      });
    }

    // Verificar si ya existe un servicio con el mismo nombre
    const servicioExistente = await pool.query(
      `
            SELECT id
            FROM servicios
            WHERE LOWER(nombre) = LOWER($1)
            `,
      [nombre],
    );

    if (servicioExistente.rows.length > 0) {
      return res.status(409).json({
        mensaje: "Ya existe un servicio con ese nombre",
      });
    }

    const resultado = await pool.query(
      `
            INSERT INTO servicios
                (
                    nombre,
                    descripcion,
                    precio_base,
                    activo
                )
            VALUES
                ($1, $2, $3, true)
            RETURNING
                id,
                nombre,
                descripcion,
                precio_base,
                activo,
                creado_en,
                actualizado_en
            `,
      [nombre, descripcion ?? null, precio_base],
    );

    return res.status(201).json({
      mensaje: "Servicio creado correctamente",
      servicio: resultado.rows[0],
    });
  } catch (error) {
    console.error("Error al crear servicio:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};

/**
 * Obtener todos los servicios
 */
export const obtenerServicios = async (req: Request, res: Response) => {
  try {
    const resultado = await pool.query(
      `
            SELECT
                id,
                nombre,
                descripcion,
                precio_base,
                activo,
                creado_en,
                actualizado_en
            FROM servicios
            ORDER BY id ASC
            `,
    );

    return res.status(200).json({
      servicios: resultado.rows,
    });
  } catch (error) {
    console.error("Error al obtener servicios:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};

/**
 * Obtener servicio por ID
 */
export const obtenerServicioPorId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const resultado = await pool.query(
      `
            SELECT
                id,
                nombre,
                descripcion,
                precio_base,
                activo,
                creado_en,
                actualizado_en
            FROM servicios
            WHERE id = $1
            `,
      [id],
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Servicio no encontrado",
      });
    }

    return res.status(200).json({
      servicio: resultado.rows[0],
    });
  } catch (error) {
    console.error("Error al obtener servicio:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};

/**
 * Actualizar servicio
 */
export const actualizarServicio = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { nombre, descripcion, precio_base } = req.body;

    if (!nombre || precio_base === undefined || precio_base === null) {
      return res.status(400).json({
        mensaje: "El nombre y el precio base son obligatorios",
      });
    }

    if (typeof precio_base !== "number" || precio_base < 0) {
      return res.status(400).json({
        mensaje: "El precio base debe ser un número mayor o igual a 0",
      });
    }

    // Verificar que exista
    const servicio = await pool.query(
      `
            SELECT id
            FROM servicios
            WHERE id = $1
            `,
      [id],
    );

    if (servicio.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Servicio no encontrado",
      });
    }

    // Verificar nombre duplicado
    const nombreExistente = await pool.query(
      `
            SELECT id
            FROM servicios
            WHERE LOWER(nombre) = LOWER($1)
            AND id <> $2
            `,
      [nombre, id],
    );

    if (nombreExistente.rows.length > 0) {
      return res.status(409).json({
        mensaje: "Ya existe otro servicio con ese nombre",
      });
    }

    const resultado = await pool.query(
      `
            UPDATE servicios
            SET
                nombre = $1,
                descripcion = $2,
                precio_base = $3,
                actualizado_en = now()
            WHERE id = $4
            RETURNING
                id,
                nombre,
                descripcion,
                precio_base,
                activo,
                creado_en,
                actualizado_en
            `,
      [nombre, descripcion ?? null, precio_base, id],
    );

    return res.status(200).json({
      mensaje: "Servicio actualizado correctamente",
      servicio: resultado.rows[0],
    });
  } catch (error) {
    console.error("Error al actualizar servicio:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};

/**
 * Activar / desactivar servicio
 */
export const cambiarEstadoServicio = async (req: Request, res: Response) => {
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
            UPDATE servicios
            SET
                activo = $1,
                actualizado_en = now()
            WHERE id = $2
            RETURNING
                id,
                nombre,
                descripcion,
                precio_base,
                activo,
                creado_en,
                actualizado_en
            `,
      [activo, id],
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Servicio no encontrado",
      });
    }

    return res.status(200).json({
      mensaje: activo
        ? "Servicio activado correctamente"
        : "Servicio desactivado correctamente",
      servicio: resultado.rows[0],
    });
  } catch (error) {
    console.error("Error al cambiar estado del servicio:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};
