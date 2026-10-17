import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { pool } from "../config/database";

export interface AuthRequest extends Request {
  usuario?: {
    id: number;
    email: string;
    rol: string;
  };
}

export const verificarToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      return res.status(401).json({
        mensaje: "No se proporcionó un token",
      });
    }

    const partes = authorization.split(" ");

    if (partes.length !== 2 || partes[0] !== "Bearer") {
      return res.status(401).json({
        mensaje: "Formato de token inválido",
      });
    }

    const token = partes[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: number;
      email: string;
      rol: string;
    };

    const resultado = await pool.query(
      `SELECT u.id, u.email, r.nombre AS rol
             FROM usuarios u
             INNER JOIN roles r ON r.id = u.rol_id
             WHERE u.id = $1 AND u.activo = true`,
      [decoded.id],
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({
        mensaje: "La cuenta ya no está activa",
      });
    }

    req.usuario = resultado.rows[0];

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError || error instanceof jwt.NotBeforeError) {
      return res.status(401).json({ mensaje: "Token inválido o expirado" });
    }
    return res.status(503).json({ mensaje: "No se pudo verificar la sesión. Inténtalo nuevamente." });
  }
};
