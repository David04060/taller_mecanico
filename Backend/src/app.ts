import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import authRoutes from "./routes/auth.routes";
import usuariosRoutes from "./routes/usuarios.routes";
import clientesRoutes from "./routes/clientes.routes";
import vehiculosRoutes from "./routes/vehiculos.routes";
import serviciosRoutes from "./routes/servicios.routes";
import categoriasRepuestoRoutes from "./routes/categorias_repuesto.routes";
import repuestosRoutes from "./routes/repuestos.routes";
import ordenesTrabajoRoutes from "./routes/ordenes_trabajo.routes";
import pagosRoutes from "./routes/pagos.routes";
import inventarioRoutes from "./routes/inventario.routes";
import metodosPagoRoutes from "./routes/metodos_pago.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import { manejarErrores, rutaNoEncontrada } from "./middleware/errores";

export const app = express();

app.use(helmet());
const origenesPermitidos = env.CORS_ORIGIN.split(",")
  .map((origen) => origen.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origen, callback) => {
      if (!origen || origenesPermitidos.includes(origen)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origen no permitido por CORS"));
    },
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/clientes", clientesRoutes);
app.use("/api/vehiculos", vehiculosRoutes);
app.use("/api/servicios", serviciosRoutes);
app.use("/api/categorias_repuesto", categoriasRepuestoRoutes);
app.use("/api/repuestos", repuestosRoutes);
app.use("/api/ordenes_trabajo", ordenesTrabajoRoutes);
app.use("/api/pagos", pagosRoutes);
app.use("/api/inventario", inventarioRoutes);
app.use("/api/metodos-pago", metodosPagoRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.get("/", (_req, res) => {
  res.json({ mensaje: "Taller Mecánico funcionando correctamente" });
});

app.use(rutaNoEncontrada);
app.use(manejarErrores);
