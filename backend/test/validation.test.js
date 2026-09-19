// Pruebas de la validacion de entrada: que acepte lo valido y rechace lo invalido.

import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDispatchInput } from '../src/domain/validation.js';

// Solicitud valida de base. Cada prueba cambia solo el campo que esta probando.
function solicitud(cambios = {}) {
  return {
    requestReference: 'REQ-001',
    centerId: 'CENTER-001',
    partCode: 'PART-BRAKE-01',
    quantity: 5,
    priority: 'STANDARD',
    ...cambios
  };
}

test('acepta una solicitud valida', () => {
  assert.deepEqual(validateDispatchInput(solicitud()), []);
});

test('acepta los limites del rango de cantidad', () => {
  assert.deepEqual(validateDispatchInput(solicitud({ quantity: 1 })), []);
  assert.deepEqual(validateDispatchInput(solicitud({ quantity: 50 })), []);
});

test('rechaza cantidades fuera del rango permitido', () => {
  const error = 'quantity must be an integer between 1 and 50';

  assert.ok(validateDispatchInput(solicitud({ quantity: 0 })).includes(error));
  assert.ok(validateDispatchInput(solicitud({ quantity: 51 })).includes(error));
  assert.ok(validateDispatchInput(solicitud({ quantity: 2.5 })).includes(error));
});

test('rechaza una prioridad que no es STANDARD ni CRITICAL', () => {
  const errores = validateDispatchInput(solicitud({ priority: 'URGENTE' }));

  assert.ok(errores.includes('priority must be STANDARD or CRITICAL'));
});

test('rechaza una solicitud sin referencia', () => {
  const errores = validateDispatchInput(solicitud({ requestReference: '' }));

  assert.ok(errores.includes('requestReference is required'));
});
