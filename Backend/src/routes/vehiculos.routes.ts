import { Router } from "express";

import {
  crearVehiculo,
  obtenerVehiculos,
  obtenerVehiculoPorId,
  obtenerVehiculosPorCliente,
  actualizarVehiculo,
  cambiarEstadoVehiculo,
} from "../controllers/vehiculos.controller";

import { verificarToken } from "../middleware/auth.middleware";
import { permitirRoles } from "../middleware/role.middleware";

const router = Router();

// Crear vehículo
router.post(
  "/",
  verificarToken,
  permitirRoles("administrador", "recepcionista"),
  crearVehiculo,
);

// Obtener todos los vehículos
router.get(
  "/",
  verificarToken,
  permitirRoles("administrador", "recepcionista", "mecanico"),
  obtenerVehiculos,
);

// Obtener vehículos de un cliente
router.get(
  "/cliente/:clienteId",
  verificarToken,
  permitirRoles("administrador", "recepcionista", "mecanico"),
  obtenerVehiculosPorCliente,
);

// Obtener vehículo por ID
router.get(
  "/:id",
  verificarToken,
  permitirRoles("administrador", "recepcionista", "mecanico"),
  obtenerVehiculoPorId,
);

// Actualizar vehículo
router.put(
  "/:id",
  verificarToken,
  permitirRoles("administrador", "recepcionista"),
  actualizarVehiculo,
);

// Activar / desactivar vehículo
router.patch(
  "/:id/estado",
  verificarToken,
  permitirRoles("administrador", "recepcionista"),
  cambiarEstadoVehiculo,
);

export default router;
