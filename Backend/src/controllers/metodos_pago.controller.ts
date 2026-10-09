import { Response } from "express";
import { pool } from "../config/database";
import { AuthRequest } from "../middleware/auth.middleware";

export const obtenerMetodosPago = async (req: AuthRequest, res: Response) => {
  try {
    const resultado = await pool.query(
      `
      SELECT
        id,
        nombre,
        activo,
        creado_en
      FROM metodos_pago
      WHERE activo = true
      ORDER BY id
      `,
    );

    return res.status(200).json({
      cantidad: resultado.rows.length,
      metodos_pago: resultado.rows,
    });
  } catch (error) {
    console.error("Error al obtener los métodos de pago:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};
