// Pruebas de la validacion de cantidad del formulario.

import { describe, it, expect } from 'vitest';
import { validQuantity } from '../src/utils/validators.js';

describe('validQuantity', () => {
  it('acepta las cantidades dentro del rango permitido', () => {
    expect(validQuantity(1)).toBe(true);
    expect(validQuantity(25)).toBe(true);
    expect(validQuantity(50)).toBe(true);
  });

  it('rechaza las cantidades fuera del rango', () => {
    expect(validQuantity(0)).toBe(false);
    expect(validQuantity(51)).toBe(false);
    expect(validQuantity(2.5)).toBe(false);
  });

  it('rechaza los valores que no representan un entero', () => {
    expect(validQuantity('')).toBe(false);
    expect(validQuantity('abc')).toBe(false);
    expect(validQuantity(null)).toBe(false);
  });

  it('acepta un numero escrito como texto', () => {
    // El campo del formulario entrega siempre texto, no numero.
    expect(validQuantity('25')).toBe(true);
  });
});
