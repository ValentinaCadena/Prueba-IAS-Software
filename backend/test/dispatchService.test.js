// Pruebas de la logica de despacho: autorizar, rechazar y descontar inventario.

import test from 'node:test';
import assert from 'node:assert/strict';
import { createDispatchService } from '../src/domain/dispatchService.js';

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

// Cada servicio nuevo recarga los datos semilla, asi las pruebas no se pisan.
function disponibles(service) {
  return service.availability('CENTER-001', 'PART-BRAKE-01').available;
}

test('autoriza la solicitud y descuenta la cantidad pedida', () => {
  const service = createDispatchService();
  const antes = disponibles(service);

  const { result } = service.create(solicitud({ quantity: 5 }));

  assert.equal(result.status, 'AUTHORIZED');
  assert.equal(disponibles(service), antes - 5);
});

test('el resultado se puede consultar despues por su referencia', () => {
  const service = createDispatchService();

  const { result } = service.create(solicitud());

  assert.deepEqual(service.get('REQ-001'), result);
});

test('rechaza la solicitud cuando no hay disponibilidad y no descuenta', () => {
  const service = createDispatchService();
  const antes = disponibles(service);

  const { result } = service.create(solicitud({ centerId: 'CENTER-QUE-NO-EXISTE' }));

  assert.equal(result.status, 'REJECTED');
  assert.equal(result.reason, 'INSUFFICIENT_AVAILABILITY');
  assert.equal(disponibles(service), antes);
});

test('no registra la solicitud si la entrada es invalida', () => {
  const service = createDispatchService();

  const resultado = service.create(solicitud({ quantity: 0 }));

  assert.equal(resultado.kind, 'validation_error');
  assert.equal(service.get('REQ-001'), null);
});

// Defecto F-01 (ver docs/FINDINGS.md): la app vuelve a despachar una referencia
// repetida. La prueba dice lo que deberia pasar y se omite hasta que se corrija.
test(
  'no reprocesa una referencia ya despachada',
  { skip: 'Defecto F-01: no hay guarda de idempotencia (ver docs/FINDINGS.md)' },
  () => {
    const service = createDispatchService();
    service.create(solicitud({ requestReference: 'REQ-DUP', quantity: 10 }));
    const trasLaPrimera = disponibles(service);

    service.create(solicitud({ requestReference: 'REQ-DUP', quantity: 20 }));

    assert.equal(disponibles(service), trasLaPrimera, 'no debe descontar de nuevo');
    assert.equal(service.get('REQ-DUP').quantity, 10, 'debe conservar el resultado original');
  }
);
