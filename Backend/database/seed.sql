--
-- PostgreSQL database dump
--

\restrict toR9lKAgkMa7tIuZESy4bDBFo85lJANHJPa0bhoAfe90SmxzzxQhWf6uqIr86at

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: categorias_repuesto; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.categorias_repuesto (id, nombre, activo, creado_en) OVERRIDING SYSTEM VALUE VALUES (1, 'Filtros', true, '2026-09-28 23:03:41.968596-05');
INSERT INTO public.categorias_repuesto (id, nombre, activo, creado_en) OVERRIDING SYSTEM VALUE VALUES (2, 'Lubricantes', true, '2026-09-28 23:03:41.968596-05');
INSERT INTO public.categorias_repuesto (id, nombre, activo, creado_en) OVERRIDING SYSTEM VALUE VALUES (3, 'Frenos', true, '2026-09-28 23:03:41.968596-05');
INSERT INTO public.categorias_repuesto (id, nombre, activo, creado_en) OVERRIDING SYSTEM VALUE VALUES (4, 'Suspensión', true, '2026-09-28 23:03:41.968596-05');
INSERT INTO public.categorias_repuesto (id, nombre, activo, creado_en) OVERRIDING SYSTEM VALUE VALUES (5, 'Motor', true, '2026-09-28 23:03:41.968596-05');
INSERT INTO public.categorias_repuesto (id, nombre, activo, creado_en) OVERRIDING SYSTEM VALUE VALUES (6, 'Eléctrico', true, '2026-09-28 23:03:41.968596-05');
INSERT INTO public.categorias_repuesto (id, nombre, activo, creado_en) OVERRIDING SYSTEM VALUE VALUES (7, 'Correas', true, '2026-09-28 23:03:41.968596-05');
INSERT INTO public.categorias_repuesto (id, nombre, activo, creado_en) OVERRIDING SYSTEM VALUE VALUES (8, 'Neumáticos', true, '2026-09-28 23:03:41.968596-05');
INSERT INTO public.categorias_repuesto (id, nombre, activo, creado_en) OVERRIDING SYSTEM VALUE VALUES (9, 'Transmisión', true, '2026-09-29 22:29:24.450016-05');


--
-- Data for Name: estados_orden; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.estados_orden (id, nombre, orden, descripcion, creado_en) OVERRIDING SYSTEM VALUE VALUES (1, 'Recibido', 1, 'El vehículo ingresó al taller', '2026-09-28 23:01:20.70319-05');
INSERT INTO public.estados_orden (id, nombre, orden, descripcion, creado_en) OVERRIDING SYSTEM VALUE VALUES (2, 'En diagnóstico', 2, 'El mecánico está revisando el vehículo', '2026-09-28 23:01:20.70319-05');
INSERT INTO public.estados_orden (id, nombre, orden, descripcion, creado_en) OVERRIDING SYSTEM VALUE VALUES (3, 'Esperando aprobación', 3, 'Se espera que el cliente apruebe el presupuesto', '2026-09-28 23:01:20.70319-05');
INSERT INTO public.estados_orden (id, nombre, orden, descripcion, creado_en) OVERRIDING SYSTEM VALUE VALUES (4, 'En reparación', 4, 'El trabajo está en curso', '2026-09-28 23:01:20.70319-05');
INSERT INTO public.estados_orden (id, nombre, orden, descripcion, creado_en) OVERRIDING SYSTEM VALUE VALUES (5, 'Listo para entrega', 5, 'El vehículo está listo para recoger', '2026-09-28 23:01:20.70319-05');
INSERT INTO public.estados_orden (id, nombre, orden, descripcion, creado_en) OVERRIDING SYSTEM VALUE VALUES (6, 'Entregado', 6, 'El vehículo fue entregado al cliente', '2026-09-28 23:01:20.70319-05');
INSERT INTO public.estados_orden (id, nombre, orden, descripcion, creado_en) OVERRIDING SYSTEM VALUE VALUES (7, 'Cancelado', 7, 'La orden fue cancelada', '2026-09-28 23:01:20.70319-05');


