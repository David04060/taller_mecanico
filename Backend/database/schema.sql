--
-- PostgreSQL database dump
--

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: actualizar_fecha_modificacion(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.actualizar_fecha_modificacion() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: recalcular_total_orden(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.recalcular_total_orden(p_orden_id integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN

    UPDATE ordenes_trabajo
    SET total =
        COALESCE(
            (
                SELECT SUM(cantidad * precio_unitario)
                FROM detalle_servicios
                WHERE orden_id = p_orden_id
            ),
            0
        )
        +
        COALESCE(
            (
                SELECT SUM(cantidad * precio_unitario)
                FROM detalle_repuestos
                WHERE orden_id = p_orden_id
            ),
            0
        )

    WHERE id = p_orden_id;

END;
$$;


--
-- Name: validar_pago(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validar_pago() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    total_orden NUMERIC(10,2);
    total_pagado NUMERIC(10,2);
BEGIN

    SELECT total
    INTO total_orden
    FROM ordenes_trabajo
    WHERE id = NEW.orden_id;

    SELECT COALESCE(SUM(monto), 0)
    INTO total_pagado
    FROM pagos
    WHERE orden_id = NEW.orden_id
      AND id <> COALESCE(NEW.id, -1);

    IF total_pagado + NEW.monto > total_orden THEN

        RAISE EXCEPTION
        'El pago excede el total de la orden. Total: %, Pagado: %, Nuevo pago: %',
        total_orden,
        total_pagado,
        NEW.monto;

    END IF;

    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: categorias_repuesto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categorias_repuesto (
    id smallint NOT NULL,
    nombre character varying(60) NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: categorias_repuesto_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.categorias_repuesto ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.categorias_repuesto_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: clientes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clientes (
    id integer NOT NULL,
    usuario_id integer,
    dni character varying(15) NOT NULL,
    nombres character varying(80) NOT NULL,
    apellidos character varying(80) NOT NULL,
    telefono character varying(20),
    email character varying(120),
    direccion character varying(200),
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: clientes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.clientes ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.clientes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: detalle_repuestos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.detalle_repuestos (
    id integer NOT NULL,
    orden_id integer NOT NULL,
    repuesto_id integer NOT NULL,
    cantidad integer NOT NULL,
    precio_unitario numeric(10,2) NOT NULL,
    CONSTRAINT detalle_repuestos_cantidad_check CHECK ((cantidad > 0)),
    CONSTRAINT detalle_repuestos_precio_unitario_check CHECK ((precio_unitario >= (0)::numeric))
);


--
-- Name: detalle_repuestos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.detalle_repuestos ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.detalle_repuestos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: detalle_servicios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.detalle_servicios (
    id integer NOT NULL,
    orden_id integer NOT NULL,
    servicio_id integer NOT NULL,
    cantidad smallint DEFAULT 1 NOT NULL,
    precio_unitario numeric(10,2) NOT NULL,
    CONSTRAINT detalle_servicios_cantidad_check CHECK ((cantidad > 0)),
    CONSTRAINT detalle_servicios_precio_unitario_check CHECK ((precio_unitario >= (0)::numeric))
);


--
-- Name: detalle_servicios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.detalle_servicios ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.detalle_servicios_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: estados_orden; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.estados_orden (
    id smallint NOT NULL,
    nombre character varying(40) NOT NULL,
    orden smallint NOT NULL,
    descripcion character varying(150),
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT estados_orden_orden_check CHECK ((orden > 0))
);


--
-- Name: estados_orden_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.estados_orden ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.estados_orden_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: historial_estados; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historial_estados (
    id integer NOT NULL,
    orden_id integer NOT NULL,
    estado_id smallint NOT NULL,
    usuario_id integer NOT NULL,
    comentario character varying(250),
    fecha timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: historial_estados_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.historial_estados ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.historial_estados_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: ordenes_trabajo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ordenes_trabajo (
    id integer NOT NULL,
    codigo character varying(20) NOT NULL,
    vehiculo_id integer NOT NULL,
    recepcionista_id integer NOT NULL,
    mecanico_id integer,
    estado_id smallint NOT NULL,
    problema_reportado text NOT NULL,
    diagnostico text,
    observaciones text,
    fecha_ingreso timestamp with time zone DEFAULT now() NOT NULL,
    fecha_estimada_entrega date,
    fecha_entrega timestamp with time zone,
    total numeric(10,2) DEFAULT 0 NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ordenes_trabajo_check CHECK (((fecha_entrega IS NULL) OR (fecha_entrega >= fecha_ingreso))),
    CONSTRAINT ordenes_trabajo_total_check CHECK ((total >= (0)::numeric))
);


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    rol_id smallint NOT NULL,
    nombres character varying(80) NOT NULL,
    apellidos character varying(80) NOT NULL,
    email character varying(120) NOT NULL,
    password_hash character varying(255) NOT NULL,
    telefono character varying(20),
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vehiculos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehiculos (
    id integer NOT NULL,
    cliente_id integer NOT NULL,
    placa character varying(10) NOT NULL,
    marca character varying(50) NOT NULL,
    modelo character varying(50) NOT NULL,
    anio smallint,
    color character varying(30),
    vin character varying(30),
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT vehiculos_anio_check CHECK (((anio >= 1950) AND (anio <= 2100)))
);


--
-- Name: historial_vehiculos; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.historial_vehiculos AS
 SELECT ot.id AS orden_id,
    ot.codigo AS orden_codigo,
    v.id AS vehiculo_id,
    v.placa,
    v.marca,
    v.modelo,
    v.anio,
    v.color,
    c.id AS cliente_id,
    c.dni AS cliente_dni,
    c.nombres AS cliente_nombres,
    c.apellidos AS cliente_apellidos,
    c.telefono AS cliente_telefono,
    m.id AS mecanico_id,
    m.nombres AS mecanico_nombres,
    m.apellidos AS mecanico_apellidos,
    ot.problema_reportado,
    ot.diagnostico,
    ot.observaciones,
    ot.fecha_ingreso,
    ot.fecha_estimada_entrega,
    ot.fecha_entrega,
    eo.id AS estado_id,
    eo.nombre AS estado,
    ot.total
   FROM ((((public.ordenes_trabajo ot
     JOIN public.vehiculos v ON ((ot.vehiculo_id = v.id)))
     JOIN public.clientes c ON ((v.cliente_id = c.id)))
     LEFT JOIN public.usuarios m ON ((ot.mecanico_id = m.id)))
     JOIN public.estados_orden eo ON ((ot.estado_id = eo.id)));


--
-- Name: metodos_pago; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.metodos_pago (
    id smallint NOT NULL,
    nombre character varying(40) NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: metodos_pago_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.metodos_pago ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.metodos_pago_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: movimientos_inventario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.movimientos_inventario (
    id integer NOT NULL,
    repuesto_id integer NOT NULL,
    orden_id integer,
    usuario_id integer NOT NULL,
    tipo character varying(10) NOT NULL,
    cantidad integer NOT NULL,
    motivo character varying(200) NOT NULL,
    fecha timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT movimientos_inventario_cantidad_check CHECK ((cantidad > 0)),
    CONSTRAINT movimientos_inventario_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['ENTRADA'::character varying, 'SALIDA'::character varying, 'AJUSTE'::character varying])::text[])))
);


--
-- Name: movimientos_inventario_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.movimientos_inventario ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.movimientos_inventario_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: ordenes_trabajo_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.ordenes_trabajo ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.ordenes_trabajo_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: pagos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pagos (
    id integer NOT NULL,
    orden_id integer NOT NULL,
    metodo_pago_id smallint NOT NULL,
    registrado_por integer NOT NULL,
    monto numeric(10,2) NOT NULL,
    referencia character varying(60),
    fecha timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pagos_monto_check CHECK ((monto > (0)::numeric))
);


--
-- Name: pagos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.pagos ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.pagos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: repuestos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.repuestos (
    id integer NOT NULL,
    categoria_id smallint NOT NULL,
    codigo character varying(30) NOT NULL,
    nombre character varying(120) NOT NULL,
    stock_actual integer DEFAULT 0 NOT NULL,
    stock_minimo integer DEFAULT 0 NOT NULL,
    precio_compra numeric(10,2) NOT NULL,
    precio_venta numeric(10,2) NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT repuestos_precio_compra_check CHECK ((precio_compra >= (0)::numeric)),
    CONSTRAINT repuestos_precio_venta_check CHECK ((precio_venta >= (0)::numeric)),
    CONSTRAINT repuestos_stock_actual_check CHECK ((stock_actual >= 0)),
    CONSTRAINT repuestos_stock_minimo_check CHECK ((stock_minimo >= 0))
);


--
-- Name: repuestos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.repuestos ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.repuestos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id smallint NOT NULL,
    nombre character varying(30) NOT NULL,
    descripcion character varying(150),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.roles ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: servicios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.servicios (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion character varying(250),
    precio_base numeric(10,2) NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT servicios_precio_base_check CHECK ((precio_base >= (0)::numeric))
);


--
-- Name: servicios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.servicios ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.servicios_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.usuarios ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.usuarios_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: vehiculos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.vehiculos ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.vehiculos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: categorias_repuesto categorias_repuesto_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias_repuesto
    ADD CONSTRAINT categorias_repuesto_nombre_key UNIQUE (nombre);


--
-- Name: categorias_repuesto categorias_repuesto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias_repuesto
    ADD CONSTRAINT categorias_repuesto_pkey PRIMARY KEY (id);


--
-- Name: clientes clientes_dni_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_dni_key UNIQUE (dni);


--
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);


--
-- Name: clientes clientes_usuario_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_usuario_id_key UNIQUE (usuario_id);


--
-- Name: detalle_repuestos detalle_repuestos_orden_id_repuesto_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_repuestos
    ADD CONSTRAINT detalle_repuestos_orden_id_repuesto_id_key UNIQUE (orden_id, repuesto_id);


--
-- Name: detalle_repuestos detalle_repuestos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_repuestos
    ADD CONSTRAINT detalle_repuestos_pkey PRIMARY KEY (id);


--
-- Name: detalle_servicios detalle_servicios_orden_id_servicio_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_servicios
    ADD CONSTRAINT detalle_servicios_orden_id_servicio_id_key UNIQUE (orden_id, servicio_id);


--
-- Name: detalle_servicios detalle_servicios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_servicios
    ADD CONSTRAINT detalle_servicios_pkey PRIMARY KEY (id);


--
-- Name: estados_orden estados_orden_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estados_orden
    ADD CONSTRAINT estados_orden_nombre_key UNIQUE (nombre);


--
-- Name: estados_orden estados_orden_orden_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estados_orden
    ADD CONSTRAINT estados_orden_orden_key UNIQUE (orden);


--
-- Name: estados_orden estados_orden_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estados_orden
    ADD CONSTRAINT estados_orden_pkey PRIMARY KEY (id);


--
-- Name: historial_estados historial_estados_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_estados
    ADD CONSTRAINT historial_estados_pkey PRIMARY KEY (id);


--
-- Name: metodos_pago metodos_pago_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metodos_pago
    ADD CONSTRAINT metodos_pago_nombre_key UNIQUE (nombre);


--
-- Name: metodos_pago metodos_pago_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metodos_pago
    ADD CONSTRAINT metodos_pago_pkey PRIMARY KEY (id);


--
-- Name: movimientos_inventario movimientos_inventario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_inventario
    ADD CONSTRAINT movimientos_inventario_pkey PRIMARY KEY (id);


--
-- Name: ordenes_trabajo ordenes_trabajo_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordenes_trabajo
    ADD CONSTRAINT ordenes_trabajo_codigo_key UNIQUE (codigo);


--
-- Name: ordenes_trabajo ordenes_trabajo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordenes_trabajo
    ADD CONSTRAINT ordenes_trabajo_pkey PRIMARY KEY (id);


--
-- Name: pagos pagos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_pkey PRIMARY KEY (id);


--
-- Name: repuestos repuestos_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repuestos
    ADD CONSTRAINT repuestos_codigo_key UNIQUE (codigo);


--
-- Name: repuestos repuestos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repuestos
    ADD CONSTRAINT repuestos_pkey PRIMARY KEY (id);


--
-- Name: roles roles_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_nombre_key UNIQUE (nombre);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: servicios servicios_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicios
    ADD CONSTRAINT servicios_nombre_key UNIQUE (nombre);


--
-- Name: servicios servicios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicios
    ADD CONSTRAINT servicios_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: vehiculos vehiculos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehiculos
    ADD CONSTRAINT vehiculos_pkey PRIMARY KEY (id);


--
-- Name: vehiculos vehiculos_placa_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehiculos
    ADD CONSTRAINT vehiculos_placa_key UNIQUE (placa);


--
-- Name: vehiculos vehiculos_vin_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehiculos
    ADD CONSTRAINT vehiculos_vin_key UNIQUE (vin);


--
-- Name: idx_clientes_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clientes_usuario ON public.clientes USING btree (usuario_id);


--
-- Name: idx_detalle_rep_orden; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_detalle_rep_orden ON public.detalle_repuestos USING btree (orden_id);


--
-- Name: idx_detalle_serv_orden; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_detalle_serv_orden ON public.detalle_servicios USING btree (orden_id);


--
-- Name: idx_historial_orden; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_historial_orden ON public.historial_estados USING btree (orden_id);


--
-- Name: idx_movimientos_orden; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movimientos_orden ON public.movimientos_inventario USING btree (orden_id);


--
-- Name: idx_movimientos_repuesto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movimientos_repuesto ON public.movimientos_inventario USING btree (repuesto_id);


--
-- Name: idx_ordenes_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ordenes_estado ON public.ordenes_trabajo USING btree (estado_id);


--
-- Name: idx_ordenes_mecanico; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ordenes_mecanico ON public.ordenes_trabajo USING btree (mecanico_id);


--
-- Name: idx_ordenes_recepcionista; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ordenes_recepcionista ON public.ordenes_trabajo USING btree (recepcionista_id);


--
-- Name: idx_ordenes_vehiculo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ordenes_vehiculo ON public.ordenes_trabajo USING btree (vehiculo_id);


--
-- Name: idx_pagos_orden; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagos_orden ON public.pagos USING btree (orden_id);


--
-- Name: idx_usuarios_rol; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuarios_rol ON public.usuarios USING btree (rol_id);


--
-- Name: idx_vehiculos_cliente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vehiculos_cliente ON public.vehiculos USING btree (cliente_id);


--
-- Name: clientes trg_clientes_actualizado; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_clientes_actualizado BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.actualizar_fecha_modificacion();


--
-- Name: ordenes_trabajo trg_ordenes_actualizado; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_ordenes_actualizado BEFORE UPDATE ON public.ordenes_trabajo FOR EACH ROW EXECUTE FUNCTION public.actualizar_fecha_modificacion();


--
-- Name: repuestos trg_repuestos_actualizado; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_repuestos_actualizado BEFORE UPDATE ON public.repuestos FOR EACH ROW EXECUTE FUNCTION public.actualizar_fecha_modificacion();


--
-- Name: roles trg_roles_actualizado; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_roles_actualizado BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.actualizar_fecha_modificacion();


--
-- Name: servicios trg_servicios_actualizado; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_servicios_actualizado BEFORE UPDATE ON public.servicios FOR EACH ROW EXECUTE FUNCTION public.actualizar_fecha_modificacion();


--
-- Name: usuarios trg_usuarios_actualizado; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_usuarios_actualizado BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.actualizar_fecha_modificacion();


--
-- Name: pagos trg_validar_pago; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_validar_pago BEFORE INSERT OR UPDATE ON public.pagos FOR EACH ROW EXECUTE FUNCTION public.validar_pago();


--
-- Name: vehiculos trg_vehiculos_actualizado; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_vehiculos_actualizado BEFORE UPDATE ON public.vehiculos FOR EACH ROW EXECUTE FUNCTION public.actualizar_fecha_modificacion();


--
-- Name: clientes clientes_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: detalle_repuestos detalle_repuestos_orden_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_repuestos
    ADD CONSTRAINT detalle_repuestos_orden_id_fkey FOREIGN KEY (orden_id) REFERENCES public.ordenes_trabajo(id) ON DELETE CASCADE;


--
-- Name: detalle_repuestos detalle_repuestos_repuesto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_repuestos
    ADD CONSTRAINT detalle_repuestos_repuesto_id_fkey FOREIGN KEY (repuesto_id) REFERENCES public.repuestos(id) ON DELETE RESTRICT;


--
-- Name: detalle_servicios detalle_servicios_orden_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_servicios
    ADD CONSTRAINT detalle_servicios_orden_id_fkey FOREIGN KEY (orden_id) REFERENCES public.ordenes_trabajo(id) ON DELETE CASCADE;


--
-- Name: detalle_servicios detalle_servicios_servicio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_servicios
    ADD CONSTRAINT detalle_servicios_servicio_id_fkey FOREIGN KEY (servicio_id) REFERENCES public.servicios(id) ON DELETE RESTRICT;


--
-- Name: historial_estados historial_estados_estado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_estados
    ADD CONSTRAINT historial_estados_estado_id_fkey FOREIGN KEY (estado_id) REFERENCES public.estados_orden(id) ON DELETE RESTRICT;


--
-- Name: historial_estados historial_estados_orden_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_estados
    ADD CONSTRAINT historial_estados_orden_id_fkey FOREIGN KEY (orden_id) REFERENCES public.ordenes_trabajo(id) ON DELETE CASCADE;


--
-- Name: historial_estados historial_estados_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_estados
    ADD CONSTRAINT historial_estados_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE RESTRICT;


--
-- Name: movimientos_inventario movimientos_inventario_orden_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_inventario
    ADD CONSTRAINT movimientos_inventario_orden_id_fkey FOREIGN KEY (orden_id) REFERENCES public.ordenes_trabajo(id) ON DELETE SET NULL;


--
-- Name: movimientos_inventario movimientos_inventario_repuesto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_inventario
    ADD CONSTRAINT movimientos_inventario_repuesto_id_fkey FOREIGN KEY (repuesto_id) REFERENCES public.repuestos(id) ON DELETE RESTRICT;


--
-- Name: movimientos_inventario movimientos_inventario_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_inventario
    ADD CONSTRAINT movimientos_inventario_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE RESTRICT;


--
-- Name: ordenes_trabajo ordenes_trabajo_estado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordenes_trabajo
    ADD CONSTRAINT ordenes_trabajo_estado_id_fkey FOREIGN KEY (estado_id) REFERENCES public.estados_orden(id) ON DELETE RESTRICT;


--
-- Name: ordenes_trabajo ordenes_trabajo_mecanico_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordenes_trabajo
    ADD CONSTRAINT ordenes_trabajo_mecanico_id_fkey FOREIGN KEY (mecanico_id) REFERENCES public.usuarios(id) ON DELETE RESTRICT;


--
-- Name: ordenes_trabajo ordenes_trabajo_recepcionista_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordenes_trabajo
    ADD CONSTRAINT ordenes_trabajo_recepcionista_id_fkey FOREIGN KEY (recepcionista_id) REFERENCES public.usuarios(id) ON DELETE RESTRICT;


--
-- Name: ordenes_trabajo ordenes_trabajo_vehiculo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordenes_trabajo
    ADD CONSTRAINT ordenes_trabajo_vehiculo_id_fkey FOREIGN KEY (vehiculo_id) REFERENCES public.vehiculos(id) ON DELETE RESTRICT;


--
-- Name: pagos pagos_metodo_pago_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_metodo_pago_id_fkey FOREIGN KEY (metodo_pago_id) REFERENCES public.metodos_pago(id) ON DELETE RESTRICT;


--
-- Name: pagos pagos_orden_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_orden_id_fkey FOREIGN KEY (orden_id) REFERENCES public.ordenes_trabajo(id) ON DELETE RESTRICT;


--
-- Name: pagos pagos_registrado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_registrado_por_fkey FOREIGN KEY (registrado_por) REFERENCES public.usuarios(id) ON DELETE RESTRICT;


--
-- Name: repuestos repuestos_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repuestos
    ADD CONSTRAINT repuestos_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias_repuesto(id) ON DELETE RESTRICT;


--
-- Name: usuarios usuarios_rol_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.roles(id) ON DELETE RESTRICT;


--
-- Name: vehiculos vehiculos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehiculos
    ADD CONSTRAINT vehiculos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

-- Catálogos mínimos para que una instalación nueva sea utilizable.
INSERT INTO public.roles (nombre, descripcion) VALUES
  ('administrador', 'Acceso completo al sistema'),
  ('recepcionista', 'Atención, órdenes, clientes y pagos'),
  ('mecanico', 'Diagnóstico y ejecución de trabajos'),
  ('cliente', 'Consulta de sus vehículos, órdenes y pagos')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO public.estados_orden (nombre, orden, descripcion) VALUES
  ('Recibida', 1, 'Vehículo recibido en el taller'),
  ('En diagnóstico', 2, 'El mecánico está evaluando el vehículo'),
  ('Esperando aprobación', 3, 'Presupuesto pendiente de aprobación'),
  ('En reparación', 4, 'Trabajo autorizado y en ejecución'),
  ('Listo para entrega', 5, 'Trabajo finalizado'),
  ('Entregado', 6, 'Vehículo entregado al cliente'),
  ('Cancelada', 7, 'Orden cancelada')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO public.metodos_pago (nombre, activo) VALUES
  ('Efectivo', true), ('Tarjeta', true),
  ('Transferencia bancaria', true), ('Yape', true), ('Plin', true)
ON CONFLICT (nombre) DO NOTHING;
