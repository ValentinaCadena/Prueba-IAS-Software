// Flujo critico en el navegador: entrar, registrar una solicitud y verla listada.
// Se eligio este flujo porque es el que mueve inventario.
// La referencia se genera en cada corrida para poder repetir sin limpiar nada.

import { test, expect } from '@playwright/test';
import { USUARIO, CLAVE, verificarCredenciales } from '../../config.js';

test.beforeAll(verificarCredenciales);

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
