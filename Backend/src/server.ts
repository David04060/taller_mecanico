import { app } from "./app";
import { env } from "./config/env";

app.listen(env.PORT, () => {
  console.log(`Taller Mecánico ejecutándose en http://localhost:${env.PORT}`);
});
