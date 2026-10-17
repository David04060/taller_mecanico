/* Integración SQL con tablas TEMPORARY de sesión y rollback final.
   No escribe tablas permanentes ni usa registros reales como fixtures. */
const assert = require('node:assert/strict');
const {pool}=require('../dist/config/database');
const ordenes=require('../dist/controllers/ordenes_trabajo.controller');
const clientes=require('../dist/controllers/clientes.controller');
const vehiculos=require('../dist/controllers/vehiculos.controller');
const servicios=require('../dist/controllers/servicios.controller');
const repuestos=require('../dist/controllers/repuestos.controller');
const inventario=require('../dist/controllers/inventario.controller');
const pagos=require('../dist/controllers/pagos.controller');
const reembolsos=require('../dist/controllers/reembolsos.controller');
const categorias=require('../dist/controllers/categorias_repuesto.controller');
const auth=require('../dist/controllers/auth.controller');
const tablas=['roles','usuarios','clientes','vehiculos','estados_orden','ordenes_trabajo','historial_estados','servicios','categorias_repuesto','repuestos','detalle_servicios','detalle_repuestos','movimientos_inventario','metodos_pago','pagos','reembolsos'];
async function main(){
 const realQuery=pool.query,realConnect=pool.connect;
 const client=await pool.connect();let checks=0;
 try{
  await client.query('BEGIN');
  await client.query("SET LOCAL statement_timeout='8s'");
  for(const tabla of tablas) await client.query(`CREATE TEMP TABLE ${tabla} (LIKE public.${tabla} INCLUDING DEFAULTS INCLUDING IDENTITY INCLUDING CONSTRAINTS INCLUDING INDEXES) ON COMMIT DROP`);
  await client.query('SET LOCAL search_path=pg_temp,public');
  for(const tabla of tablas){const r=await client.query('SELECT c.relpersistence FROM pg_class c WHERE c.oid=to_regclass($1)',[tabla]);assert.equal(r.rows[0].relpersistence,'t');}
  await client.query("INSERT INTO roles(id,nombre) OVERRIDING SYSTEM VALUE VALUES (1,'administrador'),(2,'recepcionista'),(3,'mecanico'),(4,'cliente')");
  await client.query("INSERT INTO usuarios(id,rol_id,nombres,apellidos,email,password_hash,telefono) OVERRIDING SYSTEM VALUE VALUES (1,1,'Prueba','Admin','admin@example.test','fixture','999000001'),(2,3,'Prueba','Mecanico','mecanico@example.test','fixture','999000002')");
  for(const [id,nombre] of [[1,'Recibido'],[2,'En diagnóstico'],[3,'Esperando aprobación'],[4,'En reparación'],[5,'Listo para entrega'],[6,'Entregado'],[7,'Cancelado']])await client.query('INSERT INTO estados_orden(id,nombre,orden) OVERRIDING SYSTEM VALUE VALUES($1,$2,$1)',[id,nombre]);
  await client.query("INSERT INTO metodos_pago(id,nombre) OVERRIDING SYSTEM VALUE VALUES(1,'Prueba efectivo')");
  await client.query('CREATE TRIGGER prueba_pago BEFORE INSERT OR UPDATE ON pagos FOR EACH ROW EXECUTE FUNCTION public.validar_pago()');
  let savepoint=0;const stack=[];
  const query=async(sql,params)=>{
   if(sql==='BEGIN'){const name=`prueba_${++savepoint}`;stack.push(name);return client.query(`SAVEPOINT ${name}`);}
   if(sql==='COMMIT')return client.query(`RELEASE SAVEPOINT ${stack.pop()}`);
   if(sql==='ROLLBACK'){const name=stack.pop();await client.query(`ROLLBACK TO SAVEPOINT ${name}`);return client.query(`RELEASE SAVEPOINT ${name}`);}
   return client.query(sql,params);
  };
  pool.query=query;pool.connect=async()=>({query,release(){}});
  async function call(fn,body={},params={},expected=200,role='administrador'){
   const req={body,params,query:{},usuario:{id:role==='mecanico'?2:1,rol:role,email:'fixture@example.test'}};
   const res={statusCode:200,status(n){this.statusCode=n;return this;},json(body){this.body=body;return this;}};
   await fn(req,res);assert.equal(res.statusCode,expected,`${fn.name}: ${JSON.stringify(res.body)}`);checks++;return res.body;
  }
  const c=await call(clientes.crearCliente,{dni:'99900001',nombres:'Cliente',apellidos:'Prueba',telefono:'999000003'}, {},201);
  const v=await call(vehiculos.crearVehiculo,{cliente_id:c.cliente.id,placa:'TEST-01',marca:'Prueba',modelo:'Sedán'}, {},201);
  const cat=await call(categorias.crearCategoria,{nombre:'Filtros de prueba'}, {},201);
  await call(categorias.actualizarCategoria,{nombre:'Filtros sintéticos'}, {id:cat.categoria.id});
  const serv=await call(servicios.crearServicio,{nombre:'Servicio sintético',precio_base:50}, {},201);
  const rep=await call(repuestos.crearRepuesto,{categoria_id:cat.categoria.id,codigo:'TEST-FILTRO',nombre:'Filtro sintético',stock_minimo:1,precio_compra:10,precio_venta:20}, {},201);
  await call(inventario.registrarEntradaInventario,{repuesto_id:rep.repuesto.id,cantidad:10,motivo:'Fixture temporal'}, {},201);
  const o=await call(ordenes.crearOrden,{codigo:'TEST-ORDEN',vehiculo_id:v.vehiculo.id,mecanico_id:2,problema_reportado:'Revisión de prueba'}, {},201);const id=o.orden.id;
  await call(ordenes.agregarServicioOrden,{servicio_id:serv.servicio.id,cantidad:2},{id},201,'mecanico');
  const asignadas=await call(ordenes.obtenerMisOrdenes,{}, {},200,'mecanico');
  assert.ok(asignadas.ordenes[0].mecanico_nombres);checks++;
  const detalle=await call(ordenes.agregarRepuestoOrden,{repuesto_id:rep.repuesto.id,cantidad:2},{id},201,'mecanico');
  let row=(await client.query('SELECT total FROM ordenes_trabajo WHERE id=$1',[id])).rows[0];assert.equal(Number(row.total),140);checks++;
  await call(ordenes.registrarDiagnostico,{diagnostico:'Diagnóstico sintético'},{id},200,'mecanico');
  await call(ordenes.cambiarEstadoOrden,{estado_id:2},{id},200,'mecanico');
  await call(ordenes.cambiarEstadoOrden,{estado_id:3},{id},200,'mecanico');
  await call(ordenes.cambiarEstadoOrden,{estado_id:4},{id},400);
  await call(pagos.registrarPago,{metodo_pago_id:1,monto:70},{id},201);
  await call(ordenes.cambiarEstadoOrden,{estado_id:4},{id});
  await call(ordenes.cambiarEstadoOrden,{estado_id:5},{id},200,'mecanico');
  await call(ordenes.cambiarEstadoOrden,{estado_id:6},{id},400);
  await call(pagos.registrarPago,{metodo_pago_id:1,monto:70},{id},201);
  await call(pagos.registrarPago,{metodo_pago_id:1,monto:1},{id},400);
  await call(ordenes.eliminarRepuestoOrden,{}, {id,detalleId:detalle.detalle.id},409);
  await call(ordenes.cambiarEstadoOrden,{estado_id:6},{id});
  await call(ordenes.actualizarOrden,{problema_reportado:'No debe cambiar'}, {id},400);
  const o2=await call(ordenes.crearOrden,{codigo:'TEST-CANCELAR',vehiculo_id:v.vehiculo.id,mecanico_id:2,problema_reportado:'Prueba cancelación'}, {},201);
  await call(ordenes.agregarRepuestoOrden,{repuesto_id:rep.repuesto.id,cantidad:1},{id:o2.orden.id},201);
  await call(pagos.registrarPago,{metodo_pago_id:1,monto:20},{id:o2.orden.id},201);
  const devolucion={monto:8,metodo_pago_id:1,motivo:'Se retienen 12 por diagnóstico',clave_solicitud:'12345678-1234-1234-1234-123456789abc'};
  await call(reembolsos.registrarReembolso,devolucion,{id:o2.orden.id},400);
  await call(ordenes.cambiarEstadoOrden,{estado_id:7},{id:o2.orden.id});
  await call(reembolsos.registrarReembolso,devolucion,{id:o2.orden.id},201);
  await call(reembolsos.registrarReembolso,devolucion,{id:o2.orden.id},200);
  await call(reembolsos.registrarReembolso,{...devolucion,monto:9},{id:o2.orden.id},409);
  await call(reembolsos.registrarReembolso,{...devolucion,monto:13,clave_solicitud:'22345678-1234-1234-1234-123456789abc'},{id:o2.orden.id},400);
  const liquidacion=await call(reembolsos.obtenerReembolsosOrden,{}, {id:o2.orden.id});
  assert.equal(liquidacion.importe_retenido,12);assert.equal(liquidacion.reembolsos.length,1);checks++;
  await call(reembolsos.obtenerReembolsosOrden,{}, {id:o2.orden.id},404,'cliente');
  const stock=(await client.query('SELECT stock_actual FROM repuestos WHERE id=$1',[rep.repuesto.id])).rows[0];assert.equal(stock.stock_actual,8);checks++;
  await call(clientes.obtenerClientes);await call(vehiculos.obtenerVehiculos);await call(servicios.obtenerServicios);await call(repuestos.obtenerRepuestos);await call(inventario.obtenerInventario);await call(pagos.obtenerPagos);
  // Perfiles sintéticos y acceso propio: todas las escrituras siguen dentro de tablas TEMPORARY.
  const bcrypt=require('bcryptjs');
  const hash=await bcrypt.hash('Clave-sintetica-123',4);
  await client.query("INSERT INTO usuarios(id,rol_id,nombres,apellidos,email,password_hash,telefono) OVERRIDING SYSTEM VALUE VALUES (41,4,'Perfil','Prueba','perfil@example.test',$1,'900000041'),(42,4,'Otro','Cliente','otro@example.test',$1,'900000042')",[hash]);
  await client.query("INSERT INTO clientes(id,usuario_id,dni,nombres,apellidos,email,telefono,direccion) OVERRIDING SYSTEM VALUE VALUES (41,41,'90000041','Perfil','Prueba','perfil@example.test','900000041','Dirección anterior'),(42,42,'90000042','Otro','Cliente','otro@example.test','900000042','Otra dirección')");
  await client.query("INSERT INTO vehiculos(id,cliente_id,placa,marca,modelo) OVERRIDING SYSTEM VALUE VALUES (41,41,'PER-041','Prueba','Propio'),(42,42,'PER-042','Prueba','Ajeno')");
  await client.query("INSERT INTO ordenes_trabajo(id,codigo,vehiculo_id,recepcionista_id,estado_id,problema_reportado,total) OVERRIDING SYSTEM VALUE VALUES (41,'PER-041',41,1,1,'Revisión propia',100),(42,'PER-042',42,1,1,'Revisión ajena',100)");
  await client.query("INSERT INTO pagos(orden_id,metodo_pago_id,monto,registrado_por) VALUES (41,1,20,1),(42,1,30,1)");
  async function perfil(fn,body={},expected=200){
    const req={body,params:{},query:{},usuario:{id:41,rol:'cliente',email:'perfil@example.test'}};
    const res={statusCode:200,status(n){this.statusCode=n;return this;},json(data){this.body=data;return this;}};
    await fn(req,res);assert.equal(res.statusCode,expected,JSON.stringify(res.body));checks++;return res.body;
  }
  const cambios={nombres:'  Ana  ',apellidos:'Actualizada',email:'NUEVO@example.test',telefono:'900123456',direccion:'Dirección actualizada'};
  const actualizado=await perfil(auth.actualizarPerfil,cambios);
  assert.equal(actualizado.usuario.email,'nuevo@example.test');assert.equal(actualizado.usuario.nombres,'Ana');assert.equal(actualizado.usuario.dni,'90000041');checks++;
  const cuenta=(await client.query('SELECT * FROM usuarios WHERE id=41')).rows[0];
  const ficha=(await client.query('SELECT * FROM clientes WHERE usuario_id=41')).rows[0];
  for(const campo of ['nombres','apellidos','email','telefono'])assert.equal(cuenta[campo],ficha[campo]);
  assert.equal(ficha.direccion,'Dirección actualizada');assert.equal(cuenta.rol_id,4);assert.equal(cuenta.password_hash,hash);checks++;
  const sesion=await perfil(auth.obtenerSesion);assert.equal(sesion.usuario.direccion,'Dirección actualizada');assert.equal('password_hash' in sesion.usuario,false);checks++;
  const otroAntes=(await client.query('SELECT * FROM usuarios WHERE id=42')).rows[0];
  await perfil(auth.actualizarPerfil,{...cambios,email:'OTRO@example.test'},409);
  await perfil(auth.actualizarPerfil,{...cambios,usuario_id:42},400);
  assert.deepEqual((await client.query('SELECT * FROM usuarios WHERE id=42')).rows[0],otroAntes);checks++;
  assert.equal((await client.query('SELECT email FROM usuarios WHERE id=41')).rows[0].email,'nuevo@example.test');checks++;
  await perfil(auth.actualizarPerfil,{nombres:'Ana',apellidos:'Actualizada',email:'nuevo@example.test'});
  const conservado=await perfil(auth.obtenerSesion);assert.equal(conservado.usuario.telefono,'900123456');assert.equal(conservado.usuario.direccion,'Dirección actualizada');checks++;
  await perfil(auth.actualizarPerfil,{...cambios,telefono:null,direccion:''});
  const sinContacto=await perfil(auth.obtenerSesion);assert.equal(sinContacto.usuario.telefono,null);assert.equal(sinContacto.usuario.direccion,null);checks++;
  const loginRes={statusCode:200,status(n){this.statusCode=n;return this;},json(data){this.body=data;return this;}};
  await auth.login({body:{email:'nuevo@example.test',password:'Clave-sintetica-123'}},loginRes);
  assert.equal(loginRes.statusCode,200);assert.equal(loginRes.body.usuario.id,41);checks++;
  const vehiculosPropios=await perfil(clientes.obtenerMisVehiculos);assert.deepEqual(vehiculosPropios.vehiculos.map(v=>v.placa),['PER-041']);checks++;
  const ordenesPropias=await perfil(clientes.obtenerMisOrdenesCliente);assert.deepEqual(ordenesPropias.ordenes.map(o=>o.codigo),['PER-041']);checks++;
  const pagosPropios=await perfil(clientes.obtenerMisPagos);assert.deepEqual(pagosPropios.pagos.map(p=>p.orden_codigo),['PER-041']);checks++;
  const detalleAjeno={statusCode:200,status(n){this.statusCode=n;return this;},json(data){this.body=data;return this;}};
  await clientes.obtenerDetalleMiOrden({params:{id:'42'},usuario:{id:41,rol:'cliente'}},detalleAjeno);assert.equal(detalleAjeno.statusCode,404);checks++;
  console.log(`Integración SQL correcta: ${checks} verificaciones sobre tablas temporales; sin escrituras permanentes.`);
 }finally{pool.query=realQuery;pool.connect=realConnect;await client.query('ROLLBACK');client.release();await pool.end();}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
