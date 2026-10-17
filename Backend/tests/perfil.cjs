const {test,afterEach}=require('node:test');
const assert=require('node:assert/strict');
process.env.DATABASE_URL='postgresql://test:test@127.0.0.1:1/test';
process.env.JWT_SECRET='test-only-secret-never-production';
process.env.DATABASE_SSL='false';
const {pool}=require('../dist/config/database');
const auth=require('../dist/controllers/auth.controller');
const originalQuery=pool.query,originalConnect=pool.connect;
afterEach(()=>{pool.query=originalQuery;pool.connect=originalConnect;});
const datos={nombres:'  Ana  ',apellidos:'Prueba',email:'ANA@example.test',telefono:'+51 900 000 001'};
function response(){return {code:200,body:null,status(n){this.code=n;return this;},json(v){this.body=v;return this;}};}
function req(body,rol='cliente'){return {body,params:{id:'999'},usuario:{id:41,rol,email:'antes@example.test'}};}
async function actualizar(body,res,rol){assert.equal(typeof auth.actualizarPerfil,'function','debe existir actualización de perfil propio');await auth.actualizarPerfil(req(body,rol),res);}
function database({rol='cliente',duplicate=false,failClient=false,missing=false}={}){
 const state={committed:false,rolledBack:false,released:false,user:null,client:null};
 const query=async(sql,args)=>{
  if(sql==='BEGIN')return {rows:[]};
  if(sql==='COMMIT'){state.committed=true;return {rows:[]};}
  if(sql==='ROLLBACK'){state.rolledBack=true;state.user=null;state.client=null;return {rows:[]};}
  if(/SELECT.*FROM usuarios.*LOWER/s.test(sql))return {rows:duplicate?[{id:99}]:[]};
  if(/UPDATE usuarios/.test(sql)){state.user=args;return {rows:[{id:41,nombres:args[0],apellidos:args[1],email:args[2],telefono:args[3]}]};}
  if(/UPDATE clientes/.test(sql)){if(failClient)throw new Error('synthetic sync failure');state.client=args;return {rows:[{dni:'99900001',direccion:'Dirección sintética'}]};}
  if(/FROM clientes/.test(sql))return {rows:missing?[]:[{id:12,dni:'99900001',direccion:'Dirección sintética'}]};
  if(/FROM usuarios/.test(sql))return {rows:[{id:41,rol,activo:true}]};
  throw new Error(`SQL no previsto: ${sql}`);
 };
 pool.query=query;pool.connect=async()=>({query,release(){state.released=true;}});return state;
}
test('actualiza solo el usuario autenticado y sincroniza su ficha de cliente',async()=>{
 const db=database(),res=response();await actualizar({...datos,direccion:'Dirección sintética'},res);
 assert.equal(res.code,200);assert.equal(res.body.usuario.id,41);assert.equal(res.body.usuario.nombres,'Ana');assert.equal(res.body.usuario.email,'ana@example.test');
 assert.equal(db.user.at(-1),41);assert.equal(db.client.at(-1),41);assert.equal(db.committed,true);assert.equal(db.released,true);
 assert.equal(res.body.usuario.rol,'cliente');assert.equal(res.body.usuario.direccion,'Dirección sintética');assert.equal('password_hash' in res.body.usuario,false);
});
for(const campo of ['rol','rol_id','activo','id','usuario_id','dni','password_hash'])test(`rechaza modificar ${campo} desde el perfil`,async()=>{
 let touched=false;pool.connect=async()=>{touched=true;throw new Error('no debe consultar');};const res=response();await actualizar({...datos,[campo]:campo==='activo'?false:2},res);assert.equal(res.code,400);assert.equal(touched,false);
});
for(const invalido of [{email:'no-es-correo'},{nombres:'   '},{telefono:'x'.repeat(21)},{apellidos:'x'.repeat(81)},{direccion:'x'.repeat(201)},{email:null}])test(`rechaza datos de perfil inválidos: ${Object.keys(invalido)[0]}`,async()=>{
 let touched=false;pool.connect=async()=>{touched=true;throw new Error('no debe consultar');};const res=response();await actualizar({...datos,...invalido},res);assert.equal(res.code,400);assert.equal(touched,false);
});
test('correo duplicado devuelve conflicto sin cambios',async()=>{const db=database({duplicate:true}),res=response();await actualizar(datos,res);assert.equal(res.code,409);assert.equal(db.user,null);assert.equal(db.rolledBack,true);});
test('revierte los datos de usuario si falla la sincronización del cliente',async()=>{const db=database({failClient:true}),res=response();await actualizar(datos,res);assert.equal(res.code,500);assert.equal(db.committed,false);assert.equal(db.rolledBack,true);assert.equal(db.user,null);assert.equal(db.released,true);});
for(const rol of ['administrador','recepcionista','mecanico'])test(`permite al ${rol} editar su contacto sin alterar clientes`,async()=>{const db=database({rol}),res=response();await actualizar(datos,res,rol);assert.equal(res.code,200);assert.equal(db.client,null);assert.equal(res.body.usuario.rol,rol);});
test('no acepta dirección en una cuenta de personal',async()=>{const db=database({rol:'mecanico'}),res=response();await actualizar({...datos,direccion:'No corresponde'},res,'mecanico');assert.equal(res.code,400);assert.equal(db.committed,false);});
test('cliente sin ficha activa no deja cambios parciales en usuario',async()=>{const db=database({missing:true}),res=response();await actualizar(datos,res);assert.equal(res.code,404);assert.equal(db.user,null);assert.equal(db.committed,false);});

test('PATCH /auth/me requiere autenticación y no acepta elegir otra cuenta',async()=>{
 const {app}=require('../dist/app'),jwt=require('jsonwebtoken');
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
 try {
  const url=`http://127.0.0.1:${server.address().port}/api/auth/me`;
  const sinSesion=await fetch(url,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(datos)});
  assert.equal(sinSesion.status,401);
  const db=database();
  const token=jwt.sign({id:41},process.env.JWT_SECRET);
  const ajeno=await fetch(url,{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({...datos,usuario_id:999})});
  assert.equal(ajeno.status,400);assert.equal(db.user,null);
 } finally {await new Promise(resolve=>server.close(resolve));}
});
