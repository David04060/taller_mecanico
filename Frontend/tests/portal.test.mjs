import {test} from 'node:test';
import assert from 'node:assert/strict';

async function cargar(){
  const modulo=await import('../src/pages/cliente/portalCliente.ts').catch(()=>null);
  assert.equal(typeof modulo?.cargarPortalCliente,'function','debe existir la carga independiente del portal');
  return modulo.cargarPortalCliente;
}
for(const [apartado,ruta,campo] of [
  ['vehiculos','/clientes/mis-vehiculos','vehiculos'],
  ['ordenes','/clientes/mis-ordenes','ordenes'],
  ['pagos','/clientes/mis-pagos','pagos'],
])test(`${apartado} carga exclusivamente los datos propios de ese apartado`,async()=>{
  const cargarPortal=await cargar();const rutas=[];
  const resultado=await cargarPortal(apartado,async ruta=>{rutas.push(ruta);return {data:{[campo]:[{id:14}]}};});
  assert.deepEqual(rutas,[ruta]);assert.deepEqual(resultado[campo],[{id:14}]);
  for(const otro of ['vehiculos','ordenes','pagos'].filter(c=>c!==campo))assert.deepEqual(resultado[otro],[]);
});
test('vista general resume solo endpoints del cliente autenticado',async()=>{
 const cargarPortal=await cargar(),rutas=[];
 await cargarPortal('resumen',async ruta=>{rutas.push(ruta);return {data:{}};});
 assert.deepEqual(rutas.sort(),['/clientes/mis-ordenes','/clientes/mis-pagos','/clientes/mis-vehiculos']);
});
test('un error de carga se propaga para mostrar un error en lugar de un falso listado vacío',async()=>{
 const cargarPortal=await cargar();await assert.rejects(cargarPortal('ordenes',async()=>{throw new Error('Servidor no disponible');}),/Servidor no disponible/);
});
