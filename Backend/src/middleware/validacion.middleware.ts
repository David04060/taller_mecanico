import type { RequestHandler } from "express";

// 1. LÍMITES DE CARACTERES PARA CAMPOS DE TEXTO
const textos: Record<string, number> = {
  // Datos personales
  nombres: 80,
  apellidos: 80,
  email: 120,
  telefono: 20,
  dni: 15,
  direccion: 200,

  // Datos de vehículos
  placa: 10,
  marca: 50,
  modelo: 50,
  color: 30,
  vin: 30,

  // Datos generales
  nombre: 120,
  codigo: 30,
  descripcion: 5000,

  // Órdenes de trabajo
  problema_reportado: 5000,
  diagnostico: 10000,
  observaciones: 10000,
  comentario: 5000,
  fecha_estimada_entrega: 30,

  // Otros campos
  motivo: 1000,
  referencia: 120,
  rol: 30,
};

// 2. CAMPOS QUE DEBEN SER NÚMEROS ENTEROS

const enteros = new Set([
  "usuario_id",
  "cliente_id",
  "vehiculo_id",
  "mecanico_id",
  "servicio_id",
  "repuesto_id",
  "categoria_id",
  "metodo_pago_id",
  "estado_id",
  "cantidad",
  "anio",
  "stock_minimo",
]);

// 3. CAMPOS QUE REPRESENTAN IMPORTES DE DINERO

const dinero = new Set([
  "monto",
  "precio_base",
  "precio_compra",
  "precio_venta",
]);

/* =====================================================
   4. MIDDLEWARE DE VALIDACIÓN DE ENTRADA

   Rechaza datos mal formados antes de que lleguen
   a las consultas SQL.

   No reemplaza las reglas de negocio.
===================================================== */

export const validarEntrada: RequestHandler = (req, res, next) => {
  const partes = req.path.split("/").filter(Boolean);

  // Función para devolver errores de validación
  const error = (mensaje: string) => {
    return res.status(400).json({ mensaje });
  };
  // Crear una copia de los límites generales
  const limites = { ...textos };

  // 4.1. LÍMITES ESPECÍFICOS SEGÚN EL MÓDULO

  // Servicios
  if (partes[0] === "servicios") {
    limites.nombre = 100;
    limites.descripcion = 250;
  }
  // Categorías de repuestos
  if (partes[0] === "categorias_repuesto") {
    limites.nombre = 60;
  }
  // Órdenes de trabajo
  if (partes[0] === "ordenes_trabajo") {
    limites.codigo = 20;
    limites.comentario = 250;
  }
  // Inventario
  if (partes[0] === "inventario") {
    limites.motivo = 200;
  }
  // Pagos (excepto reembolsos)
  if (
    partes[0] === "pagos" &&
    !partes.includes("reembolsos")
  ) {
    limites.referencia = 60;
  }

  // 4.2. VALIDAR IDENTIFICADORES EN LA URL
  for (const parte of partes) {
    if (
      /^\d/.test(parte) &&
      (
        !/^\d+$/.test(parte) ||
        Number(parte) < 1 ||
        Number(parte) > 2147483647
      )
    ) {
      return error(
        "El identificador debe ser un entero positivo válido"
      );
    }
  }

  // 4.3. VALIDAR SOLO MÉTODOS QUE ENVÍAN DATOS
  if (!["POST", "PUT", "PATCH"].includes(req.method)) {
    return next();
  }
  // Inicializar el cuerpo si es nulo
  if (req.body == null) {
    req.body = {};
  }
  // Verificar que el cuerpo sea un objeto JSON
  if (
    typeof req.body !== "object" ||
    Array.isArray(req.body)
  ) {
    return error("El cuerpo debe ser un objeto JSON");
  }

  // 4.4. RECORRER Y VALIDAR LOS CAMPOS RECIBIDOS

  for (const [campo, valor] of Object.entries(req.body)) {

    // Ignorar valores nulos o indefinidos
    if (valor === undefined || valor === null) {
      continue;
    }

    // A. VALIDACIÓN DE CAMPOS DE TEXTO

    if (campo in limites) {
      if (
        typeof valor !== "string" ||
        valor.length > limites[campo]
      ) {
        return error(
          `El campo ${campo} debe ser texto de hasta ${limites[campo]} caracteres`
        );
      }

      // Eliminar espacios al inicio y al final
      req.body[campo] = valor.trim();
    }

    // B. VALIDACIÓN DE NÚMEROS ENTEROS

    if (enteros.has(campo)) {
      if (
        (typeof valor !== "number" &&
          typeof valor !== "string") ||
        String(valor).trim() === "" ||
        !Number.isSafeInteger(Number(valor)) ||
        Number(valor) < (campo === "stock_minimo" ? 0 : 1) ||
        Number(valor) > 2147483647
      ) {
        return error(
          `El campo ${campo} debe ser un número entero válido`
        );
      }

      // Convertir el valor a número
      req.body[campo] = Number(valor);
    }

    // C. VALIDACIÓN DE IMPORTES DE DINERO

    if (dinero.has(campo)) {
      const n = Number(valor);

      if (
        (typeof valor !== "number" &&
          typeof valor !== "string") ||
        String(valor).trim() === "" ||
        !Number.isFinite(n) ||
        n < 0 ||
        n > 99999999.99 ||
        Math.abs(n * 100 - Math.round(n * 100)) > 0.000001
      ) {
        return error(
          `El campo ${campo} debe ser un importe válido con hasta dos decimales`
        );
      }

      // Guardar el importe como número
      req.body[campo] = n;
    }

    // D. VALIDACIÓN DEL ESTADO ACTIVO

    if (
      campo === "activo" &&
      typeof valor !== "boolean"
    ) {
      return error(
        "El campo activo debe ser booleano"
      );
    }
    // E. VALIDACIÓN DE CONTRASEÑAS

    if (
      [
        "password",
        "password_actual",
        "password_nueva",
      ].includes(campo) &&
      (
        typeof valor !== "string" ||
        Buffer.byteLength(valor, "utf8") > 72
      )
    ) {
      return error(
        "La contraseña debe ser texto y no superar 72 bytes"
      );
    }
  }
  // 4.5. VALIDAR FORMATO DEL CORREO ELECTRÓNICO

  if (
    req.body.email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)
  ) {
    return error(
      "El correo electrónico no es válido"
    );
  }
  // 4.6. VALIDAR FECHA ESTIMADA DE ENTREGA

  if (
    req.body.fecha_estimada_entrega &&
    (
      !/^\d{4}-\d{2}-\d{2}$/.test(
        req.body.fecha_estimada_entrega
      ) ||
      !Number.isFinite(
        Date.parse(req.body.fecha_estimada_entrega)
      ) ||
      new Date(req.body.fecha_estimada_entrega)
        .toISOString()
        .slice(0, 10) !== req.body.fecha_estimada_entrega
    )
  ) {
    return error(
      "La fecha estimada debe tener formato AAAA-MM-DD"
    );
  }
  next();
};
