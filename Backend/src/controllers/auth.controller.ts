import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { pool } from "../config/database";
import { env } from "../config/env";
import { AuthRequest } from "../middleware/auth.middleware";

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        mensaje: "El correo y la contraseña son obligatorios",
      });
    }

    const resultado = await pool.query(
      `
      SELECT
        u.id,
        u.nombres,
        u.apellidos,
        u.email,
        u.password_hash,
        u.activo,
        r.nombre AS rol
      FROM usuarios u
      INNER JOIN roles r
        ON u.rol_id = r.id
      WHERE u.email = $1
      `,
      [email],
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({
        mensaje: "Credenciales incorrectas",
      });
    }

    const usuario = resultado.rows[0];

    if (!usuario.activo) {
      return res.status(403).json({
        mensaje: "El usuario está desactivado",
      });
    }

    const passwordCorrecta = await bcrypt.compare(
      password,
      usuario.password_hash,
    );

    if (!passwordCorrecta) {
      return res.status(401).json({
        mensaje: "Credenciales incorrectas",
      });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
      },
      env.JWT_SECRET,
      {
        expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
      },
    );

    return res.status(200).json({
      mensaje: "Inicio de sesión exitoso",
      token,
      usuario: {
        id: usuario.id,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        email: usuario.email,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};

export const obtenerSesion = async (req: AuthRequest, res: Response) => {
  try {
    const resultado = await pool.query(
      `SELECT u.id, u.nombres, u.apellidos, u.email, u.telefono,
              u.activo, r.nombre AS rol
       FROM usuarios u
       INNER JOIN roles r ON r.id = u.rol_id
       WHERE u.id = $1`,
      [req.usuario!.id],
    );

    if (resultado.rows.length === 0 || !resultado.rows[0].activo) {
      return res.status(401).json({ mensaje: "Sesión no válida" });
    }

    return res.json({ usuario: resultado.rows[0] });
  } catch (error) {
    console.error("Error al obtener sesión:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

export const cambiarPassword = async (req: AuthRequest, res: Response) => {
  try {
    const { password_actual, password_nueva } = req.body;
    if (
      !password_actual ||
      !password_nueva ||
      String(password_nueva).length < 8
    ) {
      return res
        .status(400)
        .json({
          mensaje: "La contraseña nueva debe tener al menos 8 caracteres",
        });
    }
    const resultado = await pool.query(
      "SELECT password_hash FROM usuarios WHERE id = $1",
      [req.usuario!.id],
    );
    const coincide =
      resultado.rows.length &&
      (await bcrypt.compare(password_actual, resultado.rows[0].password_hash));
    if (!coincide)
      return res
        .status(400)
        .json({ mensaje: "La contraseña actual no es correcta" });
    const hash = await bcrypt.hash(password_nueva, 12);
    await pool.query("UPDATE usuarios SET password_hash = $1 WHERE id = $2", [
      hash,
      req.usuario!.id,
    ]);
    return res.json({ mensaje: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};
