import type { ErrorRequestHandler, RequestHandler } from "express";

export const rutaNoEncontrada: RequestHandler = (_req, res) => {
  res.status(404).json({ mensaje: "Ruta no encontrada" });
};

export const manejarErrores: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
  if (error?.type === "entity.parse.failed") {
    res.status(400).json({ mensaje: "El cuerpo JSON no es válido" }); return;
  }
  if (error?.type === "entity.too.large") {
    res.status(413).json({ mensaje: "La solicitud supera el tamaño permitido" }); return;
  }
  console.error("Error no controlado:", error);
  res.status(500).json({ mensaje: "Error interno del servidor" });
};
