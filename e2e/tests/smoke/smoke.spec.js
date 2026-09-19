// Suite de humo: responde una sola pregunta, "el entorno esta disponible
// para empezar a validar?".
//
// Se diferencia de la suite de interfaz en el proposito: aqui no se recorre el
// flujo de un usuario ni se verifican reglas de negocio. Solo se comprueba que
// el servicio responde, que la web carga y que la operacion critica funciona
// de punta a punta. Si algo de esto falla, no tiene sentido ejecutar el resto.
//
// La operacion critica se ejecuta por API, no por navegador, para que la suite
// termine en segundos.

import { test, expect } from '@playwright/test';
import { API_URL, USUARIO, CLAVE, verificarCredenciales } from '../../config.js';

test.beforeAll(verificarCredenciales);

test('la API responde que el servicio esta arriba', async ({ request }) => {
  const respuesta = await request.get(`${API_URL}/health`);

  expect(respuesta.ok()).toBeTruthy();
  expect(await respuesta.json()).toEqual({ status: 'UP' });
});

test('la aplicacion web carga y muestra el formulario de acceso', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Acceso' })).toBeVisible();
});

test('la operacion critica funciona: registrar y consultar una solicitud', async ({ request }) => {
  const referencia = `REQ-HUMO-${Date.now()}`;

  const sesion = await request.post(`${API_URL}/api/session`, {
    data: { username: USUARIO, password: CLAVE }
  });
  expect(sesion.ok(), 'no fue posible iniciar sesion').toBeTruthy();
  const { accessToken } = await sesion.json();
  const credencial = { authorization: `Bearer ${accessToken}` };

  const registro = await request.post(`${API_URL}/api/dispatch-requests`, {
    headers: credencial,
    data: {
      requestReference: referencia,
      centerId: 'CENTER-001',
      partCode: 'PART-BRAKE-01',
      quantity: 1,
      priority: 'STANDARD'
    }
  });
  expect(registro.status(), 'la solicitud no se registro').toBe(201);

  const consulta = await request.get(`${API_URL}/api/dispatch-requests/${referencia}`, {
    headers: credencial
  });
  expect(consulta.ok(), 'la solicitud registrada no se pudo consultar').toBeTruthy();
  expect((await consulta.json()).requestReference).toBe(referencia);
});
