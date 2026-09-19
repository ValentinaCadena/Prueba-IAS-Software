// Configuracion de la automatizacion de interfaz.
//
// Las URLs y las credenciales llegan por variables de entorno desde el archivo
// .env de la raiz, que no se versiona. Cambiar de ambiente es cambiar BASE_URL,
// no tocar el codigo de las pruebas.

import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

export default defineConfig({
  // Dos suites separadas: tienen propositos distintos y se ejecutan aparte.
  // `npm run humo` responde "el entorno esta disponible?".
  // `npm run interfaz` recorre el flujo de un usuario.
  projects: [
    { name: 'humo', testDir: './tests/smoke' },
    { name: 'interfaz', testDir: './tests/ui' }
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:8080',

    // Solo se guarda evidencia cuando una prueba falla. Evita dejar capturas
    // del formulario de acceso con la credencial escrita en pantalla.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off'
  }
});
