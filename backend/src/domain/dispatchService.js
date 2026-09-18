import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { validateDispatchInput } from './validation.js';

const here = dirname(fileURLToPath(import.meta.url));
const seedPath = resolve(here, '../../seed/availability.json');

export function createDispatchService() {
  const availability = new Map();
  const requests = new Map();
  const seed = JSON.parse(readFileSync(seedPath, 'utf8'));
  for (const item of seed) availability.set(key(item.centerId, item.partCode), { ...item });

  return {
    create(input) {
      const errors = validateDispatchInput(input);
      if (errors.length) return { kind: 'validation_error', errors };

      const stock = availability.get(key(input.centerId, input.partCode));
      const current = stock?.available ?? 0;
      const approved = current >= input.quantity;

      if (approved && stock) stock.available -= input.quantity;

      const result = {
        requestReference: input.requestReference,
        centerId: input.centerId,
        partCode: input.partCode,
        quantity: input.quantity,
        priority: input.priority,
        notes: input.notes ?? null,
        status: approved ? 'AUTHORIZED' : 'REJECTED',
        reason: approved ? null : 'INSUFFICIENT_AVAILABILITY',
        processedAt: new Date().toISOString()
      };

      // The base application may contain behavior that does not fully satisfy every business rule.
      // The candidate is expected to validate behavior and report reproducible findings.
      requests.set(input.requestReference, result);
      return { kind: 'created', result };
    },

    get(requestReference) {
      return requests.get(requestReference) ?? null;
    },

    recent(limit = 10) {
      return [...requests.values()].slice(-limit).reverse();
    },

    availability(centerId, partCode) {
      const item = availability.get(key(centerId, partCode));
      return item ? { ...item } : { centerId, partCode, available: 0 };
    }
  };
}

function key(centerId, partCode) {
  return `${centerId}::${partCode}`;
}
