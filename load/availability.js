// Prueba de carga de la consulta de disponibilidad.
// Es una ruta de solo lectura, asi que se puede repetir sin ensuciar el entorno.
// Se mide en peticiones por segundo porque asi esta escrito el requisito.

import http from 'k6/http';
import { check } from 'k6';

const API_URL = __ENV.API_URL || 'http://localhost:3000';
const CENTRO = __ENV.LOAD_CENTER || 'CENTER-LOAD';
const REPUESTO = __ENV.LOAD_PART || 'PART-LOAD-01';

export const options = {
  scenarios: {
    // Carga esperada en operacion normal.
    sostenida: {
      executor: 'constant-arrival-rate',
      rate: 30,
      timeUnit: '1s',
      duration: '60s',
      preAllocatedVUs: 20,
      maxVUs: 50
    },
    // Pico breve, encadenado justo despues de la carga sostenida.
    pico: {
      executor: 'constant-arrival-rate',
      rate: 60,
      timeUnit: '1s',
      duration: '20s',
      preAllocatedVUs: 20,
      maxVUs: 50,
      startTime: '60s'
    }
  },

  // Criterios definidos antes de ejecutar. Si no se cumplen, k6 falla.
  thresholds: {
    http_req_failed: ['rate<0.01'], // menos del 1% de errores
    http_req_duration: ['p(95)<200'] // 95% de las respuestas bajo 200 ms
  }
};

export default function () {
  const respuesta = http.get(`${API_URL}/api/availability?centerId=${CENTRO}&partCode=${REPUESTO}`);

  check(respuesta, {
    'responde 200': (r) => r.status === 200,
    'devuelve la disponibilidad': (r) => r.json('available') !== undefined
  });
}
