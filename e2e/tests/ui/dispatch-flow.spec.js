// Automatizacion de interfaz: el flujo critico visto por un usuario.
//
// POR QUE ESTE FLUJO: registrar una solicitud es la operacion que mueve
// inventario. Es donde un fallo tiene costo real para el negocio.
//
// DATOS: la referencia se genera en cada ejecucion, asi la prueba se repite
// sin depender de lo que dejo la corrida anterior ni necesitar limpieza.
//
// SINCRONIZACION: sin esperas fijas. Las aserciones de Playwright reintentan
// solas hasta que la condicion se cumple o se agota el tiempo.

import { test, expect } from '@playwright/test';

const USUARIO = process.env.TEST_USERNAME;
const CLAVE = process.env.TEST_PASSWORD;

test.beforeAll(() => {
  if (!USUARIO || !CLAVE) {
    throw new Error('Faltan TEST_USERNAME y TEST_PASSWORD. Ejecuta ./scripts/init-local-env.sh en la raiz.');
  }
});

test('registrar una solicitud y verla en el listado de recientes', async ({ page }) => {
  const referencia = `REQ-UI-${Date.now()}`;

  await page.goto('/');

  await page.getByLabel('Usuario').fill(USUARIO);
  await page.getByLabel('Contraseña').fill(CLAVE);
  await page.getByRole('button', { name: 'Ingresar' }).click();

  // Confirma que la sesion se abrio antes de seguir con el formulario.
  await expect(page.getByRole('heading', { name: 'Nueva solicitud' })).toBeVisible();

  await page.getByLabel('Referencia').fill(referencia);
  await page.getByLabel('Cantidad').fill('2');
  await page.getByRole('button', { name: 'Registrar' }).click();

  const resultado = page.getByTestId('dispatch-result');
  await expect(resultado).toContainText(referencia);
  await expect(resultado).toContainText('AUTHORIZED');

  // El resultado tambien debe quedar consultable en el listado.
  await expect(page.locator('li').filter({ hasText: referencia })).toBeVisible();
});
