import { Router } from "express";
import {
  crearUsuario,
  listarUsuarios,
  obtenerUsuario,
  actualizarUsuario,
  cambiarEstadoUsuario,
  eliminarUsuario,
} from "../controllers/usuarios.controller";
import { listarMecanicosActivos } from "../controllers/usuarios.controller";
import { verificarToken } from "../middleware/auth.middleware";
import { permitirRoles } from "../middleware/role.middleware";

const router = Router();

router.get(
  "/mecanicos/activos",
  verificarToken,
  permitirRoles("administrador", "recepcionista", "mecanico"),
  listarMecanicosActivos,
);

// ============================================
// TODAS LAS RUTAS DE USUARIOS
// SOLO ADMINISTRADOR
// ============================================
router.use(verificarToken, permitirRoles("administrador"));

// Crear usuario
router.post("/", crearUsuario);

// Listar usuarios
router.get("/", listarUsuarios);

// Obtener usuario por ID
router.get("/:id", obtenerUsuario);

// Actualizar usuario
router.put("/:id", actualizarUsuario);

// Activar / desactivar usuario
router.patch("/:id/estado", cambiarEstadoUsuario);

// Eliminar usuario
router.delete("/:id", eliminarUsuario);

export default router;
