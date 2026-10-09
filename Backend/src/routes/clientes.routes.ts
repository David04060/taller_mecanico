import { Router } from "express";

import {
  crearCliente,
  obtenerClientes,
  obtenerClientePorId,
  actualizarCliente,
  cambiarEstadoCliente,
  obtenerMisDatos,
  obtenerMisVehiculos,
  obtenerMisOrdenesCliente,
  obtenerDetalleMiOrden,
  obtenerMisPagos,
  crearAccesoCliente,
} from "../controllers/clientes.controller";

import { verificarToken } from "../middleware/auth.middleware";
import { permitirRoles } from "../middleware/role.middleware";

const router = Router();

// Crear cliente
router.post(
  "/",
  verificarToken,
  permitirRoles("administrador", "recepcionista"),
  crearCliente,
);

// Obtener todos los clientes
router.get(
  "/",
  verificarToken,
  permitirRoles("administrador", "recepcionista", "mecanico"),
  obtenerClientes,
);
router.get(
  "/mis-vehiculos",
  verificarToken,
  permitirRoles("cliente"),
  obtenerMisVehiculos,
);
router.get(
  "/mis-datos",
  verificarToken,
  permitirRoles("cliente"),
  obtenerMisDatos,
);
router.get(
  "/mis-ordenes",
  verificarToken,
  permitirRoles("cliente"),
  obtenerMisOrdenesCliente,
);
router.get(
  "/mis-ordenes/:id",
  verificarToken,
  permitirRoles("cliente"),
  obtenerDetalleMiOrden,
);
router.get(
  "/mis-pagos",
  verificarToken,
  permitirRoles("cliente"),
  obtenerMisPagos,
);

// Obtener cliente por ID
router.get(
  "/:id",
  verificarToken,
  permitirRoles("administrador", "recepcionista", "mecanico"),
  obtenerClientePorId,
);

// Actualizar cliente
router.put(
  "/:id",
  verificarToken,
  permitirRoles("administrador", "recepcionista"),
  actualizarCliente,
);

// Activar / desactivar cliente
router.patch(
  "/:id/estado",
  verificarToken,
  permitirRoles("administrador", "recepcionista"),
  cambiarEstadoCliente,
);

router.post(
  "/:id/acceso",
  verificarToken,
  permitirRoles("administrador", "recepcionista"),
  crearAccesoCliente,
);

export default router;
