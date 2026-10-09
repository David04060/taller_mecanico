import { Router } from "express";

import {
  crearServicio,
  obtenerServicios,
  obtenerServicioPorId,
  actualizarServicio,
  cambiarEstadoServicio,
} from "../controllers/servicios.controller";

import { verificarToken } from "../middleware/auth.middleware";
import { permitirRoles } from "../middleware/role.middleware";

const router = Router();

// Crear servicio
router.post(
  "/",
  verificarToken,
  permitirRoles("administrador", "recepcionista"),
  crearServicio,
);

// Obtener todos
router.get(
  "/",
  verificarToken,
  permitirRoles("administrador", "recepcionista", "mecanico"),
  obtenerServicios,
);

// Obtener por ID
router.get(
  "/:id",
  verificarToken,
  permitirRoles("administrador", "recepcionista", "mecanico"),
  obtenerServicioPorId,
);

// Actualizar
router.put(
  "/:id",
  verificarToken,
  permitirRoles("administrador", "recepcionista"),
  actualizarServicio,
);

// Activar / desactivar
router.patch(
  "/:id/estado",
  verificarToken,
  permitirRoles("administrador", "recepcionista"),
  cambiarEstadoServicio,
);

export default router;
