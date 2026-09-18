const priorities = new Set(['STANDARD', 'CRITICAL']);

export function validateDispatchInput(input) {
  const errors = [];
  if (!input || typeof input !== 'object') return ['body is required'];
  if (!nonEmptyString(input.requestReference)) errors.push('requestReference is required');
  if (!nonEmptyString(input.centerId)) errors.push('centerId is required');
  if (!nonEmptyString(input.partCode)) errors.push('partCode is required');
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 50) {
    errors.push('quantity must be an integer between 1 and 50');
  }
  if (!priorities.has(input.priority)) errors.push('priority must be STANDARD or CRITICAL');
  if (input.notes !== undefined && input.notes !== null && typeof input.notes !== 'string') {
    errors.push('notes must be a string');
  }
  return errors;
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}
