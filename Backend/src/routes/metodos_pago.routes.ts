import { Router } from "express";
import { verificarToken } from "../middleware/auth.middleware";
import { permitirRoles } from "../middleware/role.middleware";
import { obtenerMetodosPago } from "../controllers/metodos_pago.controller";

const router = Router();

router.get(
  "/",
  verificarToken,
  permitirRoles("administrador", "recepcionista", "mecanico", "cliente"),
  obtenerMetodosPago,
);

export default router;
