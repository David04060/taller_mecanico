import "dotenv/config";
import { z } from "zod";

// Definimos qué variables necesita el sistema y de qué tipo son.
const esquema = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL es obligatoria"),
  DATABASE_SSL: z
    .enum(["true", "false"])
    .default("false")
    .transform((valor) => valor === "true"),
  JWT_SECRET: z.string().min(8, "JWT_SECRET debe tener al menos 8 caracteres"),
  JWT_EXPIRES_IN: z.string().default("8h"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),
  ADMIN_NOMBRES: z.string().default("Administrador"),
  ADMIN_APELLIDOS: z.string().default("Principal"),
});

const resultado = esquema.safeParse(process.env);

// Si falta algo, el servidor NO arranca y te dice qué falta.
if (!resultado.success) {
  console.error("Variables de entorno inválidas:");
  for (const problema of resultado.error.issues) {
    console.error(` - ${problema.path.join(".")}: ${problema.message}`);
  }
  process.exit(1);
}

export const env = resultado.data;
