import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDispatchInput } from '../src/domain/validation.js';

test('accepts a representative valid dispatch request', () => {
  const errors = validateDispatchInput({
    requestReference: 'REQ-001',
    centerId: 'CENTER-001',
    partCode: 'PART-BRAKE-01',
    quantity: 2,
    priority: 'CRITICAL'
  });
  assert.deepEqual(errors, []);
});
