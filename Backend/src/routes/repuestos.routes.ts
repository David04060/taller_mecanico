import { Router } from "express";

import {
  crearRepuesto,
  obtenerRepuestos,
  obtenerRepuestoPorId,
  actualizarRepuesto,
  cambiarEstadoRepuesto,
} from "../controllers/repuestos.controller";

import { verificarToken } from "../middleware/auth.middleware";
import { permitirRoles } from "../middleware/role.middleware";

const router = Router();

router.post(
  "/",
  verificarToken,
  permitirRoles("administrador", "recepcionista"),
  crearRepuesto,
);

router.get(
  "/",
  verificarToken,
  permitirRoles("administrador", "recepcionista", "mecanico"),
  obtenerRepuestos,
);

router.get(
  "/:id",
  verificarToken,
  permitirRoles("administrador", "recepcionista", "mecanico"),
  obtenerRepuestoPorId,
);

router.put(
  "/:id",
  verificarToken,
  permitirRoles("administrador", "recepcionista"),
  actualizarRepuesto,
);

router.patch(
  "/:id/estado",
  verificarToken,
  permitirRoles("administrador", "recepcionista"),
  cambiarEstadoRepuesto,
);

export default router;
