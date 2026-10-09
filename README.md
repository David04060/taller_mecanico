# Sistema de gestión para taller mecánico

Aplicación full stack para gestionar usuarios, clientes, vehículos, órdenes de trabajo, servicios, repuestos, inventario y pagos. Incluye vistas diferenciadas para administrador, recepcionista, mecánico y cliente.

## Requisitos

- Node.js 22 o superior.
- PostgreSQL 15 o superior.
- `psql` para inicializar la base de datos.

## 1. Base de datos

Crear una base vacía y ejecutar el esquema. El archivo también crea los catálogos mínimos de roles, estados y métodos de pago.

```powershell
psql "postgresql://usuario:password@localhost:5432/taller_mecanico" -f Backend/database/schema.sql
```

`Backend/database/seed.sql` puede ejecutarse nuevamente para reparar o actualizar los catálogos; es idempotente.

## 2. Backend

```powershell
cd Backend
Copy-Item .env.example .env
npm ci
npm run create-admin
npm run dev
```

Antes de ejecutar `create-admin`, completar `ADMIN_EMAIL` y `ADMIN_PASSWORD` en `.env`. Para producción, esas variables pueden retirarse después de crear la cuenta.

Comandos disponibles:

- `npm run dev`: desarrollo con recarga.
- `npm run build`: compila TypeScript en `dist`.
- `npm start`: inicia el servidor compilado.
- `npm run create-admin`: crea o actualiza el administrador inicial.
- `npm test`: ejecuta pruebas de humo autenticadas y de solo lectura contra la base configurada.

## 3. Frontend

```powershell
cd Frontend
Copy-Item .env.example .env.local
npm ci
npm run dev
```

`VITE_API_URL` debe terminar en `/api`, por ejemplo `http://localhost:3000/api`.

## Roles

- **Administrador:** acceso completo, usuarios e ingresos de inventario.
- **Recepcionista:** clientes, vehículos, órdenes, asignación de mecánicos y pagos.
- **Mecánico:** consulta sus órdenes, registra diagnóstico, servicios y repuestos.
- **Cliente:** consulta sus datos, vehículos, órdenes y pagos.

La cuenta de acceso de un cliente se crea desde el módulo Clientes. El cliente debe tener un correo registrado y la contraseña definida queda vigente hasta que el propio usuario la cambie desde Mi perfil o se desactive su cuenta.

## Verificación antes de desplegar

```powershell
cd Backend
npm run build
npm start

cd ../Frontend
npm run lint
npm run build
```

## Preparación para EC2 y RDS

El código no depende de direcciones locales codificadas. Para el despliegue posterior se configurarán mediante variables de entorno:

- `DATABASE_URL`: conexión privada a RDS.
- `DATABASE_SSL=true`: habilita TLS hacia PostgreSQL.
- `JWT_SECRET`: secreto largo almacenado fuera del repositorio.
- `CORS_ORIGIN`: dominio del frontend; admite varios orígenes separados por coma.
- `VITE_API_URL`: URL pública de la API al compilar el frontend.

No se deben subir los archivos `.env` o `.env.local` al repositorio.
