// Pruebas de integracion del backend.
//
// Integran ruta HTTP + autenticacion + validacion + dominio, todos reales.
// No son unitarias porque cruzan varias capas a la vez.
// No son humo porque la aplicacion se crea en memoria con createApp(), sin
// puertos ni Docker: no dependen del entorno desplegado.
//
// Las credenciales se inyectan en la aplicacion, asi que ningun secreto real
// aparece en el codigo de pruebas.

import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';

const USUARIO = 'usuario-de-prueba';
const CLAVE = 'clave-solo-para-pruebas';

function crearApp() {
  return createApp({ username: USUARIO, password: CLAVE });
}

async function iniciarSesion(app) {
  const respuesta = await request(app)
    .post('/api/session')
    .send({ username: USUARIO, password: CLAVE })
    .expect(200);

  return respuesta.body.accessToken;
}

function solicitud(cambios = {}) {
  return {
    requestReference: 'REQ-INT-001',
    centerId: 'CENTER-001',
    partCode: 'PART-BRAKE-01',
    quantity: 5,
    priority: 'STANDARD',
    ...cambios
  };
}

test('una solicitud registrada se consulta despues con los mismos datos', async () => {
  const app = crearApp();
  const token = await iniciarSesion(app);

  const creacion = await request(app)
    .post('/api/dispatch-requests')
    .set('authorization', `Bearer ${token}`)
    .send(solicitud())
    .expect(201);

  const consulta = await request(app)
    .get('/api/dispatch-requests/REQ-INT-001')
    .set('authorization', `Bearer ${token}`)
    .expect(200);

  assert.deepEqual(consulta.body, creacion.body);
  assert.equal(consulta.body.status, 'AUTHORIZED');
});

test('el descuento se refleja en la consulta de disponibilidad', async () => {
  const app = crearApp();
  const token = await iniciarSesion(app);
  const consultarDisponibles = async () => {
    const r = await request(app)
      .get('/api/availability')
      .query({ centerId: 'CENTER-001', partCode: 'PART-BRAKE-01' })
      .expect(200);
    return r.body.available;
  };

  const antes = await consultarDisponibles();
  await request(app)
    .post('/api/dispatch-requests')
    .set('authorization', `Bearer ${token}`)
    .send(solicitud({ quantity: 4 }))
    .expect(201);

  assert.equal(await consultarDisponibles(), antes - 4);
});

test('registrar una solicitud sin credencial devuelve 401', async () => {
  const app = crearApp();

  const respuesta = await request(app)
    .post('/api/dispatch-requests')
    .send(solicitud())
    .expect(401);

  assert.equal(respuesta.body.error, 'unauthorized');
});

test('una solicitud invalida devuelve 400 sin exponer detalles internos', async () => {
  const app = crearApp();
  const token = await iniciarSesion(app);

  const respuesta = await request(app)
    .post('/api/dispatch-requests')
    .set('authorization', `Bearer ${token}`)
    .send(solicitud({ quantity: 0 }))
    .expect(400);

  assert.equal(respuesta.body.error, 'invalid_request');
  // La respuesta solo trae el error y su detalle de negocio: ninguna traza,
  // ruta de archivo ni nombre interno del servicio.
  assert.deepEqual(Object.keys(respuesta.body), ['error', 'details']);
});

test('GET /health responde que el servicio esta arriba', async () => {
  const respuesta = await request(crearApp()).get('/health').expect(200);

  assert.deepEqual(respuesta.body, { status: 'UP' });
});
