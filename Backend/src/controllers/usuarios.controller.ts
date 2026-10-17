import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import bcrypt from "bcryptjs";
import { pool } from "../config/database";

/*
====================================================
CREAR USUARIO
====================================================
*/
export const crearUsuario = async (req: Request, res: Response) => {
  try {
    const { nombres, apellidos, email, telefono, password, rol } = req.body;

    if (!nombres || !apellidos || !email || !telefono || !password || !rol) {
      return res.status(400).json({
        mensaje: "Todos los campos son obligatorios",
      });
    }

    if (typeof password !== "string" || password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({ mensaje: "La contraseña debe tener al menos 8 caracteres y no superar 72 bytes" });
    }
    // Solo se pueden crear recepcionistas y mecánicos
    if (!["recepcionista", "mecanico"].includes(rol)) {
      return res.status(400).json({
        mensaje: "Solo se pueden crear usuarios recepcionistas o mecánicos",
      });
    }

    // Verificar correo
    const usuarioExistente = await pool.query(
      `
            SELECT id
            FROM usuarios
            WHERE email = $1
            `,
      [email],
    );

    if (usuarioExistente.rows.length > 0) {
      return res.status(409).json({
        mensaje: "El correo ya está registrado",
      });
    }

    // Buscar rol
    const resultadoRol = await pool.query(
      `
            SELECT id
            FROM roles
            WHERE nombre = $1
            `,
      [rol],
    );

    if (resultadoRol.rows.length === 0) {
      return res.status(400).json({
        mensaje: "El rol no existe",
      });
    }

    const rolId = resultadoRol.rows[0].id;

    // Encriptar contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear usuario
    const resultado = await pool.query(
      `
            INSERT INTO usuarios
                (
                    nombres,
                    apellidos,
                    email,
                    telefono,
                    password_hash,
                    rol_id,
                    activo
                )
            VALUES
                ($1, $2, $3, $4, $5, $6, true)
            RETURNING
                id,
                nombres,
                apellidos,
                email,
                telefono,
                rol_id,
                activo
            `,
      [nombres, apellidos, email, telefono, passwordHash, rolId],
    );

    return res.status(201).json({
      mensaje: "Usuario creado correctamente",
      usuario: resultado.rows[0],
    });
  } catch (error) {
    console.error("Error al crear usuario:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};

/*
====================================================
LISTAR USUARIOS
====================================================
*/
export const listarUsuarios = async (req: Request, res: Response) => {
  try {
    const resultado = await pool.query(
      `
            SELECT
                u.id,
                u.nombres,
                u.apellidos,
                u.email,
                u.telefono,
                u.activo,
                u.creado_en,
                u.actualizado_en,
                r.id AS rol_id,
                r.nombre AS rol
            FROM usuarios u
            INNER JOIN roles r
                ON u.rol_id = r.id
            ORDER BY u.id ASC
            `,
    );

    return res.status(200).json({
      usuarios: resultado.rows,
    });
  } catch (error) {
    console.error("Error al listar usuarios:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};

/*
====================================================
OBTENER USUARIO POR ID
====================================================
*/
export const obtenerUsuario = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const resultado = await pool.query(
      `
            SELECT
                u.id,
                u.nombres,
                u.apellidos,
                u.email,
                u.telefono,
                u.activo,
                u.creado_en,
                u.actualizado_en,
                r.id AS rol_id,
                r.nombre AS rol
            FROM usuarios u
            INNER JOIN roles r
                ON u.rol_id = r.id
            WHERE u.id = $1
            `,
      [id],
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado",
      });
    }

    return res.status(200).json({
      usuario: resultado.rows[0],
    });
  } catch (error) {
    console.error("Error al obtener usuario:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};

/*
====================================================
ACTUALIZAR USUARIO
====================================================
*/
export const actualizarUsuario = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { nombres, apellidos, email, telefono, rol } = req.body;

    if (!nombres || !apellidos || !email || !telefono || !rol) {
      return res.status(400).json({
        mensaje: "Todos los campos son obligatorios",
      });
    }

    // Solo puede cambiarse a estos roles
    if (!["recepcionista", "mecanico"].includes(rol)) {
      return res.status(400).json({
        mensaje: "El usuario debe tener rol de recepcionista o mecánico",
      });
    }

    // Verificar que el usuario exista
    const usuario = await pool.query(
      `
            SELECT u.id, r.nombre AS rol
            FROM usuarios u JOIN roles r ON r.id=u.rol_id
            WHERE u.id = $1
            `,
      [id],
    );

    if (usuario.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado",
      });
    }

    if (usuario.rows[0].rol === "administrador" || usuario.rows[0].rol === "cliente")
      return res.status(400).json({ mensaje: "Esta pantalla solo permite editar personal de recepción y mecánica" });

    // Verificar que el email no pertenezca a otro usuario
    const emailExistente = await pool.query(
      `
            SELECT u.id, r.nombre AS rol
            FROM usuarios u JOIN roles r ON r.id=u.rol_id
            WHERE email = $1
            AND u.id <> $2
            LIMIT 1
            `,
      [email, id],
    );

    if (emailExistente.rows.length > 0) {
      return res.status(409).json({
        mensaje: "El correo ya está registrado por otro usuario",
      });
    }

    // Buscar rol
    const resultadoRol = await pool.query(
      `
            SELECT id
            FROM roles
            WHERE nombre = $1
            `,
      [rol],
    );

    if (resultadoRol.rows.length === 0) {
      return res.status(400).json({
        mensaje: "El rol no existe",
      });
    }

    const rolId = resultadoRol.rows[0].id;

    // Actualizar
    const resultado = await pool.query(
      `
            UPDATE usuarios
            SET
                nombres = $1,
                apellidos = $2,
                email = $3,
                telefono = $4,
                rol_id = $5,
                actualizado_en = CURRENT_TIMESTAMP
            WHERE id = $6
            RETURNING
                id,
                nombres,
                apellidos,
                email,
                telefono,
                rol_id,
                activo,
                actualizado_en
            `,
      [nombres, apellidos, email, telefono, rolId, id],
    );

    return res.status(200).json({
      mensaje: "Usuario actualizado correctamente",
      usuario: resultado.rows[0],
    });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};

/*
====================================================
ACTIVAR / DESACTIVAR USUARIO
====================================================
*/
export const cambiarEstadoUsuario = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    if (typeof activo !== "boolean") {
      return res.status(400).json({
        mensaje: "El campo activo debe ser true o false",
      });
    }

    if (!activo && Number(id) === req.usuario?.id)
      return res.status(400).json({ mensaje: "No puedes desactivar tu propia cuenta" });

    const usuario = await pool.query(
      `
            SELECT id, activo
            FROM usuarios
            WHERE id = $1
            `,
      [id],
    );

    if (usuario.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado",
      });
    }

    const resultado = await pool.query(
      `
            UPDATE usuarios
            SET
                activo = $1,
                actualizado_en = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING
                id,
                nombres,
                apellidos,
                email,
                activo,
                actualizado_en
            `,
      [activo, id],
    );

    return res.status(200).json({
      mensaje: activo
        ? "Usuario activado correctamente"
        : "Usuario desactivado correctamente",
      usuario: resultado.rows[0],
    });
  } catch (error) {
    console.error("Error al cambiar estado:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};

/*
====================================================
ELIMINAR USUARIO
====================================================
*/
export const eliminarUsuario = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const usuario = await pool.query(
      `
            SELECT id, rol_id
            FROM usuarios
            WHERE id = $1
            `,
      [id],
    );

    if (usuario.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado",
      });
    }

    // No permitir eliminar administradores
    const rol = await pool.query(
      `
            SELECT nombre
            FROM roles
            WHERE id = $1
            `,
      [usuario.rows[0].rol_id],
    );

    if (rol.rows.length > 0 && rol.rows[0].nombre === "administrador") {
      return res.status(400).json({
        mensaje: "No se puede eliminar un administrador",
      });
    }

    await pool.query(
      `
            DELETE FROM usuarios
            WHERE id = $1
            `,
      [id],
    );

    return res.status(200).json({
      mensaje: "Usuario eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);

    return res.status(500).json({
      mensaje:
        "No se puede eliminar el usuario. Puede tener registros relacionados.",
    });
  }
};

export const listarMecanicosActivos = async (_req: Request, res: Response) => {
  try {
    const resultado = await pool.query(
      `SELECT u.id, u.nombres, u.apellidos, u.email, u.telefono,
                    u.activo, r.nombre AS rol
             FROM usuarios u
             INNER JOIN roles r ON r.id = u.rol_id
             WHERE r.nombre = 'mecanico' AND u.activo = true
             ORDER BY u.apellidos, u.nombres`,
    );
    return res.json({ usuarios: resultado.rows });
  } catch (error) {
    console.error("Error al listar mecánicos:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};
