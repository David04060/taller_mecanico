import { Router } from "express";
import { verificarToken } from "../middleware/auth.middleware";
import { permitirRoles } from "../middleware/role.middleware";
import { obtenerResumenDashboard } from "../controllers/dashboard.controller";

const router = Router();

router.get(
  "/resumen",
  verificarToken,
  permitirRoles("administrador", "recepcionista"),
  obtenerResumenDashboard,
);

export default router;
