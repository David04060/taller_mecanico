const {test,afterEach}=require('node:test');
const assert=require('node:assert/strict');
process.env.DATABASE_URL='postgresql://test:test@127.0.0.1:1/test';
process.env.JWT_SECRET='test-only-secret-never-production';
process.env.DATABASE_SSL='false';
const {pool}=require('../dist/config/database');
const orders=require('../dist/controllers/ordenes_trabajo.controller');
const users=require('../dist/controllers/usuarios.controller');
const {verificarToken}=require('../dist/middleware/auth.middleware');
const jwt=require('jsonwebtoken');
const originalQuery=pool.query, originalConnect=pool.connect;
afterEach(()=>{pool.query=originalQuery;pool.connect=originalConnect;});
function response(){return {code:200,body:null,status(n){this.code=n;return this;},json(v){this.body=v;return this;}};}
function request(body={},rol='administrador'){return {params:{id:'10'},body,usuario:{id:1,email:'test@example.test',rol}};}
for(const [name,rol,order,status] of [
 ['rechaza modificar una orden asignada a otro mecánico','mecanico',{id:10,mecanico_id:2,estado_id:1},403],
 ['rechaza modificar una orden entregada','administrador',{id:10,mecanico_id:2,estado_id:6},400],
 ['rechaza modificar una orden cancelada','administrador',{id:10,mecanico_id:2,estado_id:7},400],
]) test(name,async()=>{let modified=false;pool.query=async sql=>{if(/UPDATE/.test(sql))modified=true;return {rows:[order]};};const res=response();await orders.actualizarOrden(request({problema_reportado:'Revisión'},rol),res);assert.equal(res.code,status);assert.equal(modified,false);});
test('un fallo de base de datos no invalida la sesión',async()=>{pool.query=async()=>{throw new Error('synthetic database unavailable');};const token=jwt.sign({id:1},process.env.JWT_SECRET);const res=response();await verificarToken({headers:{authorization:`Bearer ${token}`}},res,()=>assert.fail('no debe autorizar'));assert.equal(res.code,503);});
test('no permite desactivar la propia cuenta administrativa',async()=>{let modified=false;pool.query=async sql=>{if(/UPDATE/.test(sql))modified=true;return {rows:[{id:1,activo:true,rol:'administrador'}]};};const req=request({activo:false});req.params.id='1';const res=response();await users.cambiarEstadoUsuario(req,res);assert.equal(res.code,400);assert.equal(modified,false);});
test('crear usuario rechaza contraseña corta antes de consultar la base',async()=>{let queries=0;pool.query=async()=>{queries++;return {rows:[]};};const res=response();await users.crearUsuario(request({nombres:'Prueba',apellidos:'Usuario',email:'test@example.test',telefono:'123456789',password:'123',rol:'mecanico'}),res);assert.equal(res.code,400);assert.equal(queries,0);});
test('agregar servicio actualiza el total antes de confirmar',async()=>{let total=0,committed=false;const query=async(sql,args)=>{if(sql==='COMMIT'){committed=true;assert.equal(total,100);}if(/recalcular_total_orden/.test(sql))total=100;if(/FROM servicios/.test(sql))return {rows:[{id:3,nombre:'Revisión',precio_base:'50.00',activo:true}]};if(/INSERT INTO detalle_servicios/.test(sql))return {rows:[{id:1,orden_id:10,servicio_id:3,cantidad:2,precio_unitario:'50.00'}]};return {rows:[{id:10,codigo:'TEST',mecanico_id:1,estado_id:1}]};};pool.query=query;pool.connect=async()=>({query,release(){}});const res=response();await orders.agregarServicioOrden(request({servicio_id:3,cantidad:2}),res);assert.equal(res.code,201);assert.equal(total,100);assert.equal(committed,true);});
const pagos=require('../dist/controllers/pagos.controller');
for(const [name,body,estado] of [
 ['rechaza pagos con fracciones menores a un céntimo',{metodo_pago_id:1,monto:0.001},1],
 ['rechaza pagos a órdenes canceladas',{metodo_pago_id:1,monto:10},7]
])test(name,async()=>{let inserted=false;const query=async sql=>{if(/INSERT INTO pagos/.test(sql)){inserted=true;return {rows:[{id:1}]};}if(/FROM ordenes_trabajo/.test(sql))return {rows:[{id:10,total:'100.00',estado_id:estado}]};if(/FROM metodos_pago/.test(sql))return {rows:[{id:1,activo:true}]};return {rows:[{total_pagado:'0.00'}]};};pool.query=query;pool.connect=async()=>({query,release(){}});const res=response();await pagos.registrarPago(request(body),res);assert.equal(res.code,400);assert.equal(inserted,false);});
test('impide convertir un administrador en mecánico',async()=>{let modified=false;pool.query=async sql=>{if(/UPDATE usuarios/.test(sql))modified=true;if(/WHERE email/.test(sql))return {rows:[]};return {rows:[{id:10,rol:'administrador',rol_id:1}]};};const res=response();await users.actualizarUsuario(request({nombres:'Test',apellidos:'Admin',email:'test@example.test',telefono:'999999999',rol:'mecanico'}),res);assert.equal(res.code,400);assert.equal(modified,false);});
test('agregar repuesto actualiza total junto al stock',async()=>{let total=0,stock=5;const query=async(sql,args)=>{if(/FROM ordenes_trabajo/.test(sql))return {rows:[{id:10,codigo:'TEST',mecanico_id:1,estado_id:1}]};if(/FROM repuestos/.test(sql))return {rows:[{id:3,nombre:'Filtro',precio_venta:'20.00',stock_actual:stock,activo:true}]};if(/FROM detalle_repuestos/.test(sql))return {rows:[]};if(/UPDATE repuestos/.test(sql))stock-=Number(args[0]);if(/recalcular_total_orden/.test(sql))total=40;return {rows:[{id:1}]};};pool.query=query;pool.connect=async()=>({query,release(){}});const res=response();await orders.agregarRepuestoOrden(request({repuesto_id:3,cantidad:2}),res);assert.equal(res.code,201);assert.equal(stock,3);assert.equal(total,40);});
const {app}=require('../dist/app');
for (const [path,body] of [['/vehiculos',{placa:'ABCDEFGHIJK'}],['/servicios',{nombre:'x'.repeat(101)}],['/ordenes_trabajo',{fecha_estimada_entrega:'2026-02-30'}]]) {
 test(`validación respeta esquema y calendario: ${path} ${Object.keys(body)[0]}`,()=>{
  const {validarEntrada}=require('../dist/middleware/validacion.middleware');const res=response();let next=false;
  validarEntrada({path,method:'POST',body},res,()=>{next=true;});assert.equal(res.code,400);assert.equal(next,false);
 });
}
test('un cliente no se vincula a una cuenta de personal',async()=>{
 const {crearCliente}=require('../dist/controllers/clientes.controller');let inserted=false;
 pool.query=async sql=>{if(/INSERT INTO clientes/.test(sql)){inserted=true;return {rows:[{id:1}]};}if(/FROM usuarios/.test(sql))return {rows:[{id:2,rol:'administrador',activo:true}]};return {rows:[]};};
 const res=response();await crearCliente(request({usuario_id:2,dni:'12345678',nombres:'Prueba',apellidos:'Prueba'}),res);assert.equal(res.code,400);assert.equal(inserted,false);
});
test('rechazar repuesto de una orden cerrada revierte la transacción',async()=>{
 let rollback=false;
 const query=async sql=>{if(sql==='ROLLBACK')rollback=true;if(/FROM ordenes_trabajo/.test(sql))return {rows:[{id:10,estado_id:7,mecanico_id:1}]};if(/FROM repuestos/.test(sql))return {rows:[{id:3,activo:true,stock_actual:10,precio_venta:20}]};return {rows:[]};};
 pool.query=query;pool.connect=async()=>({query,release(){}});
 const res=response();await orders.agregarRepuestoOrden(request({repuesto_id:3,cantidad:1}),res);assert.equal(res.code,400);assert.equal(rollback,true);
});
test('reembolso rechaza importes superiores al cobro disponible',async()=>{
 const {registrarReembolso}=require('../dist/controllers/reembolsos.controller');
 let inserted=false;
 const query=async sql=>{
  if(/FROM ordenes_trabajo/.test(sql))return {rows:[{id:10,estado_id:7}]};
  if(/clave_solicitud/.test(sql))return {rows:[]};
  if(/SUM\(monto\).*FROM pagos/s.test(sql))return {rows:[{total:'100.00'}]};
  if(/SUM\(monto\).*FROM reembolsos/s.test(sql))return {rows:[{total:'40.00'}]};
  if(/INSERT/.test(sql))inserted=true;
  return {rows:[]};
 };
 pool.connect=async()=>({query,release(){}});
 const res=response();await registrarReembolso(request({monto:61,metodo_pago_id:1,motivo:'Trabajo realizado',clave_solicitud:'12345678-1234-1234-1234-123456789abc'}),res);
 assert.equal(res.code,400);assert.equal(inserted,false);
});
async function httpCheck(path,body,raw=false){const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));try{const result=await fetch(`http://127.0.0.1:${server.address().port}${path}`,{method:'POST',headers:{'Content-Type':'application/json'},body:raw?body:JSON.stringify(body)});return {status:result.status,body:await result.json()};}finally{await new Promise(resolve=>server.close(resolve));}}
test('JSON inválido devuelve 400 en lugar de fallo interno',async()=>{const res=await httpCheck('/api/auth/login','{"email":',true);assert.equal(res.status,400);});
test('login rechaza tipos incorrectos sin consultar SQL',async()=>{let queries=0;pool.query=async()=>{queries++;return {rows:[]};};const res=await httpCheck('/api/auth/login',{email:{foo:1},password:['12345678']});assert.equal(res.status,400);assert.equal(queries,0);});
test('crear orden revierte si no puede registrar el historial',async()=>{let persisted=false;let pending=false;const query=async sql=>{if(sql==='BEGIN')return {rows:[]};if(sql==='ROLLBACK'){pending=false;persisted=false;return {rows:[]};}if(sql==='COMMIT'){persisted=pending;return {rows:[]};}if(/FROM ordenes_trabajo/.test(sql))return {rows:[]};if(/FROM vehiculos/.test(sql))return {rows:[{id:2}]};if(/INSERT INTO ordenes_trabajo/.test(sql)){pending=true;persisted=true;return {rows:[{id:10}]};}if(/INSERT INTO historial_estados/.test(sql))throw new Error('synthetic history failure');return {rows:[]};};pool.query=query;pool.connect=async()=>({query,release(){}});const res=response();await orders.crearOrden(request({codigo:'TEST',vehiculo_id:2,problema_reportado:'Revisión'}),res);assert.equal(res.code,500);assert.equal(persisted,false);});
test('recalcular no reduce total por debajo de pagos recibidos',async()=>{const query=async sql=>{if(/FROM pagos/.test(sql))return {rows:[{total_pagado:'100.00'}]};if(/FROM detalle_servicios/.test(sql))return {rows:[{total:'50.00'}]};if(/FROM detalle_repuestos/.test(sql))return {rows:[{total:'0.00'}]};return {rows:[{id:10,codigo:'TEST',mecanico_id:1,estado_id:1,total:'50.00'}]};};pool.query=query;pool.connect=async()=>({query,release(){}});const res=response();await orders.actualizarTotalOrden(request(),res);assert.equal(res.code,409);});
