import { Router } from "express";

import {
  crearOrden,
  obtenerOrdenes,
  actualizarOrden,
  cambiarEstadoOrden,
  registrarDiagnostico,
  agregarServicioOrden,
  obtenerServiciosOrden,
  agregarRepuestoOrden,
  obtenerRepuestosOrden,
  actualizarTotalOrden,
  obtenerHistorialOrden,
  obtenerDetalleCompletoOrden,
  asignarMecanico,
  obtenerMisOrdenes,
  obtenerOrdenPorId,
  eliminarServicioOrden,
  eliminarRepuestoOrden,
} from "../controllers/ordenes_trabajo.controller";

import { verificarToken } from "../middleware/auth.middleware";
import { permitirRoles } from "../middleware/role.middleware";

const router = Router();

router.post(
  "/",
  verificarToken,
  permitirRoles("administrador", "recepcionista"),
  crearOrden,
);

router.get(
  "/",
  verificarToken,
  permitirRoles("administrador", "recepcionista", "mecanico"),
  obtenerOrdenes,
);
router.get(
  "/mis-ordenes",
  verificarToken,
  permitirRoles("mecanico"),
  obtenerMisOrdenes,
);
router.get(
  "/:id",
  verificarToken,
  permitirRoles("administrador", "recepcionista", "mecanico"),
  obtenerOrdenPorId,
);
router.put(
  "/:id",
  verificarToken,
  permitirRoles("administrador", "recepcionista", "mecanico"),
  actualizarOrden,
);
router.patch(
  "/:id/mecanico",
  verificarToken,
  permitirRoles("administrador", "recepcionista"),
  asignarMecanico,
);
router.patch(
  "/:id/estado",
  verificarToken,
  permitirRoles("administrador", "recepcionista", "mecanico"),
  cambiarEstadoOrden,
);
router.patch(
  "/:id/diagnostico",
  verificarToken,
  permitirRoles("administrador", "mecanico"),
  registrarDiagnostico,
);
router.post(
  "/:id/servicios",
  verificarToken,
  permitirRoles("administrador", "recepcionista", "mecanico"),
  agregarServicioOrden,
);
router.get(
  "/:id/servicios",
  verificarToken,
  permitirRoles("administrador", "recepcionista", "mecanico"),
  obtenerServiciosOrden,
);
router.post(
  "/:id/repuestos",
  verificarToken,
  permitirRoles("administrador", "recepcionista", "mecanico"),
  agregarRepuestoOrden,
);
router.get(
  "/:id/repuestos",
  verificarToken,
  permitirRoles("administrador", "recepcionista", "mecanico"),
  obtenerRepuestosOrden,
);
router.patch(
  "/:id/total",
  verificarToken,
  permitirRoles("administrador", "recepcionista", "mecanico"),
  actualizarTotalOrden,
);
router.get(
  "/:id/historial",
  verificarToken,
  permitirRoles("administrador", "recepcionista", "mecanico"),
  obtenerHistorialOrden,
);
router.get(
  "/:id/detalle",
  verificarToken,
  permitirRoles("administrador", "recepcionista", "mecanico"),
  obtenerDetalleCompletoOrden,
);
router.delete(
  "/:id/servicios/:detalleId",
  verificarToken,
  permitirRoles("administrador", "recepcionista", "mecanico"),
  eliminarServicioOrden,
);
router.delete(
  "/:id/repuestos/:detalleId",
  verificarToken,
  permitirRoles("administrador", "recepcionista", "mecanico"),
  eliminarRepuestoOrden,
);
export default router;
