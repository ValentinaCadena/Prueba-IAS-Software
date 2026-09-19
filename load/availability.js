// Prueba de carga sobre la consulta de disponibilidad.
//
// POR QUE ESTA RUTA: es de solo lectura, no modifica inventario, asi que se
// puede repetir sin ensuciar el estado del entorno. Se dirige al par
// CENTER-LOAD / PART-LOAD-01, sembrado con 100000 unidades justamente para esto.
//
// POR QUE constant-arrival-rate: el requisito del negocio esta expresado en
// solicitudes por segundo. Este ejecutor mantiene una tasa de llegadas fija sin
// importar cuanto tarde el servicio (modelo abierto). Un modelo de usuarios
// concurrentes fijos mediria otra cosa: cuantas peticiones alcanza a hacer el
// sistema, no si sostiene la tasa pedida.

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

  // Criterios de aceptacion. Si no se cumplen, k6 termina con error.
  thresholds: {
    http_req_failed: ['rate<0.01'], // menos del 1% de errores tecnicos
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
