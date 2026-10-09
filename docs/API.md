# API del taller mecánico

Base local: `http://localhost:3000/api`. Salvo el login, las rutas requieren `Authorization: Bearer <token>`.

## Autenticación

| Método | Ruta             | Uso                                  |
| ------ | ---------------- | ------------------------------------ |
| POST   | `/auth/login`    | Iniciar sesión                       |
| GET    | `/auth/me`       | Validar y recuperar la sesión actual |
| PATCH  | `/auth/password` | Cambiar la contraseña propia         |

## Administración y catálogos

| Recurso                       | Operaciones                                                   | Roles                                               |
| ----------------------------- | ------------------------------------------------------------- | --------------------------------------------------- |
| `/usuarios`                   | Crear, listar, obtener, editar, activar/desactivar y eliminar | administrador                                       |
| `/usuarios/mecanicos/activos` | Listar mecánicos disponibles                                  | administrador, recepcionista, mecánico              |
| `/clientes`                   | Crear, listar, obtener, editar y activar/desactivar           | administrador, recepcionista; lectura para mecánico |
| `/clientes/:id/acceso`        | Crear la cuenta de portal de un cliente                       | administrador, recepcionista                        |
| `/vehiculos`                  | Crear, listar, editar y activar/desactivar                    | administrador, recepcionista; lectura para mecánico |
| `/servicios`                  | CRUD lógico del catálogo                                      | administrador, recepcionista; lectura para mecánico |
| `/categorias_repuesto`        | CRUD lógico de categorías                                     | administrador, recepcionista; lectura para mecánico |
| `/repuestos`                  | CRUD lógico del catálogo                                      | administrador, recepcionista; lectura para mecánico |

## Órdenes

| Método   | Ruta                                        | Uso                                                                                                |
| -------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| GET/POST | `/ordenes_trabajo`                          | Listar o crear órdenes                                                                             |
| GET      | `/ordenes_trabajo/mis-ordenes`              | Órdenes del mecánico autenticado                                                                   |
| GET      | `/ordenes_trabajo/:id/detalle`              | Detalle consolidado                                                                                |
| PATCH    | `/ordenes_trabajo/:id/mecanico`             | Asignar mecánico                                                                                   |
| PATCH    | `/ordenes_trabajo/:id/diagnostico`          | Registrar diagnóstico                                                                              |
| PATCH    | `/ordenes_trabajo/:id/estado`               | Avanzar o cancelar la orden; el recepcionista puede ejecutar cualquier transición válida del flujo |
| POST/GET | `/ordenes_trabajo/:id/servicios`            | Agregar o listar servicios                                                                         |
| DELETE   | `/ordenes_trabajo/:id/servicios/:detalleId` | Retirar un servicio                                                                                |
| POST/GET | `/ordenes_trabajo/:id/repuestos`            | Agregar o listar repuestos                                                                         |
| DELETE   | `/ordenes_trabajo/:id/repuestos/:detalleId` | Retirar y devolver un repuesto al stock                                                            |
| PATCH    | `/ordenes_trabajo/:id/total`                | Recalcular el total                                                                                |
| GET      | `/ordenes_trabajo/:id/historial`            | Historial de estados                                                                               |

## Inventario y pagos

| Método   | Ruta                      | Uso                                      |
| -------- | ------------------------- | ---------------------------------------- |
| GET      | `/inventario`             | Existencias                              |
| GET      | `/inventario/bajo-stock`  | Alertas de stock                         |
| GET      | `/inventario/movimientos` | Kardex completo                          |
| POST     | `/inventario/entrada`     | Entrada manual; solo administrador       |
| GET      | `/pagos`                  | Historial general                        |
| POST/GET | `/pagos/orden/:id`        | Registrar o consultar pagos de una orden |
| GET      | `/metodos-pago`           | Métodos activos                          |

## Portal del cliente

- `GET /clientes/mis-datos`
- `GET /clientes/mis-vehiculos`
- `GET /clientes/mis-ordenes`
- `GET /clientes/mis-ordenes/:id`
- `GET /clientes/mis-pagos`

Los endpoints del portal resuelven el cliente desde el usuario autenticado y no aceptan un identificador de otro cliente.
