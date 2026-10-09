import { Request, Response } from "express";
import { pool } from "../config/database";

export const crearRepuesto = async (req: Request, res: Response) => {
  try {
    const {
      categoria_id,
      codigo,
      nombre,
      stock_minimo,
      precio_compra,
      precio_venta,
    } = req.body;

    if (
      !categoria_id ||
      !codigo ||
      !nombre ||
      stock_minimo === undefined ||
      precio_compra === undefined ||
      precio_venta === undefined
    ) {
      return res.status(400).json({
        mensaje: "Todos los campos obligatorios deben ser enviados",
      });
    }

    if (typeof stock_minimo !== "number" || stock_minimo < 0) {
      return res.status(400).json({
        mensaje: "El stock mínimo debe ser un número mayor o igual a 0",
      });
    }

    if (typeof precio_compra !== "number" || precio_compra < 0) {
      return res.status(400).json({
        mensaje: "El precio de compra debe ser un número mayor o igual a 0",
      });
    }

    if (typeof precio_venta !== "number" || precio_venta < 0) {
      return res.status(400).json({
        mensaje: "El precio de venta debe ser un número mayor o igual a 0",
      });
    }

    // Verificar categoría
    const categoria = await pool.query(
      `
            SELECT id
            FROM categorias_repuesto
            WHERE id = $1
            AND activo = true
            `,
      [categoria_id],
    );

    if (categoria.rows.length === 0) {
      return res.status(400).json({
        mensaje: "La categoría no existe o está inactiva",
      });
    }

    // Verificar código duplicado
    const codigoExistente = await pool.query(
      `
            SELECT id
            FROM repuestos
            WHERE LOWER(codigo) = LOWER($1)
            `,
      [codigo],
    );

    if (codigoExistente.rows.length > 0) {
      return res.status(409).json({
        mensaje: "El código del repuesto ya está registrado",
      });
    }

    const resultado = await pool.query(
      `
            INSERT INTO repuestos
                (
                    categoria_id,
                    codigo,
                    nombre,
                    stock_actual,
                    stock_minimo,
                    precio_compra,
                    precio_venta,
                    activo
                )
            VALUES
                ($1, $2, $3, 0, $4, $5, $6, true)
            RETURNING
                id,
                categoria_id,
                codigo,
                nombre,
                stock_actual,
                stock_minimo,
                precio_compra,
                precio_venta,
                activo,
                creado_en,
                actualizado_en
            `,
      [categoria_id, codigo, nombre, stock_minimo, precio_compra, precio_venta],
    );

    return res.status(201).json({
      mensaje: "Repuesto creado correctamente",
      repuesto: resultado.rows[0],
    });
  } catch (error) {
    console.error("Error al crear repuesto:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};

export const obtenerRepuestos = async (req: Request, res: Response) => {
  try {
    const resultado = await pool.query(
      `
            SELECT
                r.id,
                r.categoria_id,
                c.nombre AS categoria,
                r.codigo,
                r.nombre,
                r.stock_actual,
                r.stock_minimo,
                r.precio_compra,
                r.precio_venta,
                r.activo,
                r.creado_en,
                r.actualizado_en
            FROM repuestos r
            INNER JOIN categorias_repuesto c
                ON r.categoria_id = c.id
            ORDER BY r.id ASC
            `,
    );

    return res.status(200).json({
      repuestos: resultado.rows,
    });
  } catch (error) {
    console.error("Error al obtener repuestos:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};

export const obtenerRepuestoPorId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const resultado = await pool.query(
      `
            SELECT
                r.id,
                r.categoria_id,
                c.nombre AS categoria,
                r.codigo,
                r.nombre,
                r.stock_actual,
                r.stock_minimo,
                r.precio_compra,
                r.precio_venta,
                r.activo,
                r.creado_en,
                r.actualizado_en
            FROM repuestos r
            INNER JOIN categorias_repuesto c
                ON r.categoria_id = c.id
            WHERE r.id = $1
            `,
      [id],
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Repuesto no encontrado",
      });
    }

    return res.status(200).json({
      repuesto: resultado.rows[0],
    });
  } catch (error) {
    console.error("Error al obtener repuesto:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};

export const actualizarRepuesto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const {
      categoria_id,
      codigo,
      nombre,
      stock_minimo,
      precio_compra,
      precio_venta,
    } = req.body;

    if (
      !categoria_id ||
      !codigo ||
      !nombre ||
      stock_minimo === undefined ||
      precio_compra === undefined ||
      precio_venta === undefined
    ) {
      return res.status(400).json({
        mensaje: "Todos los campos obligatorios deben ser enviados",
      });
    }

    if (typeof stock_minimo !== "number" || stock_minimo < 0) {
      return res.status(400).json({
        mensaje: "El stock mínimo debe ser un número mayor o igual a 0",
      });
    }

    if (typeof precio_compra !== "number" || precio_compra < 0) {
      return res.status(400).json({
        mensaje: "El precio de compra debe ser un número mayor o igual a 0",
      });
    }

    if (typeof precio_venta !== "number" || precio_venta < 0) {
      return res.status(400).json({
        mensaje: "El precio de venta debe ser un número mayor o igual a 0",
      });
    }

    // Verificar que exista el repuesto
    const repuestoExistente = await pool.query(
      `
            SELECT id
            FROM repuestos
            WHERE id = $1
            `,
      [id],
    );

    if (repuestoExistente.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Repuesto no encontrado",
      });
    }

    // Verificar categoría
    const categoria = await pool.query(
      `
            SELECT id
            FROM categorias_repuesto
            WHERE id = $1
            AND activo = true
            `,
      [categoria_id],
    );

    if (categoria.rows.length === 0) {
      return res.status(400).json({
        mensaje: "La categoría no existe o está inactiva",
      });
    }

    // Verificar código duplicado
    const codigoExistente = await pool.query(
      `
            SELECT id
            FROM repuestos
            WHERE LOWER(codigo) = LOWER($1)
            AND id <> $2
            `,
      [codigo, id],
    );

    if (codigoExistente.rows.length > 0) {
      return res.status(409).json({
        mensaje: "Ya existe otro repuesto con ese código",
      });
    }

    const resultado = await pool.query(
      `
            UPDATE repuestos
            SET
                categoria_id = $1,
                codigo = $2,
                nombre = $3,
                stock_minimo = $4,
                precio_compra = $5,
                precio_venta = $6,
                actualizado_en = now()
            WHERE id = $7
            RETURNING
                id,
                categoria_id,
                codigo,
                nombre,
                stock_actual,
                stock_minimo,
                precio_compra,
                precio_venta,
                activo,
                creado_en,
                actualizado_en
            `,
      [
        categoria_id,
        codigo,
        nombre,
        stock_minimo,
        precio_compra,
        precio_venta,
        id,
      ],
    );

    return res.status(200).json({
      mensaje: "Repuesto actualizado correctamente",
      repuesto: resultado.rows[0],
    });
  } catch (error) {
    console.error("Error al actualizar repuesto:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};

export const cambiarEstadoRepuesto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    if (typeof activo !== "boolean") {
      return res.status(400).json({
        mensaje: "El campo activo debe ser true o false",
      });
    }

    const repuestoExistente = await pool.query(
      `
            SELECT id
            FROM repuestos
            WHERE id = $1
            `,
      [id],
    );

    if (repuestoExistente.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Repuesto no encontrado",
      });
    }

    const resultado = await pool.query(
      `
            UPDATE repuestos
            SET
                activo = $1,
                actualizado_en = now()
            WHERE id = $2
            RETURNING
                id,
                categoria_id,
                codigo,
                nombre,
                stock_actual,
                stock_minimo,
                precio_compra,
                precio_venta,
                activo,
                creado_en,
                actualizado_en
            `,
      [activo, id],
    );

    return res.status(200).json({
      mensaje: activo
        ? "Repuesto activado correctamente"
        : "Repuesto desactivado correctamente",
      repuesto: resultado.rows[0],
    });
  } catch (error) {
    console.error("Error al cambiar estado del repuesto:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};
