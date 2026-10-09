import { Request, Response } from "express";
import { pool } from "../config/database";

export const crearCategoria = async (req: Request, res: Response) => {
  try {
    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).json({
        mensaje: "El nombre de la categoría es obligatorio",
      });
    }

    // Verificar si ya existe
    const categoriaExistente = await pool.query(
      `
            SELECT id
            FROM categorias_repuesto
            WHERE LOWER(nombre) = LOWER($1)
            `,
      [nombre],
    );

    if (categoriaExistente.rows.length > 0) {
      return res.status(409).json({
        mensaje: "La categoría ya existe",
      });
    }

    const resultado = await pool.query(
      `
            INSERT INTO categorias_repuesto
                (nombre, activo)
            VALUES
                ($1, true)
            RETURNING id, nombre, activo, creado_en
            `,
      [nombre],
    );

    return res.status(201).json({
      mensaje: "Categoría creada correctamente",
      categoria: resultado.rows[0],
    });
  } catch (error) {
    console.error("Error al crear categoría:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};

export const obtenerCategorias = async (req: Request, res: Response) => {
  try {
    const resultado = await pool.query(
      `
            SELECT
                id,
                nombre,
                activo,
                creado_en
            FROM categorias_repuesto
            ORDER BY id ASC
            `,
    );

    return res.status(200).json({
      categorias: resultado.rows,
    });
  } catch (error) {
    console.error("Error al obtener categorías:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};

export const obtenerCategoriaPorId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const resultado = await pool.query(
      `
            SELECT
                id,
                nombre,
                activo,
                creado_en
            FROM categorias_repuesto
            WHERE id = $1
            `,
      [id],
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Categoría no encontrada",
      });
    }

    return res.status(200).json({
      categoria: resultado.rows[0],
    });
  } catch (error) {
    console.error("Error al obtener categoría:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};

export const actualizarCategoria = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).json({
        mensaje: "El nombre de la categoría es obligatorio",
      });
    }

    // Verificar que exista
    const categoriaExistente = await pool.query(
      `
            SELECT id
            FROM categorias_repuesto
            WHERE id = $1
            `,
      [id],
    );

    if (categoriaExistente.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Categoría no encontrada",
      });
    }

    // Verificar que el nuevo nombre no pertenezca a otra categoría
    const nombreExistente = await pool.query(
      `
            SELECT id
            FROM categorias_repuesto
            WHERE LOWER(nombre) = LOWER($1)
            AND id <> $2
            `,
      [nombre, id],
    );

    if (nombreExistente.rows.length > 0) {
      return res.status(409).json({
        mensaje: "Ya existe otra categoría con ese nombre",
      });
    }

    const resultado = await pool.query(
      `
            UPDATE categorias_repuesto
            SET nombre = $1
            WHERE id = $2
            RETURNING id, nombre, activo, creado_en
            `,
      [nombre, id],
    );

    return res.status(200).json({
      mensaje: "Categoría actualizada correctamente",
      categoria: resultado.rows[0],
    });
  } catch (error) {
    console.error("Error al actualizar categoría:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};

export const cambiarEstadoCategoria = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    if (typeof activo !== "boolean") {
      return res.status(400).json({
        mensaje: "El campo activo debe ser true o false",
      });
    }

    const categoriaExistente = await pool.query(
      `
            SELECT id
            FROM categorias_repuesto
            WHERE id = $1
            `,
      [id],
    );

    if (categoriaExistente.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Categoría no encontrada",
      });
    }

    const resultado = await pool.query(
      `
            UPDATE categorias_repuesto
            SET activo = $1
            WHERE id = $2
            RETURNING id, nombre, activo, creado_en
            `,
      [activo, id],
    );

    return res.status(200).json({
      mensaje: activo
        ? "Categoría activada correctamente"
        : "Categoría desactivada correctamente",
      categoria: resultado.rows[0],
    });
  } catch (error) {
    console.error("Error al cambiar estado de categoría:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};
