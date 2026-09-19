// Configuracion de Playwright. Las URLs y credenciales vienen del .env de la raiz.
// Para cambiar de ambiente se cambia BASE_URL, no el codigo.

import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

export default defineConfig({
  // Dos suites con propositos distintos, por eso van separadas.
  // Se corren con `npm run humo` y `npm run interfaz`.
  projects: [
    { name: 'humo', testDir: './tests/smoke' },
    { name: 'interfaz', testDir: './tests/ui' }
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:8080',

    // Solo se guarda evidencia si algo falla: las trazas registran la
    // contrasena que se escribe en el formulario.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off'
  }
});