--
-- Data for Name: metodos_pago; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.metodos_pago (id, nombre, activo, creado_en) OVERRIDING SYSTEM VALUE VALUES (1, 'Efectivo', true, '2026-09-28 23:01:32.286545-05');
INSERT INTO public.metodos_pago (id, nombre, activo, creado_en) OVERRIDING SYSTEM VALUE VALUES (2, 'Yape', true, '2026-09-28 23:01:32.286545-05');
INSERT INTO public.metodos_pago (id, nombre, activo, creado_en) OVERRIDING SYSTEM VALUE VALUES (3, 'Plin', true, '2026-09-28 23:01:32.286545-05');
INSERT INTO public.metodos_pago (id, nombre, activo, creado_en) OVERRIDING SYSTEM VALUE VALUES (4, 'Transferencia bancaria', true, '2026-09-28 23:01:32.286545-05');
INSERT INTO public.metodos_pago (id, nombre, activo, creado_en) OVERRIDING SYSTEM VALUE VALUES (5, 'Tarjeta', true, '2026-09-28 23:01:32.286545-05');


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.roles (id, nombre, descripcion, created_at, actualizado_en) OVERRIDING SYSTEM VALUE VALUES (1, 'administrador', 'Gestiona usuarios, servicios, inventario y reportes', '2026-09-28 23:00:05.038326-05', '2026-09-28 23:20:43.251765-05');
INSERT INTO public.roles (id, nombre, descripcion, created_at, actualizado_en) OVERRIDING SYSTEM VALUE VALUES (2, 'recepcionista', 'Registra clientes, vehículos, órdenes y pagos', '2026-09-28 23:00:05.038326-05', '2026-09-28 23:20:43.251765-05');
INSERT INTO public.roles (id, nombre, descripcion, created_at, actualizado_en) OVERRIDING SYSTEM VALUE VALUES (3, 'mecanico', 'Atiende órdenes asignadas y actualiza su estado', '2026-09-28 23:00:05.038326-05', '2026-09-28 23:20:43.251765-05');
INSERT INTO public.roles (id, nombre, descripcion, created_at, actualizado_en) OVERRIDING SYSTEM VALUE VALUES (4, 'cliente', 'Consulta el estado de sus vehículos, pagos e historial', '2026-09-28 23:00:05.038326-05', '2026-09-28 23:20:43.251765-05');


