import { Router } from "express";
import {
  login,
  obtenerSesion,
  cambiarPassword,
  actualizarPerfil,
} from "../controllers/auth.controller";
import { verificarToken } from "../middleware/auth.middleware";

const router = Router();
router.post("/login", login);
router.get("/me", verificarToken, obtenerSesion);
router.patch("/me", verificarToken, actualizarPerfil);
router.patch("/password", verificarToken, cambiarPassword);
export default router;
