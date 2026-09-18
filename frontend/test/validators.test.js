import { describe, expect, it } from 'vitest';
import { validQuantity } from '../src/utils/validators.js';

describe('validQuantity', () => {
  it('accepts a representative quantity', () => {
    expect(validQuantity(5)).toBe(true);
  });
});
