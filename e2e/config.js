// Configuracion compartida por las suites de interfaz y de humo.
// Todos los valores llegan por variables de entorno: ninguno esta en el codigo.

export const API_URL = process.env.API_URL || 'http://localhost:3000';
export const USUARIO = process.env.TEST_USERNAME;
export const CLAVE = process.env.TEST_PASSWORD;

export function verificarCredenciales() {
  if (!USUARIO || !CLAVE) {
    throw new Error('Faltan TEST_USERNAME y TEST_PASSWORD. Ejecuta ./scripts/init-local-env.sh en la raiz.');
  }
}
