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
  console.error("Error no controlado:", error);
  res.status(500).json({ mensaje: "Error interno del servidor" });
};
