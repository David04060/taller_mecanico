import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { pool } from "../config/database";
import { env } from "../config/env";
import { AuthRequest } from "../middleware/auth.middleware";
import { z } from "zod";

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
              u.activo, r.nombre AS rol, c.dni, c.direccion
       FROM usuarios u
       INNER JOIN roles r ON r.id = u.rol_id
       LEFT JOIN clientes c ON c.usuario_id = u.id AND c.activo = true AND r.nombre = 'cliente'
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

const datosPerfil = z.object({
  nombres: z.string().trim().min(1).max(80),
  apellidos: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(120),
  telefono: z.string().trim().max(20).nullable().optional(),
  direccion: z.string().trim().max(200).nullable().optional(),
}).strict();

/** La identidad proviene exclusivamente del middleware; no admite IDs ni privilegios del body. */
export const actualizarPerfil = async (req: AuthRequest, res: Response) => {
  const validacion = datosPerfil.safeParse(req.body);
  if (!validacion.success) {
    return res.status(400).json({
       mensaje: "Revise los datos del perfil. Solo se admiten nombres, apellidos, correo, teléfono y dirección de cliente." });
  }
  const datos = validacion.data;
  let conexion;
  try {
    conexion = await pool.connect();
    await conexion.query("BEGIN");
    const cuenta = await conexion.query(
      `SELECT u.id, u.telefono, r.nombre AS rol FROM usuarios u
       INNER JOIN roles r ON r.id = u.rol_id
       WHERE u.id = $1 AND u.activo = true FOR UPDATE OF u`,
      [req.usuario!.id],
    );
    if (!cuenta.rows.length) {
      await conexion.query("ROLLBACK");
      return res.status(401).json({ mensaje: "La cuenta ya no está activa" });
    }
    const rol = cuenta.rows[0].rol;
    if (rol !== "cliente" && datos.direccion !== undefined) {
      await conexion.query("ROLLBACK");
      return res.status(400).json({ mensaje: "La dirección corresponde únicamente al perfil de cliente" });
    }
    let ficha;
    if (rol === "cliente") {
      const cliente = await conexion.query(
        "SELECT id, dni, direccion FROM clientes WHERE usuario_id = $1 AND activo = true FOR UPDATE",
        [req.usuario!.id],
      );
      if (!cliente.rows.length) {
        await conexion.query("ROLLBACK");
        return res.status(404).json({ mensaje: "No se encontró una ficha de cliente activa para esta cuenta" });
      }
      ficha = cliente.rows[0];
    }
    const repetido = await conexion.query(
      "SELECT id FROM usuarios WHERE LOWER(email) = LOWER($1) AND id <> $2",
      [datos.email, req.usuario!.id],
    );
    if (repetido.rows.length) {
      await conexion.query("ROLLBACK");
      return res.status(409).json({ mensaje: "Este correo ya está registrado en otra cuenta" });
    }
    const telefono = datos.telefono === undefined ? cuenta.rows[0].telefono : datos.telefono || null;
    const resultado = await conexion.query(
      `UPDATE usuarios SET nombres = $1, apellidos = $2, email = $3, telefono = $4
       WHERE id = $5 RETURNING id, nombres, apellidos, email, telefono`,
      [datos.nombres, datos.apellidos, datos.email, telefono, req.usuario!.id],
    );
    if (ficha) {
      const direccion = datos.direccion === undefined ? ficha.direccion : datos.direccion || null;
      const sincronizado = await conexion.query(
        `UPDATE clientes SET nombres = $1, apellidos = $2, email = $3, telefono = $4, direccion = $5
         WHERE usuario_id = $6 AND activo = true RETURNING dni, direccion`,
        [datos.nombres, datos.apellidos, datos.email, telefono, direccion, req.usuario!.id],
      );
      ficha = sincronizado.rows[0];
    }
    await conexion.query("COMMIT");
    return res.json({
      mensaje: "Sus datos se actualizaron correctamente",
      usuario: { ...resultado.rows[0], rol, dni: ficha?.dni ?? null, direccion: ficha?.direccion ?? null },
    });
  } catch (error) {
    if (conexion) await conexion.query("ROLLBACK");
    if ((error as { code?: string }).code === "23505") {
      return res.status(409).json({ mensaje: "Este correo ya está registrado en otra cuenta" });
    }
    console.error("Error al actualizar el perfil:", error);
    return res.status(500).json({ mensaje: "No se pudieron guardar sus datos. Inténtelo nuevamente." });
  } finally {
    conexion?.release();
  }
};