--
-- Data for Name: servicios; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.servicios (id, nombre, descripcion, precio_base, activo, creado_en, actualizado_en) OVERRIDING SYSTEM VALUE VALUES (1, 'Cambio de aceite', 'Cambio de aceite y revisión básica del motor', 80.00, true, '2026-09-29 22:16:13.182621-05', '2026-09-29 22:16:13.182621-05');
INSERT INTO public.servicios (id, nombre, descripcion, precio_base, activo, creado_en, actualizado_en) OVERRIDING SYSTEM VALUE VALUES (2, 'Cambio de pastillas de freno', 'Reemplazo de pastillas de freno', 120.00, true, '2026-09-29 22:16:42.744433-05', '2026-09-29 22:16:42.744433-05');
INSERT INTO public.servicios (id, nombre, descripcion, precio_base, activo, creado_en, actualizado_en) OVERRIDING SYSTEM VALUE VALUES (3, 'Alineamiento', 'Alineamiento de dirección', 60.00, true, '2026-09-29 22:16:50.868582-05', '2026-09-29 22:16:50.868582-05');
INSERT INTO public.servicios (id, nombre, descripcion, precio_base, activo, creado_en, actualizado_en) OVERRIDING SYSTEM VALUE VALUES (4, 'Diagnóstico computarizado', 'Diagnóstico mediante escáner automotriz', 100.00, true, '2026-09-29 22:17:05.215235-05', '2026-09-29 22:17:05.215235-05');
INSERT INTO public.servicios (id, nombre, descripcion, precio_base, activo, creado_en, actualizado_en) OVERRIDING SYSTEM VALUE VALUES (5, 'Cambio de filtro de aire', 'Reemplazo del filtro de aire del motor', 40.00, true, '2026-09-30 09:16:10.357918-05', '2026-09-30 09:16:10.357918-05');
INSERT INTO public.servicios (id, nombre, descripcion, precio_base, activo, creado_en, actualizado_en) OVERRIDING SYSTEM VALUE VALUES (6, 'Cambio de filtro de combustible', 'Reemplazo del filtro de combustible', 55.00, true, '2026-09-30 09:16:10.357918-05', '2026-09-30 09:16:10.357918-05');
INSERT INTO public.servicios (id, nombre, descripcion, precio_base, activo, creado_en, actualizado_en) OVERRIDING SYSTEM VALUE VALUES (7, 'Cambio de bujías', 'Reemplazo de bujías del motor', 70.00, true, '2026-09-30 09:16:10.357918-05', '2026-09-30 09:16:10.357918-05');
INSERT INTO public.servicios (id, nombre, descripcion, precio_base, activo, creado_en, actualizado_en) OVERRIDING SYSTEM VALUE VALUES (8, 'Cambio de batería', 'Reemplazo e instalación de batería automotriz', 50.00, true, '2026-09-30 09:16:10.357918-05', '2026-09-30 09:16:10.357918-05');
INSERT INTO public.servicios (id, nombre, descripcion, precio_base, activo, creado_en, actualizado_en) OVERRIDING SYSTEM VALUE VALUES (9, 'Cambio de líquido de frenos', 'Reemplazo y purgado del líquido de frenos', 80.00, true, '2026-09-30 09:16:10.357918-05', '2026-09-30 09:16:10.357918-05');
INSERT INTO public.servicios (id, nombre, descripcion, precio_base, activo, creado_en, actualizado_en) OVERRIDING SYSTEM VALUE VALUES (10, 'Revisión de frenos', 'Inspección del sistema de frenos delantero y trasero', 50.00, true, '2026-09-30 09:16:10.357918-05', '2026-09-30 09:16:10.357918-05');
INSERT INTO public.servicios (id, nombre, descripcion, precio_base, activo, creado_en, actualizado_en) OVERRIDING SYSTEM VALUE VALUES (11, 'Balanceo de ruedas', 'Balanceo de ruedas para corregir vibraciones', 70.00, true, '2026-09-30 09:16:10.357918-05', '2026-09-30 09:16:10.357918-05');
INSERT INTO public.servicios (id, nombre, descripcion, precio_base, activo, creado_en, actualizado_en) OVERRIDING SYSTEM VALUE VALUES (12, 'Rotación de neumáticos', 'Rotación de neumáticos según desgaste', 40.00, true, '2026-09-30 09:16:10.357918-05', '2026-09-30 09:16:10.357918-05');
INSERT INTO public.servicios (id, nombre, descripcion, precio_base, activo, creado_en, actualizado_en) OVERRIDING SYSTEM VALUE VALUES (13, 'Mantenimiento preventivo', 'Revisión general de componentes y sistemas del vehículo', 150.00, true, '2026-09-30 09:16:10.357918-05', '2026-09-30 09:16:10.357918-05');
INSERT INTO public.servicios (id, nombre, descripcion, precio_base, activo, creado_en, actualizado_en) OVERRIDING SYSTEM VALUE VALUES (14, 'Afinamiento de motor', 'Mantenimiento y revisión de componentes principales del motor', 180.00, true, '2026-09-30 09:16:10.357918-05', '2026-09-30 09:16:10.357918-05');
INSERT INTO public.servicios (id, nombre, descripcion, precio_base, activo, creado_en, actualizado_en) OVERRIDING SYSTEM VALUE VALUES (15, 'Revisión del sistema de suspensión', 'Inspección de amortiguadores, rótulas y componentes de suspensión', 80.00, true, '2026-09-30 09:16:10.357918-05', '2026-09-30 09:16:10.357918-05');


--
-- Name: categorias_repuesto_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categorias_repuesto_id_seq', 9, true);


--
-- Name: estados_orden_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.estados_orden_id_seq', 7, true);


--
-- Name: metodos_pago_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.metodos_pago_id_seq', 5, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.roles_id_seq', 4, true);


--
-- Name: servicios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.servicios_id_seq', 15, true);


--
-- PostgreSQL database dump complete
--

\unrestrict toR9lKAgkMa7tIuZESy4bDBFo85lJANHJPa0bhoAfe90SmxzzxQhWf6uqIr86at

