import bcrypt from "bcryptjs";
import { pool } from "../config/database";
import { env } from "../config/env";

async function crearAdministrador() {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    throw new Error(
      "Defina ADMIN_EMAIL y ADMIN_PASSWORD (mínimo 8 caracteres) en el entorno",
    );
  }

  const rol = await pool.query(
    "SELECT id FROM roles WHERE nombre = 'administrador'",
  );
  if (rol.rows.length === 0) {
    throw new Error(
      "No existe el rol administrador. Ejecute database/seed.sql",
    );
  }

  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
  const resultado = await pool.query(
    `INSERT INTO usuarios
       (rol_id, nombres, apellidos, email, password_hash, activo)
     VALUES ($1, $2, $3, LOWER($4), $5, true)
     ON CONFLICT (email) DO UPDATE SET
       nombres = EXCLUDED.nombres,
       apellidos = EXCLUDED.apellidos,
       password_hash = EXCLUDED.password_hash,
       rol_id = EXCLUDED.rol_id,
       activo = true
     RETURNING id, nombres, apellidos, email, activo`,
    [
      rol.rows[0].id,
      env.ADMIN_NOMBRES,
      env.ADMIN_APELLIDOS,
      env.ADMIN_EMAIL,
      passwordHash,
    ],
  );

  console.log(`Administrador listo: ${resultado.rows[0].email}`);
}

crearAdministrador()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
