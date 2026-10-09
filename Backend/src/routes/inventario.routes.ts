import { Router } from "express";

import {
  obtenerInventario,
  obtenerInventarioBajo,
  obtenerMovimientosInventario,
  obtenerMovimientosPorOrden,
  obtenerMovimientosPorRepuesto,
  registrarEntradaInventario,
} from "../controllers/inventario.controller";

import { verificarToken } from "../middleware/auth.middleware";
import { permitirRoles } from "../middleware/role.middleware";

const router = Router();

// =====================================================
// INVENTARIO
// =====================================================

router.get(
  "/",
  verificarToken,
  permitirRoles("administrador", "recepcionista", "mecanico"),
  obtenerInventario,
);

// =====================================================
// STOCK BAJO
// =====================================================

router.get(
  "/bajo-stock",
  verificarToken,
  permitirRoles("administrador", "recepcionista", "mecanico"),
  obtenerInventarioBajo,
);

// =====================================================
// MOVIMIENTOS
// =====================================================

router.get(
  "/movimientos",
  verificarToken,
  permitirRoles("administrador", "recepcionista", "mecanico"),
  obtenerMovimientosInventario,
);

// =====================================================
// MOVIMIENTOS DE UNA ORDEN
// =====================================================

router.get(
  "/movimientos/orden/:ordenId",
  verificarToken,
  permitirRoles("administrador", "recepcionista", "mecanico"),
  obtenerMovimientosPorOrden,
);

// =====================================================
// MOVIMIENTOS DE UN REPUESTO
// =====================================================

router.get(
  "/movimientos/repuesto/:repuestoId",
  verificarToken,
  permitirRoles("administrador", "recepcionista", "mecanico"),
  obtenerMovimientosPorRepuesto,
);

// =====================================================
// REGISTRAR ENTRADA DE INVENTARIO
// =====================================================

router.post(
  "/entrada",
  verificarToken,
  permitirRoles("administrador", "recepcionista"),
  registrarEntradaInventario,
);

export default router;
