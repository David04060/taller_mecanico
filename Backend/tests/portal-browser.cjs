/* Entorno de navegador desechable: tablas temporales y cuentas sintéticas.
   Ejecutar desde Backend con PORT y CORS_ORIGIN de prueba; Ctrl+C revierte todo. */
const {pool}=require('../dist/config/database');
const {app}=require('../dist/app');
const bcrypt=require('bcryptjs');
const tablas=['roles','usuarios','clientes','vehiculos','estados_orden','ordenes_trabajo','historial_estados','servicios','categorias_repuesto','repuestos','detalle_servicios','detalle_repuestos','movimientos_inventario','metodos_pago','pagos','reembolsos'];
async function main(){
 const conexion=await pool.connect();let server;let cerrando=false;
 const cerrar=async()=>{
  if(cerrando)return;cerrando=true;
  if(server)await new Promise(resolve=>server.close(resolve));
  await conexion.query('ROLLBACK');conexion.release();await pool.end();
 };
 process.once('SIGINT',()=>cerrar().then(()=>process.exit(0)));
 process.once('SIGTERM',()=>cerrar().then(()=>process.exit(0)));
 try {
  await conexion.query('BEGIN');
  for(const tabla of tablas)await conexion.query(`CREATE TEMP TABLE ${tabla} (LIKE public.${tabla} INCLUDING DEFAULTS INCLUDING IDENTITY INCLUDING CONSTRAINTS INCLUDING INDEXES) ON COMMIT DROP`);
  await conexion.query('SET LOCAL search_path=pg_temp,public');
  for(const tabla of tablas){const result=await conexion.query('SELECT relpersistence FROM pg_class WHERE oid=to_regclass($1)',[tabla]);if(result.rows[0].relpersistence!=='t')throw new Error('La tabla no es temporal');}
  await conexion.query("INSERT INTO roles(id,nombre) OVERRIDING SYSTEM VALUE VALUES (1,'administrador'),(2,'recepcionista'),(3,'mecanico'),(4,'cliente')");
  const hash=await bcrypt.hash('PerfilPrueba-123',4);
  await conexion.query("INSERT INTO usuarios(id,rol_id,nombres,apellidos,email,password_hash,telefono) OVERRIDING SYSTEM VALUE VALUES (1,4,'Ana','Prueba','cliente@example.test',$1,'900000001'),(2,1,'Admin','Prueba','admin@example.test',$1,'900000002'),(3,3,'Mecánico','Prueba','mecanico@example.test',$1,'900000003'),(4,2,'Recepción','Prueba','recepcion@example.test',$1,'900000004')",[hash]);
  await conexion.query("INSERT INTO clientes(id,usuario_id,dni,nombres,apellidos,email,telefono,direccion) OVERRIDING SYSTEM VALUE VALUES (1,1,'90000001','Ana','Prueba','cliente@example.test','900000001','Dirección sintética 123')");
  await conexion.query("INSERT INTO vehiculos(id,cliente_id,placa,marca,modelo,anio,color) OVERRIDING SYSTEM VALUE VALUES (1,1,'TEST-01','Prueba','Sedán',2024,'Azul')");
  await conexion.query("INSERT INTO estados_orden(id,nombre,orden) OVERRIDING SYSTEM VALUE VALUES (1,'Recibido',1)");
  await conexion.query("INSERT INTO metodos_pago(id,nombre) OVERRIDING SYSTEM VALUE VALUES (1,'Efectivo de prueba')");
  await conexion.query("INSERT INTO ordenes_trabajo(id,codigo,vehiculo_id,recepcionista_id,estado_id,problema_reportado,total) OVERRIDING SYSTEM VALUE VALUES (1,'TEST-01',1,4,1,'Revisión sintética',100)");
  await conexion.query("INSERT INTO pagos(orden_id,metodo_pago_id,registrado_por,monto) VALUES (1,1,4,20)");
  let secuencia=0;const transacciones=[];
  const query=async(sql,args)=>{
   if(sql==='BEGIN'){const nombre=`perfil_${++secuencia}`;transacciones.push(nombre);return conexion.query(`SAVEPOINT ${nombre}`);}
   if(sql==='COMMIT')return conexion.query(`RELEASE SAVEPOINT ${transacciones.pop()}`);
   if(sql==='ROLLBACK'){const nombre=transacciones.pop();await conexion.query(`ROLLBACK TO SAVEPOINT ${nombre}`);return conexion.query(`RELEASE SAVEPOINT ${nombre}`);}
   return conexion.query(sql,args);
  };
  pool.query=query;pool.connect=async()=>({query,release(){}});
  server=app.listen(Number(process.env.PORT)||3005,'127.0.0.1',()=>console.log('Entorno temporal de perfil listo en 127.0.0.1:'+server.address().port));
 } catch(error){await cerrar();throw error;}
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
