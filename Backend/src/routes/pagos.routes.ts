import { Router } from "express";

import {
  registrarPago,
  obtenerPagosOrden,
  obtenerPagos,
} from "../controllers/pagos.controller";

import { verificarToken } from "../middleware/auth.middleware";
import { permitirRoles } from "../middleware/role.middleware";

const router = Router();

router.get(
  "/",
  verificarToken,
  permitirRoles("administrador", "recepcionista"),
  obtenerPagos,
);

router.post(
  "/orden/:id",
  verificarToken,
  permitirRoles("administrador", "recepcionista"),
  registrarPago,
);

router.get(
  "/orden/:id",
  verificarToken,
  permitirRoles("administrador", "recepcionista", "mecanico"),
  obtenerPagosOrden,
);

export default router;
