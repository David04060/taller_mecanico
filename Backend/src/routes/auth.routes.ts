import { Router } from "express";
import {
  login,
  obtenerSesion,
  cambiarPassword,
} from "../controllers/auth.controller";
import { verificarToken } from "../middleware/auth.middleware";

const router = Router();
router.post("/login", login);
router.get("/me", verificarToken, obtenerSesion);
router.patch("/password", verificarToken, cambiarPassword);
export default router;
