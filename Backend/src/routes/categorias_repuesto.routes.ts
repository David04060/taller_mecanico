import { Router } from "express";

import {
  crearCategoria,
  obtenerCategorias,
  obtenerCategoriaPorId,
  actualizarCategoria,
  cambiarEstadoCategoria,
} from "../controllers/categorias_repuesto.controller";

import { verificarToken } from "../middleware/auth.middleware";
import { permitirRoles } from "../middleware/role.middleware";

const router = Router();

router.post(
  "/",
  verificarToken,
  permitirRoles("administrador", "recepcionista"),
  crearCategoria,
);

router.get(
  "/",
  verificarToken,
  permitirRoles("administrador", "recepcionista", "mecanico"),
  obtenerCategorias,
);

router.get(
  "/:id",
  verificarToken,
  permitirRoles("administrador", "recepcionista", "mecanico"),
  obtenerCategoriaPorId,
);

router.put(
  "/:id",
  verificarToken,
  permitirRoles("administrador", "recepcionista"),
  actualizarCategoria,
);

router.patch(
  "/:id/estado",
  verificarToken,
  permitirRoles("administrador", "recepcionista"),
  cambiarEstadoCategoria,
);

export default router;
