# API del taller mecánico

Base local: `http://localhost:3000/api`. Salvo el login, las rutas requieren `Authorization: Bearer <token>`.

## Autenticación

| Método | Ruta             | Uso                                  |
| ------ | ---------------- | ------------------------------------ |
| POST   | `/auth/login`    | Iniciar sesión                       |
| GET    | `/auth/me`       | Validar y recuperar la sesión actual |
| PATCH  | `/auth/me`       | Editar los datos personales propios  |
| PATCH  | `/auth/password` | Cambiar la contraseña propia         |

`PATCH /auth/me` está disponible para todos los roles autenticados. Recibe `nombres` y `apellidos` (1–80 caracteres), `email` válido (hasta 120), `telefono` opcional (hasta 20; vacío o null elimina el teléfono) y, exclusivamente para clientes, `direccion` opcional (hasta 200; vacío o null elimina la dirección). Los campos opcionales omitidos se conservan. Normaliza espacios y guarda el correo en minúsculas. El correo actualizado será el de inicio de sesión.

La identidad procede de la sesión. No admite IDs, DNI, rol, estado ni contraseñas en el body. Actualiza usuario y ficha de cliente activa en una sola transacción. Devuelve `{mensaje, usuario}` con los datos públicos actualizados; 400 ante entradas inválidas, 401 ante cuenta inactiva, 404 si falta la ficha activa de cliente y 409 si el correo pertenece a otra cuenta. `GET /auth/me` incluye teléfono y, para clientes, DNI/dirección de su ficha activa; nunca devuelve contraseña ni hash.

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

La interfaz del cliente separa `/mi-cuenta` (vista general), `/mi-cuenta/vehiculos`, `/mi-cuenta/ordenes`, `/mi-cuenta/pagos` y `/mi-perfil`. El detalle conserva `/mi-cuenta/ordenes/:id` y vuelve al listado propio de órdenes. No se habilitan las rutas administrativas al cliente.
# Devoluciones por cancelación

`POST /api/pagos/orden/:id/reembolsos` — administrador y recepcionista. Solo órdenes canceladas.

Body: `monto` positivo con hasta dos decimales, `metodo_pago_id` activo, `motivo` (trabajo realizado y razón de devolución, hasta 1000 caracteres), `referencia` opcional (120 caracteres), `clave_solicitud` UUID generado una vez por operación y reutilizado en reintentos.

Devuelve 201 al registrar y 200 al repetir una solicitud idéntica. Devuelve 409 si se reutiliza la clave con datos diferentes; 400 si el importe supera lo cobrado menos devoluciones anteriores. La transacción bloquea la orden. Se conserva el pago original; no se ejecuta una transferencia de dinero.

`GET /api/pagos/orden/:id/reembolsos` — administrador/recepcionista; mecánico únicamente asignado; cliente únicamente propietario. Devuelve `reembolsos`, `total_pagado`, `total_reembolsado`, `importe_retenido`. Un acceso ajeno devuelve 404.

`GET /api/pagos` conserva `pagos`, `total` bruto y `cantidad`; añade `reembolsos`, `total_reembolsado` y `total_neto`. `GET /api/dashboard/resumen` devuelve `ingresos` netos de devoluciones.

Instalaciones existentes: ejecutar `npm run db:reembolsos` desde Backend antes de iniciar esta versión. La actualización crea la tabla e índice sin modificar pagos existentes.
