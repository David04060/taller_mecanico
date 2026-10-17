import { test } from 'node:test';
import assert from 'node:assert/strict';
import { comprobarSesion } from '../src/context/comprobarSesion.ts';

test('un fallo temporal conserva la sesión para reintentar', async () => {
  const resultado = await comprobarSesion('/api', 'token-prueba', async () => new Response('', {status:503}));
  assert.equal(resultado.estado, 'temporal');
});
test('un fallo de red permite reintentar', async () => {
  assert.equal((await comprobarSesion('/api', 'token', async () => {throw new Error('offline');})).estado, 'temporal');
});
test('una sesión vencida se distingue de un fallo temporal', async () => {
  assert.equal((await comprobarSesion('/api', 'token', async () => new Response('', {status:401}))).estado, 'invalida');
});
test('la identidad procede del servidor', async () => {
  const usuario = {id:1, rol:'mecanico'};
  const resultado = await comprobarSesion('/api', 'token', async () => Response.json({usuario}));
  assert.equal(resultado.estado, 'valida');
  assert.deepEqual(resultado.usuario, usuario);
});
